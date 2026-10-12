# YZA Journal magazine design and header repair — 12 October 2026

Live URL: https://yza-shop.com/journal#articles-nawal

The Journal body implements Hatim's selected white magazine reference: serif masthead, category tabs, one featured story, nine cards using the approved original photos, compact archive links, three collection cards and inline newsletter. The shared header and footer retain their design. The newsletter popup remains disabled.

The urgent header repair was published first. The V2 stylesheet's `top:0 !important` overrode the announcement height measured by `chrome.js`, so the announcement could cover the logo on scroll. The header now uses `--yza-ann-h`, with its existing reserve as a fallback. All 59 public HTML references to this stylesheet have a new cache version. No shared footer changes were made.

Article titles display on a maximum of two lines. Full wording remains in HTML and title tooltips. Existing article pages also receive the readability stylesheet and spacing corrections; their texts, products and photos remain intact. All 30 previously listed guides remain available in the archive expander. The category controls filter the ten Nawal stories. CSS selectors for the magazine layout are scoped to `.jm-journal`.

The former Journal newsletter form only tracked the submit action and displayed a thank-you message; it never called a subscription endpoint. The new form uses the site's existing `.newsletter__form` handler and `/subscribe.php`, with email validation, honeypot, pending state, failure retry and source `journal`. Failure retains the typed email. No real customer subscriptions or orders were created during testing.

## Deployment

This is a targeted snapshot of the verified live V2, not a full deployment of the preview branch or legacy `source/`. Existing production media and shared scripts remain dependencies. The two releases are intentionally separate so the urgent header fix went live before design changes:

1. Header: 60 files; server directory `/home/u800901920/yza-header-offset-20261012-r1`; backup `before.tar.gz`; hashguarded `rollback.sh`.
2. Journal: 46 files (44 replaced, 2 new); server directory `/home/u800901920/yza-journal-magazine-20261012-r1`; backup `before.tar.gz`; hashguarded `rollback.sh`.

Each release checks every original live hash before replacing any files, backs up the replaced public files, swaps files atomically and verifies every final hash. Assets were swapped before HTML. No catalog, checkout, subscriber storage, private files, WordPress files, media or footer scripts were uploaded. The `staging/` union contains 63 final public files from both releases; `final-manifest.json` records their hashes. The two manifests retain the separate before states for rollback.

The local legacy `source/` received only the Journal body and Journal assets for future integration. Its unrelated CRO code and shared shell were preserved. It must not be deployed wholesale over V2.

## Verification

Header: 36 live route/viewport/scroll states, including Journal, home, bags, checkout and a legacy article, with the logo wholly inside the header and below the announcement.

Magazine: 19 staged and 19 live page configurations, covering widths 360/390/768/1024/1440, FR/EN/AR shell settings, representative new and legacy article pages, no horizontal overflow, two-line titles, side gutters and link spacing. Header/footer text, dimensions and computed styles were compared with the post-header-repair baseline at 390 and 1440 pixels. All ten primary stories and 30 archive cards were counted. Filters and archive expansion were exercised. Visible images decoded successfully. No uncaught JS errors.

Newsletter: invalid input, server failure and success were tested with intercepted responses. Two test POSTs were intercepted; zero subscriptions reached the real endpoint. This proves the client handler invokes the existing endpoint and handles its HTTP responses; it does not prove email delivery by an external provider.

Screenshots and JSON evidence are saved in the local artifact folder. GitHub stores the public files, manifests, scripts and JSON evidence. No credentials, private storage or customer data are included.
