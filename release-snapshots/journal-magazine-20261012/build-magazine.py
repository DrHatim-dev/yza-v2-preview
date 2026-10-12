import pathlib, json, re, html, hashlib, tarfile, sys
sys.stdout.reconfigure(encoding='utf-8')
root = pathlib.Path(__file__).resolve().parent
stage = root / 'journal-staging'
source = (stage / 'blogs/journal/index.html').read_text(encoding='utf-8')
articles = json.loads((root.parent / 'journal-articles-20261012/articles.json').read_text(encoding='utf-8'))
esc = lambda s: html.escape(s, quote=True)
categories = {1:'Style', 2:'Style', 3:'Savoir-faire', 4:'Style', 5:'Style', 6:'Cadeaux', 7:'Cadeaux', 8:'Savoir-faire', 9:'Marrakech', 10:'Savoir-faire'}
filters = {1:'style fruit-market', 2:'style marrakech', 3:'savoir-faire marrakech', 4:'style marrakech', 5:'style', 6:'cadeaux fruit-market', 7:'cadeaux fruit-market', 8:'savoir-faire', 9:'marrakech savoir-faire', 10:'savoir-faire'}
def photo(a, eager=False):
    return f'<img src="{esc(a["cover"])}" alt="{esc(a["coverAlt"])}" width="{a["coverWidth"]}" height="{a["coverHeight"]}" loading="{"eager" if eager else "lazy"}" decoding="async"'+(' fetchpriority="high"' if eager else '')+'>'
def story(a, featured=False):
    n=a['number']; url='/blogs/journal/'+a['slug']+'/'
    return f'''<article class="jm-story{' jm-feature' if featured else ''}" data-nawal-article="{n}" data-jm-categories="{filters[n]}">
<a class="jm-story__photo" href="{url}" aria-label="{esc(a['title'])}">{photo(a,featured)}</a>
<div class="jm-story__body"><p class="jm-category">{categories[n]}</p>
<h2 class="jm-story-title" title="{esc(a['title'])}"><a href="{url}">{esc(a['title'])}</a></h2>
<p class="jm-meta">Par Nawal · <time datetime="2026-10-12">12 octobre 2026</time></p>
<p class="jm-teaser">{esc(a['description'])}</p>
<a class="jm-read" href="{url}" aria-label="Lire l’article : {esc(a['title'])}">Lire l’article <span aria-hidden="true">→</span></a></div></article>'''
old = []; seen = set()
for card in re.findall(r'<article\b.*?</article>',source,re.S):
    if 'article-card' not in card.split('>')[0] or 'data-nawal-article' in card.split('>')[0]: continue
    url = re.search(r'href="([^"]+)"',card)[1]
    if url in seen: continue
    seen.add(url); old.append(card)
