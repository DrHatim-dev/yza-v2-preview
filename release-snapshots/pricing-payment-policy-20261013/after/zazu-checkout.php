<?php
/* YZA — Zazu card payment: create a hosted checkout session.
   POST {order, text, _hp}  (same order JSON the checkout sends to order.php)
     -> creates a Zazu checkout session for the order total (MAD), stores the
        full order as "pending" keyed by the session id, returns {ok, url, id}.
        The JS then redirects the customer to the hosted payment page.
   GET  ?session=cs_...
     -> reconciliation for the success page: returns {ok, status, number} by
        asking the Zazu API. Only sessions this shop created are queryable.
   Fulfillment happens in zazu-webhook.php (checkout_session.completed) — the
   webhook is the source of truth; this GET is instant feedback for the shopper. */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, private, max-age=0');
header('Pragma: no-cache');

require_once __DIR__ . '/yza-throttle.php';
require_once __DIR__ . '/order-receipt-lib.php';
require_once __DIR__ . '/catalog-order-lib.php';

$CFG = is_file(__DIR__ . '/.private/zazu.php') ? @include __DIR__ . '/.private/zazu.php' : null;

$PENDING = __DIR__ . '/.private/zazu-pending.php';
$GUARD = "<?php exit; /* YZA Zazu sessions — one JSON object per line */\n";

/* ---------------------------------------------------------------- helpers */
function zazu_pending_max_records() {
  $override = (int) getenv('YZA_ZAZU_PENDING_MAX_RECORDS');
  return $override > 0 ? min($override, 10000) : 10000;
}
function zazu_api($cfg, $method, $path, $payload = null, $idempotencyKey = '') {
  $ch = curl_init(rtrim($cfg['api_base'], '/') . $path);
  if (!$ch) { return array(0, null); }
  curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
  $headers = array(
    'Authorization: Bearer ' . $cfg['api_key'],
    'Content-Type: application/json',
    'Accept: application/json',
  );
  if ($idempotencyKey !== '') { $headers[] = 'Idempotency-Key: ' . $idempotencyKey; }
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_TIMEOUT, 12);
  curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 6);
  if ($payload !== null) { curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); }
  $body = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return array($code, is_string($body) ? json_decode($body, true) : null);
}

function zazu_pending_read($file) {
  if (!is_file($file)) { return array(); }
  $body = @file_get_contents($file);
  if (!is_string($body) || strlen($body) > 32 * 1024 * 1024 || strpos($body, '<?php exit;') !== 0) { return null; }
  $recs = array();
  foreach (preg_split('/\r?\n/', $body) as $l) {
    if ($l === '' || strpos($l, '<?php') === 0) { continue; }
    $r = json_decode($l, true);
    if (!is_array($r) || empty($r['session_id']) || !is_string($r['session_id'])
        || strlen($l) > 32768 || isset($recs[$r['session_id']]) || count($recs) >= zazu_pending_max_records()) { return null; }
    $recs[$r['session_id']] = $r;
  }
  return $recs;
}

function zazu_pending_ready($file) {
  $dir = dirname($file);
  if (!is_dir($dir) && !@mkdir($dir, 0755, true)) { return false; }
  if (!is_writable($dir)) { return false; }
  if (is_file($file) && !is_array(zazu_pending_read($file))) { return false; }
  $lock = @fopen($file . '.lock', 'c');
  if (!$lock) { return false; }
  fclose($lock);
  return true;
}

function zazu_session_lock_path($directory, $sessionId) {
  return $directory . DIRECTORY_SEPARATOR . '.zazu-session-' . hash('sha256', (string) $sessionId) . '.lock';
}

function zazu_session_lock($directory, $sessionId) {
  $lock = @fopen(zazu_session_lock_path($directory, $sessionId), 'c');
  if (!$lock || !@flock($lock, LOCK_EX)) {
    if ($lock) { @fclose($lock); }
    return false;
  }
  @touch(zazu_session_lock_path($directory, $sessionId));
  return $lock;
}

function zazu_session_unlock($lock) {
  if (is_resource($lock)) { @flock($lock, LOCK_UN); @fclose($lock); }
}

function zazu_gateway_terminal_cancel_status($status) {
  return in_array(strtolower(trim((string) $status)), array('cancelled', 'canceled', 'expired'), true);
}

function zazu_coupon_reservation_ttl($session) {
  $ttl = 2 * 3600;
  if (is_array($session)) {
    foreach (array('expires_at', 'expiresAt') as $key) {
      if (!isset($session[$key])) { continue; }
      $raw = $session[$key];
      $expires = is_numeric($raw) ? (int) $raw : strtotime((string) $raw);
      if ($expires > 20000000000) { $expires = (int) floor($expires / 1000); }
      if ($expires > time()) { $ttl = ($expires - time()) + 600; }
      break;
    }
  }
  return max(600, min(48 * 3600, (int) $ttl));
}

