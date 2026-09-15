/* Jawhara collection presentation; catalog, card and cart behavior remain shared. */
(function () {
 'use strict';
 const YZA = window.YZA = window.YZA || {};
 const texts = {
  fr: {home:'Accueil',title:'Prêt-à-porter Jawhara',announcement:'Taille libre XS à XXL · Coupé et cousu à Guéliz',studio:'Le Studio',intro:'Tops, jupes paréo et pantalons coupés et cousus main à Guéliz, brodés de signes berbères et finis de pompons de perles.',introEnd:'Un seul tissu, des couleurs à associer — et pas de tailles à choisir.',pieces:'pièces dans la collection',colors:'couleurs de Jawhara',fit:'taille libre, une seule coupe',all:'Tout',tops:'Tops',pareos:'Paréos',pants:'Pantalons',color:'Couleur',allColors:'Toutes les couleurs',clear:'Effacer la couleur',results:'pièces',fabric:'Le tissu Jawhara',fabricTitle:'Un seul tissu, huit façons de le porter.',fabricOne:'Toute la collection est coupée dans le même Jawhara, et cousue à l’atelier de Guéliz. Chaque pièce est brodée de signes berbères et finie de pompons de perles dorées, faits main par Fatima.',fabricTwo:'Parce que le tissu est commun, les pièces se répondent : un top et un paréo de la même couleur font un ensemble, deux couleurs voisines font un dépareillé. C’est un vestiaire modulaire, pas une suite de silhouettes figées.',sets:'Voir les ensembles',sizeTitle:'Pas de taille à choisir',sizeText:'Chaque pièce Jawhara est coupée en taille libre, de XS à XXL. Les paréos se nouent, les pantalons se froncent, les tops se règlent. Une seule décision à prendre : la couleur.',made:'Fait à Guéliz',madeText:'Coupé et cousu à l’atelier, par Fatimzahra et son équipe.',repair:'Réparé à vie',repairText:'Une pièce YZA se répare à l’atelier, sans limite de temps.',returns:'30 jours',returnsText:'Pour changer d’avis : la pièce revient non portée, dans son état d’origine.',empty:'Aucune pièce dans cette sélection.',reset:'Voir toutes les pièces',note:'Taille libre · XS–XXL',lookAlt:'Ensemble Jawhara porté'},
  en: {home:'Home',title:'Jawhara ready-to-wear',announcement:'One size XS to XXL · Cut and sewn in Guéliz',studio:'The Studio',intro:'Tops, pareo skirts and trousers cut and sewn by hand in Guéliz, embroidered with Amazigh symbols and finished with beaded tassels.',introEnd:'One fabric, colors to combine — and no sizes to choose.',pieces:'pieces in the collection',colors:'Jawhara colors',fit:'one size, one cut',all:'All',tops:'Tops',pareos:'Pareos',pants:'Trousers',color:'Color',allColors:'All colors',clear:'Clear color',results:'pieces',fabric:'The Jawhara fabric',fabricTitle:'One fabric, eight ways to wear it.',fabricOne:'The entire collection is cut from the same Jawhara fabric and sewn in the Guéliz atelier. Each piece is embroidered with Amazigh symbols and finished with golden beaded tassels handmade by Fatima.',fabricTwo:'With a shared fabric, the pieces work together: a top and pareo in the same color make a set; neighboring colors create a mix. A modular wardrobe you can make your own.',sets:'Explore the sets',sizeTitle:'No size to choose',sizeText:'Each Jawhara piece comes in one size, from XS to XXL. Pareos tie, trousers gather and tops adjust. All that remains is choosing your color.',made:'Made in Guéliz',madeText:'Cut and sewn in the atelier by Fatimzahra and her team.',repair:'Lifetime repairs',repairText:'A YZA piece can be repaired in the atelier, with no time limit.',returns:'30 days',returnsText:'To change your mind: return the piece unworn, in its original condition.',empty:'No pieces match this selection.',reset:'View all pieces',note:'One size · XS–XXL',lookAlt:'Jawhara outfit worn'},
  es: {home:'Inicio',title:'Prêt-à-porter Jawhara',announcement:'Talla única XS a XXL · Cortado y cosido en Guéliz',studio:'El estudio',intro:'Tops, faldas pareo y pantalones cortados y cosidos a mano en Guéliz, bordados con símbolos amazigh y acabados con borlas de cuentas.',introEnd:'Un tejido, colores para combinar y ninguna talla que elegir.',pieces:'piezas en la colección',colors:'colores de Jawhara',fit:'talla única, un solo corte',all:'Todo',tops:'Tops',pareos:'Pareos',pants:'Pantalones',color:'Color',allColors:'Todos los colores',clear:'Quitar el color',results:'piezas',fabric:'El tejido Jawhara',fabricTitle:'Un tejido, ocho formas de llevarlo.',fabricOne:'Toda la colección se corta en el mismo Jawhara y se cose en el taller de Guéliz. Cada pieza lleva símbolos amazigh bordados y borlas de cuentas doradas hechas a mano por Fatima.',fabricTwo:'El tejido común une las piezas: un top y un pareo del mismo color forman un conjunto; colores cercanos se combinan entre sí. Un vestuario modular para hacerlo tuyo.',sets:'Ver los conjuntos',sizeTitle:'Sin talla que elegir',sizeText:'Cada pieza Jawhara es de talla única, de XS a XXL. Los pareos se anudan, los pantalones se fruncen y los tops se ajustan. Solo queda elegir el color.',made:'Hecho en Guéliz',madeText:'Cortado y cosido en el taller por Fatimzahra y su equipo.',repair:'Reparación de por vida',repairText:'Una pieza YZA se repara en el taller sin límite de tiempo.',returns:'30 días',returnsText:'Para cambiar de opinión: devuelve la pieza sin usar, en su estado original.',empty:'No hay piezas para esta selección.',reset:'Ver todas las piezas',note:'Talla única · XS–XXL',lookAlt:'Conjunto Jawhara puesto'},
  tr: {home:'Ana sayfa',title:'Jawhara hazır giyim',announcement:'XS–XXL tek beden · Guéliz’de kesilip dikildi',studio:'Stüdyo',intro:'Guéliz’de elle kesilip dikilen, Amazigh sembolleriyle işlenen ve boncuk püsküllerle tamamlanan üstler, pareo etekler ve pantolonlar.',introEnd:'Tek kumaş, birlikte kullanabileceğiniz renkler — beden seçmenize gerek yok.',pieces:'koleksiyondaki parça',colors:'Jawhara rengi',fit:'tek beden, tek kesim',all:'Tümü',tops:'Üstler',pareos:'Pareolar',pants:'Pantolonlar',color:'Renk',allColors:'Tüm renkler',clear:'Rengi temizle',results:'parça',fabric:'Jawhara kumaşı',fabricTitle:'Tek kumaş, sekiz farklı kullanım.',fabricOne:'Koleksiyonun tamamı aynı Jawhara kumaşından kesilir ve Guéliz atölyesinde dikilir. Her parça Amazigh sembolleri ve Fatima’nın el yapımı altın boncuk püskülleriyle tamamlanır.',fabricTwo:'Ortak kumaş parçaları bir araya getirir: aynı renkte bir üst ve pareo takım olur, yakın renkler birbiriyle birleşir. Kendi tarzınıza uyarlayabileceğiniz modüler bir gardırop.',sets:'Takımları keşfet',sizeTitle:'Beden seçmenize gerek yok',sizeText:'Her Jawhara parçası XS’den XXL’ye tek bedendir. Pareolar bağlanır, pantolonlar büzülür, üstler ayarlanır. Geriye yalnızca renk seçimi kalır.',made:'Guéliz’de üretildi',madeText:'Fatimzahra ve ekibi tarafından atölyede kesilip dikildi.',repair:'Ömür boyu onarım',repairText:'YZA parçaları zaman sınırı olmadan atölyede onarılabilir.',returns:'30 gün',returnsText:'Fikrinizi değiştirmek için: parçayı kullanılmamış ve ilk durumunda iade edin.',empty:'Bu seçimde parça bulunamadı.',reset:'Tüm parçaları gör',note:'Tek beden · XS–XXL',lookAlt:'Giyilmiş Jawhara takımı'},
  ar: {home:'الرئيسية',title:'أزياء جوهرة الجاهزة',announcement:'مقاس حر من XS إلى XXL · قص وخياطة في جليز',studio:'الاستوديو',intro:'توبات وتنانير باريو وسراويل تُقص وتُخاط يدويًا في جليز، مطرزة برموز أمازيغية ومزينة بشرابات من الخرز.',introEnd:'قماش واحد وألوان تتناسق معًا — دون الحاجة لاختيار المقاس.',pieces:'قطع في التشكيلة',colors:'ألوان جوهرة',fit:'مقاس حر، قصة واحدة',all:'الكل',tops:'توبات',pareos:'باريو',pants:'سراويل',color:'اللون',allColors:'كل الألوان',clear:'إلغاء اللون',results:'قطع',fabric:'قماش جوهرة',fabricTitle:'قماش واحد، ثماني طرق لارتدائه.',fabricOne:'تُقص التشكيلة كلها من قماش جوهرة نفسه وتُخاط في ورشة جليز. تُطرز كل قطعة برموز أمازيغية وتُزين بشرابات من الخرز الذهبي تصنعها فاطمة يدويًا.',fabricTwo:'القماش المشترك يجعل القطع تتكامل: توب وباريو باللون نفسه يشكلان طقمًا، والألوان المتقاربة تُنسق معًا. خزانة مرنة تصممين تنسيقاتها بنفسك.',sets:'اكتشفي الأطقم',sizeTitle:'لا حاجة لاختيار المقاس',sizeText:'كل قطعة جوهرة بمقاس حر من XS إلى XXL. تُربط تنانير الباريو، وتُجمع السراويل، وتُضبط التوبات. يبقى اختيار اللون فقط.',made:'صنع في جليز',madeText:'قص وخياطة في الورشة على يد فاطمة الزهراء وفريقها.',repair:'إصلاح مدى الحياة',repairText:'يمكن إصلاح قطعة YZA في الورشة دون حد زمني.',returns:'30 يومًا',returnsText:'لتغيير رأيك: تُعاد القطعة غير ملبوسة وفي حالتها الأصلية.',empty:'لا توجد قطع مطابقة لهذا الاختيار.',reset:'شاهدي كل القطع',note:'مقاس حر · XS–XXL',lookAlt:'طقم جوهرة عند ارتدائه'}
 };
 const copy = () => texts[YZA.i18n?.lang] || texts.fr;
 const pick = value => typeof value === 'string' ? value : value?.[YZA.i18n?.lang] || value?.fr || value?.en || '';
 const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
 let active = false, built = false, state = null, restoreHeader = [];
 const groups = ['', 'tops', 'pareos', 'pants'];
 function palette(products) {
  const colors = new Map();
  for (const product of products) for (const slug of product.colorSlugs || []) {
   if (colors.has(slug)) continue;
   const released = YZA.jawharaColorMedia?.[product.handle]?.colors?.[slug] || {};
   const color = YZA.jawharaColors?.find(c=>c.slug===slug) || {};
   const row = YZA.productColorway?.(product.handle,slug) || {};
   colors.set(slug,{...color,...released,slug,name:row.name || released.name || color,hex:row.swatchHex || row.hex || released.hex || color.hex});
  }
  return [...colors.values()].filter(c=>/^#[\da-f]{6}$/i.test(c.hex));
 }
 function move(node,parent,before=null) {
  if (!node || !parent) return;
  const marker=document.createComment('rtw-header-position');node.before(marker);parent.insertBefore(node,before);
  restoreHeader.push(()=>marker.replaceWith(node));
 }
 function header() {
  const line=document.querySelector('.announcement__line');
  if (line) { line.removeAttribute('data-i18n');line.textContent=copy().announcement; }
  const studio=document.querySelector('.rtw-nav-link[href="studio"],.rtw-nav-link[href="/studio"]');
  if(studio) studio.textContent=copy().studio;
 }
 function mountHeader() {
    if (document.body.classList.contains('site-maison')) return;
  const inner=document.querySelector('.header__inner'), nav=inner?.querySelector('.nav'),actions=inner?.querySelector('.header__actions');
  for(const path of ['studio','grossistes']) {
   const link=nav?.querySelector(`a[href="${path}"],a[href="/${path}"]`);
   if(!link||!actions)continue;
   const wrapper=link.closest('.nav-item');link.classList.add('rtw-nav-link');move(link,actions,actions.querySelector('#searchOpen'));
   if(wrapper){wrapper.hidden=true;restoreHeader.push(()=>{wrapper.hidden=false;});}
  }
  const burger=inner?.querySelector('#burger');
  if(burger){const slot=document.createElement('div');slot.className='rtw-menu-slot';inner.prepend(slot);move(burger,slot);restoreHeader.push(()=>slot.remove());}
  const line=document.querySelector('.announcement__line');
  if(line){const key=line.getAttribute('data-i18n'),text=line.textContent;restoreHeader.push(()=>{if(key)line.setAttribute('data-i18n',key);line.textContent=key?YZA.i18n.t(key):text;});}
  header();
 }
 function build() {
  if(built)return;built=true;
  const wrap=document.querySelector('main > .container-wide'),toolbar=wrap.querySelector('.toolbar');
  const intro=document.createElement('section');intro.className='rtw-intro rtw-extra';intro.id='rtwIntro';wrap.prepend(intro);
  const filters=document.createElement('div');filters.className='rtw-filters rtw-extra';filters.id='rtwFilters';toolbar.prepend(filters);
  const story=document.createElement('div');story.className='rtw-editorial rtw-extra';story.id='rtwEditorial';wrap.append(story);
  toolbar.id='rtwToolbar';
  toolbar.addEventListener('click',event=>{
   const group=event.target.closest('[data-rtw-group]'),color=event.target.closest('[data-rtw-color]');
   if(group)YZA.collectionFilters.update({group:group.dataset.rtwGroup});
   if(color)YZA.collectionFilters.update({color:color.dataset.rtwColor===state.color?'':color.dataset.rtwColor});
  });
  document.querySelector('main').addEventListener('click',event=>{
   const reset=event.target.closest('[data-rtw-reset]'),sets=event.target.closest('[data-rtw-sets]');
   if(!reset&&!sets)return;
   event.preventDefault();YZA.collectionFilters.update(reset?{reset:true}:{group:''});
   toolbar.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });
 }
 function colorMedia(handle, slug) {
  const product=YZA.getProduct?.(handle);
  const row=YZA.productColorway?.(handle,slug) || YZA.jawharaColorMedia?.[handle]?.colors?.[slug];
  const front=row?.front || product?.img || '';
  const gallery=[...new Set([...(row?.gallery || []),...(!row ? product?.gallery || [] : [])])];
  const night=gallery.find(src=>/\/lifestyle\//.test(src)&&/-nuit\.(?:webp|jpe?g|png)(?:\?|$)/i.test(src));
  const day=gallery.find(src=>/\/lifestyle\//.test(src)&&/-jour\.(?:webp|jpe?g|png)(?:\?|$)/i.test(src));
  const worn=day || gallery.find(src=>src!==front&&!/\/catalog\//.test(src)) || front;
  return {product,row,front,gallery,night,day,worn};
 }
 function applyCardMood(card, animate) {
  if(!active || !card)return;
  const slug=card.querySelector('[data-color-slug].is-active')?.dataset.colorSlug || state.color || '';
  const media=colorMedia(card.dataset.productHandle,slug);
  const night=document.documentElement.dataset.yzaMood==='night';
  const src=night ? media.night || media.worn : media.front;
  const img=card.querySelector('.product-card__img:not(.product-card__img--hover)');
  if(!img || !src)return;
  const description=pick(media.product?.name) + (media.row ? ' — '+pick(media.row.name) : '');
  const suffix=night && (media.night || media.worn!==media.front) ? pick(media.night ? {fr:'porté de nuit',en:'worn at night',es:'de noche',tr:'gece görünümü',ar:'إطلالة ليلية'} : {fr:'porté',en:'worn',es:'puesto',tr:'giyilmiş',ar:'عند الارتداء'}) : '';
  img.alt=suffix ? description+' — '+suffix : pick(media.row?.alt || media.product?.imageAlt || media.product?.name);
  img.removeAttribute('srcset');img.removeAttribute('sizes');
  card.classList.toggle('rtw-night-photo',night);
  card.dataset.rtwPhoto=night ? (media.night?'night':media.worn!==media.front?'worn':'product') : 'day';
  if(card.dataset.rtwImage===src && img.getAttribute('src')===src)return;
  card.dataset.rtwImage=src;
  // Calling the shared swap even when returning to the currently visible source
  // cancels a pending night photograph after a fast second toggle.
  if(YZA.motion?.swapImage)YZA.motion.swapImage(img,src);
  else img.src=src;
 }
 const api=YZA.rtwCollection={
  applyCardMood,
  hoverSource(handle,slug,night) {
   const media=colorMedia(handle,slug);
   // A lone evening photograph stays visible on hover rather than flashing white.
   if(night)return '';
   return media.day || media.gallery.find(src=>src!==media.front) || '';
  },
  applyMood(mode,animate) {
   if(!active)return;
   document.querySelectorAll('#collectionGrid .product-card').forEach(card=>applyCardMood(card,animate));
   document.querySelectorAll('.rtw-lookbook img').forEach((img,index)=>{
    if(!img.dataset.daySrc)img.dataset.daySrc=img.getAttribute('src');
    const handles=['yza-scarf-top-jawhara-ss26','yza-button-up-shirt-jawhara-ss26','yza-palazzo-pants-jawhara-ss26'];
    const scene=colorMedia(handles[index],state.color||['blanc-jasmin','bordeaux','noir-nuit'][index]);
    const src=mode==='night' ? scene.night || scene.worn : img.dataset.daySrc;
    if(!img.dataset.dayAlt)img.dataset.dayAlt=img.alt;
    img.alt=mode==='night' ? pick(scene.product?.name)+' — '+pick(scene.row?.name) : img.dataset.dayAlt;
    if(img.dataset.moodImage===src && img.getAttribute('src')===src)return;
    img.dataset.moodImage=src;
    if(YZA.motion?.swapImage)YZA.motion.swapImage(img,src);else img.src=src;
   });
  },
  prepare(next) {
   state=next;const on=next.cat==='rtw';
   if(on&&!built)build();
   if(on!==active){active=on;document.body.classList.toggle('rtw-maison',on);if(on)mountHeader();else{restoreHeader.forEach(fn=>fn());restoreHeader=[];}}
   document.querySelectorAll('.rtw-extra').forEach(e=>e.hidden=!on);
  },
  filter(list,next) {
   if(!groups.includes(next.rtwGroup))next.rtwGroup='';
   if(next.color&&!list.some(p=>p.colorSlugs?.includes(next.color)))next.color='';
   return list.filter(p=>(!next.rtwGroup||p.category===next.rtwGroup)&&(!next.color||p.colorSlugs?.includes(next.color)));
  },
  render(next,list) {
   if(!active)return;
   const c=copy(),products=YZA.byCategory('rtw'),colors=palette(products);
   header();
   document.getElementById('rtwIntro').innerHTML=`<nav class="rtw-breadcrumb" aria-label="${esc(c.home)}"><a href="/">${esc(c.home)}</a><span>/</span><span>${esc(YZA.i18n.t('nav.rtw'))}</span><span>/</span><span>Jawhara</span></nav><div class="rtw-intro-grid"><div><p class="rtw-eyebrow">Resort Marrakech Wear <i aria-hidden="true"></i> All Seasons 2026</p><h1>${esc(c.title)}</h1><p class="rtw-intro-copy">${esc(c.intro)} ${esc(c.introEnd)}</p></div><div class="rtw-facts"><div><strong>${products.length}</strong><span>${esc(c.pieces)}</span></div><div><strong>${colors.length}</strong><span>${esc(c.colors)}</span></div><div><strong dir="ltr">XS–XXL</strong><span>${esc(c.fit)}</span></div></div></div>`;
   const railScroll=document.querySelector('.rtw-color-options')?.scrollLeft || 0;
   const focused=document.activeElement?.closest('#rtwFilters button');
   const focusKey=focused ? (focused.hasAttribute('data-rtw-group')?['group',focused.dataset.rtwGroup]:['color',focused.dataset.rtwColor]) : null;
   const selected=colors.find(color=>color.slug===next.color);
   document.getElementById('rtwFilters').innerHTML=`<div class="rtw-tabs" role="group" aria-label="${esc(YZA.i18n.t('nav.rtw'))}">${groups.map(group=>`<button type="button" data-rtw-group="${group}" aria-pressed="${next.rtwGroup===group}">${esc(c[group||'all'])}<span>${group?products.filter(p=>p.category===group).length:products.length}</span></button>`).join('')}</div><div class="rtw-colors" role="group" aria-label="${esc(c.color)}"><span class="rtw-color-label">${esc(c.color)}</span><div class="rtw-color-options">${colors.map(color=>`<button type="button" class="rtw-color-option" data-rtw-color="${esc(color.slug)}" aria-pressed="${next.color===color.slug}" title="${esc(pick(color.name))}" aria-label="${esc(pick(color.name))}"><i style="--swatch:${esc(color.hex)}" aria-hidden="true"></i><span>${esc(pick(color.name))}</span></button>`).join('')}</div>${selected?`<button type="button" class="rtw-color-clear" data-rtw-color="" aria-label="${esc(c.clear)}">${esc(pick(selected.name))}<span aria-hidden="true">×</span></button>`:''}</div>`;
   document.querySelector('.rtw-color-options').scrollLeft=railScroll;
   if(focusKey){const candidates=[...document.querySelectorAll(`#rtwFilters [data-rtw-${focusKey[0]}]`)];(candidates.find(e=>e.getAttribute(`data-rtw-${focusKey[0]}`)===focusKey[1])||candidates[0])?.focus({preventScroll:true});}
   const count=document.getElementById('resultCount');count.textContent=`${list.length} ${c.results}`;count.setAttribute('role','status');count.setAttribute('aria-live','polite');
   document.getElementById('sortSelect').value=next.sort;
   if(!list.length)document.getElementById('collectionGrid').innerHTML=`<div class="rtw-empty"><img src="assets/rtw/maison/am-06.png" alt="" width="30" height="30"><p>${esc(c.empty)}</p><button type="button" data-rtw-reset>${esc(c.reset)}</button></div>`;
   document.querySelectorAll('#collectionGrid .product-card').forEach(card=>{
    const swatches=card.querySelector('[data-color-swatches]');if(swatches)card.append(swatches);
    const note=document.createElement('p');note.className='rtw-fit-note';note.textContent=c.note;
    card.querySelector('.product-card__info').after(note);
   });
   document.getElementById('rtwEditorial').innerHTML=`<section class="rtw-fabric"><div><p class="rtw-eyebrow"><img src="assets/rtw/maison/am-16.png" alt="" width="17" height="36">${esc(c.fabric)}</p><h2>${esc(c.fabricTitle)}</h2><p>${esc(c.fabricOne)}</p><p>${esc(c.fabricTwo)}</p><a href="#rtwToolbar" class="rtw-text-link" data-rtw-sets>${esc(c.sets)}</a></div><div class="rtw-lookbook">${[1,2,3].map(i=>`<img src="assets/rtw/maison/look-0${i}.jpg" alt="${esc(c.lookAlt)} ${i}" width="480" height="720" loading="lazy" decoding="async">`).join('')}</div></section><section class="rtw-sizing"><img src="assets/rtw/maison/am-woven.png" alt="" width="38" height="38"><h2>${esc(c.sizeTitle)}</h2><p>${esc(c.sizeText)}</p><div class="rtw-reassurances">${['made','repair','returns'].map(key=>`<div><h3>${esc(c[key])}</h3><p>${esc(c[key+'Text'])}</p></div>`).join('')}</div></section>`;
   api.applyMood(document.documentElement.dataset.yzaMood || 'day',false);
  }
 };
})();