assert len(old)==30,len(old)
tabs = [('Tous','all'),('Style','style'),('Savoir-faire','savoir-faire'),('Fruit Market','fruit-market'),('Cadeaux','cadeaux'),('Marrakech','marrakech')]
catalog = json.loads((root.parent/'journal-articles-20261012/catalog-current.json').read_text(encoding='utf-8'))['products']
bag = catalog['la-sculpture-xs-basket-bag-ss26']['image']
top = 'assets/products/jawhara/client/top-foulard-02.jpg'
shop = [('/collections/sacs','Paniers & Sacs',bag,'Panier en raffia YZA aux anses rouges'),('/collections/charms','Charms','/assets/products/fruit-market/charm-whole-lemon.jpg','Citron en raffia crocheté à la main'),('/collections/pret-a-porter','Prêt-à-porter',top,'Top foulard YZA porté')]
shop_cards = ''.join(f'<a class="jm-collection" href="{url}"><img src="/{image.lstrip("/")}" alt="{alt}" width="900" height="600" loading="lazy" decoding="async"><h3>{label}</h3><span>Voir la sélection <span aria-hidden="true">→</span></span></a>' for url,label,image,alt in shop)
main = '''<main class="jm-journal" lang="fr" dir="ltr" data-blog-service-trust>
<div class="jm-container">
<section class="jm-masthead" aria-labelledby="jm-title"><h1 id="jm-title" title="Le Journal de Nawal">Le Journal<br>de Nawal</h1><p>Les histoires de l’atelier, les pièces que l’on porte<br class="jm-desktop-break"> et les réponses de Nawal à vos vraies questions.</p></section>
<nav class="jm-tabs" aria-label="Catégories du Journal">'''+''.join(f'<button type="button" data-jm-filter="{key}" aria-pressed="{"true" if key=="all" else "false"}">{label}</button>' for label,key in tabs)+'''</nav>
<section id="articles-nawal" class="jm-articles" aria-label="Les articles de Nawal">'''+story(articles[0],True)+'''
<div class="jm-section-head jm-stories-head"><h2>À lire en ce moment</h2><p data-jm-count>10 articles</p></div>
<div class="jm-story-grid">'''+''.join(story(a) for a in articles[1:])+'''</div><p class="jm-empty" data-jm-empty hidden>Aucun article dans cette catégorie pour le moment.</p><p class="jm-filter-status" data-jm-filter-status role="status" aria-live="polite"></p></section>
<section class="jm-archives" aria-labelledby="jm-archive-title"><div class="jm-section-head"><div><h2 id="jm-archive-title">Les archives du Journal</h2><p>Retrouvez tous nos guides, conseils et histoires.</p></div><a class="jm-read" href="#jm-all-guides" data-jm-open-archives>Voir les 30 guides <span aria-hidden="true">→</span></a></div>
<div class="jm-archive-links"><a href="/blogs/journal/handmade-by-women-gueliz-atelier/"><strong>Les mains de Guéliz</strong><span>Rencontrez les artisanes de notre atelier.</span><b aria-hidden="true">→</b></a><a href="/blogs/journal/fruit-charms-tiny-postcards-from-marrakech/"><strong>Pourquoi des fruits ?</strong><span>Une histoire de couleurs et de souvenirs.</span><b aria-hidden="true">→</b></a><a href="/blogs/journal/fruit-earrings-handmade-raffia-detail/"><strong>Porter le raffia</strong><span>Nos conseils de style au quotidien.</span><b aria-hidden="true">→</b></a></div>
<details id="jm-all-guides" class="jm-all-guides"><summary>Parcourir les 30 guides</summary><div class="article-grid jm-guide-grid">'''+''.join(old)+'''</div></details></section>
<section class="jm-shop" aria-labelledby="jm-shop-title"><div class="jm-section-head"><div><h2 id="jm-shop-title">Les pièces du Journal</h2><p>Les indispensables de la saison, directement de l’atelier.</p></div><a class="jm-read" href="/collections">Découvrir la collection <span aria-hidden="true">→</span></a></div><div class="jm-collection-grid">'''+shop_cards+'''</div></section>
<section class="jm-newsletter blog-newsletter" aria-labelledby="jm-news-title"><div><h2 id="jm-news-title">Les lettres de l’atelier</h2><p>Nos nouveautés, nos histoires et nos offres en avant-première.</p></div><form class="jm-newsletter__form newsletter__form" data-news-source="journal" novalidate><label class="jm-visually-hidden" for="jm-email">Votre adresse e-mail</label><input id="jm-email" name="email" type="email" autocomplete="email" placeholder="Votre adresse e-mail" required><input class="jm-honeypot" name="yza_hp_note" tabindex="-1" aria-hidden="true" autocomplete="off"><button type="submit">S’inscrire</button><p class="jm-news-message" data-news-msg role="status" aria-live="polite" hidden></p></form></section>
</div></main>'''
assert len(re.findall(r'<main\b',source))==1
value = re.sub(r'<main\b.*?</main>',lambda m:main,source,flags=re.S)
css=(root/'magazine.css').read_text(encoding='utf-8')
js=(root/'magazine.js').read_text(encoding='utf-8')
for rel,content in [('css/journal-magazine.css',css),('js/journal-magazine.js',js)]:
    p=stage/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content,encoding='utf-8',newline='\n')
cssv=hashlib.sha256(css.encode()).hexdigest()[:16];jsv=hashlib.sha256(js.encode()).hexdigest()[:16]
value=value.replace('</head>',f'<link rel="stylesheet" href="/css/journal-magazine.css?v={cssv}">\n</head>')
value=value.replace('</body>',f'<script defer src="/js/journal-magazine.js?v={jsv}"></script>\n</body>')
(stage/'blogs/journal/index.html').write_text(value,encoding='utf-8',newline='\n')
manifest=json.loads((root/'journal-manifest.json').read_text(encoding='utf-8'))
for x in manifest['changed']:x['sha256']=hashlib.sha256((stage/x['path']).read_bytes()).hexdigest()
for rel in ['css/journal-magazine.css','js/journal-magazine.js']:
    manifest['changed'].append({'path':rel,'action':'new','sha256':hashlib.sha256((stage/rel).read_bytes()).hexdigest(),'before':'-'})
manifest['magazineCssVersion']=cssv;manifest['magazineJsVersion']=jsv
manifest['changed'].sort(key=lambda x:(x['path'].endswith('.html'),x['path']))
(root/'journal-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
(root/'journal-manifest.tsv').write_text(''.join('\t'.join([x['path'],x['sha256'],x['action'],x['before']])+'\n' for x in manifest['changed']),encoding='utf-8',newline='\n')
with tarfile.open(root/'journal-files.tar.gz','w:gz') as t:
    for x in manifest['changed']:t.add(stage/x['path'],arcname=x['path'])
print(json.dumps({'files':len(manifest['changed']),'primaryArticles':len(articles),'archives':len(old),'magazineCss':cssv,'magazineJs':jsv,'collectionPhotos':[x[2] for x in shop]}))
