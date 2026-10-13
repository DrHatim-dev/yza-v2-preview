<?php
/* YZA — best-effort order record. Receives the checkout JSON and
   (1) mails a copy to contact@yza-shop.com,
   (2) if WordPress+WooCommerce is installed at /wp, creates a WooCommerce
       order too — that's what triggers the push notification in the
       WooCommerce mobile app (via Jetpack) and keeps an order history.
   The buyer's real confirmation happens over WhatsApp; this endpoint is
   a record, so every failure here is non-fatal (the JS ignores the result). */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
$requestHost = isset($_SERVER['HTTP_HOST']) ? strtolower(trim((string) $_SERVER['HTTP_HOST'])) : '';
if ($requestHost !== '' && preg_match('/^(?:www\.)?yza-shop\.com(?::443)?$/D', $requestHost) !== 1
    && preg_match('/^(?:127\.0\.0\.1|localhost)(?::\d{1,5})?$/D', $requestHost) !== 1) {
  http_response_code(400); echo json_encode(array('ok' => false, 'error' => 'host')); exit;
}
$canonicalHost = 'yza-shop.com';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(array('ok' => false, 'error' => 'method'));
  exit;
}

/* Fail-open anti-abuse: cap bursts from a single IP so this endpoint can't be
   scripted to mail-bomb arbitrary addresses or spam fake Woo orders. A real buyer
   places one order; 30/min/IP never touches them. */
require_once __DIR__ . '/yza-throttle.php';
if (!yza_throttle('order', 10, 3600)) { http_response_code(429); echo json_encode(array('ok' => false, 'error' => 'rate')); exit; }

$raw = file_get_contents('php://input');
if (strlen($raw) > 20000) { http_response_code(413); echo json_encode(array('ok' => false)); exit; }
$data = json_decode($raw, true);
if (!is_array($data) || empty($data['text'])) {
  http_response_code(400);
  echo json_encode(array('ok' => false, 'error' => 'bad request'));
  exit;
}

$to    = 'contact@yza-shop.com';
$order = isset($data['order']) && is_array($data['order']) ? $data['order'] : array();
$submittedOrder = $order;
$ship  = isset($order['shipping']) && is_array($order['shipping']) ? $order['shipping'] : array();

$clean = function ($v, $max = 160) { return substr(preg_replace('/[\r\n]+/', ' ', (string)$v), 0, $max); };

/* Post-order add-on ("AJOUTER au colis de ma commande N°…"). Records the request as an
   email + a Woo order NOTE on the parent order — no totals change (one parcel = one order;
   Nawal confirms the price on WhatsApp). Returns early. */
if (isset($data['type']) && $data['type'] === 'addon') {
  require_once __DIR__ . '/catalog-order-lib.php';
  require_once __DIR__ . '/order-receipt-lib.php';
  $addonItems = isset($order['items']) && is_array($order['items']) ? array_values($order['items']) : array();
  $addonNumberRaw = isset($order['number']) ? $clean($order['number'], 24) : '';
  $addonOperationRaw = isset($order['operationId']) ? trim((string) $order['operationId']) : '';
  $addonOperation = yza_order_operation_id($addonOperationRaw);
  if ($addonOperationRaw === '' && $addonNumberRaw !== '' && yza_catalog_legacy_payload_candidate($addonItems)) {
    /* The cached pre-release checkout had no operation id. Its order number + exact
       submitted line make one bounded, replay-safe add-on identity; catalogue validation
       below still requires the pinned seed, exact displayed cents and current availability. */
    $addonOperation = 'legacy_addon_' . substr(hash('sha256', $addonNumberRaw . '|'
      . json_encode($addonItems, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)), 0, 40);
  }
  if ($addonOperation === '') {
    http_response_code(422); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_invalid')); exit;
  }
  $addonLock = yza_order_operation_lock($addonOperation);
  if (!$addonLock) {
    http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_storage_unavailable')); exit;
  }
  $addonReceipt = yza_order_receipt_get($addonOperation);
  $addonFingerprint = hash('sha256', json_encode(array($addonOperation, $addonNumberRaw,
    isset($order['items']) ? $order['items'] : array())));
  if (is_array($addonReceipt) && !empty($addonReceipt['fingerprint'])
      && !hash_equals($addonFingerprint, (string) $addonReceipt['fingerprint'])) {
    yza_order_operation_unlock($addonLock);
    http_response_code(409); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_conflict')); exit;
  }
  if (is_array($addonReceipt) && isset($addonReceipt['state']) && $addonReceipt['state'] === 'complete'
      && isset($addonReceipt['response']) && is_array($addonReceipt['response'])) {
    $addonReplay = $addonReceipt['response']; $addonReplay['replayed'] = true;
    yza_order_operation_unlock($addonLock); echo json_encode($addonReplay); exit;
  }
  if (count($addonItems) !== 1) {
    http_response_code(422);
    echo json_encode(array('ok' => false, 'accepted' => false, 'status' => 'invalid',
      'error' => 'catalog_invalid', 'currentRevision' => yza_catalog_current_revision(),
      'issues' => array(array('code' => 'invalid_addon_items'))));
    yza_order_operation_unlock($addonLock); exit;
  }
  $addonValidation = yza_catalog_validate_order_items($addonItems, null, 7200, true);
  if (empty($addonValidation['ok'])) {
    http_response_code(yza_catalog_validation_http_status($addonValidation));
    echo json_encode(yza_catalog_validation_response($addonValidation));
    yza_order_operation_unlock($addonLock); exit;
  }
  $addonItem = $addonValidation['items'][0];
  /* This is a request to add an item, not a completed sale: Nawal confirms its
     price and availability over WhatsApp. Do not consume authoritative stock
     until an actual order/payment is accepted. */
  $num  = isset($order['number']) ? $clean($order['number'], 24) : '';
  $addonVariant = isset($addonItem['variant']) && $addonItem['variant'] !== ''
    ? ' (' . $clean($addonItem['variant'], 120) . ')' : '';
  $body = 'AJOUTER au colis de ma commande' . ($num ? ' No ' . $num : '') . ' : '
    . $clean($addonItem['name'], 120) . $addonVariant . ' - ' . intval($addonItem['priceDh']) . ' DH';
  $subj = 'YZA — AJOUT commande' . ($num ? ' ' . $num : '');
  $host = $canonicalHost;
  $hdr  = 'From: YZA Boutique <no-reply@' . $host . ">\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";
  if (!is_array($addonReceipt) || empty($addonReceipt['state'])) {
    $addonReceipt = array('operation' => $addonOperation, 'state' => 'processing', 'at' => time(),
      'fingerprint' => $addonFingerprint, 'order' => array('number' => $num), 'effects' => array());
    if (!yza_order_receipt_save($addonReceipt)) {
      yza_order_operation_unlock($addonLock);
      http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
    }
  }
  $sent = !empty($addonReceipt['effects']['addon_mail']['result']);
  if (!yza_order_receipt_effect_dispatched($addonReceipt, 'addon_mail')) {
    if (!yza_order_receipt_effect($addonReceipt, 'addon_mail', 'intent')) {
      yza_order_operation_unlock($addonLock); http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'operation_persistence_failed')); exit;
    }
    $sent = @mail($to, '=?UTF-8?B?' . base64_encode($subj) . '?=', $body, $hdr);
    if (!yza_order_receipt_effect($addonReceipt, 'addon_mail', 'done', (bool) $sent)) {
      yza_order_operation_unlock($addonLock); http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'operation_persistence_failed')); exit;
    }
  }
  $wc = !empty($addonReceipt['effects']['addon_woo']['result']);
  $addonWooDone = yza_order_receipt_effect_dispatched($addonReceipt, 'addon_woo');
  if (!$addonWooDone && !yza_order_receipt_effect($addonReceipt, 'addon_woo', 'intent')) {
    yza_order_operation_unlock($addonLock); http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'operation_persistence_failed')); exit;
  }
  $wpLoad = __DIR__ . '/wp/wp-load.php';
  if (!$addonWooDone && is_file($wpLoad)) {
    try {
      define('WP_USE_THEMES', false);
      require_once $wpLoad;
      if ($num && function_exists('wc_get_orders')) {
        $found = wc_get_orders(array('limit' => 1, 'meta_key' => '_yza_order_number', 'meta_value' => $num));
        if (!empty($found)) { $found[0]->add_order_note('AJOUT demandé (WhatsApp) : ' . mb_substr($body, 0, 1000)); $wc = true; }
      }
    } catch (Throwable $e) { $wc = false; }
  }
  if (!$addonWooDone && !yza_order_receipt_effect($addonReceipt, 'addon_woo', 'done', (bool) $wc)) {
    yza_order_operation_unlock($addonLock); http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'operation_persistence_failed')); exit;
  }
  $addonResponse = array('ok' => (bool)$sent, 'accepted' => true, 'wc' => $wc,
    'addon' => true, 'catalogRevision' => $addonValidation['currentRevision'], 'item' => $addonItem);
  $addonReceipt['state'] = 'complete'; $addonReceipt['response'] = $addonResponse;
  $addonReceipt['fingerprint'] = $addonFingerprint;
  if (!yza_order_receipt_save($addonReceipt)) {
    yza_order_operation_unlock($addonLock); http_response_code(503); echo json_encode(array('ok' => false, 'error' => 'operation_persistence_failed')); exit;
  }
  yza_order_operation_unlock($addonLock);
  echo json_encode($addonResponse);
  exit;
}

