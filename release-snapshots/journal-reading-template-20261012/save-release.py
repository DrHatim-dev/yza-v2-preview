from pathlib import Path
import re,json,zipfile,hashlib,sys
sys.stdout.reconfigure(encoding='utf-8')
R=Path(__file__).resolve().parent;W=R.parent.parent
rows=json.loads((R/'manifest.json').read_text(encoding='utf-8'))
for x in rows:
    p=R/'staging'/x['path'];dest=W/'source'/x['path'];dest.parent.mkdir(parents=True,exist_ok=True)
    if x['path'].endswith('.html'):
        # This workspace contains pre-V2 CRO work; sync only article main and its two assets.
        old=dest.read_text(encoding='utf-8');new=p.read_text(encoding='utf-8');main=re.search(r'<main\b.*?</main>',new,re.S).group()
        old=re.sub(r'<main\b.*?</main>',lambda _:main,old,count=1,flags=re.S)
        old=re.sub(r'<(?:link|script)\b[^>]*(?:css/journal-reader.css|js/journal-reader.js)[^>]*>(?:</script>)?\n?','',old)
        css=re.search(r'<link[^>]*href="/css/journal-reader.css[^>]*>',new).group()
        js=re.search(r'<script[^>]*src="/js/journal-reader.js[^>]*></script>',new).group()
        old=old.replace('</head>',css+'\n</head>',1).replace('</body>',js+'\n</body>',1)
        dest.write_text(old,encoding='utf-8',newline='')
    else:dest.write_bytes(p.read_bytes())
readme='''# YZA Journal article reading template — 12 October 2026

The owner selected the centered article-reading mockup with a left contents rail.
The live release applies that template to all 42 comparable Journal article pages:
10 articles by Nawal and 32 existing guides. It preserves every authored paragraph,
introduction, translation, byline, date, FAQ answer and product module. Article 3
uses the two section headings shown in the selected reference.

The compact masthead, 760 px reading column, serif headings, quiet orange accents,
inline photos and compact FAQs are shared in css/journal-reader.css. The contents
menu becomes collapsible on mobile, updates its active section and scrolls below
the sticky header. The existing storefront script still owns FAQ toggles and
commerce. Long article titles shrink within a readable range before the two-line
clamp applies; their full text remains in the DOM and visible-title tooltip.

Legacy cover artwork is moved into the prose with containment for lookbook pages
and sizing diagrams. Nawal articles use their existing inline editorial photos;
their original covers remain in the Journal index and social metadata. No media
files were changed. An existing duplicate service block above legacy articles is
suppressed through the storefront's existing data-blog-service-trust guard. The
shared footer continues to render its services.

## Validation and scope

- 44 deployed public files: 42 article HTML pages and two new versioned assets.
- 439 original body paragraphs plus 42 introductions and bylines preserved.
- 70 staged and 70 live browser configurations, covering every article, five
  screen widths and the existing five-language selector on representative pages.
- Header/footer content, typography, colours and dimensions match the previous
  live page at 390 px and 1440 px.
- FAQ Enter/Space interactions, mobile contents menu, anchor offsets, hydrated
  product modules, photo loads and absence of horizontal overflow verified.
- All 44 deployed hashes verified at origin and through public URLs. Journal
  index, shared header CSS, shared scripts and prior journal stylesheet untouched.
- No real lead, subscription, cart, order or payment requests were submitted.

The deploy changes article layout only. It does not change shipping rules,
catalogue pricing, payment endpoints, the newsletter popup or shared chrome.
Existing French-only Nawal articles remain French; existing multilingual guides
retain their translations.

## Release / rollback

Live URL: https://yza-shop.com/blogs/journal/marque-mode-locale-marrakech/#article
Server release directory: /home/u800901920/yza-article-reader-20261012-r1

deploy.sh first checks staged and pre-release hashes, including eight protected
public files. It backs up all 42 replaced pages and swaps assets before HTML,
using adjacent temporary files and atomic per-file renames. It never deletes
unlisted files. rollback.sh checks for later edits, restores those 42 pages and
removes only the two new reader assets.

This is a targeted V2 release package. The site must already contain the existing
catalogue, storefront scripts and original photos referenced by these pages.
Do not upload the whole workspace source tree over live V2. Local source/ was
synced only in article main elements and the two reader asset references/files.

## Reusing the template for later articles

Copy an existing styled article shell and keep its unchanged storefront header,
footer, scripts and metadata. Include the versioned journal-reader stylesheet
after existing styles and the reader script after blog.js. Its main uses
class="blog-post jr-reader" and data-blog-service-trust. Inside .jr-layout put the
.blog-toc rail and one .article-body with id="article". Place the compact
.jr-masthead inside that article, followed by the authored introduction and prose.
Keep contents links root-absolute to the current article path and its section IDs.
FAQ buttons keep blog-faq__button, aria-expanded and aria-controls, with matching
blog-faq__panel IDs. Keep data-blog-products so the live catalogue supplies prices.
Photo figures stay inside the prose; apply jr-figure--document to diagrams that
must be shown in full. The stylesheet is scoped to .jr-reader throughout.
'''
(R/'README.md').write_text(readme,encoding='utf-8',newline='')
(W/'docs/journal-reading-template-20261012.md').write_text(readme,encoding='utf-8',newline='')
extras=['README.md','manifest.json','manifest.tsv','protected.sha256','deploy.sh','rollback.sh','snapshot.sh','prepare.py','package.py','save-release.py','verify-public.py','check-reader.cjs','preservation-checks.json','staged-checks.json','live-checks.json','public-hash-checks.json']
prefix='release-snapshots/journal-reading-template-20261012/'
files=[{'path':prefix+'public/'+x['path'],'local':str(R/'staging'/x['path'])} for x in rows]
files += [{'path':prefix+name,'local':str(R/name)} for name in extras]
(R/'github-text-files.json').write_text(json.dumps(files,indent=2),encoding='utf-8')
zpath=W/'artifacts/YZA-Journal-reading-template-20261012.zip'
with zipfile.ZipFile(zpath,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for x in rows:z.write(R/'staging'/x['path'],'public/'+x['path'])
    for name in extras:z.write(R/name,name)
    for name in ['files.tar.gz','before.tar.gz','live-reader-top-1440.png','live-reader-top-390.png','live-reader-1440.png','live-reader-390.png','live-atelier-photo.png','live-legacy-top.png']:z.write(R/name,name)
    z.write(W/'artifacts/reading-design-concepts-20261012/01-lecture-centree.png','selected-reference.png')
print(json.dumps({'sourcePagesNarrowlySynced':42,'sharedReaderAssets':2,'githubPublicTextFiles':len(files),'zipBytes':zpath.stat().st_size,'zip':str(zpath)}))
