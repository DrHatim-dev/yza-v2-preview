/* ZIP 11 presentation. Editorial order, never a claim of measured sales rank.
   Product photography was copied byte-for-byte from the live storefront. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pick = v => typeof v === 'string' ? v : v?.[YZA.i18n?.lang] || v?.fr || '';
  const selection = [
  {
    "handle": "la-sculpture-xs-basket-bag-ss26",
    "group": "bags",
    "color": "rouge",
    "src": "/yza-v2-preview/assets/collections/best-sellers/la-sculpture-xs-basket-bag-ss26-main.optimized.webp",
    "width": 1086,
    "height": 1448,
    "hover": ""
  },
  {
    "handle": "yza-pareo-skirt-midi-jawhara-ss26",
    "group": "rtw",
    "color": "blanc-jasmin",
    "src": "/yza-v2-preview/assets/collections/best-sellers/yza-pareo-skirt-midi-jawhara-ss26-main.webp",
    "width": 1200,
    "height": 1600,
    "hover": ""
  },
  {
    "handle": "watermelon-raffia-earrings-ss26",
    "group": "accessories",
    "color": "",
    "src": "/yza-v2-preview/assets/collections/best-sellers/watermelon-raffia-earrings-ss26-main.webp",
    "width": 1100,
    "height": 1467,
    "hover": "/yza-v2-preview/assets/collections/best-sellers/watermelon-raffia-earrings-ss26-hover.webp"
  },
  {
    "handle": "raffia-whole-orange-charm-ss26",
    "group": "charms",
    "color": "",
    "src": "/yza-v2-preview/assets/collections/best-sellers/raffia-whole-orange-charm-ss26-main.jpg",
    "width": 1100,
    "height": 1467,
    "hover": ""
  },
  {
    "handle": "la-sculpture-s-basket-bag-ss26",
    "group": "bags",
    "color": "violet",
    "src": "/yza-v2-preview/assets/collections/best-sellers/la-sculpture-s-basket-bag-ss26-main.optimized.webp",
    "width": 1086,
    "height": 1448,
    "hover": ""
  },
  {
    "handle": "kiwi-raffia-earrings-ss26",
    "group": "accessories",
    "color": "",
    "src": "/yza-v2-preview/assets/collections/best-sellers/kiwi-raffia-earrings-ss26-main.webp",
    "width": 1100,
    "height": 1467,
    "hover": ""
  },
  {
    "handle": "raffia-cherries-charm-ss26",
    "group": "charms",
    "color": "",
    "src": "/yza-v2-preview/assets/collections/best-sellers/raffia-cherries-charm-ss26-main.jpg",
    "width": 1100,
    "height": 1467,
    "hover": "/yza-v2-preview/assets/collections/best-sellers/raffia-cherries-charm-ss26-hover.jpg"
  },
  {
    "handle": "yza-scarf-top-jawhara-ss26",
    "group": "rtw",
    "color": "blanc-jasmin",
    "src": "/yza-v2-preview/assets/collections/best-sellers/yza-scarf-top-jawhara-ss26-main.webp",
    "width": 1200,
    "height": 1600,
    "hover": ""
  },
  {
    "handle": "la-nouvelle-vague-xs-basket-bag-ss26",
    "group": "bags",
    "color": "bleu",
    "src": "/yza-v2-preview/assets/collections/best-sellers/la-nouvelle-vague-xs-basket-bag-ss26-main.jpg",
    "width": 1100,
    "height": 1650,
    "hover": "/yza-v2-preview/assets/collections/best-sellers/la-nouvelle-vague-xs-basket-bag-ss26-main.webp"
  },
  {
    "handle": "raffia-lemon-slice-charm-ss26",
    "group": "charms",
    "color": "",
    "src": "/yza-v2-preview/assets/collections/best-sellers/raffia-lemon-slice-charm-ss26-main.jpg",
    "width": 1100,
    "height": 1467,
    "hover": ""
  },
  {
    "handle": "cherries-raffia-earrings-ss26",
    "group": "accessories",
    "color": "",
    "src": "/yza-v2-preview/assets/collections/best-sellers/cherries-raffia-earrings-ss26-main.webp",
    "width": 1100,
    "height": 1467,
    "hover": "/yza-v2-preview/assets/collections/best-sellers/cherries-raffia-earrings-ss26-hover.webp"
  },
  {
    "handle": "yza-palazzo-pants-jawhara-ss26",
    "group": "rtw",
    "color": "blanc-jasmin",
    "src": "/yza-v2-preview/assets/collections/best-sellers/yza-palazzo-pants-jawhara-ss26-main.webp",
    "width": 1200,
    "height": 1600,
    "hover": ""
  }
];
  const editorial = {
  "charms": {
    "src": "/yza-v2-preview/assets/collections/best-sellers/editorial-charms.jpg",
    "width": 681,
    "height": 908
  },
  "bags": {
    "src": "/yza-v2-preview/assets/collections/best-sellers/editorial-bags.jpg",
    "width": 1080,
    "height": 1334
  },
  "rtw": {
    "src": "/yza-v2-preview/assets/collections/best-sellers/editorial-rtw.jpg",
    "width": 1000,
    "height": 1500
  },
  "accessories": {
    "src": "/yza-v2-preview/assets/collections/best-sellers/editorial-accessories.jpg",
    "width": 1080,
    "height": 1440
  },
  "atelier": {
    "src": "/yza-v2-preview/assets/collections/best-sellers/editorial-atelier.jpg",
    "width": 1100,
    "height": 1650
  }
};
  const keys=['home','title','eye','intro','pieces','from','worlds','spotlight','signatures','selection','all','charms','accessories','bags','rtw','marquee','start','storyEye','storyTitle','storyText','studio','promise','promiseText','allShop','whyBag','whySkirt','whyEarrings','empty','reset','announcement','studioLabel'];
  const labels={
    fr:['Accueil','Les plus aimées','Coups de cœur','Douze pièces pour entrer dans l’univers YZA : nos sacs, charms, bijoux et silhouettes Jawhara. Une sélection de la maison, façonnée à la main à Marrakech.','pièces dans la sélection','à partir de','univers YZA','À la une','Trois pièces signatures','La sélection','Tout','Charms','Bijoux','Paniers','Prêt-à-porter','Petites séries · Fait main à Guéliz · Des pièces à garder','Quatre façons de commencer','Au rythme de l’atelier','De petites séries, de grandes histoires.','Du choix de la matière aux dernières finitions, chaque pièce garde la trace du geste de l’artisane. Le raphia se tresse, se teint et se crochète ; le coton Jawhara prend forme à l’atelier. Découvrez les couleurs et les disponibilités sur chaque fiche produit.','Rencontrer la maison','Fait main, garanti à vie','Une pièce YZA se garde, se transmet et se répare. Les réparations se font à l’atelier de Guéliz, pour continuer à porter les pièces que vous aimez.','Explorer toute la boutique','Un petit format en raphia, du jour au soir.','Un paréo à nouer, à porter à votre façon.','La couleur d’un fruit, crochetée à la main.','Aucune pièce pour cette recherche.','Revenir à la sélection','Éditions limitées · Fait main à Marrakech','Le Studio'],
    en:['Home','The most loved','House favourites','Twelve pieces to discover YZA: our bags, charms, jewellery and Jawhara silhouettes. A house selection, made by hand in Marrakech.','pieces in the selection','from','YZA collections','In focus','Three signature pieces','The selection','All','Charms','Jewellery','Baskets','Ready-to-wear','Small runs · Handmade in Guéliz · Pieces to keep','Four ways to begin','At the atelier’s pace','Small runs, lasting stories.','From selecting materials to the final details, each piece carries the maker’s touch. Raffia is woven, dyed and crocheted; Jawhara cotton takes shape in the atelier. Discover colours and availability on each product page.','Meet the house','Handmade, guaranteed for life','A YZA piece is kept, passed on and repaired. Repairs take place at the Guéliz atelier, so you can keep wearing the pieces you love.','Explore the whole shop','A small raffia bag, from day to evening.','A wrap skirt to tie and wear your own way.','The colour of a fruit, crocheted by hand.','No pieces match this search.','Back to the selection','Limited editions · Handmade in Marrakech','The Studio'],
    es:['Inicio','Las más queridas','Favoritos de la casa','Doce piezas para descubrir YZA: bolsos, charms, joyas y siluetas Jawhara. Una selección de la casa, hecha a mano en Marrakech.','piezas en la selección','desde','universos YZA','En primer plano','Tres piezas emblemáticas','La selección','Todo','Charms','Joyas','Cestas','Prêt-à-porter','Series pequeñas · Hecho a mano en Guéliz · Piezas para conservar','Cuatro formas de empezar','Al ritmo del atelier','Series pequeñas, grandes historias.','Desde la elección del material hasta los últimos detalles, cada pieza conserva el gesto de la artesana. La rafia se trenza, se tiñe y se trabaja a ganchillo; el algodón Jawhara toma forma en el atelier. Consulta los colores y la disponibilidad en cada ficha.','Conocer la casa','Hecho a mano, garantizado de por vida','Una pieza YZA se conserva, se transmite y se repara. Las reparaciones se realizan en el atelier de Guéliz para seguir llevando las piezas que amas.','Explorar toda la tienda','Un bolso pequeño de rafia, del día a la noche.','Un pareo para anudar y llevar a tu manera.','El color de una fruta, tejido a mano.','No hay piezas para esta búsqueda.','Volver a la selección','Ediciones limitadas · Hecho a mano en Marrakech','El Studio'],
    tr:['Ana sayfa','En sevilenler','Atölyenin favorileri','YZA’yı keşfetmek için on iki parça: çantalar, charm’lar, takılar ve Jawhara tasarımları. Marakeş’te elde hazırlanan bir atölye seçkisi.','parçalık seçki','başlangıç fiyatı','YZA koleksiyonu','Öne çıkanlar','Üç imza parça','Seçki','Tümü','Charm’lar','Takılar','Sepetler','Hazır giyim','Küçük seriler · Guéliz’de el yapımı · Saklanacak parçalar','Başlamak için dört yol','Atölyenin ritminde','Küçük seriler, uzun hikâyeler.','Malzeme seçiminden son ayrıntılara kadar her parça, onu yapan kadının el izini taşır. Rafya örülür, boyanır ve tığla işlenir; Jawhara pamuğu atölyede şekillenir. Renkleri ve stok durumunu ürün sayfalarında keşfedin.','Atölyeyi tanıyın','El yapımı, ömür boyu garantili','Bir YZA parçası saklanır, aktarılır ve onarılır. Sevdiğiniz parçaları giymeye devam edebilmeniz için onarımlar Guéliz atölyesinde yapılır.','Tüm mağazayı keşfedin','Gündüzden akşama küçük bir rafya çanta.','Kendi tarzınızda bağlayıp giyeceğiniz bir pareo.','Bir meyvenin rengi, elde tığla işlenmiş.','Bu aramada parça bulunamadı.','Seçkiye dön','Sınırlı üretim · Marakeş’te el yapımı','Studio'],
    ar:['الرئيسية','القطع الأقرب للقلب','اختيارات الدار','اثنتا عشرة قطعة لاكتشاف عالم YZA: حقائب وتعليقات وحلي وتصاميم جوهرة. مختارات الدار، تصنع يدوياً في مراكش.','قطعة في المختارات','ابتداءً من','مجموعات YZA','في الواجهة','ثلاث قطع مميزة','المختارات','الكل','تعليقات','حلي','سلال','ملابس','سلاسل صغيرة · صناعة يدوية في جليز · قطع نحتفظ بها','أربع طرق للبداية','على إيقاع الأتيليه','سلاسل صغيرة، حكايات طويلة.','من اختيار الخامة إلى اللمسات الأخيرة، تحمل كل قطعة أثر يد الحرفية. ينسج الرافيا ويصبغ ويشتغل بالكروشيه، ويتشكل قطن جوهرة في الأتيليه. اكتشفي الألوان والتوفر في صفحة كل قطعة.','اكتشفي الدار','صناعة يدوية، ضمان مدى الحياة','قطعة YZA نحافظ عليها ونورثها ونصلحها. تتم الإصلاحات في أتيليه جليز لتواصلي ارتداء القطع التي تحبينها.','اكتشفي المتجر كاملاً','حقيبة رافيا صغيرة، من النهار إلى المساء.','تنورة باريو تربطينها على طريقتك.','لون فاكهة، مشغول بالكروشيه يدوياً.','لا توجد قطع لهذا البحث.','العودة إلى المختارات','إصدارات محدودة · صناعة يدوية في مراكش','الاستوديو']
  };
  const copy=()=>Object.fromEntries(keys.map((k,i)=>[k,(labels[YZA.i18n?.lang] || labels.fr)[i]]));
  const groups=['charms','accessories','bags','rtw'];
  const routes={charms:'charms',accessories:'bijoux',bags:'sacs',rtw:'pret-a-porter'};
  const allProducts=()=>selection.map(row=>YZA.getProduct?.(row.handle)).filter(Boolean);
  const rowFor=p=>selection.find(row=>row.handle===p.handle);
  let active=false,built=false,restore=[],cardRenderer=null;
  function move(node, parent, before) {
    if (!node || !parent) return;
    const marker = document.createComment('bestsellers-header-position'); node.before(marker); parent.insertBefore(node,before || null);
    restore.push(() => marker.replaceWith(node));
  }
  function header() {
    const c = copy(),line = document.querySelector('.announcement__line');
    if (line) { line.removeAttribute('data-i18n'); line.textContent = c.announcement; }
    const link = document.querySelector('.bestsellers-nav-link[href="studio"],.bestsellers-nav-link[href="/studio"]');
    if (link) link.textContent = c.studioLabel;
  }
  function mountHeader() {
    if (document.body.classList.contains('site-maison')) return;
    const inner = document.querySelector('.header__inner'), nav = inner?.querySelector('.nav'), actions = inner?.querySelector('.header__actions');
    for (const path of ['studio','grossistes']) {
      const link = nav?.querySelector(`a[href="${path}"],a[href="/${path}"]`); if (!link || !actions) continue;
      const wrapper = link.closest('.nav-item'); link.classList.add('bestsellers-nav-link'); move(link,actions,actions.querySelector('#searchOpen'));
      if (wrapper) { wrapper.hidden = true; restore.push(() => { wrapper.hidden = false; link.classList.remove('bestsellers-nav-link'); }); }
    }
    const burger = inner?.querySelector('#burger');
    if (burger) { const slot = document.createElement('div'); slot.className = 'bestsellers-menu-slot'; inner.prepend(slot); move(burger,slot); restore.push(() => slot.remove()); }
    const line = document.querySelector('.announcement__line');
    if (line) { const key = line.getAttribute('data-i18n'),text = line.textContent; restore.push(() => { if(key)line.setAttribute('data-i18n',key);line.textContent = key ? YZA.i18n.t(key) : text; }); }
    header();
  }

  function build() {
    built=true;
    const wrap=document.querySelector('main > .container-wide'),toolbar=wrap.querySelector('.toolbar');
    const intro=document.createElement('section');intro.id='bsIntro';intro.className='bs-intro bs-extra';wrap.prepend(intro);
    const podium=document.createElement('section');podium.id='bsPodium';podium.className='bs-podium bs-extra';toolbar.before(podium);
    const band=document.createElement('div');band.id='bsBand';band.className='bs-band bs-extra';toolbar.before(band);
    const controls=document.createElement('div');controls.id='bsControls';controls.className='bs-controls bs-extra';toolbar.prepend(controls);
    const title=document.createElement('div');title.id='bsGridTitle';title.className='bs-label bs-grid-label bs-extra';toolbar.after(title);
    const stories=document.createElement('div');stories.id='bsEditorial';stories.className='bs-editorial bs-extra';wrap.append(stories);
    wrap.addEventListener('click',event=>{
      if(!active)return;
      const button=event.target.closest('[data-bs-group],[data-bs-reset]');if(!button)return;
      const top=toolbar.getBoundingClientRect().top;
      YZA.collectionFilters.update(button.hasAttribute('data-bs-reset')?{reset:true}:{group:button.dataset.bsGroup});
      if(top<=window.innerHeight) window.scrollBy({top:toolbar.getBoundingClientRect().top-top,behavior:'instant'});
    });
  }
  function filter(next) {
    if(!groups.includes(next.bestGroup))next.bestGroup='';
    return allProducts().filter(p=>next.bestGroup ? rowFor(p).group===next.bestGroup : next.q || selection.findIndex(r=>r.handle===p.handle)>2);
  }
  function makeCard(p,i,podium=false) {
    const row=rowFor(p),c=copy(),template=document.createElement('template');
    template.innerHTML=cardRenderer({...p,_cardColorSlug:row.color},i,podium,{tile:true});
    const card=template.content.firstElementChild,media=card.querySelector('.product-card__media'),image=media.querySelector('.product-card__img');
    card.classList.add('bs-card');card.classList.toggle('bs-card--featured',podium);card.dataset.selectionNumber=String(selection.indexOf(row)+1);
    for(const attr of ['srcset','sizes','onerror','style']) image.removeAttribute(attr);
    image.src=row.src;image.width=row.width;image.height=row.height;image.alt=pick(p.name);image.loading=podium?'eager':'lazy';
    media.querySelectorAll('.product-card__img--hover,video').forEach(e=>e.remove());media.classList.remove('has-hover-video');
    if(row.hover){const hover=document.createElement('img');hover.className='product-card__img product-card__img--hover';hover.src=row.hover;hover.alt='';hover.setAttribute('aria-hidden','true');hover.loading='lazy';hover.decoding='async';hover.width=row.width;hover.height=row.height;media.append(hover);}else card.classList.add('bs-card--detail');
    const swatches=card.querySelector('.product-card__swatches');if(swatches)swatches.hidden=true;
    const badge=document.createElement('span');badge.className='bs-number';badge.setAttribute('aria-hidden','true');badge.textContent=String(selection.indexOf(row)+1).padStart(2,'0');media.append(badge);
    const note=document.createElement('p');note.className='bs-card-note';note.textContent=podium?c[['whyBag','whySkirt','whyEarrings'][selection.indexOf(row)]]:c[row.group];card.append(note);
    return card.outerHTML;
  }
  function photo(key,alt) { const p=editorial[key];return `<img src="${esc(p.src)}" alt="${esc(alt)}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async">`; }
  function editorialHTML() {
    const c=copy();
    return `<section class="bs-worlds"><h2>${esc(c.start)}</h2><div class="bs-world-grid">${groups.map(key=>`<a href="/collections/${routes[key]}">${photo(key,c[key])}<div><h3>${esc(c[key])}</h3><span aria-hidden="true">↗</span></div></a>`).join('')}</div></section><section class="bs-story"><div><p class="bs-eyebrow">${esc(c.storyEye)}</p><h2>${esc(c.storyTitle)}</h2><p>${esc(c.storyText)}</p><a class="bs-text-link" href="/studio">${esc(c.studio)} <span aria-hidden="true">↗</span></a></div>${photo('atelier',c.storyEye)}</section><section class="bs-promise"><img class="bs-glyph" src="/yza-v2-preview/assets/rtw/maison/am-woven.png" alt="" width="40" height="40"><h2>${esc(c.promise)}</h2><p>${esc(c.promiseText)}</p><a class="bs-shop-link" href="/collections">${esc(c.allShop)} <span aria-hidden="true">↗</span></a></section>`;
  }
  YZA.bestsellerCollection={
    selection,
    prepare(next){
      const on=next.cat==='bestsellers';
      if(on&&!built){let saved='';try{saved=localStorage.getItem('yza_bestsellers_grid_density')||'';}catch(_){}next.density=['3','4','6'].includes(saved)?saved:'3';build();}
      if(on!==active){active=on;document.body.classList.toggle('bestsellers-maison',on);if(on)mountHeader();else{restore.forEach(fn=>fn());restore=[];}}
      document.querySelectorAll('.bs-extra').forEach(e=>{e.hidden=!on;});
    },
    filter,
    renderGrid(el,list,next,card){cardRenderer=card;el.innerHTML=list.map((p,i)=>makeCard(p,i)).join('');},
    render(next,list){
      if(!active)return;
      const c=copy(),all=allProducts();header();
      try{localStorage.setItem('yza_bestsellers_grid_density',next.density);}catch(_){}
      document.getElementById('bsIntro').innerHTML=`<nav class="bs-breadcrumb" aria-label="${esc(c.home)}"><a href="/">${esc(c.home)}</a><span>/</span><span>Best Sellers</span></nav><div class="bs-intro-grid"><div><p class="bs-eyebrow">${esc(c.eye)} <i aria-hidden="true"></i> SS26/27</p><h1>Best Sellers</h1><p class="bs-intro-copy">${esc(c.intro)}</p></div><div class="bs-facts"><div><strong>${all.length}</strong><span>${esc(c.pieces)}</span></div><div><strong>${esc(YZA.i18n.formatPrice(Math.min(...all.map(p=>p.price))))}</strong><span>${esc(c.from)}</span></div><div><strong>4</strong><span>${esc(c.worlds)}</span></div></div></div>`;
      const podium=document.getElementById('bsPodium');podium.hidden=!!(next.bestGroup||next.q);
      if(cardRenderer&&!podium.hidden)podium.innerHTML=`<div class="bs-label"><span>${esc(c.spotlight)}</span><i></i><span>${esc(c.signatures)}</span></div><div class="bs-podium-grid">${all.slice(0,3).map((p,i)=>makeCard(p,i,true)).join('')}</div>`;
      document.getElementById('bsBand').innerHTML=`<span class="sr-only">${esc(c.marquee)}</span><div aria-hidden="true">${Array.from({length:8},()=>`<span>${esc(c.marquee)} <b>✳</b></span>`).join('')}</div>`;
      const focused=document.activeElement?.closest('[data-bs-group]'),focusKey=focused?.dataset.bsGroup;
      document.getElementById('bsControls').innerHTML=`<div class="bs-tabs" role="group" aria-label="${esc(c.selection)}">${['',...groups].map(group=>`<button type="button" data-bs-group="${group}" aria-pressed="${next.bestGroup===group}">${esc(c[group||'all'])}<span>${group?selection.filter(r=>r.group===group).length:all.length}</span></button>`).join('')}</div>`;
      if(focused)[...document.querySelectorAll('[data-bs-group]')].find(e=>e.dataset.bsGroup===focusKey)?.focus({preventScroll:true});
      document.getElementById('bsGridTitle').innerHTML=`<span>${esc(c.selection)}</span><i></i>`;
      document.getElementById('bsEditorial').innerHTML=editorialHTML();
      const count=document.getElementById('resultCount');count.textContent=`${list.length} ${YZA.i18n.t('col.results')}`;count.setAttribute('role','status');count.setAttribute('aria-live','polite');
      for(const id of ['collectionSort','gridDensity'])document.getElementById(id).hidden=false;
      document.getElementById('sortSelect').value=next.sort;
      if(!list.length)document.getElementById('collectionGrid').innerHTML=`<div class="bs-empty"><p>${esc(c.empty)}</p><button type="button" data-bs-reset>${esc(c.reset)}</button></div>`;
      document.title='Best Sellers — YZA';
      const canonical='https://yza-shop.com/collections/best-sellers';
      document.querySelector('link[rel="canonical"]')?.setAttribute('href',canonical);
      for(const key of ['og:title','twitter:title'])document.querySelector(`[property="${key}"],[name="${key}"]`)?.setAttribute('content','Best Sellers — YZA');
      for(const key of ['og:image','twitter:image'])document.querySelector(`[property="${key}"],[name="${key}"]`)?.setAttribute('content','https://yza-shop.com'+selection[0].src);
      for(const key of ['description','og:description','twitter:description'])document.querySelector(`[property="${key}"],[name="${key}"]`)?.setAttribute('content',c.intro);
      document.querySelector('[property="og:url"]')?.setAttribute('content',canonical);
    }
  };
})();
