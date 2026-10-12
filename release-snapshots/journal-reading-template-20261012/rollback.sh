#!/bin/bash
# Restore only this Journal release, after checking that nobody edited it since.
set -euo pipefail
REL="$(cd "$(dirname "$0")" && pwd)"
DOC=/home/u800901920/domains/yza-shop.com/public_html
cd "$REL"
[ -f before.tar.gz ] || { echo "ABORT: release backup missing"; exit 1; }
while IFS=$'\t' read -r path sha action before; do
  case "$path" in /*|*..*) echo "ABORT: invalid manifest path"; exit 1;; esac
  [ "$(sha256sum "$DOC/$path" | cut -c1-64)" = "$sha" ] || { echo "ABORT: live changed $path"; exit 1; }
done < manifest.tsv
tar xzf before.tar.gz -C "$DOC"
while IFS=$'\t' read -r path sha action before; do
  if [ "$action" = new ]; then
    rm -f -- "$DOC/$path"
  else
    [ "$(sha256sum "$DOC/$path" | cut -c1-64)" = "$before" ] || { echo "RESTORE FAILED $path"; exit 1; }
  fi
done < manifest.tsv
echo "rollback ok: 42 original article pages restored; reader assets removed"
