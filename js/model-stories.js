/* Shared editorial photo galleries. Original products and commerce stay in main.js. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const photos = YZA.modelStoryPhotos || [];
  const mounted = new WeakMap();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const copy = {
    fr: { title: 'YZA, à leur manière.', intro: 'Des pièces qui voyagent. Des femmes qui les font vivre.', studio: 'Du studio à vos histoires.', clothing: 'Le vestiaire, porté.', clothesIntro: 'Deux façons de vivre les rayures YZA.', drag: 'Glissez pour explorer', previous: 'Photos précédentes', next: 'Photos suivantes', gallery: 'Photographies des YZA Girls', source: 'Voir la publication', all: 'Rencontrer les YZA Girls', bags: 'Panier YZA', rtw: 'Prêt-à-porter YZA' },
    en: { title: 'YZA, their own way.', intro: 'Pieces that travel. Women who bring them to life.', studio: 'From the studio to your stories.', clothing: 'The wardrobe, worn.', clothesIntro: 'Two ways to wear YZA stripes.', drag: 'Drag to explore', previous: 'Previous photos', next: 'Next photos', gallery: 'YZA Girls photographs', source: 'View the original post', all: 'Meet the YZA Girls', bags: 'YZA basket', rtw: 'YZA clothing' },
    es: { title: 'YZA, a su manera.', intro: 'Piezas que viajan. Mujeres que les dan vida.', studio: 'Del estudio a tus historias.', clothing: 'El vestuario, vivido.', clothesIntro: 'Dos formas de llevar las rayas YZA.', drag: 'Desliza para explorar', previous: 'Fotos anteriores', next: 'Fotos siguientes', gallery: 'Fotografías de las YZA Girls', source: 'Ver la publicación', all: 'Conoce a las YZA Girls', bags: 'Cesta YZA', rtw: 'Ropa YZA' },
    tr: { title: 'YZA, kendi tarzlarıyla.', intro: 'Yolculuk eden parçalar. Onlara hayat veren kadınlar.', studio: 'Stüdyodan hikâyelerinize.', clothing: 'Yaşayan gardırop.', clothesIntro: 'YZA çizgilerini giymenin iki yolu.', drag: 'Keşfetmek için kaydırın', previous: 'Önceki fotoğraflar', next: 'Sonraki fotoğraflar', gallery: 'YZA Girls fotoğrafları', source: 'Gönderiyi gör', all: 'YZA Girls ile tanışın', bags: 'YZA sepet', rtw: 'YZA giyim' },
    ar: { title: 'YZA، على طريقتهنّ.', intro: 'قطع تسافر. ونساء يمنحنها الحياة.', studio: 'من الاستوديو إلى حكاياتكنّ.', clothing: 'أزياء تنبض بالحياة.', clothesIntro: 'طريقتان لارتداء خطوط YZA.', drag: 'اسحبي لاكتشاف الصور', previous: 'الصور السابقة', next: 'الصور التالية', gallery: 'صور فتيات YZA', source: 'عرض المنشور الأصلي', all: 'تعرّفي على فتيات YZA', bags: 'سلة YZA', rtw: 'ملابس YZA' }
  };
  const words = () => copy[YZA.i18n?.lang] || copy.fr;
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const groups = {
    home: photos,
    girls: photos,
    bags: photos.filter(p => p.category === 'bags'),
    brand: photos,
    studio: photos,
    b2b: photos,
    product: photos,
    rtw: [...photos.filter(p => p.category === 'rtw'), ...photos.filter(p => p.category !== 'rtw')]
  };

  function photoHTML(p) {
    const c = words();
    return `<a class="model-story" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" draggable="false" aria-label="${esc(p.name)} — ${esc(c.source)}">
      <figure class="model-story__photo"><img src="${esc(p.variants[0].src)}" srcset="${p.variants.map(v => `${esc(v.src)} ${v.width}w`).join(', ')}" sizes="(max-width: 700px) calc((100vw - 46px) / 2), (max-width: 1100px) calc((100vw - 76px) / 4), 300px" width="${p.width}" height="${p.height}" alt="${esc(p.alt || (c[p.category] + ' · @' + p.account))}" loading="lazy" decoding="async" draggable="false" style="object-position:${p.position}"><span class="model-story__open" aria-hidden="true">↗</span></figure>
      <span class="model-story__caption" dir="auto"><strong>${esc(p.name)}</strong><span>${esc(p.city || '@' + p.account)}</span>${p.homeCopy ? '<span>Voir ce qu’on a en ce moment</span>' : ''}</span>
    </a>`;
  }

  function render(host, context = 'home') {
    if (!host || !photos.length) return;
    const key = `${context}:${YZA.i18n?.lang || 'fr'}`;
    if (mounted.get(host)?.key === key && host.querySelector('.model-gallery')) return;
    mounted.get(host)?.destroy();
    let list = context === 'home' ? ["rim-yellow", "fanny-yellow", "amelie-vague-s", "amelie-fuschia", "josephine-marron", "snap-flowers", "rim-yellow-blue", "fanny-xs-nude", "amelie-bougainvillier"].map(id => YZA.media.yzaGirls.find(g => g.id === id)).filter(Boolean).map(g => ({name:g.name,city:g.product + ' · ' + g.city,account:'yzahandmade',category:'bags',url:'/yza-v2-preview/collections/sacs',width:960,height:1200,position:'50% 50%',alt:YZA.i18n.pick(g.alt),homeCopy:true,variants:[{src:g.src,width:960}]})) : (groups[context] || photos);
    if (context === "studio") list = list.filter(p => !/^Hiba$/i.test(p.name || "") && p.account !== "_hibaberrada");
    const pair = false;
    const c = words();
    host.classList.add('model-gallery-host');
    host.innerHTML = `<div class="model-gallery${pair ? ' model-gallery--pair' : ''}" dir="ltr">
      <div class="model-gallery__track" tabindex="0" role="region" aria-label="${esc(c.gallery)}">${list.map(photoHTML).join('')}</div>
      ${pair ? '' : `<div class="model-gallery__controls"><span class="model-gallery__hint" dir="auto">${esc(c.drag)}</span><div class="model-gallery__progress" aria-hidden="true"><span></span></div><span class="model-gallery__count" aria-live="polite" aria-atomic="true"></span><div class="model-gallery__arrows"><button type="button" data-model-step="-1" aria-label="${esc(c.previous)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></button><button type="button" data-model-step="1" aria-label="${esc(c.next)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button></div></div>`}
    </div>`;
    const track = host.querySelector('.model-gallery__track');
    const previous = host.querySelector('[data-model-step="-1"]');
    const next = host.querySelector('[data-model-step="1"]');
    const count = host.querySelector('.model-gallery__count');
    const progress = host.querySelector('.model-gallery__progress span');
    const abort = new AbortController();
    const on = (el, type, fn, options = {}) => el.addEventListener(type, fn, { ...options, signal: abort.signal });
    let frame = 0;
    let gesture = null;
    let suppressClickUntil = 0;
    let layout = { step:1, width:1, max:0, total:1, pageWidth:1 };
    const step = () => layout.step;
    const measure = () => {
      const card = track.querySelector('.model-story');
      const width = track.clientWidth;
      const stride = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap) : 1;
      const columns = Math.max(1, Math.round(width / stride));
      layout = { step:stride, width, max:Math.max(0,track.scrollWidth-width), total:Math.max(1,Math.ceil(list.length/(columns*2))), pageWidth:stride*columns };
      if (progress) progress.style.width = `${Math.max(12,100/layout.total)}%`;
    };
    const update = () => {
      frame = 0;
      if (pair) return;
      const {max, pageWidth, total} = layout;
      const current = max > 0 && track.scrollLeft >= max - 2 ? total : Math.min(total, Math.floor((track.scrollLeft + pageWidth * .45) / pageWidth) + 1);
      previous.disabled = track.scrollLeft < 2;
      next.disabled = track.scrollLeft >= max - 2;
      const label = `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      if (count.textContent !== label) count.textContent = label;
      progress.style.transform = `translateX(${max ? track.scrollLeft / max * (total - 1) * 100 : 0}%)`;
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    const scrollTo = left => track.scrollTo({ left: Math.max(0, Math.min(layout.max, left)), behavior: reduced.matches ? 'instant' : 'smooth' });
    host.querySelectorAll('[data-model-step]').forEach(button => on(button, 'click', () => {
      scrollTo(track.scrollLeft + Number(button.dataset.modelStep) * layout.pageWidth);
    }));
    on(track, 'keydown', event => {
      if (event.target !== track) return;
      const keys = { ArrowRight: track.scrollLeft + step(), ArrowLeft: track.scrollLeft - step(), Home: 0, End: track.scrollWidth };
      if (!(event.key in keys)) return;
      event.preventDefault(); scrollTo(keys[event.key]);
    });
    // Touch keeps native momentum and vertical page scrolling. Mouse dragging starts
    // only after deliberate horizontal movement, preserving normal links and focus.
    on(track, 'pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || pair) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: track.scrollLeft, lastX: event.clientX, time: performance.now(), velocity: 0, moved: false };
    });
    on(track, 'pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        gesture.moved = true; track.classList.add('is-dragging'); track.setPointerCapture(event.pointerId);
      }
      if (!gesture.moved) return;
      event.preventDefault();
      const now = performance.now();
      gesture.velocity = (event.clientX - gesture.lastX) / Math.max(8, now - gesture.time);
      gesture.lastX = event.clientX; gesture.time = now;
      track.scrollLeft = gesture.scroll - dx;
    });
    const release = event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const ended = gesture; gesture = null;
      track.classList.remove('is-dragging');
      if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
      if (ended.moved) {
        suppressClickUntil = performance.now() + 350;
        const velocity = performance.now() - ended.time < 100 ? ended.velocity : 0;
        const momentum = reduced.matches || event.type !== 'pointerup' ? 0 : Math.max(-layout.width * .5, Math.min(layout.width * .5, velocity * 120));
        scrollTo(Math.round((track.scrollLeft - momentum) / step()) * step());
      }
    };
    on(track, 'pointerup', release); on(track, 'pointercancel', release); on(track, 'lostpointercapture', release);
    on(track, 'pointerleave', () => { if (gesture && !gesture.moved) gesture = null; });
    on(track, 'click', event => { if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); } }, { capture: true });
    on(track, 'dragstart', event => event.preventDefault());
    on(track, 'scroll', queue, { passive: true });
    const resize = new ResizeObserver(() => { measure(); queue(); }); resize.observe(track);
    mounted.set(host, { key, destroy() { abort.abort(); resize.disconnect(); cancelAnimationFrame(frame); } });
    measure(); update();
  }

  function section(context, before, position = 'beforebegin') {
    if (!before) return;
    let block = document.getElementById('modelStoriesSection');
    if (!block) {
      block = document.createElement('section');
      block.id = 'modelStoriesSection'; block.className = 'model-stories-section';
      block.setAttribute('aria-labelledby', 'modelStoriesTitle');
      block.innerHTML = '<div class="model-stories-heading"><p class="model-stories-eyebrow">YZA Girls</p><h2 id="modelStoriesTitle"></h2><p class="model-stories-intro"></p></div><div class="model-stories-mount"></div><a class="model-stories-link" href="/yza-girls"></a>';
      before.insertAdjacentElement(position, block);
    }
    const c = words();
    block.querySelector('h2').textContent = context === 'studio' ? c.studio : c.title;
    block.querySelector('.model-stories-intro').textContent = c.intro;
    block.querySelector('.model-stories-link').textContent = c.all + ' ↗';
    render(block.querySelector('.model-stories-mount'), context);
  }

  function renderPage() {
    const page = document.body.dataset.page;
    const main = document.querySelector('main');
    if (!main) return;
    if (page === 'home') {
      // The bag category gets a real worn portrait; packshots remain untouched.
      const bag = main.querySelector('#homeCategories a[href="/collections/sacs"] img');
      const portrait = photos.find(p => p.id === 'yza-065');
      if (bag && portrait) {
        bag.src = portrait.src;
        bag.srcset = portrait.variants.map(v => `${v.src} ${v.width}w`).join(', ');
        bag.sizes = '(max-width: 700px) 50vw, 25vw';
        bag.alt = `${words().bags} · @${portrait.account}`;
      }
      return;
    }
    if (page === 'girls') return;
    if (page === 'collections') {
      const path = window.yzaPreviewPath();
      const cat = new URLSearchParams(location.search).get('cat') || '';
      const context = /pret-a-porter/.test(path) || /^(rtw|tops|pareos|pants)$/.test(cat) ? 'rtw' : /sacs/.test(path) || cat === 'bags' ? 'bags' : 'brand';
      section(context, main.lastElementChild, 'afterend');
    } else if (page === 'product') {
      const context = document.body.classList.contains('clothing-product') ? 'rtw' : 'product';
      const anchor = [...main.children].filter(el => el.id !== 'modelStoriesSection').at(-1);
      section(context, anchor, 'afterend');
      const block = document.getElementById('modelStoriesSection');
      if (block && block !== main.lastElementChild) main.append(block);
    } else if (page === 'studio') {
      section('studio', document.getElementById('studio-collection'));
    } else if (page === 'b2b') {
      section('b2b', main.querySelector('.wholesale-stockists'));
    }
  }
  YZA.modelStories = { render, renderPage };
})();
