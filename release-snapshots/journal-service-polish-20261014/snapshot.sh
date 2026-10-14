#!/bin/bash
set -euo pipefail
REL=/home/u800901920/yza-journal-service-polish-20261014-r1
DOC=/home/u800901920/domains/yza-shop.com/public_html
mkdir -p "$REL"
cd "$DOC"
find . -maxdepth 4 \( -path './.private' -o -path './wp' -o -path './catalog-admin' -o -path './assets' \) -prune -o -type f -name '*.html' -print | sed 's#^./##' | grep -v '\\' > "$REL/paths.txt"
printf '%s\n' js/products.js js/service-policy.js js/i18n.js css/journal-magazine.css js/journal-magazine.js css/journal-reader.css js/journal-reader.js css/journal-nawal.css js/journal-locales.js catalog-storefront-contract.json >> "$REL/paths.txt"
sort -u "$REL/paths.txt" -o "$REL/paths.txt"
while read -r path; do [ -f "$path" ] || { echo "Missing $path"; exit 1; }; sha256sum "$path"; done < "$REL/paths.txt" > "$REL/before.sha256"
tar czf "$REL/snapshot.tar.gz" -T "$REL/paths.txt"
echo "Fresh public snapshot: $(wc -l < "$REL/paths.txt") files"
