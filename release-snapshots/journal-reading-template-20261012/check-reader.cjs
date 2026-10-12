const {chromium}=require('C:/Users/Hatim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=__dirname,live=process.argv.includes('--live'),quick=process.argv.includes('--quick'),cache=new Map(),checks=[],errors=[],requests=[];
const articles=JSON.parse(fs.readFileSync(path.join(root,'preservation-checks.json'),'utf8')).map(x=>x.path.split('/')[2]);
const chosen='marque-mode-locale-marrakech',legacy='la-sculpture-xs-s-m-size-guide';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
 await ctx.addInitScript(()=>{localStorage.setItem('yza_notrack','1');localStorage.setItem('yza.lang','fr');});
 await ctx.route('**/*',async r=>{
  const q=r.request(),u=new URL(q.url());
  if(q.method()!=='GET'||!['yza-shop.com','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)||/yza-(leads|collect)\.php/.test(u.pathname))return r.abort();
  const baseline=u.searchParams.has('baseline');
  let relative=u.pathname.replace(/^\//,'');if(!path.extname(relative))relative=relative.replace(/\/$/,'')+'/index.html';if(u.pathname==='/journal')relative='blogs/journal/index.html';
  for(const dir of baseline?['before']:live?[]:['staging','before']){
   const f=path.join(root,dir,relative);if(fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});
  }
  const key=u.href;
  try{
   if(cache.has(key))return r.fulfill(cache.get(key));
   const response=await r.fetch({headers:{...q.headers(),...(u.hostname==='yza-shop.com'?{'user-agent':'Python-urllib/3.13'}:{})}});
   const body=await response.body(),headers=response.headers();delete headers['content-encoding'];delete headers['content-length'];
   const result={status:response.status(),headers,body};cache.set(key,result);requests.push({path:u.pathname,status:response.status()});return r.fulfill(result);
  }catch{try{await r.abort()}catch{}}
 });
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 async function load(slug,width=1440,lang='fr',baseline=false,hash=''){
  await p.setViewportSize({width,height:1000});
  await p.goto('https://yza-shop.com/blogs/journal/'+slug+'/?lang='+lang+(baseline?'&baseline=1':'')+hash,{waitUntil:'load'});
  await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
 }
 async function shell(){return p.evaluate(()=>Object.fromEntries(['#header','footer'].map(sel=>{const e=document.querySelector(sel),s=getComputedStyle(e),r=e.getBoundingClientRect();return[sel,{text:e.innerText.replace(/\s+/g,' ').trim(),height:r.height,width:r.width,font:s.fontFamily,background:s.backgroundColor,color:s.color}]})));}
 for(const width of [390,1440]){
  await load(chosen,width,'fr',true);const before=await shell();
  await load(chosen,width);assert.deepStrictEqual(await shell(),before,'Header/footer presentation changed '+width);
 }
 const configurations=(quick?[chosen,legacy,'breloques-fruits-raffia-tendance-bijou-ete-2026']:articles).map(slug=>({slug,width:1440,lang:'fr'}));
 for(const width of [360,390,768,1024])for(const slug of [chosen,legacy,'yza-pareo-skirt-size-guide-xs-to-xxl'])configurations.push({slug,width,lang:'fr'});
 if(!quick)for(const lang of ['en','es','tr','ar'])for(const width of [390,1440])for(const slug of [chosen,legacy])configurations.push({slug,width,lang});
 for(const config of configurations){
  await load(config.slug,config.width,config.lang);
  const result=await p.evaluate(()=>{
   const main=document.querySelector('.jr-reader'),story=main?.querySelector('.article-body'),h=main?.querySelector('h1'),hs=h&&getComputedStyle(h),r=story?.getBoundingClientRect();
   const nav=[...main.querySelectorAll('.blog-toc nav a')];
   const missing=nav.filter(a=>!document.getElementById(new URL(a.href).hash.slice(1))).map(a=>a.href);
   const titles=[...main.querySelectorAll('h1,h2,h3')].filter(e=>e.getBoundingClientRect().height>0);
   const bad=titles.filter(e=>e.getBoundingClientRect().height>parseFloat(getComputedStyle(e).lineHeight)*2+2).map(e=>({text:e.innerText.slice(0,90),height:e.getBoundingClientRect().height,line:getComputedStyle(e).lineHeight}));
   const faq=[...main.querySelectorAll('.blog-faq__button')];
   const ann=document.querySelector('.announcement').getBoundingClientRect(),header=document.querySelector('#header').getBoundingClientRect();
   return {reader:!!main,title:h?.innerText.trim(),titleLines:h?Math.round(h.getBoundingClientRect().height/parseFloat(hs.lineHeight)):0,badTitles:bad,missingAnchors:missing,overflow:document.documentElement.scrollWidth>innerWidth,storyWidth:r?.width,gutter:r?.left,font:getComputedStyle(story).fontSize,headerBelowBar:header.top>=ann.bottom-1,faqCount:faq.length,faqExpanded:faq.every(b=>b.getAttribute('aria-expanded')==='true'),productCards:main.querySelectorAll('.blog-product-card').length,proseParagraphs:story.querySelectorAll('p').length,tocLinks:nav.length};
  });
  assert(result.reader);assert(result.title);assert(result.titleLines<=2,JSON.stringify({config,result}));assert.deepStrictEqual(result.badTitles,[],JSON.stringify({config,result}));assert.deepStrictEqual(result.missingAnchors,[],config.slug);assert(!result.overflow,JSON.stringify({config,result}));assert(result.headerBelowBar);assert(result.storyWidth<=761);assert(result.storyWidth>=config.width-41||config.width>800);assert(result.faqExpanded);assert(result.productCards>=1,'Products missing '+config.slug);checks.push({...config,...result});
 }
 for(const width of [390,1440]){
  await load(chosen,width);
  const button=p.locator('.blog-faq__button').first(),panelId=await button.getAttribute('aria-controls');
  await button.focus();await p.keyboard.press('Enter');assert.equal(await button.getAttribute('aria-expanded'),'false');assert.equal(await p.locator('#'+panelId).isVisible(),false);
  await p.keyboard.press('Space');assert.equal(await button.getAttribute('aria-expanded'),'true');assert(await p.locator('#'+panelId).isVisible());
  if(width<=800){await p.locator('.jr-toc-toggle').click();assert(await p.locator('.blog-toc nav').isVisible());}
  const url=p.url();await p.locator('.blog-toc a').nth(1).click();await p.waitForTimeout(800);
  assert.equal(new URL(p.url()).pathname,new URL(url).pathname);assert.equal(new URL(p.url()).hash,'#trois-questions');
  const anchor=await p.locator('#trois-questions').evaluate(e=>({top:e.getBoundingClientRect().top,headerBottom:document.querySelector('#header').getBoundingClientRect().bottom}));assert(anchor.top>=anchor.headerBottom+10,JSON.stringify(anchor));
  if(width<=800)assert.equal(await p.locator('.jr-toc-toggle').getAttribute('aria-expanded'),'false');
  await load(chosen,width,'fr',false,'#article');const target=await p.locator('#article').boundingBox();const headerBottom=await p.locator('#header').evaluate(e=>e.getBoundingClientRect().bottom);assert(target.y>=headerBottom+10,JSON.stringify({target,headerBottom}));
  // Decode only rendered article photos; mega-menu lazy images are deliberately untouched.
  await p.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,80))}scrollTo(0,0)});
  await p.evaluate(()=>Promise.race([Promise.all([...document.querySelectorAll('.jr-reader img')].filter(e=>e.getBoundingClientRect().height>0).map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,10000))]));await p.waitForTimeout(400);
  const broken=await p.locator('.jr-reader img:visible').evaluateAll(els=>els.filter(e=>!e.naturalWidth).map(e=>e.src));assert.deepStrictEqual(broken,[]);
  await p.screenshot({path:path.join(root,(live?'live':'staged')+'-reader-'+width+'.png'),fullPage:true});
  await p.screenshot({path:path.join(root,(live?'live':'staged')+'-reader-top-'+width+'.png')});
  if(width===1440){await p.locator('.article-body figure').first().screenshot({path:path.join(root,(live?'live':'staged')+'-atelier-photo.png')});}
 }
 await load(legacy,1440);await p.evaluate(async()=>{for(let y=0;y<1600;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,100))}scrollTo(0,0)});await p.waitForTimeout(500);await p.screenshot({path:path.join(root,(live?'live':'staged')+'-legacy-top.png')});
 assert.deepStrictEqual(errors,[]);
 const report={mode:live?'live':'staged',checks,errors,headerFooterUnchanged:true,faqKeyboardToggle:true,tocKeepsArticleRoute:true,anchorsClearHeader:true,realWrites:0,requests};
 fs.writeFileSync(path.join(root,(live?'live':'staged')+(quick?'-quick':'')+'-checks.json'),JSON.stringify(report,null,2));await ctx.unrouteAll({behavior:'ignoreErrors'});await browser.close();
 console.log(JSON.stringify({mode:report.mode,configurations:checks.length,articles:new Set(checks.map(x=>x.slug)).size,headerFooterUnchanged:true,faqKeyboardToggle:true,anchorsClearHeader:true,errors:0,realWrites:0}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