/* Inventory must outlive the payable gateway session and its webhook delivery.
   A session whose advertised expiry cannot fit inside our configured hold limit is
   rejected before its URL is returned instead of risking a paid, unfulfillable order. */
function zazu_inventory_reservation_ttl($session) {
  $ttl = zazu_coupon_reservation_ttl($session) + 3600;
  $maximum = (int) yza_inventory_limits()['maxHoldSeconds'];
  return $ttl <= $maximum ? $ttl : 0;
}

/* One dedicated lock spans read + merge + temp write + atomic replace + verification.
   Locking the data inode itself is insufficient because rename() swaps that inode. */
function zazu_pending_store($file, $guard, $record) {
  if (!is_array($record) || empty($record['session_id']) || !zazu_pending_ready($file)) { return false; }
  $lock = @fopen($file . '.lock', 'c');
  if (!$lock || !@flock($lock, LOCK_EX)) { if ($lock) fclose($lock); return false; }
  $tmp = null;
  $ok = false;
  do {
    $recs = zazu_pending_read($file);
    if (!is_array($recs)) { break; }
    $now = time();
    $paidCutoff = $now - 90 * 86400;
    $cancelledCutoff = $now - 30 * 86400;
    $staleWorkCutoff = $now - 2 * 3600;
    foreach ($recs as $key => $row) {
      $status = isset($row['status']) ? (string) $row['status'] : 'pending';
      $at = isset($row['at']) ? (int) $row['at'] : 0;
      $paidAt = isset($row['paid_at']) ? (int) $row['paid_at'] : $at;
      $cancelledAt = isset($row['couponReleasedAt']) ? (int) $row['couponReleasedAt'] : $at;
      if (($status === 'paid' && $paidAt > 0 && $paidAt < $paidCutoff)
          || (in_array($status, array('cancelled', 'canceled', 'expired'), true)
              && $cancelledAt > 0 && $cancelledAt < $cancelledCutoff)
          ) {
        unset($recs[$key]);
        continue;
      }
      // An unresolved session can still need gateway or fulfillment reconciliation.
      // Never discard it merely because time elapsed; only verified terminal rows expire.
      if (($status === 'fulfilling' || $status === 'retry')) {
        $fulfillment = isset($row['fulfillment']) && is_array($row['fulfillment']) ? $row['fulfillment'] : array();
        $attemptedAt = isset($fulfillment['attempted_at']) ? (int) $fulfillment['attempted_at'] : $at;
        if ($attemptedAt > 0 && $attemptedAt < $staleWorkCutoff) {
          $row['status'] = 'retry';
          $fulfillment['state'] = 'retry';
          $fulfillment['last_error'] = 'stale_fulfillment';
          unset($fulfillment['current_event_id']);
          $row['fulfillment'] = $fulfillment;
          $recs[$key] = $row;
        }
      }
    }
    /* A pre-gateway operation reservation is replaced by its real session record. */
    if (!empty($record['operation_id'])) {
      foreach ($recs as $key => $row) {
        if ($key !== $record['session_id'] && is_array($row) && !empty($row['operation_id'])
            && hash_equals((string) $record['operation_id'], (string) $row['operation_id'])) {
          unset($recs[$key]);
        }
      }
    }
    if (!isset($recs[$record['session_id']]) && count($recs) >= zazu_pending_max_records()) { break; }
    $recs[$record['session_id']] = $record;
    $body = $guard;
    foreach ($recs as $row) {
      $encoded = json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      if (!is_string($encoded) || strlen($encoded) > 32768) { $body = ''; break; }
      $body .= $encoded . "\n";
      if (strlen($body) > 32 * 1024 * 1024) { $body = ''; break; }
    }
    if ($body === '') { break; }
    $tmp = @tempnam(dirname($file), '.zazu-pending-');
    if (!$tmp) { break; }
    $fp = @fopen($tmp, 'wb');
    if (!$fp) { break; }
    $written = 0; $length = strlen($body);
    while ($written < $length) {
      $chunk = @fwrite($fp, substr($body, $written));
      if ($chunk === false || $chunk === 0) { break 2; }
      $written += $chunk;
    }
    $flushed = @fflush($fp);
    if ($flushed && function_exists('fsync')) { $flushed = @fsync($fp); }
    @fclose($fp); $fp = null;
    if (!$flushed || $written !== $length || @file_get_contents($tmp) !== $body) { break; }
    @chmod($tmp, 0600);
    if (!@rename($tmp, $file)) { break; }
    $tmp = null;
    if (@file_get_contents($file) !== $body) { break; }
    $verified = zazu_pending_read($file);
    if (!is_array($verified) || !isset($verified[$record['session_id']])) { break; }
    $ok = true;
    /* Bound orphan session-lock files after the 90-day paid idempotency window.
       Never unlink the active session's lock and never touch recently used locks. */
    foreach (glob(dirname($file) . DIRECTORY_SEPARATOR . '.zazu-session-*.lock') ?: array() as $sessionLock) {
      if (!is_file($sessionLock) || @filemtime($sessionLock) >= $paidCutoff) { continue; }
      $orphan = @fopen($sessionLock, 'c');
      if (!$orphan) { continue; }
      if (@flock($orphan, LOCK_EX | LOCK_NB)) {
        clearstatcache(true, $sessionLock);
        if (is_file($sessionLock) && @filemtime($sessionLock) < $paidCutoff) {
          /* On Unix this safely detaches an unused inode while it is locked. On Windows
             unlink may fail while open; retaining the orphan is safer than racing it. */
          @unlink($sessionLock);
        }
        @flock($orphan, LOCK_UN);
      }
      @fclose($orphan);
    }
  } while (false);
  if (isset($fp) && is_resource($fp)) { @fclose($fp); }
  if ($tmp && is_file($tmp)) { @unlink($tmp); }
  @flock($lock, LOCK_UN);
  @fclose($lock);
  return $ok;
}

