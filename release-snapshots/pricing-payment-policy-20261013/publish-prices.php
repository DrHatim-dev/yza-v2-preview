<?php
// CLI-only supported proposal/approval workflow; never install this in the docroot.
if(PHP_SAPI!=='cli')exit(1);
$doc='/home/u800901920/domains/yza-shop.com/public_html';
require $doc.'/catalog-admin/lib/publisher.php';
require_once $doc.'/catalog-pricing-sync.php';
$proposal=json_decode(file_get_contents(__DIR__.'/price-proposal.json'),true);
try{
    yza_pricing_validate_proposal($proposal);
    $current=yza_catalog_load_current();
    if(!$current||!hash_equals($proposal['baseHash'],$current['hashes']['contentSha256']))throw new RuntimeException('Base changed');
    if(count($current['products'])!==33||count($proposal['prices'])!==17)throw new RuntimeException('Unexpected scope');
    foreach($proposal['prices'] as $id=>$prices){
        if(!isset($current['products'][$id])||array_keys($prices)!==array('priceEur'))throw new RuntimeException('Unexpected price field');
    }
    if($proposal['rules']['shipping']!==$current['commerce']['shipping']||$proposal['rules']['cart']!==$current['commerce']['cart'])throw new RuntimeException('Unexpected shipping or discount change');
    if(($argv[1]??'check')!=='apply'){
        echo json_encode(array('ok'=>true,'mode'=>'read-only preflight','baseRevision'=>$current['revision'],'existingProducts'=>33,'priceChanges'=>17))."\n";exit;
    }
    $id=yza_pricing_queue_proposal($proposal,'Owner-authorized existing-product retail update 2026-10-13');
    $result=yza_pricing_approve($id,'owner-authorized-codex',$proposal['baseHash']);
    $receipt=array_merge(array('ok'=>true,'proposalId'=>$id,'beforeRevision'=>$current['revision']),$result);
    file_put_contents(__DIR__.'/price-publication.json',json_encode($receipt,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)."\n");
    echo json_encode($receipt)."\n";
}catch(Throwable $e){fwrite(STDERR,"Pricing workflow failed before verification; inspect server state before retry.\n");exit(1);}
