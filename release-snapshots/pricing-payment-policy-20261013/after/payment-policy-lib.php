<?php
/** New orders: COD only to Morocco; card to every destination. */
function yza_payment_policy_error($method, $countryCode, $endpoint)
{
    $method = strtolower(trim((string) $method));
    $countryCode = strtoupper(trim((string) $countryCode));
    if ($endpoint === 'card') return $method === 'card' ? '' : 'method_invalid';
    if ($method !== 'cod') return 'method_invalid';
    return $countryCode === 'MA' ? '' : 'payment_destination_invalid';
}
function yza_payment_method_label($method, $lang)
{
    $labels = array(
        'fr' => array('cod'=>'Paiement à la livraison', 'card'=>'Carte bancaire'),
        'en' => array('cod'=>'Cash on delivery', 'card'=>'Card payment'),
        'es' => array('cod'=>'Pago contra entrega', 'card'=>'Tarjeta bancaria'),
        'tr' => array('cod'=>'Kapıda ödeme', 'card'=>'Banka kartı'),
        'ar' => array('cod'=>'الدفع عند الاستلام', 'card'=>'بطاقة بنكية'));
    return ($labels[$lang] ?? $labels['fr'])[$method] ?? '';
}