/* A browser keeps this opaque operation id across retries. It serializes one logical
   non-card order and makes a lost HTTP response a replay, not a second order. */
require_once __DIR__ . '/order-receipt-lib.php';
require_once __DIR__ . '/catalog-order-lib.php';
$receiptEmail = isset($ship['email']) ? strtolower(trim((string) $ship['email'])) : '';
$receiptEmailHash = hash('sha256', $receiptEmail);
$receiptNumber = isset($order['number']) ? $clean($order['number'], 24) : '';
$operationRaw = isset($order['operationId']) ? trim((string) $order['operationId']) : '';
$operationId = yza_order_operation_id($operationRaw);
if ($operationRaw === '' && $receiptNumber !== ''
    && yza_catalog_legacy_payload_candidate(isset($order['items']) ? $order['items'] : array())) {
  /* One-deploy compatibility for an already-cached checkout: deterministic, but new
     browsers always send a cryptographically random operation id. */
  $operationId = 'legacy_' . substr(hash('sha256', $receiptNumber . '|' . $receiptEmail), 0, 40);
}
if ($operationId === '' || !filter_var($receiptEmail, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_invalid')); exit;
}
$order['method'] = isset($order['method']) ? strtolower(trim((string) $order['method'])) : '';
$order['lang'] = isset($order['lang']) && in_array(strtolower((string) $order['lang']), array('fr', 'en', 'es', 'tr', 'ar'), true)
  ? strtolower((string) $order['lang']) : 'fr';
require_once __DIR__ . '/payment-policy-lib.php';
$paymentError = yza_payment_policy_error($order['method'], $order['countryCode'] ?? '', 'order');
if ($paymentError !== '') {
  http_response_code(422); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => $paymentError)); exit;
}
$order['methodLabel'] = yza_payment_method_label($order['method'], $order['lang']);
$receiptFingerprint = yza_order_fulfillment_fingerprint($order, $operationId);
$operationLock = yza_order_operation_lock($operationId);
if (!$operationLock) {
  http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_storage_unavailable')); exit;
}
$receipt = yza_order_receipt_get($operationId);
if (is_array($receipt) && ((!empty($receipt['emailHash']) && !hash_equals($receiptEmailHash, (string) $receipt['emailHash']))
    || (!empty($receipt['email']) && !hash_equals($receiptEmail, (string) $receipt['email'])))) {
  yza_order_operation_unlock($operationLock);
  http_response_code(409); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_conflict')); exit;
}
/* An out-of-stock attempt has no fulfillment effects and consumes no inventory
   operation. The browser deliberately keeps its operation id when it removes or
   reduces the unavailable line, so this narrowly-scoped state may be replaced by
   a new canonical fingerprint for the same buyer. */
if (is_array($receipt) && isset($receipt['state']) && $receipt['state'] === 'stock_rejected') {
  $receipt = null;
}
if (is_array($receipt) && !empty($receipt['fingerprint'])
    && !hash_equals($receiptFingerprint, (string) $receipt['fingerprint'])) {
  yza_order_operation_unlock($operationLock);
  http_response_code(409); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_conflict')); exit;
}
if (is_array($receipt) && isset($receipt['state']) && $receipt['state'] === 'complete'
    && isset($receipt['response']) && is_array($receipt['response'])) {
  $replay = $receipt['response']; $replay['replayed'] = true;
  yza_order_operation_unlock($operationLock);
  echo json_encode($replay); exit;
}
$resumeReceipt = is_array($receipt) && isset($receipt['state']) && $receipt['state'] === 'processing'
  && isset($receipt['order']) && is_array($receipt['order']);
if ($resumeReceipt) {
  $order = $receipt['order'];
  $ship = isset($order['shipping']) && is_array($order['shipping']) ? $order['shipping'] : array();
  $name = isset($ship['name']) ? $clean($ship['name'], 120) : 'Client';
  $buyer = $receiptEmail; $number = isset($order['number']) ? $clean($order['number'], 24) : '';
  $method = isset($order['methodLabel']) ? $clean($order['methodLabel'], 60) : '';
  $total = isset($order['totalDh']) ? (int) $order['totalDh'] : 0;
  $merchDh = isset($order['merchandiseDh']) ? (int) $order['merchandiseDh'] : 0;
  $catalogValidation = array('currentRevision' => isset($order['catalogRevision']) ? $order['catalogRevision'] : '');
  $couponCode = isset($order['coupon']) ? (string) $order['coupon'] : '';
  $couponOperation = $operationId;
  $couponRes = array('ok' => $couponCode !== '', 'code' => $couponCode, 'discountDh' => 0);
  foreach (isset($order['discounts']) && is_array($order['discounts']) ? $order['discounts'] : array() as $discount) {
    if (is_array($discount) && isset($discount['id']) && $discount['id'] === 'coupon') {
      $couponRes['discountDh'] += max(0, (int) (isset($discount['amountDh']) ? $discount['amountDh'] : 0));
    }
  }
  $priceFlag = '';
  goto yza_noncard_receipt_ready;
}

/* Catalogue acceptance boundary. No mail, Woo order, coupon redemption or WhatsApp
   handoff is allowed until every base handle/revision/colour is validated. Client line
   prices are discarded and replaced with the accepted release price. */
