/* YZA currency display layer.
   Catalogue and order totals remain canonical in MAD; this module only changes
   the shopper-facing display and persists the selected currency. */
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
  var current = validCode(safeGet(STORAGE_KEY)) ? safeGet(STORAGE_KEY).toUpperCase() : 'MAD';

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
    var target = validCode(code) ? String(code).toUpperCase() : current;
    var dirhams = (Number(cents) || 0) / 100;
    var amount = dirhams * (Number(rates[target]) || 1);
    amount = roundedDisplayAmount(amount, target);
    var digits = 0;
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
    return target === 'MAD' ? rendered : '≈ ' + rendered;
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
    if (!validCode(next) || next === current) return;
    var previous = current;
    current = next;
    safeSet(STORAGE_KEY, current);
    syncControls();
    document.dispatchEvent(new CustomEvent('yza:currencychange', { detail: { from: previous, to: current } }));
    try { YZA.analytics && YZA.analytics.track('currency_switch', { from: previous, to: current }); } catch (e) {}
  }
  function selectorMarkup(context) {
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

  fetch('/currency-rates.php', { credentials: 'same-origin', cache: 'no-store' })
    .then(function (response) { if (!response.ok) throw new Error('rates'); return response.json(); })
    .then(function (payload) {
      if (!payload || payload.ok !== true || payload.base !== 'MAD' || !payload.rates) return;
      CODES.forEach(function (code) { if (Number(payload.rates[code]) > 0) rates[code] = Number(payload.rates[code]); });
      safeSet(RATE_KEY, JSON.stringify({ rates: rates, updatedAt: payload.updatedAt || null }));
      document.dispatchEvent(new CustomEvent('yza:currencychange', { detail: { ratesUpdated: true, to: current } }));
    }).catch(function () { /* Keep the last known/fallback rates. */ });

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
