/* ============================================================
   YZA — PANIER (localStorage)
   API : add / remove / setQty / count / subtotal + drawer.
   Branchable plus tard sur Shopify/Stripe (remplacer checkout()).
   ============================================================ */
window.YZA = window.YZA || {};

const KEY = 'yza.cart';
/* Le coupon vit a cote du panier, pas dedans : une ligne de panier est une piece, un
   coupon est un etat du panier. Persiste pour survivre au rechargement — le tunnel
   recharge la page a chaque etape. */
const COUPON_KEY = 'yza.coupon';
const GIFT_KEY = 'yza.cart.gift';
const validReleaseId = (value) => /^[a-z0-9][a-z0-9._-]{7,79}$/.test(String(value || ''));

// Escape any cart value before it goes into innerHTML (defence-in-depth: the variant
// string is read from localStorage, so never trust it as markup).
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const formatMad = (cents) => {
  if (YZA.currency && typeof YZA.currency.format === 'function') return YZA.currency.format(cents, 'MAD');
  const lang = YZA.i18n?.lang || 'fr';
  const amount = Math.round((Number(cents) || 0) / 100);
  const rendered = new Intl.NumberFormat(({ fr: 'fr-MA', en: 'en-GB', es: 'es-ES', tr: 'tr-TR', ar: 'ar-MA' })[lang] || 'fr-MA', { maximumFractionDigits: 0, numberingSystem: 'latn' }).format(amount);
  return `${rendered} ${lang === 'ar' ? 'درهم' : 'DH'}`;
};


const drawerCopy = {
  fr: { gift: 'Emballage cadeau et mot écrit à la main', free: 'Offert', message: 'Votre mot (facultatif · 200 caractères)', subtotal: 'Sous-total', continue: 'Continuer mes achats', shipping: 'Frais de livraison calculés à l’étape suivante. Retrait au studio possible à Guéliz.', unlocked: 'Livraison offerte au Maroc — c’est acquis.', repair: 'Réparé à vie à l’atelier', secure: 'Paiement sécurisé', returns: '30 jours pour changer d’avis', help: 'Une question ?', delivery: 'Livraison & retours', removed: 'Pièce retirée du panier.', undo: 'Annuler', unavailable: 'Cette pièce n’est plus disponible dans cette quantité.', emptyTitle: 'Votre prochaine histoire commence ici.', emptyText: 'Découvrez nos pièces faites main, à partir de {price}.', emptyCta: 'Découvrir les Best Sellers', increase: 'Augmenter la quantité', decrease: 'Diminuer la quantité', add: 'Ajouter', choose: 'Choisir', handmade: 'Fait main à Marrakech', giftNote: 'Mot cadeau', added: 'Pièce ajoutée au panier.' },
  en: { gift: 'Gift wrapping and a handwritten note', free: 'Complimentary', message: 'Your note (optional · 200 characters)', subtotal: 'Subtotal', continue: 'Continue shopping', shipping: 'Shipping calculated at the next step. Studio pickup available in Guéliz.', unlocked: 'Free delivery in Morocco — unlocked.', repair: 'Lifetime atelier repairs', secure: 'Secure payment', returns: '30 days to change your mind', help: 'A question?', delivery: 'Delivery & returns', removed: 'Item removed from your bag.', undo: 'Undo', unavailable: 'This quantity is no longer available.', emptyTitle: 'Your next story starts here.', emptyText: 'Discover our handmade pieces, from {price}.', emptyCta: 'Discover Best Sellers', increase: 'Increase quantity', decrease: 'Decrease quantity', add: 'Add', choose: 'Choose', handmade: 'Handmade in Marrakech', giftNote: 'Gift note', added: 'Item added to your bag.' },
  es: { gift: 'Envoltorio de regalo y nota manuscrita', free: 'Gratis', message: 'Tu nota (opcional · 200 caracteres)', subtotal: 'Subtotal', continue: 'Seguir comprando', shipping: 'Envío calculado en el siguiente paso. Recogida en el estudio de Guéliz.', unlocked: 'Envío gratis en Marruecos — conseguido.', repair: 'Reparación de por vida', secure: 'Pago seguro', returns: '30 días para cambiar de opinión', help: '¿Una pregunta?', delivery: 'Envíos y devoluciones', removed: 'Pieza eliminada del carrito.', undo: 'Deshacer', unavailable: 'Esta cantidad ya no está disponible.', emptyTitle: 'Tu próxima historia empieza aquí.', emptyText: 'Descubre nuestras piezas hechas a mano, desde {price}.', emptyCta: 'Descubrir Best Sellers', increase: 'Aumentar cantidad', decrease: 'Reducir cantidad', add: 'Añadir', choose: 'Elegir', handmade: 'Hecho a mano en Marrakech', giftNote: 'Nota de regalo', added: 'Pieza añadida al carrito.' },
  tr: { gift: 'Hediye paketi ve el yazısı not', free: 'Ücretsiz', message: 'Notunuz (isteğe bağlı · 200 karakter)', subtotal: 'Ara toplam', continue: 'Alışverişe devam et', shipping: 'Kargo sonraki adımda hesaplanır. Guéliz stüdyosundan teslim alınabilir.', unlocked: 'Fas’ta ücretsiz teslimat hakkı kazandınız.', repair: 'Atölyede ömür boyu onarım', secure: 'Güvenli ödeme', returns: '30 gün iade hakkı', help: 'Bir sorunuz mu var?', delivery: 'Teslimat ve iadeler', removed: 'Ürün sepetten çıkarıldı.', undo: 'Geri al', unavailable: 'Bu miktar artık mevcut değil.', emptyTitle: 'Yeni hikâyeniz burada başlıyor.', emptyText: '{price} başlayan fiyatlarla el yapımı parçalarımızı keşfedin.', emptyCta: 'Best Sellers keşfet', increase: 'Adedi artır', decrease: 'Adedi azalt', add: 'Ekle', choose: 'Seç', handmade: 'Marakeş’te el yapımı', giftNote: 'Hediye notu', added: 'Ürün sepete eklendi.' },
  ar: { gift: 'تغليف هدية ورسالة مكتوبة بخط اليد', free: 'مجاناً', message: 'رسالتك (اختياري · 200 حرف)', subtotal: 'المجموع الفرعي', continue: 'متابعة التسوق', shipping: 'تُحسب رسوم التوصيل في الخطوة التالية. يمكن الاستلام من استوديو كيليز.', unlocked: 'التوصيل داخل المغرب مجاني الآن.', repair: 'إصلاح مدى الحياة في الورشة', secure: 'دفع آمن', returns: '30 يوماً لتغيير رأيك', help: 'لديك سؤال؟', delivery: 'التوصيل والإرجاع', removed: 'تمت إزالة القطعة من السلة.', undo: 'تراجع', unavailable: 'هذه الكمية لم تعد متوفرة.', emptyTitle: 'قصتك القادمة تبدأ هنا.', emptyText: 'اكتشفي قطعنا المصنوعة يدوياً، ابتداءً من {price}.', emptyCta: 'اكتشفي Best Sellers', increase: 'زيادة الكمية', decrease: 'تقليل الكمية', add: 'إضافة', choose: 'اختيار', handmade: 'صنع يدوياً في مراكش', giftNote: 'رسالة الهدية', added: 'تمت إضافة القطعة إلى السلة.' }
};

