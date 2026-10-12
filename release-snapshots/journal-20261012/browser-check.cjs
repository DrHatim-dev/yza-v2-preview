const {chromium}=require('C:/Users/Hatim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=__dirname,stage=path.join(root,'staging'),articles=JSON.parse(fs.readFileSync(path.join(root,'articles.json'),'utf8'));
const live=process.argv.includes('--live'),errors=[],checks=[],blocked=[];
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await ctx.route('**/*',async route=>{
  const q=route.request(),u=new URL(q.url());
  if(q.method()!=='GET'||u.hostname!=='yza-shop.com'||/yza-(collect|leads)\.php/.test(u.pathname)){blocked.push({method:q.method(),path:u.pathname});return route.abort();}
  let file=u.pathname==='/journal'||u.pathname==='/journal/'?path.join(stage,'blogs/journal/index.html'):path.join(stage,u.pathname.replace(/^\//,''));
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!live&&fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});
  try{const response=await route.fetch({headers:{...q.headers(),'user-agent':'Python-urllib/3.13'}});return route.fulfill({response});}
  catch(e){if(!/disposed|closed/i.test(e.message))errors.push(e.message);try{return await route.abort();}catch(_){}}
 });
 await ctx.addInitScript(()=>{localStorage.setItem('yza_notrack','1');localStorage.setItem('yza.lang','fr');});
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://yza-shop.com/journal?lang=fr',{waitUntil:'load'});
 await page.locator('#articles-nawal').waitFor();
 assert.strictEqual(await page.locator('#articles-nawal [data-nawal-article]').count(),10);
 assert(await page.locator('#articles-nawal a[href*="'+articles[0].slug+'"]').count()>0);
 await page.screenshot({path:path.join(root,(live?'live':'staged')+'-journal-mobile.png')});
 checks.push({page:'journal',newArticles:10,oldArticles:await page.locator('.article-card:not([data-nawal-article])').count()});
 for(const a of articles){
  await page.goto(a.url+'?lang=fr',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelectorAll('[data-blog-products] .blog-product-card').length>=3);
  assert.strictEqual((await page.locator('h1').innerText()).trim(),a.title);
  assert.strictEqual(await page.locator('link[rel="canonical"]').getAttribute('href'),a.url);
  assert.strictEqual(await page.locator('.blog-post-hero__media img').getAttribute('src'),a.cover);
  await page.waitForFunction(()=>{const i=document.querySelector('.blog-post-hero__media img');return i.complete&&i.naturalWidth>0});
  assert.strictEqual(await page.locator('.blog-faq__button').count(),3);
  const button=page.locator('.blog-faq__button').first();const before=await button.getAttribute('aria-expanded');await button.click();assert.notStrictEqual(await button.getAttribute('aria-expanded'),before);
  assert.strictEqual(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.strictEqual(await page.locator('main').getAttribute('lang'),'fr');
  assert.strictEqual(await page.locator('body > .blog-service-trust').isVisible(),false);
  if([1,6,7].includes(a.number)){
   await page.locator('.blog-post-hero__media').scrollIntoViewIfNeeded();await page.waitForTimeout(450);
   await page.screenshot({path:path.join(root,(live?'live':'staged')+'-article-'+a.number+'-mobile.png')});
  }
  checks.push({article:a.number,title:a.title,products:await page.locator('[data-blog-products] .blog-product-card').count(),questions:3,heroLoaded:true,overflow:false});
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('https://yza-shop.com/journal?lang=fr',{waitUntil:'load'});await page.waitForTimeout(700);
 await page.screenshot({path:path.join(root,(live?'live':'staged')+'-journal-desktop.png'),fullPage:false});
 await page.locator('#articles-nawal').scrollIntoViewIfNeeded();await page.waitForTimeout(500);await page.screenshot({path:path.join(root,(live?'live':'staged')+'-articles-grid-desktop.png')});
 await page.goto(articles[0].url+'?lang=fr',{waitUntil:'load'});await page.waitForTimeout(700);assert.strictEqual(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(root,(live?'live':'staged')+'-article-1-desktop.png')});
 assert.deepStrictEqual(errors,[]);await ctx.unrouteAll({behavior:'ignoreErrors'});await browser.close();
 const result={mode:live?'live':'staged',checks,errors,blockedWrites:blocked.filter(x=>x.method!=='GET').length,realOrdersOrSubscriptions:0};
 fs.writeFileSync(path.join(root,(live?'live':'staged')+'-browser-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({mode:result.mode,pagesChecked:checks.length,errors,realOrdersOrSubscriptions:0}));
})().catch(e=>{console.error(e.message);process.exit(1)});