$catalogValidation = yza_catalog_validate_order_items(
  isset($order['items']) && is_array($order['items']) ? $order['items'] : array(), null, 7200, true
);
if (empty($catalogValidation['ok'])) {
  http_response_code(yza_catalog_validation_http_status($catalogValidation));
  echo json_encode(yza_catalog_validation_response($catalogValidation));
  exit;
}
$order['items'] = $catalogValidation['items'];
$order['catalogRevision'] = $catalogValidation['currentRevision'];
$order['subtotalDh'] = (int) $catalogValidation['itemsTotalDh'];
/* Promotions and delivery are server-owned too. A direct client cannot invent a 20%
   discount or zero the delivery flags; both are derived from canonical items/country. */
$autoPromotion = yza_catalog_automatic_discount($order['items']);
$declaredAutoDiscountDh = (int) $autoPromotion['amountDh'];
$order['discounts'] = $autoPromotion['discounts'];
$order['merchandiseDh'] = max(0, $order['subtotalDh'] - $declaredAutoDiscountDh);
$acceptedShippingDh = 0;
$order['shippingDh'] = 0;
$order['totalDh'] = $order['merchandiseDh'];

$name   = isset($ship['name']) ? $clean($ship['name'], 120) : 'Client';
$total  = isset($order['totalDh']) ? intval($order['totalDh']) : (isset($order['subtotalDh']) ? intval($order['subtotalDh']) : '');
$method = isset($order['methodLabel']) ? $clean($order['methodLabel'], 60) : '';
$number = isset($order['number']) ? $clean($order['number'], 24) : '';
$buyer  = isset($ship['email']) ? trim((string)$ship['email']) : '';

/* Server-side price sanity check (NON-BLOCKING). Recompute the expected items total from
   the SEO price catalogue; if the client-sent total is >10% under it, only FLAG it in
   Nawal's subject line. The order is never rejected — payment is confirmed by hand on
   WhatsApp. Skips silently unless EVERY item was found in the catalogue (avoids false
   alarms on size-variant handles that aren't in products-seo.json). */
$priceFlag = '';
$expectedDh = (int) $catalogValidation['itemsTotalDh'];
/* Compare MERCHANDISE against merchandise. $total now includes the delivery fee, and
   $expectedDh is items-only, so checking $total here would let the fee pad out the 10%
   slack and hide real tampering. merchandiseDh is the delivery-free figure; fall back to
   $total minus the fee for payloads that predate it. */
$merchDh = isset($order['merchandiseDh']) ? intval($order['merchandiseDh'])
  : (($total !== '') ? (intval($total) - (isset($order['shippingDh']) ? intval($order['shippingDh']) : 0)) : '');

/* COUPON. Le navigateur annonce un code ; on ne le croit pas — on RECALCULE la remise
   a laquelle il donne droit, a partir du total catalogue et de la region, puis on
   abaisse d'autant le montant attendu. Sans ca, une remise de 10% parfaitement legitime
   tombait pile sur la tolerance de 10% et faisait crier au loup a chaque commande.
   Un code inconnu, deja utilise, ou un panier sous le seuil : $couponRes['ok'] est faux,
   le montant attendu reste entier, et l'ecart sera signale — ce qui est exactement le
   comportement voulu si quelqu'un bricole le total. */
$couponCode = isset($order['coupon']) ? strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', (string) $order['coupon'])) : '';
$couponRes  = array('ok' => false, 'discountDh' => 0, 'reason' => 'none', 'code' => '');
$countryCode = isset($order['countryCode']) ? strtoupper(trim((string) $order['countryCode'])) : 'XX';
$order['shippingRegion'] = yza_catalog_country_region($countryCode);
if ($couponCode !== '' && $expectedDh > 0) {
  require_once __DIR__ . '/yza-coupon-lib.php';
  $couponRes = yza_coupon_apply($couponCode, $buyer, $expectedDh, $declaredAutoDiscountDh,
    $order['shippingRegion'],
    isset($order['items']) && is_array($order['items']) ? $order['items'] : array());
}
$couponOperation = $operationId;
if (empty($couponRes['ok']) && $couponCode !== '') {
  http_response_code(409);
  echo json_encode(array('ok' => false, 'accepted' => false, 'status' => 'coupon_changed',
    'error' => 'coupon_changed', 'reason' => isset($couponRes['reason']) ? $couponRes['reason'] : 'invalid',
    'currentRevision' => $catalogValidation['currentRevision'],
    'canonical' => array('subtotalDh' => $expectedDh,
      'merchandiseDh' => max(0, $expectedDh - $declaredAutoDiscountDh))));
  exit;
}
$expectedAfterCoupon = $expectedDh - $declaredAutoDiscountDh
  - ($couponRes['ok'] ? intval($couponRes['discountDh']) : 0);
$canonicalDiscounts = $autoPromotion['discounts'];
if (!empty($couponRes['ok']) && intval($couponRes['discountDh']) > 0) {
  $canonicalDiscounts[] = array('id' => 'coupon', 'label' => $couponRes['code'], 'amountDh' => intval($couponRes['discountDh']));
}
$order['discounts'] = $canonicalDiscounts;
$order['merchandiseDh'] = max(0, $expectedAfterCoupon);
$shippingQuote = yza_catalog_shipping_quote($order['items'],
  max(0, $expectedAfterCoupon), false, $countryCode);
$acceptedShippingDh = (int) $shippingQuote['shippingDh'];
$order['countryCode'] = $shippingQuote['countryCode'];
$order['shippingRegion'] = $shippingQuote['region'];
$order['shippingDh'] = $acceptedShippingDh;
$order['shippingFree'] = (bool) $shippingQuote['shippingFree'];
$order['shippingQuoteOnly'] = (bool) $shippingQuote['shippingQuoteOnly'];
$order['totalDh'] = $order['merchandiseDh'] + $acceptedShippingDh;
$total = $order['totalDh'];
$merchDh = $order['merchandiseDh'];

/* A cached pre-release checkout cannot consume our canonical response. Accept it only
   when the complete server-owned total is exactly the whole-DH total it displayed. A
   mismatch is a structured reprice and causes no mail, Woo order, coupon claim or receipt. */
if (!empty($catalogValidation['legacyCompatibility'])
    && !yza_catalog_legacy_order_matches($submittedOrder, array(
      'subtotalDh' => $expectedDh, 'merchandiseDh' => $order['merchandiseDh'],
      'shippingDh' => $acceptedShippingDh, 'totalDh' => $order['totalDh'],
      'shippingFree' => $order['shippingFree'],
      'shippingQuoteOnly' => $order['shippingQuoteOnly'],
      'shippingRegion' => $order['shippingRegion'],
    ))) {
  yza_order_operation_unlock($operationLock);
  http_response_code(409);
  echo json_encode(array('ok' => false, 'accepted' => false, 'status' => 'reprice',
    'error' => 'catalog_reprice', 'currentRevision' => $catalogValidation['currentRevision'],
    'legacyCompatibility' => true,
    'compatibilityExpiresAt' => isset($catalogValidation['compatibilityExpiresAt'])
      ? $catalogValidation['compatibilityExpiresAt'] : '',
    'issues' => array(array('code' => 'legacy_total_changed')),
    'canonical' => array('subtotalDh' => $expectedDh, 'merchandiseDh' => $order['merchandiseDh'],
      'shippingDh' => $acceptedShippingDh, 'totalDh' => $order['totalDh'])));
  exit;
}