const cart = {
  items: [],
  gift: { enabled: false, message: '' },
  copy(key) { return (drawerCopy[YZA.i18n?.lang] || drawerCopy.fr)[key] || ''; },
  loadGift() {
    try {
      const v = JSON.parse(localStorage.getItem(GIFT_KEY));
      this.gift = { enabled: v?.enabled === true, message: typeof v?.message === 'string' ? v.message.slice(0, 200) : '' };
    } catch (e) { this.gift = { enabled: false, message: '' }; }
  },
  setGift(enabled, message = this.gift.message) {
    this.gift = { enabled: enabled === true, message: String(message || '').slice(0, 200) };
    try { localStorage.setItem(GIFT_KEY, JSON.stringify(this.gift)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('yza:cartchange'));
  },
  orderGift() { return { enabled: this.gift.enabled, message: this.gift.enabled ? this.gift.message.trim() : '' }; },
  undoRemoval() {
    const i = this._removed;
    if (!i) return;
    // Re-use the same inventory/variant guards as a normal add. Never restore raw storage.
    const restored = this.add(i.handle, i.variant, i.qty, { ...i, source: i.src || 'cart_undo' });
    this._removed = null;
    this.refresh();
    const notice = document.querySelector('[data-cart-notice]');
    if (!restored && notice) {
      notice.hidden = false;
      notice.querySelector('[data-cart-notice-text]').textContent = this.copy('unavailable');
      notice.querySelector('[data-cart-undo]').hidden = true;
    }
    document.getElementById('cartClose')?.focus({ preventScroll: true });
  },
  removeWithUndo(i) {
    this._removed = { ...i };
    this.remove(i.handle, i.variant, i.colorSlug, i.releaseId, i.finishKey, i.sizeCode);
    document.querySelector('[data-cart-undo]')?.focus({ preventScroll: true });
  },
  load() {
    try {
      // A missing/invalid generated release must fail closed without erasing the visitor's
      // saved basket: a refresh can recover it once the static release is available again.
      if (!YZA.catalogReleaseReady || !YZA.catalogRevision) { this.items = []; return; }
      const parsed = JSON.parse(localStorage.getItem(KEY)) || [];
      const source = Array.isArray(parsed) ? parsed : [];
      let changed = false;
      this.items = source.map((line) => {
        if (!line || !line.handle) { changed = true; return null; }
        const handle = String(line.handle);
        const product = YZA.getProduct?.(handle);
        if (!product) { changed = true; return null; }
        if (Object.prototype.hasOwnProperty.call(line, 'variant') && typeof line.variant !== 'string') { changed = true; return null; }
        const variant = String(line.variant || '');
        if (Object.prototype.hasOwnProperty.call(line, 'sizeCode') && typeof line.sizeCode !== 'string') { changed = true; return null; }
        const storedSizeCode = String(line.sizeCode || '');
        const hasSizes = Array.isArray(product.availableSizes) && product.availableSizes.length > 0;
        const sizeCode = String(YZA.sizeCodeFor?.(product, storedSizeCode, variant) || '');
        // Released size codes are fulfillment identity. Old exact labels migrate;
        // ambiguous multi-size lines and forged codes leave the cart.
        if ((hasSizes && !sizeCode) || (!hasSizes && storedSizeCode)) { changed = true; return null; }
        const storedFinishKey = String(line.finishKey || '');
        const hasFinishOptions = Array.isArray(product.finishOptions);
        const finishKey = String(YZA.finishKeyFor?.(handle, storedFinishKey || variant) || '');
        // Legacy charm lines stored a translated finish in `variant` (or nothing for
        // the raffia loop). Resolve it once to the immutable key; unknown/disabled
        // choices fail closed instead of silently becoming a different finish.
        if ((hasFinishOptions && !finishKey) || (!hasFinishOptions && storedFinishKey)) { changed = true; return null; }
        const storedColor = String(line.colorSlug || '');
        const colorSlug = String(YZA.colorSlugFor?.(handle, storedColor || variant) || '');
        const requiresColor = !!YZA.productRequiresColor?.(handle);
        // Old localized labels migrate only when they resolve to one canonical slug.
        // Required-but-ambiguous colours, current sold-outs and unpublished products leave
        // the basket before checkout rather than disabling validation for every other line.
        if ((requiresColor && !colorSlug) || (!requiresColor && storedColor)) { changed = true; return null; }
        if (colorSlug && YZA.catalogColorSoldOut?.(handle, colorSlug)) { changed = true; return null; }
        const qty = Number(line.qty);
        if (!Number.isInteger(qty) || qty < 1 || qty > 99) { changed = true; return null; }
        const storedReleaseId = String(line.releaseId || '');
        if (storedReleaseId && !validReleaseId(storedReleaseId)) { changed = true; return null; }
        // A full page reload renders current catalog prices, so migrate persisted
        // lines to that same revision. Already-open tabs keep their in-memory
        // release/price and can still receive the two-hour server grace.
        const releaseId = String(YZA.catalogRevision);
        if (storedReleaseId !== releaseId || colorSlug !== String(line.colorSlug || '')
          || finishKey !== storedFinishKey || sizeCode !== storedSizeCode) changed = true;
        return {
          handle,
          variant,
          sizeCode,
          colorSlug,
          ...(finishKey ? { finishKey } : {}),
          releaseId,
          qty,
          ...(line.src ? { src: String(line.src) } : {}),
        };
      }).filter(Boolean);
      // Reconcile only exact public counts (0..5). A value of 6 means "6+" and the
      // checkout server remains the authority for larger baskets and races.
      const remainingByHandle = Object.create(null);
      this.items = this.items.map((line) => {
        const shown = YZA.effectiveInventory?.(line.handle);
        if (!Number.isInteger(shown) || shown >= 6) return line;
        if (!Object.prototype.hasOwnProperty.call(remainingByHandle, line.handle)) remainingByHandle[line.handle] = shown;
        const allowed = Math.min(line.qty, Math.max(0, remainingByHandle[line.handle]));
        remainingByHandle[line.handle] -= allowed;
        if (allowed <= 0) { changed = true; return null; }
        if (allowed !== line.qty) { changed = true; return { ...line, qty: allowed }; }
        return line;
      }).filter(Boolean);
      if (changed || this.items.length !== source.length) localStorage.setItem(KEY, JSON.stringify(this.items));
    } catch (e) { this.items = []; }
  },
  save() {
    localStorage.setItem(KEY, JSON.stringify(this.items));
    this.refresh();
    // Lets non-drawer surfaces (PDP free-ship line…) stay honest as the cart changes.
    try { document.dispatchEvent(new CustomEvent('yza:cartchange')); } catch (e) {}
  },
  _key(handle, variant, colorSlug, releaseId, finishKey, sizeCode) {
    // Localized `variant` is presentation only. Structured choices are stable.
    return [handle, sizeCode || '', colorSlug || '', releaseId || '', finishKey || ''].join('|');
  },
  // Empty the cart (called after an order is placed so the buyer isn't left staring
  // at a full cart that looks unpaid). save() refreshes the badge/drawer + fires yza:cartchange.
  clear() { this.items = []; this._removed = null; this.setGift(false, ''); this.save(); },

  // meta.source tags where the add came from (pdp / quick_add / bundle / cart_cross_sell /
  // checkout_cross_sell / order_bump …) — attach rates are then counted from orders.
  add(handle, variant = '', qty = 1, meta = {}) {
    // Dernier verrou avant le panier. Les surfaces d'achat (fiche, achat rapide) verifient
    // deja, mais elles verifient un SLUG ; ici on ne dispose que du libelle affiche, d'ou
    // le resolveur inverse. Un panier enregistre AVANT qu'un coloris passe en epuise
    // survit dans localStorage et ne repasserait par aucune de ces surfaces.
    const product = YZA.getProduct?.(handle);
    if (!product || !YZA.catalogReleaseReady || !YZA.catalogRevision) return null;
    if (Object.prototype.hasOwnProperty.call(meta, 'sizeCode') && typeof meta.sizeCode !== 'string') return null;
    const suppliedSizeCode = typeof meta.sizeCode === 'string' ? meta.sizeCode : '';
    const hasSizes = Array.isArray(product.availableSizes) && product.availableSizes.length > 0;
    const sizeCode = String(YZA.sizeCodeFor?.(product, suppliedSizeCode, String(variant || '')) || '');
    if ((hasSizes && !sizeCode) || (!hasSizes && suppliedSizeCode)) return null;
    const hasFinishOptions = Array.isArray(product.finishOptions);
    const suppliedFinish = Object.prototype.hasOwnProperty.call(meta, 'finishKey') ? meta.finishKey : variant;
    const finishKey = String(YZA.finishKeyFor?.(handle, suppliedFinish) || '');
    if ((hasFinishOptions && !finishKey) || (!hasFinishOptions && meta.finishKey)) return null;
    const rawColor = String(meta.colorSlug || variant || '');
    const colorSlug = String(YZA.colorSlugFor?.(handle, rawColor) || '');
    const requiresColor = !!YZA.productRequiresColor?.(handle);
    if ((requiresColor && !colorSlug) || (!requiresColor && Object.prototype.hasOwnProperty.call(meta, 'colorSlug') && meta.colorSlug)) return null;
    if ((colorSlug && YZA.catalogColorSoldOut?.(handle, colorSlug)) || YZA.jawharaVariantSoldOut?.(handle, variant)) return null;
    qty = Number(qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return null;
    const publicAvailable = YZA.effectiveInventory?.(handle);
    const alreadyInCart = this.items.reduce((sum, item) => sum + (item.handle === handle ? Number(item.qty || 0) : 0), 0);
    // The public projection returns exact counts only from 0..5; 6 means "6 or more".
    // It is an early UX guard only. The server reserves/decrements the exact quantity.
    if (publicAvailable !== null && publicAvailable < 6 && alreadyInCart + qty > publicAvailable) return null;
    const releaseId = String(meta.releaseId || YZA.catalogRevision);
    if (!validReleaseId(releaseId)) return null;
    const k = this._key(handle, variant, colorSlug, releaseId, finishKey, sizeCode);
    let line = this.items.find(i => this._key(i.handle, i.variant, i.colorSlug, i.releaseId, i.finishKey, i.sizeCode) === k);
    if (line) { line.qty = Math.min(99, line.qty + qty); if (meta.source && !line.src) line.src = meta.source; }
    else { line = { handle, variant, sizeCode, colorSlug, ...(finishKey ? { finishKey } : {}), releaseId, qty }; if (meta.source) line.src = meta.source; this.items.push(line); }
    this.save();
    YZA.analytics?.track('add_to_cart', {
      handle,
      variant,
      sizeCode,
      finishKey,
      qty,
      category: product?.category || '',
      familyHandle: product?.familyHandle || '',
      price: product?.price || 0,
      source: meta.source || 'pdp',
    });
    // Ad platforms (GA4/Meta/TikTok via tracking.js) — standard add_to_cart.
    try {
      YZA.track?.('add_to_cart', {
        value: ((product?.price || 0) * qty) / 100,
        currency: 'MAD',
        items: [{ item_id: handle, item_name: YZA.i18n?.pick?.(product?.name) || handle, item_variant: variant || '', quantity: qty, price: (product?.price || 0) / 100, item_list_name: meta.source || 'pdp' }],
      });
    } catch (e) {}
    return line;
  },
  remove(handle, variant, colorSlug, releaseId, finishKey, sizeCode) {
    const k = this._key(handle, variant, colorSlug, releaseId, finishKey, sizeCode);
    this.items = this.items.filter(i => this._key(i.handle, i.variant, i.colorSlug, i.releaseId, i.finishKey, i.sizeCode) !== k);
    this.save();
  },
  setQty(handle, variant, qty, colorSlug, releaseId, finishKey, sizeCode) {
    const line = this.items.find(i => this._key(i.handle, i.variant, i.colorSlug, i.releaseId, i.finishKey, i.sizeCode) === this._key(handle, variant, colorSlug, releaseId, finishKey, sizeCode));
    if (!line) return;
    // Le « + » du tiroir passe par ici : sans ce test on pouvait encore AUGMENTER la
    // quantite d'une ligne devenue indisponible. Diminuer reste permis, evidemment.
    qty = Number(qty);
    if (!Number.isInteger(qty)) return;
    if (qty > line.qty && ((line.colorSlug && YZA.catalogColorSoldOut?.(handle, line.colorSlug)) || YZA.jawharaVariantSoldOut?.(handle, variant))) return;
    const publicAvailable = YZA.effectiveInventory?.(handle);
    const otherQty = this.items.reduce((sum, item) => sum + (item !== line && item.handle === handle ? Number(item.qty || 0) : 0), 0);
    if (qty > line.qty && publicAvailable !== null && publicAvailable < 6 && otherQty + qty > publicAvailable) return;
    line.qty = Math.max(1, Math.min(99, qty));
    this.save();
  },
  count() { return this.items.reduce((n, i) => n + i.qty, 0); },
  subtotalCents() {
    return this.items.reduce((s, i) => {
      const p = YZA.getProduct(i.handle);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  },

  // ---- Derived money spine — computed on every read, NEVER stored. Every surface
  // that shows an amount (drawer, checkout summary, WhatsApp text, order.php payload,
  // ad pixels) reads THIS, so the figures can't drift apart. ----
  /* ---- COUPON --------------------------------------------------------------
     Le code saisi n'est QU'UNE INTENTION : il ne devient un droit que quand le serveur
     l'a valide (coupon.php) et, au moment de la commande, qu'il n'a pas deja servi.
     Ici on ne fait que le calcul d'affichage — le serveur recalcule tout de son cote et
     refuse la commande si les deux ne tombent pas d'accord. Ne JAMAIS considerer ce
     calcul comme faisant autorite sur le montant debite. */
  coupon: null,
  loadCoupon() {
    try {
      const v = JSON.parse(localStorage.getItem(COUPON_KEY));
      this.coupon = (v && v.code && YZA.coupons && YZA.coupons[v.code]) ? v : null;
    } catch (e) { this.coupon = null; }
    return this.coupon;
  },
  saveCoupon() {
    try {
      if (this.coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(this.coupon));
      else localStorage.removeItem(COUPON_KEY);
    } catch (e) { /* navigation privee : le coupon ne survivra pas, tant pis */ }
  },
  setCoupon(code, email) {
    const def = code ? (YZA.coupons || {})[String(code).trim().toUpperCase()] : null;
    this.coupon = def ? { code: def.code, email: (email || '').trim().toLowerCase() } : null;
    this.saveCoupon();
    document.dispatchEvent(new CustomEvent('yza:cartchange'));
    return this.coupon;
  },
  clearCoupon() { return this.setCoupon(null); },
  /* Le coupon s'applique-t-il a CE panier ? Renvoie la definition, ou null.
     Le seuil se mesure sur le SOUS-TOTAL BRUT : c'est le panier compose qui ouvre le
     droit. Mesurer apres les remises automatiques ferait perdre le coupon a une cliente
     qui a justement achete trois charms. */
  /* Le libelle d'une remise : le coupon porte son code, les paliers charms leur nombre.
     Sans ca, les quatre endroits qui affichent une remise interpolaient en dur
     `promo.charmTier.label` avec d.meta.count — un coupon s'y serait affiche
     « Remise charms x undefined », dans le tiroir, le message WhatsApp, l'e-mail de
     commande ET le nom de la ligne de frais WooCommerce. */
  discountLabel(d) {
    if (!d) return '';
    /* Un coupon « piece offerte » n'a pas de pourcentage : sans ce garde-fou il s'afficherait
       « CHARMY −0% » dans le tiroir, le message WhatsApp, l'e-mail de commande ET la ligne
       de frais WooCommerce. Son seul code suffit — le montant est deja affiche a cote. */
    if (d.id === 'coupon') return (d.meta && d.meta.pct) ? d.code + ' −' + d.meta.pct + '%' : d.code;
    return (YZA.i18n && YZA.i18n.tFmt) ? YZA.i18n.tFmt('promo.charmTier.label', { n: d.meta.count }) : '';
  },
  /* La valeur de la piece offerte, en CENTIMES (comme tous les prix cote navigateur ;
     le serveur, lui, raisonne en DH entiers — ne pas confondre les deux).
     Meme regle que yza_coupon_free_item_dh() cote serveur : la MOINS CHERE des pieces
     eligibles, plafonnee. Les lots (`bundle`) sont exclus — le serveur ne les connait pas,
     puisque data/products-seo.json ne liste que les pieces a l'unite ; les inclure ici
     ferait annoncer une remise que le serveur refuserait ensuite. */
  freeItemCents(def) {
    if (!def || !def.freeItemCategory) return 0;
    let best = 0;
    this.items.forEach((i) => {
      const p = YZA.getProduct(i.handle);
      if (!p || p.category !== def.freeItemCategory || p.bundle || !(p.price > 0)) return;
      if (best === 0 || p.price < best) best = p.price;
    });
    const cap = Math.round((def.freeItemMaxDh || 0) * 100);
    if (cap > 0 && best > cap) best = cap;
    return best;
  },
  couponDef() {
    if (!this.coupon || !this.items.length) return null;
    const def = (YZA.coupons || {})[this.coupon.code];
    if (!def) return null;
    /* Date de fin : passee, on cesse d'afficher la remise. Le serveur refuserait de toute
       facon, autant ne pas promettre un total qu'on ne tiendra pas. */
    if (def.expiresAt && Date.now() > Date.parse(def.expiresAt)) return null;
    return this.subtotalCents() >= Math.round((def.minDh || 0) * 100) ? def : null;
  },

  pricing() {
    const subtotal = this.subtotalCents();
    const discounts = [];
    const cfg = YZA.promos?.charmTiers;
    if (cfg?.enabled) {
      let count = 0;
      let charmSubtotal = 0;
      this.items.forEach((i) => {
        const p = YZA.getProduct(i.handle);
        if (!p || p.category !== (cfg.category || 'charms') || p.bundle) return; // trio bundles keep their own pricing
        count += i.qty;
        charmSubtotal += p.price * i.qty;
      });
      const tier = (cfg.tiers || []).filter(tr => count >= tr.min).sort((a, b) => b.min - a.min)[0];
      if (tier && charmSubtotal > 0) {
        // Rounded to WHOLE DH at the source: drawer/checkout/WhatsApp/Woo/GA4 all show the same integer.
        const amount = Math.round((charmSubtotal * tier.pct) / 100 / 100) * 100;
        if (amount > 0) discounts.push({ id: 'charmTier', amountCents: amount, meta: { count, pct: tier.pct } });
      }
    }
    /* Le coupon se calcule sur le sous-total DEDUCTION FAITE des remises automatiques :
       10% de ce qui reste a payer, pas 10% du prix affiche. Sinon deux remises se
       cumuleraient sur la meme base et la boutique paierait deux fois. */
    const autoCents = discounts.reduce((s, d) => s + d.amountCents, 0);
    const cdef = this.couponDef();
    if (cdef) {
      const base = Math.max(0, subtotal - autoCents);
      /* Deux mecaniques, jamais les deux : soit une piece offerte, soit un pourcentage.
         Bornees a `base` pour qu'aucun coupon ne puisse rendre un total negatif. */
      const amount = cdef.freeItemCategory
        ? Math.min(this.freeItemCents(cdef), base)
        : Math.min(Math.round(base * (cdef.pct / 100)), base);
      if (amount > 0) discounts.push({ id: 'coupon', code: cdef.code, amountCents: amount, meta: { pct: cdef.pct } });
    }
    const discountCents = discounts.reduce((s, d) => s + d.amountCents, 0);
    return { subtotalCents: subtotal, discounts, discountCents, totalCents: Math.max(0, subtotal - discountCents) };
  },
  totalCents() { return this.pricing().totalCents; },
  // How many tier-eligible charms are in the cart (for the "add a 3rd" nudge line).
  charmTierCount() {
    const cfg = YZA.promos?.charmTiers;
    if (!cfg?.enabled) return 0;
    return this.items.reduce((n, i) => {
      const p = YZA.getProduct(i.handle);
      return n + ((p && p.category === (cfg.category || 'charms') && !p.bundle) ? i.qty : 0);
    }, 0);
  },

  // ---- Shared free-shipping math (drawer bar, checkout summary, PDP line, nudges).
  // assumeItems: virtual extra items — e.g. the PDP product before it's added. ----
  shippingProgress(opts = {}) {
    const assumed = opts.assumeItems || [];
    const all = this.items.concat(assumed);
    const allAccessories = all.length > 0 && all.every((i) => {
      const p = YZA.getProduct?.(i.handle);
      return p && p.group === 'accessories';
    });
    const threshold = allAccessories
      ? (YZA.servicePolicy?.freeShippingAccessoriesDh || 50000)
      : (YZA.servicePolicy?.freeShippingDh || 150000);
    const assumedCents = assumed.reduce((s, i) => {
      const p = YZA.getProduct?.(i.handle);
      return s + (p ? p.price * (i.qty || 1) : 0);
    }, 0);
    // What the customer actually pays (post-discount) — honest + consistent everywhere.
    // MAIS le coupon est exclu de ce calcul : le franco se gagne sur le panier COMPOSE.
    // Sinon appliquer un code de -10% faisait RECULER la barre et pouvait re-verrouiller
    // le port offert Europe (250 EUR) / USA (350 EUR) : la cliente saisit une remise et
    // voit 25 EUR de livraison apparaitre — son total ne baisse presque pas. Les remises
    // automatiques (paliers charms) restent deduites, elles, comme c'etait deja le cas.
    const _pr = this.pricing();
    const _couponCents = (_pr.discounts.find((d) => d && d.id === 'coupon') || {}).amountCents || 0;
    const paid = _pr.totalCents + _couponCents + assumedCents;
    const remaining = Math.max(0, threshold - paid);
    return {
      thresholdCents: threshold,
      paidCents: paid,
      remainingCents: remaining,
      pct: Math.max(0, Math.min(100, Math.round((paid / threshold) * 100))),
      allAccessories,
      unlocked: remaining === 0 && all.length > 0,
    };
  },

  // Region-aware shipping quote (MAD-cents). Morocco uses the native accessory/bag tiers;
  // Europe & USA/Gulf convert the EUR thresholds/fees at the live display rate; anything
  // else is quoted after the order. `region` defaults to the visitor's timezone region.
  shippingQuote(region, opts = {}) {
    region = region || (YZA.geo && YZA.geo.fromTimezone ? YZA.geo.fromTimezone() : 'other');
    const sp = YZA.shippingPolicy || {};
    const prog = this.shippingProgress(opts);
    // Fixed checkout settlement rate; catalog-order-lib.php uses the same 11 DH/EUR.
    // Display-currency rates can refresh independently and must not change delivery money.
    const eurToCents = (e) => Math.round((Number(e) || 0) * ((YZA.payment && YZA.payment.eurRate) || 11) * 100);
    if (region === 'europe' || region === 'usa_gcc') {
      const cfg = sp[region] || {};
      const freeCents = eurToCents(cfg.freeEur);
      return {
        region, quoteOnly: false,
        feeCents: eurToCents(cfg.feeEur),
        freeThresholdCents: freeCents,
        unlocked: prog.paidCents >= freeCents,
        etaKey: cfg.etaKey || null,
        paidCents: prog.paidCents,
      };
    }
    if (region === 'morocco') {
      const m = sp.morocco || {};
      /* Le coupon ouvre le port offert au Maroc, meme si le panier n'atteint pas le seuil
         habituel — et il le garde meme quand la remise fait repasser le total en dessous.
         C'est voulu : le droit s'acquiert sur le panier compose, il ne se retire pas
         parce qu'on vient d'accorder une remise. */
      const cdef = this.couponDef();
      const couponFree = !!(cdef && (cdef.freeShipRegions || []).indexOf('morocco') !== -1);
      return {
        region, quoteOnly: false,
        feeCents: Math.round((m.feeDh || 50) * 100),
        freeThresholdCents: prog.thresholdCents,
        unlocked: prog.unlocked || couponFree,
        couponFree,
        etaKey: null,
        paidCents: prog.paidCents,
        allAccessories: prog.allAccessories,
      };
    }
    return { region: 'other', quoteOnly: true, feeCents: 0, freeThresholdCents: 0, unlocked: false, etaKey: null, paidCents: prog.paidCents };
  },

  // ---- THE money source for anything the customer is actually charged. ----
  // pricing() is merchandise only (subtotal − discounts); it deliberately knows nothing
  // about delivery. Everything customer-facing — checkout summary, order email/WhatsApp,
  // WooCommerce, PayPal/IBAN amounts, purchase pixels — must read grandTotalCents here
  // instead, or the delivery fee silently never gets charged.
  // `region` is the DESTINATION region (from the checkout country), not the visitor's.
  orderTotals(region, opts = {}) {
    const pr = this.pricing();
    const q = this.shippingQuote(region, opts);
    const free = !q.quoteOnly && q.unlocked;
    // Quote-only destinations are billed after the order, so they add 0 here — but they
    // are NOT "free", and the UI must say so rather than showing "Offerte".
    // An empty cart owes nothing: never quote a delivery fee on 0 items.
    const shippingCents = (!this.items.length || q.quoteOnly || free) ? 0 : q.feeCents;
    return {
      subtotalCents: pr.subtotalCents,
      discounts: pr.discounts,
      discountCents: pr.discountCents,
      merchandiseCents: pr.totalCents,
      region: q.region,
      shippingCents,
      shippingFree: free,
      shippingQuoteOnly: !!q.quoteOnly,
      freeThresholdCents: q.freeThresholdCents,
      grandTotalCents: pr.totalCents + shippingCents,
    };
  },

  deliveryProgressHTML(region) {
    const t = YZA.i18n;
    const lang = t.lang || 'fr';
    const q = this.shippingQuote(region);
    if (q.quoteOnly) {
      const o = {
        fr: 'Livraison internationale — frais confirmés avec vous.',
        en: 'International delivery — shipping confirmed with you.',
        es: 'Envío internacional — gastos confirmados contigo.',
        tr: 'Uluslararası teslimat — kargo sizinle onaylanır.',
        ar: 'شحن دولي — تُؤكَّد التكلفة معك.',
      };
      return `<p>${o[lang] || o.fr}</p>`;
    }
    const remaining = Math.max(0, q.freeThresholdCents - q.paidCents);
    const pct = q.freeThresholdCents ? Math.max(0, Math.min(100, Math.round((q.paidCents / q.freeThresholdCents) * 100))) : 0;
    const whereMap = {
      morocco: { fr: 'au Maroc', en: 'in Morocco', es: 'en Marruecos', tr: "Fas'ta", ar: 'داخل المغرب' },
      europe: { fr: 'en Europe', en: 'to Europe', es: 'a Europa', tr: "Avrupa'ya", ar: 'إلى أوروبا' },
      usa_gcc: { fr: '', en: '', es: '', tr: '', ar: '' },
    };
    const where = whereMap[q.region] || whereMap.morocco;
    const w = where[lang] || where.fr;
    const copy = {
      fr: remaining ? `Ajoutez ${t.formatPrice(remaining)} pour la livraison offerte ${w}.` : `Livraison offerte ${w} débloquée.`,
      en: remaining ? `Add ${t.formatPrice(remaining)} more for free delivery ${w}.` : `Free delivery ${w} unlocked.`,
      es: remaining ? `Añade ${t.formatPrice(remaining)} para envío gratis ${w}.` : `Envío gratis ${w} desbloqueado.`,
      tr: remaining ? `${w} ücretsiz teslimat için ${t.formatPrice(remaining)} daha ekleyin.` : `${w} ücretsiz teslimat açıldı.`,
      ar: remaining ? `أضيفي ${t.formatPrice(remaining)} للحصول على توصيل مجاني ${w}.` : `تم تفعيل التوصيل المجاني ${w}.`,
    };
    return `<p>${(copy[lang] || copy.fr).replace(/\s+\./g, '.').replace(/\s{2,}/g, ' ').trim()}</p>
      <div class="cart-progress__track" aria-hidden="true"><span style="transform:scaleX(${pct / 100})"></span></div>
      <div class="cart-progress__meta">
        <span>${t.formatPrice(q.paidCents)}</span>
        <span>${t.formatPrice(q.freeThresholdCents)}</span>
      </div>`;
  },

  /* — UI — */
  open() {
    const drawer = document.getElementById('cartDrawer');
    if (!drawer || drawer.classList.contains('is-open')) return;
    this._returnFocus = document.activeElement;
    this._bodyOverflow = document.body.style.overflow;
    this._inertBackground = [...document.body.children].filter(el => !el.contains(drawer) && !['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName)).map(el => [el, el.inert]);
    this._inertBackground.forEach(([el]) => { el.inert = true; });
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('is-open');
    document.getElementById('cartOverlay')?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('has-cart-drawer');
    document.documentElement.classList.add('has-cart-drawer');
    document.getElementById('cartClose')?.focus({ preventScroll: true });
    YZA.analytics?.track('cart_open', { items: this.count(), subtotal_cents: this.subtotalCents(), total_cents: this.pricing().totalCents });
  },
  close() {
    const drawer = document.getElementById('cartDrawer');
    if (!drawer?.classList.contains('is-open')) return;
    drawer.classList.remove('is-open'); drawer.inert = true; drawer.setAttribute('aria-hidden', 'true');
    document.getElementById('cartOverlay')?.classList.remove('is-open');
    document.body.style.overflow = this._bodyOverflow || '';
    document.body.classList.remove('has-cart-drawer');
    document.documentElement.classList.remove('has-cart-drawer');
    (this._inertBackground || []).forEach(([el, inert]) => { el.inert = inert; });
    this._inertBackground = [];
    if (this._returnFocus?.isConnected) this._returnFocus.focus({ preventScroll: true });
  },

  refresh() {
    const t = YZA.i18n;
    // compteur
    const n = this.count();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = n;
      el.classList.toggle('is-visible', n > 0);
    });
    // corps du drawer
    const body = document.getElementById('cartBody');
    const foot = document.getElementById('cartFoot');
    if (!body) return;
    const focusKey = document.activeElement?.dataset.cartFocus;
    const scrollTop = body.scrollTop;
    const drawer = document.getElementById('cartDrawer');
    drawer.querySelectorAll('[data-cart-copy]').forEach(el => { el.textContent = this.copy(el.dataset.cartCopy); });
    const progress = drawer.querySelector('[data-cart-progress]');
    if (progress) {
      progress.hidden = !n;
      progress.innerHTML = this.deliveryProgressHTML('morocco');
      const free = this.shippingQuote('morocco').unlocked;
      progress.classList.toggle('is-unlocked', free);
      if (free) progress.querySelector('p').textContent = this.copy('unlocked');
    }
    const notice = drawer.querySelector('[data-cart-notice]');
    notice.hidden = !this._removed;
    notice.querySelector('[data-cart-notice-text]').textContent = this.copy('removed');
    notice.querySelector('[data-cart-undo]').hidden = false;
    notice.querySelector('[data-cart-undo]').textContent = this.copy('undo');
    const gift = drawer.querySelector('#cartGift');
    gift.checked = this.gift.enabled;
    drawer.querySelector('#cartGiftNote').hidden = !this.gift.enabled;
    if (document.activeElement?.id !== 'cartGiftMessage') drawer.querySelector('#cartGiftMessage').value = this.gift.message;
    if (!this.items.length) {
      const entry = Math.min(...(YZA.products || []).filter(p => p.publicVisible !== false && p.price > 0 && !p.bundle && !YZA.inventoryStatus?.(p)?.soldOut).map(p => p.price));
      body.innerHTML = `<div class="cart-empty">
        <img src="/yza-v2-preview/assets/brand/symbol.svg" alt="" width="52" height="52">
        <h3>${esc(this.copy('emptyTitle'))}</h3>
        <p>${esc(Number.isFinite(entry) ? this.copy('emptyText').replace('{price}', t.formatPrice(entry)) : t.t('cart.empty'))}</p>
        <a class="btn btn--outline" href="/collections/best-sellers">${esc(this.copy('emptyCta'))}</a></div>`;
      if (foot) foot.hidden = true;
      return;
    }
    const linesHTML = this.items.map(i => {
      const p = YZA.getProduct(i.handle); if (!p) return '';
      const lineView = YZA.cartLineView?.(i);
      const cartImg = lineView?.img || p.img;
      const productHref = lineView?.url || `/produits/${encodeURIComponent(p.handle)}`;
      const st = YZA.inventoryStatus?.(p) || {};
      const shownVariant = lineView?.variant || YZA.cartDisplayVariant?.(i) || i.variant;
      const focusId = esc(this._key(i.handle, i.variant, i.colorSlug, i.releaseId, i.finishKey, i.sizeCode));
      const stock = YZA.effectiveInventory?.(p.handle);
      const inCart = this.items.filter(line => line.handle === p.handle).reduce((sum, line) => sum + line.qty, 0);
      const atLimit = i.qty >= 99 || (Number.isFinite(stock) && stock < 6 && inCart >= stock)
        || (i.colorSlug && YZA.catalogColorSoldOut?.(p.handle, i.colorSlug)) || YZA.jawharaVariantSoldOut?.(p.handle, i.variant);
      return `<div class="cart-line">
        <a class="cart-line__img" href="${esc(productHref)}"><img src="${esc(cartImg)}" alt="${esc(t.pick(lineView?.imageAlt || p.imageAlt || p.name))}" width="92" height="115" loading="lazy"></a>
        <div class="cart-line__info">
          <div class="cart-line__heading"><a class="cart-line__name" href="${esc(productHref)}">${esc(t.pick(p.name || p.displayName))}</a><span class="cart-line__price">${t.formatPrice(p.price * i.qty)}</span></div>
          ${shownVariant ? `<div class="cart-line__variant">${esc(shownVariant)}</div>` : ''}
          ${st.almostGone ? `<div class="cart-line__scarcity">${t.tFmt('scarcity.remaining', { n: st.inventory })}</div>` : ''}
          <div class="cart-line__row">
            <div class="qty" data-handle="${esc(p.handle)}" data-variant="${esc(i.variant)}" data-size-code="${esc(i.sizeCode || '')}" data-color-slug="${esc(i.colorSlug)}" data-release-id="${esc(i.releaseId)}" data-finish-key="${esc(i.finishKey || '')}">
              <button class="qty__btn" data-act="dec" data-cart-focus="dec:${focusId}" aria-label="${esc(this.copy('decrease'))}">−</button>
              <span class="qty__n">${i.qty}</span>
              <button class="qty__btn" data-act="inc" data-cart-focus="inc:${focusId}" aria-label="${esc(this.copy('increase'))}" ${atLimit ? 'disabled' : ''}>+</button>
            </div>
            <button class="cart-line__remove" data-remove data-handle="${esc(p.handle)}" data-variant="${esc(i.variant)}" data-size-code="${esc(i.sizeCode || '')}" data-color-slug="${esc(i.colorSlug)}" data-release-id="${esc(i.releaseId)}" data-finish-key="${esc(i.finishKey || '')}">${t.t('cart.remove')}</button>
          </div>
        </div></div>`;
    }).join('');
    body.innerHTML = linesHTML + this.upsellHTML() + this.reassuranceHTML();
    body.scrollTop = scrollTop;
    if (focusKey) {
      const target = [...body.querySelectorAll('[data-cart-focus]')].find(el => el.dataset.cartFocus === focusKey);
      (target?.disabled ? target.closest('.qty').querySelector('[data-act="dec"]') : target)?.focus({ preventScroll: true });
    }
    if (foot) {
      foot.hidden = false;
      const pr = this.pricing();
      const sub = foot.querySelector('[data-cart-subtotal]');
      if (sub) sub.textContent = t.formatPrice(pr.totalCents);
      const discEl = foot.querySelector('[data-cart-discount]');
      if (discEl) {
        if (pr.discountCents > 0) {
          discEl.hidden = false;
          // Une ligne PAR remise : avec un palier charms ET un coupon, n'en montrer qu'une
          // donnait un total que les lignes affichees n'expliquaient pas.
          discEl.innerHTML = pr.discounts.map((d) =>
            `<span>${esc(this.discountLabel(d))}</span><strong>−${t.formatPrice(d.amountCents)}</strong>`).join('');
        } else { discEl.hidden = true; discEl.innerHTML = ''; }
      }
      foot.querySelector('[data-cart-shipping-note]').textContent = this.shippingQuote('morocco').unlocked ? this.copy('unlocked') : this.copy('shipping');
    }
  },

  // Three current-catalogue complements, excluding every item already in the cart.
  // Derived from the live cart on every refresh; hidden when nothing qualifies.
  upsellHTML() {
    const t = YZA.i18n;
    const cfg = YZA.promos?.crossSell;
    if (cfg?.enabled === false || typeof YZA.cartSuggestions !== 'function' || !this.items.length) return '';
    const tierCount = this.charmTierCount();
    // While the trio play is active (1-2 charms), suggestions stay charms so the
    // cards and the "add a 3rd charm" nudge tell one coherent story.
    const trioPlay = tierCount >= 1 && tierCount <= 2 && this.items.every(i => (YZA.getProduct(i.handle) || {}).category === 'charms');
    const sug = YZA.cartSuggestions(this.items, { limit: 3, categories: trioPlay ? ['charms'] : undefined });
    if (!sug.length) return '';
    const nudge = tierCount === 1 ? t.t('promo.charmTier.nudge1') : (tierCount === 2 ? t.t('promo.charmTier.nudge2') : '');
    const cards = sug.map(p => {
      const st = YZA.inventoryStatus?.(p) || {};
      const view = p.defaultColorSlug && YZA.resolveProductColorView ? YZA.resolveProductColorView(p, p.defaultColorSlug) : p;
      const href = `/produits/${encodeURIComponent(p.handle)}${p.defaultColorSlug ? `?color=${encodeURIComponent(p.defaultColorSlug)}` : ''}`;
      const chooseSize = (p.availableSizes || []).length > 1;
      const qualifier = this.copy('handmade');
      return `<div class="upsell-card">
        <a class="upsell-card__img" href="${esc(href)}"><img src="${esc(view.img)}" alt="${esc(t.pick(view.imageAlt || view.name))}" width="52" height="62" loading="lazy"></a>
        <div class="upsell-card__body">
          <a class="upsell-card__name" href="${esc(href)}">${esc(t.pick(p.displayName || p.name))}</a>
          <span class="upsell-card__detail">${esc(typeof qualifier === 'string' ? qualifier : this.copy('handmade'))}</span>
          ${st.almostGone ? `<span class="upsell-card__chip">${t.tFmt('scarcity.remaining', { n: st.inventory })}</span>` : ''}
        </div>
        ${chooseSize ? `<a class="upsell-card__add" href="${esc(href)}" aria-label="${esc(this.copy('choose') + ' ' + t.pick(p.name))}">${esc(this.copy('choose'))}</a>` : `<button type="button" class="upsell-card__add" data-upsell-add="${esc(p.handle)}" aria-label="${esc(this.copy('add') + ' ' + t.pick(p.name))}"><span>${t.formatPrice(p.price)}</span><span aria-hidden="true">+</span></button>`}
      </div>`;
    }).join('');
    return `<div class="cart-upsell">
      <p class="cart-upsell__title">${t.t('cart.upsell.title')}</p>
      ${nudge ? `<p class="cart-upsell__nudge">${nudge}</p>` : ''}
      <div class="cart-upsell__grid">${cards}</div>
    </div>`;
  },

  reassuranceHTML() {
    const cells = [['yza-sign-06.png', 'repair'], ['yza-sign-16.png', 'secure'], ['yza-sign-03.png', 'returns']];
    return `<div class="cart-reassurance"><div class="cart-reassurance__grid">${cells.map(([img, key]) => `<div><img src="/yza-v2-preview/assets/brand/icons/${img}" alt="" width="24" height="28"><span>${esc(this.copy(key))}</span></div>`).join('')}</div><div class="cart-reassurance__links"><a href="/contact">${esc(this.copy('help'))}</a><a href="/faq#livraison">${esc(this.copy('delivery'))}</a></div></div>`;
  },

  // Build the WhatsApp order message in the active language (product names stay original).
  orderMessage() {
    const t = YZA.i18n;
    const lang = (t && t.lang) || 'fr';
    const lines = this.items.map((line) => {
      const p = YZA.getProduct(line.handle);
      if (!p) return '';
      const shownVariant = YZA.cartDisplayVariant?.(line) || line.variant;
      const variant = shownVariant ? ` (${shownVariant})` : '';
      return `• ${line.qty} × ${t.pick(p.name)}${variant} — ${formatMad(p.price * line.qty)}`;
    }).filter(Boolean);
    const tpl = {
      fr: { intro: 'Bonjour YZA, je souhaite commander :', total: 'Total', ship: 'Livraison et retour à confirmer ensemble.', link: 'Page' },
      en: { intro: 'Hello YZA, I would like to order:', total: 'Total', ship: 'Delivery and return to confirm together.', link: 'Page' },
      es: { intro: 'Hola YZA, me gustaria hacer un pedido:', total: 'Total', ship: 'Envio y devolucion a confirmar juntos.', link: 'Pagina' },
      tr: { intro: 'Merhaba YZA, siparis vermek istiyorum:', total: 'Toplam', ship: 'Teslimat ve iade birlikte onaylanacak.', link: 'Sayfa' },
      ar: { intro: 'مرحبا YZA، أود تقديم طلب:', total: 'المجموع', ship: 'يتم تأكيد التوصيل والإرجاع معا.', link: 'الصفحة' },
    };
    const c = tpl[lang] || tpl.fr;
    const pr = this.pricing();
    const discLines = pr.discounts.map(d => `${this.discountLabel(d)} : −${formatMad(d.amountCents)}`);
    const gift = this.orderGift();
    const giftLines = gift.enabled ? [this.copy('gift') + ' — ' + this.copy('free'), ...(gift.message ? [this.copy('giftNote') + ' : ' + gift.message] : [])] : [];
    return [c.intro, ...lines, ...discLines, ...giftLines, `${c.total} : ${formatMad(pr.totalCents)}`, c.ship, `${c.link} : ${location.href}`].join('\n');
  },

  // Checkout = go to the dedicated /checkout page (shipping + payment). The cart is
  // preserved in localStorage so the page renders from it. WhatsApp handoff now happens
  // at the end of checkout (see js/checkout.js), with the full order + shipping details.
  checkout() {
    if (!this.items.length) { this.close(); window.location.href = window.yzaPreviewUrl('/collections/charms'); return; }
    YZA.analytics?.track('checkout_initiated', { items: this.count(), subtotal_cents: this.subtotalCents(), total_cents: this.pricing().totalCents });
    // "Passer au paiement" skips the cart-review step and lands on the shipping/payment
    // form; "Voir mon panier" (a plain /checkout link) still opens the cart step.
    const checkoutLang = (YZA.i18n && YZA.i18n.lang) || 'fr';
    window.location.href = window.yzaPreviewUrl('/checkout?lang=' + encodeURIComponent(checkoutLang) + '#shipping');
  },

  init() {
    this.load();
    this.loadGift();
    this.loadCoupon();   // avant tout rendu : le montant affiché doit être juste dès la 1re peinture
    // délégation d'événements sur le drawer
    const drawer = document.getElementById('cartDrawer');
    if (drawer) {
      drawer.addEventListener('change', e => {
        if (e.target.id === 'cartGift') {
          this.setGift(e.target.checked); this.refresh();
          if (this.gift.enabled) drawer.querySelector('#cartGiftMessage')?.focus({ preventScroll: true });
        }
      });
      drawer.addEventListener('input', e => {
        if (e.target.id === 'cartGiftMessage') this.setGift(this.gift.enabled, e.target.value);
      });
      drawer.addEventListener('keydown', e => {
        if (e.key !== 'Tab' || !drawer.classList.contains('is-open')) return;
        const els = [...drawer.querySelectorAll('a[href], button, input, select, textarea, [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length && !el.closest('[hidden]'));
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === drawer)) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      });
      drawer.addEventListener('click', (e) => {
        if (e.target.closest('[data-cart-continue]')) { this.close(); return; }
        if (e.target.closest('[data-cart-undo]')) { this.undoRemoval(); return; }
        const acc = e.target.closest('[data-cart-acc]');
        if (acc) { acc.closest('.cart-acc__item')?.classList.toggle('is-open'); return; }
        const up = e.target.closest('[data-upsell-add]');
        if (up) {
          // La vignette d'upsell n'a pas de sélecteur : elle montre le coloris par défaut,
          // c'est donc celui-là qu'on enregistre. Un '' en dur faisait partir la commande
          // sans coloris (cf. YZA.defaultVariantLabel).
          const upVariant = (YZA.defaultVariantLabel && YZA.defaultVariantLabel(up.dataset.upsellAdd)) || '';
          const upProduct = YZA.getProduct?.(up.dataset.upsellAdd);
          const upSizeCode = (upProduct?.availableSizes || []).includes(upProduct?.defaultSize)
            ? upProduct.defaultSize : ((upProduct?.availableSizes || []).length === 1 ? upProduct.availableSizes[0] : '');
          this.add(up.dataset.upsellAdd, upVariant, 1, { source: 'cart_cross_sell', sizeCode: upSizeCode });
          const renderedLines = drawer.querySelectorAll('.cart-line');
          renderedLines[renderedLines.length - 1]?.querySelector('.cart-line__name')?.focus();
          YZA.analytics?.track('cross_sell_add', { handle: up.dataset.upsellAdd, source: 'drawer' });
          return;
        }
        const rm = e.target.closest('[data-remove]');
        if (rm) {
          const i = this.items.find(i => this._key(i.handle, i.variant, i.colorSlug, i.releaseId, i.finishKey, i.sizeCode) === this._key(rm.dataset.handle, rm.dataset.variant, rm.dataset.colorSlug, rm.dataset.releaseId, rm.dataset.finishKey, rm.dataset.sizeCode));
          if (i) this.removeWithUndo(i); return;
        }
        const qbtn = e.target.closest('.qty__btn');
        if (qbtn) {
          const q = qbtn.closest('.qty');
          const line = this.items.find(i => this._key(i.handle, i.variant, i.colorSlug, i.releaseId, i.finishKey, i.sizeCode) === this._key(q.dataset.handle, q.dataset.variant, q.dataset.colorSlug, q.dataset.releaseId, q.dataset.finishKey, q.dataset.sizeCode));
          if (line && line.qty === 1 && qbtn.dataset.act === 'dec') { this.removeWithUndo(line); return; }
          if (line) this.setQty(q.dataset.handle, q.dataset.variant, line.qty + (qbtn.dataset.act === 'inc' ? 1 : -1), q.dataset.colorSlug, q.dataset.releaseId, q.dataset.finishKey, q.dataset.sizeCode);
          return;
        }
        if (e.target.closest('[data-checkout]')) this.checkout();
      });
    }
    document.querySelectorAll('[data-cart-open]').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); this.open(); }));
    document.getElementById('cartOverlay')?.addEventListener('click', () => this.close());
    document.getElementById('cartClose')?.addEventListener('click', () => this.close());
    // Dynamic blocks (cross-sell, scarcity, discount rows) are rendered with t() at build
    // time — rebuild them on language switch (i18n apply() only rewrites [data-i18n] nodes).
    YZA.i18n?.onChange?.(() => this.refresh());
    document.addEventListener('yza:currencychange', () => this.refresh());
    const reconcileServerStock = () => {
      const before = JSON.stringify(this.items);
      this.load();
      this.refresh();
      if (JSON.stringify(this.items) !== before) {
        try { document.dispatchEvent(new CustomEvent('yza:cartchange')); } catch (e) {}
      }
    };
    // products.js starts the no-store stock request before cart.js executes. Reconcile
    // both when its event arrives and when an already-settled promise is observed, so a
    // persisted basket cannot keep a now-sold-out quantity merely because the request
    // won the race against DOMContentLoaded.
    document.addEventListener('yza:inventorychange', reconcileServerStock);
    if (YZA.inventoryReady && typeof YZA.inventoryReady.then === 'function') {
      YZA.inventoryReady.then(reconcileServerStock).catch(() => {});
    }
    this.refresh();
  },
};

YZA.cart = cart;
