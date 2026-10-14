#!/bin/bash
set -euo pipefail
REL="$(cd "$(dirname "$0")" && pwd)"
DOC=/home/u800901920/domains/yza-shop.com/public_html
cd "$REL"
MODE="${1:-check}"
mkdir -p staging
tar xzf files.tar.gz -C staging
while IFS=$'\t' read -r path sha before; do
  case "$path" in *.html|js/products.js|js/i18n.js|js/service-policy.js|css/journal-magazine.css|css/journal-reader.css|catalog-storefront-contract.json) ;; *) echo 'ABORT unexpected path'; exit 1;; esac
  [[ "$path" != *'..'* && "$path" != *'\'* && "$path" != /* && "$path" != wp/* ]] || exit 1
  [ "$(sha256sum "staging/$path" | cut -c1-64)" = "$sha" ] || { echo "Package mismatch $path"; exit 1; }
  [ "$(sha256sum "$DOC/$path" | cut -c1-64)" = "$before" ] || { echo "Live changed $path"; exit 1; }
done < manifest.tsv
echo "Guard verified: $(wc -l < manifest.tsv) existing public files"
[ "$MODE" = swap ] || exit 0
[ ! -e rollback-before.tar.gz ] || { echo 'Already swapped'; exit 1; }
cut -f1 manifest.tsv > replaced.txt
tar czf rollback-before.tar.gz -C "$DOC" -T replaced.txt
[ "$(tar tzf rollback-before.tar.gz | wc -l)" = "$(wc -l < replaced.txt)" ] || { echo 'Incomplete backup'; exit 1; }
date -u +%FT%TZ > swap-started.txt
while IFS=$'\t' read -r path sha before; do
  target="$DOC/$path";tmp="$(dirname "$target")/.journal-polish.$$.$(basename "$target")"
  cp "staging/$path" "$tmp";chmod 644 "$tmp";mv -f "$tmp" "$target"
done < manifest.tsv
while IFS=$'\t' read -r path sha before; do
  [ "$(sha256sum "$DOC/$path" | cut -c1-64)" = "$sha" ] || exit 1
done < manifest.tsv
date -u +%FT%TZ > swap-finished.txt
echo 'Targeted live files verified'
