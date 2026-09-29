/* Press page: print and trade-fair features have no online source, so their row opens
   the owner's prepared visuals in the site's shared .gallery-zoom overlay. Without JS
   the same row is a plain link to the first image, so nothing is ever unreachable. */
(function () {
  'use strict';
  var viewer = document.getElementById('pressViewer');
  if (!viewer) return;
  var img = viewer.querySelector('.gallery-zoom__img');
  var closeBtn = viewer.querySelector('[data-press-close]');
  var prevBtn = viewer.querySelector('[data-press-prev]');
  var nextBtn = viewer.querySelector('[data-press-next]');
  var count = viewer.querySelector('[data-press-count]');
  var WORDS = {
    close: { fr: 'Fermer', en: 'Close', es: 'Cerrar', tr: 'Kapat', ar: 'إغلاق' },
    prev: { fr: 'Page précédente', en: 'Previous page', es: 'Página anterior', tr: 'Önceki sayfa', ar: 'الصفحة السابقة' },
    next: { fr: 'Page suivante', en: 'Next page', es: 'Página siguiente', tr: 'Sonraki sayfa', ar: 'الصفحة التالية' },
  };
  var pages = [], alts = [], index = 0, opener = null;

  function lang() { return (window.YZA && YZA.i18n && YZA.i18n.lang) || document.documentElement.lang || 'fr'; }
  function pick(words) { return words[lang()] || words.fr; }
  function focusables() { return [closeBtn, prevBtn, nextBtn].filter(function (b) { return b && !b.hidden; }); }

  function show(i) {
    index = (i + pages.length) % pages.length;
    img.src = pages[index];
    img.alt = alts[index] || '';
    var multi = pages.length > 1;
    prevBtn.hidden = nextBtn.hidden = count.hidden = !multi;
    if (multi) {
      count.textContent = (index + 1) + ' / ' + pages.length;
      new Image().src = pages[(index + 1) % pages.length];
    }
  }
  function open(link) {
    pages = String(link.getAttribute('data-press-gallery') || '').split('|').filter(Boolean);
    if (!pages.length) return false;
    alts = String(link.getAttribute('data-press-alts') || '').split('|');
    opener = link;
    closeBtn.setAttribute('aria-label', pick(WORDS.close));
    prevBtn.setAttribute('aria-label', pick(WORDS.prev));
    nextBtn.setAttribute('aria-label', pick(WORDS.next));
    show(0);
    viewer.removeAttribute('aria-hidden');
    viewer.inert = false;
    viewer.classList.add('is-open');
    document.documentElement.classList.add('has-press-viewer');
    closeBtn.focus();
    return true;
  }
  function close() {
    if (!viewer.classList.contains('is-open')) return;
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    viewer.inert = true;
    document.documentElement.classList.remove('has-press-viewer');
    if (opener) opener.focus();
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-press-gallery]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (open(link)) event.preventDefault();
  });
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', function () { show(index - 1); });
  nextBtn.addEventListener('click', function () { show(index + 1); });
  // A click on the dark backdrop (not on the page image or a control) closes, as on product pages.
  viewer.addEventListener('click', function (event) { if (event.target === viewer) close(); });
  document.addEventListener('keydown', function (event) {
    if (!viewer.classList.contains('is-open')) return;
    var rtl = document.documentElement.dir === 'rtl';
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (pages.length > 1 && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault();
      show(index + ((event.key === 'ArrowRight') !== rtl ? 1 : -1));
    } else if (event.key === 'Tab') {
      var items = focusables();
      var at = items.indexOf(document.activeElement);
      event.preventDefault();
      items[(at + (event.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    }
  });
}());