/* Remove only the exact pre-gateway placeholder for one operation. This is used
   when session creation fails before a payable URL is returned; real session rows
   and rows belonging to another retry are never touched. */
function zazu_pending_remove_operation_placeholder($file, $guard, $operationId) {
  $operationId = trim((string) $operationId);
  if ($operationId === '' || !zazu_pending_ready($file)) { return false; }
  $lock = @fopen($file . '.lock', 'c');
  if (!$lock || !@flock($lock, LOCK_EX)) { if ($lock) @fclose($lock); return false; }
  $tmp = null; $ok = false;
  do {
    $recs = zazu_pending_read($file);
    if (!is_array($recs)) { break; }
    $found = false;
    foreach ($recs as $key => $row) {
      if (!is_array($row) || empty($row['creating']) || empty($row['operation_id'])
          || !hash_equals($operationId, (string) $row['operation_id'])) { continue; }
      unset($recs[$key]); $found = true;
    }
    if (!$found) { $ok = true; break; }
    $body = $guard;
    foreach ($recs as $row) {
      $encoded = json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      if (!is_string($encoded) || strlen($encoded) > 32768) { $body = ''; break; }
      $body .= $encoded . "\n";
    }
    if ($body === '' || strlen($body) > 32 * 1024 * 1024) { break; }
    $tmp = @tempnam(dirname($file), '.zazu-pending-');
    if (!$tmp) { break; }
    $fp = @fopen($tmp, 'wb'); if (!$fp) { break; }
    $written = 0; $length = strlen($body);
    while ($written < $length) {
      $chunk = @fwrite($fp, substr($body, $written));
      if ($chunk === false || $chunk === 0) { break 2; }
      $written += $chunk;
    }
    $flushed = @fflush($fp); if ($flushed && function_exists('fsync')) { $flushed = @fsync($fp); }
    @fclose($fp); $fp = null;
    if (!$flushed || $written !== $length || @file_get_contents($tmp) !== $body) { break; }
    @chmod($tmp, 0600); if (!@rename($tmp, $file)) { break; }
    $tmp = null; $ok = @file_get_contents($file) === $body;
  } while (false);
  if (is_resource(isset($fp) ? $fp : null)) { @fclose($fp); }
  if (is_string($tmp) && $tmp !== '' && is_file($tmp)) { @unlink($tmp); }
  @flock($lock, LOCK_UN); @fclose($lock);
  return $ok;
}

function zazu_abandon_inventory_hold($file, $guard, $operationId, $fingerprint, $reason) {
  $released = yza_inventory_card_release($operationId, $fingerprint, $reason);
  $removed = zazu_pending_remove_operation_placeholder($file, $guard, $operationId);
  if (empty($released['ok']) || !$removed) {
    error_log('YZA card checkout cleanup pending: ' . hash('sha256', (string) $operationId));
    return false;
  }
  return true;
}

function zazu_one_line($value, $max = 180) {
  $value = preg_replace('/[\r\n\x00]+/u', ' ', (string) $value);
  return substr(trim((string) $value), 0, $max);
}

