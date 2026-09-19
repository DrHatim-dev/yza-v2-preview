/* Public naming fixes without changing commerce variant identities. */
(function(){
 const Y=window.YZA=window.YZA||{};
 function publicUrl(value){
  if(!value||!value.includes('la-nouvelle-vague-'))return value;
  try{const u=new URL(value,location.href);if(u.searchParams.get('color')==='rose'){u.searchParams.set('color','vert-sapin');return u.href;}}catch(e){}
  return value;
 }
 function links(){
  document.querySelectorAll('a[href*="la-nouvelle-vague-"],link[rel="canonical"],meta[property="og:url"]').forEach(e=>{
   const attr=e.tagName==='META'?'content':'href',old=e.getAttribute(attr),next=publicUrl(old);
   if(next!==old)e.setAttribute(attr,next);
  });
 }
 Y.correctProductPresentation=function(p){
  if(p.handle?.startsWith('la-nouvelle-vague-')){
   const u=new URL(location.href);if(u.searchParams.get('color')==='rose'){u.searchParams.set('color','vert-sapin');history.replaceState(history.state,'',u);}
  }
  const fr=Y.i18n?.lang==='fr';
  if(fr&&p.handle==='la-sculpture-m-basket-bag-ss26'){
   const color=document.querySelector('#pColorName')?.textContent.trim()||'';
   const black=/black|noir/i.test(color)||new URL(location.href).searchParams.get('color')==='noir';
   const title=black?'La Sculpture M noire — grand panier fait main | YZA':`La Sculpture M${color?' '+color:''} — panier fait main | YZA`;
   const desc=black?'La Sculpture M noire : grand panier en raphia et feuille de bananier, avec anses noires. Fabriqué à la main à Marrakech. Découvrez ses dimensions et sa disponibilité.':p.seoDescription?.fr;
   document.title=title;
   document.querySelectorAll('meta[property="og:title"],meta[name="twitter:title"]').forEach(e=>e.content=title);
   if(desc)document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]').forEach(e=>e.content=desc);
  }
  links();
 };
 document.addEventListener('DOMContentLoaded',()=>{
  links();let pending=false;new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;links();});}}).observe(document.body,{childList:true,subtree:true});
 });
})();
