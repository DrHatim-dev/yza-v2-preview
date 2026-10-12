from pathlib import Path
import urllib.request,json,hashlib,sys
from concurrent.futures import ThreadPoolExecutor
sys.stdout.reconfigure(encoding='utf-8')
R=Path(__file__).resolve().parent
rows=json.loads((R/'manifest.json').read_text(encoding='utf-8'))
sha,path=(R/'before.sha256').read_text(encoding='utf-8').splitlines()[42].split('  ',1)
assert path=='blogs/journal/index.html'
rows.append({'path':path,'sha256':sha})
def check(row):
    path=row['path'];url='https://yza-shop.com/'+path
    if path.endswith('/index.html'):
        url='https://yza-shop.com/'+ ('journal' if path=='blogs/journal/index.html' else path[:-10])
    else:url+='?v='+row['sha256'][:16]
    try:
        request=urllib.request.Request(url,headers={'User-Agent':'Python-urllib/3.13'})
        with urllib.request.urlopen(request,timeout=30) as response:data=response.read();status=response.status
        actual=hashlib.sha256(data).hexdigest()
        return {'path':path,'status':status,'sha256':actual,'matches':actual==row['sha256']}
    except Exception as e:return {'path':path,'matches':False,'error':str(e)}
with ThreadPoolExecutor(max_workers=3) as pool:checks=list(pool.map(check,rows))
(R/'public-hash-checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
failed=[x for x in checks if not x['matches']]
print(json.dumps({'publicUrlsVerified':len(checks)-len(failed),'failures':failed,'journalIndexUnchanged':checks[-1]['matches']}))
if failed:sys.exit(1)