if (!empty($couponRes['ok'])) {
  $reservation = yza_coupon_reserve($couponRes['code'], $buyer, $couponOperation, 1800);
  if (empty($reservation['ok'])) {
    yza_order_operation_unlock($operationLock);
    http_response_code(409);
    echo json_encode(array('ok' => false, 'accepted' => false, 'status' => 'coupon_changed',
      'error' => 'coupon_changed', 'reason' => isset($reservation['reason']) ? $reservation['reason'] : 'storage',
      'currentRevision' => $catalogValidation['currentRevision'],
      'canonical' => array('subtotalDh' => $expectedDh,
        'merchandiseDh' => max(0, $expectedDh - $declaredAutoDiscountDh),
        'shippingDh' => $acceptedShippingDh, 'totalDh' => $order['totalDh'])));
    exit;
  }
}

$order['operationId'] = $operationId;
$receipt = array('operation' => $operationId, 'email' => $receiptEmail,
  'emailHash' => $receiptEmailHash, 'fingerprint' => $receiptFingerprint, 'state' => 'processing',
  'at' => time(), 'order' => $order, 'effects' => array());
if (!yza_order_receipt_save($receipt)) {
  if (!empty($couponRes['ok'])) { yza_coupon_release($couponRes['code'], $buyer, $couponOperation); }
  yza_order_operation_unlock($operationLock);
  http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
}

yza_noncard_receipt_ready:
/* Stock is consumed exactly once at order acceptance. The operation ledger is itself
   idempotent, so a lost response or a processing-receipt retry cannot decrement twice. */
$stockCommit = yza_inventory_direct_commit($operationId, $receiptFingerprint,
  isset($order['items']) && is_array($order['items']) ? $order['items'] : array(), 'noncard');
if (empty($stockCommit['ok'])) {
  if (!empty($couponRes['ok'])) { yza_coupon_release($couponRes['code'], $buyer, $couponOperation); }
  if (isset($stockCommit['reason']) && $stockCommit['reason'] === 'insufficient_stock') {
    /* Persist a PII-minimal retry marker. A corrected cart may reuse the same
       browser operation id without colliding with this rejected fingerprint. */
    $receipt = array('operation' => $operationId, 'emailHash' => $receiptEmailHash,
      'fingerprint' => $receiptFingerprint, 'state' => 'stock_rejected',
      'at' => time(), 'effects' => array());
    if (!yza_order_receipt_save($receipt)) {
      yza_order_operation_unlock($operationLock);
      http_response_code(503);
      echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed'));
      exit;
    }
  }
  yza_order_operation_unlock($operationLock);
  http_response_code(isset($stockCommit['status']) ? (int) $stockCommit['status'] : 503);
  echo json_encode(yza_catalog_inventory_failure_response($stockCommit,
    isset($catalogValidation['currentRevision']) ? $catalogValidation['currentRevision'] : ''));
  exit;
}
/* A discounted non-card order is accepted only after its exact reservation is
   durably claimed. No email, Woo order or browser success can precede this write. */
if (!empty($couponRes['ok'])) {
  $couponDone = isset($receipt['effects']['coupon']['state']) && $receipt['effects']['coupon']['state'] === 'done';
  if (!$couponDone && !yza_coupon_finalize($couponRes['code'], $buyer, $couponOperation, $number,
      intval($couponRes['discountDh']))) {
    yza_order_operation_unlock($operationLock);
    http_response_code(503);
    echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'coupon_persistence_failed'));
    exit;
  }
  if (!$couponDone && !yza_order_receipt_effect($receipt, 'coupon', 'done', true)) {
    yza_order_operation_unlock($operationLock);
    http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
  }
}

if ($couponCode !== '' && !$couponRes['ok']) {
  /* Le code a ete envoye mais il ne donne droit a rien (inconnu, deja utilise, panier
     sous le seuil). La commande passe — le paiement est confirme a la main — mais la
     marchande doit le savoir avant d'accorder la remise. */
  $priceFlag .= ' [!] COUPON REFUSE (' . $couponCode . ' : ' . $couponRes['reason'] . ')';
}

$subject = 'YZA — nouvelle commande' . ($number ? ' ' . $number : '') . ($total !== '' ? ' (' . $total . ' DH)' : '') . ($method ? ' · ' . $method : '') . ' — ' . $name . $priceFlag;
$textBody = yza_canonical_order_text($order);

$host = $canonicalHost;

/* Rich HTML notification for Nawal: product thumbnails + full delivery block +
   totals, so a new order can be prepared and shipped straight from the inbox.
   The original WhatsApp text (which carries the payment coordinates) is kept as the
   plain-text alternative — nothing is lost if a client strips HTML. */
$notifHtml = yza_order_notification($order, $ship, $number, $total, $method, $host);
$boundary  = 'yzaordr' . md5(uniqid('', true));
$headers   = 'From: YZA Boutique <no-reply@' . $host . ">\r\n";
if ($buyer && filter_var($buyer, FILTER_VALIDATE_EMAIL)) {
  $headers .= 'Reply-To: ' . $clean($buyer, 100) . "\r\n";
}
$headers  .= "MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=\"" . $boundary . "\"\r\n";
$mailBody  = '--' . $boundary . "\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n" . $textBody . "\r\n\r\n";
$mailBody .= '--' . $boundary . "\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n" . $notifHtml . "\r\n\r\n";
$mailBody .= '--' . $boundary . '--';

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$sent = !empty($receipt['effects']['shop_mail']['result']);
if (!yza_order_receipt_effect_dispatched($receipt, 'shop_mail')) {
  if (!yza_order_receipt_effect($receipt, 'shop_mail', 'intent')) {
    yza_order_operation_unlock($operationLock);
    http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
  }
  $sent = @mail($to, $encodedSubject, $mailBody, $headers, '-fno-reply@' . $host);
  if (!yza_order_receipt_effect($receipt, 'shop_mail', 'done', (bool) $sent)) {
    yza_order_operation_unlock($operationLock);
    http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
  }
}

/* ---- customer confirmation email (the buyer's own copy — was missing) ---- */
$custSent = !empty($receipt['effects']['customer_mail']['result']);
if ($buyer && filter_var($buyer, FILTER_VALIDATE_EMAIL)) {
  $firstName = trim(strtok((string) $name, ' '));
  $custSubject = ($firstName !== '' ? $firstName . ', ' : '') . 'votre commande YZA est confirmee' . ($number ? ' - ' . $number : '');
  $custItemRows = yza_item_rows_html(isset($order['items']) && is_array($order['items']) ? $order['items'] : array(), $host);
  $custHtml = yza_customer_confirmation($firstName, $number, $total, $custItemRows, $method, $host,
    isset($order['method']) ? (string) $order['method'] : '');
  $chead  = 'From: YZA <no-reply@' . $host . ">\r\n";
  $chead .= 'Reply-To: contact@' . $host . "\r\n";
  $chead .= "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n";
  if (!yza_order_receipt_effect_dispatched($receipt, 'customer_mail')) {
    if (!yza_order_receipt_effect($receipt, 'customer_mail', 'intent')) {
      yza_order_operation_unlock($operationLock);
      http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
    }
    $custSent = @mail($buyer, '=?UTF-8?B?' . base64_encode($custSubject) . '?=', $custHtml, $chead, '-fno-reply@' . $host);
    if (!yza_order_receipt_effect($receipt, 'customer_mail', 'done', (bool) $custSent)) {
      yza_order_operation_unlock($operationLock);
      http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
    }
  }
}

