/* Fruit Market presentation. Catalog data, finish identities and cart remain authoritative. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const pick = (value) => typeof value === 'string' ? value : YZA.i18n.pick(value || {});
  const price = (value) => YZA.i18n.formatPrice(value);
  const asset = (name) => `/yza-v2-preview/assets/brand/pdp/${name}`;
  const image = (src, alt, extra = '') => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" ${extra}>`;
  const rule = (title, aside = '') => `<p class="bag-rule"><span>${esc(title)}</span>${aside ? `<span>${esc(aside)}</span>` : ''}</p>`;
  const words = {
    fr: { announcement: 'Fait main à Marrakech, un fruit à la fois', crochet: 'Crocheté main', material: 'Raphia teint main', finishes: 'Les finitions', ring: 'L’anneau', included: 'Inclus', ring2: 'Anneau doré 2 cm', ring3: 'Anneau doré 3 cm', includedNote: 'Inclus avec le charm', studioOnly: 'Sur les bundles, ou au studio', studio: 'Voir la pièce au studio, Guéliz', atelier: 'Atelier', handmade: 'Crochet main', dimensions: 'Dimensions', story: 'Le récit', gestures: 'Les quatre gestes', madeIn: 'Façonné à Guéliz, Marrakech', dye: 'Teinture', loop: 'Boucle', tag: 'Étiquette', dyeText: 'Le raffia naturel est teint à la main dans les couleurs emblématiques de l’atelier.', loopText: 'La boucle en raffia prolonge le fruit et accueille son anneau doré.', tagText: 'La petite plaque YZA gravée signe la pièce, finie à la main à Guéliz.', wear: 'Comment le porter', wearTitle: 'Il ne se clipse pas qu’au sac.', market: 'Le Fruit Market', specs: 'La fiche', collection: 'Collection', season: 'Saison', attachment: 'Attache', packaging: 'Emballage', questions: 'Questions fréquentes', questionTitle: 'Les petites choses à savoir.', allQuestions: 'Toutes les questions', faqCare: 'Comment entretenir mon charm ?', faqMaterial: 'Qu’est-ce qui rend chaque fruit unique ?', faqRing: 'Et si je souhaite un autre anneau ?', faqGift: 'Est-il prêt à offrir ?', delivery: 'Livraison', returns: 'Retours', payment: 'Paiement', continue: 'Continuer la collection', choose: 'Choisir mon charm', close: 'Fermer', upsell: 'Complétez le marché' },
    en: { announcement: 'Handmade in Marrakech, one fruit at a time', crochet: 'Hand crocheted', material: 'Hand-dyed raffia', finishes: 'The finishing touches', ring: 'The ring', included: 'Included', ring2: '2 cm gold ring', ring3: '3 cm gold ring', includedNote: 'Included with the charm', studioOnly: 'With bundles, or at the studio', studio: 'See the piece at the studio, Guéliz', atelier: 'Atelier', handmade: 'Hand crochet', dimensions: 'Dimensions', story: 'The story', gestures: 'Four gestures', madeIn: 'Made in Guéliz, Marrakech', dye: 'Dyeing', loop: 'The loop', tag: 'The tag', dyeText: 'Natural raffia is hand-dyed in the atelier’s signature colours.', loopText: 'A raffia loop extends the fruit and holds its gold ring.', tagText: 'The engraved YZA tag signs the piece, finished by hand in Guéliz.', wear: 'How to wear it', wearTitle: 'More than a bag charm.', market: 'The Fruit Market', specs: 'The details', collection: 'Collection', season: 'Season', attachment: 'Attachment', packaging: 'Packaging', questions: 'Frequently asked questions', questionTitle: 'The little things to know.', allQuestions: 'All questions', faqCare: 'How do I care for my charm?', faqMaterial: 'What makes every fruit unique?', faqRing: 'What if I would like another ring?', faqGift: 'Is it ready to give?', delivery: 'Delivery', returns: 'Returns', payment: 'Payment', continue: 'Continue the collection', choose: 'Choose my charm', close: 'Close', upsell: 'Complete your market' },
  };
  // Product copy is always read in the selected language from the released catalog.
  const localized = {
    es: { announcement: 'Hecho a mano en Marrakech, fruta a fruta', crochet: 'Ganchillo a mano', material: 'Rafia teñida a mano', finishes: 'Los acabados', ring: 'La anilla', included: 'Incluida', ring2: 'Anilla dorada de 2 cm', ring3: 'Anilla dorada de 3 cm', includedNote: 'Incluida con el charm', studioOnly: 'En los bundles o en el estudio', studio: 'Ver la pieza en el estudio, Guéliz', handmade: 'Ganchillo a mano', dimensions: 'Dimensiones', story: 'La historia', gestures: 'Cuatro gestos', wear: 'Cómo llevarlo', wearTitle: 'Más que un charm para el bolso.', specs: 'La ficha', collection: 'Colección', season: 'Temporada', attachment: 'Sujeción', packaging: 'Embalaje', questions: 'Preguntas frecuentes', questionTitle: 'Los pequeños detalles.', allQuestions: 'Todas las preguntas', faqCare: '¿Cómo cuido mi charm?', faqMaterial: '¿Qué hace única a cada fruta?', faqRing: '¿Puedo elegir otra anilla?', faqGift: '¿Está listo para regalar?', delivery: 'Envío', returns: 'Devoluciones', payment: 'Pago', continue: 'Continúa la colección', choose: 'Elegir mi charm', close: 'Cerrar' },
    tr: { announcement: 'Marakeş’te, meyve meyve el yapımı', crochet: 'El tığ işi', material: 'Elde boyanmış rafya', finishes: 'Son dokunuşlar', ring: 'Halka', included: 'Dahil', ring2: '2 cm altın halka', ring3: '3 cm altın halka', includedNote: 'Charm ile birlikte', studioOnly: 'Setlerde veya stüdyoda', studio: 'Parçayı Guéliz stüdyosunda görün', handmade: 'El tığ işi', dimensions: 'Ölçüler', story: 'Hikâye', gestures: 'Dört adım', wear: 'Nasıl kullanılır', wearTitle: 'Bir çanta süsünden fazlası.', specs: 'Detaylar', collection: 'Koleksiyon', season: 'Sezon', attachment: 'Bağlantı', packaging: 'Paketleme', questions: 'Sık sorulan sorular', questionTitle: 'Küçük detaylar.', allQuestions: 'Tüm sorular', faqCare: 'Charm bakımı nasıl yapılır?', faqMaterial: 'Her meyveyi benzersiz yapan nedir?', faqRing: 'Başka bir halka seçebilir miyim?', faqGift: 'Hediye etmeye hazır mı?', delivery: 'Teslimat', returns: 'İade', payment: 'Ödeme', continue: 'Koleksiyona devam', choose: 'Charm seç', close: 'Kapat' },
    ar: { announcement: 'صناعة يدوية في مراكش، ثمرة تلو الأخرى', crochet: 'كروشيه يدوي', material: 'رافيا مصبوغة يدويًا', finishes: 'اللمسات الأخيرة', ring: 'الحلقة', included: 'مرفقة', ring2: 'حلقة ذهبية ٢ سم', ring3: 'حلقة ذهبية ٣ سم', includedNote: 'مرفقة مع التعليقة', studioOnly: 'مع المجموعات أو في الاستوديو', studio: 'شاهدي القطعة في استوديو كليز', handmade: 'كروشيه يدوي', dimensions: 'الأبعاد', story: 'الحكاية', gestures: 'أربع خطوات', wear: 'كيفية تنسيقها', wearTitle: 'أكثر من تعليقة حقيبة.', specs: 'التفاصيل', collection: 'المجموعة', season: 'الموسم', attachment: 'التثبيت', packaging: 'التغليف', questions: 'الأسئلة الشائعة', questionTitle: 'التفاصيل الصغيرة.', allQuestions: 'جميع الأسئلة', faqCare: 'كيف أعتني بالتعليقة؟', faqMaterial: 'ما الذي يجعل كل ثمرة فريدة؟', faqRing: 'هل يمكن اختيار حلقة أخرى؟', faqGift: 'هل هي جاهزة للإهداء؟', delivery: 'التوصيل', returns: 'الإرجاع', payment: 'الدفع', continue: 'أكملي المجموعة', choose: 'اختاري تعليقتك', close: 'إغلاق' },
  };
  let current, mediaQuery, buyObserver, footerObserver;

  function charmPhotos(p) {
    if (p.handle === 'raffia-whole-orange-charm-ss26') {
      return ['orange-01.png', 'orange-02.webp', 'orange-03.jpg', 'orange-07.webp', 'orange-08.webp', 'orange-09.webp'].map((name) => asset(`charms/${name}`));
    }
    const photos = [...new Set([...(p.gallery || []), p.img].filter(Boolean))];
    return [...photos.filter((src) => /\/client\//.test(src)), ...photos.filter((src) => !/\/client\//.test(src))];
  }

  function gallery(p) {
    const rail = $('#galThumbs');
    const oldThumbs = [...rail.querySelectorAll('.gallery__thumb')];
    const newPhotos = charmPhotos(p);
    // Keep all released media, including videos, alongside the supplied orange gallery.
    for (let i = newPhotos.length - 1; i >= 0; i--) {
      const src = newPhotos[i];
      let thumb = oldThumbs.find((node) => node.dataset.src === src);
      if (!thumb) {
        thumb = document.createElement('button');
        thumb.type = 'button'; thumb.className = 'gallery__thumb';
        thumb.dataset.src = src; thumb.dataset.gtype = 'img';
        thumb.innerHTML = image(src, '', 'width="62" height="78"');
      }
      rail.prepend(thumb);
    }
    rail.firstElementChild?.click();
    const thumbs = [...rail.querySelectorAll('.gallery__thumb')];
    thumbs.forEach((thumb, index) => {
      thumb.setAttribute('aria-label', `${pick(p.name)} — ${index + 1}/${thumbs.length}`);
      thumb.setAttribute('aria-pressed', String(index === 0));
    });
    YZA.productMaison.mobileGallery(p);
  }

  function finishes(p, c) {
    const info = $('.product-info');
    let block = $('#charmFinishes');
    if (!block) { block = document.createElement('section'); block.id = 'charmFinishes'; $('#charmMotif').after(block); }
    const options = YZA.productFinishOptions(p.handle);
    const photo = p.handle === 'raffia-whole-orange-charm-ss26' ? asset('charms/orange-ring.jpg') : (p.gallery || []).find((src) => /anneau/.test(src)) || p.img;
    block.innerHTML = `<h2 class="charm-label">${esc(c.finishes)}</h2><div class="charm-finish-grid">${image(photo, c.finishes, 'width="92" height="112"')}<ul>${options.map((option) => `<li>${esc(pick(option.label))}</li>`).join('')}</ul></div>`;
    const finish = $('#pFinish');
    const title = finish.querySelector('.option__label');
    title.removeAttribute('data-i18n');
    title.innerHTML = `<span>${esc(c.ring)}</span><span>${esc(c.included)}</span>`;
    const ring = options.find((option) => option.key === 'r2');
    // r3 is a legacy finish identity for the brass tag, NOT the larger ring.
    // Never create a purchasable 3 cm ring identity from the prototype's demo state.
    if (ring) {
      finish.hidden = false;
      $('#pFinishOpts').innerHTML = `<button type="button" class="chip is-active" data-finish-key="r2" aria-pressed="true"><span>${esc(c.ring2)}</span><small>${esc(c.includedNote)}</small></button><button type="button" class="chip charm-ring-unavailable" disabled aria-describedby="charmRingNote"><span>${esc(c.ring3)}</span><small id="charmRingNote">${esc(c.studioOnly)}</small></button>`;
    }
    // Main rendering may have moved the original story here; keep the controls ordered.
    block.after(finish);
    if ($('#charmProvenance')) info.append($('#charmProvenance'));
  }

  function editorial(p, c) {
    $('#charmEditorial')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'charmEditorial';
    $('.product-rail-section').before(wrap);
    const story = p.fruitStory || {};
    const photos = charmPhotos(p);
    const orange = p.handle === 'raffia-whole-orange-charm-ss26';
    const storyPhoto = orange ? asset('charms/orange-vibe.jpg') : photos[0];
    if (p.sectionVisibility?.story !== false && pick(story.body)) {
      wrap.insertAdjacentHTML('beforeend', `<section class="bag-section bag-story charm-story">${image(storyPhoto, pick(p.name), 'width="520" height="650"')}<div><p class="charm-eyebrow">${image(asset('yza-sign-16.png'), '', 'width="16" height="24"')}${esc(c.story)}</p><h2>${esc(pick(story.title))}</h2><p class="charm-story-body">${esc(pick(story.body))}</p>${pick(p.howToWear?.note) ? `<blockquote>${esc(pick(p.howToWear.note))}</blockquote>` : ''}</div></section>`);
    }
    const steps = [[c.dye, c.dyeText], [c.crochet, pick(p.making)], [c.loop, c.loopText], [c.tag, c.tagText]];
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section charm-gestures">${rule(c.gestures, c.madeIn)}<div class="bag-gestures">${steps.map(([title, body], i) => `<article><span class="bag-step-number">0${i + 1}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join('')}</div></section>`);
    if (p.howToWear && p.sectionVisibility?.howToWear !== false) {
      const wear = p.howToWear;
      wrap.insertAdjacentHTML('beforeend', `<section class="bag-section charm-wear-section"><div>${rule(c.wear)}<h2>${esc(c.wearTitle)}</h2><ol>${(wear.items || []).map((item, i) => `<li><span>0${i + 1}</span>${esc(pick(item))}</li>`).join('')}</ol><p class="charm-style-tip">${esc(pick(wear.styleTip))}</p></div>${image(asset('charms/charms-on-bag.jpg'), c.wear, 'width="520" height="650"')}</section>`);
    }
    if (p.sectionVisibility?.story !== false && pick(story.collectionBody)) {
      const fruitHandles = ['whole-orange', 'whole-lemon', 'tomato', 'cherries', 'grapes', 'watermelon-slice', 'kiwi-slice', 'avocado-half'];
      const publicCharms = new Map(YZA.byCategory('charms').map((item) => [item.handle, item]));
      const market = fruitHandles.map((slug) => publicCharms.get(`raffia-${slug}-charm-ss26`)).filter(Boolean);
      wrap.insertAdjacentHTML('beforeend', `<section class="bag-section charm-market">${rule(pick(story.collectionTitle) || c.market, 'Guéliz, Marrakech')}<p class="charm-market-copy">${esc(pick(story.collectionBody))}</p><div class="charm-market-grid">${market.map((item) => `<a href="/produits/${esc(item.handle)}"${item.handle === p.handle ? ' aria-current="page"' : ''}>${image(item.img, pick(item.name), 'width="160" height="160"')}<span>${esc(pick(item.name).replace(/^Charm\s+|\s+en raphia$/g, '').replace(/^Raffia\s+|\s+Charm$/g, ''))}</span></a>`).join('')}</div></section>`);
      const marketRow = wrap.querySelector('.charm-market-grid');
      marketRow.dataset.scrollRow = '';
      marketRow.tabIndex = 0;
      marketRow.setAttribute('role', 'region');
      marketRow.setAttribute('aria-label', pick(story.collectionTitle) || c.market);
      // Native link/image dragging must not interrupt the storefront's mouse scroller.
      marketRow.addEventListener('dragstart', (event) => event.preventDefault());
      YZA.enableDragScroll(marketRow);
    }
    if (p.sectionVisibility?.details !== false) {
      const facts = [[c.collection, p.collection], [c.season, p.season], [YZA.i18n.t('pp.material'), c.material], [c.dimensions, p.dimensions], [c.attachment, p.attachment], [c.packaging, p.packaging]].filter(([, value]) => pick(value));
      wrap.insertAdjacentHTML('beforeend', `<section class="bag-section bag-specs charm-specs">${rule(c.specs)}<dl class="bag-spec-grid">${facts.map(([key, value]) => `<div><dt>${esc(key)}</dt><dd>${esc(pick(value))}</dd></div>`).join('')}</dl></section>`);
    }
    const faq = [[c.faqCare, p.care], [c.faqMaterial, p.material], [c.faqRing, p.attachment], [c.faqGift, p.packaging]].filter(([, value]) => pick(value));
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section bag-questions charm-questions"><div>${rule(c.questions)}<h2>${esc(c.questionTitle)}</h2><a class="charm-text-link" href="/faq">${esc(c.allQuestions)}</a></div><div class="charm-faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}<span aria-hidden="true"></span></summary><p>${esc(pick(a))}</p></details>`).join('')}</div></section>`);
    wrap.querySelectorAll('.charm-faq details').forEach((item) => item.addEventListener('toggle', () => {
      if (item.open) wrap.querySelectorAll('.charm-faq details[open]').forEach((other) => { if (other !== item) other.open = false; });
    }));
    const guarantees = [[c.delivery, p.shipping], [c.returns, p.returns], [c.payment, YZA.serviceFeature('payment')?.text]];
    wrap.insertAdjacentHTML('beforeend', `<section class="bag-section charm-guarantees"><div>${guarantees.map(([title, body]) => `<article><h2>${esc(title)}</h2><p>${esc(pick(body))}</p></article>`).join('')}</div></section>`);
    let title = $('.bag-rail-title');
    if (!title) { title = document.createElement('span'); title.className = 'bag-rail-title'; $('.product-tabs')?.prepend(title); }
    title.textContent = c.continue;
  }

  function restoreControls() {
    const finish = $('#pFinish'), add = $('#pAdd')?.closest('.option--add');
    if (!finish || !add) return;
    $('#charmFinishes').after(finish);
    finish.after(add);
  }

  function buying(p, c) {
    let dialog = $('#charmOptions');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'charmOptions'; dialog.className = 'bag-options charm-options';
      dialog.setAttribute('aria-labelledby', 'charmOptionsTitle');
      dialog.innerHTML = `<button type="button" class="bag-options-close">${$('#cartClose')?.innerHTML || ''}</button><div class="charm-sheet-product"></div><div class="charm-options-body"></div>`;
      document.body.append(dialog);
      dialog.querySelector('.bag-options-close').onclick = () => dialog.close();
      dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener('close', () => {
        restoreControls();
        const cartOpen = $('#cartDrawer')?.classList.contains('is-open');
        document.body.style.overflow = cartOpen ? 'hidden' : '';
        (cartOpen ? $('#cartClose') : $('#mobileProductAdd'))?.focus({ preventScroll: true });
      });
      dialog.addEventListener('click', (event) => {
        if (event.target.closest('#pAdd') && $('#cartDrawer')?.classList.contains('is-open')) {
          dialog.close(); document.body.style.overflow = 'hidden';
        }
      });
    }
    dialog.querySelector('.bag-options-close').setAttribute('aria-label', c.close);
    dialog.querySelector('.charm-sheet-product').innerHTML = `${image(charmPhotos(p)[0], '', 'width="64" height="80"')}<div><h2 id="charmOptionsTitle">${esc(pick(p.name))}</h2><p>${esc(price(p.price))}</p></div>`;
    $('#mobileProductBarName').innerHTML = `<span class="charm-sticky-name">${esc(pick(p.name))}</span>${esc(price(p.price))}<small>${esc(c.ring2)}</small>`;
    $('#mobileProductAdd').textContent = mediaQuery.matches ? c.choose : YZA.i18n.t('pp.add');
    $('#mobileProductAdd').disabled = $('#pAdd').disabled;
    $('#mobileProductAdd').onclick = () => {
      if (!mediaQuery.matches) { $('#pAdd').click(); return; }
      dialog.querySelector('.charm-options-body').append($('#pFinish'), $('#pAdd').closest('.option--add'));
      dialog.showModal(); document.body.style.overflow = 'hidden';
    };
    let ctaVisible = false, footerVisible = false;
    const refreshBar = () => {
      const hidden = footerVisible || (!mediaQuery.matches && ctaVisible);
      $('#mobileProductBar').hidden = hidden;
      document.body.classList.toggle('has-product-bar', !hidden);
    };
    buyObserver?.disconnect(); footerObserver?.disconnect();
    buyObserver = new IntersectionObserver(([entry]) => { ctaVisible = entry.isIntersecting; refreshBar(); });
    buyObserver.observe($('#pAdd'));
    if ($('footer')) {
      footerObserver = new IntersectionObserver(([entry]) => { footerVisible = entry.isIntersecting; refreshBar(); });
      footerObserver.observe($('footer'));
    }
    refreshBar();
  }

  function cartPresentation(c) {
    const title = $('.cart-upsell__title');
    if (title) title.textContent = c.upsell;
    document.querySelectorAll('[data-upsell-add]').forEach((button) => {
      const item = YZA.getProduct(button.dataset.upsellAdd);
      if (item) button.setAttribute('aria-label', `${YZA.i18n.t('pp.add')} — ${pick(item.name)}`);
    });
  }

  YZA.renderCharmMaison = function ({ product: p, canonicalProduct }) {
    if (p.category !== 'charms') return;
    document.body.classList.add('charm-product', 'maison-product');
    if (!mediaQuery) {
      mediaQuery = matchMedia('(max-width: 860px)');
      mediaQuery.addEventListener('change', () => { $('#charmOptions')?.close(); if (current) buying(current.product, current.copy); });
    }
    const lang = YZA.i18n.lang;
    const c = { ...(words[lang] || words.en), ...localized[lang] };
    current = { product: p, copy: c };
    YZA.productMaison.header(c);
    let collection = $('#charmCollection');
    if (!collection) { collection = document.createElement('div'); collection.id = 'charmCollection'; $('#pName').before(collection); }
    collection.innerHTML = rule(pick(p.collection), c.crochet);
    $('#pName').textContent = pick(canonicalProduct.name);
    let priceRow = $('.bag-price-row');
    if (!priceRow) { priceRow = document.createElement('div'); priceRow.className = 'bag-price-row'; $('#pName').after(priceRow); }
    const priceNode = $('#pPrice');
    priceRow.replaceChildren();
    priceRow.innerHTML = `<span class="bag-color-title">${esc(c.material)}</span>`;
    priceRow.append(priceNode);
    let motif = $('#charmMotif');
    if (!motif) { motif = document.createElement('div'); motif.id = 'charmMotif'; motif.className = 'bag-motif'; motif.innerHTML = image(asset('yza-sign-06.png'), '', 'width="20" height="20"'); $('#pShort').after(motif); }
    finishes(p, c);
    restoreControls();
    let studio = $('.bag-studio-visit');
    if (!studio) { studio = document.createElement('a'); studio.className = 'bag-studio-visit'; studio.href = '/studio'; $('#pAdd').after(studio); }
    studio.textContent = c.studio;
    let provenance = $('#charmProvenance');
    if (!provenance) { provenance = document.createElement('dl'); provenance.id = 'charmProvenance'; provenance.className = 'bag-provenance'; $('.product-info').append(provenance); }
    provenance.innerHTML = [[c.atelier, 'Guéliz, Marrakech'], [c.handmade, pick(p.handworkTime)], [c.dimensions, pick(p.dimensions)]].filter(([, value]) => value).map(([key, value]) => `<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('');
    editorial(p, c);
    gallery(p);
    buying(p, c);
    YZA.productMaison.shipping(p);
    cartPresentation(c);
  };
  document.addEventListener('yza:cartchange', () => {
    if (!current) return;
    YZA.productMaison.shipping(current.product);
    // Cart DOM is refreshed synchronously after its change event.
    queueMicrotask(() => cartPresentation(current.copy));
  });
})();
