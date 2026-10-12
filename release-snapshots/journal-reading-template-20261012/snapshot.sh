#!/bin/bash
set -euo pipefail
REL=/home/u800901920/yza-article-reader-20261012-r1
DOC=/home/u800901920/domains/yza-shop.com/public_html
mkdir -p "$REL"
cd "$DOC"
find blogs/journal -mindepth 2 -maxdepth 2 -type f -name index.html | sort > "$REL/articles.txt"
[ "$(wc -l < "$REL/articles.txt")" = 42 ] || { echo 'Unexpected article count'; exit 1; }
cp "$REL/articles.txt" "$REL/snapshot-files.txt"
printf '%s\n' blogs/journal/index.html css/styles.css css/journal-nawal.css css/site-header-maison.css js/blog.js js/journal-locales.js js/chrome.js js/main.js >> "$REL/snapshot-files.txt"
while read -r path; do sha256sum "$path"; done < "$REL/snapshot-files.txt" > "$REL/before.sha256"
tar czf "$REL/snapshot.tar.gz" -T "$REL/snapshot-files.txt"
echo "Public snapshot: $(wc -l < "$REL/articles.txt") articles; $(wc -l < "$REL/snapshot-files.txt") files"
