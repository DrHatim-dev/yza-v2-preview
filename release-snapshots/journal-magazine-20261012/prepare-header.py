import pathlib,tarfile,hashlib,json,shutil,sys
sys.stdout.reconfigure(encoding='utf-8')
root=pathlib.Path(__file__).resolve().parent
before=root/'header-before';stage=root/'header-staging'
with tarfile.open(root/'header-before.tar.gz') as tar:
 for m in tar.getmembers():
  name=m.name.removeprefix('./')
  assert m.isfile() and '..' not in pathlib.PurePosixPath(name).parts and not name.startswith('/') and (name.endswith('.html') or name=='css/site-header-maison.css')
  p=before/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(tar.extractfile(m).read())
css=(before/'css/site-header-maison.css').read_text(encoding='utf-8')
old='position:sticky !important; top:0 !important; height:112px !important;'
new='position:sticky !important; top:var(--yza-ann-h, var(--motion-announcement-reserve, 40px)) !important; height:112px !important;'
assert css.count(old)==1
css=css.replace(old,new)
version=hashlib.sha256(css.encode()).hexdigest()[:16]
files=[]
for p in before.rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(before).as_posix()
 value=css if rel=='css/site-header-maison.css' else p.read_text(encoding='utf-8').replace('site-header-maison.css?v=20261007v2','site-header-maison.css?v='+version)
 if rel.endswith('.html'):assert 'site-header-maison.css?v='+version in value
 dest=stage/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(value,encoding='utf-8',newline='\n')
 files.append({'path':rel,'action':'replace','sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'before':hashlib.sha256(p.read_bytes()).hexdigest()})
files.sort(key=lambda x:(x['path'].endswith('.html'),x['path']))
(root/'header-manifest.json').write_text(json.dumps({'version':version,'changed':files},indent=2),encoding='utf-8')
(root/'header-manifest.tsv').write_text(''.join('\t'.join([x['path'],x['sha256'],x['action'],x['before']])+'\n' for x in files),encoding='utf-8',newline='\n')
with tarfile.open(root/'header-files.tar.gz','w:gz') as tar:
 for x in files:tar.add(stage/x['path'],arcname=x['path'])
print(json.dumps({'headerFiles':len(files),'cssVersion':version,'otherDesignChanges':0}))
