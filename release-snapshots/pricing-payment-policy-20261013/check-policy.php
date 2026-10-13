<?php
// Read-only checks against staged public code and a public catalogue fixture.
$dir=__DIR__;
$GLOBALS['fixture']=json_decode(file_get_contents($dir.'/proposed-catalog.json'),true);
function yza_catalog_load_current(){return $GLOBALS['fixture'];}
function yza_catalog_database_config(){return array('pricingSync'=>true);}
function yza_catalog_canonicalize($v){if(is_array($v)){foreach($v as &$item)$item=yza_catalog_canonicalize($item);unset($item);if(array_keys($v)!==range(0,count($v)-1))ksort($v);}return $v;}
function yza_catalog_json_encode($v){return json_encode($v,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);}
require $dir.'/staging/catalog-pricing.php';
require $dir.'/staging/market-lib.php';
require $dir.'/staging/payment-policy-lib.php';
function check($condition,$label){if(!$condition)throw new RuntimeException($label);$GLOBALS['checks']++;}
$GLOBALS['checks']=0;
$rules=$GLOBALS['fixture']['commerce'];
check(yza_pricing_rules_valid($rules),'new rules valid');
$old=json_decode(file_get_contents($dir.'/before-catalog.json'),true);
check(yza_pricing_rules_valid($old['commerce']),'rollback rules valid');
$bad=$rules;$bad['zones']['retailPolicy']='unknown';check(!yza_pricing_rules_valid($bad),'unknown policy rejected');
$bad=$rules;$bad['zones']['defaultCurrency']='MAD';check(!yza_pricing_rules_valid($bad),'unsafe fallback rejected');
foreach(array('MA'=>'MAD','FR'=>'EUR','US'=>'EUR','AE'=>'EUR','GB'=>'EUR','SN'=>'EUR','JP'=>'EUR',''=>'EUR') as $country=>$expected){
    check(yza_market_for_country($country)===$expected,'market '.$country);
    foreach(array('cod','card','rib','iban','paypal','other') as $method){
        check((yza_payment_policy_error($method,$country,'order')==='')===($method==='cod'&&$country==='MA'),'non-card guard');
        check((yza_payment_policy_error($method,$country,'card')==='')===($method==='card'),'card guard');
    }
}
$changed=0;
foreach($GLOBALS['fixture']['products'] as $id=>$p){
    check($p['priceDh']===$old['products'][$id]['priceDh'],'Morocco unchanged');
    check(yza_market_price_dh($p,'MAD')===$p['priceDh'],'Morocco settlement');
    check(yza_market_price_dh($p,'EUR')===$p['priceEur']*11,'international settlement');
    if($p['priceEur']!==$old['products'][$id]['priceEur'])$changed++;
}
check($changed===17,'17 retail price changes');
check(array_keys($GLOBALS['fixture']['products'])===array_keys($old['products']),'no new products');
check($rules['shipping']===$old['commerce']['shipping'],'shipping preserved');
check($rules['cart']===$old['commerce']['cart'],'discounts preserved');
$export=yza_pricing_export($GLOBALS['fixture']);
foreach($export['records'] as $record)check($record['zone']===($record['currency']==='EUR'?'international':'morocco'),'export zone');
echo json_encode(array('ok'=>true,'checks'=>$GLOBALS['checks'],'changedEurPrices'=>$changed,'products'=>count($GLOBALS['fixture']['products'])))."\n";
