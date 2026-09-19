/* One service policy for the isolated V2 preview, based on live FAQ/CGV 2026-09-19. */
(function(){
 const Y=window.YZA=window.YZA||{};
 const COPY={"fr": {"title": "Livraison, délais et retours", "shipping": "Livraison offerte au Maroc dès 500 DH pour un panier composé uniquement d’accessoires ; dès 1 500 DH pour les sacs, vêtements et paniers mixtes.", "dispatch": "Pièces en stock : expédition suivie depuis Marrakech sous 48 h. Ce délai concerne l’expédition, pas la réception. Retrait au studio à Guéliz sur confirmation. Livraison le jour même à Marrakech uniquement après confirmation de la zone et du créneau.", "returns": "Retours sous 30 jours après réception, pour les pièces non portées et dans leur état d’origine. Premier retour pris en charge par YZA ; retours suivants à la charge du client. Les pièces personnalisées ne sont ni reprises ni remboursées. Toute pièce défectueuse est reprise sans frais.", "editions": "Éditions limitées : après épuisement, fabrication à la main sur commande, environ trois semaines. Les pièces personnalisées sont fabriquées spécialement pour vous.", "shortDispatch": "En stock : expédition sous 48 h.", "sameDay": "Livraison Marrakech — sur confirmation", "limited": "Éditions limitées · sur commande après épuisement"}, "en": {"title": "Delivery, timing and returns", "shipping": "Free Morocco delivery from 500 DH for accessories-only baskets; from 1,500 DH for bags, clothing and mixed baskets.", "dispatch": "In-stock pieces: tracked dispatch from Marrakech within 48 hours. This is dispatch time, not delivery time. Guéliz studio pickup on confirmation. Same-day delivery in Marrakech only after the area and time slot have been confirmed.", "returns": "Returns within 30 days of receipt, for unworn pieces in their original condition. YZA covers the first return; subsequent returns are at the customer’s expense. Personalised pieces are not returnable or refundable. Defective pieces are taken back free of charge.", "editions": "Limited editions: once sold out, handmade to order in about three weeks. Personalised pieces are made specifically for you.", "shortDispatch": "In stock: dispatch within 48 hours.", "sameDay": "Marrakech delivery — on confirmation", "limited": "Limited editions · made to order once sold out"}};
 const current=()=>COPY[Y.i18n?.lang]||COPY.en;
 const localized=k=>Object.fromEntries(Object.entries(COPY).map(([l,c])=>[l,c[k]]));
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 Y.servicePolicy=Object.assign(Y.servicePolicy||{},{freeShippingAccessoriesDh:50000,freeShippingDh:150000,returnsDays:30,dispatchHours:48,madeToOrderWeeks:3,shipping:localized('shortDispatch'),summary:localized('shipping'),returns:localized('returns'),editions:localized('editions')});
 Y.serviceBlockHTML=()=>{const c=current();return '<section class="service-policy-block"><h3>'+esc(c.title)+'</h3>'+['shipping','dispatch','returns','editions'].map(k=>'<p>'+esc(c[k])+'</p>').join('')+'</section>';};
 Y.serviceLongText=()=>Y.serviceBlockHTML();
 for(const [key,field] of [['morocco-delivery','shipping'],['returns','returns'],['limited','editions']]){
  const feature=Y.serviceFeature?.(key);if(feature)feature.text=localized(field);
 }
 if(typeof STR!=='undefined'){
  for(const key of ['pp.ship.txt','cart.acc.shipTxt']) STR[key]=Object.fromEntries(Object.entries(COPY).map(([l,c])=>[l,[c.shipping,c.dispatch,c.returns,c.editions].join(' ')]));
  STR['announce.editions']=localized('limited');
 }
 function render(){
  const c=current();
  const cart=document.querySelector('#cartBody');
  if(cart&&!cart.querySelector('#cartServicePolicy')){
   const detail=document.createElement('details');detail.id='cartServicePolicy';
   detail.innerHTML='<summary></summary><div data-yza-service-block></div>';cart.append(detail);
  }
  const label=document.querySelector('#cartServicePolicy summary');if(label&&label.textContent!==c.title)label.textContent=c.title;
  document.querySelectorAll('[data-yza-policy-field]').forEach(el=>{const text=c[el.dataset.yzaPolicyField]||'';if(el.textContent!==text)el.textContent=text;});
  document.querySelectorAll('[data-yza-service-block],#accShip,#purchaseService,[data-i18n="cart.acc.shipTxt"]').forEach(el=>{
   const markup=Y.serviceBlockHTML();if(el.innerHTML!==markup){el.removeAttribute('data-i18n');el.setAttribute('data-yza-service-block','');el.innerHTML=markup;}
  });
  document.querySelectorAll('#sameDayDelivery').forEach(el=>{if(el.textContent!==c.sameDay)el.textContent=c.sameDay;});
 }
 Y.renderServicePolicy=render;
 document.addEventListener('DOMContentLoaded',()=>{
  render();Y.i18n?.onChange(()=>queueMicrotask(render));
  // Cart and product content can be rebuilt by existing language/variant handlers.
  let queued=false;
  new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;render();});}}).observe(document.body,{childList:true,subtree:true});
 });
})();
