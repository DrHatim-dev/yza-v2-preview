/* Charms collection presentation; product data and original photography stay in the catalogue. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pick = v => typeof v === 'string' ? v : v?.[YZA.i18n?.lang] || v?.fr || '';
  const labels = {
    fr: ['Accueil','Toute la boutique','Charms en raphia','Le Fruit Market','Un peu de Marrakech, à emporter. Cerises, agrumes et fruits du marché, crochetés à la main dans notre atelier de Guéliz. Un charm se glisse au sac et change toute une silhouette.','Raphia naturel','Crocheté à la main','Éditions limitées','Tous les fruits','Fruits entiers','Tranches & moitiés','charms','Les couleurs du marché','Du raphia au fruit','De petits fruits. Un grand savoir-faire.','Teint à la main, le raphia prend forme maille après maille. Chaque fruit est rembourré avec ses propres chutes de raphia : la matière se retrouve jusque dans les détails.','Une anse de panier, un sac, un bijou : composez votre propre marché, un fruit à la fois.','Découvrir le Studio','Aucun charm pour cette sélection.','Voir tous les charms','Crochetés à la main · Atelier de Guéliz, Marrakech','Le Studio'],
    en: ['Home','All collections','Raffia charms','The Fruit Market','A little Marrakech to take with you. Cherries, citrus and market fruits, crocheted by hand at our Guéliz atelier. One charm on a bag can change a whole look.','Natural raffia','Crocheted by hand','Limited editions','All fruits','Whole fruits','Slices & halves','charms','Colours from the market','From raffia to fruit','Small fruits. Remarkable handwork.','Hand-dyed raffia takes shape stitch by stitch. Each fruit is filled with its own raffia offcuts, keeping the material at the heart of every detail.','A basket handle, a bag, a piece of jewellery: put together your own market, one fruit at a time.','Discover the Studio','No charms match this selection.','View all charms','Crocheted by hand · Guéliz atelier, Marrakech','The Studio'],
    es: ['Inicio','Toda la tienda','Charms de rafia','El mercado de frutas','Un poco de Marrakech para llevar. Cerezas, cítricos y frutas del mercado, tejidos a mano en nuestro taller de Guéliz. Un charm en el bolso cambia todo un look.','Rafia natural','Ganchillo a mano','Ediciones limitadas','Todas las frutas','Frutas enteras','Rodajas y mitades','charms','Los colores del mercado','De la rafia a la fruta','Pequeñas frutas. Un gran saber hacer.','La rafia teñida a mano toma forma punto a punto. Cada fruta se rellena con sus propios recortes de rafia: la materia llega hasta el último detalle.','Un asa de cesta, un bolso, una joya: compón tu propio mercado, una fruta a la vez.','Descubrir el estudio','No hay charms para esta selección.','Ver todos los charms','Ganchillo a mano · Taller de Guéliz, Marrakech','El estudio'],
    tr: ['Ana sayfa','Tüm koleksiyon','Rafya çanta süsleri','Meyve pazarı','Yanınızda taşıyacağınız küçük bir Marakeş. Kirazlar, turunçgiller ve pazar meyveleri, Guéliz atölyemizde elle örülür. Çantadaki tek bir süs, görünümünüzü değiştirir.','Doğal rafya','Elle tığ işi','Sınırlı üretim','Tüm meyveler','Bütün meyveler','Dilimler ve yarımlar','süs','Pazarın renkleri','Rafyadan meyveye','Küçük meyveler. Usta eller.','Elle boyanan rafya ilmek ilmek şekil alır. Her meyve kendi rafya kırpıntılarıyla doldurulur: malzeme en küçük detayda bile kendini gösterir.','Bir sepet sapı, bir çanta, bir takı: kendi pazarınızı meyve meyve oluşturun.','Stüdyoyu keşfet','Bu seçimde süs bulunamadı.','Tüm süsleri gör','Elle tığ işi · Guéliz atölyesi, Marakeş','Stüdyo'],
    ar: ['الرئيسية','كل التشكيلات','تعليقات من الرافيا','سوق الفواكه','قطعة صغيرة من مراكش ترافقك. كرز وحمضيات وفواكه السوق، تُحاك بالكروشيه يدويًا في ورشتنا بجليز. تعليقة واحدة على الحقيبة تغيّر الإطلالة.','رافيا طبيعية','كروشيه يدوي','إصدارات محدودة','كل الفواكه','فواكه كاملة','شرائح وأنصاف','تعليقات','ألوان السوق','من الرافيا إلى الفاكهة','فواكه صغيرة. حرفة متقنة.','تأخذ الرافيا المصبوغة يدويًا شكلها غرزة بعد غرزة. تُحشى كل ثمرة ببقايا الرافيا الخاصة بها، لتبقى المادة حاضرة في أدق التفاصيل.','مقبض سلة أو حقيبة أو قطعة حلي: شكّلي سوقك الخاص، ثمرة تلو الأخرى.','اكتشفي الاستوديو','لا توجد تعليقات لهذا الاختيار.','عرض كل التعليقات','كروشيه يدوي · ورشة جليز، مراكش','الاستوديو']
  };
  const keys = ['home','shop','title','eyebrow','intro','material','handmade','edition','all','whole','slices','results','photo','craft','craftTitle','craftText','styling','studioLink','empty','reset','announcement','studio'];
  const copy = () => Object.fromEntries(keys.map((k,i) => [k,(labels[YZA.i18n?.lang] || labels.fr)[i]]));
  const groupOf = p => /-(slice|half)-/.test(p.handle) ? 'slices' : 'whole';
  let active = false, built = false, restore = [];
  function move(node, parent, before) {
    if (!node || !parent) return;
    const marker = document.createComment('charms-header-position'); node.before(marker); parent.insertBefore(node,before || null);
    restore.push(() => marker.replaceWith(node));
  }
  function header() {
    const c = copy(),line = document.querySelector('.announcement__line');
    if (line) { line.removeAttribute('data-i18n'); line.textContent = c.announcement; }
    const link = document.querySelector('.charms-nav-link[href="studio"],.charms-nav-link[href="/studio"]');
    if (link) link.textContent = c.studio;
  }
  function mountHeader() {
    if (document.body.classList.contains('site-maison')) return;
    const inner = document.querySelector('.header__inner'), nav = inner?.querySelector('.nav'), actions = inner?.querySelector('.header__actions');
    for (const path of ['studio','grossistes']) {
      const link = nav?.querySelector(`a[href="${path}"],a[href="/${path}"]`); if (!link || !actions) continue;
      const wrapper = link.closest('.nav-item'); link.classList.add('charms-nav-link'); move(link,actions,actions.querySelector('#searchOpen'));
      if (wrapper) { wrapper.hidden = true; restore.push(() => { wrapper.hidden = false; link.classList.remove('charms-nav-link'); }); }
    }
    const burger = inner?.querySelector('#burger');
    if (burger) { const slot = document.createElement('div'); slot.className = 'charms-menu-slot'; inner.prepend(slot); move(burger,slot); restore.push(() => slot.remove()); }
    const line = document.querySelector('.announcement__line');
    if (line) { const key = line.getAttribute('data-i18n'),text = line.textContent; restore.push(() => { if(key)line.setAttribute('data-i18n',key);line.textContent = key ? YZA.i18n.t(key) : text; }); }
    header();
  }
  function build() {
    if (built) return; built = true;
    const wrap = document.querySelector('main > .container-wide');
    const intro = document.createElement('section'); intro.id = 'charmsIntro'; intro.className = 'charms-intro charms-extra'; wrap.prepend(intro);
    const controls = document.createElement('div'); controls.id = 'charmsControls'; controls.className = 'charms-controls charms-extra'; wrap.querySelector('.toolbar').prepend(controls);
    const craft = document.createElement('section'); craft.id = 'charmsCraft'; craft.className = 'charms-craft charms-extra'; wrap.querySelector('#charmStyling').before(craft);
    wrap.addEventListener('click', event => {
      if (!active) return;
      const button = event.target.closest('[data-charms-group],[data-charms-reset]');
      if (!button) return;
      YZA.collectionFilters.update(button.hasAttribute('data-charms-reset') ? {reset:true} : {group:button.dataset.charmsGroup});
    });
  }
  function filter(list,next) {
    if (!['whole','slices'].includes(next.charmGroup)) next.charmGroup = '';
    return list.filter(p => !next.charmGroup || groupOf(p) === next.charmGroup);
  }
  YZA.charmCollection = {
    prepare(next) {
      const on = next.cat === 'charms';
      if (on && !built) {
        let saved = ''; try { saved = localStorage.getItem('yza_charms_grid_density') || ''; } catch (_) { /* Optional storage. */ }
        next.density = ['3','4','6'].includes(saved) ? saved : '4'; build();
      }
      if (on !== active) { active = on; document.body.classList.toggle('charms-maison',on); if (on) mountHeader(); else { restore.forEach(fn => fn()); restore = []; } }
      document.querySelectorAll('.charms-extra').forEach(e => { e.hidden = !on; });
    },
    filter,
    renderGrid(el,list,next,card) {
      el.innerHTML = list.map((p,i) => card(p,i,i < 4,{tile:true}).replace('</article>',`<p class="charms-card-note">${esc(pick(p.dimensions))}</p></article>`)).join('');
    },
    render(next,list) {
      if (!active) return;
      const c = copy(),products = YZA.byCategory('charms'); header();
      try { localStorage.setItem('yza_charms_grid_density',next.density); } catch (_) { /* Optional storage. */ }
      document.getElementById('charmsIntro').innerHTML = `<nav class="charms-breadcrumb" aria-label="${esc(c.home)}"><a href="/">${esc(c.home)}</a><span>/</span><a href="/collections">${esc(c.shop)}</a><span>/</span><span>${esc(c.title)}</span></nav><div class="charms-intro-grid"><div><p class="charms-eyebrow">${esc(c.eyebrow)} <i aria-hidden="true"></i> Guéliz, Marrakech</p><h1>${esc(c.title)}</h1><p class="charms-intro-copy">${esc(c.intro)}</p><ul class="charms-details">${['material','handmade','edition'].map(k => `<li>${esc(c[k])}</li>`).join('')}</ul></div><figure class="charms-intro-photo"><img src="/yza-v2-preview/assets/products/fruit-market/styling/charms-fruit-market-bundle.jpg" alt="${esc(c.photo)}" width="720" height="960" decoding="async"><figcaption>${esc(c.photo)} <span aria-hidden="true">↗</span></figcaption></figure></div>`;
      const focused = document.activeElement?.closest('[data-charms-group]'),focusKey = focused?.dataset.charmsGroup;
      document.getElementById('charmsControls').innerHTML = `<div class="charms-tabs" role="group" aria-label="${esc(c.eyebrow)}">${['','whole','slices'].map(group => `<button type="button" data-charms-group="${group}" aria-pressed="${next.charmGroup === group}">${esc(c[group || 'all'])}<span>${products.filter(p => !group || groupOf(p) === group).length}</span></button>`).join('')}</div>`;
      if (focused) [...document.querySelectorAll('[data-charms-group]')].find(e => e.dataset.charmsGroup === focusKey)?.focus({preventScroll:true});
      for (const id of ['collectionSort','gridDensity']) document.getElementById(id).hidden = false;
      const count = document.getElementById('resultCount'); count.textContent = `${list.length} ${c.results}`; count.setAttribute('role','status'); count.setAttribute('aria-live','polite');
      document.getElementById('sortSelect').value = next.sort;
      if (!list.length) document.getElementById('collectionGrid').innerHTML = `<div class="charms-empty"><p>${esc(c.empty)}</p><button type="button" class="charms-text-link" data-charms-reset>${esc(c.reset)}</button></div>`;
      document.getElementById('charmsCraft').innerHTML = `<div><p class="charms-eyebrow">${esc(c.craft)}</p><h2>${esc(c.craftTitle)}</h2></div><div><p>${esc(c.craftText)}</p><p>${esc(c.styling)}</p><a href="/studio" class="charms-text-link">${esc(c.studioLink)} <span aria-hidden="true">↗</span></a></div>`;
      document.querySelectorAll('#charmStyling video').forEach(video => { video.controls = true; video.autoplay = true; video.muted = true; video.defaultMuted = true; video.playsInline = true; });
    }
  };
})();