/* ---- WooCommerce bridge (no-op until WordPress exists at /wp) ---- */
$wc = !empty($receipt['effects']['woo']['result']);
$wooDone = isset($receipt['effects']['woo']['state']) && $receipt['effects']['woo']['state'] === 'done';
if (!$wooDone && !yza_order_receipt_effect($receipt, 'woo', 'intent')) {
  yza_order_operation_unlock($operationLock);
  http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
}
$wpLoad = __DIR__ . '/wp/wp-load.php';
if (!$wooDone && is_file($wpLoad)) {
  try {
    define('WP_USE_THEMES', false);
    require_once $wpLoad;
    if (function_exists('wc_create_order')) {
      $wcOrder = null;
      if (function_exists('wc_get_orders')) {
        $existing = wc_get_orders(array('limit' => 1, 'return' => 'objects',
          'meta_key' => '_yza_order_operation', 'meta_value' => $operationId));
        if (!empty($existing) && is_object($existing[0])) { $wcOrder = $existing[0]; }
      }
      if (!$wcOrder) {
        $wcOrder = wc_create_order();
        if (!is_object($wcOrder) || !method_exists($wcOrder, 'update_meta_data')) {
          throw new RuntimeException('woo_order_create_failed');
        }
        /* Persist the idempotency marker immediately. If PHP dies while the order is
           being populated, the retry finds and completes this same Woo order. */
        $wcOrder->update_meta_data('_yza_order_operation', $operationId);
        if ($number) { $wcOrder->update_meta_data('_yza_order_number', $number); }
        $wcOrder->save();

      // Line items (no catalog sync needed: name + qty + totals are enough).
      $items = isset($order['items']) && is_array($order['items']) ? array_slice($order['items'], 0, 40) : array();
      foreach ($items as $it) {
        if (!is_array($it)) continue;
        $qty   = max(1, intval(isset($it['qty']) ? $it['qty'] : 1));
        $cents = intval(isset($it['price']) ? $it['price'] : 0);      // DH x100 from the site
        $lineDh = round(($cents * $qty) / 100, 2);
        $label = $clean(isset($it['name']) ? $it['name'] : (isset($it['handle']) ? $it['handle'] : 'Article'), 120);
        if (!empty($it['variant'])) $label .= ' — ' . $clean($it['variant'], 60);
        $item = new WC_Order_Item_Product();
        $item->set_name($label);
        $item->set_quantity($qty);
        $item->set_subtotal($lineDh);
        $item->set_total($lineDh);
        $wcOrder->add_item($item);
      }

      // Buyer / shipping details.
      $full  = trim(isset($ship['name']) ? (string)$ship['name'] : '');
      $parts = preg_split('/\s+/', $full, 2);
      $addr = array(
        'first_name' => $clean(isset($parts[0]) ? $parts[0] : '', 60),
        'last_name'  => $clean(isset($parts[1]) ? $parts[1] : '', 60),
        'address_1'  => $clean(isset($ship['address']) ? $ship['address'] : '', 120),
        'city'       => $clean(isset($ship['city']) ? $ship['city'] : '', 60),
        'postcode'   => $clean(isset($ship['zip']) ? $ship['zip'] : '', 20),
        'country'    => 'MA',
        'email'      => ($buyer && filter_var($buyer, FILTER_VALIDATE_EMAIL)) ? $buyer : '',
        'phone'      => $clean(isset($ship['phone']) ? $ship['phone'] : '', 40),
      );
      // The checkout selector sends a real ISO-2 code; prefer it. 'XX' means "somewhere we
      // only quote after the order", which is not a country Woo can store.
      $ccRaw = isset($order['countryCode']) ? strtoupper(trim((string)$order['countryCode'])) : '';
      $countryTxt = isset($ship['country']) ? trim((string)$ship['country']) : '';
      if (preg_match('/^[A-Z]{2}$/', $ccRaw) && $ccRaw !== 'XX') {
        $addr['country'] = $ccRaw;
      } elseif ($countryTxt !== '' && !preg_match('/maroc|morocco/i', $countryTxt)) {
        $addr['country'] = '';                      // unknown → leave blank, keep the text in the note
      }
      $wcOrder->set_address($addr, 'billing');
      unset($addr['email'], $addr['phone']);
      $wcOrder->set_address($addr, 'shipping');

      /* Discounts (charm tiers, promo codes) → negative fee lines, the standard Woo
         pattern. Inserted BEFORE calculate_totals so the order total matches the site,
         the WhatsApp text and the ad-pixel value exactly. Clamped server-side. */
      $itemsTotalDh = 0;
      foreach ($items as $it) {
        if (is_array($it)) $itemsTotalDh += (intval(isset($it['price']) ? $it['price'] : 0) * max(1, intval(isset($it['qty']) ? $it['qty'] : 1))) / 100;
      }
      $discounts = isset($order['discounts']) && is_array($order['discounts']) ? array_slice($order['discounts'], 0, 5) : array();
      foreach ($discounts as $d) {
        if (!is_array($d)) continue;
        $amountDh = min(intval(isset($d['amountDh']) ? $d['amountDh'] : 0), (int)$itemsTotalDh);
        if ($amountDh <= 0) continue;
        $fee = new WC_Order_Item_Fee();
        $fee->set_name($clean(isset($d['label']) ? $d['label'] : 'Remise', 80));
        $fee->set_total(-$amountDh);
        $fee->set_tax_status('none');
        $wcOrder->add_item($fee);
      }

      /* Delivery fee → a real Woo shipping line, also before calculate_totals. Without it
         the Woo total settles on items − discounts and silently drops the fee, so the
         recorded order would disagree with the card charge (zazu-checkout.php bills
         order.totalDh) and with the email. Clamped and only when actually charged. */
      $shipDh = isset($order['shippingDh']) ? intval($order['shippingDh']) : 0;
      if ($shipDh > 0 && $shipDh <= 2000) {
        // No set_tax_status() here: on WC_Order_Item_Shipping it only exists in Woo 9.6+,
        // and calculate_totals(false) already skips tax. Fee lines above are fine — the
        // method is long-standing on WC_Order_Item_Fee.
        $shipLine = new WC_Order_Item_Shipping();
        $shipLine->set_method_title('Livraison');
        $shipLine->set_total($shipDh);
        $wcOrder->add_item($shipLine);
      }

      $wcOrder->set_payment_method_title($method ? $method : 'WhatsApp');
      $wcOrder->set_currency('MAD');
      if ($number) {
        $wcOrder->update_meta_data('_yza_order_number', $number);
      }
      $wcOrder->update_meta_data('_yza_order_operation', $operationId);
      // Full original text (items, address, method, payment coordinates) as the order note.
      // $body n'existe QUE dans la branche addon du haut, qui se termine par exit() : sur le
      // chemin normal il valait null, donc la note de commande WooCommerce partait VIDE
      // depuis toujours. La variable de ce chemin s'appelle $textBody (l.88).
      $wcOrder->set_customer_note(mb_substr($textBody, 0, 4000));
      $wcOrder->calculate_totals(false);
      // COD ships right away = processing; transfers wait for the receipt = on-hold.
      $methodKey = isset($order['method']) ? (string)$order['method'] : '';
      $wcOrder->set_status($methodKey === 'cod' ? 'processing' : 'on-hold');
      $wcOrder->save();
      }
      $wc = yza_order_woo_rebuild_and_verify($wcOrder, $order, $ship, $buyer, $number,
        $method, $textBody, $operationId, $receiptFingerprint, $clean);
      if (!$wc) { throw new RuntimeException('woo_fulfillment_not_verified'); }
    }
  } catch (Throwable $e) {
    $wc = false; // never let the WP side break the endpoint
  }
}
if (!$wooDone && is_file($wpLoad) && !$wc) {
  yza_order_operation_unlock($operationLock);
  http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'woo_fulfillment_failed')); exit;
}
if (!$wooDone && !yza_order_receipt_effect($receipt, 'woo', 'done', (bool) $wc)) {
  yza_order_operation_unlock($operationLock);
  http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
}

