/* Keep translated content, metadata and structured data in the same locale. */
(function () {
  const langs = ['fr','en','es','tr','ar'];
  function sync() {
    const Y = window.YZA, t = Y && Y.i18n;
    if (!t) return;
    const lang = langs.includes(t.lang) ? t.lang : 'fr';
    const pick = value => typeof value === 'string' ? value : value && (value[lang] || value.en || value.fr) || '';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    const urlFor = locale => {
      const u = new URL(location.href); u.hash = '';
      [...u.searchParams.keys()].forEach(k => { if (!['color','cat','handle'].includes(k)) u.searchParams.delete(k); });
      if (locale !== 'fr') u.searchParams.set('lang', locale);
      return u.href;
    };
    const url = urlFor(lang);
    const canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.href = url;
    document.querySelectorAll('link[hreflang]').forEach(e => { e.href = urlFor(e.hreflang === 'x-default' ? 'fr' : e.hreflang); });
    let title = '', description = '', schema = null;
    const articles = window.YZA_JOURNAL_LOCALES || {};
    const slug = location.pathname.split('/').filter(Boolean).pop();
    const article = articles[slug] && articles[slug][lang];
    if (article && document.querySelector('.article-body')) {
      title = article.title + ' — YZA Journal'; description = article.description;
      schema = {'@context':'https://schema.org','@type':'BlogPosting',headline:article.title,description,inLanguage:lang,url};
      // The table of contents must use the same headings as the article.
      document.querySelectorAll('main a[href^="#"]').forEach(a => {
        const heading = document.getElementById(a.getAttribute('href').slice(1));
        if (heading && /^H[2-6]$/.test(heading.tagName)) a.textContent = heading.innerText;
      });
    }
    if (document.body.dataset.page === 'collections') {
      const name = (document.querySelector('#collectionTitleText') || document.querySelector('h1'))?.innerText.trim();
      if (name) {
        title = name + ' — YZA';
        const copy = {fr:'Découvrez les pièces YZA faites à la main à Marrakech : détails, couleurs et prix pour choisir votre prochaine pièce.',en:'Explore YZA pieces handmade in Marrakech. Discover the details, colours and prices to choose your next piece.',es:'Descubre las piezas YZA hechas a mano en Marrakech, sus detalles, colores y precios.',tr:'Marakeş’te el yapımı YZA parçalarını, detaylarını, renklerini ve fiyatlarını keşfedin.',ar:'اكتشفي قطع YZA المصنوعة يدويًا في مراكش، مع التفاصيل والألوان والأسعار لاختيار قطعتك القادمة.'};
        description = name + '. ' + copy[lang];
      }
    }
    document.querySelectorAll('.article-card').forEach(card => {
      const a = card.querySelector('h3 a'); if (!a) return;
      const key = new URL(a.href).pathname.split('/').filter(Boolean).pop();
      const copy = articles[key] && articles[key][lang]; if (!copy) return;
      a.textContent = copy.title;
      const p = card.querySelector('.article-card__body > p:not(.eyebrow)');
      if (p) p.textContent = copy.description;
    });
    if (document.body.dataset.page === 'product') {
      const base = Y.getProduct && Y.getProduct(slug);
      if (base) {
        const color = new URLSearchParams(location.search).get('color');
        const internalColor = color === 'vert-sapin' && slug.includes('la-nouvelle-vague') ? 'rose' : color;
        const p = internalColor && Y.resolveProductColorView ? Y.resolveProductColorView(base,internalColor) : base;
        const name = pick(p.name), selectedShade = color && Y.productColorway ? pick(Y.productColorway(slug,internalColor)?.name) : '';
        const shade = selectedShade && !name.toLowerCase().includes(selectedShade.toLowerCase()) ? selectedShade : ''; 
        title = name + (shade ? ' — ' + shade : '') + ' | YZA';
        const category = p.category === 'bags' ? 'bags' : p.category === 'charms' ? 'charms' : p.category === 'earrings' ? 'earrings' : p.category === 'necklaces' ? 'necklaces' : 'clothing';
        const descriptions = {
          fr: {bags:'Panier en raphia et feuille de bananier, tressé à la main à Marrakech. Pour accompagner vos journées et vos voyages.',charms:'Charm en raphia crocheté à la main à Marrakech, à accrocher à votre sac ou à offrir.',earrings:'Boucles en raphia crochetées à la main à Marrakech, pour apporter une touche de couleur à vos tenues.',necklaces:'Collier en raphia fait main à Marrakech, pour compléter vos tenues avec une touche de couleur.',clothing:'Pièce en tissu Jawhara confectionnée à Marrakech. Découvrez la coupe et les tailles pour composer votre vestiaire.'},
          en: {bags:'Raffia and banana-leaf basket bag, handwoven in Marrakech for everyday outings and travel.',charms:'Raffia charm hand-crocheted in Marrakech, to personalise your bag or give as a gift.',earrings:'Raffia earrings hand-crocheted in Marrakech, adding colour to everyday and holiday outfits.',necklaces:'Handmade raffia necklace from Marrakech, a colourful finishing touch for your outfit.',clothing:'Made in Marrakech from Jawhara fabric. Explore the fit and sizes to build your wardrobe.'},
          es: {bags:'Bolso cesta de rafia y hoja de banano, tejido a mano en Marrakech para el día a día y los viajes.',charms:'Charm de rafia tejido a mano en Marrakech para personalizar tu bolso o regalar.',earrings:'Pendientes de rafia tejidos a mano en Marrakech para dar color a tus conjuntos.',necklaces:'Collar de rafia hecho a mano en Marrakech para completar tus conjuntos.',clothing:'Prenda de tejido Jawhara confeccionada en Marrakech. Descubre el corte y las tallas.'},
          tr: {bags:'Marakeş’te elle örülen rafya ve muz yaprağı sepet çanta; günlük kullanım ve seyahat için.',charms:'Çantanızı kişiselleştirmek veya hediye etmek için Marakeş’te elle örülen rafya charm.',earrings:'Kombinlerinize renk katmak için Marakeş’te elle örülen rafya küpeler.',necklaces:'Kombinlerinizi tamamlamak için Marakeş’te el yapımı rafya kolye.',clothing:'Marakeş’te Jawhara kumaşından hazırlanan parça. Kesimi ve bedenleri keşfedin.'},
          ar: {bags:'حقيبة سلة من الرافيا وأوراق الموز، منسوجة يدويًا في مراكش للاستخدام اليومي والسفر.',charms:'تعليقة رافيا بالكروشيه اليدوي في مراكش، لتزيين حقيبتك أو تقديمها هدية.',earrings:'أقراط رافيا بالكروشيه اليدوي في مراكش لإضافة اللون إلى إطلالاتك.',necklaces:'قلادة رافيا مصنوعة يدويًا في مراكش لتكمل إطلالاتك.',clothing:'قطعة من قماش جوهرة مصنوعة في مراكش. اكتشفي القصة والمقاسات.'}
        };
        description = name + (shade ? ' — ' + shade : '') + '. ' + descriptions[lang][category];
        schema = {'@context':'https://schema.org','@type':'Product',name:name + (shade ? ' — '+shade : ''),description,url,brand:{'@type':'Brand',name:'YZA'},mainEntityOfPage:{'@type':'WebPage','@id':url,inLanguage:lang}};
        const image = document.querySelector('.gallery img')?.src || p.image;
        if (image) schema.image = new URL(image,document.baseURI).href;
        if (Number.isFinite(p.price)) schema.offers = {'@type':'Offer',price:(p.price/100).toFixed(2),priceCurrency:'MAD',url};
      }
    }
    if (description.length > 200) description = description.slice(0,197).replace(/\s+\S*$/, '') + '…';
    if (schema) schema.description = description;
    if (title && document.title !== title) document.title = title;
    const meta = (selector,value) => { const e = document.querySelector(selector); if (e && value) e.content = value; };
    meta('meta[name="description"]',description);
    meta('meta[property="og:title"]',title); meta('meta[property="og:description"]',description);
    meta('meta[name="twitter:title"]',title); meta('meta[name="twitter:description"]',description);
    meta('meta[property="og:url"]',url);
    meta('meta[property="og:locale"]',({fr:'fr_MA',en:'en_GB',es:'es_ES',tr:'tr_TR',ar:'ar_MA'})[lang]);
    if (schema) {
      let node = document.getElementById('localized-page-schema');
      if (!node) { node = document.createElement('script'); node.id = 'localized-page-schema'; node.type = 'application/ld+json'; document.head.append(node); }
      node.textContent = JSON.stringify(schema);
    }
    // Preserve the chosen language when entering another translated page.
    document.querySelectorAll('a[href]').forEach(a => {
      const u = new URL(a.href,location.href);
      if (u.origin !== location.origin || !u.pathname.startsWith('/yza-v2-preview/') || /\.[a-z0-9]+$/i.test(u.pathname) || a.getAttribute('href').startsWith('#')) return;
      if (lang === 'fr') u.searchParams.delete('lang'); else u.searchParams.set('lang',lang);
      a.href = u.href;
    });
  }
  const schedule = () => requestAnimationFrame(sync);
  function boot() {
    sync(); window.YZA?.i18n?.onChange(schedule);
    // Existing deferred initializers may render once more after DOMContentLoaded.
    const title = document.querySelector('title');
    if (title) new MutationObserver(schedule).observe(title,{childList:true,subtree:true,characterData:true});
    let previousLanguage = document.documentElement.lang;
    new MutationObserver(() => {
      if (previousLanguage !== document.documentElement.lang) {
        previousLanguage = document.documentElement.lang; schedule();
      }
    }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot); else boot();
}());