function zazu_order_text($order) {
  $number = isset($order['number']) ? zazu_one_line($order['number'], 24) : '';
  $lines = array('Commande YZA' . ($number !== '' ? ' ' . $number : ''));
  $items = isset($order['items']) && is_array($order['items']) ? $order['items'] : array();
  foreach ($items as $item) {
    if (!is_array($item)) { continue; }
    $qty = isset($item['qty']) ? max(1, intval($item['qty'])) : 1;
    $name = isset($item['name']) ? zazu_one_line($item['name'], 120) : 'Article';
    $variant = isset($item['variant']) ? zazu_one_line($item['variant'], 120) : '';
    $priceDh = isset($item['priceDh']) ? intval($item['priceDh'])
      : intval(round(intval(isset($item['price']) ? $item['price'] : 0) / 100));
    $lines[] = $qty . ' x ' . $name . ($variant !== '' ? ' (' . $variant . ')' : '')
      . ' - ' . ($priceDh * $qty) . ' DH';
  }
  $discounts = isset($order['discounts']) && is_array($order['discounts']) ? $order['discounts'] : array();
  foreach ($discounts as $discount) {
    if (!is_array($discount) || empty($discount['amountDh'])) { continue; }
    $lines[] = (isset($discount['label']) ? zazu_one_line($discount['label'], 80) : 'Remise')
      . ' : -' . intval($discount['amountDh']) . ' DH';
  }
  // Delivery is never free since 2026-10-05: the line always states the fee or the quote.
  if (!empty($order['shippingQuoteOnly'])) { $lines[] = 'Livraison : a confirmer'; }
  else { $lines[] = 'Livraison : ' . intval(isset($order['shippingDh']) ? $order['shippingDh'] : 0) . ' DH'; }
  $lines[] = 'Total : ' . intval(isset($order['totalDh']) ? $order['totalDh'] : 0) . ' DH';
  return implode("\n", $lines);
}

function zazu_safe_order($order) {
  return array(
    'number' => isset($order['number']) ? $order['number'] : '',
    'items' => isset($order['items']) && is_array($order['items']) ? $order['items'] : array(),
    'subtotalDh' => isset($order['subtotalDh']) ? intval($order['subtotalDh']) : 0,
    'discounts' => isset($order['discounts']) && is_array($order['discounts']) ? $order['discounts'] : array(),
    'merchandiseDh' => isset($order['merchandiseDh']) ? intval($order['merchandiseDh']) : 0,
    'shippingDh' => isset($order['shippingDh']) ? intval($order['shippingDh']) : 0,
    'shippingFree' => !empty($order['shippingFree']),
    'shippingQuoteOnly' => !empty($order['shippingQuoteOnly']),
    'shippingRegion' => isset($order['shippingRegion']) ? $order['shippingRegion'] : '',
    'countryCode' => isset($order['countryCode']) ? $order['countryCode'] : '',
    'totalDh' => isset($order['totalDh']) ? intval($order['totalDh']) : 0,
    'method' => isset($order['method']) ? $order['method'] : 'card',
    'methodLabel' => isset($order['methodLabel']) ? $order['methodLabel'] : '',
    'shipping' => isset($order['shipping']) && is_array($order['shipping']) ? $order['shipping'] : array(),
    'lang' => isset($order['lang']) ? $order['lang'] : 'fr',
    'coupon' => isset($order['coupon']) ? $order['coupon'] : '',
    'catalogRevision' => isset($order['catalogRevision']) ? $order['catalogRevision'] : '',
  );
}

// Focused storage tests can load the pure helpers without credentials or HTTP side effects.
if (defined('YZA_ZAZU_HELPERS_ONLY') && YZA_ZAZU_HELPERS_ONLY) { return; }
if (!is_array($CFG) || empty($CFG['api_key']) || empty($CFG['account_id'])) {
  http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'not configured')); exit;
}

/* ------------------------------------------------- GET: status reconciliation */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (!yza_throttle('zazucheck', 30, 60)) { http_response_code(429); echo json_encode(array('ok' => false, 'error' => 'rate')); exit; }
  $sid = isset($_GET['session']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) $_GET['session']) : '';
  if ($sid === '') { http_response_code(400); echo json_encode(array('ok' => false)); exit; }
  $sessionLock = zazu_session_lock(dirname($PENDING), $sid);
  if (!$sessionLock) { http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'session_lock_failed')); exit; }
  $recs = zazu_pending_read($PENDING);
  if (!is_array($recs)) {
    zazu_session_unlock($sessionLock);
    http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'pending_storage_unavailable')); exit;
  }
  if (!isset($recs[$sid])) {
    zazu_session_unlock($sessionLock);
    http_response_code(404); echo json_encode(array('ok' => false, 'error' => 'unknown session')); exit;
  }
  list($code, $data) = zazu_api($CFG, 'GET', '/checkout_sessions/' . rawurlencode($sid));
  $status = ($code >= 200 && $code < 300 && is_array($data) && isset($data['status']))
    ? strtolower(trim((string) $data['status'])) : 'unknown';
  if (isset($_GET['release_coupon']) && $_GET['release_coupon'] === '1') {
    $row = $recs[$sid];
    if (!zazu_gateway_terminal_cancel_status($status)) {
      zazu_session_unlock($sessionLock);
      http_response_code($status === 'unknown' ? 503 : 409);
      echo json_encode(array('ok' => false, 'error' => $status === 'unknown'
        ? 'gateway_status_unavailable' : 'session_not_cancelled', 'status' => $status));
      exit;
    }
    $rowOrder = isset($row['order']) && is_array($row['order']) ? $row['order'] : array();
    $coupon = isset($rowOrder['coupon']) ? (string) $rowOrder['coupon'] : '';
    $operation = isset($rowOrder['couponOperation']) ? (string) $rowOrder['couponOperation'] : $sid;
    $rowEmail = isset($row['email']) ? strtolower(trim((string) $row['email'])) : '';
    if ($coupon !== '' && $rowEmail !== '') {
      require_once __DIR__ . '/yza-coupon-lib.php';
      if (!yza_coupon_release($coupon, $rowEmail, $operation)) {
        zazu_session_unlock($sessionLock);
        http_response_code(409); echo json_encode(array('ok' => false, 'error' => 'coupon_release_failed')); exit;
      }
    }
    if (!empty($row['inventory_operation']) && !empty($row['inventory_fingerprint'])) {
      $stockReleased = yza_inventory_card_release((string) $row['inventory_operation'],
        (string) $row['inventory_fingerprint'], 'gateway_' . $status);
      if (empty($stockReleased['ok'])) {
        zazu_session_unlock($sessionLock);
        http_response_code(isset($stockReleased['status']) ? (int) $stockReleased['status'] : 503);
        echo json_encode(array('ok' => false, 'error' => 'inventory_release_failed')); exit;
      }
    }
    $row['couponReleasedAt'] = time();
    $row['status'] = 'cancelled';
    if (!zazu_pending_store($PENDING, $GUARD, $row)) {
      zazu_session_unlock($sessionLock);
      http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'pending_update_failed')); exit;
    }
    zazu_session_unlock($sessionLock);
    echo json_encode(array('ok' => true, 'released' => true)); exit;
  }
  zazu_session_unlock($sessionLock);
  echo json_encode(array('ok' => true, 'status' => $status, 'number' => isset($recs[$sid]['number']) ? $recs[$sid]['number'] : ''));
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(array('ok' => false, 'error' => 'method')); exit; }