/* ---- close the abandoned-cart loop: this buyer just ordered, so their pending
   cart (if any) must never receive a recovery email. Flip it to 'purchased'. ---- */
$cartDone = isset($receipt['effects']['cart']['state']) && $receipt['effects']['cart']['state'] === 'done';
if (!$cartDone) {
  if (!yza_order_receipt_effect($receipt, 'cart', 'intent')) {
    yza_order_operation_unlock($operationLock);
    http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
  }
  if ($buyer && filter_var($buyer, FILTER_VALIDATE_EMAIL)) { yza_mark_cart_purchased(strtolower(trim($buyer))); }
  if (!yza_order_receipt_effect($receipt, 'cart', 'done', true)) {
    yza_order_operation_unlock($operationLock);
    http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
  }
}

$acceptedOrder = array(
  'number' => isset($order['number']) ? $order['number'] : '',
  'items' => $order['items'],
  'subtotalDh' => $order['subtotalDh'],
  'discounts' => $order['discounts'],
  'merchandiseDh' => $order['merchandiseDh'],
  'shippingDh' => $order['shippingDh'],
  'shippingFree' => !empty($order['shippingFree']),
  'shippingQuoteOnly' => !empty($order['shippingQuoteOnly']),
  'shippingRegion' => isset($order['shippingRegion']) ? $order['shippingRegion'] : '',
  'countryCode' => isset($order['countryCode']) ? $order['countryCode'] : '',
  'totalDh' => $order['totalDh'],
  'method' => isset($order['method']) ? $order['method'] : '',
  'methodLabel' => isset($order['methodLabel']) ? $order['methodLabel'] : '',
  'shipping' => $ship,
  'lang' => isset($order['lang']) ? $order['lang'] : 'fr',
  'coupon' => isset($order['coupon']) ? $order['coupon'] : '',
  'catalogRevision' => $catalogValidation['currentRevision'],
);
$receiptOrder = $acceptedOrder;
/* Shipping PII already remains in the shopper's session; a lost-response replay needs
   only money/lines/order identity and the browser merges its local address for display. */
unset($receiptOrder['shipping']);
$response = array('ok' => (bool)$sent, 'accepted' => true,
  'catalogRevision' => $catalogValidation['currentRevision'], 'order' => $receiptOrder,
  'wc' => $wc, 'cust' => isset($custSent) ? (bool)$custSent : false);
if (!empty($catalogValidation['legacyCompatibility'])) {
  $response['legacyCompatibilityUsed'] = true;
  $response['compatibilityExpiresAt'] = isset($catalogValidation['compatibilityExpiresAt'])
    ? $catalogValidation['compatibilityExpiresAt'] : '';
}
$receipt['state'] = 'complete';
$receipt['emailHash'] = $receiptEmailHash;
$receipt['fingerprint'] = $receiptFingerprint;
$receipt['response'] = $response;
$receipt['completed_at'] = time();
if (!yza_order_receipt_save($receipt)) {
  yza_order_operation_unlock($operationLock);
  http_response_code(503); echo json_encode(array('ok' => false, 'accepted' => false, 'error' => 'operation_persistence_failed')); exit;
}
yza_order_operation_unlock($operationLock);
$response['order']['shipping'] = $ship;
echo json_encode($response);

/* ---------------------------------------------------------------------- */
function yza_canonical_order_text($order) {
  $oneLine = function ($value, $max = 180) {
    $value = preg_replace('/[\r\n\x00]+/u', ' ', (string) $value);
    return substr(trim((string) $value), 0, $max);
  };
  $lines = array();
  $number = isset($order['number']) ? $oneLine($order['number'], 24) : '';
  $lines[] = 'Commande YZA' . ($number !== '' ? ' ' . $number : '');
  $items = isset($order['items']) && is_array($order['items']) ? $order['items'] : array();
  foreach ($items as $item) {
    if (!is_array($item)) { continue; }
    $qty = isset($item['qty']) ? max(1, intval($item['qty'])) : 1;
    $name = isset($item['name']) ? $oneLine($item['name'], 120) : 'Article';
    $variant = isset($item['variant']) ? $oneLine($item['variant'], 120) : '';
    $priceDh = isset($item['priceDh']) ? intval($item['priceDh'])
      : intval(round(intval(isset($item['price']) ? $item['price'] : 0) / 100));
    $lines[] = $qty . ' x ' . $name . ($variant !== '' ? ' (' . $variant . ')' : '')
      . ' - ' . ($priceDh * $qty) . ' DH';
  }
  $discounts = isset($order['discounts']) && is_array($order['discounts']) ? $order['discounts'] : array();
  foreach ($discounts as $discount) {
    if (!is_array($discount) || empty($discount['amountDh'])) { continue; }
    $label = isset($discount['label']) ? $oneLine($discount['label'], 80) : 'Remise';
    $lines[] = $label . ' : -' . intval($discount['amountDh']) . ' DH';
  }
  // Delivery is never free since 2026-10-05: the line always states the fee or the quote.
  if (!empty($order['shippingQuoteOnly'])) { $lines[] = 'Livraison : a confirmer'; }
  else { $lines[] = 'Livraison : ' . intval(isset($order['shippingDh']) ? $order['shippingDh'] : 0) . ' DH'; }
  $lines[] = 'Total : ' . intval(isset($order['totalDh']) ? $order['totalDh'] : 0) . ' DH';

  $ship = isset($order['shipping']) && is_array($order['shipping']) ? $order['shipping'] : array();
  $address = array();
  foreach (array('name', 'phone', 'address', 'zip', 'city', 'country') as $field) {
    if (isset($ship[$field]) && trim((string) $ship[$field]) !== '') { $address[] = $oneLine($ship[$field], 180); }
  }
  if (count($address) > 0) { $lines[] = 'Adresse : ' . implode(', ', $address); }
  if (!empty($ship['note'])) { $lines[] = 'Note : ' . $oneLine($ship['note'], 300); }
  $method = isset($order['methodLabel']) ? $oneLine($order['methodLabel'], 80)
    : (isset($order['method']) ? $oneLine($order['method'], 40) : '');
  if ($method !== '') { $lines[] = 'Paiement : ' . $method; }
  return implode("\n", $lines);
}

function yza_mark_cart_purchased($email) {
  $file = __DIR__ . '/.private/yza-carts.php';
  if (!is_file($file)) { return; }
  require_once __DIR__ . '/cart-store-lib.php';
  $email = strtolower(trim((string) $email));
  yza_cart_store_mutate($file, function (&$records) use ($email) {
    $now = time();
    foreach ($records as $index => $record) {
      if (isset($record['email']) && strtolower((string) $record['email']) === $email
          && (!isset($record['status']) || $record['status'] === 'active')) {
        $record['status'] = 'purchased';
        $record['purchased_at'] = $now;
        $record['updated'] = $now;
        $records[$index] = $record;
      }
    }
    return true;
  });
}

