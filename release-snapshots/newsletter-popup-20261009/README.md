# Newsletter popup paused — 9 October 2026

The owner requested that the newsletter popup stay disabled until explicitly reactivated. No automatic end date is configured.

`js/promo-popup.js` preserves the preview implementation. `production-promo-popup.js` is the complete production implementation, retaining production asset paths and all existing content/triggers. Both return immediately while `NEWSLETTER_POPUP_ENABLED` is false. Footer newsletter forms remain available.

Production deployment is manual, independent of this preview repository. It changes only the popup script and its version in seven discovery HTML pages. The script SHA-256 is `99412a6cdf87ad7e3f754713f2c189b38021b4f3c279aa316209f83896d0f56b`; its immutable URL version is `99412a6cdf87ad7e`. Existing checkout/shipping changes and customer data are preserved.

To reactivate after the owner's instruction: use the current production file, set `NEWSLETTER_POPUP_ENABLED` to true, review the still-applicable offer and subscription behavior, bump the script URL version on all discovery pages, then deploy and verify. Do not deploy this whole preview repository over the storefront.
