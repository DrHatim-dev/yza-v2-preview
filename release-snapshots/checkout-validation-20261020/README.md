# Deployed checkout validation fix — 20 October 2026

The five files in `after/` are byte-identical to the Hostinger production release deployed on 20 October 2026 at 15:48:59 UTC. `manifest.json` records the before/after SHA-256 values.

The checkout accepts and normalizes common Moroccan phone formats, including Arabic/Persian digits and an optional domestic zero after +212. Invalid required fields remain blocked. Validation diagnostics are emitted only when attempting to continue to payment, and repeated unchanged errors are deduplicated. Meta and first-party diagnostics retain bounded field/reason labels while excluding customer field values. The checkout HTML references the updated script versions.

Validation completed: 41 Node checks, four PHP diagnostic-filter checks, ten public HTTP checks, and live browser checks for Morocco, France and the United States. Morocco offers COD and card, international delivery offers card only, and shipping remains 50 MAD / 20 EUR EU / 50 EUR elsewhere. Test order/lead requests were blocked, and no real order or card charge was created.

This directory records the deployed V2 release as a restorable snapshot, following the repository's existing `release-snapshots/` convention. The legacy root and other release branches are preserved. The server-side five-file backup and rollback script remain outside the public docroot.
