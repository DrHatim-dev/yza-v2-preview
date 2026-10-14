const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Hatim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=__dirname,live=process.argv.includes('--live'),cache=new Map();
const copy=JSON.parse(fs.readFileSync(path.join(root,'service-copy.json'),'utf8'));
const choices=JSON.parse(fs.readFileSync(path.join(root,'choices.json'),'utf8'));
const baseline=JSON.parse(fs.readFileSync(path.join(root,'catalog-baseline.json'),'utf8'));
const cases=[['journal','fr',1440],['journal','fr',390],['journal','fr',360],['journal','fr',768],['journal','ar',390],['blogs/journal/que-porter-marrakech-40-degres/','fr',390],['blogs/journal/marque-mode-locale-marrakech/','fr',1440],['checkout.html','fr',390],['checkout.html','en',1440],['','es',390],['','tr',1440],['','ar',390]];
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[];
 try{
  for(const [route,lang,width] of cases){
   const context=await browser.newContext({viewport:{width,height:1000}}),errors=[],writes=[];
   await context.addInitScript(lang=>{localStorage.setItem('yza_notrack','1');localStorage.setItem('yza.lang',lang);},lang);
   await context.route('**/*',async r=>{
    const req=r.request(),url=new URL(req.url());
    if(req.method()!=='GET'){writes.push(url.pathname);return r.fulfill({status:503,contentType:'application/json',body:'{"ok":false,"error":"verification_write_blocked"}'});}
    if(url.hostname==='yza-shop.com'){
     let filename=decodeURIComponent(url.pathname).replace(/^\//,'');
     if(!filename)filename='index.html';else if(filename==='journal'||filename==='journal/')filename='blogs/journal/index.html';else if(filename.endsWith('/'))filename+='index.html';
     if(!live){const local=[path.join(root,'after',filename),path.join(root,'before',filename)].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());if(local)return r.fulfill({body:fs.readFileSync(local),contentType:filename.endsWith('.html')?'text/html':filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':'application/json'});}
     let response=cache.get(req.url());if(!response){response=(async()=>{const x=await r.fetch({headers:{...req.headers(),'user-agent':'Python-urllib/3.13'},timeout:45000});return {status:x.status(),headers:x.headers(),body:await x.body()};})();cache.set(req.url(),response);}
     try{return r.fulfill(await response);}catch(e){cache.delete(req.url());return r.abort();}
    }
    if(['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname))return r.continue();
    return r.abort();
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto('https://yza-shop.com/'+route+'?lang='+lang,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>window.YZA?.market?.ready&&document.querySelector('[data-service-card="payment"]'),null,{timeout:20000});
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForTimeout(200);
   const service=await page.evaluate(()=>{
    const get=key=>{const el=document.querySelector('[data-service-card="'+key+'"]');return {title:el.querySelector('h3').textContent.trim(),text:el.querySelector('p').textContent.trim()};};
    return {shipping:get('morocco-delivery'),guarantee:get('returns'),payment:get('payment'),lang:YZA.i18n.lang};
   });
   assert.equal(service.lang,lang);
   assert.equal(service.shipping.title,copy.shippingTitle[lang]);assert.equal(service.shipping.text,copy.shippingSummary[lang]);
   assert.equal(service.guarantee.title,copy.guaranteeTitle[lang]);
   // Home's compact band has its own concise return summary; the footer remains complete.
   if(route!=='')assert.equal(service.guarantee.text,copy.guaranteeSummary[lang]);
   assert.equal(service.payment.text,copy.paymentSummary[lang]);
   const prices=await page.evaluate(baseline=>{
    const mismatches=[];for(const [id,p] of Object.entries(baseline.products)){const view=YZA.getProduct(id);if(!p.active){if(view)mismatches.push(id);continue;}if(view.price!==(YZA.market.market==='EUR'?p.priceEur*11:p.priceDh)*100)mismatches.push(id);}
    return {revision:YZA.catalogRevision,mismatches,market:YZA.market.market};
   },baseline);
   assert.equal(prices.revision,baseline.revision);assert.deepEqual(prices.mismatches,[]);
   let journal=null;
   if(route==='journal'){
    await page.evaluate(()=>document.querySelectorAll('.jm-story__photo img,.jm-collection img').forEach(i=>i.loading='eager'));
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.jm-story__photo img,.jm-collection img')).every(i=>i.complete&&i.naturalWidth>0),null,{timeout:30000});
    journal=await page.evaluate(()=>{
     const photo=i=>{const r=i.getBoundingClientRect(),s=getComputedStyle(i);return {width:r.width,height:r.height,ratio:r.width/r.height,src:new URL(i.src).pathname,fit:s.objectFit,position:s.objectPosition,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight};};
     const grid=Array.from(document.querySelectorAll('.jm-story-grid .jm-story')).map(a=>({photo:photo(a.querySelector('img')),top:a.querySelector('img').getBoundingClientRect().top,cta:a.querySelector('.jm-read').getBoundingClientRect().top}));
     const titleLines=Array.from(document.querySelectorAll('.jm-story-title')).map(t=>{const s=getComputedStyle(t);return t.getBoundingClientRect().height/parseFloat(s.lineHeight);});
     return {stories:document.querySelectorAll('[data-nawal-article]').length,grid,titleLines,collections:Array.from(document.querySelectorAll('.jm-collection img')).map(photo)};
    });
    assert.equal(journal.stories,10);assert(journal.titleLines.every(n=>n<=2.06),'titles <= 2 lines');
    assert(journal.grid.every(p=>Math.abs(p.photo.ratio-.75)<.003),'portrait article ratios');
    assert(journal.collections.every(p=>Math.abs(p.ratio-.8)<.003&&p.fit==='cover'),'collection ratios without gutters');
    assert.deepEqual(journal.collections.map(p=>p.src),choices.collectionPhotos.map(p=>p[1]));
    if(width>=768){for(let i=0;i<journal.grid.length;i+=3){const row=journal.grid.slice(i,i+3);assert(Math.max(...row.map(p=>p.top))-Math.min(...row.map(p=>p.top))<=1,'aligned image tops');assert(Math.max(...row.map(p=>p.photo.height))-Math.min(...row.map(p=>p.photo.height))<=1,'equal image heights');assert(Math.max(...row.map(p=>p.cta))-Math.min(...row.map(p=>p.cta))<=1,'aligned article CTAs');}}
    // Filters and the archive control still work after the layout changes.
    await page.locator('[data-jm-filter="style"]').click();
    assert(await page.locator('[data-nawal-article]:visible').count()>0);
    await page.locator('[data-jm-filter="all"]').click();assert.equal(await page.locator('[data-nawal-article]:visible').count(),10);
    await page.locator('[data-jm-open-archives]').click();assert.equal(await page.locator('#jm-all-guides').evaluate(e=>e.open),true);
    await page.locator('#jm-all-guides').evaluate(e=>e.open=false);
    // Real scroll exposure lets the existing reveal observer paint photos/headings.
    // Loading an image alone does not make an offscreen animated element opaque.
    const height=await page.evaluate(()=>document.documentElement.scrollHeight);
    for(let y=0;y<height;y+=700){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(100);}
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(450);
    const hiddenPhotos=await page.locator('.jm-story__photo img,.jm-collection img').evaluateAll(nodes=>nodes.filter(n=>Number(getComputedStyle(n).opacity)<.99).map(n=>n.src));
    assert.deepEqual(hiddenPhotos,[],'all exposed photos visibly painted');
    if(lang==='fr'&&[390,1440].includes(width)){
     await page.screenshot({path:path.join(root,(live?'live':'staged')+'-journal-'+width+'.png'),fullPage:true});
     await page.locator('.jm-shop').scrollIntoViewIfNeeded();await page.waitForTimeout(450);
     await page.locator('.jm-shop').screenshot({path:path.join(root,(live?'live':'staged')+'-pieces-'+width+'.png')});
     await page.locator('.jm-story-grid .jm-story').first().scrollIntoViewIfNeeded();await page.waitForTimeout(450);
     await page.locator('.jm-story-grid .jm-story').first().screenshot({path:path.join(root,(live?'live':'staged')+'-article2-'+width+'.png')});
    }
   }
   let related=0;
   if(route.startsWith('blogs/')){
    await page.evaluate(()=>document.querySelectorAll('.jr-related-portrait img').forEach(i=>i.loading='eager'));
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.jr-related-portrait img')).every(i=>i.complete&&i.naturalWidth>0),null,{timeout:30000});
    related=await page.locator('.jr-related-portrait').count();assert.equal(related,3);
    const ratios=await page.locator('.jr-related-portrait').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return r.width/r.height;}));assert(ratios.every(v=>Math.abs(v-.75)<.003));
   }
   if(route==='checkout.html'&&lang==='fr'){
    await page.locator('[data-service-card="returns"]').first().locator('..').screenshot({path:path.join(root,(live?'live':'staged')+'-services-'+width+'.png')});
   }
   const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,headerHeight:document.querySelector('#header')?.getBoundingClientRect().height||0}));
   assert.equal(geometry.overflow,false,'no horizontal page overflow');assert(geometry.headerHeight>0);
   assert.deepEqual(errors,[],'no JavaScript exceptions');
   results.push({route:route||'/',lang,width,service,related,geometry,journal,prices,writesBlocked:writes.length});
   console.log(JSON.stringify({passed:results.length,route:route||'/',lang,width}));
   await context.close();
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(root,live?'live-visual-checks.json':'staged-visual-checks.json'),JSON.stringify({ok:true,mode:live?'live public files; all writes blocked':'staged public files; all writes blocked',cases:results},null,2));
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