function yza_customer_confirmation($firstName, $number, $total, $itemRows, $method, $host, $methodKey = '') {
  $base   = 'https://' . $host;
  $hello  = $firstName !== '' ? 'Bonjour ' . htmlspecialchars($firstName) : 'Bonjour';
  $totalTxt = ($total !== '' && $total !== null) ? (intval($total) . ' DH') : '';
  /* On teste d'abord le CODE MACHINE ('cod'), pas le libelle. $method est traduit dans la
     langue de l'acheteuse : « Cash on delivery », « Pago contra entrega », « Kapida odeme »,
     « الدفع عند الاستلام » — aucun ne contient « livraison » ni « cod ». Toute commande contre-
     remboursement passee hors francais recevait donc « Nawal vous confirme les coordonnees de
     paiement » : on reclamait un virement a quelqu'un qui avait choisi de payer au facteur.
     Le test sur le libelle reste en repli, pour un ancien paquet sans champ `method`. */
  $isCod  = ((string) $methodKey === 'cod')
         || (stripos((string) $method, 'livraison') !== false || stripos((string) $method, 'cod') !== false);
  $payLine = $isCod
    ? 'Vous reglez a la livraison, en main propre. Rien a avancer.'
    : 'Nawal vous confirme les coordonnees de paiement sur WhatsApp, en direct.';
  $items = $itemRows !== '' ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 0">' . $itemRows . '</table>' : '';
  $totalRow = $totalTxt !== '' ? '<p style="margin:12px 0 0;font-size:15px;color:#1a1917"><strong>Total : ' . $totalTxt . '</strong></p>' : '';
  $numTxt = $number ? htmlspecialchars($number) : '';

  return '<!doctype html><html><body style="margin:0;background:#efece6;font-family:Georgia,\'Times New Roman\',serif">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efece6"><tr><td align="center" style="padding:28px 14px">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2ddd2">'
    . '<tr><td style="padding:30px 34px 8px"><div style="font-family:Arial,Helvetica,sans-serif;letter-spacing:.28em;font-size:22px;color:#1a1917;font-weight:600">YZA</div></td></tr>'
    . '<tr><td style="padding:8px 34px 6px">'
    . '<p style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#1a1917">' . $hello . ',</p>'
    . '<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1a1917">Votre commande' . ($numTxt ? ' <strong>' . $numTxt . '</strong>' : '') . ' est confirmee. Merci de faire entrer un peu de Marrakech chez vous.</p>'
    . ($items ? '<div style="margin:0 0 6px;border-top:1px solid #eee7db;border-bottom:1px solid #eee7db;padding:14px 0">' . $items . $totalRow . '</div>' : '')
    . '<p style="margin:18px 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#b4532a">Ce qui se passe maintenant</p>'
    . '<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#3a3833">On prepare votre piece a la main, dans notre atelier 100 % feminin de Gueliz. Vous recevrez un message des qu\'elle part. ' . $payLine . ' Nawal vous a aussi ecrit sur WhatsApp &mdash; c\'est la que tout se confirme, en direct.</p>'
    . '<p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#77736a">Fait main, fait pour durer : si un jour votre piece a besoin d\'un soin, on la repare a vie a l\'atelier. Et vous avez 30 jours pour changer d\'avis.</p>'
    . '<p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1a1917">Nawal &middot; <span style="color:#77736a">YZA</span></p>'
    . '</td></tr>'
    . '<tr><td style="padding:22px 34px 26px;border-top:1px solid #eee7db"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#9a958a">Une question ? contact@' . htmlspecialchars($host) . ' &middot; <a href="' . $base . '" style="color:#9a958a">yza-shop.com</a><br>YZA &middot; 66 rue Yougoslavie, Gueliz, Marrakech</p></td></tr>'
    . '</table></td></tr></table></body></html>';
}

/* Backward-compatible expected total from the current release. The normal acceptance
   path above uses the richer revision-aware result and never fails open. */
function yza_expected_total($items) {
  require_once __DIR__ . '/catalog-runtime.php';
  $j = yza_catalog_server_products();
  $real = array_values(array_filter($items, 'is_array'));
  if (!$real) { return 0; }
  $sum = 0; $matched = 0;
  foreach ($real as $it) {
    $h = isset($it['handle']) ? (string) $it['handle'] : '';
    if ($h !== '' && !empty($j[$h]['active']) && isset($j[$h]['priceDh'])) {
      $sum += intval($j[$h]['priceDh']) * max(1, intval(isset($it['qty']) ? $it['qty'] : 1));
      $matched++;
    }
  }
  return ($matched === count($real)) ? $sum : 0;
}

/* DH integer -> "1 234 DH" (thin space thousands, no decimals — YZA prices are whole DH). */
function yza_dh($v) { return number_format((float) $v, 0, ',', ' ') . ' DH'; }

/* Order items -> <tr> rows with a 64px product thumbnail, name/variant/qty, line total.
   Shared by Nawal's notification and the buyer's confirmation. Image resolved by handle;
   a neutral tile is shown if a handle has no image (never a broken-image icon). */
function yza_item_rows_html($items, $host) {
  if (!is_array($items)) { return ''; }
  $rows = '';
  foreach (array_slice($items, 0, 40) as $it) {
    if (!is_array($it)) { continue; }
    $h    = isset($it['handle']) ? preg_replace('/[^a-z0-9-]/i', '', (string) $it['handle']) : '';
    $qty  = max(1, intval(isset($it['qty']) ? $it['qty'] : 1));
    $nm   = htmlspecialchars((string) (isset($it['name']) ? $it['name'] : 'Article'), ENT_QUOTES, 'UTF-8');
    $vr   = !empty($it['variant']) ? htmlspecialchars((string) $it['variant'], ENT_QUOTES, 'UTF-8') : '';
    $cents = intval(isset($it['price']) ? $it['price'] : 0);
    $lineDh = (int) round(($cents * $qty) / 100);
    $img = yza_catalog_order_item_image($it, $host);
    $thumb = $img
      ? '<img src="' . htmlspecialchars($img, ENT_QUOTES, 'UTF-8') . '" width="64" height="64" alt="' . $nm . '" style="display:block;width:64px;height:64px;object-fit:cover;border:1px solid #e2ddd2;border-radius:4px">'
      : '<div style="width:64px;height:64px;background:#efece6;border:1px solid #e2ddd2;border-radius:4px"></div>';
    $rows .= '<tr>'
      . '<td width="64" style="padding:9px 12px 9px 0;vertical-align:top">' . $thumb . '</td>'
      . '<td style="padding:9px 0;vertical-align:top;font-family:Arial,Helvetica,sans-serif">'
      .   '<div style="font-size:14px;color:#1a1917;font-weight:600;line-height:1.35">' . $nm . '</div>'
      .   ($vr ? '<div style="font-size:12px;color:#77736a;margin-top:2px">' . $vr . '</div>' : '')
      .   '<div style="font-size:12px;color:#77736a;margin-top:2px">Qte : ' . $qty . '</div>'
      . '</td>'
      . '<td style="padding:9px 0;vertical-align:top;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1917;white-space:nowrap">' . ($cents > 0 ? yza_dh($lineDh) : '') . '</td>'
      . '</tr>';
  }
  return $rows;
}

/* Nawal's order-received email: order no + total + payment, a delivery block she can
   ship from, and the itemised list with thumbnails. Payment coordinates live in the
   plain-text alternative (the WhatsApp body), so this stays a clean shipping view. */
