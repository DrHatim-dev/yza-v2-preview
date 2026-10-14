from pathlib import Path
import json,re,hashlib,html
root=Path(__file__).parent;before=root/'before';after=root/'after';after.mkdir(exist_ok=True)
def replace(s,old,new):
    assert s.count(old)==1,(old[:100],s.count(old));return s.replace(old,new)
def edit(path,fn):
    old=(before/path).read_text(encoding='utf-8');new=fn(old);assert old!=new,path
    out=after/path;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(new,encoding='utf-8',newline='\n')
shipping_title={'fr':'Livraison suivie internationale','en':'Tracked international delivery','es':'Envío internacional con seguimiento','tr':'Takipli uluslararası teslimat','ar':'توصيل دولي مع تتبع'}
shipping_copy={'fr':'Maroc : 50 DH · Union européenne : 20 € · autres destinations : 50 €.','en':'Morocco: 50 DH · European Union: €20 · other destinations: €50.','es':'Marruecos: 50 DH · Unión Europea: 20 € · otros destinos: 50 €.','tr':'Fas: 50 DH · Avrupa Birliği: 20 € · diğer ülkeler: 50 €.','ar':'المغرب: 50 درهم · الاتحاد الأوروبي: 20 يورو · باقي الوجهات: 50 يورو.'}
guarantee_title={'fr':'Garantie à vie','en':'Lifetime guarantee','es':'Garantía de por vida','tr':'Ömür boyu garanti','ar':'ضمان مدى الحياة'}
guarantee_copy={'fr':'À l’atelier de Marrakech. Premier retour sous 30 jours : 100 % pris en charge par YZA.','en':'At our Marrakech atelier. Your first return within 30 days is 100% covered by YZA.','es':'En nuestro taller de Marrakech. YZA cubre el 100 % de tu primera devolución en un plazo de 30 días.','tr':'Marakeş atölyemizde. 30 gün içinde ilk iadenizin masrafını YZA %100 karşılar.','ar':'في أتيليه مراكش. تتكفل YZA بنسبة 100٪ من تكاليف أول إرجاع خلال 30 يوماً.'}
payment_copy={'fr':'Maroc : carte bancaire ou paiement à la livraison. International : carte bancaire.','en':'Morocco: card or cash on delivery. International: card payment.','es':'Marruecos: tarjeta o contra entrega. Internacional: tarjeta.','tr':'Fas: kart veya kapıda ödeme. Uluslararası: kartla ödeme.','ar':'المغرب: البطاقة البنكية أو الدفع عند الاستلام. دولياً: البطاقة البنكية.'}
payment_short={'fr':'Maroc : CB ou livraison · international : CB','en':'Morocco: card or COD · international: card','es':'Marruecos: tarjeta o contra entrega · internacional: tarjeta','tr':'Fas: kart veya kapıda ödeme · uluslararası: kart','ar':'المغرب: بطاقة أو عند الاستلام · دولياً: بطاقة'}
def js_dict(v):return json.dumps(v,ensure_ascii=False)
def feature(s,key,field,value):
    pattern=r"(key: '"+re.escape(key)+r"'[\s\S]*?\b"+field+r': )\{[^\n]*\},'
    assert len(re.findall(pattern,s))==1,(key,field)
    return re.sub(pattern,lambda m:m[1]+js_dict(value)+',',s,count=1)
def products(s):
    for key,field,value in [('morocco-delivery','title',shipping_title),('morocco-delivery','text',shipping_copy),('returns','title',guarantee_title),('returns','text',guarantee_copy),('payment','text',payment_copy),('payment','short',payment_short)]:s=feature(s,key,field,value)
    return s
