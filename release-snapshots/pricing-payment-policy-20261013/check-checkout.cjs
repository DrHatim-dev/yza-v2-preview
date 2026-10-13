const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Hatim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=__dirname, live=process.argv.includes('--live');
const catalog=JSON.parse(fs.readFileSync(path.join(root,live?'after-catalog.json':'proposed-catalog.json'),'utf8'));
const cache=new Map();
const cases=[['MA','fr',390],['MA','en',1440],['MA','ar',390],['FR','fr',1440],['US','en',390],['AE','ar',1440],['GB','es',390],['JP','tr',1440],['US','en',390,'rib'],['MA','fr',1440,'iban'],['US','en',390,'cod-foreign'],['MA','en',390,'cod-valid'],['US','en',390,'card-valid']];
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'}),results=[];
 try{
  for(const [country,lang,width,pending] of cases){
   process.stdout.write('Start '+country+' '+lang+' '+(pending||'fresh')+'\n');
   const context=await browser.newContext({viewport:{width,height:900}}),posts=[],errors=[];
   await context.addInitScript(({lang,pending,country,catalog})=>{
    localStorage.setItem('yza_notrack','1');localStorage.setItem('yza.lang',lang);
    if(pending){
     const method=pending.startsWith('cod')?'cod':pending.startsWith('card')?'card':pending;
     const order={number:'YZA-TESTRETRY01',operationId:'ord_0123456789abcdef0123456789abcdef',method,countryCode:pending==='cod-valid'?'MA':country,shipping:{email:'test@example.invalid',country},items:[],totalDh:100};
     sessionStorage.setItem('yza.order.operation',JSON.stringify({id:order.operationId,number:order.number,request:{endpoint:method==='card'?'zazu-checkout.php':'order.php',body:JSON.stringify({order,text:'Test only',_hp:''})}}));
    }
   },{lang,pending,country,catalog});
   await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(req.method()!=='GET'){
     if(url.pathname.endsWith('/order.php')||url.pathname.endsWith('/zazu-checkout.php'))posts.push({endpoint:url.pathname,body:JSON.parse(req.postData()||'{}')});
     return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'verification_no_order_created'})});
    }
    if(url.hostname==='yza-shop.com'){
     if(url.pathname==='/market.php')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,available:true,country,market:country==='MA'?'MAD':'EUR',eurRate:11})});
     if(!live&&url.pathname==='/catalog-current.js')return route.fulfill({contentType:'application/javascript',body:'window.YZA_CATALOG_RELEASE = '+JSON.stringify(catalog)+';'});
     const relative=decodeURIComponent(url.pathname).replace(/^\//,''),filename=relative||'index.html';
     if(!live){
      const candidate=[path.join(root,'after',filename),path.join(root,'before',filename)].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
      if(candidate)return route.fulfill({body:fs.readFileSync(candidate),contentType:filename.endsWith('.html')?'text/html':filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':'application/octet-stream'});
     }
     let cached=cache.get(req.url());
     if(!cached){cached=(async()=>{const response=await route.fetch({headers:{...req.headers(),'user-agent':'Python-urllib/3.13'},timeout:45000});return {status:response.status(),headers:response.headers(),body:await response.body()};})();cache.set(req.url(),cached);}
     try{return route.fulfill(await cached);}catch(e){cache.delete(req.url());return route.abort();}
    }
    if(['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname))return route.continue();
    return route.abort();
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto('https://yza-shop.com/checkout.html?lang='+lang,{waitUntil:'domcontentloaded',timeout:60000});
   process.stdout.write('Loaded '+await page.title()+'\n');
   await page.waitForFunction(()=>window.YZA?.market?.ready&&YZA.cart&&document.querySelector('#checkoutRoot'),null,{timeout:20000}).catch(async e=>{
    console.error(JSON.stringify({errors,state:await page.evaluate(()=>({market:window.YZA?.market,cart:!!window.YZA?.cart,release:window.YZA_CATALOG_RELEASE?.revision,report:window.YZA?.catalogReleaseReport,body:document.body.innerText.slice(0,250)}))}));throw e;
   });
   const cart=await page.evaluate(()=>{
    const candidates=Object.values(YZA_CATALOG_RELEASE.products).filter(p=>p.active).sort((a,b)=>a.id?.includes('cherries')?-1:1);
    for(const p of candidates){const handle=p.id||Object.keys(YZA_CATALOG_RELEASE.products).find(h=>YZA_CATALOG_RELEASE.products[h]===p);YZA.cart.add(handle,'',1,{source:'verification'});if(YZA.cart.items.length)return {handle,count:YZA.cart.items.length};}
    return {count:0};
   });
   assert.equal(cart.count,1,'one sellable fixture');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('[data-next="shipping"]').waitFor({timeout:15000});
   await page.locator('[data-next="shipping"]').click();
   await page.locator('#coShipForm [name="country"]').selectOption(country);
   await page.locator('#coShipForm [name="name"]').fill('Verification YZA');
   await page.locator('#coShipForm [name="phone"]').fill(country==='MA'?'0612345678':'+33612345678');
   await page.locator('#coShipForm [name="email"]').fill('test@example.invalid');
   await page.locator('#coShipForm [name="address"]').fill('Verification only');
   await page.locator('#coShipForm [name="city"]').fill('Verification');
   await page.locator('[data-next="payment"]').click();
   await page.locator('[name="pay"]').first().waitFor({timeout:15000});
   const methods=await page.locator('[name="pay"]').evaluateAll(nodes=>nodes.map(n=>n.value));
   assert.deepEqual(methods,country==='MA'?['cod','card']:['card']);
   const checked=await page.locator('[name="pay"]:checked').inputValue();
   assert(['cod','card'].includes(checked));
   const money=await page.evaluate(({catalog,country})=>{
    let errors=[];for(const [id,p] of Object.entries(catalog.products)){const view=YZA.getProduct(id);if(!p.active){if(view)errors.push(id);continue;}const expected=(country==='MA'?p.priceDh:p.priceEur*11)*100;if(!view||view.price!==expected)errors.push(id);}
    return {errors,market:YZA.market.market,revision:YZA.catalogRevision,stored:JSON.parse(sessionStorage.getItem('yza.order.operation')||'null')};
   },{catalog,country});
   assert.deepEqual(money.errors,[],'all 33 canonical retail amounts');
   if(pending==='cod-valid'||pending==='card-valid')assert.equal(money.stored.id,'ord_0123456789abcdef0123456789abcdef','legitimate retry identity preserved');
   if(pending&&!pending.endsWith('-valid'))assert.notEqual(money.stored.id,'ord_0123456789abcdef0123456789abcdef','obsolete pending request discarded');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   assert.equal(overflow,false,'no horizontal page overflow');
   if([0,3,4].includes(results.length))await page.screenshot({path:path.join(root,(live?'live':'staged')+'-'+country+'-'+width+'.png'),fullPage:true});
   if(!pending){
    if(country==='MA')await page.locator('#co-pay-cod').check();
    await page.locator('[data-place]').click();
    await page.waitForTimeout(500);
    assert.equal(posts.length,1,'one intercepted request');
    const order=posts[0].body.order;assert.equal(order.method,country==='MA'?'cod':'card');assert.equal(order.countryCode,country);
    assert.equal(order.shippingDh,country==='MA'?50:['FR'].includes(country)?220:550);
    const product=catalog.products[order.items[0].handle];assert.equal(order.items[0].price,(country==='MA'?product.priceDh:product.priceEur*11)*100);
   }
   assert.deepEqual(errors,[],'no JavaScript exceptions');
   results.push({country,lang,width,pending:pending||null,methods,checked,market:money.market,productsChecked:33,postIntercepted:posts.length});
   process.stdout.write(JSON.stringify({passed:results.length,country,lang,pending:pending||null})+'\n');
   await context.close();
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(root,live?'live-ui-checks.json':'staged-ui-checks.json'),JSON.stringify({ok:true,mode:live?'live public assets with simulated IP market and blocked writes':'staged public assets with proposed catalogue, simulated IP market and blocked writes',cases:results},null,2));
})().catch(e=>{console.error(String(e.stack||e));process.exit(1);});
