#!/bin/bash
set -euo pipefail
REL="$(cd "$(dirname "$0")" && pwd)"
DOC=/home/u800901920/domains/yza-shop.com/public_html
cd "$REL"
while IFS=$'\t' read -r path sha before; do
  [ "$(sha256sum "$DOC/$path" | cut -c1-64)" = "$sha" ] || { echo "ABORT later change: $path"; exit 1; }
done < manifest.tsv
echo 'Rollback preflight OK'
[ "${1:-check}" = restore ] || exit 0
mkdir -p rollback-staging
tar xzf rollback-before.tar.gz -C rollback-staging
while IFS=$'\t' read -r path sha before; do
  [ "$(sha256sum "rollback-staging/$path" | cut -c1-64)" = "$before" ] || exit 1
  target="$DOC/$path";tmp="$(dirname "$target")/.rollback.$$.$(basename "$target")"
  cp "rollback-staging/$path" "$tmp";chmod 644 "$tmp";mv -f "$tmp" "$target"
  [ "$(sha256sum "$target" | cut -c1-64)" = "$before" ] || exit 1
done < manifest.tsv
echo 'Previous public files restored'