edit('js/products.js',products)
def policy(s):
    match=re.search(r' const COPY=(\{[^\n]+\});',s);assert match
    copy=json.loads(match[1])
    for lang in copy:
        copy[lang].update({'shippingTitle':shipping_title[lang],'shippingSummary':shipping_copy[lang],'guaranteeTitle':guarantee_title[lang],'guaranteeSummary':guarantee_copy[lang],'paymentSummary':payment_copy[lang]})
    s=s[:match.start(1)]+json.dumps(copy,ensure_ascii=False)+s[match.end(1):]
    match=re.search(r'  returns:(\{[^\n]+\}),',s);assert match
    home={
      'fr':'Garantie à vie à Marrakech. Premier retour sous 30 jours offert.',
      'en':'Lifetime guarantee in Marrakech. First return within 30 days free.',
      'es':'Garantía de por vida en Marrakech. Primera devolución en 30 días gratis.',
      'tr':'Marakeş’te ömür boyu garanti. 30 gün içinde ilk iade ücretsiz.',
      'ar':'ضمان مدى الحياة في مراكش. أول إرجاع خلال 30 يوماً مجاناً.'}
    s=s[:match.start(1)]+js_dict(home)+s[match.end(1):]
    s=replace(s," // Homepage promise band: two lines at most on every screen (~50 characters). The full\n // guarantee, returns and handmade wording stays in the policy block and the product pages.",
      " // Keep the homepage promise concise. Detailed return conditions remain in the policy blocks.")
    s=replace(s," for(const [key,field] of [['morocco-delivery','shipping'],['returns','returns'],['limited','editions']]){\n  const feature=Y.serviceFeature?.(key);if(feature)feature.text=localized(field);\n }",
      " for(const [key,field,title] of [['morocco-delivery','shippingSummary','shippingTitle'],['returns','guaranteeSummary','guaranteeTitle'],['payment','paymentSummary',null],['limited','editions',null]]){\n  const feature=Y.serviceFeature?.(key);if(feature){feature.text=localized(field);if(title)feature.title=localized(title);}\n }")
    return s
edit('js/service-policy.js',policy)
def i18n(s):
    pattern=r"('cart\.acc\.payTxt': )\{[^\n]+\},";assert len(re.findall(pattern,s))==1
    return re.sub(pattern,lambda m:m[1]+js_dict(payment_copy)+',',s,count=1)
edit('js/i18n.js',i18n)

# Every portrait has a chosen focal point, shared by the Journal and related cards.
positions={1:'50% 30%',2:'50% 50%',3:'50% 32%',4:'50% 0%',5:'50% 65%',6:'50% 70%',7:'50% 45%',8:'50% 40%',9:'50% 65%',10:'50% 30%'}
def focal_rules(scope):return '\n'.join(f'{scope} img[data-journal-photo="{n}"]{{--journal-photo-focus:{p}}}' for n,p in positions.items())+'\n'
def magazine(s):
    s=replace(s,'aspect-ratio:1.65;object-fit:cover;object-position:center 38%;','aspect-ratio:3/4;object-fit:cover;object-position:var(--journal-photo-focus,50% 50%);')
    s=replace(s,'grid-template-columns:57% 1fr;','grid-template-columns:40% 1fr;')
    s=replace(s,'aspect-ratio:1.36;object-position:center 65%','aspect-ratio:4/5;object-position:var(--journal-photo-focus,50% 30%)')
    s=replace(s,'grid-template-columns:55% 1fr;','grid-template-columns:44% 1fr;')
    s=replace(s,'aspect-ratio:1.24;object-position:center 62%','aspect-ratio:4/5;object-position:var(--journal-photo-focus,50% 30%)')
    s=replace(s,'.jm-journal .jm-story__photo img{aspect-ratio:1.5}','.jm-journal .jm-story__photo img{aspect-ratio:3/4}')
    s=replace(s,'aspect-ratio:2.1;object-fit:cover;object-position:center;background:#f4f1ec','aspect-ratio:4/5;object-fit:cover;object-position:var(--journal-collection-focus,50% 50%);background:#f4f1ec')
    s=replace(s,'.jm-journal .jm-collection:nth-child(-n+2) img{object-fit:contain;background:#faf9f6}',
      '.jm-journal .jm-collection--bags{--journal-collection-focus:50% 68%}\n.jm-journal .jm-collection--charms{--journal-collection-focus:50% 50%}\n.jm-journal .jm-collection--wear{--journal-collection-focus:50% 28%}')
    s=replace(s,'.jm-journal .jm-collection img{aspect-ratio:1.8}','.jm-journal .jm-collection img{aspect-ratio:4/5}')
    return s+'\n/* Portrait subjects retain their own focal point at every breakpoint. */\n'+focal_rules('.jm-journal')
edit('css/journal-magazine.css',magazine)
edit('css/journal-reader.css',lambda s:s+'\n/* Related portrait thumbnails use the same framing as the Journal listing. */\n.jr-reader .jr-related-portrait{aspect-ratio:3/4}\n.jr-reader .jr-related-portrait img{width:100%;height:100%;object-fit:cover;object-position:var(--journal-photo-focus,50% 50%)}\n'+focal_rules('.jr-reader'))

