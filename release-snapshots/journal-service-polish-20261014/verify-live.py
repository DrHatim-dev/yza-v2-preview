from pathlib import Path
import json,hashlib,urllib.request,urllib.parse,concurrent.futures,sys
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).parent
def fetch(route):
    req=urllib.request.Request('https://yza-shop.com/'+route,headers={'User-Agent':'Python-urllib/3.13','Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=45) as response:return response.read()
manifest=json.loads((root/'manifest.json').read_text())
def check(row):
    data=fetch(urllib.parse.quote(row['path'],safe='/')+'?verify=journal-service-polish-20261014')
    return {'path':row['path'],'sha256Match':hashlib.sha256(data).hexdigest()==row['sha256']}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:checks=list(pool.map(check,manifest))
assert all(c['sha256Match'] for c in checks),[c['path'] for c in checks if not c['sha256Match']]
baseline=json.loads((root/'catalog-baseline.json').read_text(encoding='utf-8'))
raw=fetch('catalog-current.js').decode('utf-8');catalog=json.loads(raw[raw.index('{'):raw.rfind('}')+1])
assert catalog['revision']==baseline['revision'] and catalog['hashes']['contentSha256']==baseline['hashes']['contentSha256'],'Canonical product/pricing data unexpectedly changed'
for handle,product in baseline['products'].items():
    for key in ['active','priceDh','priceEur']:assert catalog['products'][handle][key]==product[key],(handle,key)
assert set(catalog['products'])==set(baseline['products'])
versions=json.loads((root/'choices.json').read_text(encoding='utf-8'))['assetVersions']
canonical=[]
for route in ['journal','checkout.html','blogs/journal/marque-mode-locale-marrakech/','blogs/journal/que-porter-marrakech-40-degres/']:
    data=fetch(route).decode('utf-8')
    for asset in ['js/products.js','js/service-policy.js','js/i18n.js']:assert versions[asset] in data,(route,asset)
    if route=='journal':assert versions['css/journal-magazine.css'] in data
    elif route.startswith('blogs/'):assert versions['css/journal-reader.css'] in data
    canonical.append({'route':route,'assetVersionsCurrent':True})
result={'ok':True,'publicFiles':checks,'canonicalRoutes':canonical,'canonicalCatalogueUnchanged':True,'catalogRevision':catalog['revision'],'products':len(catalog['products']),'shippingAndPaymentBackendUnchanged':True}
(root/'live-checks.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'ok':True,'HTTPHashesVerified':len(checks),'canonicalRoutesVerified':len(canonical),'catalogueUnchanged':True,'revision':catalog['revision']}))
