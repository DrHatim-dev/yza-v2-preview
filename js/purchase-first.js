/* Purchase-first layout; uses the original catalog selectors and add handler. */
(function(){
 const Y=window.YZA=window.YZA||{}; let cleanup=()=>{};
 Y.purchaseFirst=function(p){
  cleanup();
  const info=document.querySelector('.product-info'), add=document.querySelector('#pAdd');
  if(!info||!add)return;
  document.body.classList.add('purchase-first');
  const block=add.closest('.option--add');
  const short=document.querySelector('#pShort');
  let anchor=short;
  const full=short?.textContent.trim()||'';
  const sentence=full.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  let extra=document.querySelector('#purchaseDescription');
  if(sentence&&sentence.length<full.length){
   short.textContent=sentence;
   if(!extra){extra=document.createElement('p');extra.id='purchaseDescription';}
   extra.textContent=full; info.append(extra);
  }

  for(const id of ['pColorWrap','pVariants','pSize','pFinish']){
   const node=document.getElementById(id); if(node&&anchor){anchor.after(node);anchor=node;}
  }
  anchor.after(block);
  // Move supporting editorial detail below commerce without discarding content.
  for(const id of ['pBullets','charmMotif','charmFinishes','earringPair','bagCollection','charmCollection','clothingCollection','earringCollection']){
   const node=document.getElementById(id); if(node&&node.parentNode===info)info.append(node);
  }
  const story=document.querySelector('#productStory');
  if(story?.parentNode===info)info.append(story);
  let status=document.querySelector('#purchaseAvailability');
  if(!status){status=document.createElement('p');status.id='purchaseAvailability';}
  block.prepend(status);
  let service=document.querySelector('#purchaseService');
  if(!service){service=document.createElement('p');service.id='purchaseService';}
  const fr=Y.i18n.lang==='fr';
  service.textContent=Y.i18n.t('pp.ship.txt');
  block.after(service);
  let bar=document.querySelector('#purchaseSticky');
  if(!bar){bar=document.createElement('div');bar.id='purchaseSticky';bar.innerHTML='<button type="button"></button>';document.body.append(bar);}
  const button=bar.querySelector('button');
  button.onclick=()=>add.click();
  const pick=v=>typeof v==='string'?v:Y.i18n.pick(v||{});
  const sync=()=>{
   const label=add.querySelector('.product-add-main__label')?.textContent||Y.i18n.t('pp.add');
   const price=document.querySelector('#pPrice')?.textContent.trim()||Y.i18n.formatPrice(p.price);
   const text=label+' — '+price;
   if(button.textContent!==text)button.textContent=text;
   button.disabled=add.disabled;
   const dispatch=pick(p.shipping)||(fr?'Délai d’expédition à confirmer sur WhatsApp.':'Dispatch timing confirmed on WhatsApp.');
   status.textContent=(add.disabled?label:(fr?'Disponible':'Available'))+' · '+dispatch;
  };
  sync();
  const mutation=new MutationObserver(sync);mutation.observe(add,{attributes:true,childList:true,subtree:true});
  const price=document.querySelector('#pPrice');if(price)mutation.observe(price,{childList:true,subtree:true,characterData:true});
  const refresh=()=>{
   const r=add.getBoundingClientRect();const visible=r.top>=0&&r.bottom<=innerHeight;
   bar.hidden=visible;document.body.classList.toggle('purchase-sticky-visible',!visible);
  };
  const observer=new IntersectionObserver(refresh,{threshold:[0,1]});observer.observe(add);
  window.addEventListener('resize',refresh);refresh();
  cleanup=()=>{mutation.disconnect();observer.disconnect();window.removeEventListener('resize',refresh);};
 };
})();