images=json.loads((root/'current-images.json').read_text(encoding='utf-8'))
photo_ids={p['src']:p['article'] for p in images['stories']}
sizes={p['src']:(p['width'],p['height']) for p in json.loads((root/'photo-sizes.json').read_text())}
choices=[
 ('bags','/assets/products/la-sculpture/client/rouge-xs-01.jpg','Panier La Sculpture aux anses rouges, présenté avec des fruits'),
 ('charms','/assets/products/charms/client/whole-lemon-02.jpg','Charm citron en raffia tenu dans la main'),
 ('wear','/assets/products/jawhara/client/chemise-01.jpg','Chemise Jawhara blanche portée, avec ses manches volantées')]
def attrs(tag,values):
    for key,value in values.items():
        escaped=html.escape(str(value),quote=True)
        if re.search(r'\b'+re.escape(key)+r'="[^"]*"',tag):tag=re.sub(r'(\b'+re.escape(key)+r'=)"[^"]*"',lambda m:m[1]+'"'+escaped+'"',tag,count=1)
        else:tag=tag[:-1]+' '+key+'="'+escaped+'">'
    return tag
changed_related=0
for path in before.rglob('*.html'):
    rel=path.relative_to(before).as_posix();s=path.read_text(encoding='utf-8');old=s
    if rel=='blogs/journal/index.html':
        def mark_story(m):
            block=m[0];number=int(m[1]);return re.sub(r'<img\b[^>]*>',lambda im:attrs(im[0],{'data-journal-photo':number}),block,count=1)
        s=re.sub(r'<article[^>]*data-nawal-article="(\d+)"[\s\S]*?</article>',mark_story,s)
        i=0
        def collection(m):
            global i
            kind,src,alt=choices[i];i+=1;w,h=sizes[src];assert w>0 and h>0
            block=attrs(m[0][:m[0].index('>')+1],{'class':'jm-collection jm-collection--'+kind})+m[0][m[0].index('>')+1:]
            return re.sub(r'<img\b[^>]*>',lambda im:attrs(im[0],{'src':src,'alt':alt,'width':w,'height':h}),block,count=1)
        s=re.sub(r'<a[^>]*class="jm-collection"[\s\S]*?</a>',collection,s);assert i==3
    # Only related/article-card media changes; large reader figures retain the approved layout.
    def related(m):
        global changed_related
        block=m[0];src=re.search(r'<img[^>]*src="([^"]+)"',block)
        if not src or src[1] not in photo_ids:return block
        changed_related+=1
        block=block.replace('class="article-card__media"','class="article-card__media jr-related-portrait"',1)
        return re.sub(r'<img\b[^>]*>',lambda im:attrs(im[0],{'data-journal-photo':photo_ids[src[1]]}),block,count=1)
    s=re.sub(r'<a[^>]*class="article-card__media"[^>]*>[\s\S]*?</a>',related,s)
    if s!=old:
        out=after/rel;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(s,encoding='utf-8',newline='\n')

contract=json.loads((before/'catalog-storefront-contract.json').read_text(encoding='utf-8'))
contract['productsJsSha256']=hashlib.sha256((after/'js/products.js').read_bytes()).hexdigest()
(after/'catalog-storefront-contract.json').write_text(json.dumps(contract,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
assets=['js/products.js','js/service-policy.js','js/i18n.js','css/journal-magazine.css','css/journal-reader.css']
versions={p:hashlib.sha256((after/p).read_bytes()).hexdigest()[:16] for p in assets}
for path in before.rglob('*.html'):
    rel=path.relative_to(before);original=path.read_text(encoding='utf-8');candidate=after/rel;s=(candidate if candidate.exists() else path).read_text(encoding='utf-8')
    for asset,version in versions.items():s=re.sub(r'('+re.escape(asset)+r'\?v=)[^"\s<>]+',lambda m:m[1]+version,s)
    if s!=original:
        candidate.parent.mkdir(parents=True,exist_ok=True);candidate.write_text(s,encoding='utf-8',newline='\n')
(root/'choices.json').write_text(json.dumps({'collectionPhotos':choices,'portraitFocalPoints':positions,'assetVersions':versions,'relatedThumbnails':changed_related},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'service-copy.json').write_text(json.dumps({'shippingTitle':shipping_title,'shippingSummary':shipping_copy,'guaranteeTitle':guarantee_title,'guaranteeSummary':guarantee_copy,'paymentSummary':payment_copy},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'changedFiles':sum(p.is_file() for p in after.rglob('*')),'relatedThumbnails':changed_related,'versions':versions}))
