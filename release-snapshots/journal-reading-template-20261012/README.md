# YZA Journal article reading template — 12 October 2026

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