/* ------------------------------------------------------- POST: create session */
if (!yza_throttle('zazu', 5, 3600)) { http_response_code(429); echo json_encode(array('ok' => false, 'error' => 'rate')); exit; }

$raw = file_get_contents('php://input');
if (strlen($raw) > 20000) { http_response_code(413); echo json_encode(array('ok' => false)); exit; }
$data = json_decode($raw, true);
if (!is_array($data)) { http_response_code(400); echo json_encode(array('ok' => false)); exit; }
if (isset($data['_hp']) && trim((string) $data['_hp']) !== '') { echo json_encode(array('ok' => true)); exit; } // honeypot

$order = isset($data['order']) && is_array($data['order']) ? $data['order'] : array();
$submittedOrder = $order;
$text  = isset($data['text']) ? (string) $data['text'] : '';
$items = isset($order['items']) && is_array($order['items']) ? $order['items'] : array();
$number = isset($order['number']) ? substr(preg_replace('/[^A-Z0-9\-]/i', '', (string) $order['number']), 0, 24) : '';
$ship = isset($order['shipping']) && is_array($order['shipping']) ? $order['shipping'] : array();
$email = isset($ship['email']) ? strtolower(trim((string) $ship['email'])) : '';
$cardOperation = isset($order['operationId']) ? trim((string) $order['operationId']) : '';
if ($cardOperation === ''
    && $number !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)
    && yza_catalog_legacy_payload_candidate($items)) {
  /* One-deploy bridge for the cached checkout that predates operation ids. The derived
     identity is stable for this browser order; the pinned-revision/price/total checks
     below must all pass before a gateway session can be created. */
  $cardOperation = 'legacy_card_' . substr(hash('sha256', $number . '|' . $email . '|'
    . json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)), 0, 40);
}
if (!preg_match('/^[A-Za-z0-9_-]{20,100}$/D', $cardOperation)) {
  http_response_code(422); echo json_encode(array('ok' => false, 'error' => 'operation_invalid')); exit;
}
$order['operationId'] = $cardOperation;
$order['method'] = isset($order['method']) ? strtolower(trim((string) $order['method'])) : '';
require_once __DIR__ . '/payment-policy-lib.php';
$paymentError = yza_payment_policy_error($order['method'], $order['countryCode'] ?? '', 'card');
if ($paymentError !== '') {
  http_response_code(422); echo json_encode(array('ok' => false, 'error' => $paymentError)); exit;
}
$order['methodLabel'] = yza_payment_method_label('card', $order['lang'] ?? 'fr');
$cardOperationLock = zazu_session_lock(dirname($PENDING), 'operation-' . $cardOperation);
if (!$cardOperationLock) {
  http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'operation_lock_failed')); exit;
}
$existingPending = zazu_pending_read($PENDING);
if (!is_array($existingPending)) {
  zazu_session_unlock($cardOperationLock);
  http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'payment_session_storage_unavailable')); exit;
}
$submittedFingerprint = yza_order_fulfillment_fingerprint($order, $cardOperation);
foreach ($existingPending as $existingRow) {
  if (!is_array($existingRow) || !isset($existingRow['operation_id'])
      || !hash_equals($cardOperation, (string) $existingRow['operation_id'])) { continue; }
  if (!isset($existingRow['request_fingerprint'])
      || !hash_equals($submittedFingerprint, (string) $existingRow['request_fingerprint'])) {
    zazu_session_unlock($cardOperationLock);
    http_response_code(409); echo json_encode(array('ok' => false, 'error' => 'operation_conflict')); exit;
  }
   if (!empty($existingRow['checkout_url']) && !empty($existingRow['session_id'])) {
     if (!empty($existingRow['inventory_operation']) && !empty($existingRow['inventory_fingerprint'])) {
       $existingStock = yza_inventory_get_operation((string) $existingRow['inventory_operation']);
       if (empty($existingStock['ok']) || empty($existingStock['operation'])
           || !hash_equals((string) $existingRow['inventory_fingerprint'],
             isset($existingStock['operation']['fingerprint']) ? (string) $existingStock['operation']['fingerprint'] : '')
           || !in_array(isset($existingStock['operation']['state']) ? $existingStock['operation']['state'] : '', array('held', 'committed'), true)) {
         zazu_session_unlock($cardOperationLock);
         http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'inventory_reservation_unavailable')); exit;
       }
     }
    $safeReplay = zazu_safe_order(isset($existingRow['order']) ? $existingRow['order'] : array());
    zazu_session_unlock($cardOperationLock);
    echo json_encode(array('ok' => true, 'accepted' => true, 'replayed' => true,
      'url' => $existingRow['checkout_url'], 'id' => $existingRow['session_id'], 'order' => $safeReplay)); exit;
  }
}
$totalDh = isset($order['totalDh']) ? intval($order['totalDh']) : 0;
$lang = (isset($order['lang']) && in_array($order['lang'], array('fr', 'en', 'es', 'tr', 'ar'), true)) ? $order['lang'] : 'fr';

