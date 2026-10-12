/* Article-only navigation; FAQ and commerce stay with the storefront handlers. */
(function () {
  'use strict';
  var main = document.querySelector('.jr-reader');
  if (!main) return;
  var toc = main.querySelector('.blog-toc'), toggle = main.querySelector('.jr-toc-toggle');
  var links = toc ? Array.from(toc.querySelectorAll('nav a')) : [];
  var entries = links.map(function (a) {
    var url = new URL(a.href, location.href);
    return { link: a, target: document.getElementById(decodeURIComponent(url.hash.slice(1))) };
  }).filter(function (entry) { return entry.target; });
  main.setAttribute('data-reader-ready', '');
  main.setAttribute('data-reader-toc-open', 'false');
  if (toggle) toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    main.setAttribute('data-reader-toc-open', String(open));
  });
  function offset() {
    var announcement = document.querySelector('.announcement');
    var header = document.getElementById('header');
    return (announcement ? announcement.getBoundingClientRect().height : 0) +
      (header ? header.getBoundingClientRect().height : 0) + 24;
  }
  function goTo(target, smooth) {
    window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset()),
      behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
  }
  function fitTitle() {
    main.style.setProperty('--jr-offset', offset() + 'px');
    var heading = main.querySelector('h1');
    if (!heading) return;
    heading.style.fontSize = '';
    var size = parseFloat(getComputedStyle(heading).fontSize);
    var minimum = window.innerWidth <= 480 ? 24 : window.innerWidth <= 800 ? 28 : 32;
    while (size > minimum && heading.scrollHeight > parseFloat(getComputedStyle(heading).lineHeight) * 2 + 2) {
      size -= 1; heading.style.fontSize = size + 'px';
    }
  }
  entries.forEach(function (entry) {
    entry.link.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      var url = new URL(location.href); url.hash = entry.target.id;
      if (location.hash !== url.hash) history.pushState(null, '', url.pathname + url.search + url.hash);
      goTo(entry.target, true);
      if (window.matchMedia('(max-width: 800px)').matches && toggle) {
        toggle.setAttribute('aria-expanded', 'false'); main.setAttribute('data-reader-toc-open', 'false');
        // Close the mobile menu before measuring the final anchor position.
        goTo(entry.target, true);
      }
      entry.target.setAttribute('tabindex', '-1');
      entry.target.focus({ preventScroll: true });
    });
  });
  var pending = false;
  function update() {
    pending = false;
    var active = entries[0], top = offset() + 48;
    entries.forEach(function (entry) { if (entry.target.getBoundingClientRect().top <= top) active = entry; });
    entries.forEach(function (entry) {
      if (entry === active) entry.link.setAttribute('aria-current', 'location');
      else entry.link.removeAttribute('aria-current');
    });
    // Hidden translations stay in the DOM; use only the visible title for its tooltip.
    main.querySelectorAll('h1,h2,h3').forEach(function (heading) {
      var title = heading.innerText.replace(/\s+/g, ' ').trim();
      if (title && heading.title !== title) heading.title = title;
    });
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { fitTitle(); schedule(); });
  document.addEventListener('yza:langchange', function () { fitTitle(); schedule(); });
  window.addEventListener('hashchange', function () {
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && main.contains(target)) goTo(target, false);
    schedule();
  });
  window.addEventListener('load', function () {
    fitTitle();
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && main.contains(target)) goTo(target, false);
    schedule();
  });
  fitTitle(); update();
})();
