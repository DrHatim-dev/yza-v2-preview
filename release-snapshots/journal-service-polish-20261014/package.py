from pathlib import Path
import json,hashlib,tarfile,re
root=Path(__file__).parent
baseline={line[66:]:line[:64] for line in (root/'before.sha256').read_text().splitlines()}
paths=sorted(p.relative_to(root/'after').as_posix() for p in (root/'after').rglob('*') if p.is_file())
paths.sort(key=lambda p:(p.endswith('.html'),p))
manifest=[]
for path in paths:
    assert path in baseline and '..' not in path and '\\' not in path and not any(s in path for s in ('.private','wp-config','.sql'))
    original=(root/'before'/path).read_bytes();modified=(root/'after'/path).read_bytes()
    assert hashlib.sha256(original).hexdigest()==baseline[path]
    if path.endswith('.html'):
        old=original.decode('utf-8');new=modified.decode('utf-8')
        for pattern in [r'<title\b[^>]*>[\s\S]*?</title>',r'<meta\b[^>]*(?:name="description"|property="og:[^"]+"|name="twitter:[^"]+")[^>]*>',r'<link\b[^>]*rel="canonical"[^>]*>',r'<h1\b[^>]*>[\s\S]*?</h1>']:
            assert re.findall(pattern,old)==re.findall(pattern,new),('SEO changed',path,pattern)
        # No article titles, dates, paragraphs, or link targets are changed.
        for pattern in [r'<h[23]\b[^>]*>[\s\S]*?</h[23]>',r'<p\b[^>]*>[\s\S]*?</p>',r'href="([^"]+)"']:
            o=re.findall(pattern,old);n=re.findall(pattern,new)
            if pattern.startswith('href'):
                normalize=lambda values:[re.sub(r'\?v=[^" ]+$','',v) for v in values]
                o,n=normalize(o),normalize(n)
            assert o==n,('Content changed',path,pattern)
    manifest.append({'path':path,'sha256':hashlib.sha256(modified).hexdigest(),'beforeSha256':baseline[path]})
contract=json.loads((root/'after/catalog-storefront-contract.json').read_text())
assert contract['productsJsSha256']==hashlib.sha256((root/'after/js/products.js').read_bytes()).hexdigest()
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(root/'manifest.tsv').write_text(''.join(f"{row['path']}\t{row['sha256']}\t{row['beforeSha256']}\n" for row in manifest),newline='\n')
with tarfile.open(root/'files.tar.gz','w:gz') as archive:
    for path in paths:archive.add(root/'after'/path,arcname=path)
print(json.dumps({'files':len(paths),'html':sum(p.endswith('.html') for p in paths),'newFiles':0,'seoFieldsPreserved':True}))