function yza_order_notification($order, $ship, $number, $total, $method, $host) {
  $e = function ($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); };
  $items = isset($order['items']) && is_array($order['items']) ? $order['items'] : array();
  $rows  = yza_item_rows_html($items, $host);

  // Delivery details.
  $name    = $e(isset($ship['name']) ? $ship['name'] : '');
  $phoneRaw = isset($ship['phone']) ? trim((string) $ship['phone']) : '';
  $phone   = $e($phoneRaw);
  $wa = preg_replace('/[^0-9]/', '', $phoneRaw);
  if ($wa !== '' && $wa[0] === '0') { $wa = '212' . substr($wa, 1); }   // MA local 0X… -> 212X…
  $addr    = $e(isset($ship['address']) ? $ship['address'] : '');
  $cityZip = trim(($e(isset($ship['zip']) ? $ship['zip'] : '')) . ' ' . ($e(isset($ship['city']) ? $ship['city'] : '')));
  $country = $e(isset($ship['country']) ? $ship['country'] : '');
  $note    = (isset($ship['note']) && trim((string) $ship['note']) !== '') ? $e($ship['note']) : '';
  $buyer   = (isset($ship['email']) && filter_var($ship['email'], FILTER_VALIDATE_EMAIL)) ? $e($ship['email']) : '';

  // Totals.
  $subtotal = isset($order['subtotalDh']) ? intval($order['subtotalDh']) : null;
  $discounts = isset($order['discounts']) && is_array($order['discounts']) ? $order['discounts'] : array();
  $totalTxt = ($total !== '' && $total !== null) ? yza_dh($total) : '';
  $when = '';
  if (!empty($order['at'])) { $ts = strtotime((string) $order['at']); if ($ts) { $when = date('d/m/Y H:i', $ts); } }

  $discRows = '';
  foreach ($discounts as $d) {
    if (!is_array($d)) { continue; }
    $amt = intval(isset($d['amountDh']) ? $d['amountDh'] : 0);
    if ($amt <= 0) { continue; }
    $discRows .= '<tr><td style="padding:2px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#77736a">' . $e(isset($d['label']) ? $d['label'] : 'Remise') . '</td>'
      . '<td style="padding:2px 0;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#b4532a">&minus;' . yza_dh($amt) . '</td></tr>';
  }
  $subRow = ($subtotal !== null) ? '<tr><td style="padding:2px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#77736a">Sous-total</td><td style="padding:2px 0;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#3a3833">' . yza_dh($subtotal) . '</td></tr>' : '';

  /* Delivery row — without it the email shows a subtotal and a larger total with an
     unexplained gap, which is exactly how a missing fee goes unnoticed. Skipped entirely
     for orders that carry no delivery fields at all: right after a deploy a shopper on a
     cached checkout.js still posts the old payload, and "Livraison 0 DH" would be a lie. */
  $shipRow = '';
  if (array_key_exists('shippingDh', $order) || array_key_exists('shippingFree', $order) || array_key_exists('shippingQuoteOnly', $order)) {
    $shipDhMail = isset($order['shippingDh']) ? intval($order['shippingDh']) : 0;
    $shipValue  = !empty($order['shippingQuoteOnly']) ? 'Confirm&eacute;e avec vous' : yza_dh($shipDhMail);
    $shipRow = '<tr><td style="padding:2px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#77736a">Livraison</td>'
      . '<td style="padding:2px 0;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#3a3833">' . $shipValue . '</td></tr>';
  }

  $deliveryLines = array();
  if ($name)    { $deliveryLines[] = '<strong style="color:#1a1917">' . $name . '</strong>'; }
  if ($phone)   { $deliveryLines[] = $wa ? '<a href="https://wa.me/' . $wa . '" style="color:#b4532a;text-decoration:none">' . $phone . '</a> &middot; <a href="tel:' . $e($phoneRaw) . '" style="color:#77736a;text-decoration:none">appeler</a>' : $phone; }
  if ($buyer)   { $deliveryLines[] = '<a href="mailto:' . $buyer . '" style="color:#77736a;text-decoration:none">' . $buyer . '</a>'; }
  if ($addr)    { $deliveryLines[] = $addr; }
  if ($cityZip) { $deliveryLines[] = $cityZip; }
  if ($country) { $deliveryLines[] = $country; }
  $delivery = implode('<br>', $deliveryLines);

  $A = 'font-family:Arial,Helvetica,sans-serif';
  return '<!doctype html><html><body style="margin:0;background:#efece6;' . $A . '">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efece6"><tr><td align="center" style="padding:26px 14px">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e2ddd2">'
    // header: label + order no + total
    . '<tr><td style="padding:24px 30px 6px">'
    .   '<div style="' . $A . ';font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#b4532a">Nouvelle commande</div>'
    .   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0"><tr>'
    .     '<td style="vertical-align:bottom"><div style="' . $A . ';font-size:22px;font-weight:700;color:#1a1917">' . ($number ? $e($number) : 'YZA') . '</div>'
    .       ($when ? '<div style="' . $A . ';font-size:12px;color:#9a958a;margin-top:2px">' . $when . '</div>' : '') . '</td>'
    .     '<td style="vertical-align:bottom;text-align:right">' . ($totalTxt ? '<div style="' . $A . ';font-size:22px;font-weight:700;color:#1a1917">' . $totalTxt . '</div>' : '')
    .       ($method ? '<div style="' . $A . ';font-size:12px;color:#77736a;margin-top:2px">' . $e($method) . '</div>' : '') . '</td>'
    .   '</tr></table>'
    . '</td></tr>'
    // delivery block
    . '<tr><td style="padding:16px 30px 6px">'
    .   '<div style="background:#faf7f1;border:1px solid #eee7db;border-radius:6px;padding:14px 16px">'
    .     '<div style="' . $A . ';font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#9a958a;margin-bottom:6px">Livraison</div>'
    .     '<div style="' . $A . ';font-size:14px;line-height:1.7;color:#3a3833">' . ($delivery ? $delivery : '—') . '</div>'
    .     ($note ? '<div style="' . $A . ';font-size:13px;line-height:1.6;color:#77736a;margin-top:8px;padding-top:8px;border-top:1px dashed #e2ddd2">&ldquo;' . $note . '&rdquo;</div>' : '')
    .   '</div>'
    . '</td></tr>'
    // items
    . '<tr><td style="padding:14px 30px 4px">'
    .   '<div style="' . $A . ';font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#9a958a;margin-bottom:2px">Articles</div>'
    .   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $rows . '</table>'
    . '</td></tr>'
    // totals
    . '<tr><td style="padding:6px 30px 4px">'
    .   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee7db;padding-top:8px">'
    .     $subRow . $discRows . $shipRow
    .     ($totalTxt ? '<tr><td style="padding:8px 0 0;' . $A . ';font-size:15px;font-weight:700;color:#1a1917">Total</td><td style="padding:8px 0 0;text-align:right;' . $A . ';font-size:15px;font-weight:700;color:#1a1917">' . $totalTxt . '</td></tr>' : '')
    .   '</table>'
    . '</td></tr>'
    // WhatsApp CTA + payment-coordinates hint
    . '<tr><td style="padding:16px 30px 24px">'
    .   ($wa ? '<a href="https://wa.me/' . $wa . '" style="display:inline-block;background:#1a1917;color:#fff;text-decoration:none;' . $A . ';font-size:12px;letter-spacing:.12em;text-transform:uppercase;padding:12px 22px;border-radius:2px">Confirmer sur WhatsApp</a>' : '')
    .   '<p style="margin:14px 0 0;' . $A . ';font-size:12px;line-height:1.6;color:#9a958a">Les coordonnees de paiement et le detail brut sont dans la version texte de cet e-mail (et dans le message WhatsApp du client).</p>'
    . '</td></tr>'
    . '</table></td></tr></table></body></html>';
}
