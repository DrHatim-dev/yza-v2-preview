/* Isolated GitHub Pages adapter. This file is not part of the live storefront. */
(() => {
  'use strict';
  const base = '/yza-v2-preview';
  const production = new Set(['yza-shop.com', 'www.yza-shop.com']);
  window.YZA_PREVIEW = true;
  window.yzaPreviewPath = () => location.pathname.replace(/^\/yza-v2-preview(?=\/|$)/, '') || '/';
  const localUrl = value => {
    if (!value || /^(?:#|mailto:|tel:|data:|blob:|javascript:)/i.test(value)) return value;
    let url;
    try { url = new URL(value, document.baseURI); } catch (_) { return value; }
    if (url.origin !== location.origin && !production.has(url.hostname)) return value;
    const path = url.pathname === base || url.pathname.startsWith(base + '/') ? url.pathname : base + url.pathname;
    return path + url.search + url.hash;
  };
  window.yzaPreviewUrl = localUrl;
  const message = 'Aperçu V2 uniquement — aucune commande, inscription ou demande n’est envoyée.';
  const notify = () => {
    let toast = document.getElementById('preview-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'preview-notice'; toast.setAttribute('role', 'status');
      toast.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483647;background:#252525;color:white;padding:16px 22px;max-width:calc(100vw - 32px);width:max-content;font:14px/1.5 Arial,sans-serif;box-shadow:0 4px 25px #0003';
      document.body.append(toast);
    }
    toast.textContent = message; toast.hidden = false;
    clearTimeout(notify.timer); notify.timer = setTimeout(() => { toast.hidden = true; }, 6500);
  };
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, options = {}) => {
    const raw = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    const url = new URL(raw, document.baseURI);
    const method = String(options.method || (input && input.method) || 'GET').toUpperCase();
    if (/\.php(?:$|\/)/i.test(url.pathname) || !['GET', 'HEAD'].includes(method)) {
      if (method !== 'GET' && !/capture|track|event|analytics/i.test(url.pathname)) notify();
      return Promise.resolve(new Response(JSON.stringify({ok:false,accepted:false,preview:true,error:'preview',message}), {status:400,headers:{'Content-Type':'application/json'}}));
    }
    if (typeof input === 'string' || input instanceof URL) return realFetch(localUrl(raw), options);
    return realFetch(input, options);
  };
  navigator.sendBeacon = () => false;
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method].bind(history);
    history[method] = (state, title, url) => original(state, title, url ? localUrl(String(url)) : url);
  }
  const rewrite = node => {
    if (!(node instanceof Element)) return;
    for (const el of [node, ...node.querySelectorAll('[href],[src],[poster]')]) {
      for (const attr of ['href', 'src', 'poster']) {
        const value = el.getAttribute(attr);
        if (!value || (attr === 'href' && el.tagName === 'BASE')) continue;
        const mapped = localUrl(value);
        if (mapped !== value) el.setAttribute(attr, mapped);
      }
    }
  };
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') rewrite(record.target);
      else for (const node of record.addedNodes) rewrite(node);
    }
  }).observe(document.documentElement, {subtree:true,childList:true,attributes:true,attributeFilter:['href','src','poster']});
  document.addEventListener('submit', event => { event.preventDefault(); event.stopImmediatePropagation(); notify(); }, true);
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (anchor) {
      const target = localUrl(anchor.getAttribute('href'));
      if (target !== anchor.getAttribute('href')) anchor.setAttribute('href', target);
    }
  }, true);
  document.addEventListener('DOMContentLoaded', () => {
    rewrite(document.documentElement);
    const badge = document.createElement('button');
    badge.type = 'button'; badge.textContent = 'APERÇU V2'; badge.title = message;
    badge.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483646;border:1px solid #ddd;background:#fffffff2;color:#333;padding:7px 10px;font:10px/1.2 Arial,sans-serif;letter-spacing:1.4px;cursor:pointer';
    badge.addEventListener('click', notify); document.body.append(badge);
  });
})();
