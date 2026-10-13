#!/bin/bash
# Restore canonical prices first, then public code. Abort after any later release.
set -euo pipefail
REL="$(cd "$(dirname "$0")" && pwd)"
DOC=/home/u800901920/domains/yza-shop.com/public_html
cd "$REL"
while IFS=$'\t' read -r path sha action before; do
  [ "$(sha256sum "$DOC/$path" | cut -c1-64)" = "$sha" ] || { echo "ABORT later code change: $path"; exit 1; }
done < manifest.tsv
php rollback-prices.php check
[ "${1:-check}" = restore ] || exit 0
php rollback-prices.php apply
mkdir -p rollback-staging
tar xzf rollback-before.tar.gz -C rollback-staging
while IFS=$'\t' read -r path sha action before; do
  if [ "$action" = replace ]; then
    target="$DOC/$path"; tmp="$(dirname "$target")/.rollback.$$.$(basename "$target")"
    cp "rollback-staging/$path" "$tmp"; chmod 644 "$tmp"; mv -f "$tmp" "$target"
    [ "$(sha256sum "$target" | cut -c1-64)" = "$before" ] || exit 1
  else
    [ "$path" = payment-policy-lib.php ] || exit 1
    rm -f "$DOC/payment-policy-lib.php"
  fi
done < manifest.tsv
echo 'Canonical prices and public code restored'
