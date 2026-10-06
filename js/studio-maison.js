/* Studio presentation: native site navigation, language switching and visible films. */
(function () {
  'use strict';
  const copy = {
    fr: ['Livraison suivie depuis Marrakech · frais calculés au paiement', 'Le Studio', 'Pause', 'Lire le film'],
    en: ['Tracked delivery from Marrakech · shipping calculated at checkout', 'The Studio', 'Pause', 'Play film'],
    es: ['Envío con seguimiento desde Marrakech · gastos calculados al pagar', 'El estudio', 'Pausa', 'Reproducir'],
    tr: ['Marrakech\'ten takipli teslimat · kargo ücreti ödemede hesaplanır', 'Stüdyo', 'Duraklat', 'Filmi oynat'],
    ar: ['توصيل متتبَّع من مراكش · تُحتسب الرسوم عند الدفع', 'الاستوديو', 'إيقاف مؤقت', 'تشغيل الفيلم'],
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
    video.autoplay = true; video.muted = true; video.defaultMuted = true; video.playsInline = true; video.loop = true;
    const button = video.parentElement.querySelector('[data-studio-film-toggle]');
    let visible = false, userPaused = false, userPlayed = false;
    function label() {
      button.textContent = video.paused ? words()[3] : words()[2];
      button.setAttribute('aria-label', button.textContent);
    }
    function sync() {
      if (!visible || document.hidden || userPaused) { video.pause(); return; }
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
