/* ============================================================
   YZA — CHECKOUT (static, no account)
   3 steps: Cart → Shipping → Payment & Confirmation.
   Order handoff = WhatsApp prefill + best-effort POST to order.php (email).
   Reuses YZA.cart, YZA.i18n.formatPrice/eurEstimate, YZA.payment config.
   ============================================================ */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(boot);

  function boot() {
    // Deferred scripts run in order before DOMContentLoaded, but poll defensively.
    if (!window.YZA || !YZA.cart || !YZA.i18n || typeof YZA.getProduct !== 'function') {
      return setTimeout(boot, 40);
    }
    var root = document.getElementById('checkoutRoot');
    if (!root) return;
    root.removeAttribute('data-reveal');
    root.style.opacity = '1';

    YZA.cart.load();
    YZA.cart.loadGift();
    YZA.cart.loadCoupon();
    // A reprice response asks for a fresh catalogue first. Adopt its revision only after
    // this page has actually loaded that exact static release; never label an unseen price.
    var desiredRevision = '';
    try {
      desiredRevision = sessionStorage.getItem('yza.catalog.reprice') || '';
      if (desiredRevision && desiredRevision === YZA.catalogRevision) {
        YZA.cart.items.forEach(function (line) { line.releaseId = desiredRevision; });
        YZA.cart.save();
        sessionStorage.removeItem('yza.catalog.reprice');
        desiredRevision = '';
      }
    } catch (catalogLoadError) {}

    var pendingOperation = null;
    try { pendingOperation = JSON.parse(sessionStorage.getItem('yza.order.operation') || 'null'); } catch (operationLoadError) {}
    if (!pendingOperation || !/^[A-Za-z0-9_-]{20,100}$/.test(String(pendingOperation.id || ''))
        || !/^YZA-[A-Z0-9-]{6,30}$/.test(String(pendingOperation.number || ''))) { pendingOperation = null; }

    // Apply the URL/saved language before the first render (avoids a FR flash when the
    // page is opened directly with ?lang=xx, before chrome.js has set the language).
    try { var dl = YZA.i18n.detect ? YZA.i18n.detect() : YZA.i18n.lang; if (dl && dl !== YZA.i18n.lang) YZA.i18n.setLang(dl); } catch (e) {}

    var D = YZA.checkoutDelivery;
    var remembered = D.read();
    var rememberDetails = !!remembered;
    var state = {
      summaryOpen: false,
      emailSent: false,
      submitting: false,
      step: 'cart',          // cart | shipping | payment | done
      method: 'cod',         // cod | card | rib | iban | paypal
      ship: loadShip(),
      wa: '',
      bumpHandle: undefined, // order-bump pick, frozen on first payment-step entry
      bumpOn: false,         // authoritative bump state (not the DOM)
      lastOrder: null,       // the placed order — feeds the done-screen add-on cards
      cardErr: '',           // card (Zazu) inline error message, shown in payDetails
      cardPaid: '',          // '' | checking | yes | unknown — return-from-Zazu state
      cardSession: '',       // exact hosted session currently being reconciled
      cardReturn: null,      // session-bound canonical accepted snapshot
      cardBound: false,      // never clear a cart for an unbound return URL
      catalogErr: desiredRevision ? 'Le nouveau catalogue n\u2019a pas encore pu \u00eatre charg\u00e9. Le paiement reste bloqu\u00e9 pour ne pas confirmer un prix que vous n\u2019avez pas vu.' : '',
      repriceRevision: desiredRevision, // adopt only after this exact release is loaded
      operationId: pendingOperation ? pendingOperation.id : '',
      orderNo: pendingOperation ? pendingOperation.number : '',
    };

    // Keep the displayed country and the first shipping quote in sync.
    // Preserve an existing destination; new checkouts start in the Morocco market.
    if (!state.ship.country) state.ship.country = 'MA';

    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    var T = function (k) { return YZA.i18n.t(k); };
    var M = YZA.checkoutMaison;
    var C = function (k, values) { return M.text(k, values); };
    var fmt = function (c) { return YZA.i18n.formatPrice(c); };
    var fmtMad = function (c) {
      if (YZA.currency && typeof YZA.currency.format === 'function') return YZA.currency.format(c, 'MAD');
      var lang = YZA.i18n.lang || 'fr';
      var amount = Math.round((Number(c) || 0) / 100);
      var rendered = new Intl.NumberFormat(({ fr: 'fr-MA', en: 'en-GB', es: 'es-ES', tr: 'tr-TR', ar: 'ar-MA' })[lang] || 'fr-MA', { maximumFractionDigits: 0, numberingSystem: 'latn' }).format(amount);
      return rendered + ' ' + (lang === 'ar' ? 'درهم' : 'DH');
    };
    var eur = function (c) { return YZA.i18n.eurEstimate(c); };
    var PAY = function () { return YZA.payment || {}; };
    var waDigits = function () { return String((YZA.brand && YZA.brand.whatsapp) || '').replace(/\D/g, ''); };

    // ---- data helpers ----
    function lines() {
      return YZA.cart.items.map(function (i) {
        var p = YZA.getProduct(i.handle);
        if (!p) return null;
        var lineView = (YZA.cartLineView && YZA.cartLineView(i)) || null;
        var img = (lineView && lineView.img) || p.img;
        var st = (YZA.inventoryStatus && YZA.inventoryStatus(p)) || {};
        var shownVariant = (lineView && lineView.variant) || (YZA.cartDisplayVariant && YZA.cartDisplayVariant(i)) || i.variant || '';
        return { handle: p.handle, baseHandle: p.handle, name: YZA.i18n.pick(p.name || p.displayName), variant: shownVariant, rawVariant: i.variant || '', sizeCode: i.sizeCode || '', colorSlug: i.colorSlug || '', finishKey: i.finishKey || '', releaseId: i.releaseId || YZA.catalogRevision || '', qty: i.qty, price: p.price, line: p.price * i.qty, img: img, imageAlt: YZA.i18n.pick((lineView && lineView.imageAlt) || p.imageAlt || p.name), url: (lineView && lineView.url) || ('/produits/' + encodeURIComponent(p.handle)), src: i.src || '', almostGone: !!st.almostGone, inventory: st.inventory };
      }).filter(Boolean);
    }
    function subtotal() { return YZA.cart.subtotalCents(); }
    // Single money source for every customer-facing amount — see YZA.cart.orderTotals().
    // It adds the destination delivery fee on top of merchandise; YZA.cart.pricing() alone
    // is merchandise-only and must never be used to quote a total.
    function isPickup() { return state.ship.deliveryMode === 'pickup'; }
    function totals() { return D.totals(YZA.cart, destRegion(), isPickup()); }

    // Grouped country options for the selector: Morocco first, then the two priced regions.
    function countryOptions() {
      var c = (YZA.geo && YZA.geo.countries) || {};
      return [['MA', 'Maroc']].concat(c.europe || [], c.usa_gcc || []);
    }
    // Accepts an ISO-2 code, or a country NAME left over from the old free-text field
    // (sessionStorage can still hold "Maroc"/"France" from a session started pre-fix).
    function normCountry(v) {
      var s = String(v || '').trim();
      if (!s) return '';
      if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
      var hit = countryOptions().filter(function (o) { return o[1].toLowerCase() === s.toLowerCase(); })[0];
      if (hit) return hit[0];
      return /^(maroc|morocco|marruecos|fas|المغرب)$/i.test(s) ? 'MA' : 'XX';
    }
    // Readable country for the order email / WhatsApp — the form now stores an ISO-2 code.
    function countryName(v) {
      var cc = normCountry(v);
      if (!cc) return String(v || '');
      if (cc === 'XX') return T('co.ship.countryOther');
      var hit = countryOptions().filter(function (o) { return o[0] === cc; })[0];
      return hit ? hit[1] : cc;
    }
    // DESTINATION region from the checkout country — never the visitor's timezone. A
    // shopper browsing from Paris who ships to Temara pays the Morocco tariff, not the EU one.
    function destRegion() {
      if (isPickup()) return 'morocco';
      var cc = normCountry(state.ship.country);
      if (cc) return YZA.geo.regionOf(cc);
      return 'morocco';
    }
    var isIntl = function () { return state.method === 'iban' || state.method === 'paypal'; };

    // ---- persistence ----
    function loadShip() { try { return JSON.parse(sessionStorage.getItem('yza.checkout.ship')) || remembered || {}; } catch (e) { return {}; } }
    function saveShip() { try { sessionStorage.setItem('yza.checkout.ship', JSON.stringify(state.ship)); } catch (e) {} D.remember(state.ship, rememberDetails); }

    // ---- render ----
    function stepsBar() {
      var steps = [['cart', T('co.step.cart')], ['shipping', T('co.step.ship')], ['payment', T('co.step.pay')]];
      var order = ['cart', 'shipping', 'payment', 'done'];
      var cur = order.indexOf(state.step === 'done' ? 'payment' : state.step);
      return '<ol class="checkout__steps">' + steps.map(function (s, i) {
        var idx = order.indexOf(s[0]);
        var cls = idx < cur ? ' is-done' : (idx === cur ? ' is-active' : '');
        var clickable = idx < cur && state.step !== 'done';
        return '<li class="checkout__step' + cls + '"' + (idx === cur ? ' aria-current="step"' : '') + '>' + (clickable ? '<button type="button" data-goto="' + s[0] + '">' : '<span class="checkout__step-label">') + '<span class="checkout__step-n">' + (i + 1) + '</span><span class="checkout__step-t">' + esc(s[1]) + '</span>' + (clickable ? '</button>' : '</span>') + '</li>';
      }).join('') + '</ol>';
    }

    /* CHAMP CODE PROMO. Place dans le recapitulatif, present a chaque etape : une cliente
       qui recoit un code veut le saisir tout de suite, pas au dernier ecran.
       Le verdict vient du SERVEUR (coupon.php) — le navigateur ne decide de rien. On garde
       neanmoins l'etat dans YZA.cart pour que tous les montants affiches suivent. */
    var couponDraft = '';
    var couponBusy = false;
    var couponMsg = '';       // message a afficher sous le champ
    var couponOk = false;

    function couponBox() {
      var applied = YZA.cart.coupon && YZA.cart.couponDef();
      if (applied) {
        return '<div class="co-coupon co-coupon--on">' +
          '<span class="co-coupon__tag">' + esc(YZA.cart.coupon.code) + '</span>' +
          '<span class="co-coupon__ok">' + esc(T('co.coupon.applied')) + '</span>' +
          '<button type="button" class="co-coupon__remove" data-coupon-remove>' + esc(T('co.coupon.remove')) + '</button>' +
        '</div>';
      }
      return '<div class="co-coupon">' +
        '<label class="co-coupon__label" for="co-coupon">' + esc(T('co.coupon.label')) + '</label>' +
        '<div class="co-coupon__row">' +
          '<input id="co-coupon" type="text" autocomplete="off" spellcheck="false" maxlength="24" placeholder="' + esc(T('co.coupon.ph')) + '" value="' + esc(couponDraft) + '">' +
          '<button type="button" class="co-coupon__btn" data-coupon-apply' + (couponBusy ? ' disabled' : '') + '>' + esc(T(couponBusy ? 'co.coupon.checking' : 'co.coupon.apply')) + '</button>' +
        '</div>' +
        (couponMsg && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.ship.email || '') ? '<div class="co-coupon__email"><label for="coCouponEmail">' + esc(T('co.ship.email')) + '</label><input type="email" id="coCouponEmail" autocomplete="email" value="' + esc(state.ship.email || '') + '"></div>' : '') +
        (couponMsg ? '<p role="status" class="co-coupon__msg' + (couponOk ? ' is-ok' : ' is-err') + '">' + esc(couponMsg) + '</p>' : '') +
      '</div>';
    }

    function summary() {
      var items = lines();
      var itemRows = items.map(function (it) {
        return '<li class="co-sum__item"><span class="co-sum__thumb"><b class="co-sum__badge">' + it.qty + '</b><img src="' + esc(it.img) + '" alt="' + esc(it.imageAlt) + '" width="48" height="60" loading="lazy"></span>' +
          '<span class="co-sum__meta"><span class="co-sum__name">' + esc(it.name) + '</span>' + (it.variant ? '<span class="co-sum__var">' + esc(it.variant) + '</span>' : '') + '</span>' +
          '<span class="co-sum__price">' + fmt(it.line) + '</span></li>';
      }).join('');
      var tt = totals();
      // The legacy EUR estimate is useful only while prices are displayed in MAD.
      // When the shopper explicitly selects EUR, showing a second estimate would
      // duplicate the total and could differ slightly from the live display rate.
      var eurLine = isIntl() && (!YZA.currency || YZA.currency.current === 'MAD')
        ? '<span class="co-sum__eur">' + eur(tt.grandTotalCents) + '</span>'
        : '';
      var discountRows = tt.discounts.map(function (d) {
        var lbl = YZA.cart.discountLabel(d);
        return '<div class="co-sum__row co-sum__row--discount"><span>' + esc(lbl) + '</span><span>−' + fmt(d.amountCents) + '</span></div>';
      }).join('');
      // Quote-only destinations are billed after the order; everywhere else shows the
      // real number — "Offerte" only when the threshold is genuinely cleared.
      var shipCell = tt.shippingQuoteOnly ? esc(T('co.shipCalc'))
        : (tt.shippingFree ? esc(T('co.shipFree')) : fmt(tt.shippingCents));
      var zone = isPickup() ? D.text(5) : destRegion() === 'morocco' ? C('morocco') : ((countryName(state.ship.country) || '') + ' · ' + (tt.shippingQuoteOnly ? T('co.shipCalc') : C('tracked')));
      var currency = YZA.currency?.selectorMarkup ? YZA.currency.selectorMarkup('checkout') : '';
      return '<aside class="co-sum' + (state.summaryOpen ? ' is-expanded' : '') + '" aria-label="' + esc(T('co.summary')) + '">' +
        '<button type="button" class="co-sum__toggle" id="coSummaryToggle" data-summary-toggle aria-expanded="' + state.summaryOpen + '" aria-controls="coSummaryPanel"><span>' + esc(C(state.summaryOpen ? 'hide' : 'show')) + '</span><strong>' + fmt(tt.grandTotalCents) + '</strong><span aria-hidden="true">' + (state.summaryOpen ? '−' : '+') + '</span></button>' +
        '<div id="coSummaryPanel"><div class="co-sum__head"><h2 class="co-sum__title">' + esc(T('co.summary')) + '</h2><button type="button" data-goto="cart">' + esc(C('edit')) + '</button></div>' +
        '<ul class="co-sum__items">' + itemRows + '</ul>' +
        '<div class="co-sum__rows">' +
          '<div class="co-sum__row"><span>' + esc(T('co.subtotal')) + '</span><span>' + fmt(tt.subtotalCents) + '</span></div>' +
          discountRows +
          '<div class="co-sum__row"><span>' + esc(T('co.shipping')) + '<small class="co-sum__zone">' + esc(zone) + '</small></span><span>' + shipCell + '</span></div>' +
        '</div>' +
        (YZA.cart.gift.enabled ? '<div class="co-gift-summary"><strong>' + esc(YZA.cart.copy('gift')) + ' — ' + esc(YZA.cart.copy('free')) + '</strong><p>' + esc(YZA.cart.gift.message) + '</p></div>' : '') +
        couponBox() +
        '<div class="co-sum__total"><span>' + esc(T('co.total')) + '<small>' + esc(T('co.vat')) + '</small></span><strong>' + fmt(tt.grandTotalCents) + eurLine + '</strong></div>' +
        reassureStrip() + '<div class="co-summary-currency">' + currency + '</div>' +
        '<p class="co-terms">' + esc(T('co.terms')) + ' <a href="/mentions-legales#cgv">' + esc(T('co.gcs')) + '</a> · <a href="/mentions-legales#confidentialite">' + esc(T('co.privacy')) + '</a>.</p>' +
      '</div></aside>';
    }

    function cartStep() {
      var items = lines();
      if (!items.length) {
        return '<div class="co-empty"><img src="/yza-v2-preview/assets/brand/symbol.svg" alt="" width="48" height="48"><h1 class="co-h1">' + esc(C('cartTitle')) + '</h1><p>' + esc(T('co.empty')) + '</p><a class="btn btn--solid" href="/collections/best-sellers">' + esc(YZA.cart.copy('emptyCta')) + '</a></div>';
      }
      var rows = items.map(function (it) {
        return '<div class="co-line"><a class="co-line__img" href="' + esc(it.url) + '"><img src="' + esc(it.img) + '" alt="' + esc(it.imageAlt) + '" width="96" height="120" loading="lazy"></a>' +
          '<div class="co-line__info"><div class="co-line__heading"><a class="co-line__name" href="' + esc(it.url) + '">' + esc(it.name) + '</a><span class="co-line__price">' + fmt(it.line) + '</span></div>' +
          (it.variant ? '<div class="co-line__var">' + esc(it.variant) + '</div>' : '') +
          (it.almostGone ? '<div class="co-line__scarcity">' + esc(YZA.i18n.tFmt('scarcity.remaining', { n: it.inventory })) + '</div>' : '') +
          '<div class="co-line__ctl"><div class="qty" data-handle="' + esc(it.handle) + '" data-variant="' + esc(it.rawVariant) + '" data-size-code="' + esc(it.sizeCode) + '" data-color-slug="' + esc(it.colorSlug) + '" data-release-id="' + esc(it.releaseId) + '" data-finish-key="' + esc(it.finishKey) + '"><button class="qty__btn" data-act="dec" aria-label="' + esc(YZA.cart.copy('decrease')) + '">−</button><span class="qty__n">' + it.qty + '</span><button class="qty__btn" data-act="inc" aria-label="' + esc(YZA.cart.copy('increase')) + '">+</button></div>' +
          '<button class="co-line__remove" data-remove data-handle="' + esc(it.handle) + '" data-variant="' + esc(it.rawVariant) + '" data-size-code="' + esc(it.sizeCode) + '" data-color-slug="' + esc(it.colorSlug) + '" data-release-id="' + esc(it.releaseId) + '" data-finish-key="' + esc(it.finishKey) + '">' + esc(T('cart.remove')) + '</button></div></div></div>';
      }).join('');
      return '<h1 class="co-h1">' + esc(C('cartTitle')) + '</h1><p class="co-intro">' + esc(C('cartIntro')) + '</p><div class="co-lines">' + rows + '</div>' + M.giftHTML() + (isPickup() ? '<p class="co-delivery-notice">' + esc(D.text(5) + ' · ' + D.text(6)) + '</p>' : M.bridgeHTML(destRegion())) +
        '<div class="co-actions"><a class="link-underline" href="/collections">' + esc(T('co.continue')) + '</a>' +
        '<button type="button" class="btn btn--solid" data-next="shipping">' + esc(T('co.next')) + '</button></div>';
    }

    function field(name, labelKey, type, required, extra) {
      var v = state.ship[name] || '';
      var tag = type === 'textarea'
        ? '<textarea id="co-' + name + '" name="' + name + '" aria-describedby="co-' + name + '-error" maxlength="300" rows="2" placeholder="' + esc(extra || '') + '">' + esc(v) + '</textarea>'
        : '<input id="co-' + name + '" name="' + name + '" type="' + type + '" aria-describedby="co-' + name + '-error" maxlength="' + (name === 'phone' ? 30 : name === 'email' ? 254 : 160) + '" value="' + esc(v) + '" ' + (extra || '') + (required ? ' required' : '') + '>';
      return '<div class="field co-field"><label for="co-' + name + '">' + esc(name === 'phone' ? D.text(14) : T(labelKey)) + (required ? ' <span aria-hidden="true">·</span>' : '') + '</label>' + tag + '<span class="co-field__err" id="co-' + name + '-error" data-err aria-live="polite"></span></div>';
    }

    // Country is a SELECT, not free text: the delivery tariff is keyed off an ISO-2 code
    // (YZA.geo.regionOf), and a typed "Maroc" can never resolve to one. Changing it
    // re-renders the summary so the fee updates live.
    function countryField() {
      var cur = normCountry(state.ship.country);
      var c = (YZA.geo && YZA.geo.countries) || {};
      var opt = function (o) {
        return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
      };
      var group = function (labelKey, list) {
        return (list && list.length) ? '<optgroup label="' + esc(T(labelKey)) + '">' + list.map(opt).join('') + '</optgroup>' : '';
      };
      var sel = '<select id="co-country" name="country" required autocomplete="country" aria-describedby="co-country-error">' +
        '<option value=""' + (cur ? '' : ' selected') + '>' + esc(T('co.ship.countryPh')) + '</option>' +
        opt(['MA', 'Maroc']) +
        group('co.ship.grpEU', c.europe) +
        group('co.ship.grpUS', c.usa_gcc) +
        opt(['XX', T('co.ship.countryOther')]) +
      '</select>';
      return '<div class="field co-field"><label for="co-country">' + esc(T('co.ship.country')) + ' <span aria-hidden="true">·</span></label>' + sel +
        '<span class="co-field__err" id="co-country-error" data-err></span></div>';
    }

    function shippingStep() {
      const part = (n, label) => '<div class="co-delivery-heading"><span>' + n + '</span><h2>' + esc(D.text(label)) + '</h2></div>';
      const quote = YZA.cart.orderTotals(isPickup() && normCountry(state.ship.country) ? YZA.geo.regionOf(normCountry(state.ship.country)) : destRegion());
      const fee = quote.shippingQuoteOnly ? T('co.shipCalc') : quote.shippingFree ? T('co.shipFree') : fmt(quote.shippingCents);
      const mode = (value, title, price, note) => '<label class="co-delivery-mode' + ((value === 'pickup') === isPickup() ? ' is-selected' : '') + '"><input id="co-mode-' + value + '" type="radio" data-delivery-mode value="' + value + '" name="deliveryChoice"' + ((value === 'pickup') === isPickup() ? ' checked' : '') + '><span><strong>' + esc(D.text(title)) + '</strong><small>' + esc(note) + '</small></span><em>' + esc(price) + '</em></label>';
      return '<h1 class="co-h1">' + esc(isPickup() ? D.text(13) : T('co.ship.title')) + '</h1><p class="co-intro">' + esc(isPickup() ? D.text(8) : C('shipIntro')) + '</p>' +
        '<form class="co-form co-delivery-form" id="coShipForm" novalidate>' +
          part('01',0) + '<p class="co-delivery-context">' + esc(D.text(3)) + '</p>' +
          field('name', 'co.ship.name', 'text', true, 'autocomplete="name"') +
          '<div class="co-form__two">' + field('phone', 'co.ship.phone', 'tel', true, 'autocomplete="tel" inputmode="tel"') + field('email', 'co.ship.email', 'email', false, 'autocomplete="email"') + '</div>' +
          '<p class="co-phone-preview" id="coPhonePreview" aria-live="polite"></p>' +
          part('02',1) + '<div class="co-delivery-modes" role="radiogroup" aria-label="' + esc(T('co.shipping')) + '">' + mode('delivery',4,fee,C('tracked')) + mode('pickup',5,D.text(6),D.text(7)) + '</div>' +
          (isPickup() ? '<div class="co-delivery-notice"><strong>' + esc(D.text(7)) + '</strong><p>' + esc(D.text(8)) + '</p><a class="link-underline" href="/studio">' + esc(C('pickupLink')) + '</a></div>' :
          field('address', 'co.ship.address', 'text', true, 'autocomplete="street-address"') +
          '<div class="co-form__two">' + field('city', 'co.ship.city', 'text', true, 'autocomplete="address-level2"') + field('zip', 'co.ship.zip', 'text', false, 'autocomplete="postal-code"') + '</div>' + countryField() +
          '<p class="co-delivery-notice">' + esc(D.text(18)) + '</p>') +
          part('03',2) + M.giftHTML() + field('note', 'co.ship.note', 'textarea', false, T('co.ship.notePh')) +
          '<label class="co-remember"><input type="checkbox" id="coRemember" data-remember' + (rememberDetails ? ' checked' : '') + '><span>' + esc(D.text(10)) + '</span></label><p class="co-delivery-hint">' + esc(D.text(11)) + '</p><p class="co-delivery-hint">' + esc(D.text(9)) + '</p>' +
        '</form>' +
        '<div class="co-actions"><button type="button" class="btn btn--outline" data-back="cart">' + esc(T('co.back')) + '</button>' +
        '<button type="button" class="btn btn--solid" data-next="payment">' + esc(D.text(12)) + '</button></div>';
    }

    function deliveryReview() {
      const address = isPickup() ? D.text(7) : [state.ship.address, state.ship.zip, state.ship.city, countryName(state.ship.country)].filter(Boolean).join(', ');
      const tt = totals();
      const fee = tt.shippingQuoteOnly ? T('co.shipCalc') : tt.shippingFree ? T('co.shipFree') : fmt(tt.shippingCents);
      const reviewRow = (label, value, target) => '<div class="co-delivery-review__row"><small>' + esc(label) + '</small><p>' + esc(value) + '</p><button class="link-underline" type="button" data-edit-shipping="' + target + '" aria-label="' + esc(C('edit') + ' — ' + label) + '">' + esc(C('edit')) + '</button></div>';
      return '<div class="co-delivery-review">' +
        reviewRow(C('payContact'), [state.ship.name,state.ship.phone,state.ship.email].filter(Boolean).join(' · '), 'co-name') +
        reviewRow(isPickup() ? D.text(5) : C('payAddress'), address, isPickup() ? 'co-mode-pickup' : 'co-address') +
        reviewRow(C('payMethod'), (isPickup() ? D.text(5) : C('tracked')) + ' · ' + fee, isPickup() ? 'co-mode-pickup' : 'co-mode-delivery') + '</div>';
    }

    function validateField(el, final) {
      if (!el || !el.closest('.co-field')) return true;
      const value = el.value.trim();
      const wrap = el.closest('.co-field');
      wrap.classList.remove('is-err'); el.removeAttribute('aria-invalid');
      const error = wrap.querySelector('[data-err]'); if (error) error.textContent = '';
      let message = final && el.required && !value ? T('co.err.required') : '';
      if (el.name === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) message = T('co.err.email');
      if (el.name === 'phone') {
        const phone = D.phone(value, isPickup() ? 'MA' : normCountry(state.ship.country));
        if (value && !phone.valid) message = D.text(19);
        const preview = root.querySelector('#coPhonePreview');
        if (preview) preview.textContent = phone.formatted ? D.text(15) + phone.formatted : '';
      }
      if (message) markErr(el,message);
      return !message;
    }

    function payDetails(method) {
      var p = PAY();
      if (method === 'cod') return '<div class="pay-details"><p class="pay-note">' + esc(isPickup() ? D.text(8) + ' ' + D.text(17) : C('payCodDetail')) + '</p></div>';
      if (method === 'rib') {
        var rib = (p.morocco && p.morocco.rib) || T('co.pay.ribToCome');
        var bank = p.morocco && p.morocco.bank;
        var holder = (p.morocco && p.morocco.holder) || 'Nawal Rmili';
        return '<div class="pay-details">' +
          (bank ? row(T('co.pay.bank'), bank, false) : '') +
          row('RIB', rib, !!(p.morocco && p.morocco.rib)) +
          row(T('co.pay.holder'), holder, false) +
          '<p class="pay-note pay-note--fee">' + esc(T('co.pay.ribFee')) + '</p>' +
          '<p class="pay-note">' + esc(T('co.pay.note')) + '</p></div>';
      }
      if (method === 'iban') {
        var e = p.eur || {};
        return '<div class="pay-details">' +
          row('IBAN', e.iban || '', true) +
          row('BIC', e.bic || '', true) +
          row(T('co.pay.bank'), e.bank || '', false) +
          row(T('co.pay.holder'), e.holder || '', false) +
          '<p class="pay-eur">' + esc(T('co.total')) + ' ' + eur(totals().grandTotalCents) + '</p>' +
          '<p class="pay-note">' + esc(T('co.pay.note')) + '</p></div>';
      }
      if (method === 'card') {
        return '<div class="pay-details">' +
          '<p class="pay-eur">' + esc(T('co.total')) + ' ' + fmtMad(totals().grandTotalCents) + '</p>' +
          '<p class="pay-note">' + esc(C('payCardNote')) + '</p>' +
          (state.cardErr ? '<p class="pay-note" role="alert" style="color:#c0392b">' + esc(state.cardErr) + '</p>' : '') +
          '</div>';
      }
      if (method === 'paypal') {
        if (paypalReady()) {
          return '<div class="pay-details">' +
            '<p class="pay-eur">' + esc(T('co.total')) + ' ' + eur(totals().grandTotalCents) + '</p>' +
            '<a class="btn btn--solid pay-details__btn" href="' + esc(paypalPayUrl()) + '" target="_blank" rel="noopener">' + esc(T('co.pay.paypalBtn')) + '</a>' +
            '<p class="pay-note">' + esc(T('co.pay.paypalNote')) + '</p></div>';
        }
        return '<div class="pay-details"><p class="pay-note">' + esc(T('co.pay.ribTxt')) + ' ' + eur(totals().grandTotalCents) + '</p></div>';
      }
      return '';
    }
    function row(label, value, copyable) {
      return '<div class="pay-details__row"><span>' + esc(label) + '</span><code>' + esc(value) + '</code>' +
        (copyable ? '<button type="button" class="pay-copy" data-copy="' + esc(value) + '">' + esc(T('co.pay.copy')) + '</button>' : '') + '</div>';
    }

    function payStep() {
      if (destRegion() !== 'morocco' && state.method === 'cod') state.method = 'card';
      var methods = [
        { id: 'cod', name: isPickup() ? D.text(16) : T('co.pay.cod'), txt: isPickup() ? D.text(17) : T('co.pay.codTxt'), logo: 'assets/brand/payment/cod.svg' },
        { id: 'card', name: T('co.pay.card'), txt: T('co.pay.cardTxt'), logos: ['assets/brand/payment/visa.svg', 'assets/brand/payment/mastercard.svg'] },
        { id: 'rib', name: T('co.pay.rib'), txt: T('co.pay.ribTxt'), logo: 'assets/brand/payment/bank.svg' },
        { id: 'iban', name: T('co.pay.iban'), txt: T('co.pay.ibanTxt'), logo: 'assets/brand/payment/bank.svg' },
        // PayPal RETIRE le 2026-07-29 : la cliente ne le veut plus depuis que le paiement
        // par carte (Zazu) est en production. On retire uniquement l'OFFRE ; le reste du
        // code PayPal plus bas devient inatteignable (state.method ne peut plus valoir
        // 'paypal', et il n'est jamais restaure depuis le stockage — seul `ship` l'est).
        // Volontairement conserve tel quel : ce fichier porte le paiement par carte, on y
        // limite les modifications au strict minimum. Pour reactiver PayPal : remettre
        // cette entree et renseigner YZA.payment.paypalEmail dans products.js.
      ];
      var opts = methods.filter(function (m) { return m.id !== 'cod' || destRegion() === 'morocco'; }).map(function (m) {
        var on = state.method === m.id;
        var tag = {cod:isPickup() ? D.text(5) : C('cod'), card:C('card'), rib:C('payInstant'), iban:C('payInternational')}[m.id];
        return '<div class="co-payment-method' + (on ? ' is-selected' : '') + '"><label class="pay-option' + (on ? ' is-selected' : '') + '">' +
          '<input type="radio" id="co-pay-' + m.id + '" name="pay" value="' + m.id + '"' + (on ? ' checked aria-controls="coPayDetails-' + m.id + '"' : '') + '>' +
          '<span class="pay-option__body"><span class="pay-option__name">' + esc(m.name) + '</span><span class="pay-option__txt">' + esc(m.txt) + '</span></span>' +
          '<span class="pay-option__tag">' + esc(tag) + '</span></label>' +
          (on ? '<div id="coPayDetails-' + m.id + '" class="co-payment-detail" role="region" aria-labelledby="co-pay-' + m.id + '">' + payDetails(m.id) + '</div>' : '') + '</div>';
      }).join('');
      var catalogAlert = state.catalogErr ? '<div class="pay-details" role="alert"><p class="pay-note" style="color:#c0392b">' + esc(state.catalogErr) + '</p>' +
        '<button type="button" class="btn btn--outline" data-catalog-refresh>Actualiser et vérifier le panier</button></div>' : '';
      return '<h1 class="co-h1">' + esc(T('co.pay.title')) + '</h1><p class="co-intro">' + esc(C('payIntro')) + '</p>' + catalogAlert + deliveryReview() + '<div class="co-pay" role="radiogroup" aria-label="' + esc(T('co.pay.title')) + '">' + opts + '</div>' + bumpCard() +
        '<div class="co-actions"><button type="button" class="btn btn--outline" data-back="shipping">' + esc(T('co.back')) + '</button>' +
        '<button type="button" class="btn btn--solid" data-place>' + esc(state.method === 'card' ? C('payCard') : T('co.pay.place')) + ' · ' + fmt(totals().grandTotalCents) + '</button></div>' +
        '<p class="co-payment-terms">' + esc(T('co.terms')) + ' <a href="/mentions-legales#cgv">' + esc(T('co.gcs')) + '</a>.</p>';
    }

    // One unchecked low-friction add above the Place-order button. state.bumpOn is
    // authoritative; checking adds the item to the real cart (summary updates live).
    function bumpCard() {
      if (!state.bumpHandle) return '';
      var p = YZA.getProduct(state.bumpHandle);
      if (!p) return '';
      var st = (YZA.inventoryStatus && YZA.inventoryStatus(p)) || {};
      if (st.soldOut) return '';
      var slug = p.defaultColorSlug || '';
      var view = slug && YZA.resolveProductColorView ? YZA.resolveProductColorView(p, slug) : p;
      return '<div class="co-payment-divider" aria-hidden="true"><img src="/yza-v2-preview/assets/brand/icons/yza-sign-06.png" alt="" width="22" height="24"></div><label class="co-bump' + (state.bumpOn ? ' is-on' : '') + '">' +
        '<input type="checkbox" id="coBump" data-bump aria-label="' + esc(C(state.bumpOn ? 'added' : 'add') + ' ' + YZA.i18n.pick(p.name)) + '"' + (state.bumpOn ? ' checked' : '') + '>' +
        '<img src="' + esc(view.img) + '" alt="' + esc(YZA.i18n.pick(view.imageAlt || view.name)) + '" width="56" height="72" loading="lazy">' +
        '<span class="co-bump__body"><span class="co-bump__kicker">' + esc(T('co.bump.kicker')) + '</span>' +
        '<span class="co-bump__name">' + esc(YZA.i18n.pick(p.name)) + '</span>' +
        '<span class="co-bump__txt">' + esc(T('co.bump.pitch')) + '</span></span><span class="co-bump__toggle"><span>' + fmt(p.price) + '</span><small>' + esc(state.bumpOn ? T('cart.remove') : C('add')) + '</small></span></label>';
    }

    // Trust reassurance at the payment step — the highest-anxiety moment, especially for an
    // international prepay buyer wiring to an IBAN. Kept factual.
    // La 4e puce, « PayPal protege l'acheteur », est RETIREE le 2026-07-29 avec PayPal :
    // elle serait devenue fausse. On ne la remplace pas — les trois autres sont vraies et
    // suffisent ; inventer une garantie a la place serait pire que d'en afficher une de
    // moins. La clef co.reassure.buyer est laissee en place pour un retour arriere simple.
    function reassureStrip() {
      return '<ul class="co-reassure" aria-label="' + esc(T('co.reassure.secure')) + '">' +
        '<li><img src="/yza-v2-preview/assets/brand/icons/yza-sign-03.png" alt="" width="24" height="28">' + esc(T('co.reassure.secure')) + '</li>' +
        '<li><img src="/yza-v2-preview/assets/brand/icons/yza-sign-06.png" alt="" width="24" height="28">' + esc(T('co.reassure.returns')) + '</li>' +
        '<li><img src="/yza-v2-preview/assets/brand/icons/yza-sign-16.png" alt="" width="24" height="28">' + esc(T('co.reassure.repairs')) + '</li>' +
      '</ul>' +
      '<p class="co-reassure__note">' + esc(T('co.reassure.note')) + '</p>';
    }

    function doneStep() {
      var p = PAY();
      var msg = state.method === 'card'
        ? (state.cardPaid === 'yes' ? T('co.done.card') : T('co.done.cardCheck'))
        : (state.method === 'cod' ? (isPickup() ? D.text(8) + ' ' + D.text(17) : T('co.done.cod')) : (state.method === 'paypal' && paypalReady() ? T('co.done.paypal') : T('co.done.transfer')));
      var paypalBtn = (state.method === 'paypal' && paypalReady())
        ? '<a class="btn btn--outline" href="' + esc(paypalPayUrl()) + '" target="_blank" rel="noopener">' + esc(T('co.done.paypalBtn')) + '</a>' : '';
      var num = (state.lastOrder && state.lastOrder.number) || state.orderNo || '';
      var noLine = num ? '<p class="co-done__no">' + esc(T('co.done.orderNo')) + ' <strong>' + esc(num) + '</strong></p>' : '';
      var emailed = state.emailSent ? '<p class="co-done__emailed">' + esc(T('co.done.emailed')) + '</p>' : '';
      var retryLabels = { fr: 'R\u00e9essayer la v\u00e9rification', en: 'Check payment again', es: 'Comprobar el pago de nuevo', tr: '\u00d6demeyi tekrar kontrol et', ar: '\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u062f\u0641\u0639' };
      var retryBtn = state.method === 'card' && state.cardBound && state.cardPaid !== 'yes'
        ? '<button type="button" class="btn btn--outline" data-zazu-retry' + (state.cardPaid === 'checking' ? ' disabled' : '') + '>'
          + esc(state.cardPaid === 'checking' ? T('co.pay.cardWait') : (retryLabels[YZA.i18n.lang] || retryLabels.fr)) + '</button>' : '';
      var waBtn = state.wa ? '<a class="btn btn--solid" href="' + esc(state.wa) + '" target="_blank" rel="noopener">' + esc(T('co.done.wa')) + '</a>' : '';
      return '<div class="co-done"><div class="co-done__check" aria-hidden="true"><img src="/yza-v2-preview/assets/brand/icons/yza-woven.png" alt="" width="24" height="48"></div>' +
        '<h1 class="co-h1">' + esc(T('co.done.title')) + '</h1>' +
        '<p class="co-done__msg">' + esc(msg) + '</p>' +
        emailed + noLine +
        '<div class="co-done__actions">' + waBtn + retryBtn + paypalBtn +
        '<a class="btn btn--outline co-done__home" href="/">' + esc(T('co.done.home')) + '</a></div></div>' + addonBlock();
    }

    // Post-order add-on: COD/transfer makes adding to a placed order frictionless — the
    // customer taps a suggestion → WhatsApp prefilled "AJOUTER au colis de ma commande N°…".
    function addonBlock() {
      var cfg = YZA.promos && YZA.promos.postOrderAddon;
      if ((cfg && cfg.enabled === false) || !state.lastOrder || (state.method === 'card' && state.cardPaid !== 'yes') || typeof YZA.cartSuggestions !== 'function') return '';
      var sug = YZA.cartSuggestions(state.lastOrder.items, { limit: 12, categories: ['charms'] });
      // This one-tap path has no colour picker. Never manufacture a colour choice on the
      // shopper's behalf; only offer products whose strict server line needs no colour.
      sug = sug.filter(function (p) { return !(YZA.productRequiresColor && YZA.productRequiresColor(p.handle)); })
        .slice(0, 3);
      if (!sug.length) return '';
      var cards = sug.map(function (p) {
        var st = (YZA.inventoryStatus && YZA.inventoryStatus(p)) || {};
        var slug = p.defaultColorSlug || '';
        var view = slug && YZA.resolveProductColorView ? YZA.resolveProductColorView(p, slug) : p;
        return '<button type="button" class="co-confirmation-card" data-addon="' + esc(p.handle) + '" aria-label="' + esc(T('co.addon.cta') + ' — ' + YZA.i18n.pick(p.name)) + '">' +
          '<img src="' + esc(view.img) + '" alt="" width="64" height="78" loading="lazy">' +
          '<span class="co-confirmation-card__body"><span class="co-confirmation-card__name">' + esc(YZA.i18n.pick(p.name)) + '</span><span class="co-confirmation-card__price">' + fmt(p.price) + '</span>' +
          '<span class="co-confirmation-card__status" data-addon-status role="status" hidden></span></span></button>';
      }).join('');
      return '<div class="co-addon"><p class="co-addon__title">' + esc(T('co.addon.title')) + '</p><div class="co-addon__grid">' + cards + '</div><p class="co-addon__sub">' + esc(C('addon')) + '</p></div>';
    }

    function render() {
      const active = document.activeElement;
      const focusId = root.contains(active) ? active.id : '';
      const quantityFocus = active?.closest('.qty') ? {identity:JSON.stringify({...active.closest('.qty').dataset}), act:active.dataset.act} : null;
      if (!YZA.cart.items.length && state.step !== 'done') state.step = 'cart';
      root.dataset.step = state.step;
      var body;
      if (state.step === 'done') body = '<div class="checkout__main checkout__main--done">' + doneStep() + '</div>';
      else {
        var content = state.step === 'cart' ? cartStep() : state.step === 'shipping' ? shippingStep() : payStep();
        body = '<div class="checkout__grid"><section class="checkout__main">' + content + '</section>' + (YZA.cart.items.length ? summary() : '') + '</div>';
      }
      root.innerHTML = '<div class="checkout__head"><a class="co-back" href="/collections"><span aria-hidden="true">←</span>' + esc(C('back')) + '</a><a class="checkout__logo" href="/" aria-label="YZA"><img src="/yza-v2-preview/assets/brand/yza-logo-real.webp" alt="YZA" width="600" height="177"></a><a class="co-help" href="https://wa.me/' + waDigits() + '" target="_blank" rel="noopener">' + esc(C('help')) + '</a></div>' + (state.step === 'done' ? '' : stepsBar()) + body;
      if (YZA.i18n.apply) YZA.i18n.apply(root);
      if (state.submitting) root.querySelectorAll('button,input,select,textarea').forEach(el => { el.disabled = true; });
      else if (couponBusy && root.querySelector('[data-place]')) root.querySelector('[data-place]').disabled = true;
      if (focusId) document.getElementById(focusId)?.focus({preventScroll:true});
      else if (quantityFocus) [...root.querySelectorAll('.qty')].find(el => JSON.stringify({...el.dataset}) === quantityFocus.identity)?.querySelector('[data-act="' + quantityFocus.act + '"]')?.focus({preventScroll:true});
    }

    // Validate before advancing; errors remain adjacent to their fields.


    function collectShip() {
      var f = root.querySelector('#coShipForm');
      if (!f) return true;
      var ok = true;
      var need = isPickup() ? ['name', 'phone'] : ['name', 'phone', 'address', 'city', 'country'];
      Array.prototype.forEach.call(f.elements, function (el) {
        if (!el.name || el.type === 'radio' || el.type === 'checkbox') return;
        state.ship[el.name] = el.value.trim();
      });
      f.querySelectorAll('[data-err]').forEach(function (e) { e.textContent = ''; e.parentElement.classList.remove('is-err'); });
      f.querySelectorAll('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); });
      need.forEach(function (n) {
        var el = f.querySelector('[name="' + n + '"]');
        if (el && !el.value.trim()) { markErr(el, T('co.err.required')); ok = false; }
      });
      var email = f.querySelector('[name="email"]');
      if (email && email.value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) { markErr(email, T('co.err.email')); ok = false; }
      var phone = f.querySelector('[name="phone"]');
      if (phone && !validateField(phone, true)) ok = false;
      saveShip();
      if (!ok) f.querySelector('[aria-invalid="true"]')?.focus();
      return ok;
    }
    function markErr(el, msg) {
      el.setAttribute('aria-invalid', 'true');
      var wrap = el.closest('.co-field');
      if (wrap) { wrap.classList.add('is-err'); var e = wrap.querySelector('[data-err]'); if (e) e.textContent = msg; }
    }

    // ---- order ----
    function methodLabel() {
      return { cod: isPickup() ? D.text(16) : T('co.pay.cod'), card: T('co.pay.card'), rib: T('co.pay.rib'), iban: T('co.pay.iban'), paypal: T('co.pay.paypal') }[state.method] || state.method;
    }
    function buildOrder() {
      var items = lines().map(function (it) { return { handle: it.handle, baseHandle: it.handle, name: it.name, variant: it.variant, rawVariant: it.rawVariant || '', sizeCode: it.sizeCode || '', colorSlug: it.colorSlug || '', finishKey: it.finishKey || '', releaseId: it.releaseId, qty: it.qty, price: it.price, src: it.src || '' }; });
      var tt = totals();
      var discounts = tt.discounts.map(function (d) {
        var label = YZA.cart.discountLabel(d);
        return { id: d.id, label: label, amountDh: Math.round(d.amountCents / 100) };
      });
      // `shipping` is the ADDRESS (kept for the existing backend); shippingDh is the fee.
      // totalDh includes it — order.php / WooCommerce bill this figure.
      // shipping.country stays the readable NAME ("Maroc") the backend has always received:
      // order.php matches it against /maroc|morocco/i and prints it in Nawal's email, so
      // sending the raw ISO code here would blank the WooCommerce country. The code travels
      // alongside as countryCode.
      var shipOut = {};
      for (var k in state.ship) { if (Object.prototype.hasOwnProperty.call(state.ship, k)) shipOut[k] = state.ship[k]; }
      shipOut.country = countryName(state.ship.country);
      if (isPickup()) { shipOut.country = 'Maroc'; shipOut.address = 'Retrait au studio YZA — 66 rue Yougoslavie, Guéliz'; shipOut.city = 'Marrakech'; shipOut.zip = ''; }
      return { number: state.orderNo || '', operationId: state.operationId || '', items: items, subtotalDh: Math.round(tt.subtotalCents / 100), discounts: discounts,
        merchandiseDh: Math.round(tt.merchandiseCents / 100),
        shippingDh: Math.round(tt.shippingCents / 100), shippingFree: tt.shippingFree, shippingQuoteOnly: tt.shippingQuoteOnly,
        shippingRegion: tt.region, countryCode: isPickup() ? 'MA' : normCountry(state.ship.country),
        totalDh: Math.round(tt.grandTotalCents / 100), method: state.method, methodLabel: methodLabel(), shipping: shipOut, lang: YZA.i18n.lang,
        coupon: (YZA.cart.coupon && YZA.cart.couponDef()) ? YZA.cart.coupon.code : '',
        gift: YZA.cart.orderGift(),
        page: location.href, at: new Date().toISOString() };
    }
    // Human-friendly unique order number, shared by WhatsApp / email / WooCommerce / ad pixels.
    function orderNo() {
      var t = Date.now().toString(36).toUpperCase();
      var r = Math.floor(Math.random() * 1296).toString(36).toUpperCase();
      return 'YZA-' + t + (r.length < 2 ? '0' + r : r);
    }
    function newOperationId() {
      var bytes = new Uint8Array(16);
      try { crypto.getRandomValues(bytes); }
      catch (operationRandomError) {
        for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
      }
      return 'ord_' + Array.prototype.map.call(bytes, function (value) { return ('0' + value.toString(16)).slice(-2); }).join('');
    }
    function ensureOrderOperation() {
      if (!state.orderNo) state.orderNo = orderNo();
      if (!/^[A-Za-z0-9_-]{20,100}$/.test(state.operationId || '')) state.operationId = newOperationId();
      try { sessionStorage.setItem('yza.order.operation', JSON.stringify({ id: state.operationId, number: state.orderNo })); } catch (operationSaveError) {}
    }
    // GA4-shape ecommerce payload (also consumed by the Meta/TikTok mappers in tracking.js).
    function trackPayload(o) {
      o = o || {};
      // Prefer the order's own total. On the card-return path (?zazu=paid) the cart is
      // already cleared before the purchase event fires, so reading the live cart would
      // report every card sale as 0 MAD. Falls back to the cart for pre-order events.
      var valueDh = (typeof o.totalDh === 'number') ? o.totalDh : (totals().grandTotalCents / 100);
      return {
        transaction_id: o.number || '',
        value: valueDh,                          // net of discounts, incl. delivery — what the customer pays
        currency: 'MAD',
        payment_type: o.method || state.method,
        items: (o.items || lines()).map(function (it) {
          return { item_id: it.handle, item_name: it.name, item_variant: it.variant || '', quantity: it.qty, price: (it.price || 0) / 100, item_list_name: it.src || '' };
        }),
      };
    }
    function orderText(o) {
      var lang = YZA.i18n.lang || 'fr';
      var tpl = {
        fr: { intro: 'Bonjour YZA, je souhaite commander :', total: 'Total', ship: 'Livraison', addr: 'Adresse', pay: 'Paiement' },
        en: { intro: 'Hello YZA, I would like to order:', total: 'Total', ship: 'Shipping', addr: 'Address', pay: 'Payment' },
        es: { intro: 'Hola YZA, quiero hacer un pedido:', total: 'Total', ship: 'Envío', addr: 'Dirección', pay: 'Pago' },
        tr: { intro: 'Merhaba YZA, sipariş vermek istiyorum:', total: 'Toplam', ship: 'Teslimat', addr: 'Adres', pay: 'Ödeme' },
        ar: { intro: 'مرحبا YZA، أود تقديم طلب:', total: 'المجموع', ship: 'التوصيل', addr: 'العنوان', pay: 'الدفع' },
      };
      var c = tpl[lang] || tpl.fr;
      var lns = o.items.map(function (it) { return '• ' + it.qty + ' × ' + it.name + (it.variant ? ' (' + it.variant + ')' : '') + ' — ' + fmtMad(it.price * it.qty); });
      var s = o.shipping || {};
      var addr = [s.name, s.phone, s.address, [s.zip, s.city].filter(Boolean).join(' '), countryName(s.country)].filter(Boolean).join('\n');
      var out = [c.intro];
      if (o.number) out.push('N° : ' + o.number);
      out = out.concat(lns);
      (o.discounts || []).forEach(function (d) { out.push(d.label + ' : −' + fmtMad(d.amountDh * 100)); });
      // Always state the delivery fee explicitly — an order line that omits it is what
      // let sub-threshold orders ship free without anyone noticing.
      var tt = totals();
      var acceptedQuoteOnly = Object.prototype.hasOwnProperty.call(o, 'shippingQuoteOnly') ? !!o.shippingQuoteOnly : tt.shippingQuoteOnly;
      var acceptedShippingFree = Object.prototype.hasOwnProperty.call(o, 'shippingFree') ? !!o.shippingFree : tt.shippingFree;
      var acceptedShippingC = (typeof o.shippingDh === 'number') ? o.shippingDh * 100 : tt.shippingCents;
      out.push(c.ship + ' : ' + (acceptedQuoteOnly ? T('co.shipCalc')
        : (acceptedShippingFree ? T('co.shipFree') : fmtMad(acceptedShippingC))));
      var totalC = (typeof o.totalDh === 'number') ? o.totalDh * 100 : tt.grandTotalCents;
      out.push(c.total + ' : ' + fmtMad(totalC) + (isIntl() ? ' (' + eur(totalC) + ')' : ''));
      out.push('—');
      out.push(c.addr + ' :\n' + addr);
      if (s.note) out.push('“' + s.note + '”');
      if (o.gift && o.gift.enabled) {
        out.push(YZA.cart.copy('gift') + ' — ' + YZA.cart.copy('free'));
        if (o.gift.message) out.push(YZA.cart.copy('giftNote') + ' : ' + o.gift.message);
      }
      out.push('—');
      out.push(c.pay + ' : ' + o.methodLabel);
      // Include the actual payment coordinates for transfer methods (promised in the UI note).
      var p = PAY();
      if (o.method === 'rib' && p.morocco && p.morocco.rib) {
        out.push('RIB (' + (p.morocco.bank || '') + ') : ' + p.morocco.rib);
        out.push(T('co.pay.holder') + ' : ' + (p.morocco.holder || ''));
        out.push(T('co.pay.ribFee'));
      } else if (o.method === 'iban' && p.eur && p.eur.iban) {
        out.push('IBAN (' + (p.eur.bank || '') + ') : ' + p.eur.iban);
        out.push('BIC : ' + (p.eur.bic || '') + ' — ' + T('co.pay.holder') + ' : ' + (p.eur.holder || ''));
        out.push(eur(totalC));
      } else if (o.method === 'paypal' && paypalReady()) {
        out.push('PayPal : ' + (p.paypalEmail || p.paypalLink) + ' (' + eur(totalC) + ')');
      }
      return out.join('\n');
    }

    function setSubmitting(busy) {
      state.submitting = busy;
      root.setAttribute('aria-busy', String(busy));
      // The shared header now appears here too; keep its cart closed while the
      // server accepts the exact order snapshot currently being confirmed.
      const header = document.getElementById('header');
      if (header) header.inert = busy;
    }

    // Card payment (Zazu hosted page): create the session server-side, then redirect.
    // The cart is NOT cleared here — only on a confirmed return (?zazu=paid), and the
    // canonical fulfillment stays the checkout_session.completed webhook server-side.
    function placeCardOrder() {
      setSubmitting(true);
      root.querySelectorAll('button,input,select,textarea').forEach(el => { el.disabled = true; });
      ensureOrderOperation();
      var o = buildOrder();
      state.cardErr = '';
      var btn = root.querySelector('[data-place]');
      if (btn) { btn.disabled = true; btn.textContent = T('co.pay.cardWait'); }
      var fail = function (data) {
        setSubmitting(false);
        if (data && (data.status === 'reprice' || data.error === 'catalog_reprice')) {
          state.repriceRevision = data.currentRevision || '';
          state.catalogErr = 'Le catalogue a changé. Actualisez puis vérifiez le nouveau prix avant de confirmer.';
        } else if (data && (data.status === 'stock' || data.error === 'catalog_stock')) {
          state.catalogErr = 'La quantité disponible vient de changer. Le panier a été corrigé avec le stock actuel; vérifiez-le avant de confirmer.';
          Promise.resolve(YZA.refreshInventory?.()).then(function () { YZA.cart?.load?.(); YZA.cart?.refresh?.(); render(); });
        } else if (data && (data.status === 'invalid' || data.error === 'catalog_invalid')) {
          state.catalogErr = 'Une pièce ou un coloris du panier n’est plus disponible. Actualisez pour corriger le panier.';
        } else if (data && (data.status === 'coupon_changed' || data.error === 'coupon_changed')) {
          state.catalogErr = 'Le code promo n’est plus disponible pour cette commande. Retirez-le puis vérifiez explicitement le nouveau total avant de confirmer.';
        } else {
          state.cardErr = T('co.pay.cardErr');
        }
        render(); scrollTop();
      };
      try {
        fetch('zazu-checkout.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: o, text: orderText(o), _hp: '' }),
        }).then(function (r) { return r.json().catch(function () { return {}; }); }).then(function (d) {
          if (d && d.ok && d.url && d.order && Array.isArray(d.order.items)) {
            var acceptedOrder = d.order;
            try { sessionStorage.setItem('yza.zazu.order', JSON.stringify({ sessionId: d.id, o: acceptedOrder, t: orderText(acceptedOrder) })); } catch (e) {}
            try { if (YZA.track) YZA.track('add_payment_info', trackPayload(acceptedOrder)); } catch (e) {}
            try { if (YZA.analytics) YZA.analytics.track('card_payment_start', { number: acceptedOrder.number, total_cents: (acceptedOrder.totalDh || 0) * 100 }); } catch (e) {}
            location.href = window.yzaPreviewUrl(d.url);   // hand over to the hosted payment page
            return;
          }
          fail(d);
        }).catch(function () { fail(null); });
      } catch (e) { fail(null); }
    }

    function finishNonCardOrder(o) {
      setSubmitting(false);
      state.wa = 'https://wa.me/' + waDigits() + '?text=' + encodeURIComponent(orderText(o));
      try { if (YZA.analytics) YZA.analytics.track('order_placed', { method: state.method, items: (o.items || []).reduce(function (n, item) { return n + (item.qty || 0); }, 0), subtotal_cents: (o.subtotalDh || 0) * 100, total_cents: (o.totalDh || 0) * 100 }); } catch (e) {}
      try { if (YZA.track) { YZA.track('add_payment_info', trackPayload(o)); YZA.track('purchase', trackPayload(o)); } } catch (e) {}
      try { sessionStorage.setItem('yza.order.sent', String(Date.now())); } catch (e) {}
      try { sessionStorage.removeItem('yza.order.operation'); } catch (operationClearError) {}
      state.operationId = '';
      state.lastOrder = o;
      try { YZA.cart.clear(); } catch (e) {}
      state.step = 'done';
      render();
      window.open(state.wa, '_blank', 'noopener');
    }

    function placeOrder() {
      if (state.submitting || couponBusy) return;
      if (!YZA.cart.items.length) { state.step = 'cart'; render(); return; }
      if (state.repriceRevision && state.repriceRevision !== YZA.catalogRevision) {
        state.catalogErr = 'Le nouveau catalogue n\u2019a pas encore pu \u00eatre charg\u00e9. Le paiement reste bloqu\u00e9 pour ne pas confirmer un prix que vous n\u2019avez pas vu.';
        render(); scrollTop(); return;
      }
      if (destRegion() !== 'morocco' && state.method === 'cod') { state.method = 'card'; render(); return; }
      if (state.method === 'card') { placeCardOrder(); return; }
      setSubmitting(true);
      root.querySelectorAll('button,input,select,textarea').forEach(el => { el.disabled = true; });
      ensureOrderOperation();
      var o = buildOrder();
      state.catalogErr = '';
      var btn = root.querySelector('[data-place]');
      if (btn) btn.disabled = true;
      // The shared server validator is now the acceptance boundary for every method.
      // Mail/Woo failures remain non-fatal after `accepted:true`; catalogue failures do not.
      try {
        fetch((YZA.payment && YZA.payment.orderEndpoint) || 'order.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: o, text: orderText(o) }),
        }).then(function (r) { return r.json().catch(function () { return {}; }); }).then(function (d) {
          if (d && d.accepted && d.order && Array.isArray(d.order.items)) {
            if (!d.order.shipping) d.order.shipping = o.shipping;
            state.emailSent = d.cust === true;
            finishNonCardOrder(d.order); return;
          }
          setSubmitting(false);
          if (d && (d.status === 'reprice' || d.error === 'catalog_reprice')) {
            state.repriceRevision = d.currentRevision || '';
            state.catalogErr = 'Le catalogue a changé. Actualisez puis vérifiez le nouveau prix avant de confirmer.';
          } else if (d && (d.status === 'stock' || d.error === 'catalog_stock')) {
            state.catalogErr = 'La quantité disponible vient de changer. Le panier a été corrigé avec le stock actuel; vérifiez-le avant de confirmer.';
            Promise.resolve(YZA.refreshInventory?.()).then(function () { YZA.cart?.load?.(); YZA.cart?.refresh?.(); render(); });
          } else if (d && (d.status === 'invalid' || d.error === 'catalog_invalid')) {
            state.catalogErr = 'Une pièce ou un coloris du panier n’est plus disponible. Actualisez pour corriger le panier.';
          } else if (d && (d.status === 'coupon_changed' || d.error === 'coupon_changed')) {
            state.catalogErr = 'Le code promo n’est plus disponible pour cette commande. Retirez-le puis vérifiez explicitement le nouveau total avant de confirmer.';
          } else state.catalogErr = 'Impossible de vérifier le panier pour le moment. Réessayez.';
          render(); scrollTop();
        }).catch(function () { setSubmitting(false); state.catalogErr = 'Impossible de vérifier le panier pour le moment. Réessayez.'; render(); scrollTop(); });
      } catch (e) { setSubmitting(false); state.catalogErr = 'Impossible de vérifier le panier pour le moment. Réessayez.'; render(); }
    }

    // EUR amount (integer) from the DH total (net of discounts), for PayPal / IBAN.
    function eurAmt() {
      var rate = (PAY().eurRate) || 11;
      var canonicalDh = state.lastOrder && typeof state.lastOrder.totalDh === 'number'
        ? state.lastOrder.totalDh : (totals().grandTotalCents / 100);
      return Math.max(1, Math.round(canonicalDh / rate));
    }
    // Is a live PayPal path configured (paypal.me link OR receiver email)?
    function paypalReady() {
      var p = PAY();
      return !!(p.paypalLink || p.paypalEmail);
    }
    // Build a pre-filled PayPal payment URL for the current order (amount in EUR).
    function paypalPayUrl() {
      var p = PAY();
      var amt = eurAmt();
      var link = String(p.paypalLink || '').trim();
      if (link) {
        if (/^https?:\/\//i.test(link)) {
          return /paypal\.me/i.test(link) ? link.replace(/\/+$/, '') + '/' + amt + 'EUR' : link;
        }
        if (link.indexOf('@') === -1) return 'https://paypal.me/' + link.replace(/^@/, '') + '/' + amt + 'EUR';
      }
      var email = (link.indexOf('@') > -1 ? link : '') || p.paypalEmail || '';
      if (email) {
        return 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick' +
          '&business=' + encodeURIComponent(email) +
          '&currency_code=EUR&amount=' + amt +
          '&item_name=' + encodeURIComponent('YZA — commande') +
          '&no_shipping=1';
      }
      return '#';
    }

    function checkCardReturn() {
      if (!state.cardBound || !state.cardSession || !state.cardReturn) {
        state.cardPaid = 'unknown'; render(); return;
      }
      state.cardPaid = 'checking'; render();
      fetch('zazu-checkout.php?session=' + encodeURIComponent(state.cardSession), { cache: 'no-store' })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (d) {
          state.cardPaid = d && d.ok && (d.status === 'complete' || d.status === 'processing' || d.status === 'paid') ? 'yes' : 'unknown';
          if (state.cardPaid === 'yes' && state.lastOrder) {
            try { YZA.cart.clear(); } catch (cardClearError) {}
            try { if (YZA.track) YZA.track('purchase', trackPayload(state.lastOrder)); } catch (cardTrackError) {}
            try { if (YZA.analytics) YZA.analytics.track('card_payment_done', { number: state.orderNo }); } catch (cardAnalyticsError) {}
            try { sessionStorage.removeItem('yza.zazu.order'); } catch (cardStorageError) {}
            try { sessionStorage.removeItem('yza.order.operation'); } catch (cardOperationClearError) {}
            state.operationId = '';
            try { history.replaceState(null, '', window.yzaPreviewPath()); } catch (cardHistoryError) {}
          }
          render();
        })
        .catch(function () { state.cardPaid = 'unknown'; render(); });
    }

    // ---- events ----
    root.addEventListener('click', function (e) {
      if (state.submitting) { e.preventDefault(); return; }
      if (e.target.closest('[data-summary-toggle]')) { state.summaryOpen = !state.summaryOpen; render(); return; }
      var editShipping = e.target.closest('[data-edit-shipping]');
      if (editShipping) { state.step = 'shipping'; render(); root.querySelector('#' + editShipping.dataset.editShipping)?.focus(); return; }
      var next = e.target.closest('[data-next]');
      if (next) {
        var to = next.getAttribute('data-next');
        if (to === 'payment' && !collectShip()) return;      // validate shipping before payment
        if (to === 'payment') {
          try { if (YZA.track) YZA.track('add_shipping_info', trackPayload({})); } catch (e3) {}
          // Order bump: pick ONE low-ticket complement and freeze it (no reshuffle on re-renders).
          if (typeof state.bumpHandle === 'undefined') {
            var ob = YZA.promos && YZA.promos.orderBump;
            var pick = (ob && ob.enabled !== false && typeof YZA.cartSuggestions === 'function')
              ? YZA.cartSuggestions(YZA.cart.items, { limit: 1, maxPriceCents: (ob && ob.maxPriceCents) || 25000, categories: [(ob && ob.category) || 'charms'] })[0]
              : null;
            state.bumpHandle = pick ? pick.handle : null;
            if (state.bumpHandle) { try { YZA.analytics && YZA.analytics.track('order_bump_view', { handle: state.bumpHandle }); } catch (e4) {} }
          }
          // Reconcile: the bump line may have been deleted back in step 1.
          if (state.bumpOn && !YZA.cart.items.some(function (i) { return i.handle === state.bumpHandle && i.src === 'order_bump'; })) state.bumpOn = false;
        }
        if (state.step === 'shipping' && to !== 'cart') collectShip();
        state.step = to; render(); scrollTop(); root.querySelector('.co-h1')?.setAttribute('tabindex','-1'); root.querySelector('.co-h1')?.focus({preventScroll:true}); return;
      }
      var up = e.target.closest('[data-upsell-add]');
      if (up) {
        // Preserve anything typed in the shipping form across the re-render — silently
        // (no validation errors: the shopper is adding an item, not submitting yet).
        var sf = root.querySelector('#coShipForm');
        if (sf) { Array.prototype.forEach.call(sf.elements, function (el) { if (el.name && el.type !== 'radio' && el.type !== 'checkbox') state.ship[el.name] = el.value.trim(); }); saveShip(); }
        // Même règle que dans le tiroir : la carte « Complétez votre pièce » n'a pas de
        // sélecteur, elle montre le coloris par défaut — on l'enregistre au lieu de ''.
        var upH = up.getAttribute('data-upsell-add');
        var upVariant = (YZA.defaultVariantLabel && YZA.defaultVariantLabel(upH)) || '';
        var upProduct = YZA.getProduct(upH);
        var upSizeCode = upProduct && (upProduct.availableSizes || []).indexOf(upProduct.defaultSize) !== -1
          ? upProduct.defaultSize : (upProduct && (upProduct.availableSizes || []).length === 1 ? upProduct.availableSizes[0] : '');
        var added = YZA.cart.add(upH, upVariant, 1, { source: 'checkout_cross_sell', sizeCode: upSizeCode });
        YZA.cart.close();
        try { YZA.analytics && YZA.analytics.track('cross_sell_add', { handle: up.getAttribute('data-upsell-add'), source: 'checkout' }); } catch (e2) {}
        render();
        if (!added) { var message = document.createElement('p'); message.className = 'co-action-error'; message.setAttribute('role','alert'); message.textContent = C('unavailable'); root.querySelector('.checkout__main').prepend(message); }
        else root.querySelector('.co-line:last-child .co-line__name')?.focus();
        return;
      }
      var capply = e.target.closest('[data-coupon-apply]');
      if (capply) {
        var inp = root.querySelector('#co-coupon');
        var code = inp ? inp.value.trim().toUpperCase() : '';
        couponDraft = code;
        if (!code || couponBusy) return;
        /* Le champ e-mail est renseigne a l'etape livraison ; le coupon est nominatif, donc
           sans adresse on ne peut pas verifier qu'il n'a pas deja servi. On le dit
           clairement plutot que d'accepter puis de refuser au paiement. */
        var mail = (state.ship.email || '').trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
          couponOk = false; couponMsg = C('couponEmail'); render(); return;
        }
        var tt0 = totals();
        var autoDh = tt0.discounts.reduce(function (n, d) { return n + (d.id === 'coupon' ? 0 : Math.round(d.amountCents / 100)); }, 0);
        couponBusy = true; couponMsg = ''; render();
        fetch('coupon.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          /* Les REFERENCES du panier, pour les coupons « une piece offerte » : le serveur a
             besoin de savoir ce qu'il y a dedans pour trouver la piece eligible. On
             n'envoie aucun prix — il les relit dans son catalogue. */
          body: JSON.stringify({ code: code, email: mail, subtotalDh: Math.round(tt0.subtotalCents / 100),
                                 autoDiscountDh: autoDh, region: destRegion(), _hp: '',
                                 items: YZA.cart.items.map(function (i) { return { handle: i.handle }; }) }),
        }).then(function (r) { return r.json(); }).then(function (j) {
          couponBusy = false;
          if (j && j.ok) {
            YZA.cart.setCoupon(j.code, mail);
            couponOk = true; couponMsg = ''; couponDraft = '';
            try { YZA.analytics && YZA.analytics.track('coupon_applied', { code: j.code }); } catch (e2) {}
          } else {
            YZA.cart.clearCoupon();
            couponOk = false;
            var why = (j && j.reason) || 'invalid';
            couponMsg = why === 'min' ? YZA.i18n.tFmt('co.coupon.min', { n: (j && j.minDh) || 500 })
                      : why === 'used' ? T('co.coupon.used')
                      : why === 'rate' ? T('co.coupon.rate')
                      /* Refus propres aux coupons « une piece offerte » : dire pourquoi,
                         sinon une cliente qui a bien son code lit « code invalide » et
                         ecrit a Nawal. */
                      : why === 'expired' ? T('co.coupon.expired')
                      : why === 'closed' ? T('co.coupon.closed')
                      : why === 'noitem' ? T('co.coupon.noitem')
                      : why === 'notlisted' ? T('co.coupon.notlisted')
                      : T('co.coupon.invalid');
          }
          render();
        }).catch(function () {
          couponBusy = false; couponOk = false; couponMsg = T('co.coupon.invalid'); render();
        });
        return;
      }
      var crm = e.target.closest('[data-coupon-remove]');
      if (crm) { YZA.cart.clearCoupon(); couponMsg = ''; couponOk = false; couponDraft = ''; render(); return; }
      var back = e.target.closest('[data-back]');
      if (back) { if (state.step === 'shipping') collectShip(); state.step = back.getAttribute('data-back'); render(); scrollTop(); return; }
      var go = e.target.closest('[data-goto]');
      if (go) { if (state.step === 'shipping') collectShip(); state.step = go.getAttribute('data-goto'); render(); scrollTop(); root.querySelector('.co-h1')?.setAttribute('tabindex','-1'); root.querySelector('.co-h1')?.focus({preventScroll:true}); return; }
      var place = e.target.closest('[data-place]');
      if (place) { placeOrder(); scrollTop(); return; }
      var retryZazu = e.target.closest('[data-zazu-retry]');
      if (retryZazu) { checkCardReturn(); return; }
      var refreshCatalog = e.target.closest('[data-catalog-refresh]');
      if (refreshCatalog) {
        if (state.repriceRevision) try { sessionStorage.setItem('yza.catalog.reprice', state.repriceRevision); } catch (e6) {}
        location.reload(); return;
      }
      // Post-order add-on → WhatsApp "add to my parcel" + best-effort record. Button locks after.
      var addon = e.target.closest('[data-addon]');
      if (addon) {
        if (addon.disabled) return;
        var addonFeedback = function (message) {
          const status = addon.querySelector('[data-addon-status]');
          if (status) { status.hidden = false; status.textContent = message; }
        };
        var ah = addon.getAttribute('data-addon');
        var ap = YZA.getProduct(ah);
        if (ap && state.lastOrder) {
          var addonOperationKey = 'yza.addon.operation.' + String(state.lastOrder.number || '') + '.' + ah;
          var addonOperation = addon.getAttribute('data-operation-id') || '';
          if (!addonOperation) try { addonOperation = sessionStorage.getItem(addonOperationKey) || ''; } catch (addonLoadError) {}
          if (!/^[A-Za-z0-9_-]{20,100}$/.test(addonOperation)) addonOperation = newOperationId();
          addon.setAttribute('data-operation-id', addonOperation);
          try { sessionStorage.setItem(addonOperationKey, addonOperation); } catch (addonSaveError) {}
          var addonSizeCode = (ap.availableSizes || []).indexOf(ap.defaultSize) !== -1
            ? ap.defaultSize : ((ap.availableSizes || []).length === 1 ? ap.availableSizes[0] : '');
          var amsg = YZA.i18n.tFmt('co.addon.msg', { no: state.lastOrder.number, item: YZA.i18n.pick(ap.name), price: fmt(ap.price) });
          var addonWindow = window.open('', '_blank');
          try { if (addonWindow) addonWindow.opener = null; } catch (addonWindowError) {}
          try {
            fetch((YZA.payment && YZA.payment.orderEndpoint) || 'order.php', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'addon', order: { number: state.lastOrder.number, operationId: addonOperation, items: [{ handle: ah, baseHandle: ah, sizeCode: addonSizeCode, colorSlug: '', finishKey: YZA.finishKeyFor?.(ah, YZA.defaultVariantLabel?.(ah) || '') || '', releaseId: YZA.catalogRevision || '', qty: 1 }] }, text: amsg }),
            }).then(function (r) { return r.json().catch(function () { return {}; }); }).then(function (d) {
              if (!d || !d.accepted || !d.item) {
                try { if (addonWindow) addonWindow.close(); } catch (addonCloseError) {}
                addon.disabled = false; addonFeedback(C('addonError'));
                return;
              }
              var acceptedMsg = YZA.i18n.tFmt('co.addon.msg', { no: state.lastOrder.number, item: d.item.name, price: fmt(d.item.price) });
              try { if (YZA.track) YZA.track('post_order_addon', { value: d.item.price / 100, currency: 'MAD', items: [{ item_id: d.item.handle, item_name: d.item.name, quantity: 1, price: d.item.price / 100 }] }); } catch (e7) {}
              addonFeedback(T('co.addon.sent'));
              try { sessionStorage.removeItem(addonOperationKey); } catch (addonClearError) {}
              var acceptedUrl = 'https://wa.me/' + waDigits() + '?text=' + encodeURIComponent(acceptedMsg);
              if (addonWindow) addonWindow.location.href = acceptedUrl;
              else window.open(acceptedUrl, '_blank', 'noopener');
            }).catch(function () {
              try { if (addonWindow) addonWindow.close(); } catch (addonCloseError) {}
              addon.disabled = false; addonFeedback(C('addonError'));
            });
          } catch (e7) {
            try { if (addonWindow) addonWindow.close(); } catch (addonCloseError) {}
            addon.disabled = false; addonFeedback(C('addonError')); return;
          }
          addonFeedback(T('co.pay.cardWait')); addon.setAttribute('disabled', 'disabled');
        }
        return;
      }
      // cart qty / remove
      var rm = e.target.closest('[data-remove]');
      if (rm) { YZA.cart.remove(rm.getAttribute('data-handle'), rm.getAttribute('data-variant'), rm.getAttribute('data-color-slug'), rm.getAttribute('data-release-id'), rm.getAttribute('data-finish-key'), rm.getAttribute('data-size-code')); render(); return; }
      var qb = e.target.closest('.qty__btn');
      if (qb) {
        var q = qb.closest('.qty');
        var line = YZA.cart.items.find(function (i) { return i.handle === q.dataset.handle && (i.sizeCode || '') === (q.dataset.sizeCode || '') && (i.colorSlug || '') === (q.dataset.colorSlug || '') && (i.releaseId || '') === (q.dataset.releaseId || '') && (i.finishKey || '') === (q.dataset.finishKey || ''); });
        if (line && line.qty === 1 && qb.dataset.act === 'dec') { YZA.cart.remove(line.handle, line.variant, line.colorSlug, line.releaseId, line.finishKey, line.sizeCode); render(); return; }
        if (line) YZA.cart.setQty(q.dataset.handle, q.dataset.variant, line.qty + (qb.dataset.act === 'inc' ? 1 : -1), q.dataset.colorSlug, q.dataset.releaseId, q.dataset.finishKey, q.dataset.sizeCode);
        render(); return;
      }
      // copy bank detail
      var cp = e.target.closest('[data-copy]');
      if (cp) {
        var val = cp.getAttribute('data-copy');
        const failed = function () {
          const line = cp.closest('.pay-details__row');
          let notice = line.querySelector('.pay-copy-error');
          if (!notice) { notice = document.createElement('small'); notice.className = 'pay-copy-error'; notice.setAttribute('role','status'); line.appendChild(notice); }
          notice.textContent = C('payCopyError');
        };
        if (!navigator.clipboard?.writeText) { failed(); return; }
        navigator.clipboard.writeText(val).then(function () {
          cp.closest('.pay-details__row').querySelector('.pay-copy-error')?.remove();
          cp.textContent = T('co.pay.copied');
          setTimeout(function () { cp.textContent = T('co.pay.copy'); }, 1500);
        }).catch(failed);
        return;
      }
    });
    root.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-goto]')) { e.preventDefault(); e.target.click(); }
    });
    root.addEventListener('change', function (e) {
      if (state.submitting) return;
      if (e.target.matches('[data-remember]')) { rememberDetails = e.target.checked; saveShip(); return; }
      if (e.target.matches('[data-delivery-mode]')) { state.ship.deliveryMode = e.target.value === 'pickup' ? 'pickup' : 'delivery'; saveShip(); render(); return; }
      if (e.target.matches('[data-co-gift]')) { YZA.cart.setGift(e.target.checked); YZA.cart.refresh(); render(); if (YZA.cart.gift.enabled) root.querySelector('#coGiftMessage')?.focus(); return; }
      /* Le telephone est le champ OBLIGATOIRE du formulaire, l'e-mail est FACULTATIF —
         et pourtant seule une adresse valide declenchait une capture (captureCart plus
         bas rend la main si l'e-mail n'est pas valide, et cart-store-lib.php impose un
         e-mail dans le magasin). Une femme qui remplit exactement ce que la boutique
         exige, puis s'arrete, n'etait enregistree NULLE PART.
         On ecoute donc aussi le telephone — sur `change`, a la sortie du champ, et
         surtout PAS sur `input` : a chaque frappe les 9 derniers chiffres changent,
         donc la cle de deduplication de subscribe.php change aussi, et un numero en
         cours de saisie creerait jusqu'a quatre fiches injoignables — exactement le
         probleme de fiches enterrees que le commit 34d2de2 vient de corriger. */
      var shipField = e.target.closest('#coShipForm') && e.target.name;
      if (shipField === 'phone' || shipField === 'name') { capturePhone(); }
      var r = e.target.closest('input[name="pay"]');
      if (r) { state.method = r.value; render(); return; }
      // Destination drives the delivery tariff — re-render so the summary fee/total
      // and the free-shipping progress bar follow the country immediately.
      var cty = e.target.closest('select[name="country"]');
      if (cty) { state.ship.country = cty.value; if (destRegion() !== 'morocco' && state.method === 'cod') state.method = 'card'; saveShip(); render(); return; }
      // Order bump: check → add to cart; uncheck → decrement/remove. state.bumpOn is authoritative.
      var bump = e.target.closest('input[data-bump]');
      if (bump) {
        if (bump.checked && !state.bumpOn) {
          var bumpProduct = YZA.getProduct(state.bumpHandle);
          var bumpSizeCode = bumpProduct && (bumpProduct.availableSizes || []).indexOf(bumpProduct.defaultSize) !== -1
            ? bumpProduct.defaultSize : (bumpProduct && (bumpProduct.availableSizes || []).length === 1 ? bumpProduct.availableSizes[0] : '');
          var addedBump = YZA.cart.add(state.bumpHandle, '', 1, { source: 'order_bump', sizeCode: bumpSizeCode });
          state.bumpOn = !!addedBump;
          YZA.cart.close();
        } else if (!bump.checked && state.bumpOn) {
          var line = YZA.cart.items.find(function (i) { return i.handle === state.bumpHandle && i.src === 'order_bump'; });
          if (line && line.qty > 1) YZA.cart.setQty(state.bumpHandle, line.variant || '', line.qty - 1, line.colorSlug || '', line.releaseId || '', line.finishKey || '', line.sizeCode || '');
          else if (line) YZA.cart.remove(state.bumpHandle, line.variant || '', line.colorSlug || '', line.releaseId || '', line.finishKey || '', line.sizeCode || '');
          state.bumpOn = false;
        }
        try { YZA.analytics && YZA.analytics.track('order_bump_toggle', { handle: state.bumpHandle, on: state.bumpOn }); } catch (e5) {}
        render();
      }
    });
    root.addEventListener('input', function (e) {
      if (state.submitting) return;
      if (e.target.matches('[data-co-gift-note]')) { YZA.cart.setGift(YZA.cart.gift.enabled, e.target.value); const note = root.querySelector('.co-gift-summary p'); if (note) note.textContent = e.target.value; return; }
      if (e.target.id === 'coCouponEmail') { state.ship.email = e.target.value.trim(); saveShip(); return; }
      if (e.target.id === 'co-coupon') { couponDraft = e.target.value; return; }
      if (e.target.closest('#coShipForm') && e.target.name && e.target.type !== 'radio' && e.target.type !== 'checkbox') {
        validateField(e.target, false);
        state.ship[e.target.name] = e.target.value; saveShip();
        if (e.target.name === 'email') scheduleCapture();
      }
    });

    root.addEventListener('focusout', function (e) { if (e.target.closest('#coShipForm .co-field')) validateField(e.target, true); });

    // ---- abandoned-cart capture: once a valid email is typed at checkout we store
    // the pending cart server-side (cart-capture.php) so the recovery emails can go
    // out if the order isn't completed. order.php marks it purchased on checkout. ----
    /* Filet de securite quand la commande n'ira pas au bout et qu'aucun e-mail n'a ete
       laisse. subscribe.php accepte un telephone seul depuis le 12/08, deduplique sur
       les 9 derniers chiffres (le +212 6XX et le 06XX sont la meme personne) et rend la
       main avant la synchro Brevo et l'e-mail de bienvenue : la capture est donc
       SILENCIEUSE, rien ne part vers la cliente. On n'envoie pas `city` — la branche
       telephone-seul ne la lit jamais. */
    var capturedPhone = '';
    function capturePhone() {
      try {
        var tel = (state.ship.phone || '').trim();
        var digits = tel.replace(/\D/g, '');
        if (digits.length < 9 || digits.length > 15) return;   // memes bornes que subscribe.php:66
        var last9 = digits.slice(-9);
        if (last9 === capturedPhone) return;                   // deja envoye pour ce numero
        capturedPhone = last9;
        fetch('subscribe.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: '',
            phone: tel,
            name: (state.ship.name || '').trim(),
            lang: (window.YZA && YZA.i18n && YZA.i18n.lang) || 'fr',
            page: 'checkout',
            source: 'checkout'
          })
        }).catch(function () {});
      } catch (e6) {}
    }

    var captureTimer = null, capturedEmail = '';
    function scheduleCapture() {
      if (captureTimer) clearTimeout(captureTimer);
      captureTimer = setTimeout(captureCart, 900);
    }
    function captureCart() {
      try {
        var email = (state.ship.email || '').trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
        if (!YZA.cart.items.length) return;
        var key = email.toLowerCase() + '|' + YZA.cart.count();
        if (key === capturedEmail) return;   // don't re-post the same email+cart size
        capturedEmail = key;
        // On EXCLUT les lignes dont le coloris est epuise : cart-capture.php les remettrait
        // telles quelles dans l'e-mail de relance automatique (« 1x Jupe pareo midi
        // (Jaune Safran) »), et la boutique enverrait d'elle-meme un message qui redemande
        // d'acheter une couleur indisponible, avec un lien vers un bouton desactive.
        // C'est le seul envoi SORTANT et automatique de la chaine : il doit etre le plus
        // prudent. Si tout le panier est epuise, on n'enregistre rien du tout.
        var items = lines()
          .filter(function (it) { return !(YZA.jawharaVariantSoldOut && YZA.jawharaVariantSoldOut(it.handle, it.variant)); })
          .map(function (it) { return { name: it.name, qty: it.qty, variant: it.variant || '' }; });
        if (!items.length) return;
        fetch('cart-capture.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email, name: (state.ship.name || '').trim(), phone: (state.ship.phone || '').trim(),
            lang: YZA.i18n.lang || 'fr', total: Math.round(totals().grandTotalCents / 100), items: items, _hp: ''
          }),
        }).catch(function () {});
      } catch (e) {}
    }

    function scrollTop() { try { window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); } catch (e) { window.scrollTo(0, 0); } }

    // ---- return from the Zazu hosted payment page ----
    // ?zazu=paid&session=cs_… : instant feedback (server-side status check) + done screen.
    // ?zazu=cancel : back to the payment step with a soft message, cart untouched.
    // Fulfillment truth stays with the webhook; this only drives the UX.
    try {
      var zq = new URLSearchParams(location.search);
      var zFlag = zq.get('zazu');
      var zSid = zq.get('session') || '';
      if (zFlag === 'cancel') {
        try { history.replaceState(null, '', window.yzaPreviewPath()); } catch (e9) {}
        state.step = YZA.cart.items.length ? 'payment' : 'cart';
        state.method = 'card';
        state.cardErr = T('co.pay.cardCancel');
        var zCancelSaved = null;
        try { zCancelSaved = JSON.parse(sessionStorage.getItem('yza.zazu.order') || 'null'); } catch (e9) {}
        if (zSid && zCancelSaved && zCancelSaved.sessionId === zSid) {
          fetch('zazu-checkout.php?session=' + encodeURIComponent(zSid) + '&release_coupon=1', { cache: 'no-store' })
            .then(function (r) { if (r.ok) {
              try { sessionStorage.removeItem('yza.zazu.order'); sessionStorage.removeItem('yza.order.operation'); } catch (e9) {}
              state.operationId = ''; state.orderNo = '';
            } })
            .catch(function () {});
        }
      } else if (zFlag === 'paid' && zSid) {
        var zSaved = null;
        try { zSaved = JSON.parse(sessionStorage.getItem('yza.zazu.order') || 'null'); } catch (e9) {}
        var zBound = !!(zSaved && zSaved.sessionId === zSid && zSaved.o && Array.isArray(zSaved.o.items));
        state.cardSession = zSid;
        state.cardReturn = zBound ? zSaved : null;
        state.cardBound = zBound;
        state.lastOrder = zBound ? zSaved.o : null;
        state.orderNo = (state.lastOrder && state.lastOrder.number) || '';
        state.method = 'card';
        state.cardPaid = 'checking';
        state.step = 'done';
        if (zBound && zSaved.t) state.wa = 'https://wa.me/' + waDigits() + '?text=' + encodeURIComponent(zSaved.t);
        checkCardReturn();
      }
    } catch (e) {}

    // Deep-link: the drawer's "Passer au paiement" opens /checkout#shipping to skip the
    // cart-review step and land straight on the shipping/payment form (falls back to the
    // cart step when the basket is empty). "Voir mon panier" opens /checkout (cart step).
    try {
      var _hstep = (location.hash || '').replace('#', '');
      if ((_hstep === 'shipping' || _hstep === 'livraison') && YZA.cart.items.length) state.step = 'shipping';
    } catch (e) {}
    YZA.i18n.onChange(function () { render(); });
    document.addEventListener('yza:currencychange', function () { render(); });
    document.addEventListener('yza:cartchange', function () {
      if (state.step === 'done' || !document.getElementById('cartDrawer')?.classList.contains('is-open')) return;
      // A drawer edit must update the checkout summary without losing address input.
      var sf = root.querySelector('#coShipForm');
      if (sf) {
        Array.prototype.forEach.call(sf.elements, function (el) { if (el.name && el.type !== 'radio' && el.type !== 'checkbox') state.ship[el.name] = el.value.trim(); });
        saveShip();
      }
      render();
    });
    render();
    try { if (YZA.track && YZA.cart.items.length) YZA.track('begin_checkout', trackPayload({})); } catch (e) {}
  }
}());
