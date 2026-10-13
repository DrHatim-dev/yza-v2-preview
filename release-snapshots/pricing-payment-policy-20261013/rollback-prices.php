<?php
if(PHP_SAPI!=='cli')exit(1);
$doc='/home/u800901920/domains/yza-shop.com/public_html';
require $doc.'/catalog-admin/lib/publisher.php';
require_once $doc.'/catalog-pricing-sync.php';
$receipt=json_decode(file_get_contents(__DIR__.'/price-publication.json'),true);
$old=json_decode(file_get_contents(__DIR__.'/before-pricing-export.json'),true);
$new=json_decode(file_get_contents(__DIR__.'/price-proposal.json'),true);
$current=yza_catalog_load_current();
if(!$current||$current['revision']!==$receipt['revision']){fwrite(STDERR,"ABORT: another catalogue release is active.\n");exit(1);}
$prices=array();foreach($new['prices'] as $id=>$_){$prices[$id]=array('priceEur'=>(int)($old['records'][$id.':EUR']['priceMinor']/100));}
$proposal=array('schemaVersion'=>1,'baseHash'=>$current['hashes']['contentSha256'],'prices'=>$prices,'rules'=>$old['rules'],'effectiveAt'=>'on_approval');
yza_pricing_validate_proposal($proposal);
if(($argv[1]??'check')!=='apply'){echo "Rollback pricing preflight OK\n";exit;}
$id=yza_pricing_queue_proposal($proposal,'Rollback of owner-authorized pricing update 2026-10-13');
$result=yza_pricing_approve($id,'owner-authorized-rollback',$proposal['baseHash']);
echo json_encode($result)."\n";
