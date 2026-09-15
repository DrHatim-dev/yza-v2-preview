/* Earring presentation: released product identities and purchasing remain authoritative. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const pick = (v) => typeof v === 'string' ? v : YZA.i18n.pick(v || {});
  const image = (src, alt, extra = '') => {
    const base = src.split('?')[0];
    const responsive = /\/earrings-2026-07\//.test(base) ? `srcset="${esc(base.replace('.webp','-640.webp'))} 640w, ${esc(base.replace('.webp','-1440.webp'))} 1440w, ${esc(base)}?v=20260909-4k 3584w" sizes="(max-width:860px) 90vw, 480px"` : '';
    return `<img src="${esc(src)}" ${responsive} alt="${esc(alt)}" loading="lazy" decoding="async" ${extra}>`;
  };
  const rule = (a, b = '') => `<p class="bag-rule"><span>${esc(a)}</span>${b ? `<span>${esc(b)}</span>` : ''}</p>`;
  const motif = () => image('/yza-v2-preview/assets/brand/pdp/yza-sign-06.png', '', 'width="20" height="20"');
  const words = {
    fr: ['Petite série atelier, produite au rythme du crochet main','Édition limitée','Raphia teint main','La paire','Deux fruits crochetés main','Créoles dorées','Étiquette signée','Prénom de l’artisane','L’écrin','Inclus','Boîte noire YZA','Avec le hand tag signé','Un mot à joindre ?','À préciser dans la note de commande.','Essayer au studio, Guéliz','Atelier','Crochet main','Petite série','Le récit','Des cartes postales de Marrakech, portées aux oreilles.','La main derrière la pièce','Le prénom de celle qui les a faites est sur l’étiquette.','Les trois gestes','Teinture','Le raphia naturel est teint à la main dans les couleurs de l’atelier.','Crochet','Chaque fruit est crocheté à la main, pièce par pièce.','Montage','Les fruits sont ensuite montés sur leurs créoles dorées.','Les autres fruits','Voir tous les bijoux','La fiche','Collection','Saison','Matière','Format','Attache','Emballage','Questions fréquentes','Les petites choses à savoir.','Comment entretenir mes boucles ?','Quelle est leur matière ?','Quelle taille font les créoles ?','Sont-elles prêtes à offrir ?','Toutes les questions','Livraison','Retours','Paiement','La paire, prête à offrir','5 h pour la paire'],
    en: ['Small atelier batches, made at the pace of hand crochet','Limited edition','Hand-dyed raffia','The pair','Two hand-crocheted fruits','Gold-tone hoops','Signed hand tag','The artisan’s first name','The gift box','Included','Black YZA box','With the signed hand tag','A message to include?','Add it to your order note at checkout.','Try them at the Guéliz studio','Atelier','Hand crochet','Small batch','The story','Postcards from Marrakech, worn as earrings.','The hands behind the piece','The maker’s first name is on the tag.','Three gestures','Dyeing','Natural raffia is hand-dyed in the atelier’s colors.','Crochet','Each fruit is crocheted by hand, piece by piece.','Assembly','The fruits are then assembled onto their gold-tone hoops.','The other fruits','View all jewelry','The details','Collection','Season','Material','Format','Attachment','Packaging','Frequently asked questions','The little things to know.','How do I care for my earrings?','What are they made from?','What size are the hoops?','Are they ready to give?','All questions','Delivery','Returns','Payment','The pair, ready to give','5 hours per pair']
  };
  const keys = ['announcement','limited','material','pair','pairText','hoops','tag','artisan','box','included','blackBox','signed','giftTitle','giftNote','studio','atelier','crochet','batch','story','storyTitle','making','makingTitle','gestures','dye','dyeText','crochetStep','crochetText','assembly','assemblyText','others','allJewelry','specs','collection','season','materialLabel','format','attachment','packaging','questions','questionTitle','faqCare','faqMaterial','faqSize','faqGift','allQuestions','delivery','returns','payment','sticky','hours'];
  words.es = ['Pequeñas series de taller, al ritmo del ganchillo a mano','Edición limitada','Rafia teñida a mano','El par','Dos frutas tejidas a mano','Aros dorados','Etiqueta firmada','Nombre de la artesana','La caja','Incluida','Caja negra YZA','Con la etiqueta firmada','¿Un mensaje para acompañarlo?','Añádelo a la nota del pedido al pagar.','Pruébalos en el estudio de Guéliz','Taller','Ganchillo a mano','Pequeña serie','La historia','Postales de Marrakech, llevadas en las orejas.','Las manos detrás de la pieza','El nombre de quien los hizo está en la etiqueta.','Tres gestos','Teñido','La rafia natural se tiñe a mano con los colores del taller.','Ganchillo','Cada fruta se teje a mano, pieza por pieza.','Montaje','Las frutas se montan después en sus aros dorados.','Las otras frutas','Ver todas las joyas','Los detalles','Colección','Temporada','Material','Formato','Sujeción','Embalaje','Preguntas frecuentes','Los pequeños detalles.','¿Cómo cuido mis pendientes?','¿De qué están hechos?','¿Qué tamaño tienen los aros?','¿Están listos para regalar?','Todas las preguntas','Envío','Devoluciones','Pago','El par, listo para regalar','5 horas por par'];
  words.tr = ['El örgüsünün ritmiyle üretilen küçük atölye serileri','Sınırlı üretim','Elde boyanmış rafya','Çift','Elde örülmüş iki meyve','Altın rengi halkalar','İmzalı etiket','Zanaatkârın adı','Hediye kutusu','Dahil','Siyah YZA kutusu','İmzalı etiketle birlikte','Bir mesaj eklemek ister misiniz?','Ödeme sırasında sipariş notuna ekleyin.','Guéliz stüdyosunda deneyin','Atölye','El tığ işi','Küçük seri','Hikâye','Marakeş’ten, kulaklarda taşınan kartpostallar.','Parçanın arkasındaki eller','Onları yapan kişinin adı etikette.','Üç adım','Boyama','Doğal rafya atölyenin renklerinde elde boyanır.','Tığ işi','Her meyve, parça parça elde örülür.','Montaj','Meyveler daha sonra altın rengi halkalarına takılır.','Diğer meyveler','Tüm takıları görün','Detaylar','Koleksiyon','Sezon','Malzeme','Biçim','Bağlantı','Paketleme','Sık sorulan sorular','Küçük detaylar.','Küpelerime nasıl bakım yaparım?','Hangi malzemeden yapılırlar?','Halkaların boyutu nedir?','Hediye etmeye hazır mı?','Tüm sorular','Teslimat','İade','Ödeme','Hediye etmeye hazır çift','Çift başına 5 saat'];
  words.ar = ['سلاسل صغيرة من الورشة، على إيقاع الكروشيه اليدوي','إصدار محدود','رافيا مصبوغة يدويًا','الزوج','ثمرتان من الكروشيه اليدوي','حلقات بلون ذهبي','بطاقة موقعة','اسم الحرفية','علبة الهدية','مرفقة','علبة YZA سوداء','مع البطاقة الموقعة','هل تودين إرفاق رسالة؟','أضيفيها إلى ملاحظة الطلب عند الدفع.','جرّبيها في استوديو كليز','الورشة','كروشيه يدوي','سلسلة صغيرة','الحكاية','بطاقات من مراكش، تُرتدى كأقراط.','الأيدي وراء القطعة','اسم الحرفية التي صنعتها مكتوب على البطاقة.','ثلاث خطوات','الصباغة','تُصبغ الرافيا الطبيعية يدويًا بألوان الورشة.','الكروشيه','تُحاك كل ثمرة يدويًا، قطعةً قطعة.','التركيب','ثم تُثبّت الثمار على حلقاتها ذات اللون الذهبي.','الثمار الأخرى','شاهدي كل المجوهرات','التفاصيل','المجموعة','الموسم','الخامة','الشكل','التثبيت','التغليف','أسئلة شائعة','تفاصيل صغيرة تهمك.','كيف أعتني بأقراطي؟','مما صُنعت؟','ما حجم الحلقات؟','هل هي جاهزة للإهداء؟','جميع الأسئلة','التوصيل','الإرجاع','الدفع','الزوج، جاهز للإهداء','٥ ساعات للزوج'];
  let current, mq, observer, frame;
  function copy() { return Object.fromEntries(keys.map((key,i) => [key,(words[YZA.i18n.lang] || words.en)[i]])); }
  // Use the released, product-specific worn photos and films. Keep the verified
  // packshot first; never substitute another fruit or a generic model image.
  YZA.earringGallery = function (p) {
    const first = p.img.split('?')[0] + '?v=20260909-4k';
    const avocado = p.handle === 'avocado-raffia-earrings-ss26';
    const items = [{type:'image',src:first}];
    if (avocado) items.push({type:'image',src:'assets/products/earrings/hover/avocado.webp'});
    const seen = new Set(items.map(item => item.src.split('?')[0]));
    const released = Array.isArray(p.media) && p.media.length ? p.media : (p.gallery || []).map(src => ({type:'image',src}));
    released.forEach(item => {
      if (!item?.src || !['image','video'].includes(item.type)) return;
      const key = item.src.split('?')[0];
      // The 360px avocado portrait has a higher-quality worn alternative above.
      if (seen.has(key) || (avocado && key.endsWith('/avocado-earrings-01.webp'))) return;
      seen.add(key); items.push(item);
    });
    return items;
  };
  function gallery(p) {
    // main.js owns desktop thumbnails, video playback and zoom. Mirror that same
    // ordered gallery on mobile instead of replacing it with one photograph.
    const main = $('#galMainImg');
    if (main) { main.width = 3584; main.height = 4800; }
    $('#galThumbs').hidden = $('#galThumbs').children.length <= 1;
    YZA.productMaison.mobileGallery(p);
  }
  function editorial(p, c) {
    $('#earringEditorial')?.remove();
    const wrap = document.createElement('div'); wrap.id = 'earringEditorial';
    $('.product-rail-section').before(wrap);
    const items = YZA.byCategory('all').filter(item => item.category === 'earrings' && item.handle !== p.handle);
    const facts = [[c.collection,p.collection],[c.season,p.season],[c.materialLabel,p.material],[c.format,p.dimensions],[c.attachment,p.attachment],[c.packaging,p.packaging]].filter(([,v]) => pick(v));
    const faq = [[c.faqCare,p.care],[c.faqMaterial,p.material],[c.faqSize,p.attachment],[c.faqGift,p.packaging]];
    const services = [[c.delivery,p.shipping],[c.returns,p.returns],[c.payment,YZA.serviceFeature('payment')?.text]];
    wrap.innerHTML = `<section class="bag-section earring-story"><div class="bag-motif">${motif()}</div>${rule(c.story)}<h2>${esc(c.storyTitle)}</h2><p>${esc(pick(p.desc))}</p><blockquote>${esc(pick(p.batch))}</blockquote></section>
      <section class="bag-section earring-making"><div>${rule(c.making)}<h2>${esc(c.makingTitle)}</h2><p>${esc(pick(p.making))}</p><p>${esc(pick(p.packaging))}</p><div class="earring-signs">${motif()}${image('/yza-v2-preview/assets/brand/pdp/yza-sign-16.png','','width="28" height="28"')}</div></div>${image(p.img,pick(p.name),'width="3584" height="4800"')}</section>
      <section class="bag-section earring-gestures">${rule(c.gestures,'Guéliz, Marrakech')}<div class="bag-gestures">${[[c.dye,c.dyeText],[c.crochetStep,c.crochetText],[c.assembly,c.assemblyText]].map(([title,body],i)=>`<article><span class="bag-step-number">0${i+1}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join('')}</div></section>
      <section class="bag-section earring-market"><div class="earring-market-head">${rule(c.others)}<a href="/collections/bijoux">${esc(c.allJewelry)}</a></div><div class="earring-market-row" tabindex="0" role="region" aria-label="${esc(c.others)}" data-scroll-row>${items.map(item=>`<a href="/produits/${esc(item.handle)}">${image(item.img,pick(item.name),'width="3584" height="4800"')}<h3>${esc(pick(item.name))}</h3><span>${esc(YZA.i18n.formatPrice(item.price))}</span></a>`).join('')}</div></section>
      <section class="bag-section bag-specs">${rule(c.specs)}<dl class="bag-spec-grid">${facts.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(pick(v))}</dd></div>`).join('')}</dl></section>
      <section class="bag-section bag-questions earring-questions"><div>${rule(c.questions)}<h2>${esc(c.questionTitle)}</h2><a href="/faq">${esc(c.allQuestions)}</a></div><div>${faq.map(([q,a])=>`<details><summary>${esc(q)}<span aria-hidden="true"></span></summary><p>${esc(pick(a))}</p></details>`).join('')}</div></section>
      <section class="bag-section earring-services">${services.map(([title,body])=>`<article>${motif()}<h2>${esc(title)}</h2><p>${esc(pick(body))}</p></article>`).join('')}</section>`;
    wrap.querySelectorAll('details').forEach(item => item.addEventListener('toggle', () => {
      if (item.open) wrap.querySelectorAll('details[open]').forEach(other => { if (other !== item) other.open = false; });
    }));
    const row = wrap.querySelector('.earring-market-row');
    row.addEventListener('dragstart', event => event.preventDefault());
    YZA.enableDragScroll(row);
  }
  function buying(p, c) {
    const button = $('#pAdd'), bar = $('#mobileProductBar');
    $('#mobileProductBarName').innerHTML = `<span class="earring-sticky-name">${esc(pick(p.name))}</span>${esc(YZA.i18n.formatPrice(p.price))}<small>${esc(c.sticky)}</small>`;
    $('#mobileProductAdd').textContent = YZA.i18n.t('pp.add');
    $('#mobileProductAdd').disabled = button.disabled;
    $('#mobileProductAdd').onclick = () => button.click();
    const refresh = () => {
      frame = null;
      const anchor = button.getBoundingClientRect(), footer = $('footer')?.getBoundingClientRect();
      const hidden = Boolean(footer && footer.top < innerHeight) || (!mq.matches && anchor.bottom > 0);
      bar.hidden = hidden; document.body.classList.toggle('has-product-bar', !hidden);
    };
    current.refresh = refresh;
    observer?.disconnect(); observer = new IntersectionObserver(refresh);
    observer.observe(button); if ($('footer')) observer.observe($('footer'));
    refresh();
  }
  YZA.renderEarringMaison = function ({product:p}) {
    if (p.category !== 'earrings') return;
    p = { ...p, img: p.img.split('?')[0] + '?v=20260909-4k' };
    document.body.classList.add('earring-product','maison-product');
    if (!mq) {
      mq = matchMedia('(max-width:860px)');
      mq.addEventListener('change', () => current?.refresh());
      window.addEventListener('scroll', () => { if (!frame) frame=requestAnimationFrame(() => current?.refresh()); }, {passive:true});
    }
    const c = copy(); current = {product:p,copy:c};
    YZA.productMaison.header(c);
    let collection = $('#earringCollection');
    if (!collection) { collection=document.createElement('div'); collection.id='earringCollection'; $('#pName').before(collection); }
    collection.innerHTML = rule(pick(p.collection),c.limited);
    let priceRow = $('.bag-price-row');
    if (!priceRow) { priceRow=document.createElement('div'); priceRow.className='bag-price-row'; $('#pName').after(priceRow); }
    const priceNode=$('#pPrice'); priceRow.replaceChildren();
    priceRow.innerHTML=`<span class="bag-color-title">${esc(c.material)}</span>`; priceRow.append(priceNode);
    let pair=$('#earringPair');
    if (!pair) { pair=document.createElement('section'); pair.id='earringPair'; $('#pShort').after(pair); }
    let composition=c.pairText;
    if (YZA.i18n.lang==='fr') composition = /(?:lemon|orange)-/.test(p.handle) ? 'Un fruit entier, une tranche' : /(?:kiwi|watermelon)-/.test(p.handle) ? 'Deux tranches crochetées main' : c.pairText;
    pair.innerHTML=`<div class="bag-motif">${motif()}</div><h2 class="earring-label">${esc(c.pair)}</h2><ul class="earring-pair-list"><li><span>${esc(composition)}</span><small>${esc(c.material)}</small></li><li><span>${esc(c.hoops)}</span><small>1,5–2 cm</small></li><li><span>${esc(c.tag)}</span><small>${esc(c.artisan)}</small></li></ul><div class="earring-box"><h2 class="earring-label"><span>${esc(c.box)}</span><span>${esc(c.included)}</span></h2><p><strong>${esc(c.blackBox)}</strong><span>${esc(c.signed)}</span></p><p class="earring-gift-note"><span>${esc(c.giftTitle)}</span><span>${esc(c.giftNote)}</span></p></div>`;
    pair.after($('#pAdd').closest('.option--add'));
    let studio=$('.bag-studio-visit');
    if (!studio) { studio=document.createElement('a'); studio.className='bag-studio-visit'; studio.href='/studio'; $('#pAdd').after(studio); }
    studio.textContent=c.studio;
    let provenance=$('#earringProvenance');
    if (!provenance) { provenance=document.createElement('dl'); provenance.id='earringProvenance'; provenance.className='bag-provenance'; $('.product-info').append(provenance); }
    provenance.innerHTML=[[c.atelier,'Guéliz, Marrakech'],[c.crochet,p.hours===5?c.hours:pick(p.handworkTime)],[c.batch,c.limited]].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    gallery(p); editorial(p,c); buying(p,c); YZA.productMaison.shipping(p);
  };
  document.addEventListener('yza:cartchange', () => { if (current) YZA.productMaison.shipping(current.product); });
})();
