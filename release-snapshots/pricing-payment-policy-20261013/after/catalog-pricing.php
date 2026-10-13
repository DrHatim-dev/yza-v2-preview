<?php
// Public, deterministic pricing projection. No seeds, network calls or writes.
function yza_pricing_enabled()
{
    return !empty(yza_catalog_database_config()['pricingSync']);
}
function yza_pricing_hash(array $value)
{
    unset($value['contentHash']);
    return hash('sha256', yza_catalog_json_encode(yza_catalog_canonicalize($value)));
}

function yza_pricing_rules(array $release = null)
{
    $release = $release ?? yza_catalog_load_current();
    if (!is_array($release) || !isset($release['commerce']) || !yza_pricing_rules_valid($release['commerce'])) {
        throw new RuntimeException('Canonical checkout rules unavailable');
    }
    return $release['commerce'];
}

function yza_pricing_rules_valid($rules)
{
    if (!is_array($rules) || ($rules['schemaVersion'] ?? null) !== 1) return false;
    if (($rules['tax']['mode'] ?? '') !== 'as_priced_no_additional_tax' || ($rules['tax']['rate'] ?? null) !== null
        || ($rules['checkout']['settlementCurrency'] ?? '') !== 'MAD') return false;
    foreach (array('eurSettlementRate', 'priceGraceSeconds', 'maxLines', 'maxQuantity') as $key) {
        if (!isset($rules['checkout'][$key]) || !is_int($rules['checkout'][$key]) || $rules['checkout'][$key] < 0) return false;
    }
    $c = $rules['checkout'];
    if (isset($c['couponPolicyHash']) && !preg_match('/^[a-f0-9]{64}$/D',$c['couponPolicyHash'])) return false;
    if ($c['eurSettlementRate'] < 1 || $c['eurSettlementRate'] > 100 || $c['priceGraceSeconds'] > 86400
        || $c['maxLines'] < 1 || $c['maxLines'] > 100 || $c['maxQuantity'] < 1 || $c['maxQuantity'] > 999) return false;
    // Fees are required. Delivery is never free since 2026-10-05, so the legacy free-delivery
    // thresholds are optional: new releases omit them, older releases that still carry them
    // stay valid (History restore) and are checked as before. Nothing reads them any more.
    foreach (array('morocco' => array('feeDh'), 'europe' => array('feeEur'), 'usa_gcc' => array('feeEur')) as $region => $keys) {
        foreach ($keys as $key) {
            if (!isset($rules['shipping'][$region][$key]) || !is_int($rules['shipping'][$region][$key])
                || $rules['shipping'][$region][$key] < 0 || $rules['shipping'][$region][$key] > 100000) return false;
        }
    }
    foreach (array('morocco' => array('freeAccDh','freeDh'), 'europe' => array('freeEur'), 'usa_gcc' => array('freeEur')) as $region => $keys) {
        foreach ($keys as $key) {
            if (array_key_exists($key, $rules['shipping'][$region]) && (!is_int($rules['shipping'][$region][$key])
                || $rules['shipping'][$region][$key] < 0 || $rules['shipping'][$region][$key] > 100000)) return false;
        }
    }
    $otherMode = $rules['shipping']['other']['mode'] ?? '';
    if (!in_array($otherMode, array('quote_only', 'fixed_fee'), true)) return false;
    if ($otherMode === 'fixed_fee' && (!is_int($rules['shipping']['other']['feeEur'] ?? null)
        || $rules['shipping']['other']['feeEur'] < 1 || $rules['shipping']['other']['feeEur'] > 100000)) return false;
    if (!isset($rules['cart']['charmTiers']) || !is_array($rules['cart']['charmTiers'])) return false;
    foreach ($rules['cart']['charmTiers'] as $tier) {
        if (!is_int($tier['min'] ?? null) || $tier['min'] < 1 || !is_int($tier['pct'] ?? null)
            || $tier['pct'] < 0 || $tier['pct'] > 100) return false;
    }
    foreach (array('europeCountries','shippingEuropeCountries','shippingUsaGccCountries') as $key) {
        if (!isset($rules['zones'][$key]) || !is_array($rules['zones'][$key])) return false;
        foreach ($rules['zones'][$key] as $country) if (!is_string($country) || !preg_match('/^[A-Z]{2}$/D', $country)) return false;
    }
    $policy = $rules['zones']['retailPolicy'] ?? 'europe_only';
    if (!in_array($policy, array('europe_only', 'morocco_vs_international'), true)) return false;
    return ($rules['zones']['defaultCurrency'] ?? '') === ($policy === 'morocco_vs_international' ? 'EUR' : 'MAD');
}

function yza_pricing_coupon_definitions()
{
    $hash=yza_pricing_rules()['checkout']['couponPolicyHash'] ?? '';
    if (!preg_match('/^[a-f0-9]{64}$/D',$hash)) throw new RuntimeException('Canonical coupon policy unavailable');
    $q=yza_catalog_database()->prepare('SELECT payload FROM '.yza_catalog_database_table('private_rules').' WHERE content_hash=?');
    $q->execute(array($hash));$raw=$q->fetchColumn();
    $definitions=$raw===false ? null : json_decode($raw,true);
    if (!is_array($definitions) || !hash_equals($hash,yza_pricing_hash($definitions))) throw new RuntimeException('Coupon policy integrity failure');
    return $definitions;
}

function yza_pricing_export(array $release)
{
    $rules = yza_pricing_rules($release);
    $records = array();
    foreach ($release['products'] as $id => $product) {
        foreach (array('MAD' => 'priceDh', 'EUR' => 'priceEur') as $currency => $key) {
            if (!isset($product[$key]) || !is_int($product[$key])) throw new RuntimeException('Explicit regional price missing');
            $modified = $product[$currency === 'EUR' ? 'priceEurChangedAt' : 'priceChangedAt'] ?? $release['createdAt'];
            if (isset($rules['lastModifiedAt']) && strtotime($rules['lastModifiedAt']) > strtotime($modified)) $modified = $rules['lastModifiedAt'];
            $record = array('productId' => $id, 'sku' => $product['sku'] ?? $id,
                'priceMinor' => $product[$key] * 100, 'currency' => $currency,
                'zone' => ($rules['zones']['retailPolicy'] ?? '') === 'morocco_vs_international'
                    ? ($currency === 'EUR' ? 'international' : 'morocco')
                    : ($currency === 'EUR' ? 'europe' : 'africa_and_rest'),
                'active' => (bool) $product['active'], 'taxRule' => $rules['tax'],
                'checkoutRule' => $rules['checkout'], 'cartRule' => $rules['cart'],
                'effectiveAt' => $modified, 'lastModifiedAt' => $modified,
                'rulesHash' => yza_pricing_hash($rules));
            $record['contentHash'] = yza_pricing_hash($record);
            $records[$id . ':' . $currency] = $record;
        }
    }
    ksort($records, SORT_STRING);
    // No publisher identities or private audit data are exported to GitHub.
    $export = array('schemaVersion' => 1, 'catalogRevision' => $release['revision'],
        'catalogHash' => $release['hashes']['contentSha256'], 'rules' => $rules, 'records' => $records);
    $export['contentHash'] = yza_pricing_hash($export);
    return $export;
}
