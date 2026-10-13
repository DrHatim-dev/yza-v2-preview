from pathlib import Path
import urllib.request,urllib.parse,json,hashlib,concurrent.futures,sys
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).parent
base='https://yza-shop.com/'
def fetch(route):
    req=urllib.request.Request(base+route,headers={'User-Agent':'Python-urllib/3.13','Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=45) as response:return response.read(),dict(response.headers)
raw,headers=fetch('catalog-current.js')
text=raw.decode('utf-8');start=text.index('{');end=text.rfind('}')+1
catalog=json.loads(text[start:end])
(root/'after-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False),encoding='utf-8')
export,_=fetch('pricing-export.php')
(root/'after-pricing-export.json').write_bytes(export)
before=json.loads((root/'before-catalog.json').read_text(encoding='utf-8'))
proposal=json.loads((root/'price-proposal.json').read_text(encoding='utf-8'))
assert set(catalog['products'])==set(before['products']) and len(catalog['products'])==33
changed=[]
for handle,p in catalog['products'].items():
    old=before['products'][handle]
    assert p['priceDh']==old['priceDh'],handle
    expected=proposal['prices'].get(handle,{}).get('priceEur',old['priceEur'])
    assert p['priceEur']==expected,handle
    if p['priceEur']!=old['priceEur']:changed.append(handle)
    ignored={'priceEur','priceEurChangedAt'}
    assert {k:v for k,v in p.items() if k not in ignored}=={k:v for k,v in old.items() if k not in ignored},'Unexpected product change '+handle
assert len(changed)==17
assert catalog['commerce']['shipping']==before['commerce']['shipping']
assert catalog['commerce']['cart']==before['commerce']['cart']
assert catalog['commerce']['checkout']==before['commerce']['checkout']
assert catalog['commerce']['zones']==proposal['rules']['zones']
projection=json.loads(export)
assert projection['catalogRevision']==catalog['revision']
assert len(projection['records'])==66
for record in projection['records'].values():
    product=catalog['products'][record['productId']]
    assert record['priceMinor']==product['priceEur' if record['currency']=='EUR' else 'priceDh']*100
    assert record['zone']==('international' if record['currency']=='EUR' else 'morocco')
manifest=json.loads((root/'manifest.json').read_text())
def check(row):
    route=urllib.parse.quote(row['path'],safe='/')
    data,_=fetch(route+'?verify=pricing-payment-20261013')
    return {'path':row['path'],'match':hashlib.sha256(data).hexdigest()==row['sha256']}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:checks=list(executor.map(check,[row for row in manifest if not row['path'].endswith('.php')]))
assert all(c['match'] for c in checks),[c['path'] for c in checks if not c['match']]
canonical=[]
for route in ('checkout.html','journal','blogs/journal/marque-mode-locale-marrakech/'):
    data,_=fetch(route)
    assert b'29fedcfec06ff020' in data and b'b6d7d58927485a28' in data,route
    if route=='checkout.html':assert b'cca27d575ac932ae' in data
    canonical.append({'route':route,'currentScriptVersions':True})
marketdata,marketheaders=fetch('market.php')
market=json.loads(marketdata)
assert market['ok'] and market['market']==('MAD' if market['country']=='MA' else 'EUR')
assert 'no-store' in marketheaders.get('Cache-Control','')
result={'ok':True,'revision':catalog['revision'],'products':33,'publicProducts':len(catalog['publicHandles']),'changedEurPrices':17,'changedMoroccoPrices':0,'shippingAndDiscountsUnchanged':True,'publicFileChecks':checks,'canonicalRoutes':canonical,'liveConnectionMarket':market}
(root/'live-checks.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k not in ('publicFileChecks','canonicalRoutes','liveConnectionMarket')}))
print('HTTP hashes verified:',len(checks),'Canonical routes:',len(canonical),'Market:',market['market'])
