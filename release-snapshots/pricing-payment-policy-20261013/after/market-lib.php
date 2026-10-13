<?php
/* Regional tariffs. Only the connection IP selects a market; client prices,
 * cookies, query strings and forwarded headers never authorize a lower price. */
function yza_market_country($ip)
{
    $packed = @inet_pton((string) $ip);
    if ($packed === false) return '';
    if (strlen($packed) === 16 && substr($packed, 0, 12) === str_repeat("\0", 10) . "\xff\xff") {
        $packed = substr($packed, 12);
    }
    if (!filter_var(inet_ntop($packed), FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return '';
    $width = strlen($packed);
    $file = __DIR__ . '/data/geoip/ipv' . ($width === 4 ? '4' : '6') . '.bin';
    $size = $width * 2 + 2;
    $fp = @fopen($file, 'rb');
    if (!$fp) return '';
    $stat = fstat($fp);
    if (!$stat || $stat['size'] % $size !== 0) { fclose($fp); return ''; }
    $lo = 0; $hi = intdiv($stat['size'], $size) - 1; $country = '';
    while ($lo <= $hi) {
        $mid = intdiv($lo + $hi, 2);
        if (fseek($fp, $mid * $size) !== 0) break;
        $row = fread($fp, $size);
        if (strlen($row) !== $size) break;
        if (strcmp($packed, substr($row, 0, $width)) < 0) $hi = $mid - 1;
        elseif (strcmp($packed, substr($row, $width, $width)) > 0) $lo = $mid + 1;
        else { $country = substr($row, -2); break; }
    }
    fclose($fp);
    return $country;
}

function yza_market_for_country($country)
{
    if (function_exists('yza_pricing_enabled') && yza_pricing_enabled()) {
        $zones = yza_pricing_rules()['zones'];
        if (($zones['retailPolicy'] ?? '') === 'morocco_vs_international') {
            // Only a server-resolved Moroccan IP receives the Morocco tariff.
            // An unknown country uses the canonical international fallback.
            return strtoupper((string) $country) === 'MA' ? 'MAD' : 'EUR';
        }
        return in_array(strtoupper((string) $country), $zones['europeCountries'], true) ? 'EUR' : 'MAD';
    }
    // Europe including non-EU countries. Africa and other/unknown countries
    // retain the existing MAD default. No timezone or browser-language guesses.
    $europe = explode(' ', 'AL AD AT BY BE BA BG HR CY CZ DK EE FO FI FR DE GI GR GG VA HU IS IE IM IT JE XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SJ SE CH TR UA GB AX');
    return in_array(strtoupper((string) $country), $europe, true) ? 'EUR' : 'MAD';
}

function yza_market_context()
{
    static $context;
    if ($context === null) {
        $country = yza_market_country(isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '');
        $rate = function_exists('yza_pricing_enabled') && yza_pricing_enabled() ? yza_pricing_rules()['checkout']['eurSettlementRate'] : 11;
        $context = array('country' => $country, 'market' => yza_market_for_country($country), 'eurRate' => $rate,
            'available' => is_readable(__DIR__ . '/data/geoip/ipv4.bin') && is_readable(__DIR__ . '/data/geoip/ipv6.bin'));
    }
    return $context;
}

function yza_market_default_eur($priceDh)
{
    // Freeze the existing storefront fallback conversion and psychological
    // rounding as the migration default; subsequent EUR edits are independent.
    $amount = (int) $priceDh * 0.093681;
    $step = $amount >= 100 ? 10 : 1;
    return (int) (round($amount / $step) * $step);
}

function yza_market_eur_price(array $product)
{
    if (function_exists('yza_pricing_enabled') && yza_pricing_enabled() && !isset($product['priceEur'])) {
        throw new RuntimeException('Explicit EUR price unavailable');
    }
    return isset($product['priceEur']) ? (int) $product['priceEur']
        : yza_market_default_eur(isset($product['priceDh']) ? $product['priceDh'] : 0);
}

function yza_market_price_dh(array $product, $market)
{
    // Existing gateway, shipping, discounts, Woo and tracking settle in MAD.
    // Whole EUR tariffs * existing 11 DH/EUR rate preserve integer-DH arithmetic.
    $rate = function_exists('yza_pricing_enabled') && yza_pricing_enabled() ? yza_pricing_rules()['checkout']['eurSettlementRate'] : 11;
    return $market === 'EUR' ? yza_market_eur_price($product) * $rate : (int) $product['priceDh'];
}
