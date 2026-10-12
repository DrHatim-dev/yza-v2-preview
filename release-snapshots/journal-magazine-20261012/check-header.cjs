const {chromium}=require('C:/Users/Hatim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const live=process.argv.includes('--live'),stage=path.join(__dirname,'header-staging');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(()=>{localStorage.setItem('yza_notrack','1');localStorage.setItem('yza.lang','fr');});
 await ctx.route('**/*',async r=>{
  const q=r.request(),u=new URL(q.url());
  if(q.method()!=='GET'||!['yza-shop.com','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)||/yza-(leads|collect)\.php/.test(u.pathname))return r.abort();
  let f=path.join(stage,u.pathname==='/'?'index.html':u.pathname==='/journal'?'blogs/journal/index.html':u.pathname.replace(/^\//,''));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!live&&fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});
  try{const response=await r.fetch({headers:{...q.headers(),...(u.hostname==='yza-shop.com'?{'user-agent':'Python-urllib/3.13'}:{})}});await r.fulfill({response});}catch{try{await r.abort();}catch{}}
 });
 const p=await ctx.newPage(),checks=[];
 const routes=['/journal','/','/blogs/journal/yza-pareo-skirt-size-guide-xs-to-xxl/','/collections/sacs','/checkout'];
 for(const route of routes){
  for(const width of route==='/journal'?[390,768,1024,1440]:[390,1440]){
   await p.setViewportSize({width,height:844});await p.goto('https://yza-shop.com'+route+'?lang=fr',{waitUntil:'load'});await p.locator('#header .logo__img').waitFor();
   for(const scroll of [0,500,1600]){
    await p.evaluate(y=>window.scrollTo(0,y),scroll);await p.waitForTimeout(150);
    const data=await p.evaluate(()=>{
     const a=document.querySelector('.announcement'),h=document.querySelector('#header'),l=h.querySelector('.logo__img');
     const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}};
     return {announcement:a?rect(a):null,header:rect(h),logo:rect(l),offset:getComputedStyle(h).top,scroll:scrollY};
    });
    assert(data.logo.height>=30,JSON.stringify({route,width,data}));
    assert(data.logo.top>=data.header.top&&data.logo.bottom<=data.header.bottom,JSON.stringify({route,width,data}));
    if(data.announcement&&data.announcement.bottom>0)assert(data.header.top>=data.announcement.bottom-1,JSON.stringify({route,width,data}));
    checks.push({route,width,...data});
   }
   if(route==='/journal'&&[390,1440].includes(width))await p.screenshot({path:path.join(__dirname,(live?'live':'staged')+'-header-'+width+'.png')});
  }
 }
 await ctx.unrouteAll({behavior:'ignoreErrors'});await browser.close();
 fs.writeFileSync(path.join(__dirname,(live?'live':'staged')+'-header-checks.json'),JSON.stringify(checks,null,2));console.log(JSON.stringify({mode:live?'live':'staged',headerStatesChecked:checks.length,logoOcclusions:0}));
})().catch(e=>{console.error(e.message);process.exit(1)});
