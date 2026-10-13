<?php
// Read-only tests on the deployed validator, current SQL release and GeoIP data.
$doc='/home/u800901920/domains/yza-shop.com/public_html';
require $doc.'/catalog-order-lib.php';
require $doc.'/payment-policy-lib.php';
$release=yza_catalog_load_current();
if(!$release||count($release['products'])!==33)throw new RuntimeException('Catalogue unavailable');
$countries=array('MA','FR','US','AE','GB','SN','JP');$checks=0;
foreach($countries as $cc){
    if(yza_market_for_country($cc)!==($cc==='MA'?'MAD':'EUR'))throw new RuntimeException('Market mismatch');$checks++;
    $quote=yza_catalog_shipping_quote(array(),100,false,$cc);
    $expected=$cc==='MA'?50:($cc==='FR'?220:550);
    // The shipping quote uses settlement MAD.
    if(($quote['shippingDh']??null)!==$expected && ($quote['shippingCents']??null)!==$expected*100)throw new RuntimeException('Shipping mismatch');$checks++;
    foreach(array('rib','iban') as $method){if(yza_payment_policy_error($method,$cc,'order')!=='method_invalid')throw new RuntimeException('Transfer allowed');$checks++;}
}
$handle='raffia-cherries-charm-ss26';$p=$release['products'][$handle];
foreach(array('MAD','EUR') as $market){
    $items=array(array('handle'=>$handle,'baseHandle'=>$handle,'releaseId'=>$release['revision'],'market'=>$market,'qty'=>1,'price'=>yza_market_price_dh($p,$market)*100,'variant'=>'','rawVariant'=>''));
    $result=yza_catalog_validate_order_items($items,null,7200,false,$market);
    if(($result['status']??'')!=='ok')throw new RuntimeException('Canonical order validation mismatch '.json_encode($result['issues']??array()));$checks++;
}
$geo=array();$fp=fopen($doc.'/data/geoip/ipv4.bin','rb');
while(($row=fread($fp,10))!==false&&strlen($row)===10){$cc=substr($row,-2);if(in_array($cc,array('MA','FR','US','AE'),true)&&!isset($geo[$cc])){$ip=inet_ntop(substr($row,0,4));$resolved=yza_market_country($ip);if($resolved!==$cc)throw new RuntimeException('GeoIP mismatch');$geo[$cc]=array('resolvedCountry'=>$resolved,'market'=>yza_market_for_country($resolved));$checks++;}if(count($geo)===4)break;}
fclose($fp);
echo json_encode(array('ok'=>true,'revision'=>$release['revision'],'checks'=>$checks,'geoipCases'=>$geo,'products'=>count($release['products'])))."\n";
