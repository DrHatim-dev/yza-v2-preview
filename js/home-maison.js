/* Homepage presentation and editorial interactions; shared commerce stays in main.js. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const copy = {
    fr: ['Livraison offerte dès 500 DH · Retrait au studio, Guéliz', 'Pause', 'Lire le film', 'Vue'],
    en: ['Free shipping from 500 DH · Studio pickup, Guéliz', 'Pause', 'Play film', 'View'],
    es: ['Envío gratis desde 500 DH · Recogida en el estudio, Guéliz', 'Pausa', 'Reproducir', 'Vista'],
    tr: ['500 DH üzeri ücretsiz teslimat · Guéliz stüdyosundan teslim', 'Duraklat', 'Filmi oynat', 'Görünüm'],
    ar: ['توصيل مجاني ابتداءً من 500 درهم · الاستلام من استوديو كليز', 'إيقاف مؤقت', 'تشغيل الفيلم', 'مشهد'],
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
      atelier: { fr: 'Fait par des femmes, à Guéliz', en: 'Made by women, in Guéliz', es: 'Hecho por mujeres, en Guéliz', tr: 'Guéliz’de kadınlar tarafından yapıldı', ar: 'صُنع بأيدي نساء في كليز' },
    };
    for (const [key, values] of Object.entries(headingCopy)) {
      const heading = document.querySelector(`[data-home-heading="${key}"]`);
      if (heading) heading.textContent = values[YZA.i18n?.lang] || values.fr;
    }
    const studio = header.querySelector('.home-studio-link[href="/studio"],.home-studio-link[href="studio"]');
    if (studio) studio.textContent = ({ fr: 'Le Studio', en: 'The Studio', es: 'El estudio', tr: 'Stüdyo', ar: 'الاستوديو' })[YZA.i18n?.lang] || 'Le Studio';
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
        if (active && visible && !motion.matches && !document.hidden) {
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
    const src = hero && window.matchMedia('(min-width:861px)').matches ? video.dataset.srcHd : video.dataset.src;
    video.removeAttribute('data-src'); video.removeAttribute('autoplay');
    const button = (hero ? video.closest('.home-hero') : video.parentElement).querySelector('[data-home-video-toggle]');
    let visible = false, userPaused = false, userPlayed = false;
    const update = () => {
      if (!button) return;
      button.textContent = video.paused ? words()[2] : words()[1];
      button.setAttribute('aria-label', button.textContent);
      button.setAttribute('aria-pressed', String(!video.paused));
    };
    function sync() {
      if (!visible || document.hidden || userPaused || (motion.matches && !userPlayed)) video.pause();
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
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('home-maison')) return;
    document.querySelectorAll('[data-home-rotator]').forEach(carousel);
    document.querySelectorAll('[data-home-video], .brand-hero__video').forEach(film);
    YZA.renderHomeMaison();
  });
})();
