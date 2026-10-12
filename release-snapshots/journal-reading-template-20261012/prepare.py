from pathlib import Path
from html.parser import HTMLParser
from html import escape, unescape
import hashlib, json, re, tarfile, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parent
VOID=set('area base br col embed hr img input link meta param source track wbr'.split())
class Node:
    def __init__(self,tag,attrs,start,open_end,parent=None):
        self.tag=tag;self.attrs=dict(attrs);self.start=start;self.open_end=open_end;self.end=open_end;self.close_start=open_end;self.children=[];self.parent=parent
    def has(self,cls):return cls in self.attrs.get('class','').split()
    def walk(self):
        yield self
        for n in self.children:yield from n.walk()
    def find(self,predicate):return next(n for n in self.walk() if predicate(n))
class Tree(HTMLParser):
    def __init__(self,s):
        super().__init__(convert_charrefs=False);self.s=s;self.lines=[0]+[m.end() for m in re.finditer('\n',s)];self.root=Node('root',[],0,len(s));self.stack=[self.root];self.feed(s)
    def pos(self):l,c=self.getpos();return self.lines[l-1]+c
    def handle_starttag(self,tag,attrs):
        start=self.pos();n=Node(tag,attrs,start,start+len(self.get_starttag_text()),self.stack[-1]);self.stack[-1].children.append(n)
        if tag not in VOID:self.stack.append(n)
    def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs);self.stack=self.stack[:-1] if self.stack[-1].tag==tag else self.stack
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag==tag:
                n=self.stack[i];n.close_start=self.pos();n.end=self.s.find('>',n.close_start)+1;self.stack=self.stack[:i];break
def plain(s):return re.sub(r'\s+',' ',unescape(re.sub('<[^>]+>',' ',s))).strip()
def labels(values):return ''.join('<span data-lang="'+lang+'"'+(' hidden' if lang!='fr' else '')+'>'+escape(value)+'</span>' for lang,value in zip(['fr','en','es','tr','ar'],values))
TOC=labels(['Dans cet article','In this article','En este artículo','Bu yazıda','في هذا المقال'])
BACK=labels(['Retour au Journal','Back to the Journal','Volver al Journal','Journal’a dön','العودة إلى المجلة'])
stage=ROOT/'staging';stage.mkdir(exist_ok=True)
for name in ['journal-reader.css','journal-reader.js']:
    path=stage/('css' if name.endswith('.css') else 'js')/name;path.parent.mkdir(exist_ok=True);path.write_bytes((ROOT/name).read_bytes())
