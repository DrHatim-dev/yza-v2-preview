/* IP-selected product tariffs with canonical MAD settlement.
   EUR product prices are independent catalogue fields; the display control
   cannot select a lower market tariff. See market-lib.php for server authority.

   ── PREVIEW ADAPTATION ──────────────────────────────────────────────────
   This is the live js/currency.js. One thing differs, and only one: GitHub
   Pages serves no PHP, so /market.php and /currency-rates.php cannot be
   called here (they 404, and preview.js turns any .php request into a 400).
   The market is therefore resolved from a static preview source instead of
   the visitor's IP — same payload shape, same validation, same lock. The
   tariff maths, the rounding, the "≈" rule, the settlement note and the
   locked selector are live's, unchanged. */
(function () {
  'use strict';

  window.YZA = window.YZA || {};
  var CODES = ['MAD', 'EUR', 'USD', 'GBP', 'TRY', 'AED'];
  var FALLBACK_RATES = { MAD: 1, EUR: 0.093681, USD: 0.107073, GBP: 0.079863, TRY: 5.03295, AED: 0.393615 };
  var STORAGE_KEY = 'yza.currency';
  var RATE_KEY = 'yza.currency.rates.v1';

  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function validCode(code) { return CODES.indexOf(String(code || '').toUpperCase()) !== -1; }
  function locale() {
    var lang = (YZA.i18n && YZA.i18n.lang) || document.documentElement.lang || 'fr';
    return ({ fr: 'fr-MA', en: 'en-GB', es: 'es-ES', tr: 'tr-TR', ar: 'ar-MA' })[lang] || 'fr-MA';
  }
  function label() {
    var lang = (YZA.i18n && YZA.i18n.lang) || 'fr';
    return ({ fr: 'Devise', en: 'Currency', es: 'Moneda', tr: 'Para birimi', ar: 'العملة' })[lang] || 'Currency';
  }
  function settlementNote() {
    var lang = (YZA.i18n && YZA.i18n.lang) || 'fr';
    return ({
      fr: 'Conversion indicative · paiement en MAD',
      en: 'Indicative conversion · charged in MAD',
      es: 'Conversión orientativa · cobro en MAD',
      tr: 'Tahmini dönüşüm · ödeme MAD olarak',
      ar: 'تحويل تقريبي · الدفع بالدرهم المغربي'
    })[lang] || 'Indicative conversion · charged in MAD';
  }

  var cached = null;
  try { cached = JSON.parse(safeGet(RATE_KEY) || 'null'); } catch (e) {}
  var rates = cached && cached.rates ? Object.assign({}, FALLBACK_RATES, cached.rates) : Object.assign({}, FALLBACK_RATES);
  var current = 'MAD';
  YZA.market = { market: 'MAD', ready: false };

  // Keep CONVERTED storefront prices calm and easy to scan: no decimals, larger values
  // rounded to the nearest ten (102.17 -> 100), smaller ones to the unit (9.99 -> 10).
  //
  // MAD n'est PAS concerne, et c'est essentiel : les dirhams ne sont pas convertis, ils
  // sont le prix reel. Arrondir a la dizaine y affichait un montant DIFFERENT de celui
  // debite — invisible tant que tous les prix catalogue etaient ronds, flagrant des qu'une
  // remise s'applique : un panier de 1790 DH avec -10% vaut 1611 DH et s'affichait
  // « 1 610 DH » pendant que la carte prelevait 1 611. Un centime d'ecart entre l'ecran et
  // le debit, c'est une reclamation et un litige bancaire.
  function roundedDisplayAmount(amount, target) {
    var value = Number(amount) || 0;
    if (target === 'MAD') { return Math.round(value); }
    var step = Math.abs(value) >= 100 ? 10 : 1;
    return Math.round(value / step) * step;
  }
  function format(cents, code) {
    if (!YZA.market.ready) return '—';
    var target = validCode(code) ? String(code).toUpperCase() : current;
    var dirhams = (Number(cents) || 0) / 100;
    var tariffEur = YZA.market.market === 'EUR' && target === 'EUR';
    var amount = tariffEur ? dirhams / 11 : dirhams * (Number(rates[target]) || 1);
    amount = tariffEur ? Math.round(amount * 100) / 100 : roundedDisplayAmount(amount, target);
    var digits = tariffEur && !Number.isInteger(amount) ? 2 : 0;
    var rendered;
    try {
      rendered = new Intl.NumberFormat(locale(), {
        style: 'currency', currency: target, currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: digits, maximumFractionDigits: digits, numberingSystem: 'latn'
      }).format(amount);
    } catch (e) {
      rendered = amount.toFixed(digits) + ' ' + target;
    }
    if (target === 'MAD') rendered = rendered.replace(/MAD|د\.م\.|د\.م/g, 'DH');
    return target === 'MAD' || tariffEur ? rendered : '≈ ' + rendered;
  }
  function syncControls() {
    document.querySelectorAll('[data-currency-select]').forEach(function (select) {
      select.value = current;
      select.setAttribute('aria-label', label());
      var text = select.closest('.currency-select') && select.closest('.currency-select').querySelector('[data-currency-label]');
      if (text) text.textContent = label();
    });
  }
  function set(code) {
    var next = String(code || '').toUpperCase();
    if (YZA.market.locked || !validCode(next) || next === current) return;
    var previous = current;
    current = next;
    safeSet(STORAGE_KEY, current);
    syncControls();
    document.dispatchEvent(new CustomEvent('yza:currencychange', { detail: { from: previous, to: current } }));
    try { YZA.analytics && YZA.analytics.track('currency_switch', { from: previous, to: current }); } catch (e) {}
  }
  function selectorMarkup(context) {
    if (!YZA.market.ready) return '<span role="status">Tarifs indisponibles · <a href="">Réessayer</a></span>';
    if (YZA.market.locked) return '<span class="currency-select"><span>' + (current === 'MAD' ? 'DH' : 'EUR') + '</span>' + (context === 'checkout' && current === 'EUR' ? '<span class="currency-select__note">Paiement en MAD · 1 EUR = 11 DH</span>' : '') + '</span>';
    var opts = CODES.map(function (code) { return '<option value="' + code + '"' + (code === current ? ' selected' : '') + '>' + code + '</option>'; }).join('');
    var place = context || 'header';
    return '<label class="currency-select currency-select--' + place + '">' +
      '<span class="sr-only" data-currency-label>' + label() + '</span>' +
      '<select class="currency-select__control" data-currency-select aria-label="' + label() + '">' + opts + '</select>' +
      ((place === 'checkout') ? '<span class="currency-select__note">' + settlementNote() +
        ' · <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates By Exchange Rate API</a></span>' : '') + '</label>';
  }

  document.addEventListener('change', function (event) {
    if (event.target && event.target.matches('[data-currency-select]')) set(event.target.value);
  });
  document.addEventListener('DOMContentLoaded', syncControls);

  /* PREVIEW ONLY — the market gate.
     Live: fetch('/market.php', {cache:'no-store'}) -> {ok:true, market:'MAD'|'EUR',
     eurRate:11}, chosen from the visitor's IP, then LOCKED so the shopper cannot
     pick a cheaper tariff. Anything else means the market is not ready and every
     price renders "—".
     Preview: the same payload is built from window.YZA_PREVIEW_MARKET (preview.js
     reads ?market=eur / ?market=mad and remembers it for the tab session; default
     MAD, which is what a Moroccan visitor sees on live) and run through the very
     same validation. The override exists only here — live has no such control.
     It is resolved SYNCHRONOUSLY, not in a promise: the preview's main.js has no
     `await YZA.marketReady` and currency.js runs before cart.js / chrome.js /
     main.js, so the tariff is settled before the first render either way.
     YZA.marketReady is still exposed as a promise, for callers that await it. */
  function previewMarketPayload() {
    var forced = window.YZA_PREVIEW_MARKET;
    return { ok: true, market: typeof forced === 'string' ? forced.toUpperCase() : 'MAD', eurRate: 11 };
  }

  function acceptMarket(payload) {
    if (!payload || !payload.ok || !['MAD', 'EUR'].includes(payload.market) || payload.eurRate !== 11) throw new Error('market');
    YZA.market = Object.assign({}, payload, { ready: true, locked: true });
    current = payload.market;
    if (YZA.applyMarketPrices && !YZA.applyMarketPrices()) throw new Error('catalog');
    return true;
  }
  YZA.marketReady = window.YZA_PREVIEW
    ? Promise.resolve((function () {
      try { return acceptMarket(previewMarketPayload()); } catch (e) { YZA.market.ready = false; return false; }
    }()))
    // Live: the visitor's market is decided server-side from the IP, then locked.
    : fetch('/market.php', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(8000) })
      .then(function (response) { if (!response.ok) throw new Error('market'); return response.json(); })
      .then(acceptMarket)
      .catch(function () { YZA.market.ready = false; return false; })
      // Page scripts that painted before the answer (homepage, collections) re-render.
      .then(function (ok) { document.dispatchEvent(new CustomEvent('yza:currencychange', { detail: { marketReady: ok, to: current } })); return ok; });

  if (!window.YZA_PREVIEW) {
    fetch('/currency-rates.php', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (response) { if (!response.ok) throw new Error('rates'); return response.json(); })
      .then(function (payload) {
        if (!payload || payload.ok !== true || payload.base !== 'MAD' || !payload.rates) return;
        CODES.forEach(function (code) { if (Number(payload.rates[code]) > 0) rates[code] = Number(payload.rates[code]); });
        safeSet(RATE_KEY, JSON.stringify({ rates: rates, updatedAt: payload.updatedAt || null }));
        document.dispatchEvent(new CustomEvent('yza:currencychange', { detail: { ratesUpdated: true, to: current } }));
      }).catch(function () { /* Keep the last known/fallback rates. */ });
  }

  /* The live rate feed (/currency-rates.php) is deliberately NOT fetched here: it
     is PHP, it would 404 on Pages, and with the market locked to MAD or EUR the
     shopper can never select a rate-converted currency anyway. FALLBACK_RATES
     still answers a programmatic format(cents, 'USD'), exactly as live's fallback
     does before its feed replies. */

  YZA.currency = {
    codes: CODES.slice(),
    get current() { return current; },
    get rates() { return Object.assign({}, rates); },
    format: format,
    set: set,
    selectorMarkup: selectorMarkup,
    syncControls: syncControls
  };
}());
