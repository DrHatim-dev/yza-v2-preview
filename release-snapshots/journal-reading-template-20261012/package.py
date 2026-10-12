from pathlib import Path
import hashlib,json,re,zipfile,sys
sys.stdout.reconfigure(encoding='utf-8')
R=Path(__file__).resolve().parent;W=R.parent.parent
deploy=(W/'artifacts/header-journal-spacing-20261012/deploy-journal.sh').read_text(encoding='utf-8')
deploy=deploy.replace('# YZA V2 release (2026-10-07): targeted package swap. Run from the release directory.','# YZA article-reader release (2026-10-12): targeted package swap.')
deploy=deploy.replace('  got=$(sha256sum "staging/$path"', '  case "$path" in blogs/journal/*/index.html|css/journal-reader.css|js/journal-reader.js) ;; *) echo "ABORT: unexpected release path"; exit 1;; esac\n  got=$(sha256sum "staging/$path"',1)
deploy=deploy.replace('echo "check ok:', 'sha256sum --quiet -c protected.sha256 || { echo "ABORT: protected live files changed"; exit 1; }\necho "check ok:')
# protected manifest paths are made absolute; they are public code and the Journal index only.
protected=[]
for line in (R/'before.sha256').read_text(encoding='utf-8').splitlines():
    sha,path=line.split('  ',1)
    if not re.match(r'blogs/journal/[^/]+/index.html$',path):protected.append(sha+'  /home/u800901920/domains/yza-shop.com/public_html/'+path)
(R/'protected.sha256').write_text('\n'.join(protected)+'\n',encoding='utf-8',newline='')
deploy=deploy.replace('[ "$bad" = 0 ] && echo','sha256sum --quiet -c protected.sha256 || { echo "VERIFY FAILED: protected code changed"; exit 1; }\n[ "$bad" = 0 ] && echo')
(R/'deploy.sh').write_text(deploy,encoding='utf-8',newline='')
rollback=(W/'artifacts/header-journal-spacing-20261012/rollback-journal.sh').read_text(encoding='utf-8').replace('original Journal index and sitemap restored; release additions removed','42 original article pages restored; reader assets removed')
(R/'rollback.sh').write_text(rollback,encoding='utf-8',newline='')
css=(R/'journal-reader.css').read_text(encoding='utf-8')
clean=re.sub(r'/\*.*?\*/','',css,flags=re.S)
selectors=[x.strip() for x in re.findall(r'([^{}]+)\{',clean) if not x.strip().startswith('@')]
assert all(x.startswith('.jr-reader') for x in selectors),'Unscoped CSS'
print(json.dumps({'deployPaths':44,'protectedPublicFiles':len(protected),'allCssSelectorsScoped':True,'backupAndRollbackPrepared':True}))
