/* Homepage presentation and editorial interactions; shared commerce stays in main.js. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const copy = {
    fr: ['Livraison suivie depuis Marrakech · frais calculés au paiement', 'Pause', 'Lire le film', 'Vue'],
    en: ['Tracked delivery from Marrakech · shipping calculated at checkout', 'Pause', 'Play film', 'View'],
    es: ['Envío con seguimiento desde Marrakech · gastos calculados al pagar', 'Pausa', 'Reproducir', 'Vista'],
    tr: ['Marrakech\'ten takipli teslimat · kargo ücreti ödemede hesaplanır', 'Duraklat', 'Filmi oynat', 'Görünüm'],
    ar: ['توصيل متتبَّع من مراكش · تُحتسب الرسوم عند الدفع', 'إيقاف مؤقت', 'تشغيل الفيلم', 'مشهد'],
  };
  const words = () => copy[YZA.i18n?.lang] || copy.fr;
  YZA.renderHomeMaison = function () {
    const header = document.querySelector('.header__inner');
    if (!header || !document.body.classList.contains('home-maison')) return;
    const nav = header.querySelector('.nav');
    const actions = header.querySelector('.header__actions');
    for (const path of ['studio', 'grossistes']) {
      const link = nav?.querySelector(`a[href="${path}"],a[href="/${path}"]`);
      if (!link || !actions) continue;
      const wrapper = link.closest('.nav-item');
      link.classList.add('home-studio-link');
      actions.insertBefore(link, document.querySelector('#searchOpen'));
      if (wrapper && !wrapper.children.length) wrapper.remove();
    }
    const burger = document.querySelector('#burger');
    if (burger && !header.querySelector('.home-menu-slot')) {
      const slot = document.createElement('div');
      slot.className = 'home-menu-slot';
      slot.append(burger); header.prepend(slot);
    }
    const announcement = document.querySelector('.announcement__line');
    if (announcement) {
      announcement.removeAttribute('data-i18n');
      announcement.textContent = words()[0];
    }
    const bestTitle = document.querySelector('[data-home-heading="best"]');
    if (bestTitle) bestTitle.textContent = ({ fr: 'Coups de cœur', en: 'Our favourites', es: 'Nuestros favoritos', tr: 'Favorilerimiz', ar: 'قطعنا المفضّلة' })[YZA.i18n?.lang] || 'Coups de cœur';
    const headingCopy = {
      craft: { fr: 'Les détails qui font la différence.', en: 'The details that make the difference.', es: 'Los detalles que marcan la diferencia.', tr: 'Fark yaratan detaylar.', ar: 'التفاصيل التي تصنع الفرق.' },
      atelier: { fr: 'Plus de mains, moins de machines.', en: 'Made by women, in Guéliz', es: 'Hecho por mujeres, en Guéliz', tr: 'Guéliz’de kadınlar tarafından yapıldı', ar: 'صُنع بأيدي نساء في كليز' },
    };
    for (const [key, values] of Object.entries(headingCopy)) {
      const heading = document.querySelector(`[data-home-heading="${key}"]`);
      if (heading) heading.textContent = values[YZA.i18n?.lang] || values.fr;
    }
    const studio = header.querySelector('.home-studio-link[href="/studio"],.home-studio-link[href="studio"]');
    if (studio) studio.textContent = ({ fr: 'YZA Studio', en: 'The Studio', es: 'El estudio', tr: 'Stüdyo', ar: 'الاستوديو' })[YZA.i18n?.lang] || 'Le Studio';
    document.querySelectorAll('[data-home-slide]').forEach((button) => {
      button.setAttribute('aria-label', `${words()[3]} ${Number(button.dataset.homeSlide) + 1}`);
    });
    document.querySelectorAll('[data-home-video-toggle]').forEach((button) => {
      const video = button.parentElement.querySelector('video');
      button.textContent = video?.paused ? words()[2] : words()[1];
      button.setAttribute('aria-label', button.textContent);
    });
  };

  function carousel(tile) {
    const slides = [...tile.querySelectorAll('.fm-slide')];
    const buttons = [...tile.querySelectorAll('[data-home-slide]')];
    let index = 0, hovered = false, focused = false, visible = false, start = null, dragged = false;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        buttons[i].setAttribute('aria-pressed', String(active));
        const video = slide.querySelector('video');
        if (!video) return;
        video.autoplay = true; video.muted = true; video.defaultMuted = true; video.playsInline = true;
        if (active && visible && !document.hidden) {
          if (!video.src) video.src = video.dataset.src;
          video.play().catch(() => {});
        } else video.pause();
      });
    }
    buttons.forEach((button, i) => button.addEventListener('click', () => show(i)));
    tile.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      show(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : index + (event.key === 'ArrowRight' ? 1 : -1));
    });
    tile.addEventListener('pointerenter', () => { hovered = true; });
    tile.addEventListener('pointerleave', () => { hovered = false; });
    tile.addEventListener('focusin', () => { focused = true; });
    tile.addEventListener('focusout', (event) => { focused = tile.contains(event.relatedTarget); });
    tile.addEventListener('dragstart', (event) => event.preventDefault());
    tile.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('button,a')) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      dragged = false;
    });
    tile.addEventListener('pointermove', (event) => {
      if (!start) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        dragged = true; tile.setPointerCapture(event.pointerId);
      }
    });
    tile.addEventListener('pointerup', (event) => {
      if (!start) return;
      const dx = event.clientX - start.x;
      if (dragged && Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      if (tile.hasPointerCapture(event.pointerId)) tile.releasePointerCapture(event.pointerId);
      start = null;
    });
    tile.addEventListener('pointercancel', () => { start = null; dragged = false; });
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; show(index); }, { threshold: .1 }).observe(tile);
    // Dots, keyboard and swipe own slide changes; no automatic content rotation.
    document.addEventListener('visibilitychange', () => show(index));
    motion.addEventListener('change', () => show(index));
    show(0);
  }

  function film(video) {
    const hero = video.classList.contains('brand-hero__video');
    const src = video.dataset.src || video.dataset.srcHd;
    video.preload = hero ? 'auto' : 'none';
    video.muted = true; video.defaultMuted = true; video.loop = true; video.playsInline = true;
    video.removeAttribute('data-src');
    video.autoplay = true;
    if (hero) video.src = src;
    const button = (hero ? video.closest('.home-hero') : video.parentElement).querySelector('[data-home-video-toggle]');
    let visible = false, userPaused = false, userPlayed = false;
    const update = () => {
      if (!button) return;
      button.textContent = video.paused ? words()[2] : words()[1];
      button.setAttribute('aria-label', button.textContent);
      button.setAttribute('aria-pressed', String(!video.paused));
    };
    function sync() {
      if (!visible || document.hidden || userPaused) video.pause();
      else {
        if (!video.getAttribute('src')) video.src = src;
        video.muted = true;
        video.play().catch(update);
      }
      update();
    }
    button?.addEventListener('click', () => {
      userPaused = !video.paused; userPlayed = !userPaused; sync();
    });
    video.addEventListener('play', update); video.addEventListener('pause', update);
    document.addEventListener('visibilitychange', sync); motion.addEventListener('change', sync);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .1 }).observe(video);
    update();
  }

  // The hero fills the first screen below the sticky header and announcement bar, whose
  // height changes with breakpoint and bar content, so measure the space above the hero.
  function heroFit(hero) {
    const set = () => {
      const offset = Math.max(0, Math.round(hero.getBoundingClientRect().top + window.scrollY));
      document.documentElement.style.setProperty('--home-hero-offset', offset + 'px');
    };
    set();
    window.addEventListener('resize', set, { passive: true });
    const header = document.querySelector('header');
    if (header && 'ResizeObserver' in window) new ResizeObserver(set).observe(header);
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('home-maison')) return;
    const hero = document.querySelector('.home-hero');
    if (hero) heroFit(hero);
    document.querySelectorAll('[data-home-rotator]').forEach(carousel);
    document.querySelectorAll('[data-home-video], .brand-hero__video').forEach(film);
    YZA.renderHomeMaison();
  });
})();
