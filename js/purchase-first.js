/* Purchase-first layout; uses the original catalog selectors and add handler. */
(function(){
 const Y=window.YZA=window.YZA||{}; let cleanup=()=>{};
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // One end sequence on every product page, whatever the category: product sheet, questions,
 // then the same three service tiles (owner's lock list: harmonise all product pages).
 const SERVICE_TITLES={fr:['Livraison','Retours','Paiement'],en:['Delivery','Returns','Payment'],es:['Envío','Devoluciones','Pago'],tr:['Teslimat','İade','Ödeme'],ar:['التوصيل','الإرجاع','الدفع']};
 function harmonise(p){
  const editorial=document.querySelector('#bagEditorial,#charmEditorial,#earringEditorial,#clothingEditorial');
  if(!editorial||!p)return;
  const pick=v=>typeof v==='string'?v:Y.i18n.pick(v||{});
  const titles=SERVICE_TITLES[Y.i18n.lang]||SERVICE_TITLES.fr;
  const items=[[titles[0],pick(p.shipping)],[titles[1],pick(p.returns)],[titles[2],pick(Y.serviceFeature?.('payment')?.text)]].filter(([,body])=>body);
  editorial.querySelectorAll('.bag-included,.charm-guarantees,.earring-services,.clothing-services,.product-services').forEach(node=>node.remove());
  const questions=editorial.querySelector('.bag-questions');
  const specs=editorial.querySelector('.bag-specs,.clothing-specs');
  if(specs&&questions&&specs.nextElementSibling!==questions)questions.before(specs);
  if(!items.length)return;
  const services=document.createElement('section');
  services.className='bag-section product-services';
  services.innerHTML='<div>'+items.map(([title,body])=>'<article><h2>'+esc(title)+'</h2><p>'+esc(body)+'</p></article>').join('')+'</div>';
  if(questions)questions.after(services);else editorial.append(services);
 }
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
  if(!service){service=document.createElement('div');service.id='purchaseService';}
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
   const dispatch=pick(Y.servicePolicy?.shipping)||pick(p.shipping)||(fr?'Délai d’expédition à confirmer sur WhatsApp.':'Dispatch timing confirmed on WhatsApp.');
   status.textContent=add.disabled?label:(fr?'Disponible':'Available')+' · '+dispatch;
  };
  sync();
  const mutation=new MutationObserver(sync);mutation.observe(add,{attributes:true,childList:true,subtree:true});
  const price=document.querySelector('#pPrice');if(price)mutation.observe(price,{childList:true,subtree:true,characterData:true});
  harmonise(p);
  const refresh=()=>{
   // A hidden button (0×0 at the top) is not "visible": the sticky bar must take over.
   const r=add.getBoundingClientRect();const visible=r.height>0&&r.top>=0&&r.bottom<=innerHeight;
   bar.hidden=visible;document.body.classList.toggle('purchase-sticky-visible',!visible);
  };
  const observer=new IntersectionObserver(refresh,{threshold:[0,1]});observer.observe(add);
  window.addEventListener('resize',refresh);refresh();
  cleanup=()=>{mutation.disconnect();observer.disconnect();window.removeEventListener('resize',refresh);};
 };
})();