if (empty($items)) { zazu_session_unlock($cardOperationLock); http_response_code(422); echo json_encode(array('ok' => false, 'error' => 'invalid order')); exit; }

/* Browser totals and line prices are never an acceptance boundary. The shared validator
   chooses canonical catalogue prices before the gateway amount is constructed. */
$catalogValidation = yza_catalog_validate_order_items($items, null, 7200, true);
if (empty($catalogValidation['ok'])) {
  http_response_code(yza_catalog_validation_http_status($catalogValidation));
  echo json_encode(yza_catalog_validation_response($catalogValidation));
  zazu_session_unlock($cardOperationLock);
  exit;
}
$items = $catalogValidation['items'];
$order['items'] = $items;
$order['catalogRevision'] = $catalogValidation['currentRevision'];
$expectedDh = (int) $catalogValidation['itemsTotalDh'];

/* Ignore every browser-supplied name, price, discount and delivery flag. */
$autoPromotion = yza_catalog_automatic_discount($items);
$autoDiscountDh = (int) $autoPromotion['amountDh'];
$couponCode = isset($order['coupon']) ? strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', (string) $order['coupon'])) : '';
$cr = array('ok' => false, 'discountDh' => 0, 'code' => $couponCode);
$countryCode = isset($order['countryCode']) ? strtoupper(trim((string) $order['countryCode'])) : 'XX';
$shippingRegion = yza_catalog_country_region($countryCode);
if ($couponCode !== '') {
  require_once __DIR__ . '/yza-coupon-lib.php';
  $cr = yza_coupon_apply($couponCode, $email, $expectedDh, $autoDiscountDh,
    $shippingRegion, $items);
}
if ($couponCode !== '' && empty($cr['ok'])) {
  http_response_code(409);
  echo json_encode(array('ok' => false, 'accepted' => false, 'status' => 'coupon_changed',
    'error' => 'coupon_changed', 'reason' => isset($cr['reason']) ? $cr['reason'] : 'invalid',
    'currentRevision' => $catalogValidation['currentRevision'],
    'canonical' => array('subtotalDh' => $expectedDh,
      'merchandiseDh' => max(0, $expectedDh - $autoDiscountDh))));
  zazu_session_unlock($cardOperationLock);
  exit;
}
$couponDiscountDh = !empty($cr['ok']) ? (int) $cr['discountDh'] : 0;
$discountDh = min($expectedDh, $autoDiscountDh + $couponDiscountDh);
$canonicalDiscounts = $autoPromotion['discounts'];
if ($couponDiscountDh > 0) {
  $canonicalDiscounts[] = array('id' => 'coupon',
    'label' => isset($cr['code']) ? $cr['code'] : $couponCode, 'amountDh' => $couponDiscountDh);
}
$shippingQuote = yza_catalog_shipping_quote($items, max(0, $expectedDh - $discountDh),
  false, $countryCode);
