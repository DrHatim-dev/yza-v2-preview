/* Bag presentation only. Catalog, checkout, cart and shared footer remain authoritative. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const pick = (value) => typeof value === 'string' ? value : (YZA.i18n?.pick(value || {}) || '');
  const price = (value) => YZA.i18n.formatPrice(value);
  const asset = (name) => `/yza-v2-preview/assets/brand/pdp/${name}`;
  const motif = () => `<img src="${asset('yza-sign-06.png')}" alt="" width="20" height="20">`;
  const image = (src, alt, extra = '') => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" ${extra}>`;
  const rule = (title, aside = '') => `<p class="bag-rule"><span>${esc(title)}</span>${aside ? `<span>${esc(aside)}</span>` : ''}</p>`;
  const labels = {
    fr: { announcement: 'Fait main à Marrakech, un panier à la fois', colors: 'Coloris — ', format: 'Format', guide: 'Guide des tailles', studio: 'Voir la pièce au studio, Guéliz', story: 'Le récit', gestures: 'Les quatre gestes', makers: 'Fatima et les femmes de l’atelier', formats: 'Les formats — ce qui rentre dedans', current: 'Cette page', view: 'Voir la pièce', specs: 'La fiche', collection: 'Collection', season: 'Saison', material: 'Matières', dimensions: 'Dimensions', packaging: 'Emballage', movement: 'En mouvement', included: 'Ce qui arrive avec le sac', gift: 'Prêt à offrir', repairs: 'La réparation à vie', repairText: 'À l’atelier de Guéliz, les réparations YZA sont offertes. À distance, seuls les frais d’envoi peuvent s’appliquer.', questions: 'Questions fréquentes', questionTitle: 'Ce qu’on nous demande le plus souvent.', allQuestions: 'Toutes les questions', workshop: 'Atelier', handmade: 'Fait main', series: 'Série', seriesValue: '15 pièces par coloris', family: 'La famille', choose: 'Choisir ma pièce', close: 'Fermer', hours: '35 à 85 h par sac', handDays: 'Plusieurs jours par sac', notes: ['Porté au bras', 'Journée', 'Marché, plage'], making: 'La fabrication', care: 'Composition & entretien', delivery: 'Livraison, échanges & retours', details: 'Taille & détails' },
    en: { announcement: 'Handmade in Marrakech, one basket at a time', colors: 'Colour — ', format: 'Size', guide: 'Size guide', studio: 'See the piece at the studio, Guéliz', story: 'The story', gestures: 'Four gestures', makers: 'Fatima and the women of the atelier', formats: 'The sizes — what fits inside', current: 'This piece', view: 'View the piece', specs: 'The details', collection: 'Collection', season: 'Season', material: 'Materials', dimensions: 'Dimensions', packaging: 'Packaging', movement: 'In motion', included: 'What comes with your bag', gift: 'Ready to give', repairs: 'Lifetime repairs', repairText: 'Repairs are complimentary at our Guéliz atelier. For remote repairs, shipping costs may apply.', questions: 'Frequently asked questions', questionTitle: 'What you ask us most often.', allQuestions: 'All questions', workshop: 'Atelier', handmade: 'Handmade', series: 'Edition', seriesValue: '15 pieces per colour', family: 'The family', choose: 'Choose my piece', close: 'Close', hours: '35 to 85 h per bag', handDays: 'Several days per bag', notes: ['On your arm', 'Every day', 'Market, beach'], making: 'The making', care: 'Composition & care', delivery: 'Delivery, exchanges & returns', details: 'Size & details' },
  };
  let visibilityObserver;
  let footerObserver;
  let current;
  let mediaQuery;
  labels.es = { ...labels.en, announcement: 'Hecho a mano en Marrakech, cesta a cesta', colors: 'Color — ', format: 'Talla', guide: 'Guía de tallas', studio: 'Ver la pieza en el estudio, Guéliz', story: 'La historia', gestures: 'Cuatro gestos', makers: 'Fatima y las mujeres del taller', formats: 'Las tallas — qué cabe dentro', current: 'Esta pieza', view: 'Ver la pieza', specs: 'La ficha', collection: 'Colección', season: 'Temporada', material: 'Materiales', dimensions: 'Dimensiones', packaging: 'Embalaje', movement: 'En movimiento', included: 'Lo que acompaña al bolso', gift: 'Listo para regalar', repairs: 'Reparaciones de por vida', repairText: 'Las reparaciones son gratuitas en nuestro taller de Guéliz. A distancia, pueden aplicarse gastos de envío.', questions: 'Preguntas frecuentes', questionTitle: 'Lo que más nos preguntáis.', allQuestions: 'Todas las preguntas', workshop: 'Taller', handmade: 'Hecho a mano', series: 'Serie', seriesValue: '15 piezas por color', family: 'La familia', choose: 'Elegir mi pieza', close: 'Cerrar', hours: '35 a 85 h por bolso', handDays: 'Varios días por bolso', notes: ['Al brazo', 'Cada día', 'Mercado, playa'], making: 'La fabricación', care: 'Composición y cuidados', delivery: 'Envíos, cambios y devoluciones', details: 'Talla y detalles' };
  labels.tr = { ...labels.en, announcement: 'Marakeş’te, sepet sepet el yapımı', colors: 'Renk — ', format: 'Beden', guide: 'Beden rehberi', studio: 'Parçayı Guéliz stüdyosunda görün', story: 'Hikâye', gestures: 'Dört adım', makers: 'Fatima ve atölyenin kadınları', formats: 'Boyutlar — içine neler sığar', current: 'Bu parça', view: 'Parçayı gör', specs: 'Detaylar', collection: 'Koleksiyon', season: 'Sezon', material: 'Malzemeler', dimensions: 'Ölçüler', packaging: 'Paketleme', movement: 'Hareket hâlinde', included: 'Çantayla birlikte gelenler', gift: 'Hediye etmeye hazır', repairs: 'Ömür boyu onarım', repairText: 'Guéliz atölyemizde onarımlar ücretsizdir. Uzaktan onarımlarda kargo ücreti uygulanabilir.', questions: 'Sık sorulan sorular', questionTitle: 'En çok merak ettikleriniz.', allQuestions: 'Tüm sorular', workshop: 'Atölye', handmade: 'El yapımı', series: 'Seri', seriesValue: 'Her renkten 15 parça', family: 'Aile', choose: 'Parçamı seç', close: 'Kapat', hours: 'Çanta başına 35–85 saat', handDays: 'Her çanta için birkaç gün', notes: ['Kolda', 'Her gün', 'Pazar, plaj'], making: 'Yapım süreci', care: 'Malzeme ve bakım', delivery: 'Teslimat, değişim ve iade', details: 'Beden ve detaylar' };
  labels.ar = { ...labels.en, announcement: 'صناعة يدوية في مراكش، سلّة تلو الأخرى', colors: 'اللون — ', format: 'المقاس', guide: 'دليل المقاسات', studio: 'شاهدي القطعة في استوديو كليز', story: 'الحكاية', gestures: 'أربع خطوات', makers: 'فاطمة ونساء المشغل', formats: 'المقاسات — ما الذي يتّسع في الداخل', current: 'هذه القطعة', view: 'شاهدي القطعة', specs: 'التفاصيل', collection: 'المجموعة', season: 'الموسم', material: 'المواد', dimensions: 'الأبعاد', packaging: 'التغليف', movement: 'أثناء الحركة', included: 'ما يرافق الحقيبة', gift: 'جاهزة للإهداء', repairs: 'إصلاحات مدى الحياة', repairText: 'الإصلاحات مجانية في مشغلنا بكليز. عند الإرسال عن بُعد، قد تُطبّق رسوم الشحن.', questions: 'الأسئلة الشائعة', questionTitle: 'ما تسألوننا عنه غالباً.', allQuestions: 'جميع الأسئلة', workshop: 'المشغل', handmade: 'صناعة يدوية', series: 'الإصدار', seriesValue: '١٥ قطعة من كل لون', family: 'العائلة', choose: 'اختاري قطعتك', close: 'إغلاق', hours: 'من ٣٥ إلى ٨٥ ساعة للحقيبة', handDays: 'عدّة أيام لكل حقيبة', notes: ['على الذراع', 'لكل يوم', 'السوق والشاطئ'], making: 'الصناعة', care: 'المواد والعناية', delivery: 'التوصيل والاستبدال والإرجاع', details: 'المقاس والتفاصيل' };

  function header(c) {
    if (document.body.classList.contains('site-maison')) return;
    const inner = $('.header__inner');
    if (!inner) return;
    const actions = inner.querySelector('.header__actions');
    const nav = inner.querySelector('.nav');
    if (!actions || !nav) return;
    for (const path of ['studio', 'grossistes']) {
      const link = nav.querySelector(`a[href="${path}"],a[href="/${path}"]`);
      if (!link) continue;
      const wrapper = link.closest('.nav-item');
      link.classList.add('bag-studio-link');
      actions.insertBefore(link, $('#searchOpen'));
      if (wrapper && !wrapper.children.length) wrapper.remove();
    }
    const burger = $('#burger');
    if (burger && !inner.querySelector('.bag-menu-slot')) {
      const slot = document.createElement('div');
      slot.className = 'bag-menu-slot';
      slot.append(burger);
      inner.prepend(slot);
    }
    const announcement = $('.announcement__line');
    if (announcement) {
      announcement.removeAttribute('data-i18n');
      announcement.textContent = c.announcement;
    }
  }

  function choices(p, members, c) {
    const rows = YZA.activeBagRows?.(p.familyHandle) || [];
    const size = p.selectedBagVariant?.size || p.visualSize;
    $('#pColorName').dataset.label = c.colors;
    document.querySelectorAll('#pColorSwatches .product-color__swatch').forEach((button) => {
      const url = button.dataset.colorUrl;
      if (!url) return;
      const colorSlug = new URL(url, location.href).searchParams.get('color');
      const row = rows.find((item) => item.colorSlug === colorSlug);
      const item = row?.items?.find((item) => item.size === size) || row?.items?.[0];
      if (!item?.img) return;
      const name = button.dataset.colorName || button.getAttribute('aria-label');
      const swatchImage = item.gallery?.find((src) => /\/client\/.*-01\./.test(src)) || item.img;
      button.innerHTML = image(swatchImage, '', 'width="52" height="64"') + `<span class="bag-swatch-name">${esc(name)}</span>`;
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
    });
    const title = $('#pVariants [data-variant-label]');
    if (title) title.innerHTML = `<span>${esc(c.format)}</span><a class="bag-size-guide" href="${esc(window.yzaPreviewPath() + location.search)}#bagFormats">${esc(c.guide)}</a>`;
    document.querySelectorAll('#pVariantOpts [data-product-variant]').forEach((link, index) => {
      const item = members.find((item) => item.handle === link.dataset.productVariant);
      if (!item) return;
      const sizeLabel = link.querySelector('span')?.textContent || pick(item.size);
      link.innerHTML = `<span>${esc(sizeLabel)}</span><span class="bag-size-note">${esc(c.notes[index] || '')}</span><span class="bag-size-price">${esc(price(item.price))}</span>`;
    });
  }

  function editorial(p, members, c, story, accordion) {
    const root = $('#productRoot');
    const rail = $('.product-rail-section');
    const old = $('#bagEditorial');
    // Preserve the real content and accordion nodes across currency/language renders.
    root.append(story, accordion);
    const provenance = $('#bagProvenance');
    if (provenance) $('.product-info').append(provenance);
    old?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'bagEditorial';
    rail.before(wrap);
    const photos = [...new Set((p.media || []).filter((item) => item.type === 'image').map((item) => item.src).concat(p.gallery || [], p.img).filter(Boolean))];
    const storySection = document.createElement('section');
    storySection.className = 'bag-section bag-story';
    storySection.hidden = story.hidden || p.sectionVisibility?.persona === false;
    storySection.innerHTML = image(photos[3] || photos[1] || p.img, pick(p.name)) + '<div class="bag-story-copy"></div>';
    storySection.lastElementChild.innerHTML = rule(c.story);
    storySection.lastElementChild.append(story);
    const opener = story.querySelector('.product-story__point');
    if (opener && opener.tagName !== 'H2') {
      const heading = document.createElement('h2'); heading.className = opener.className; heading.textContent = opener.textContent; opener.replaceWith(heading);
    }
    wrap.append(storySection);

    const sculpture = p.familyHandle === 'la-sculpture';
    const fr = YZA.i18n.lang === 'fr';
    const steps = fr ? [
      ['Tressage', 'La feuille de bananier et le raphia sont tressés à la main dans l’atelier de Guéliz.'],
      sculpture ? ['Gaine des anses', 'Le fil de fer est cintré à la main, puis gainé de raffia tour après tour.'] : ['Bordure de cuir', 'Une bordure de cuir souligne le panier. Sous les perles, une fine bande de cuir protège l’ouvrage.'],
      sculpture ? ['Le pochon Jawhara', 'À l’intérieur, un pochon doublé de Jawhara, ponctué de pompons de raffia.'] : ['Perlage', 'Les perles de rocaille sont enroulées autour des anses, une à une.'],
      ['Finitions', 'Un travail lent et patient, sous les mains de Fatima et de son équipe. Deux paniers ne sont jamais tout à fait pareils.'],
    ] : [
      ['Weaving', 'Banana leaf and raffia are woven by hand at the Guéliz atelier.'],
      sculpture ? ['Wrapping the handles', 'Wire is shaped by hand, then wrapped in raffia, turn after turn.'] : ['Leather edging', 'Leather edges the basket. A hidden leather strip protects the beadwork.'],
      sculpture ? ['The Jawhara pouch', 'Inside, a Jawhara-lined pouch finished with raffia pompoms.'] : ['Beadwork', 'Seed beads are wrapped around the handles, one by one.'],
      ['Finishing', 'Slow, patient work by Fatima and her team. No two baskets are ever quite alike.'],
    ];
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section">${rule(c.gestures, c.makers)}<div class="bag-gestures">${steps.map(([title, body], index) => `<article><span class="bag-step-number">0${index + 1}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join('')}</div></section>`);
    const uniqueMembers = members.filter((item, index, list) => list.findIndex((other) => other.handle === item.handle) === index);
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section bag-formats" id="bagFormats">${rule(c.formats)}<div class="bag-format-grid">${uniqueMembers.map((item) => {
      const active = item.handle === p.handle;
      const label = pick(item.size) || item.visualSize;
      const view = YZA.resolveProductColorView?.(item, item.bagColorSlug) || item;
      return `<article class="bag-format"><div class="bag-format-head"><h3>${esc(label)}</h3><span>${esc(pick(p.color))}</span>${active ? `<span class="bag-current">${esc(c.current)}</span>` : ''}</div>${image(item.bagImg || view.img, pick(item.name), 'width="400" height="400"')}<p>${esc(pick(item.whatFits))}</p><div class="bag-format-bottom"><span>${esc(price(item.price))}</span><a href="${esc(item.bagUrl || `/produits/${item.handle}`)}">${esc(c.view)}</a></div></article>`;
    }).join('')}</div></section>`);
    const facts = [[c.collection, p.collection], [c.season, p.season], [c.material, p.material], [c.format, p.size], [c.dimensions, p.dimensions], [c.packaging, p.packaging]].filter(([, value]) => pick(value));
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section bag-specs">${rule(c.specs)}<dl class="bag-spec-grid">${facts.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(pick(value))}</dd></div>`).join('')}</dl></section>`);
    const videos = [...new Map((p.media || []).filter((item) => item.type === 'video').map((item) => [item.src, item])).values()];
    if (videos.length) wrap.insertAdjacentHTML('beforeend', `<section class="bag-section">${rule(c.movement)}<div class="bag-video-grid">${videos.map((video) => `<video controls playsinline preload="none" poster="${esc(video.poster || p.img)}" aria-label="${esc(pick(p.name))}"><source src="${esc(video.src)}" type="video/mp4"></video>`).join('')}</div></section>`);
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section bag-included">${rule(c.included)}<div class="bag-included-grid"><article>${motif()}<h3>${esc(c.gift)}</h3><p>${esc(pick(p.packaging))}</p></article><article>${motif()}<h3>${esc(c.repairs)}</h3><p>${esc(c.repairText)}</p></article></div></section>`);
    const questions = document.createElement('section');
    questions.className = 'bag-section bag-questions';
    questions.innerHTML = `<div>${rule(c.questions)}<h2>${esc(c.questionTitle)}</h2><a class="link-underline" href="/faq">${esc(c.allQuestions)}</a></div>`;
    questions.append(accordion);
    wrap.append(questions);
    const accordionLabels = { accSizeFitLabel: c.details, accMakingLabel: c.making, accCareLabel: c.care, accDeliveryLabel: c.delivery };
    Object.entries(accordionLabels).forEach(([id, text]) => { if ($('#' + id)) $('#' + id).textContent = text; });
    // Match the reference's single-open behavior using the existing accordion listener.
    accordion.onclick = (event) => {
      const selected = event.target.closest('.accordion__btn');
      if (!selected) return;
      accordion.querySelectorAll('.accordion__item').forEach((item) => {
        if (item.contains(selected)) return;
        item.classList.remove('is-open');
        item.querySelector('.accordion__btn')?.setAttribute('aria-expanded', 'false');
        const panel = item.querySelector('.accordion__panel');
        if (panel) panel.style.maxHeight = '0';
      });
    };
    const tabs = $('.product-tabs');
    let railTitle = $('.bag-rail-title');
    if (!railTitle) { railTitle = document.createElement('span'); railTitle.className = 'bag-rail-title'; tabs?.prepend(railTitle); }
    railTitle.textContent = `${c.family} ${p.familyHandle === 'la-sculpture' ? 'Sculpture' : 'Nouvelle Vague'}`;
  }

  function mobileGallery(p) {
    $('.bag-mobile-gallery')?.remove();
    const gallery = $('.gallery');
    const thumbs = Array.from(document.querySelectorAll('#galThumbs .gallery__thumb'));
    const track = document.createElement('div');
    track.className = 'bag-mobile-gallery';
    track.setAttribute('aria-label', pick(p.name));
    track.innerHTML = thumbs.map((thumb, index) => thumb.dataset.gtype === 'video'
      ? `<div class="bag-mobile-slide"><video controls playsinline preload="none" poster="${esc(thumb.dataset.poster || p.img)}" aria-label="${esc(pick(p.name))}"><source src="${esc(thumb.dataset.src)}" type="video/mp4"></video></div>`
      : `<button type="button" class="bag-mobile-slide" aria-label="${esc(thumb.getAttribute('aria-label'))}">${image(thumb.dataset.src, pick(p.name), `width="390" height="488" ${index === 0 ? 'fetchpriority="high"' : ''}`)}</button>`).join('');
    gallery.prepend(track);
    track.querySelectorAll('button').forEach((slide) => slide.onclick = () => {
      const index = Array.from(track.children).indexOf(slide);
      thumbs[index]?.click();
      // Thumbnail swaps animate after a short delay. Zoom the tapped slide immediately.
      const main = $('#galMainImg');
      if (main && thumbs[index]) {
        main.src = thumbs[index].dataset.src;
        main.click();
      }
    });
    let galleryFrame = 0;
    track.addEventListener('scroll', () => {
      if (galleryFrame) return;
      galleryFrame = requestAnimationFrame(() => {
      galleryFrame = 0;
      if (!track.isConnected) return;
      const index = Math.round(track.scrollLeft / track.clientWidth);
      thumbs.forEach((thumb, i) => { thumb.classList.toggle('is-active', i === index); thumb.setAttribute('aria-pressed', String(i === index)); });
      track.querySelectorAll('video').forEach((video) => { if (Array.from(track.children).indexOf(video.parentElement) !== index) video.pause(); });
      });
    }, { passive: true });
    const rail = $('#galThumbs');
    if (!rail.dataset.bagSwipeWired) {
      rail.dataset.bagSwipeWired = 'true';
      rail.addEventListener('click', (event) => {
        const index = Array.from(rail.children).indexOf(event.target.closest('.gallery__thumb'));
        if (index < 0) return;
        Array.from(rail.children).forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === index)));
        if (!matchMedia('(max-width: 860px)').matches) return;
        const currentTrack = $('.bag-mobile-gallery');
        if (index >= 0 && currentTrack) currentTrack.scrollTo({ left: index * currentTrack.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      });
    }
  }

  function galleryOpening(p) {
    const rail = $('#galThumbs');
    const thumbs = Array.from(rail.querySelectorAll('.gallery__thumb'));
    // Lead with the supplied campaign photograph; retain the cut-out and every video.
    thumbs.filter((thumb) => thumb.dataset.gtype === 'img' && /\/client\//.test(thumb.dataset.src)).reverse().forEach((thumb) => rail.prepend(thumb));
    const first = thumbs.find((thumb) => thumb.dataset.gtype === 'img' && /\/client\/.*-01\./.test(thumb.dataset.src));
    if (first) { rail.prepend(first); first.click(); }
    Array.from(rail.children).forEach((thumb, index) => {
      thumb.setAttribute('aria-label', `${pick(p.name)} — ${index + 1}/${thumbs.length}`);
      thumb.setAttribute('aria-pressed', String(thumb.classList.contains('is-active')));
    });
  }

  function buying(p, c) {
    let dialog = $('#bagOptions');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'bagOptions';
      dialog.className = 'bag-options';
      dialog.setAttribute('aria-labelledby', 'bagOptionsTitle');
      // Reuse the site's close icon, including its existing accessible geometry.
      const closeIcon = $('#cartClose')?.innerHTML || '';
      dialog.innerHTML = `<button type="button" class="bag-options-close">${closeIcon}</button><h2 id="bagOptionsTitle"></h2><div class="bag-options-body"></div>`;
      document.body.append(dialog);
      dialog.querySelector('.bag-options-close').onclick = () => dialog.close();
      dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener('close', () => {
        restoreChoices();
        const cartOpen = $('#cartDrawer')?.classList.contains('is-open');
        document.body.style.overflow = cartOpen ? 'hidden' : '';
        (cartOpen ? $('#cartClose') : $('#mobileProductAdd'))?.focus({ preventScroll: true });
      });
      dialog.addEventListener('click', (event) => {
        if (event.target.closest('#pAdd') && !$('#pAdd').disabled) {
          dialog.close();
          // The existing cart opener has already set its scroll lock.
          document.body.style.overflow = 'hidden';
        }
        if (event.target.closest('.bag-size-guide')) dialog.close();
      });
    }
    $('#bagOptionsTitle').textContent = pick(p.name);
    dialog.querySelector('.bag-options-close').setAttribute('aria-label', c.close);
    $('#mobileProductBarName').innerHTML = `${esc(price(p.price))}<small>${esc(p.visualSize || pick(p.size))} · ${esc(pick(p.color))}</small>`;
    $('#mobileProductAdd').textContent = mediaQuery.matches ? c.choose : (YZA.i18n.t('pp.add') || c.choose);
    $('#mobileProductAdd').disabled = $('#pAdd').disabled;
    $('#mobileProductAdd').onclick = () => {
      if (!mediaQuery.matches) { $('#pAdd').click(); return; }
      dialog.querySelector('.bag-options-body').append($('#pColorWrap'), $('#pVariants'), $('#pAdd').closest('.option--add'));
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    };
    let ctaVisible = false, footerVisible = false;
    const refreshBar = () => {
      const hidden = footerVisible || (!mediaQuery.matches && ctaVisible);
      $('#mobileProductBar').hidden = hidden;
      document.body.classList.toggle('has-product-bar', !hidden);
    };
    visibilityObserver?.disconnect();
    footerObserver?.disconnect();
    visibilityObserver = new IntersectionObserver(([entry]) => { ctaVisible = entry.isIntersecting; refreshBar(); });
    visibilityObserver.observe($('#pAdd'));
    const footer = document.querySelector('footer');
    if (footer) {
      footerObserver = new IntersectionObserver(([entry]) => { footerVisible = entry.isIntersecting; refreshBar(); });
      footerObserver.observe(footer);
    }
    refreshBar();
  }

  function positionProvenance() {
    const provenance = $('#bagProvenance');
    const target = mediaQuery.matches ? $('.bag-story-copy') : $('.product-info');
    if (provenance && target) target.append(provenance);
  }

  function shipping(p) {
    const target = $('#pShipBar');
    const progress = YZA.cart?.shippingProgress?.({ assumeItems: [{ handle: p.handle, qty: 1 }] });
    if (!target || !progress) return;
    let track = $('#bagShippingTrack');
    if (!track) { track = document.createElement('div'); track.id = 'bagShippingTrack'; track.className = 'bag-shipping-track'; track.setAttribute('aria-hidden', 'true'); target.before(track); }
    track.innerHTML = '<span></span>';
    track.firstElementChild.style.transform = `scaleX(${progress.pct / 100})`;
    target.dataset.threshold = price(progress.thresholdCents);
  }

  function restoreChoices() {
    const info = $('.product-info');
    if (!info) return;
    const provenance = info.querySelector('#bagProvenance');
    [$('#pColorWrap'), $('#pVariants'), $('#pAdd')?.closest('.option--add')].filter(Boolean).forEach((node) => info.insertBefore(node, provenance));
  }

  YZA.renderBagMaison = function ({ product: p, canonicalProduct, members }) {
    if (p.category !== 'bags') return;
    document.body.classList.add('bag-product', 'maison-product');
    if (!mediaQuery) {
      mediaQuery = matchMedia('(max-width: 860px)');
      mediaQuery.addEventListener('change', () => {
        $('#bagOptions')?.close();
        positionProvenance();
        if (current) buying(current.product, current.copy);
      });
    }
    const c = labels[YZA.i18n.lang] || labels.en;
    current = { product: p, copy: c };
    header(c);
    const info = $('.product-info');
    let collection = $('#bagCollection');
    if (!collection) { collection = document.createElement('div'); collection.id = 'bagCollection'; $('#pName').before(collection); }
    collection.innerHTML = rule(p.familyHandle === 'la-sculpture' ? 'La Sculpture' : 'La Nouvelle Vague', pick(p.season));
    $('#pName').textContent = pick(canonicalProduct.name);
    let priceRow = $('.bag-price-row');
    if (!priceRow) { priceRow = document.createElement('div'); priceRow.className = 'bag-price-row'; $('#pName').after(priceRow); }
    // Keep the original price node so currency changes and the cart stay wired.
    const priceNode = $('#pPrice');
    priceRow.replaceChildren();
    priceRow.insertAdjacentHTML('afterbegin', `<span class="bag-color-title">${esc(pick(p.color))}</span>`);
    if (priceNode) priceRow.append(priceNode);
    else { priceRow.insertAdjacentHTML('beforeend', `<div class="product-info__price" id="pPrice">${esc(price(p.price))}</div>`); }
    let separator = $('#bagMotif');
    if (!separator) { separator = document.createElement('div'); separator.id = 'bagMotif'; separator.className = 'bag-motif'; separator.innerHTML = motif(); $('#pShort').after(separator); }
    choices(p, members, c);
    let studio = $('.bag-studio-visit');
    if (!studio) { studio = document.createElement('a'); studio.className = 'bag-studio-visit'; studio.href = '/studio'; $('#pAdd').after(studio); }
    studio.textContent = c.studio;
    let provenance = $('#bagProvenance');
    if (!provenance) { provenance = document.createElement('dl'); provenance.id = 'bagProvenance'; provenance.className = 'bag-provenance'; info.append(provenance); }
    const handworkText = pick(p.handworkTime);
    const handwork = /35.*85/.test(handworkText) ? c.hours : /plusieurs jours|several days/i.test(handworkText) ? c.handDays : handworkText;
    const editionText = pick(p.edition);
    const edition = /\b15\b/.test(editionText) ? c.seriesValue : editionText;
    provenance.innerHTML = [[c.workshop, 'Guéliz, Marrakech'], [c.handmade, handwork], [c.series, edition]].filter(([,value]) => value).map(([key,value]) => `<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('');
    editorial(p, members, c, $('#productStory'), $('#accordion'));
    positionProvenance();
    galleryOpening(p);
    mobileGallery(p);
    buying(p, c);
    shipping(p);
  };
  // Shared presentation primitives; product-specific content and buying stay separate.
  YZA.productMaison = { header, mobileGallery, shipping };
  document.addEventListener('yza:cartchange', () => { if (current) shipping(current.product); });
})();
