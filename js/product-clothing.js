/* Jawhara presentation. Commerce and product availability come from the released catalog. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const pick = (value) => typeof value === 'string' ? value : (YZA.i18n?.pick(value || {}) || '');
  const price = (value) => YZA.i18n.formatPrice(value);
  const asset = (name) => `/yza-v2-preview/assets/brand/pdp/clothing/${name}`;
  const image = (src, alt, extra = '') => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" ${extra}>`;
  const rule = (title, aside = '') => `<p class="bag-rule"><span>${esc(title)}</span>${aside ? `<span>${esc(aside)}</span>` : ''}</p>`;
  const motif = '<img src="/yza-v2-preview/assets/brand/pdp/yza-sign-06.png" alt="" width="20" height="20">';
  const labels = {
    fr: { announcement: 'Resort Marrakech Wear · Coupé et perlé à la main à Guéliz', colors: 'Coloris — ', fabrics: 'tissus', length: 'Longueur', shapes: 'Les coupes', compare: 'Comparer les longueurs', free: 'Taille libre', sizes: 'Taille & coupe', studio: 'Voir la pièce au studio, Guéliz', atelier: 'Atelier', fabric: 'Tissu', finish: 'Finition', handmade: 'À la main', story: 'Le récit', storyTitle: 'Une pièce modulaire, pensée pour durer.', signature: 'La signature YZA', signatureTitle: 'Le détail qui porte la main.', beadingTitle: 'Des lettres amazighes, perlées à la main.', lengths: 'Les longueurs', current: 'Cette pièce', view: 'Voir la pièce', film: 'Le film Jawhara', filmTitle: 'Le tissu se raconte en mouvement.', filmBody: 'Le Jawhara accompagne le geste. Découvrez la collection Resort Marrakech Wear, du jour jusqu’au soir.', wardrobe: 'Composer la silhouette', wardrobeAside: 'Le vestiaire Jawhara', specs: 'La fiche', collection: 'Collection', season: 'Saison', material: 'Composition', care: 'Entretien', packaging: 'Emballage', questions: 'Questions fréquentes', questionTitle: 'Ce qu’on nous demande le plus souvent.', allQuestions: 'Toutes les questions', making: 'La fabrication', delivery: 'Livraison, échanges & retours', choose: 'Choisir ma pièce', close: 'Fermer', returns: 'Échanges & retours', payment: 'Paiement', deliveryText: 'Les délais et frais selon votre destination.', returnsText: 'Les conditions pour trouver la bonne pièce.', paymentText: 'Les moyens de paiement proposés à la commande.', shortNote: 'Au-dessus du genou', midiNote: 'Sous le genou', longNote: 'À la cheville' },
    en: { announcement: 'Resort Marrakech Wear · Cut and hand-finished in Guéliz', colors: 'Colour — ', fabrics: 'fabrics', length: 'Length', shapes: 'The shapes', compare: 'Compare the lengths', free: 'Adjustable fit', sizes: 'Size & fit', studio: 'See the piece at the studio, Guéliz', atelier: 'Atelier', fabric: 'Fabric', finish: 'Finishing', handmade: 'By hand', story: 'The story', storyTitle: 'A modular piece, made to last.', signature: 'The YZA signature', signatureTitle: 'The detail that carries the hand.', beadingTitle: 'Amazigh letters, beaded by hand.', lengths: 'The lengths', current: 'This piece', view: 'View the piece', film: 'The Jawhara film', filmTitle: 'The fabric tells its story in motion.', filmBody: 'Jawhara follows your movement. Discover Resort Marrakech Wear, from day into evening.', wardrobe: 'Compose the silhouette', wardrobeAside: 'The Jawhara wardrobe', specs: 'The details', collection: 'Collection', season: 'Season', material: 'Composition', care: 'Care', packaging: 'Packaging', questions: 'Frequently asked questions', questionTitle: 'What you ask us most often.', allQuestions: 'All questions', making: 'The making', delivery: 'Delivery, exchanges & returns', choose: 'Choose my piece', close: 'Close', returns: 'Exchanges & returns', payment: 'Payment', deliveryText: 'Delivery times and costs for your destination.', returnsText: 'The conditions for finding the right piece.', paymentText: 'Payment methods available at checkout.', shortNote: 'Above the knee', midiNote: 'Below the knee', longNote: 'At the ankle' },
  };
  labels.es = { ...labels.en, announcement: 'Resort Marrakech Wear · Cortado y acabado a mano en Guéliz', colors: 'Color — ', fabrics: 'tejidos', length: 'Largo', shapes: 'Los cortes', compare: 'Comparar los largos', free: 'Talla ajustable', sizes: 'Talla y corte', studio: 'Ver la pieza en el estudio, Guéliz', atelier: 'Taller', fabric: 'Tejido', finish: 'Acabado', handmade: 'A mano', story: 'La historia', storyTitle: 'Una pieza modular, pensada para durar.', signature: 'La firma YZA', signatureTitle: 'El detalle hecho a mano.', beadingTitle: 'Letras amazigh, bordadas a mano con cuentas.', lengths: 'Los largos', current: 'Esta pieza', view: 'Ver la pieza', film: 'La película Jawhara', filmTitle: 'El tejido se cuenta en movimiento.', filmBody: 'Jawhara acompaña tus gestos, del día a la noche.', wardrobe: 'Componer la silueta', wardrobeAside: 'El vestuario Jawhara', specs: 'La ficha', collection: 'Colección', season: 'Temporada', material: 'Composición', care: 'Cuidados', packaging: 'Embalaje', questions: 'Preguntas frecuentes', questionTitle: 'Lo que más nos preguntáis.', allQuestions: 'Todas las preguntas', making: 'La fabricación', delivery: 'Envíos, cambios y devoluciones', choose: 'Elegir mi pieza', close: 'Cerrar', returns: 'Cambios y devoluciones', payment: 'Pago', deliveryText: 'Plazos y gastos según tu destino.', returnsText: 'Las condiciones para encontrar la pieza adecuada.', paymentText: 'Los métodos de pago disponibles al comprar.', shortNote: 'Sobre la rodilla', midiNote: 'Bajo la rodilla', longNote: 'Al tobillo' };
  labels.tr = { ...labels.en, announcement: 'Resort Marrakech Wear · Guéliz’de elde kesilip tamamlandı', colors: 'Renk — ', fabrics: 'kumaş', length: 'Uzunluk', shapes: 'Kesimler', compare: 'Uzunlukları karşılaştır', free: 'Ayarlanabilir beden', sizes: 'Beden ve kesim', studio: 'Parçayı Guéliz stüdyosunda görün', atelier: 'Atölye', fabric: 'Kumaş', finish: 'İşçilik', handmade: 'El yapımı', story: 'Hikâye', storyTitle: 'Uzun ömürlü, çok yönlü bir parça.', signature: 'YZA imzası', signatureTitle: 'El emeğini taşıyan detay.', beadingTitle: 'Elle boncuk işlenen Amazigh harfleri.', lengths: 'Uzunluklar', current: 'Bu parça', view: 'Parçayı gör', film: 'Jawhara filmi', filmTitle: 'Kumaş hareketle hikâyesini anlatır.', filmBody: 'Jawhara gündüzden geceye hareketinize eşlik eder.', wardrobe: 'Silüeti tamamla', wardrobeAside: 'Jawhara gardırobu', specs: 'Detaylar', collection: 'Koleksiyon', season: 'Sezon', material: 'İçerik', care: 'Bakım', packaging: 'Paketleme', questions: 'Sık sorulan sorular', questionTitle: 'En çok merak ettikleriniz.', allQuestions: 'Tüm sorular', making: 'Yapım süreci', delivery: 'Teslimat, değişim ve iade', choose: 'Parçamı seç', close: 'Kapat', returns: 'Değişim ve iade', payment: 'Ödeme', deliveryText: 'Adresinize göre teslimat süresi ve ücreti.', returnsText: 'Doğru parçayı bulmanıza yardımcı olacak koşullar.', paymentText: 'Siparişte sunulan ödeme yöntemleri.', shortNote: 'Diz üstü', midiNote: 'Diz altı', longNote: 'Ayak bileğinde' };
  labels.ar = { ...labels.en, announcement: 'Resort Marrakech Wear · قصّ وتشطيب يدوي في كليز', colors: 'اللون — ', fabrics: 'ألوان', length: 'الطول', shapes: 'القصّات', compare: 'مقارنة الأطوال', free: 'مقاس قابل للتعديل', sizes: 'المقاس والقصّة', studio: 'شاهدي القطعة في استوديو كليز', atelier: 'المشغل', fabric: 'النسيج', finish: 'التشطيب', handmade: 'يدوياً', story: 'الحكاية', storyTitle: 'قطعة متعددة الطرق، صُمّمت لتدوم.', signature: 'توقيع YZA', signatureTitle: 'تفصيل يحمل أثر اليد.', beadingTitle: 'حروف أمازيغية مطرّزة بالخرز يدوياً.', lengths: 'الأطوال', current: 'هذه القطعة', view: 'شاهدي القطعة', film: 'فيلم Jawhara', filmTitle: 'النسيج يروي حكايته بالحركة.', filmBody: 'يرافق Jawhara حركتك من النهار إلى المساء.', wardrobe: 'أكملي الإطلالة', wardrobeAside: 'خزانة Jawhara', specs: 'التفاصيل', collection: 'المجموعة', season: 'الموسم', material: 'التركيب', care: 'العناية', packaging: 'التغليف', questions: 'الأسئلة الشائعة', questionTitle: 'ما تسألوننا عنه غالباً.', allQuestions: 'جميع الأسئلة', making: 'الصناعة', delivery: 'التوصيل والاستبدال والإرجاع', choose: 'اختاري قطعتك', close: 'إغلاق', returns: 'الاستبدال والإرجاع', payment: 'الدفع', deliveryText: 'أوقات ورسوم التوصيل حسب وجهتك.', returnsText: 'الشروط لاختيار القطعة المناسبة.', paymentText: 'طرق الدفع المتاحة عند الطلب.', shortNote: 'فوق الركبة', midiNote: 'تحت الركبة', longNote: 'عند الكاحل' };
  let current, mediaQuery, ctaObserver, footerObserver, sizeListener, updateVisibility, scrollFrame;
  const chosenSizes = new Map();
  const selectedColor = (p) => $('#pColorSwatches .is-active')?.dataset.colorSlug || p.defaultColorSlug || '';
  const productUrl = (p, color) => `/produits/${p.handle}` + (p.colorSlugs?.includes(color) ? `?color=${encodeURIComponent(color)}` : '');
  const publicClothes = () => (YZA.byCategory('all') || []).filter((p) => p.group === 'rtw');
  const lengthAsset = (p) => /-short-/.test(p.handle) ? 'len-court.jpeg' : /-midi-/.test(p.handle) ? 'len-midi.jpeg' : 'len-long.jpeg';
  const lengthNote = (p, c) => /-short-/.test(p.handle) ? c.shortNote : /-midi-/.test(p.handle) ? c.midiNote : c.longNote;
  const colorView = (p, color) => YZA.resolveProductColorView?.(p, p.colorSlugs?.includes(color) ? color : p.defaultColorSlug) || p;
  const portrait = (p, color) => {
    const view = colorView(p, color);
    const media = view.colorMedia?.[color] || view.colorMedia?.[p.defaultColorSlug];
    return media?.gallery?.find((src) => /-jour\./.test(src)) || view.img;
  };

  function gallery(p, color) {
    const rail = $('#galThumbs');
    // The supplied lead photograph is the white midi; other pieces and colours keep their own media.
    if (p.handle === 'yza-pareo-skirt-midi-jawhara-ss26' && color === 'blanc-jasmin') {
      const thumb = rail.querySelector('.gallery__thumb')?.cloneNode(true);
      if (thumb) {
        thumb.dataset.src = asset('look-01.jpeg');
        thumb.dataset.gtype = 'img';
        const img = thumb.querySelector('img');
        img.removeAttribute('onerror');
        img.src = thumb.dataset.src;
        rail.prepend(thumb);
      }
    } else {
      const lead = [...rail.children].find((thumb) => /-jour\./.test(thumb.dataset.src));
      if (lead) rail.prepend(lead);
    }
    [...rail.children].forEach((thumb, index) => {
      thumb.setAttribute('aria-label', `${pick(p.name)} — ${index + 1}/${rail.children.length}`);
      thumb.setAttribute('aria-pressed', String(index === 0));
    });
    rail.firstElementChild?.click();
    YZA.productMaison.mobileGallery(p);
  }

  function restoreChoices() {
    const info = $('.product-info');
    const anchor = $('#clothingProvenance');
    if (!info) return;
    ['#pColorWrap', '#pVariants', '#pSize', '#clothingFit', '.option--add'].forEach((selector) => {
      const node = $(selector);
      if (node) info.insertBefore(node, anchor);
    });
  }

  function buying(p, c, wasOpen) {
    let dialog = $('#clothingOptions');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'clothingOptions';
      dialog.className = 'bag-options clothing-options';
      dialog.setAttribute('aria-labelledby', 'clothingOptionsTitle');
      dialog.innerHTML = `<button type="button" class="bag-options-close">${$('#cartClose')?.innerHTML || '×'}</button><h2 id="clothingOptionsTitle"></h2><div class="bag-options-body"></div>`;
      document.body.append(dialog);
      dialog.querySelector('.bag-options-close').onclick = () => dialog.close();
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
        if (event.target.closest('#pAdd') && $('#cartDrawer')?.classList.contains('is-open')) dialog.close();
        if (event.target.closest('.bag-size-guide')) dialog.close();
      });
      dialog.addEventListener('close', () => {
        restoreChoices();
        const cartOpen = $('#cartDrawer')?.classList.contains('is-open');
        document.body.style.overflow = cartOpen ? 'hidden' : '';
        (cartOpen ? $('#cartClose') : $('#mobileProductAdd'))?.focus({ preventScroll: true });
      });
    }
    $('#clothingOptionsTitle').textContent = $('#pName').textContent;
    dialog.querySelector('.bag-options-close').setAttribute('aria-label', c.close);
    const moveChoices = () => {
      ['#pColorWrap', '#pVariants', '#pSize', '#clothingFit', '.option--add'].forEach((selector) => {
        const node = $(selector);
        if (node) dialog.querySelector('.bag-options-body').append(node);
      });
    };
    if (wasOpen && mediaQuery.matches) moveChoices();
    const updateBar = () => {
      const sizeButton = $('#pSizeOpts .is-active');
      if (sizeButton?.dataset.size) chosenSizes.set(p.handle, sizeButton.dataset.size);
      const size = sizeButton?.textContent || pick(p.familyOptionLabel) || '';
      const color = $('#pColorSwatches .is-active')?.dataset.colorName || pick(p.color);
      $('#mobileProductBarName').innerHTML = `${esc(price(p.price))}<small>${esc([size, color].filter(Boolean).join(' · '))}</small>`;
      $('#mobileProductAdd').textContent = mediaQuery.matches ? c.choose : $('#pAdd .product-add-main__label').textContent;
      // A sold-out colour must not lock shoppers out of the mobile colour chooser.
      $('#mobileProductAdd').disabled = !mediaQuery.matches && $('#pAdd').disabled;
    };
    updateBar();
    if (sizeListener) $('#pSizeOpts').removeEventListener('click', sizeListener);
    sizeListener = updateBar;
    $('#pSizeOpts').addEventListener('click', sizeListener);
    $('#mobileProductAdd').onclick = () => {
      if (!mediaQuery.matches) { $('#pAdd').click(); return; }
      moveChoices();
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    };
    let ctaPassed = false, footerVisible = false;
    const refresh = () => {
      ctaPassed = $('#pAdd').getBoundingClientRect().bottom < 0;
      const hidden = footerVisible || (!mediaQuery.matches && !ctaPassed);
      $('#mobileProductBar').hidden = hidden;
      document.body.classList.toggle('has-product-bar', !hidden);
    };
    updateVisibility = refresh;
    ctaObserver?.disconnect();
    footerObserver?.disconnect();
    ctaObserver = new IntersectionObserver(([entry]) => { ctaPassed = entry.boundingClientRect.bottom < 0; refresh(); });
    ctaObserver.observe($('#pAdd'));
    if ($('footer')) {
      footerObserver = new IntersectionObserver(([entry]) => { footerVisible = entry.isIntersecting; refresh(); });
      footerObserver.observe($('footer'));
    }
    refresh();
  }

  function editorial(p, members, c, color) {
    const root = $('#productRoot');
    const accordion = $('#accordion');
    // main.js refreshes these nodes on colour/currency/language changes. Preserve their identities.
    root.append($('#productStory'), accordion);
    $('#clothingEditorial')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'clothingEditorial';
    $('.product-rail-section').before(wrap);
    const storyText = pick(p.personaHistory) || pick(p.desc);
    const paragraphs = storyText.split(/\n\s*\n/).filter(Boolean);
    const storyImage = p.category === 'pareos' ? asset('look-02.jpeg') : portrait(p, color);
    if (p.sectionVisibility?.persona !== false && storyText) {
      wrap.insertAdjacentHTML('beforeend', `<section class="bag-section clothing-story">${image(storyImage, pick(p.name), 'width="520" height="650"')}<div>${rule(c.story)}<h2>${esc(c.storyTitle)}</h2>${paragraphs.map((text) => `<p>${esc(text)}</p>`).join('')}<blockquote>${esc(pick(YZA.JAWHARA_STORY?.metaphore))}</blockquote></div></section>`);
    }
    const beading = p.category === 'pareos';
    const signatureImage = beading ? asset('client-02.jpg') : (colorView(p, color).colorMedia?.[color]?.detail || portrait(p, color));
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section clothing-signature"><div>${rule(c.signature)}<h2>${esc(beading ? c.beadingTitle : c.signatureTitle)}</h2><p>${esc(pick(p.fabric))}</p><p>${esc(pick(p.making))}</p><div class="clothing-signs">${motif}${image('/yza-v2-preview/assets/brand/pdp/yza-sign-16.png', '', 'width="36" height="36"')}</div></div>${image(signatureImage, beading ? c.beadingTitle : pick(p.name), 'width="480" height="600"')}</section>`);
    const lengths = members.filter((item) => publicClothes().some((publicItem) => publicItem.handle === item.handle));
    if (p.category === 'pareos' && lengths.length > 1) {
      wrap.insertAdjacentHTML('beforeend', `<section class="bag-section clothing-lengths" id="clothingLengths">${rule(c.lengths, c.compare)}<div class="clothing-card-row" style="--clothing-columns:${lengths.length}" tabindex="0" role="region" aria-label="${esc(c.lengths)}">${lengths.map((item) => `<article class="clothing-card"><div class="clothing-card-head"><h3>${esc(pick(item.familyOptionLabel))}</h3>${item.handle === p.handle ? `<span>${esc(c.current)}</span>` : ''}</div><a href="${esc(productUrl(item, color))}">${image(asset(lengthAsset(item)), pick(item.name), 'width="400" height="534"')}</a><p>${esc(lengthNote(item, c))}</p><div class="clothing-card-bottom"><span>${esc(price(item.price))}</span><a href="${esc(productUrl(item, color))}">${esc(c.view)}</a></div></article>`).join('')}</div></section>`);
    }
    const playLabel = pick({ fr: 'Voir le film', en: 'Watch the film', es: 'Ver la película', tr: 'Filmi izle', ar: 'شاهدي الفيلم' });
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section clothing-film"><video controls playsinline preload="none" tabindex="0" poster="${asset('jawhara-poster.jpg')}" aria-label="${esc(c.film)}"><source src="/yza-v2-preview/assets/video/jawhara-summer-hd.mp4" type="video/mp4"></video><div>${rule(c.film)}<h2>${esc(c.filmTitle)}</h2><p>${esc(c.filmBody)}</p><button type="button" class="link-underline clothing-film-play">${esc(playLabel)}</button></div></section>`);
    const film = wrap.querySelector('.clothing-film video');
    const play = wrap.querySelector('.clothing-film-play');
    play.onclick = () => { film.play().catch(() => { play.hidden = false; }); };
    film.addEventListener('play', () => { play.hidden = true; film.focus({ preventScroll: true }); });
    film.addEventListener('pause', () => { play.hidden = false; });
    const wardrobe = publicClothes().filter((item) => item.handle !== p.handle && item.category !== 'pareos').slice(0, 4);
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section clothing-wardrobe">${rule(c.wardrobe, c.wardrobeAside)}<div class="clothing-card-row" tabindex="0" role="region" aria-label="${esc(c.wardrobe)}">${wardrobe.map((item) => `<a class="clothing-card clothing-wardrobe-card" href="${esc(productUrl(item, color))}">${image(portrait(item, color), pick(item.name), 'width="400" height="534"')}<h3>${esc(pick(item.name))}</h3><p>${esc(price(item.price))}</p></a>`).join('')}</div></section>`);
    const facts = [[c.collection, p.collection], [c.season, p.season], [c.material, p.material], [c.sizes, p.size], [c.care, p.care], [c.packaging, p.packaging]].filter(([, value]) => pick(value));
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section clothing-specs">${rule(c.specs)}<dl class="bag-spec-grid">${facts.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(pick(value))}</dd></div>`).join('')}</dl></section>`);
    const questions = document.createElement('section');
    questions.className = 'bag-section bag-questions';
    questions.innerHTML = `<div>${rule(c.questions)}<h2>${esc(c.questionTitle)}</h2><a class="link-underline" href="/faq">${esc(c.allQuestions)}</a></div>`;
    questions.append(accordion);
    wrap.append(questions);
    Object.entries({ accSizeFitLabel: c.sizes, accMakingLabel: c.making, accCareLabel: c.care, accDeliveryLabel: c.delivery }).forEach(([id, label]) => { $('#' + id).textContent = label; });
    accordion.onclick = (event) => {
      const selected = event.target.closest('.accordion__btn');
      if (!selected) return;
      accordion.querySelectorAll('.accordion__item').forEach((item) => {
        if (item.contains(selected)) return;
        item.classList.remove('is-open');
        item.querySelector('.accordion__btn').setAttribute('aria-expanded', 'false');
        item.querySelector('.accordion__panel').style.maxHeight = '0';
      });
    };
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section clothing-services">${[[c.delivery, c.deliveryText, '/faq#livraison'], [c.returns, c.returnsText, '/faq'], [c.payment, c.paymentText, '/faq']].map(([title, text, href]) => `<article>${motif}<h3><a href="${href}">${esc(title)}</a></h3><p>${esc(text)}</p></article>`).join('')}</section>`);
    wrap.querySelectorAll('.clothing-card-row').forEach((row) => {
      row.addEventListener('dragstart', (event) => event.preventDefault());
      YZA.enableDragScroll?.(row);
    });
  }

  YZA.renderClothingMaison = function ({ product: p, canonicalProduct, members }) {
    if (p.group !== 'rtw') return;
    document.body.classList.add('clothing-product', 'maison-product');
    const c = labels[YZA.i18n.lang] || labels.en;
    current = { product: p, copy: c };
    if (!mediaQuery) {
      mediaQuery = matchMedia('(max-width: 860px)');
      mediaQuery.addEventListener('change', () => {
        $('#clothingOptions')?.close();
        if (current) buying(current.product, current.copy, false);
      });
    }
    const wasOpen = $('#clothingOptions')?.open;
    restoreChoices();
    // A colour, language or currency render must retain an explicitly chosen shirt size.
    const savedSize = chosenSizes.get(p.handle);
    if (savedSize && (p.availableSizes || []).includes(savedSize)) {
      $('#pSizeOpts').querySelectorAll('[data-size]').forEach((button) => {
        const active = button.dataset.size === savedSize;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }
    YZA.productMaison.header(c);
    const info = $('.product-info');
    let collection = $('#clothingCollection');
    if (!collection) { collection = document.createElement('div'); collection.id = 'clothingCollection'; $('#pName').before(collection); }
    collection.innerHTML = rule(pick(p.collection) || 'Resort Marrakech Wear', pick(p.season));
    $('#pName').textContent = pick(canonicalProduct.name);
    let priceRow = $('.bag-price-row');
    if (!priceRow) { priceRow = document.createElement('div'); priceRow.className = 'bag-price-row'; $('#pName').after(priceRow); }
    const priceNode = $('#pPrice');
    priceRow.replaceChildren();
    priceRow.innerHTML = `<span class="bag-color-title">${esc($('#pColorSwatches .is-active')?.dataset.colorName || pick(p.color))}</span>`;
    priceRow.append(priceNode);
    let separator = $('#clothingMotif');
    if (!separator) { separator = document.createElement('div'); separator.id = 'clothingMotif'; separator.className = 'bag-motif'; separator.innerHTML = motif; $('#pShort').after(separator); }
    // Keep the real inventory-driven scarcity node, now just below the description.
    separator.before($('#pScarcity'));
    const color = selectedColor(p);
    $('#pColorName').dataset.label = c.colors;
    $('#pColorName').dataset.count = `${p.colorSlugs?.length || 0} ${c.fabrics}`;
    $('#pViewColors').hidden = true;
    $('#pColorSwatches').querySelectorAll('.product-color__swatch').forEach((button) => {
      // Override the shared photographic bag swatch style without losing catalog colour values.
      button.style.setProperty('background', button.style.backgroundColor, 'important');
      button.setAttribute('aria-label', `${$('#pName').textContent} — ${button.title || button.dataset.colorName}`);
    });
    const publicHandles = new Set(publicClothes().map((item) => item.handle));
    const siblings = members.filter((item) => publicHandles.has(item.handle));
    $('#pVariantOpts').querySelectorAll('[data-product-variant]').forEach((button) => {
      const item = siblings.find((candidate) => candidate.handle === button.dataset.productVariant);
      if (!item) { button.remove(); return; }
      const note = p.category === 'pareos' ? lengthNote(item, c) : '';
      button.innerHTML = `<span>${esc(pick(item.familyOptionLabel))}</span><span class="clothing-length-note">${esc(note)}</span><em>${esc(price(item.price))}</em>`;
      button.setAttribute('aria-current', String(item.handle === p.handle));
    });
    $('#pVariants').hidden = siblings.length < 2;
    const variantLabel = $('#pVariants [data-variant-label]');
    if (variantLabel) variantLabel.innerHTML = `<span>${esc(p.category === 'pareos' ? c.length : c.shapes)}</span>${p.category === 'pareos' && siblings.length > 1 ? `<a class="bag-size-guide" href="${esc(window.yzaPreviewPath() + location.search)}#clothingLengths">${esc(c.compare)}</a>` : ''}`;
    let fit = $('#clothingFit');
    if (!fit) { fit = document.createElement('div'); fit.id = 'clothingFit'; fit.className = 'clothing-fit'; $('.option--add').before(fit); }
    fit.innerHTML = `<span>${esc(p.availableSizes?.length ? c.sizes : c.free)}</span><p>${esc(pick(p.dimensions) || pick(p.size))}</p>`;
    fit.hidden = !!p.availableSizes?.length;
    let studio = $('.bag-studio-visit');
    if (!studio) { studio = document.createElement('a'); studio.className = 'bag-studio-visit'; studio.href = '/studio'; $('#pAdd').after(studio); }
    studio.textContent = c.studio;
    let provenance = $('#clothingProvenance');
    if (!provenance) { provenance = document.createElement('dl'); provenance.id = 'clothingProvenance'; provenance.className = 'bag-provenance'; info.append(provenance); }
    provenance.innerHTML = [[c.atelier, 'Guéliz, Marrakech'], [c.fabric, 'Jawhara'], [c.finish, c.handmade]].map(([key, value]) => `<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('');
    restoreChoices();
    editorial(p, siblings, c, color);
    gallery(p, color);
    buying(p, c, wasOpen);
    YZA.productMaison.shipping(p);
  };
  document.addEventListener('yza:cartchange', () => { if (current) YZA.productMaison.shipping(current.product); });
  const scheduleVisibility = () => {
    if (!current || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => { scrollFrame = null; updateVisibility?.(); });
  };
  // Anchor jumps can cross the CTA without changing its intersection state.
  window.addEventListener('scroll', scheduleVisibility, { passive: true });
  window.addEventListener('resize', scheduleVisibility, { passive: true });
})();