$shippingDh = (int) $shippingQuote['shippingDh'];
$totalDh = max(0, $expectedDh - min($discountDh, $expectedDh)) + $shippingDh;
$order['number'] = $number;
$order['lang'] = $lang;
$order['coupon'] = !empty($cr['ok']) && isset($cr['code']) ? (string) $cr['code'] : '';
$order['couponAccepted'] = !empty($cr['ok']);
$order['subtotalDh'] = $expectedDh;
$order['discounts'] = $canonicalDiscounts;
$order['merchandiseDh'] = max(0, $expectedDh - min($discountDh, $expectedDh));
$order['countryCode'] = $shippingQuote['countryCode'];
$order['shippingRegion'] = $shippingQuote['region'];
$order['shippingDh'] = $shippingDh;
$order['shippingFree'] = (bool) $shippingQuote['shippingFree'];
$order['shippingQuoteOnly'] = (bool) $shippingQuote['shippingQuoteOnly'];
$order['totalDh'] = $totalDh;

/* The cached client redirects on {ok,url} and never reviews a canonical response. Its
   complete displayed total therefore has to equal the server-owned total exactly. */
if (!empty($catalogValidation['legacyCompatibility'])
    && !yza_catalog_legacy_order_matches($submittedOrder, array(
      'subtotalDh' => $expectedDh, 'merchandiseDh' => $order['merchandiseDh'],
      'shippingDh' => $shippingDh, 'totalDh' => $totalDh,
      'shippingFree' => $order['shippingFree'],
      'shippingQuoteOnly' => $order['shippingQuoteOnly'],
      'shippingRegion' => $order['shippingRegion'],
    ))) {
  http_response_code(409);
  echo json_encode(array('ok' => false, 'accepted' => false, 'status' => 'reprice',
    'error' => 'catalog_reprice', 'currentRevision' => $catalogValidation['currentRevision'],
    'legacyCompatibility' => true,
    'compatibilityExpiresAt' => isset($catalogValidation['compatibilityExpiresAt'])
      ? $catalogValidation['compatibilityExpiresAt'] : '',
    'issues' => array(array('code' => 'legacy_total_changed')),
    'canonical' => array('subtotalDh' => $expectedDh, 'merchandiseDh' => $order['merchandiseDh'],
      'shippingDh' => $shippingDh, 'totalDh' => $totalDh)));
  zazu_session_unlock($cardOperationLock);
  exit;
}
$text = zazu_order_text($order);

/* Hold exact tracked stock before a payable gateway URL can exist. The immutable
   operation/fingerprint makes retries safe; untracked products remain unlimited until
   Nawal enables tracking for them in the dashboard. */
$inventoryFingerprint = $submittedFingerprint;
$stockReservation = yza_inventory_card_reserve($cardOperation, $inventoryFingerprint, $items, 10 * 60);
if (empty($stockReservation['ok'])) {
  http_response_code(isset($stockReservation['status']) ? (int) $stockReservation['status'] : 503);
  echo json_encode(yza_catalog_inventory_failure_response($stockReservation,
    isset($catalogValidation['currentRevision']) ? $catalogValidation['currentRevision'] : ''));
  zazu_session_unlock($cardOperationLock);
  exit;
}

/* Redirects are fixed to the public shop origin; never trust the request Host. */
$base = 'https://yza-shop.com';

$payload = array(
  'account_id'  => $CFG['account_id'],
  'amount'      => number_format($totalDh, 2, '.', ''),   // MAD, "1500.00"
  'success_url' => $base . '/checkout?zazu=paid&session={CHECKOUT_SESSION_ID}',
  'cancel_url'  => $base . '/checkout?zazu=cancel&session={CHECKOUT_SESSION_ID}',
  'metadata'    => array('order_number' => $number, 'lang' => $lang),
  'description' => 'YZA commande ' . ($number !== '' ? $number : date('Ymd-His')),
);
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) { $payload['customer_email'] = $email; }

// Refuse before creating a gateway session when the fulfillment ledger is not writable.
if (!zazu_pending_ready($PENDING)) {
  zazu_abandon_inventory_hold($PENDING, $GUARD, $cardOperation, $inventoryFingerprint, 'pending_storage_unavailable');
  http_response_code(503);
  echo json_encode(array('ok' => false, 'error' => 'payment_session_storage_unavailable'));
  zazu_session_unlock($cardOperationLock);
  exit;
}
$operationReservation = array('session_id' => 'op_' . substr(hash('sha256', $cardOperation), 0, 48),
  'operation_id' => $cardOperation, 'request_fingerprint' => $submittedFingerprint,
  'inventory_operation' => $cardOperation, 'inventory_fingerprint' => $inventoryFingerprint,
  'status' => 'pending', 'at' => time(), 'creating' => true);
if (!zazu_pending_store($PENDING, $GUARD, $operationReservation)) {
  zazu_abandon_inventory_hold($PENDING, $GUARD, $cardOperation, $inventoryFingerprint, 'pending_capacity_unavailable');
  zazu_session_unlock($cardOperationLock);
  http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'payment_session_capacity_unavailable')); exit;
}