cssv=hashlib.sha256((stage/'css/journal-reader.css').read_bytes()).hexdigest()[:16]
jsv=hashlib.sha256((stage/'js/journal-reader.js').read_bytes()).hexdigest()[:16]
reports=[]
for p in sorted((ROOT/'before/blogs/journal').glob('*/index.html')):
    s=p.read_text(encoding='utf-8');tree=Tree(s);main=tree.root.find(lambda n:n.tag=='main');hero=main.find(lambda n:n.has('blog-post-hero'));copy=hero.find(lambda n:n.has('blog-post-hero__copy'));article=main.find(lambda n:n.tag=='article' and n.has('article-body'));layout=main.find(lambda n:n.has('blog-layout'));aside=layout.find(lambda n:n.has('blog-toc'))
    raw=lambda n:s[n.start:n.end]
    inner=lambda n:s[n.open_end:n.close_start]
    h1=copy.find(lambda n:n.tag=='h1');meta=copy.find(lambda n:n.has('blog-meta'));crumb=copy.find(lambda n:n.has('breadcrumbs'));cover=hero.find(lambda n:n.tag=='figure');cover_img=cover.find(lambda n:n.tag=='img')
    intro=next((n for n in copy.children if n.tag=='p' and not n.has('eyebrow')),None)
    content=inner(article)
    # The selected example includes two short editorial subheads, without changing its prose.
    if p.parent.name=='marque-mode-locale-marrakech':
        paragraphs=[n for n in article.children if n.tag=='p']
        additions=[(paragraphs[0].start-article.open_end,'<h2>Une histoire ancrée à Guéliz</h2>'),(paragraphs[1].start-article.open_end,'<h2>Ce qu’on trouve à l’atelier</h2>')]
        for pos,text in reversed(additions):content=content[:pos]+text+content[pos:]
    # Keep FAQ answers visible like the approved template; existing blog.js handles toggling.
    ct=Tree(content);edits=[]
    for i,item in enumerate([n for n in ct.root.walk() if n.has('blog-faq__item')],1):
        button=item.find(lambda n:n.tag=='button');panel=item.find(lambda n:n.has('blog-faq__panel'));panelid=panel.attrs.get('id',f'jr-answer-{i}')
        btag=content[button.start:button.open_end];btag=re.sub(r'aria-expanded="[^"]*"','aria-expanded="true"',btag)
        if 'aria-controls=' not in btag:btag=btag[:-1]+f' aria-controls="{panelid}">'
        ptag=content[panel.start:panel.open_end];ptag=re.sub(r'\s+hidden(?:="[^"]*")?','',ptag)
        if 'id=' not in ptag:ptag=ptag[:-1]+f' id="{panelid}">'
        edits += [(button.start,button.open_end,btag),(panel.start,panel.open_end,ptag)]
    for start,end,text in sorted(edits,reverse=True):content=content[:start]+text+content[end:]
    # Legacy guides have their only editorial image in the former hero. Reuse it inline,
    # with full-page lookbook/diagram artwork contained so captions and measurements survive.
    promoted=''
    if not any(n.tag=='figure' for n in article.walk()):
        promoted=raw(cover).replace('blog-post-hero__media','jr-figure--document').replace(' loading="eager"',' loading="lazy"').replace(' fetchpriority="high"','')
    crumbs=inner(crumb);crumbs=re.sub(r'^\s*<a href="/">.*?</a>\s*<span>/</span>\s*','',crumbs,flags=re.S);crumbs=re.sub(r'href="(?:blogs/journal/|/blogs/journal/|/journal)"','href="/journal"',crumbs)
    masthead=f'<header class="blog-post-hero jr-masthead"><div class="blog-post-hero__copy"><div class="jr-trail"><nav class="breadcrumbs" aria-label="Journal">{crumbs}</nav><a class="jr-back" href="/journal">{BACK}<span aria-hidden="true">→</span></a></div>{raw(h1)}{raw(meta)}</div></header>'
    lead=raw(intro) if intro else ''
    if lead:lead=re.sub(r'<p\b[^>]*>','<p class="jr-intro">',lead,count=1)
    # Existing contents links already use the article path. Ensure root-absolute URLs with <base>.
    toc_nav=raw(aside.find(lambda n:n.tag=='nav'));toc_nav=re.sub(r'href="blogs/journal/','href="/blogs/journal/',toc_nav);toc_nav=toc_nav.replace('<nav>','<nav id="jr-toc-links">',1)
    toc=f'<aside class="blog-toc" aria-label="{escape(plain(TOC.split("<span data-lang=\"en\"")[0]))}"><strong>{TOC}</strong><button class="jr-toc-toggle" type="button" aria-expanded="false" aria-controls="jr-toc-links">{TOC}</button>{toc_nav}</aside>'
    article_open='<article class="article-body" id="article">'
    main_open=s[main.start:main.open_end].replace('class="blog-post"','class="blog-post jr-reader"')
    main_open=main_open[:-1]+f' data-blog-service-trust data-reader-cover="{escape(cover_img.attrs["src"],quote=True)}">'
    after=s[layout.end:main.close_start]
    if '#final-cta' in toc_nav and 'id="final-cta"' not in s:
        after=after.replace('<section class="blog-end-cta section--surface">','<section class="blog-end-cta section--surface" id="final-cta">',1)
    result=main_open+'\n<div class="jr-layout">'+toc+article_open+masthead+lead+promoted+content+'</article></div>\n'+after+'</main>'
    s2=s[:main.start]+result+s[main.end:]
    s2=s2.replace('</head>',f'<link rel="stylesheet" href="/css/journal-reader.css?v={cssv}">\n</head>',1)
    s2=s2.replace('</body>',f'<script src="/js/journal-reader.js?v={jsv}" defer></script>\n</body>',1)
    dest=stage/p.relative_to(ROOT/'before');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(s2,encoding='utf-8',newline='')
    # Guard everything outside main, apart from the two new versioned assets.
    def outside(text):
        text=re.sub(r'<main\b.*?</main>','<main/>',text,flags=re.S)
        return re.sub(r'<(?:link|script)\b[^>]*(?:css/journal-reader.css|js/journal-reader.js)[^>]*>(?:</script>)?\n?','',text)
    assert outside(s)==outside(s2),p
    # All authored paragraphs, links and translations remain in the new reading body.
    for n in article.walk():
        if n.tag=='p':assert inner(n) in s2,(p,'Lost paragraph',inner(n)[:80])
    if intro:assert inner(intro) in s2,(p,'Lost introduction')
    assert raw(meta) in s2,(p,'Lost byline/date')
    reports.append({'path':str(p.relative_to(ROOT/'before')).replace('\\','/'),'legacyCoverMovedInline':bool(promoted),'originalCover':cover_img.attrs['src'],'paragraphsPreserved':sum(n.tag=='p' for n in article.walk()),'faqCount':sum(n.has('blog-faq__item') for n in article.walk()),'shellAndMetadataUnchanged':True})
paths=['css/journal-reader.css','js/journal-reader.js']+[x['path'] for x in reports]
manifest=[]
for path in paths:
    before=ROOT/'before'/path
    manifest.append({'path':path,'sha256':hashlib.sha256((stage/path).read_bytes()).hexdigest(),'action':'replace' if before.exists() else 'new','before':hashlib.sha256(before.read_bytes()).hexdigest() if before.exists() else '-'})
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
(ROOT/'manifest.tsv').write_text(''.join('\t'.join([x['path'],x['sha256'],x['action'],x['before']])+'\n' for x in manifest),encoding='utf-8',newline='')
(ROOT/'preservation-checks.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
with tarfile.open(ROOT/'files.tar.gz','w:gz') as tar:
    for path in paths:tar.add(stage/path,arcname=path)
print(json.dumps({'articles':len(reports),'releaseFiles':len(paths),'originalParagraphsPreserved':sum(x['paragraphsPreserved'] for x in reports),'originalIntroductionsAndBylinesPreserved':True,'headerFooterMetadataUnchanged':True,'cssVersion':cssv,'jsVersion':jsv}))
