/* Studio presentation: native site navigation, language switching and visible films. */
(function () {
  'use strict';
  const copy = {
    fr: ['Livraison offerte dès 500 DH · Retrait au studio, Guéliz', 'Le Studio', 'Pause', 'Lire le film'],
    en: ['Free shipping from 500 DH · Studio pickup, Guéliz', 'The Studio', 'Pause', 'Play film'],
    es: ['Envío gratis desde 500 DH · Recogida en el estudio, Guéliz', 'El estudio', 'Pausa', 'Reproducir'],
    tr: ['500 DH üzeri ücretsiz teslimat · Guéliz stüdyosundan teslim', 'Stüdyo', 'Duraklat', 'Filmi oynat'],
    ar: ['توصيل مجاني ابتداءً من 500 درهم · الاستلام من استوديو كليز', 'الاستوديو', 'إيقاف مؤقت', 'تشغيل الفيلم'],
  };
  const words = () => copy[window.YZA?.i18n?.lang] || copy.fr;
  function updateHeader() {
    if (document.body.classList.contains('site-maison')) return;
    const header = document.querySelector('.header__inner');
    if (!header) return;
    const nav = header.querySelector('.nav');
    const actions = header.querySelector('.header__actions');
    for (const path of ['studio', 'grossistes']) {
      const link = nav?.querySelector(`a[href="${path}"],a[href="/${path}"]`);
      if (!link || !actions) continue;
      const wrapper = link.closest('.nav-item');
      link.classList.add('studio-nav-link');
      actions.insertBefore(link, actions.querySelector('#searchOpen'));
      if (wrapper && !wrapper.children.length) wrapper.remove();
    }
    const studio = header.querySelector('.studio-nav-link[href="studio"],.studio-nav-link[href="/studio"]');
    if (studio) { studio.textContent = words()[1]; studio.setAttribute('aria-current', 'page'); }
    const burger = header.querySelector('#burger');
    if (burger && !header.querySelector('.studio-menu-slot')) {
      const slot = document.createElement('div');
      slot.className = 'studio-menu-slot';
      slot.append(burger); header.prepend(slot);
    }
    const announcement = document.querySelector('.announcement__line');
    if (announcement) { announcement.removeAttribute('data-i18n'); announcement.textContent = words()[0]; }
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) skipLink.setAttribute('href', '/studio#main');
    document.querySelectorAll('[data-studio-film-toggle]').forEach((button) => {
      const video = button.parentElement.querySelector('video');
      button.textContent = video.paused ? words()[3] : words()[2];
      button.setAttribute('aria-label', button.textContent);
    });
  }
  function film(video, motion) {
    const button = video.parentElement.querySelector('[data-studio-film-toggle]');
    let visible = false, userPaused = false, userPlayed = false;
    function label() {
      button.textContent = video.paused ? words()[3] : words()[2];
      button.setAttribute('aria-label', button.textContent);
    }
    function sync() {
      if (!visible || document.hidden || userPaused || (motion.matches && !userPlayed)) { video.pause(); return; }
      if (!video.getAttribute('src')) video.src = video.dataset.studioVideoSrc;
      video.muted = true;
      video.play().catch(label);
    }
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }, { threshold: .1 }).observe(video);
    button.addEventListener('click', () => {
      if (video.paused) { userPlayed = true; userPaused = false; visible = true; sync(); }
      else { userPaused = true; video.pause(); }
    });
    video.addEventListener('play', label);
    video.addEventListener('pause', label);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', () => { userPlayed = false; sync(); });
    label();
  }
  function init() {
    if (!document.body.classList.contains('studio-maison')) return;
    updateHeader();
    window.YZA?.i18n?.onChange(updateHeader);
    document.addEventListener('yza:currencychange', updateHeader);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.querySelectorAll('[data-studio-video-src]').forEach((video) => film(video, motion));
  }
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
