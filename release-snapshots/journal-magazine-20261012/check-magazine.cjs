const {chromium}=require('C:/Users/Hatim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const live=process.argv.includes('--live'),stage=path.join(__dirname,'journal-staging'),header=path.join(__dirname,'header-staging'),checks=[];
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:1000}});
 await ctx.addInitScript(()=>{localStorage.setItem('yza_notrack','1');localStorage.setItem('yza.lang','fr');});
 let subscriptionMode='blocked',posts=0;
 await ctx.route('**/*',async r=>{
  const q=r.request(),u=new URL(q.url());
  if(q.method()==='POST'&&u.pathname==='/subscribe.php'&&subscriptionMode!=='blocked'){
   posts++;assert.equal(JSON.parse(q.postData()).source,'journal');
   return r.fulfill({status:subscriptionMode==='success'?200:503,contentType:'application/json',body:JSON.stringify({ok:subscriptionMode==='success'})});
  }
  if(q.method()!=='GET'||!['yza-shop.com','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)||/yza-(leads|collect)\.php/.test(u.pathname))return r.abort();
  for(const dir of u.searchParams.has('baseline')?[header]:[stage,header]){
   let f=path.join(dir,u.pathname==='/journal'?'blogs/journal/index.html':u.pathname.replace(/^\//,''));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
   if((!live||u.searchParams.has('baseline'))&&fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});
  }
  try{const response=await r.fetch({headers:{...q.headers(),...(u.hostname==='yza-shop.com'?{'user-agent':'Python-urllib/3.13'}:{})}});await r.fulfill({response});}catch{try{await r.abort();}catch{}}
 });
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const load=async url=>{await p.goto(url,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500)};
 const shell=()=>p.evaluate(()=>Object.fromEntries(['#header','footer'].map(sel=>{const e=document.querySelector(sel);if(!e)throw new Error('Missing shell selector '+sel);const s=getComputedStyle(e);return [sel,{text:e.textContent.replace(/\s+/g,' ').trim(),font:s.fontFamily,background:s.backgroundColor,color:s.color,height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}]})));
 for(const width of [390,1440]){
  await p.setViewportSize({width,height:1000});await load('https://yza-shop.com/journal?lang=fr&baseline=1');const baseline=await shell();
  await load('https://yza-shop.com/journal?lang=fr');assert.deepStrictEqual(await shell(),baseline,'Header/footer changed at '+width);
 }
 for(const lang of ['fr','en','ar']){
  for(const width of lang==='fr'?[360,390,768,1024,1440]:[390,1440]){
   await p.setViewportSize({width,height:1000});await load('https://yza-shop.com/journal?lang='+lang);
   const result=await p.evaluate(()=>{
    const visible=e=>e.getBoundingClientRect().height>0;
    const titles=[...document.querySelectorAll('.jm-journal h1,.jm-journal h2,.jm-journal h3')].filter(visible);
    const bad=titles.filter(e=>{const s=getComputedStyle(e);return e.getBoundingClientRect().height>parseFloat(s.lineHeight)*2+2}).map(e=>({title:e.textContent.trim(),height:e.getBoundingClientRect().height,lineHeight:getComputedStyle(e).lineHeight}));
    const bodies=[...document.querySelectorAll('.jm-story__body')];
    const gaps=bodies.map(b=>{const p=b.querySelector('.jm-teaser').getBoundingClientRect(),a=b.querySelector('.jm-read').getBoundingClientRect();return a.top-p.bottom});
    const main=document.querySelector('.jm-container').getBoundingClientRect();
    const logo=document.querySelector('#header .logo img')||document.querySelector('#header img'),ann=document.querySelector('.announcement');
    return {titlesChecked:titles.length,bad,minimumLinkGap:Math.min(...gaps),leftGutter:main.left+parseFloat(getComputedStyle(document.querySelector('.jm-container')).paddingLeft),overflow:document.documentElement.scrollWidth>innerWidth,newCards:document.querySelectorAll('[data-nawal-article]').length,oldCards:document.querySelectorAll('.jm-guide-grid .article-card').length,headerBelowBar:document.querySelector('#header').getBoundingClientRect().top>=ann.getBoundingClientRect().bottom-1,logoHeight:logo.getBoundingClientRect().height};
   });
   assert.deepStrictEqual(result.bad,[],JSON.stringify({lang,width,...result}));assert.equal(result.overflow,false);assert.equal(result.newCards,10);assert.equal(result.oldCards,30);assert(result.minimumLinkGap>=8,JSON.stringify(result));assert(result.leftGutter>=19);assert(result.headerBelowBar);assert(result.logoHeight>=30);
   checks.push({route:'/journal',width,lang,...result});
   await p.locator('[data-jm-filter="cadeaux"]').click();assert.equal(await p.locator('[data-nawal-article]:visible').count(),2);assert.equal(await p.locator('[data-jm-count]').textContent(),'2 articles');
   await p.locator('[data-jm-filter="all"]').click();assert.equal(await p.locator('[data-nawal-article]:visible').count(),10);
   await p.locator('[data-jm-open-archives]').click();await p.waitForTimeout(300);assert.equal(await p.locator('.jm-guide-grid .article-card:visible').count(),30,JSON.stringify(await p.locator('#jm-all-guides').evaluate(e=>({open:e.open,html:e.outerHTML.slice(0,300),card:e.querySelector('.article-card').outerHTML.slice(0,300),style:getComputedStyle(e.querySelector('.article-card')).display}))));
   const oldTitleIssues=await p.locator('.jm-guide-grid .article-card__body h2,.jm-guide-grid .article-card__body h3').evaluateAll(els=>els.filter(e=>e.getBoundingClientRect().height>parseFloat(getComputedStyle(e).lineHeight)*2+2).map(e=>e.textContent));assert.deepStrictEqual(oldTitleIssues,[]);
   await p.evaluate(()=>{document.querySelector('#jm-all-guides').open=false;scrollTo(0,0)});
   if(lang==='fr'&&[390,1440].includes(width)){
    // Trigger and decode the complete visible page's lazy images before visual evidence.
    await p.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=650){scrollTo(0,y);await new Promise(r=>setTimeout(r,150))}scrollTo(0,0)});
    await p.evaluate(()=>Promise.race([Promise.all([...document.querySelectorAll('.jm-journal img')].filter(e=>e.getBoundingClientRect().height>0).map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,10000))]));await p.waitForTimeout(600);
    const broken=await p.locator('.jm-journal img:visible').evaluateAll(els=>els.filter(e=>!e.naturalWidth).map(e=>e.src));assert.deepStrictEqual(broken,[]);
    await p.screenshot({path:path.join(__dirname,(live?'live':'staged')+'-magazine-'+width+'.png'),fullPage:true});
    await p.screenshot({path:path.join(__dirname,(live?'live':'staged')+'-magazine-top-'+width+'.png')});
   }
  }
 }
 await p.setViewportSize({width:390,height:1000});await load('https://yza-shop.com/journal?lang=fr');
 await p.locator('#jm-email').fill('invalid');await p.locator('.jm-newsletter button').click();assert.equal(posts,0);assert(await p.locator('[data-news-msg]').isVisible());
 subscriptionMode='failure';await p.locator('#jm-email').fill('codex-test@example.invalid');await p.locator('.jm-newsletter button').click();await p.waitForFunction(()=>document.querySelector('[data-news-msg]').textContent.includes('Envoi impossible'));assert.equal(await p.locator('#jm-email').inputValue(),'codex-test@example.invalid');assert.equal(posts,1);
 subscriptionMode='success';await p.locator('.jm-newsletter button').click();await p.waitForFunction(()=>document.querySelector('#jm-email').value==='');assert.equal(posts,2);
 const routes=['breloques-fruits-raffia-tendance-bijou-ete-2026','que-porter-marrakech-40-degres','techniques-raffia-atelier-yza','yza-pareo-skirt-size-guide-xs-to-xxl','why-handmade-raffia-costs-more'];
 for(const slug of routes){for(const width of [390,1440]){
  await p.setViewportSize({width,height:1000});await load('https://yza-shop.com/blogs/journal/'+slug+'/?lang=fr');
  const result=await p.locator('h1').evaluate(e=>{const s=getComputedStyle(e);return {title:e.textContent.trim(),height:e.getBoundingClientRect().height,lineHeight:parseFloat(s.lineHeight),tooltip:e.title,clamp:s.webkitLineClamp}});
  assert(result.height<=result.lineHeight*2+2,JSON.stringify({slug,width,...result}));assert.equal(result.clamp,'2');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  checks.push({route:slug,width,...result});
 }}
 assert.deepStrictEqual(errors,[]);await ctx.unrouteAll({behavior:'ignoreErrors'});await browser.close();
 fs.writeFileSync(path.join(__dirname,(live?'live':'staged')+'-magazine-checks.json'),JSON.stringify({checks,errors,headerFooterUnchanged:true,workingFilters:true,newsletterStubTests:{invalid:true,failure:true,success:true,interceptedPosts:posts},realOrdersOrSubscriptions:0},null,2));console.log(JSON.stringify({mode:live?'live':'staged',pageConfigurations:checks.length,titleAndSpacingFailures:0,headerFooterUnchanged:true,realOrdersOrSubscriptions:0}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
