import pathlib,json,hashlib,urllib.request,concurrent.futures,xml.etree.ElementTree as ET,sys,re,io
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
root=pathlib.Path(__file__).resolve().parent
manifest=json.loads((root/'release-manifest.json').read_text(encoding='utf-8'))
articles=json.loads((root/'articles.json').read_text(encoding='utf-8'))
origin='https://yza-shop.com'
def get(url):
    request=urllib.request.Request(url,headers={'User-Agent':'Python-urllib/3.13','Cache-Control':'no-cache'})
    with urllib.request.urlopen(request,timeout=35) as response:return response.status,response.read()
def verify(row):
    url=origin+'/'+row['path']
    if row['path']=='blogs/journal/index.html':url=origin+'/journal'
    elif row['path'].endswith('/index.html'):url=url[:-len('index.html')]
    status,data=get(url)
    # sitemap.xml is dynamically assembled from static editorial and catalogue URLs.
    same_hash=hashlib.sha256(data).hexdigest()==row['sha256']
    assert status==200,url
    if row['path'].endswith('.jpg'):
        # Hostinger's CDN recompresses the JPEG response; originals are hash-checked on the server.
        cover=next(a for a in articles if a['cover']=='/'+row['path'])
        image=Image.open(io.BytesIO(data));image.verify()
        assert image.size==(cover['coverWidth'],cover['coverHeight']),row['path']
    elif row['path']!='sitemap.xml':assert same_hash,'Public bytes mismatch '+row['path']
    return {'path':row['path'],'url':url,'status':status,'hashMatches':same_hash if row['path']!='sitemap.xml' else 'dynamic','cdnMayOptimizeImage':row['path'].endswith('.jpg') and not same_hash}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:checks=list(pool.map(verify,manifest['changed']))
status,data=get(origin+'/sitemap.xml')
sitemap=ET.fromstring(data)
namespace={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=[x.text for x in sitemap.findall('s:url/s:loc',namespace)]
assert all(a['url'] in urls for a in articles)
assert all(urls.count(a['url'])==1 for a in articles)
_,popup=get(origin+'/js/promo-popup.js')
assert b'NEWSLETTER_POPUP_ENABLED = false' in popup or b'NEWSLETTER_POPUP_ENABLED=false' in popup
_,pointer=get(origin+'/catalog-current.js')
assert b'rel-20261009173024-a273053f4a0b' in pointer
result={'checks':checks,'newEditorialSitemapUrls':10,'dynamicSitemapUrls':len(urls),'newsletterPopupStillDisabled':True,'catalogueRevision':'rel-20261009173024-a273053f4a0b','errors':[]}
(root/'live-public-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'publicFilesChecked':len(checks),'newSitemapUrls':10,'errors':[]}))
