# Deployed checkout form simplification — 21 October 2026

The four files in `after/` are the exact production files deployed at 13:55 UTC. The SHA-256 manifest records the previous and deployed bytes. A verified rollback archive is stored outside the public docroot on the server.

The delivery form now labels email and postal code as optional, uses a plain phone label, and groups gift, order note, opt-in address memory and studio pickup help in a native disclosure. The disclosure remains open when changing gift options. Delivery and payment guidance stays close to the Continue button. Copy is supplied in French, English, Spanish, Turkish and Arabic.

Only delivery-form presentation changes. Required fields, validation, phone normalization, checkout diagnostics, payment availability, payment requests, order creation, shipping calculations and product pricing remain unchanged. The order, card, catalog/pricing, cart and delivery-helper production files retain their pre-release hashes.

Validation: 19 focused presentation checks and 41 checkout regression checks passed. The four public deployed files match the manifest. The live browser flow was checked at mobile widths 390 and 320, including French and Arabic, optional blank email/postcode, disclosure/gift state, invalid-phone recovery, and progression to the existing Morocco and international payment options. Shipping remains 50 MAD / 20 EUR EU / 50 EUR elsewhere. Requests that could create orders, leads or test advertising events were blocked. No real order or charge was submitted.

This directory is a restorable V2 release snapshot. The repository's legacy root is preserved.
