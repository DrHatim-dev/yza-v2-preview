#!/bin/bash
set -euo pipefail
REL="$(cd "$(dirname "$0")" && pwd)"
DOC=/home/u800901920/domains/yza-shop.com/public_html
MODE="${1:-check}"
cd "$REL"
mkdir -p staging
tar xzf files.tar.gz -C staging
while IFS=$'\t' read -r path sha action before; do
  case "$path" in *.html|catalog-storefront-contract.json|order.php|zazu-checkout.php|market-lib.php|catalog-pricing.php|payment-policy-lib.php|js/checkout.js|js/i18n.js|js/products.js) ;; *) echo 'ABORT unexpected path'; exit 1;; esac
  [[ "$path" != *'..'* && "$path" != *'\'* && "$path" != /* && "$path" != wp/* ]] || exit 1
  [ "$(sha256sum "staging/$path" | cut -c1-64)" = "$sha" ] || { echo "Package mismatch $path"; exit 1; }
  if [ "$action" = replace ]; then
    [ "$(sha256sum "$DOC/$path" | cut -c1-64)" = "$before" ] || { echo "Live changed $path"; exit 1; }
  else
    [ ! -e "$DOC/$path" ] || { echo "Unexpected existing $path"; exit 1; }
  fi
done < manifest.tsv
for path in order.php zazu-checkout.php market-lib.php catalog-pricing.php payment-policy-lib.php; do php -l "staging/$path" >/dev/null; done
echo "Guard and PHP syntax OK: $(wc -l < manifest.tsv) files"
[ "$MODE" = swap ] || exit 0
[ ! -e rollback-before.tar.gz ] || { echo 'Already swapped'; exit 1; }
awk -F'\t' '$3=="replace"{print $1}' manifest.tsv > replaced.txt
tar czf rollback-before.tar.gz -C "$DOC" -T replaced.txt
date -u +%FT%TZ > swap-started.txt
while IFS=$'\t' read -r path sha action before; do
  target="$DOC/$path"; dir=$(dirname "$target"); mkdir -p "$dir"
  tmp="$dir/.pricing-payment.$$.$(basename "$path")"
  cp "staging/$path" "$tmp"; chmod 644 "$tmp"; mv -f "$tmp" "$target"
done < manifest.tsv
while IFS=$'\t' read -r path sha action before; do
  [ "$(sha256sum "$DOC/$path" | cut -c1-64)" = "$sha" ] || exit 1
done < manifest.tsv
date -u +%FT%TZ > swap-finished.txt
echo 'Targeted swap verified'
