<?php
// Read-only verification; credentials remain in place on the server.
require '/home/u800901920/domains/yza-shop.com/public_html/catalog-admin/lib/publisher.php';
$contract=yza_catalog_storefront_contract();
$release=yza_catalog_load_current();
yza_catalog_validate_restore_candidate($release,$contract);
echo json_encode(array('ok'=>true,'storefrontContractValid'=>true,'catalogueValid'=>true,'revision'=>$release['revision'],'products'=>count($release['products'])))."\n";
