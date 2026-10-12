#!/bin/bash
# YZA V2 release (2026-10-07): targeted package swap. Run from the release directory.
#   bash deploy.sh check   -> verify the package and the live "before" state, change nothing
#   bash deploy.sh swap    -> back up, swap, verify
set -euo pipefail
REL="$(cd "$(dirname "$0")" && pwd)"
DOC=/home/u800901920/domains/yza-shop.com/public_html
MODE="${1:-check}"
cd "$REL"
[ -d staging ] || { mkdir -p staging && tar xzf files.tar.gz -C staging; }

fail=0
# 1. Package integrity: every staged file has the manifest hash.
while IFS=$'\t' read -r path sha action before; do
  got=$(sha256sum "staging/$path" | cut -c1-64)
  [ "$got" = "$sha" ] || { echo "PACKAGE MISMATCH $path"; fail=1; }
done < manifest.tsv
# 2. Live state is exactly what the package was built against.
while IFS=$'\t' read -r path sha action before; do
  if [ "$action" = "replace" ]; then
    [ -f "$DOC/$path" ] || { echo "MISSING ON LIVE $path"; fail=1; continue; }
    got=$(sha256sum "$DOC/$path" | cut -c1-64)
    [ "$got" = "$before" ] || { echo "LIVE CHANGED $path"; fail=1; }
  else
    [ -e "$DOC/$path" ] && { echo "UNEXPECTED EXISTING $path"; fail=1; }
  fi
done < manifest.tsv
[ "$fail" = 0 ] || { echo "ABORT: nothing was changed."; exit 1; }
echo "check ok: $(wc -l < manifest.tsv) files, $(grep -c $'\treplace\t' manifest.tsv) to replace, $(grep -c $'\tnew\t' manifest.tsv) new"
[ "$MODE" = "swap" ] || exit 0

# 3. Backup of every file that will be replaced, plus the list of new files.
[ -f before.tar.gz ] && { echo "ABORT: before.tar.gz already exists (already swapped?)"; exit 1; }
awk -F'\t' '$3=="replace"{print $1}' manifest.tsv > replaced.txt
awk -F'\t' '$3=="new"{print $1}' manifest.tsv > new-files.txt
tar czf before.tar.gz -C "$DOC" -T replaced.txt
tar tzf before.tar.gz | wc -l > before.count
[ "$(cat before.count)" = "$(wc -l < replaced.txt)" ] || { echo "ABORT: backup incomplete"; exit 1; }

# 4. Swap: copy beside the target, then rename (atomic per file).
date -u +%FT%TZ > swap-started.txt
while IFS=$'\t' read -r path sha action before; do
  dir=$(dirname "$DOC/$path"); mkdir -p "$dir"
  tmp="$dir/.v2tmp.$$.$(basename "$path")"
  cp "staging/$path" "$tmp"
  mv -f "$tmp" "$DOC/$path"
done < manifest.tsv
date -u +%FT%TZ > swap-finished.txt

# 5. Verify the live bytes.
bad=0
while IFS=$'\t' read -r path sha action before; do
  got=$(sha256sum "$DOC/$path" | cut -c1-64)
  [ "$got" = "$sha" ] || { echo "VERIFY FAIL $path"; bad=1; }
done < manifest.tsv
[ "$bad" = 0 ] && echo "swap ok: all $(wc -l < manifest.tsv) files verified" || { echo "VERIFY FAILED: run rollback.sh"; exit 1; }
