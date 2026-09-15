/* YZA motion: native scrolling, visible-first entrances, interruptible feedback.
   Timings come only from css/motion-tokens.css. No content or commerce state is changed. */
(() => {
  'use strict';
  document.documentElement.classList.add('motion-boot');
  document.documentElement.dataset.motionChromePending = '';
  let chromeTimer, chromeReady = document.readyState !== 'loading', chromeSettling = false;
  const finishChrome = () => { clearTimeout(chromeTimer); chromeObserver.disconnect(); delete document.documentElement.dataset.motionChromePending; };
  const settleChrome = () => {
    if (!chromeReady || chromeSettling || !document.documentElement.classList.contains('yza-chrome-in')) return;
    chromeSettling = true;
    Promise.resolve(document.fonts?.ready).then(() => requestAnimationFrame(() => requestAnimationFrame(finishChrome)));
  };
  const chromeObserver = new MutationObserver(settleChrome);
  chromeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  chromeTimer = setTimeout(finishChrome,1500); // Keep the static header usable if chrome/fonts cannot load.
  document.addEventListener('DOMContentLoaded',()=>{chromeReady=true;settleChrome();},{once:true});
  settleChrome();
  const YZA = window.YZA = window.YZA || {};
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new WeakSet();
  const running = new Map();
  const imageRequests = new WeakMap();
  let observer, mutation, scanFrame = 0, tokens, initialized = false;
  const selectors = '[data-reveal], main h1, main h2, .product-card, .model-story, .journal-card, .archive-card, .review-card, .home-category-card';
  function readTokens() { tokens = getComputedStyle(document.documentElement); }
  function duration(name) {
    if (preference.matches) return 0;
    if (!tokens) readTokens();
    return parseFloat(tokens.getPropertyValue('--motion-' + name)) || 0;
  }
  function easing(name = 'out-quint') {
    if (!tokens) readTokens();
    return tokens.getPropertyValue('--ease-' + name).trim() || 'ease-out';
  }
  function stop(el) { running.get(el)?.cancel(); running.delete(el); }
  function enter(el, options = {}) {
    stop(el);
    if (!tokens) readTokens();
    if (preference.matches || !el.animate || !el.isConnected || document.hidden) return;
    const css = getComputedStyle(el);
    if (css.display === 'none' || css.visibility === 'hidden' || css.position === 'fixed' || css.position === 'sticky') return;
    const base = css.transform === 'none' ? '' : css.transform;
    const distance = options.fadeOnly ? 0 : (parseFloat(tokens.getPropertyValue('--motion-distance')) || 0);
    const animation = el.animate([
      { opacity: 0, transform: `translateY(${distance}px) ${base}`.trim() },
      { opacity: css.opacity, transform: base || 'none' }
    ], { duration: duration(options.fast ? 'modal-enter' : 'enter'), delay: options.delay || 0, easing: easing(), fill: 'backwards' });
    running.set(el, animation);
    const clear = () => { if (running.get(el) === animation) running.delete(el); };
    animation.finished.then(clear, clear);
  }
  function reveal(entries) {
    let order = 0;
    // Batch geometry reads before any animation writes.
    const ready = entries.filter(e => e.isIntersecting && e.target.isConnected)
      .map(e => ({ el: e.target, rect: e.boundingClientRect }));
    ready.forEach(({el, rect}) => {
      observer?.unobserve(el); seen.add(el); el.classList.add('is-visible');
      el.dataset.motionState = 'visible';
      if (rect.bottom <= 0 || rect.top >= innerHeight + 48 || el.contains(document.activeElement)) return;
      // The first screen and its LCP content are immediately readable.
      if (scrollY < 10 && rect.top < innerHeight) return;
      enter(el, { delay: Math.min(order++ * duration('stagger'), duration('stagger-max')) });
    });
  }
  function scan(root = document) {
    if (!initialized || !root.querySelectorAll) return;
    const candidates = [...root.querySelectorAll(selectors)];
    if (root.matches?.(selectors)) candidates.unshift(root);
    candidates.forEach(el => {
      if (seen.has(el) || el.dataset.motionState === 'observed') return;
      if (el.closest('[hidden], [aria-hidden="true"], .drawer, .cart-drawer, .lead-chat, .gallery-zoom')) return;
      // A reveal wrapper owns its descendants; never animate both levels.
      if (el.parentElement?.closest('[data-reveal]')) { seen.add(el); el.classList.add('is-visible'); return; }
      if (preference.matches || !observer) { seen.add(el); el.classList.add('is-visible'); return; }
      el.dataset.motionState = 'observed'; observer.observe(el);
    });
  }
  function queueScan() {
    if (!scanFrame) scanFrame = requestAnimationFrame(() => { scanFrame = 0; scan(); });
  }
  function scrollBy(el, delta) {
    if (!el) return;
    // Native scroll animation can be interrupted by touch, wheel and keyboard.
    el.scrollBy({ left: delta, behavior: preference.matches ? 'instant' : 'smooth' });
  }
  function swapImage(img, src, apply) {
    const ticket = {};
    imageRequests.set(img, ticket);
    const next = new Image();
    next.src = src;
    const commit = () => {
      if (imageRequests.get(img) !== ticket || !img.isConnected) return;
      imageRequests.delete(img);
      if (apply) apply(); else img.src = src;
      enter(img, { fast:true, fadeOnly:true });
    };
    // Keep the current, correctly sized image visible until its replacement is ready.
    if (next.decode) next.decode().then(commit, commit);
    else if (next.complete) commit();
    else { next.onload = commit; next.onerror = commit; }
  }
  function afterExit(el, callback, name = 'modal-exit') {
    const delay = duration(name);
    if (!delay) { callback(); return () => {}; }
    let timer;
    const finish = event => {
      if (event && (event.target !== el || !['opacity','transform'].includes(event.propertyName))) return;
      clearTimeout(timer); el.removeEventListener('transitionend', finish); callback();
    };
    el.addEventListener('transitionend', finish);
    timer = setTimeout(() => finish(), delay + 50);
    return () => { clearTimeout(timer); el.removeEventListener('transitionend', finish); };
  }
  function cancelAll() { running.forEach(a => a.cancel()); running.clear(); }
  function init() {
    readTokens();
    if ('IntersectionObserver' in window) observer = new IntersectionObserver(reveal, { threshold: 0, rootMargin: '0px 0px 48px 0px' });
    initialized = true;
    const pendingStrip = document.querySelector('[data-cy-strip][hidden]');
    if (pendingStrip) {
      let bootTimer;
      const finishBoot = () => { clearTimeout(bootTimer); bootObserver.disconnect(); document.documentElement.classList.remove('motion-boot'); };
      const bootObserver = new MutationObserver(() => { if (!pendingStrip.hidden) finishBoot(); });
      bootObserver.observe(pendingStrip, {attributes:true,attributeFilter:['hidden']});
      bootTimer = setTimeout(finishBoot, 1500); // Fail open if catalog loading fails.
    } else document.documentElement.classList.remove('motion-boot');
    scan();
    mutation = new MutationObserver(records => {
      if (records.some(r => [...r.addedNodes].some(n => n.nodeType === 1))) queueScan();
    });
    mutation.observe(document.body, { childList: true, subtree: true });
    const release = event => { for (const el of running.keys()) if (el.contains(event.target)) stop(el); };
    document.addEventListener('pointerdown', release, { passive: true, capture: true });
    document.addEventListener('focusin', release, { capture: true });
    // Native details and existing accordions keep their layout semantics. Only
    // the revealed content fades; height/grid tracks are never interpolated.
    document.addEventListener('toggle', event => {
      if (event.target.matches?.('details[open]')) {
        [...event.target.children].filter(el => el.tagName !== 'SUMMARY').forEach(el => enter(el, {fast:true,fadeOnly:true}));
      }
    }, true);
    document.addEventListener('click', event => {
      const button = event.target.closest('.acc__btn,.cart-acc__btn,.footer__col-toggle');
      if (!button) return;
      requestAnimationFrame(() => {
        if (button.getAttribute('aria-expanded') !== 'true') return;
        const panel = document.getElementById(button.getAttribute('aria-controls')) || button.nextElementSibling;
        if (panel) enter(panel, {fast:true,fadeOnly:true});
      });
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAll(); });
    preference.addEventListener('change', () => {
      cancelAll(); readTokens();
      if (preference.matches) {
        observer?.disconnect();
        document.querySelectorAll('[data-motion-state="observed"]').forEach(el => { el.classList.add('is-visible'); el.dataset.motionState='visible'; seen.add(el); });
      }
      scan();
    });
    addEventListener('pagehide', () => { cancelAll(); observer?.disconnect(); mutation?.disconnect(); cancelAnimationFrame(scanFrame); scanFrame = 0; });
    addEventListener('pageshow', event => { if (event.persisted) {
      mutation?.observe(document.body,{childList:true,subtree:true});
      document.querySelectorAll('[data-motion-state="observed"]').forEach(el => { delete el.dataset.motionState; });
      scan();
    } });
  }
  YZA.motion = { preference, duration, easing, enter, scan, scrollBy, afterExit, stop, swapImage };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
