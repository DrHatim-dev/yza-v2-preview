/* Bags collection presentation. Catalogue rows own product images, prices and variants. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pick = v => typeof v === 'string' ? v : v?.[YZA.i18n?.lang] || v?.fr || v?.en || '';
  const families = ['la-sculpture', 'la-nouvelle-vague'];
  const labels = {
    fr: ['Accueil','Toute la boutique','Sacs panier en raphia','Paniers iconiques','Le panier marocain réinventé : La Sculpture et La Nouvelle Vague, tressées main à Marrakech. Deux silhouettes, trois formats et des finitions propres à chaque modèle. Faites pour durer, réparées à vie.','modèles, tressés à Guéliz','formats, XS à M','À vie','réparations à l’atelier','Les deux','Format','Tous','paniers','Coloris','Tressé à la main à Guéliz','Le guide des formats','Quelle taille pour quoi ?','Chaque silhouette existe en XS, S et M. Choisissez le format qui accompagne votre quotidien, puis le modèle qui vous ressemble.','Voir ce format','Le tressage','Des fibres, des gestes, une signature.','La Sculpture associe raphia et feuille de bananier. Ses anses sont façonnées sur une âme en fil de fer, puis gainées de raphia.','La Nouvelle Vague se distingue par ses feuilles de bananier tressées, ses finitions cuir et ses anses ornées de perles. Chaque famille garde sa matière et son geste.','Visiter l’atelier','Un panier ne se jette pas','Les fibres se réchauffent au soleil, le cuir se patine avec l’usage. Une pièce YZA se porte, se garde et se répare à l’atelier de Guéliz.','Réparé à vie','À l’atelier de Guéliz. À distance, seuls les frais d’envoi peuvent s’appliquer.','Édition limitée','Des pièces fabriquées à la main, au rythme de l’atelier.','30 jours','Pour changer d’avis : retour non porté, dans son état d’origine.','Aucun panier pour cette sélection.','Voir tous les paniers','Éditions limitées · Réparées à vie à l’atelier de Guéliz','Le Studio','Voir par','Couleurs de départ'],
    en: ['Home','All collections','Handwoven basket bags','Signature baskets','The Moroccan basket reimagined: La Sculpture and La Nouvelle Vague, woven by hand in Marrakech. Two silhouettes, three sizes, each with its own finishing details. Made to last, repaired for life.','designs, woven in Guéliz','sizes, XS to M','For life','repairs at the atelier','Both','Size','All','baskets','Colour','Handwoven in Guéliz','The size guide','Which size, for what?','Both silhouettes come in XS, S and M. Choose the size for your everyday life, then the design that feels like you.','View this size','The weaving','Fibres, gestures, a signature.','La Sculpture combines raffia and banana leaf. Its handles are shaped around a wire core, then wrapped in raffia.','La Nouvelle Vague has a woven banana-leaf body, leather finishing and beaded handles. Each family keeps its own materials and techniques.','Visit the atelier','A basket is worth keeping','Fibres warm in the sun; leather develops a patina with use. A YZA piece is worn, kept and repaired at our Guéliz atelier.','Repaired for life','At the Guéliz atelier. For remote repairs, shipping costs may apply.','Limited edition','Handmade pieces, made at the pace of the atelier.','30 days','To change your mind: return your unworn piece in its original condition.','No baskets match this selection.','View all baskets','Limited editions · Repaired for life at our Guéliz atelier','The Studio','View by','Original colours'],
    es: ['Inicio','Toda la tienda','Bolsos cesta tejidos a mano','Cestas icónicas','La cesta marroquí reinventada: La Sculpture y La Nouvelle Vague, tejidas a mano en Marrakech. Dos siluetas, tres tamaños y acabados propios de cada modelo. Hechas para durar, reparadas de por vida.','modelos, tejidos en Guéliz','tamaños, de XS a M','De por vida','reparaciones en el taller','Ambos','Tamaño','Todos','cestas','Color','Tejido a mano en Guéliz','Guía de tamaños','¿Qué tamaño para cada ocasión?','Ambas siluetas existen en XS, S y M. Elige el tamaño para tu día a día y después el modelo que te representa.','Ver este tamaño','El tejido','Fibras, gestos, una firma.','La Sculpture combina rafia y hoja de banano. Sus asas se forman sobre un alma de alambre y se envuelven en rafia.','La Nouvelle Vague combina hojas de banano tejidas, acabados de cuero y asas con cuentas. Cada familia conserva sus materiales y sus gestos.','Visitar el taller','Una cesta se conserva','Las fibras se calientan al sol y el cuero adquiere pátina con el uso. Una pieza YZA se lleva, se guarda y se repara en el taller de Guéliz.','Reparada de por vida','En el taller de Guéliz. A distancia, pueden aplicarse gastos de envío.','Edición limitada','Piezas hechas a mano, al ritmo del taller.','30 días','Para cambiar de opinión: devuelve la pieza sin usar y en su estado original.','No hay cestas para esta selección.','Ver todas las cestas','Ediciones limitadas · Reparadas de por vida en Guéliz','El estudio','Ver','Colores originales'],
    tr: ['Ana sayfa','Tüm koleksiyon','El örgüsü sepet çantalar','İkonik sepetler','Fas sepetine yeni bir bakış: Marakeş’te elle örülen La Sculpture ve La Nouvelle Vague. İki siluet, üç boy ve her modele özgü detaylar. Uzun ömürlü, ömür boyu onarılabilir.','Guéliz’de örülen model','boy, XS’den M’ye','Ömür boyu','atölyede onarım','İkisi de','Boy','Tümü','sepet','Renk','Guéliz’de elle örüldü','Boy rehberi','Hangi kullanım için hangi boy?','Her iki siluet XS, S ve M boylarında. Önce günlük yaşamına uygun boyu, ardından seni yansıtan modeli seç.','Bu boyu gör','Örgü','Lifler, el emeği, bir imza.','La Sculpture rafya ve muz yaprağını birleştirir. Sapları tel bir iskelet üzerinde şekillendirilir ve rafyayla kaplanır.','La Nouvelle Vague örülmüş muz yaprağı, deri detaylar ve boncuklu saplarla öne çıkar. Her ailenin malzemesi ve tekniği kendine özgüdür.','Atölyeyi ziyaret et','Bir sepet saklanır','Lifler güneşte sıcak tonlar kazanır, deri kullanıldıkça patina alır. Bir YZA parçası kullanılır, saklanır ve Guéliz atölyesinde onarılır.','Ömür boyu onarım','Guéliz atölyesinde. Uzaktan onarımlarda kargo ücreti uygulanabilir.','Sınırlı üretim','Atölyenin ritminde, elle üretilen parçalar.','30 gün','Fikrinizi değiştirmek için: parçayı kullanılmamış ve ilk durumunda iade edin.','Bu seçimde sepet bulunamadı.','Tüm sepetleri gör','Sınırlı üretim · Guéliz atölyesinde ömür boyu onarım','Stüdyo','Görünüm','İlk renkler'],
    ar: ['الرئيسية','كل التشكيلات','حقائب سلال منسوجة يدويًا','سلال مميزة','السلة المغربية برؤية جديدة: La Sculpture وLa Nouvelle Vague، منسوجتان يدويًا في مراكش. تصميمان وثلاثة مقاسات، ولكل نموذج تفاصيله الخاصة. صنعت لتدوم وتُصلح مدى الحياة.','تصاميم منسوجة في جليز','مقاسات، من XS إلى M','مدى الحياة','إصلاحات في الورشة','التصميمان','المقاس','الكل','سلال','اللون','منسوج يدويًا في جليز','دليل المقاسات','أي مقاس لأي استخدام؟','يتوفر التصميمان بمقاسات XS وS وM. اختاري المقاس الذي يناسب يومك ثم التصميم الذي يعبر عنك.','عرض هذا المقاس','النسج','ألياف وحركات وبصمة.','يجمع La Sculpture بين الرافيا وورق الموز. تُشكّل مقابضه حول هيكل من السلك ثم تُغطى بالرافيا.','يتميز La Nouvelle Vague بورق الموز المنسوج وتفاصيل الجلد والمقابض المزينة بالخرز. لكل عائلة موادها وتقنياتها.','زيارة الورشة','سلة تستحق الاحتفاظ بها','تكتسب الألياف دفئًا تحت الشمس ويكتسب الجلد عتقًا مع الاستخدام. تُرتدى قطعة YZA وتُحفظ وتُصلح في ورشة جليز.','إصلاح مدى الحياة','في ورشة جليز. قد تنطبق تكاليف الشحن عند الإصلاح عن بُعد.','إصدار محدود','قطع تصنع يدويًا على إيقاع الورشة.','30 يومًا','لتغيير رأيك: تُعاد القطعة غير ملبوسة وفي حالتها الأصلية.','لا توجد سلال لهذا الاختيار.','عرض كل السلال','إصدارات محدودة · إصلاح مدى الحياة في ورشة جليز','الاستوديو','العرض','الألوان الأصلية']
  };
  const keys = ['home','shop','title','eyebrow','intro','models','formats','lifetime','repairs','both','size','all','results','color','handmade','guide','sizeTitle','sizeIntro','viewSize','weaving','weavingTitle','sculptureText','vagueText','visit','repairTitle','repairIntro','repair','repairText','edition','editionText','returns','returnsText','empty','reset','announcement','studio','density','original'];
  const copy = () => Object.fromEntries(keys.map((k,i) => [k,(labels[YZA.i18n?.lang] || labels.fr)[i]]));
  const material = {
    fr: ['Raphia · feuille de bananier','Feuille de bananier · cuir · perles'],
    en: ['Raffia · banana leaf','Banana leaf · leather · beads'],
    es: ['Rafia · hoja de banano','Hoja de banano · cuero · cuentas'],
    tr: ['Rafya · muz yaprağı','Muz yaprağı · deri · boncuk'],
    ar: ['رافيا · ورق الموز','ورق الموز · جلد · خرز']
  };
  let active = false, built = false, state = null, restore = [];
  const rows = () => YZA.activeBagRows?.() || [];
  const title = family => pick(rows().find(r => r.familyHandle === family)?.familyTitle) || family;
  const available = family => rows().filter(r => r.familyHandle === family);
  const hex = row => YZA.getProduct?.(row.items[0]?.handle)?.colorMedia?.[row.colorSlug]?.hex || '#ffffff';
  const dimensions = p => pick(p?.dimensions).match(/\d+(?:[.,]\d+)?\s*[×x]\s*\d+(?:[.,]\d+)?\s*[×x]\s*\d+(?:[.,]\d+)?\s*(?:cm|سم)/i)?.[0] || '';
  const price = amount => YZA.i18n.formatPrice(amount);
  function move(node, parent, before) {
    if (!node || !parent) return;
    const marker = document.createComment('bags-header-position'); node.before(marker); parent.insertBefore(node,before || null);
    restore.push(() => marker.replaceWith(node));
  }
  function header() {
    const c = copy(),line = document.querySelector('.announcement__line');
    if (line) { line.removeAttribute('data-i18n'); line.textContent = c.announcement; }
    const link = document.querySelector('.bags-nav-link[href="studio"],.bags-nav-link[href="/studio"]');
    if (link) link.textContent = c.studio;
  }
  function mountHeader() {
    if (document.body.classList.contains('site-maison')) return;
    const inner = document.querySelector('.header__inner'), nav = inner?.querySelector('.nav'), actions = inner?.querySelector('.header__actions');
    for (const path of ['studio','grossistes']) {
      const link = nav?.querySelector(`a[href="${path}"],a[href="/${path}"]`); if (!link || !actions) continue;
      const wrapper = link.closest('.nav-item'); link.classList.add('bags-nav-link'); move(link,actions,actions.querySelector('#searchOpen'));
      if (wrapper) { wrapper.hidden = true; restore.push(() => { wrapper.hidden = false; link.classList.remove('bags-nav-link'); }); }
    }
    const burger = inner?.querySelector('#burger');
    if (burger) { const slot = document.createElement('div'); slot.className = 'bags-menu-slot'; inner.prepend(slot); move(burger,slot); restore.push(() => slot.remove()); }
    const line = document.querySelector('.announcement__line');
    if (line) { const key = line.getAttribute('data-i18n'),text = line.textContent; restore.push(() => { if(key)line.setAttribute('data-i18n',key);line.textContent = key ? YZA.i18n.t(key) : text; }); }
    header();
  }
  function build() {
    if (built) return; built = true;
    const wrap = document.querySelector('main > .container-wide'), toolbar = wrap.querySelector('.toolbar');
    const intro = document.createElement('section'); intro.className = 'bags-intro bags-extra'; intro.id = 'bagsIntro'; wrap.prepend(intro);
    const controls = document.createElement('div'); controls.className = 'bags-controls bags-extra'; controls.id = 'bagsControls'; toolbar.prepend(controls);
    const editorial = document.createElement('div'); editorial.className = 'bags-editorial bags-extra'; editorial.id = 'bagsEditorial'; wrap.append(editorial);
    document.querySelector('main').addEventListener('click', event => {
      if (!active) return;
      const family = event.target.closest('[data-bags-family]'),size = event.target.closest('[data-bags-size]'),color = event.target.closest('[data-bags-color]'),reset = event.target.closest('[data-bags-reset]');
      if (!family && !size && !color && !reset) return;
      event.preventDefault();
      if (family) YZA.collectionFilters.update({ family:family.dataset.bagsFamily });
      if (size) YZA.collectionFilters.update({ size:size.dataset.bagsSize });
      if (color) YZA.collectionFilters.update({ bagColorFamily:color.dataset.bagsColorFamily, bagColor:state.bagColors[color.dataset.bagsColorFamily] === color.dataset.bagsColor ? '' : color.dataset.bagsColor });
      if (reset) YZA.collectionFilters.update({ reset:true });
      if (size?.classList.contains('bags-size-link') || reset) toolbar.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    });
  }
  function filter(list, next) {
    const allRows = rows();
    next.bagColors = next.bagColors || {};
    for (const family of families) if (next.bagColors[family] && !allRows.some(r => r.familyHandle === family && r.colorSlug === next.bagColors[family])) next.bagColors[family] = '';
    return list.filter(p => allRows.some(r => {
      if (next.color) {
        const [family,slug] = next.color.includes(':') ? next.color.split(':') : ['',next.color];
        if ((family && family !== r.familyHandle) || slug !== r.colorSlug) return false;
      }
      const selected = next.bagColors[r.familyHandle];
      return (!selected || selected === r.colorSlug) && r.items.some(i => i.handle === p.handle);
    }));
  }
  function renderGrid(el,list,next,card) {
    const c = copy(); let index = 0;
    const focused = document.activeElement?.closest('[data-bags-color]');
    const focusKey = focused ? [focused.dataset.bagsColorFamily,focused.dataset.bagsColor] : null;
    const groups = families.map(family => {
      let choices = available(family);
      if (next.color) choices = choices.filter(r => next.color.includes(':') ? `${family}:${r.colorSlug}` === next.color : r.colorSlug === next.color);
      const selected = next.bagColors[family];
      const items = list.map(p => {
        const choice = choices.find(r => r.colorSlug === (selected || p.defaultColorSlug) && r.items.some(i => i.handle === p.handle)) || (!selected ? choices.find(r => r.items.some(i => i.handle === p.handle)) : null);
        return choice?.items.find(i => i.handle === p.handle);
      }).filter(Boolean);
      if (!items.length) return '';
      const colors = available(family), description = family === 'la-sculpture' ? c.sculptureText : c.vagueText;
      const label = selected ? pick(colors.find(r => r.colorSlug === selected)?.color) : `${colors.length} ${c.color.toLowerCase()}`;
      return `<section class="bags-family" data-bags-group="${family}"><div class="bags-family-heading"><div><div class="bags-family-title"><h2>${esc(title(family))}</h2><span>${esc((material[YZA.i18n?.lang] || material.fr)[families.indexOf(family)])}</span></div><p>${esc(description)}</p></div><div class="bags-family-colors" role="group" aria-label="${esc(c.color + ' — ' + title(family))}"><span class="bags-selected-color">${esc(label)}</span>${colors.map(r => `<button type="button" data-bags-color-family="${family}" data-bags-color="${esc(r.colorSlug)}" aria-label="${esc(pick(r.color))}" title="${esc(pick(r.color))}" aria-pressed="${selected === r.colorSlug}" style="--bag-swatch:${esc(hex(r))}"><i aria-hidden="true"></i></button>`).join('')}</div></div><div class="bags-family-cards" data-density="${esc(next.density)}">${items.map(item => {
        const p = YZA.getProduct(item.handle), ci = index++;
        const name = `${title(family)} ${item.size}`;
        const markup = card(item,ci,ci<3,name);
        return markup.replace('<div class="product-card__media-wrap">',`<div class="product-card__media-wrap"><span class="bags-size-badge" aria-hidden="true">${esc(item.size)}</span>`).replace('</article>',`<div class="bags-card-notes"><p>${esc(pick(item.color))}${dimensions(p) ? ' · ' + esc(dimensions(p)) : ''}</p><p>${esc(c.handmade)}</p></div></article>`);
      }).join('')}</div></section>`;
    }).join('');
    el.innerHTML = groups;
    if (focusKey) [...el.querySelectorAll('[data-bags-color]')].find(e => e.dataset.bagsColorFamily === focusKey[0] && e.dataset.bagsColor === focusKey[1])?.focus({preventScroll:true});
  }
  function editorialHTML() {
    const c = copy(), products = YZA.byCategory('bags');
    const sizes = ['XS','S','M'].map(size => {
      const members = products.filter(p => (p.availableSizes || []).includes(size));
      if (!members.length) return '';
      const amount = Math.min(...members.map(p => p.price));
      const representative = members.find(p => p.familyHandle === 'la-sculpture') || members[0];
      return `<article class="bags-size-card"><div><h3>${size}</h3><span>${esc(price(amount))}</span></div><p>${esc(pick(representative.whatFits))}</p><button class="bags-text-link bags-size-link" type="button" data-bags-size="${size}">${esc(c.viewSize)} <span aria-hidden="true">↗</span></button></article>`;
    }).join('');
    return `<section class="bags-size-guide"><p class="bags-eyebrow">${esc(c.guide)}</p><h2>${esc(c.sizeTitle)}</h2><p class="bags-section-intro">${esc(c.sizeIntro)}</p><div class="bags-size-grid">${sizes}</div></section><section class="bags-weaving"><img class="bags-weaving-photo" src="/yza-v2-preview/assets/story/atelier-2026-07/atelier-mains-tressage.webp" alt="${esc(c.handmade)}" width="640" height="853" loading="lazy" decoding="async"><div><p class="bags-eyebrow">${esc(c.weaving)}</p><h2>${esc(c.weavingTitle)}</h2><p>${esc(c.sculptureText)}</p><p>${esc(c.vagueText)}</p><a class="bags-text-link" href="/studio">${esc(c.visit)} <span aria-hidden="true">↗</span></a></div></section><section class="bags-repair"><h2>${esc(c.repairTitle)}</h2><p class="bags-section-intro">${esc(c.repairIntro)}</p><div class="bags-reassurances">${['repair','edition','returns'].map(key => `<div><h3>${esc(c[key])}</h3><p>${esc(c[key+'Text'])}</p></div>`).join('')}</div></section>`;
  }
  YZA.bagCollection = {
    prepare(next) {
      state = next; const on = next.cat === 'bags';
      if (on && !built) {
        let saved = ''; try { saved = localStorage.getItem('yza_bags_grid_density') || ''; } catch (_) { /* Storage is optional. */ }
        next.density = ['3','4','6'].includes(saved) ? saved : '3'; build();
      }
      if (on !== active) { active = on; document.body.classList.toggle('bags-maison',on); if (on) mountHeader(); else { restore.forEach(fn => fn()); restore = []; } }
      document.querySelectorAll('.bags-extra').forEach(e => { e.hidden = !on; });
    },
    filter, renderGrid,
    render(next,list) {
      if (!active) return;
      const c = copy(),products = YZA.byCategory('bags'); header();
      try { localStorage.setItem('yza_bags_grid_density',next.density); } catch (_) { /* Storage is optional. */ }
      document.getElementById('bagsIntro').innerHTML = `<nav class="bags-breadcrumb" aria-label="${esc(c.home)}"><a href="/">${esc(c.home)}</a><span>/</span><a href="/collections">${esc(c.shop)}</a><span>/</span><span>${esc(YZA.i18n.t('nav.bags'))}</span></nav><div class="bags-intro-grid"><div><p class="bags-eyebrow">${esc(c.eyebrow)} <i aria-hidden="true"></i> All Seasons 2026</p><h1>${esc(c.title)}</h1><p class="bags-intro-copy">${esc(c.intro)}</p></div><div class="bags-facts"><div><strong>${new Set(rows().map(r => r.familyHandle)).size}</strong><span>${esc(c.models)}</span></div><div><strong>${new Set(rows().flatMap(r => r.items.map(i => i.size))).size}</strong><span>${esc(c.formats)}</span></div><div><strong>${esc(c.lifetime)}</strong><span>${esc(c.repairs)}</span></div></div></div>`;
      const focused = document.activeElement?.closest('#bagsControls button');
      const focusKey = focused ? [focused.hasAttribute('data-bags-family') ? 'family' : 'size',focused.dataset.bagsFamily ?? focused.dataset.bagsSize] : null;
      document.getElementById('bagsControls').innerHTML = `<div class="bags-tabs" role="group" aria-label="${esc(c.models)}">${['',...families].map(f => `<button type="button" data-bags-family="${f}" aria-pressed="${next.family === f}">${esc(f ? title(f) : c.both)}<span>${f ? new Set(available(f).flatMap(r => r.items.map(i => i.handle))).size : products.length}</span></button>`).join('')}</div><div class="bags-formats" role="group" aria-label="${esc(c.size)}"><span>${esc(c.size)}</span>${['','XS','S','M'].map(s => `<button type="button" data-bags-size="${s}" aria-pressed="${next.size === s}">${esc(s || c.all)}</button>`).join('')}</div>`;
      if (focusKey) [...document.querySelectorAll(`#bagsControls [data-bags-${focusKey[0]}]`)].find(e => e.getAttribute(`data-bags-${focusKey[0]}`) === focusKey[1])?.focus({preventScroll:true});
      for (const id of ['collectionSort','gridDensity']) document.getElementById(id).hidden = false;
      const one = {fr:'panier',en:'basket',es:'cesta',tr:'sepet',ar:'سلة'};
      const count = document.getElementById('resultCount'); count.textContent = `${list.length} ${list.length === 1 ? one[YZA.i18n?.lang] || one.fr : c.results}`; count.setAttribute('role','status'); count.setAttribute('aria-live','polite');
      document.getElementById('sortSelect').value = next.sort;
      if (!list.length) document.getElementById('collectionGrid').innerHTML = `<div class="bags-empty"><p>${esc(c.empty)}</p><button type="button" class="bags-text-link" data-bags-reset>${esc(c.reset)}</button></div>`;
      document.getElementById('bagsEditorial').innerHTML = editorialHTML();
    }
  };
})();
