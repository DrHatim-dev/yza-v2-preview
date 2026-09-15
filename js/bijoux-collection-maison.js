/* Bijoux collection: ZIP 10 presentation, existing catalogue and approved media. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pick = v => typeof v === 'string' ? v : v?.[YZA.i18n?.lang] || v?.fr || '';
  const labels = {
    fr: ['Accueil','Toute la boutique','Bijoux en raphia','Le Marché aux Fruits','Boucles d’oreilles fruits, crochetées main en raphia à Marrakech. La touche de couleur qui signe une tenue — un vert, un rouge, un jaune qu’on ne trouve pas dans une bijouterie.','paires au marché','à partir de','de créole dorée','Couleur','Toutes','Verts','Agrumes','Rouges','Violets','paires','Portées','Assez légères pour s’oublier, assez vives pour qu’on les remarque.','C’est un bijou textile : le raphia donne à chaque paire sa légèreté. Les fruits sont montés sur des créoles dorées de 1,5 à 2 cm, selon le modèle. Petit format, léger et visible.','Le raphia naturel est teint à la main, puis crocheté fil à fil à Guéliz. Les détails et les finitions gardent la trace du geste de l’artisane.','Créoles','Dorées, 1,5 à 2 cm','Matière','Raphia teint main','Poids','Bijou textile','Le reste du marché','Les mêmes fruits, ailleurs','Le kiwi qui pend à votre oreille existe aussi en charm pour le sac. Accordez la paire et le panier, ou dépareillez.','Les charms','Découvrir les charms','Les sacs','Voir les paniers','Une couleur qu’on ne trouve pas en bijouterie','Chaque paire arrive dans sa boîte noire signée YZA, prête à offrir, avec le prénom de l’artisane sur l’étiquette.','Prêt à offrir','Dans sa boîte noire YZA, avec son étiquette signée.','Édition limitée','Des pièces crochetées à la main, au rythme de l’atelier.','L’anneau se remplace','Si la créole dorée perd sa couleur, elle peut être remplacée.','Aucune paire pour cette sélection.','Voir tous les bijoux','Créoles dorées 1,5–2 cm · Bijou textile, léger et visible','Le Studio','Boucles raisins portées à l’oreille'],
    en: ['Home','All collections','Raffia jewellery','The Fruit Market','Fruit earrings, crocheted by hand in raffia in Marrakech. A touch of colour to finish an outfit — greens, reds and yellows you won’t find in a jewellery shop.','pairs at the market','from','gold-tone hoops','Colour','All','Greens','Citrus','Reds','Purples','pairs','Worn','Light enough to forget, bright enough to notice.','These are textile jewels: raffia gives each pair its lightness. The fruits hang from 1.5–2 cm gold-tone hoops, depending on the design. Small, light and visible.','Natural raffia is dyed by hand, then crocheted stitch by stitch in Guéliz. Each detail and finishing touch carries the mark of its maker.','Hoops','Gold-tone, 1.5–2 cm','Material','Hand-dyed raffia','Weight','Textile jewellery','The rest of the market','The same fruits, elsewhere','The kiwi on your ear also comes as a bag charm. Match your earrings and basket, or mix things up.','The charms','Discover the charms','The bags','Explore the baskets','Colour you won’t find in a jewellery shop','Each pair arrives in a black YZA box, ready to give, with the maker’s first name on its tag.','Ready to give','In a black YZA box, with a signed tag.','Limited edition','Hand-crocheted pieces, made at the atelier’s pace.','Replaceable hoop','If the gold-tone hoop loses its colour, it can be replaced.','No pairs match this selection.','View all jewellery','Gold-tone hoops 1.5–2 cm · Light, colourful textile jewellery','The Studio','Grape earrings worn on the ear'],
    es: ['Inicio','Toda la tienda','Joyas de rafia','El mercado de frutas','Pendientes de frutas, tejidos a mano en rafia en Marrakech. El toque de color que firma un look: verdes, rojos y amarillos que no encontrarás en una joyería.','pares en el mercado','desde','de aro dorado','Color','Todos','Verdes','Cítricos','Rojos','Violetas','pares','Puestos','Tan ligeros que se olvidan, tan vivos que se hacen notar.','Son joyas textiles: la rafia aporta ligereza a cada par. Las frutas cuelgan de aros dorados de 1,5 a 2 cm, según el modelo. Pequeños, ligeros y visibles.','La rafia natural se tiñe a mano y se teje punto a punto en Guéliz. Cada detalle conserva el gesto de la artesana.','Aros','Dorados, 1,5–2 cm','Material','Rafia teñida a mano','Peso','Joya textil','El resto del mercado','Las mismas frutas, en otro lugar','El kiwi de tu oreja también existe como charm para el bolso. Combina el par y la cesta, o mezcla colores.','Los charms','Descubrir los charms','Los bolsos','Ver las cestas','Un color que no encontrarás en una joyería','Cada par llega en su caja negra YZA, listo para regalar, con el nombre de la artesana en la etiqueta.','Listo para regalar','En su caja negra YZA, con etiqueta firmada.','Edición limitada','Piezas tejidas a mano, al ritmo del taller.','El aro se reemplaza','Si el aro dorado pierde su color, puede reemplazarse.','No hay pares para esta selección.','Ver todas las joyas','Aros dorados 1,5–2 cm · Joyas textiles, ligeras y visibles','El estudio','Pendientes de uvas puestos'],
    tr: ['Ana sayfa','Tüm koleksiyon','Rafya takılar','Meyve pazarı','Marakeş’te rafyadan elle örülen meyve küpeleri. Bir görünümü tamamlayan renk: kuyumcuda bulamayacağınız yeşiller, kırmızılar ve sarılar.','meyve küpesi','başlangıç fiyatı','altın renkli halka','Renk','Tümü','Yeşiller','Turunçgiller','Kırmızılar','Morlar','çift','Kulakta','Unutturacak kadar hafif, fark edilecek kadar canlı.','Bunlar tekstil takılarıdır: rafya her çifte hafiflik verir. Meyveler modele göre 1,5–2 cm altın renkli halkalara takılır. Küçük, hafif ve dikkat çekici.','Doğal rafya elle boyanır, sonra Guéliz’de ilmek ilmek örülür. Her detayda onu yapan ustanın izi vardır.','Halkalar','Altın renkli, 1,5–2 cm','Malzeme','Elle boyanmış rafya','Ağırlık','Tekstil takı','Pazarın devamı','Aynı meyveler, başka yerde','Kulağınızdaki kivi, çanta süsü olarak da var. Küpelerinizi ve sepetinizi eşleştirin veya renkleri karıştırın.','Çanta süsleri','Süsleri keşfet','Çantalar','Sepetleri gör','Kuyumcuda bulamayacağınız bir renk','Her çift, YZA’nın siyah kutusunda hediye edilmeye hazır gelir. Etiketinde onu yapan ustanın adı vardır.','Hediyeye hazır','İmzalı etiketiyle siyah YZA kutusunda.','Sınırlı üretim','Atölyenin ritminde, elle örülen parçalar.','Halka değiştirilebilir','Altın renkli halka rengini kaybederse değiştirilebilir.','Bu seçimde küpe bulunamadı.','Tüm takıları gör','Altın renkli halkalar 1,5–2 cm · Hafif tekstil takılar','Stüdyo','Kulakta üzüm küpeleri'],
    ar: ['الرئيسية','كل التشكيلات','حلي من الرافيا','سوق الفواكه','أقراط فواكه من الرافيا، تُحاك بالكروشيه يدويًا في مراكش. لمسة لون تكمّل الإطلالة: أخضر وأحمر وأصفر لن تجديها في متجر للمجوهرات.','أزواج في السوق','ابتداءً من','حلقات ذهبية اللون','اللون','الكل','الأخضر','الحمضيات','الأحمر','البنفسجي','أزواج','على الأذن','خفيفة حتى تنسيها، وزاهية حتى تلفت الأنظار.','إنها حلي نسيجية: تمنح الرافيا كل زوج خفّته. تتدلى الفواكه من حلقات ذهبية اللون بقياس 1.5 إلى 2 سم حسب التصميم. صغيرة وخفيفة وواضحة.','تُصبغ الرافيا الطبيعية يدويًا ثم تُحاك غرزة بعد غرزة في جليز. في كل تفصيل ولمسة أخيرة أثر يد الصانعة.','الحلقات','ذهبية اللون، 1.5–2 سم','المادة','رافيا مصبوغة يدويًا','الوزن','حلي نسيجية','بقية السوق','الفواكه نفسها، في مكان آخر','الكيوي الذي يتدلى من أذنك يتوفر أيضًا كتعليقة للحقيبة. نسّقي الأقراط والسلة أو امزجي الألوان.','التعليقات','اكتشفي التعليقات','الحقائب','شاهدي السلال','لون لن تجديه في متجر للمجوهرات','يصل كل زوج في علبته السوداء الموقعة YZA، جاهزًا للإهداء، مع اسم الصانعة على البطاقة.','جاهز للإهداء','في علبة YZA السوداء، مع بطاقة موقّعة.','إصدار محدود','قطع كروشيه يدوية، على إيقاع الورشة.','الحلقة قابلة للاستبدال','إذا فقدت الحلقة الذهبية اللون لونها، يمكن استبدالها.','لا توجد أقراط لهذا الاختيار.','عرض كل الحلي','حلقات ذهبية اللون 1.5–2 سم · حلي نسيجية خفيفة','الاستوديو','أقراط عنب على الأذن']
  };
  const keys = ['home','shop','title','eyebrow','intro','pairs','from','hoopSize','color','all','green','citrus','red','purple','results','worn','wornTitle','wornText','craftText','hoops','hoopsText','material','materialText','weight','weightText','rest','restTitle','restText','charms','charmsLink','bags','bagsLink','giftTitle','giftText','ready','readyText','edition','editionText','repair','repairText','empty','reset','announcement','studio','wornAlt'];
  const copy = () => Object.fromEntries(keys.map((k,i) => [k,(labels[YZA.i18n?.lang] || labels.fr)[i]]));
  const families = { green:'#7c9b3f', citrus:'#de733d', red:'#c2402c', purple:'#7a5b86' };
  const details = {
    watermelon: ['red','#c8474b',0,0], kiwi: ['green','#7c9b3f',1,0], avocado: ['green','#5f7d4a',2,1], lemon: ['citrus','#dcb43a',3,2],
    orange: ['citrus','#de733d',4,2], grapes: ['purple','#7a5b86',5,3], cherries: ['red','#b0362c',6,4], tomatoes: ['red','#c2402c',7,5]
  };
  const colorNames = { fr:['Rouge pastèque','Vert kiwi','Vert avocat','Jaune citron','Orange','Violet raisin','Rouge cerise','Rouge tomate'], en:['Watermelon red','Kiwi green','Avocado green','Lemon yellow','Orange','Grape purple','Cherry red','Tomato red'], es:['Rojo sandía','Verde kiwi','Verde aguacate','Amarillo limón','Naranja','Violeta uva','Rojo cereza','Rojo tomate'], tr:['Karpuz kırmızısı','Kivi yeşili','Avokado yeşili','Limon sarısı','Turuncu','Üzüm moru','Kiraz kırmızısı','Domates kırmızısı'], ar:['أحمر البطيخ','أخضر الكيوي','أخضر الأفوكادو','أصفر الليمون','برتقالي','بنفسجي العنب','أحمر الكرز','أحمر الطماطم'] };
  const shapes = { fr:['Deux tranches','Deux moitiés','Un fruit entier, une tranche','Deux grappes','Duos de cerises','Deux tomates'], en:['Two slices','Two halves','One whole fruit, one slice','Two bunches','Cherry duos','Two tomatoes'], es:['Dos rodajas','Dos mitades','Una fruta entera y una rodaja','Dos racimos','Dúos de cerezas','Dos tomates'], tr:['İki dilim','İki yarım','Bir bütün meyve, bir dilim','İki salkım','Kiraz çiftleri','İki domates'], ar:['شريحتان','نصفان','ثمرة كاملة وشريحة','عنقودان','ثنائيات الكرز','ثمرتا طماطم'] };
  const info = p => details[p.handle.split('-')[0]];
  let active = false, built = false, restore = [];
  function move(node, parent, before) {
    if (!node || !parent) return;
    const marker = document.createComment('bijoux-header-position'); node.before(marker); parent.insertBefore(node,before || null);
    restore.push(() => marker.replaceWith(node));
  }
  function header() {
    const c = copy(),line = document.querySelector('.announcement__line');
    if (line) { line.removeAttribute('data-i18n'); line.textContent = c.announcement; }
    const link = document.querySelector('.bijoux-nav-link[href="studio"],.bijoux-nav-link[href="/studio"]');
    if (link) link.textContent = c.studio;
  }
  function mountHeader() {
    if (document.body.classList.contains('site-maison')) return;
    const inner = document.querySelector('.header__inner'), nav = inner?.querySelector('.nav'), actions = inner?.querySelector('.header__actions');
    for (const path of ['studio','grossistes']) {
      const link = nav?.querySelector(`a[href="${path}"],a[href="/${path}"]`); if (!link || !actions) continue;
      const wrapper = link.closest('.nav-item'); link.classList.add('bijoux-nav-link'); move(link,actions,actions.querySelector('#searchOpen'));
      if (wrapper) { wrapper.hidden = true; restore.push(() => { wrapper.hidden = false; link.classList.remove('bijoux-nav-link'); }); }
    }
    const burger = inner?.querySelector('#burger');
    if (burger) { const slot = document.createElement('div'); slot.className = 'bijoux-menu-slot'; inner.prepend(slot); move(burger,slot); restore.push(() => slot.remove()); }
    const line = document.querySelector('.announcement__line');
    if (line) { const key = line.getAttribute('data-i18n'),text = line.textContent; restore.push(() => { if(key)line.setAttribute('data-i18n',key);line.textContent = key ? YZA.i18n.t(key) : text; }); }
    header();
  }
  function build() {
    if (built) return; built = true;
    const wrap = document.querySelector('main > .container-wide');
    const intro = document.createElement('section'); intro.id = 'bijouxIntro'; intro.className = 'bijoux-intro bijoux-extra'; wrap.prepend(intro);
    const controls = document.createElement('div'); controls.id = 'bijouxControls'; controls.className = 'bijoux-controls bijoux-extra'; wrap.querySelector('.toolbar').prepend(controls);
    const editorial = document.createElement('div'); editorial.id = 'bijouxEditorial'; editorial.className = 'bijoux-editorial bijoux-extra'; wrap.append(editorial);
    wrap.addEventListener('click', event => {
      if (!active) return;
      const button = event.target.closest('[data-bijoux-tone],[data-bijoux-reset]');
      if (!button) return;
      YZA.collectionFilters.update(button.hasAttribute('data-bijoux-reset') ? {reset:true} : {tone:button.dataset.bijouxTone});
    });
  }
  function filter(list,next) {
    if (!Object.hasOwn(families,next.bijouxTone)) next.bijouxTone = '';
    return list.filter(p => !next.bijouxTone || info(p)?.[0] === next.bijouxTone);
  }
  function editorialHTML() {
    const c=copy();
    return `<section class="bijoux-worn"><div><div class="bijoux-section-label"><img src="/yza-v2-preview/assets/rtw/maison/am-16.png" alt="" width="20" height="44"><p class="bijoux-eyebrow">${esc(c.worn)}</p></div><h2>${esc(c.wornTitle)}</h2><p>${esc(c.wornText)}</p><p>${esc(c.craftText)}</p><dl class="bijoux-specs">${['hoops','material','weight'].map(k => `<div><dt>${esc(c[k])}</dt><dd>${esc(c[k+'Text'])}</dd></div>`).join('')}</dl></div><img class="bijoux-worn-photo" src="/yza-v2-preview/assets/lifestyle/accessories/grapes-earrings-violet-03.webp" alt="${esc(c.wornAlt)}" width="1080" height="1350" loading="lazy" decoding="async"></section><section class="bijoux-rest"><p class="bijoux-eyebrow">${esc(c.rest)}</p><h2>${esc(c.restTitle)}</h2><p class="bijoux-section-intro">${esc(c.restText)}</p><div class="bijoux-crosslinks"><a href="/collections/charms"><img src="/yza-v2-preview/assets/products/fruit-market/styling/charms-atelier-raffia-detail.jpg" alt="${esc(c.charms)}" width="720" height="961" loading="lazy"><div><h3>${esc(c.charms)}</h3><span>${esc(c.charmsLink)}</span></div></a><a href="/collections/sacs"><img src="/yza-v2-preview/assets/home/maison/sculpture-lifestyle.jpg" alt="${esc(c.bags)}" width="800" height="1000" loading="lazy"><div><h3>${esc(c.bags)}</h3><span>${esc(c.bagsLink)}</span></div></a></div></section><section class="bijoux-gift"><img class="bijoux-glyph" src="/yza-v2-preview/assets/rtw/maison/am-woven.png" alt="" width="38" height="38"><h2>${esc(c.giftTitle)}</h2><p class="bijoux-section-intro">${esc(c.giftText)}</p><div class="bijoux-reassurances">${['ready','edition','repair'].map(k => `<div><h3>${esc(c[k])}</h3><p>${esc(c[k+'Text'])}</p></div>`).join('')}</div></section>`;
  }
  YZA.bijouxCollection = {
    prepare(next) {
      const on=next.cat === 'accessories';
      if (on && !built) {
        let saved=''; try { saved=localStorage.getItem('yza_bijoux_grid_density') || ''; } catch (_) { /* Optional storage. */ }
        next.density=['3','4','6'].includes(saved) ? saved : '4'; build();
      }
      if (on !== active) { active=on; document.body.classList.toggle('bijoux-maison',on); if (on) mountHeader(); else { restore.forEach(fn => fn()); restore=[]; } }
      document.querySelectorAll('.bijoux-extra').forEach(e => { e.hidden=!on; });
    },
    filter,
    renderGrid(el,list,next,card) {
      const lang=YZA.i18n?.lang || 'fr';
      el.innerHTML=list.map((p,i) => {
        const d=info(p),color=d ? (colorNames[lang] || colorNames.fr)[d[2]] : '',shape=d ? (shapes[lang] || shapes.fr)[d[3]] : pick(p.short);
        const notes=`<div class="bijoux-card-notes">${color ? `<p><i style="--bijoux-swatch:${d[1]}" aria-hidden="true"></i>${esc(color)}</p>` : ''}<p>${esc(shape)}</p></div>`;
        return card(p,i,i<4,{tile:true}).replace('</article>',notes+'</article>');
      }).join('');
    },
    render(next,list) {
      if (!active) return;
      const c=copy(),products=YZA.byCategory('accessories'); header();
      try { localStorage.setItem('yza_bijoux_grid_density',next.density); } catch (_) { /* Optional storage. */ }
      const from=products.length ? YZA.i18n.formatPrice(Math.min(...products.map(p=>p.price))) : '—';
      document.getElementById('bijouxIntro').innerHTML=`<nav class="bijoux-breadcrumb" aria-label="${esc(c.home)}"><a href="/">${esc(c.home)}</a><span>/</span><a href="/collections">${esc(c.shop)}</a><span>/</span><span>${esc(YZA.i18n.t('nav.accessories'))}</span></nav><div class="bijoux-intro-grid"><div><p class="bijoux-eyebrow">${esc(c.eyebrow)} <i aria-hidden="true"></i> All Seasons 2026</p><h1>${esc(c.title)}</h1><p class="bijoux-intro-copy">${esc(c.intro)}</p></div><div class="bijoux-facts"><div><strong>${products.length}</strong><span>${esc(c.pairs)}</span></div><div><strong>${esc(from)}</strong><span>${esc(c.from)}</span></div><div><strong dir="ltr">1,5–2 cm</strong><span>${esc(c.hoopSize)}</span></div></div></div>`;
      const focused=document.activeElement?.closest('[data-bijoux-tone]'),focusKey=focused?.dataset.bijouxTone;
      document.getElementById('bijouxControls').innerHTML=`<div class="bijoux-tabs" role="group" aria-label="${esc(c.color)}"><span class="bijoux-filter-label">${esc(c.color)}</span>${['',...Object.keys(families)].map(tone => `<button type="button" data-bijoux-tone="${tone}" aria-pressed="${next.bijouxTone === tone}">${tone ? `<i style="--bijoux-swatch:${families[tone]}" aria-hidden="true"></i>` : ''}${esc(c[tone || 'all'])}<span>${products.filter(p=>!tone || info(p)?.[0]===tone).length}</span></button>`).join('')}</div>`;
      if (focused) [...document.querySelectorAll('[data-bijoux-tone]')].find(e=>e.dataset.bijouxTone===focusKey)?.focus({preventScroll:true});
      for (const id of ['collectionSort','gridDensity']) document.getElementById(id).hidden=false;
      const singular={fr:'paire',en:'pair',es:'par',tr:'çift',ar:'زوج'};
      const count=document.getElementById('resultCount'); count.textContent=`${list.length} ${list.length === 1 ? singular[YZA.i18n?.lang] || singular.fr : c.results}`; count.setAttribute('role','status'); count.setAttribute('aria-live','polite');
      document.getElementById('sortSelect').value=next.sort;
      if (!list.length) document.getElementById('collectionGrid').innerHTML=`<div class="bijoux-empty"><p>${esc(c.empty)}</p><button type="button" class="bijoux-text-link" data-bijoux-reset>${esc(c.reset)}</button></div>`;
      document.getElementById('bijouxEditorial').innerHTML=editorialHTML();
    }
  };
})();