list($code, $resp) = zazu_api($CFG, 'POST', '/checkout_sessions', $payload, $cardOperation);
if ($code < 200 || $code >= 300 || !is_array($resp) || empty($resp['url']) || empty($resp['id'])) {
  zazu_abandon_inventory_hold($PENDING, $GUARD, $cardOperation, $inventoryFingerprint, 'gateway_create_failed');
  http_response_code(502);
  $msg = (is_array($resp) && isset($resp['error']['message'])) ? substr((string) $resp['error']['message'], 0, 140) : 'gateway error';
  echo json_encode(array('ok' => false, 'error' => $msg));
  zazu_session_unlock($cardOperationLock);
  exit;
}

$stockTtl = zazu_inventory_reservation_ttl($resp);
if ($stockTtl <= 0) {
  zazu_abandon_inventory_hold($PENDING, $GUARD, $cardOperation, $inventoryFingerprint, 'gateway_expiry_unsupported');
  http_response_code(503);
  echo json_encode(array('ok' => false, 'error' => 'payment_session_expiry_unsupported'));
  zazu_session_unlock($cardOperationLock);
  exit;
}
$stockExtended = yza_inventory_card_extend($cardOperation, $inventoryFingerprint, $stockTtl);
if (empty($stockExtended['ok'])) {
  zazu_abandon_inventory_hold($PENDING, $GUARD, $cardOperation, $inventoryFingerprint, 'hold_extension_failed');
  http_response_code(503);
  echo json_encode(array('ok' => false, 'error' => 'inventory_reservation_persistence_failed'));
  zazu_session_unlock($cardOperationLock);
  exit;
}

$couponReserved = false;
if (!empty($cr['ok'])) {
  /* Tie the discount to the opaque gateway session. A second session/order for
     the same email cannot reserve the same once-only slot. Prefer the gateway's
     own expiry plus ten minutes; otherwise use a bounded two-hour fallback. */
  $reservation = yza_coupon_reserve($cr['code'], $email, (string) $resp['id'],
    zazu_coupon_reservation_ttl($resp));
  if (empty($reservation['ok'])) {
    zazu_abandon_inventory_hold($PENDING, $GUARD, $cardOperation, $inventoryFingerprint, 'coupon_reservation_failed');
    http_response_code(409);
    echo json_encode(array('ok' => false, 'accepted' => false, 'status' => 'coupon_changed',
      'error' => 'coupon_changed', 'reason' => isset($reservation['reason']) ? $reservation['reason'] : 'storage',
      'currentRevision' => $catalogValidation['currentRevision'],
      'canonical' => array('subtotalDh' => $expectedDh,
        'merchandiseDh' => max(0, $expectedDh - $autoDiscountDh))));
    zazu_session_unlock($cardOperationLock);
    exit;
  }
  $couponReserved = true;
  $order['couponOperation'] = (string) $resp['id'];
}

/* Store the order as pending, keyed by session id — the webhook fulfills from here. */
$acceptedOrder = zazu_safe_order($order);
$pendingRecord = array(
  'session_id' => $resp['id'],
  'number'     => $number,
  'status'     => 'pending',
  'at'         => time(),
  'lang'       => $lang,
  'email'      => $email,
  'order'      => $order,
  'text'       => substr($text, 0, 6000),
  'operation_id' => $cardOperation,
  'request_fingerprint' => $submittedFingerprint,
  'inventory_operation' => $cardOperation,
  'inventory_fingerprint' => $inventoryFingerprint,
  'checkout_url' => (string) $resp['url'],
);
if (!zazu_pending_store($PENDING, $GUARD, $pendingRecord)) {
  if ($couponReserved) { yza_coupon_release($cr['code'], $email, (string) $resp['id']); }
  zazu_abandon_inventory_hold($PENDING, $GUARD, $cardOperation, $inventoryFingerprint, 'session_persistence_failed');
  /* The public API exposes no documented cancellation operation. Never return the hosted
     URL for an unrecorded session; it remains an unused gateway session that should expire.
     Log only its opaque id so an operator can reconcile it without leaking order data. */
  error_log('YZA Zazu session not persisted: ' . preg_replace('/[^A-Za-z0-9_-]/', '', (string) $resp['id']));
  http_response_code(503);
  echo json_encode(array('ok' => false, 'error' => 'payment_session_persistence_failed'));
  zazu_session_unlock($cardOperationLock);
  exit;
}

$response = array('ok' => true, 'accepted' => true, 'url' => $resp['url'], 'id' => $resp['id'],
  'catalogRevision' => $catalogValidation['currentRevision'], 'order' => $acceptedOrder);
if (!empty($catalogValidation['legacyCompatibility'])) {
  $response['legacyCompatibilityUsed'] = true;
  $response['compatibilityExpiresAt'] = isset($catalogValidation['compatibilityExpiresAt'])
    ? $catalogValidation['compatibilityExpiresAt'] : '';
}
echo json_encode($response);
zazu_session_unlock($cardOperationLock);
