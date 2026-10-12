import pathlib,hashlib,json,re,tarfile,sys,html
sys.stdout.reconfigure(encoding='utf-8')
root=pathlib.Path(__file__).resolve().parent
before=root/'journal-before';stage=root/'journal-staging'
base=root/'header-staging'
paths=sorted(p.relative_to(base).as_posix() for p in (base/'blogs/journal').rglob('index.html'))
assert len(paths)>=41,len(paths)
for rel in paths:
 p=before/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes((base/rel).read_bytes())
p=before/'css/journal-nawal.css';p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes((root/'before/css/journal-nawal.css').read_bytes())
css=p.read_text(encoding='utf-8')
css+='''
/* Journal readability: two-line story titles and consistent breathing room. */
.blog-page .journal-hero h1{font-size:clamp(3rem,6vw,6rem);line-height:1.03;text-wrap:balance}
.blog-page .journal-hero__copy{display:flex;flex-direction:column;align-items:flex-start}
.blog-page .journal-hero__copy > p{line-height:1.65;margin:0}
.blog-page .journal-hero__actions{display:flex;flex-wrap:wrap;gap:1rem;margin-top:1.5rem}
.blog-page .journal-hero__actions .btn{min-height:48px;margin:0}
.blog-page .journal-intents{gap:.75rem;margin-top:2rem}
.blog-page .article-grid{column-gap:clamp(1.25rem,2.4vw,2rem);row-gap:3rem;align-items:start}
.blog-page .article-card{gap:1.25rem;align-content:start}
.blog-page .article-card__body{display:flex;flex-direction:column;gap:.85rem;min-width:0}
.blog-page .article-card__body :is(h2,h3){font-size:clamp(1.2rem,1.8vw,1.75rem);line-height:1.2;margin:0;min-height:2.4em}
.blog-page :is(.article-card__body h2,.article-card__body h3,.featured-story-grid h2,.featured-story-grid h3,.editorial-card h3,.blog-post-hero h1){display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;text-wrap:pretty}
.blog-page .article-card__body > p:not(.eyebrow){font-size:1rem;line-height:1.65;margin:0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden;min-height:4.95em}
.blog-page .article-card__body > span{display:block;margin-top:.25rem;font-size:.9rem;line-height:1.5}
.blog-page .article-card__media{margin:0}
.blog-page .featured-story-grid{gap:2rem}
.blog-page .featured-story-grid__side{gap:2.5rem}
.blog-page .section-head,.blog-page .blog-section__head{margin-bottom:2rem}
.blog-page .section-head h2,.blog-page .blog-section__head h2{line-height:1.15;margin-top:.5rem}
.blog-page .blog-post-hero{padding-top:clamp(2rem,4vw,3.5rem);align-items:center}
.blog-page .blog-post-hero h1{font-size:clamp(1.8rem,3.6vw,3.5rem);line-height:1.15;margin:1rem 0 1.5rem}
.blog-page .blog-post-hero__dek{line-height:1.7;margin:0 0 1.25rem}
.blog-page .blog-meta{display:flex;flex-wrap:wrap;gap:.5rem 1rem;line-height:1.5}
.blog-page .blog-layout{padding-top:3rem;padding-bottom:3rem}
.blog-page .article-body p{line-height:1.75;margin-bottom:1.5rem}
.blog-page .article-body :is(h2,h3){margin-top:2rem;margin-bottom:1rem;line-height:1.2}
.blog-page .blog-toc nav{display:grid;gap:.85rem;margin-top:1rem}
.blog-page .blog-toc a{line-height:1.55}
.blog-page .blog-newsletter{gap:2rem}
.blog-page .blog-newsletter__form{gap:1rem;margin-top:1rem}
.blog-page .blog-section{padding-block:clamp(2.75rem,6vw,5rem)}
@media(max-width:680px){
 .blog-page .article-grid{row-gap:2.75rem}
 .blog-page .journal-hero__actions{width:100%}
 .blog-page .journal-hero__actions .btn{flex:1 1 240px;text-align:center}
 .blog-page .blog-post-hero h1{font-size:1.9rem}
 .blog-page .blog-layout{padding-block:2rem}
}
'''
version=hashlib.sha256(css.encode()).hexdigest()[:16]
files=[]
for rel in ['css/journal-nawal.css']+paths:
 old=before/rel
 if rel.endswith('.css'):value=css
 else:
  value=old.read_text(encoding='utf-8')
  link='<link rel="stylesheet" href="/css/journal-nawal.css?v='+version+'">'
  if 'journal-nawal.css?v=' in value:value=re.sub(r'<link[^>]*href="/css/journal-nawal\.css\?v=[^"]+"[^>]*>',lambda m:link,value)
  else:value=value.replace('</head>',link+'\n</head>')
  # Full source wording is retained for accessibility, SEO and title tooltips.
  def heading(m):
   attrs=m[2];full=html.unescape(re.sub(r'<[^>]*>','',m[3])).strip()
   if ' title=' not in attrs:attrs+=' title="'+html.escape(full,quote=True)+'"'
   return '<h'+m[1]+attrs+'>'+m[3]+'</h'+m[1]+'>'
  value=re.sub(r'<h([123])([^>]*)>(.*?)</h\1>',heading,value,flags=re.S)
 dest=stage/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(value,encoding='utf-8',newline='\n')
 files.append({'path':rel,'action':'replace','sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'before':hashlib.sha256(old.read_bytes()).hexdigest()})
(root/'journal-manifest.json').write_text(json.dumps({'version':version,'changed':files},indent=2),encoding='utf-8')
(root/'journal-manifest.tsv').write_text(''.join('\t'.join([x['path'],x['sha256'],x['action'],x['before']])+'\n' for x in files),encoding='utf-8',newline='\n')
with tarfile.open(root/'journal-files.tar.gz','w:gz') as tar:
 for x in files:tar.add(stage/x['path'],arcname=x['path'])
print(json.dumps({'journalFiles':len(files),'articlePages':len(paths)-1,'cssVersion':version,'sourceHeadlinesRetained':True}))
