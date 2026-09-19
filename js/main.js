/* ============================================================
 YZA - MAIN
 Boot du chrome + rendu des grilles depuis le catalogue,
 page produit / collections, interactions, re-rendu i18n.
 ============================================================ */
(function () {
 const $ = (s, r = document) => r.querySelector(s);
 const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
 const T = () => YZA.i18n;
 const params = new URLSearchParams(location.search);
 const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

 // ---- Clean-URL routing ----
 // The server rewrites /collections/{slug} and /produits/{handle} to
 // collections.html?cat=... / produit.html?handle=... internally (see .htaccess),
 // so the address bar keeps the pretty path but location.search stays empty. Every
 // params.get('cat')/params.get('handle') call below already reads from `params` —
 // synthesize the equivalent keys here, once, from the pathname as a fallback so
 // nothing downstream has to change. Legacy ?cat=/?handle= links keep working
 // unchanged (checked first).
 const CAT_SLUGS = { 'best-sellers': 'bestsellers', charms: 'charms', sacs: 'bags', 'pret-a-porter': 'rtw', bijoux: 'accessories', 'boucles-d-oreilles': 'earrings', colliers: 'accessories', hauts: 'tops', 'jupes-pareo': 'pareos', pantalons: 'pants', bas: 'bottoms' };
 const CAT_SLUGS_REV = { ...Object.fromEntries(Object.entries(CAT_SLUGS).map(([slug, cat]) => [cat, slug])), accessories: 'bijoux' };
 (function parseCleanPath() {
 const path = window.yzaPreviewPath().replace(/\/+$/, '') || '/';
 let m;
 if (!params.get('cat') && (m = path.match(/^\/collections\/([a-z-]+)$/))) {
 const mapped = CAT_SLUGS[m[1]];
 if (mapped) params.set('cat', mapped);
 } else if (!params.get('handle') && (m = path.match(/^\/produits\/([a-zA-Z0-9-]+)$/))) {
 params.set('handle', m[1]);
 }
 })();
 // Build the clean URL for a category ('bags', 'accessories', ...) or a product handle.
 // Falls back to the old ?cat=/?handle= form for any category not in the slug map
 // (e.g. 'all') so nothing ever links to a broken path.
 function collectionUrl(cat) { const slug = CAT_SLUGS_REV[cat]; return slug ? `/collections/${slug}` : (cat && cat !== 'all' ? `collections.html?cat=${encodeURIComponent(cat)}` : '/collections'); }
 function productUrl(handle) { return handle ? `/produits/${encodeURIComponent(handle)}` : 'produit.html'; }
 YZA.collectionUrl = collectionUrl;
 YZA.productUrl = productUrl;

 /* ---- Carte produit ---- */
 function displayName(p) {
 return p?.displayName || p?.name || {};
 }
 function displayShort(p) {
 return p?.displayShort || p?.short || {};
 }
 function releasedSizeLabel(product, sizeCode, t = T()) {
  const label = YZA.productSizeLabel?.(product, sizeCode)
   || (product && product.sizeLabels && product.sizeLabels[sizeCode]);
  return t.pick(label || {}) || String(sizeCode || '');
 }
 function formatRange(range) {
 if (!Array.isArray(range) || range.length < 2) return '';
 const [min, max] = range;
 return min === max ? T().formatPrice(min) : `${T().formatPrice(min)} - ${T().formatPrice(max)}`;
 }
 function priceHTML(p) {
 const t = T();
 if (p.displayPriceRange) {
 return `<span class="product-card__price">${formatRange(p.displayPriceRange)}</span>`;
 }
 if (p.compareAt && p.compareAt > p.price) {
 return `<span class="product-card__price"><s>${t.formatPrice(p.compareAt)}</s> ${t.formatPrice(p.price)}</span>`;
 }
 return `<span class="product-card__price">${t.formatPrice(p.price)}</span>`;
 }
  function cardPriceText(p) {
    return p.displayPriceRange ? formatRange(p.displayPriceRange) : T().formatPrice(p.price);
  }
  function formatCardPrice(p) {
    const t = T();
    if (Array.isArray(p.displayPriceRange) && p.displayPriceRange.length >= 2) {
      const [min, max] = p.displayPriceRange;
      return min === max ? t.formatPrice(min) : `${t.formatPrice(min)} - ${t.formatPrice(max)}`;
    }
    /* Prix barre sur les cartes (2026-08-06). La fiche produit savait deja le faire
       (productPriceCompact) mais PAS la carte : sans ca, l'operation -50 % se serait
       affichee comme un simple prix bas, sans rien a comparer — la remise devient
       invisible la ou elle doit convaincre. Le <s> declenche aussi la couleur de solde,
       la regle `.product-card__price:has(s)` existait deja et n'attendait que ca. */
    if (p.compareAt && p.compareAt > p.price) {
      return `<s class="was">${t.formatPrice(p.compareAt)}</s> ${t.formatPrice(p.price)}`;
    }
    return t.formatPrice(p.price);
  }
  function stockCopy() {
    const lang = T().lang || 'fr';
    const copy = {
      fr: { almost: 'Bientôt épuisé', sold: 'Épuisé', left: 'pièce restante', few: 'Plus que quelques pièces' },
      en: { almost: 'Almost gone', sold: 'Sold out', left: 'piece left', few: 'A few pieces left' },
      es: { almost: 'Casi agotado', sold: 'Agotado', left: 'pieza restante', few: 'Quedan pocas piezas' },
      tr: { almost: 'Tukenmek uzere', sold: 'Tukendi', left: 'adet kaldi', few: 'Son birkaç parça' },
      ar: { almost: 'ينفد قريبا', sold: 'نفد', left: 'قطعة متبقية', few: 'بقيت قطع قليلة' },
    };
    return copy[lang] || copy.fr;
  }
  function wishlistHas(handle) {
    try { return (JSON.parse(localStorage.getItem('yza_wishlist')) || []).includes(handle); } catch (e) { return false; }
  }
  function heartIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.3-9-8.3C1.4 8.4 3.4 5 6.8 5c2 0 3.3 1.1 4.1 2.2C11.8 6.1 13.1 5 15.2 5c3.3 0 5.4 3.4 3.8 6.7C17 15.7 12 20 12 20z"/></svg>';
  }
 function productCardCopy() {
 const lang = T().lang || 'fr';
 const copy = {
 fr: { hand: '~48h de travail main', atelier: 'Atelier femmes', limited: 'Édition limitée', bags: '15 pièces · numérotées', hours: 'h de crochet', bundle: 'Bundle facile' },
 en: { hand: '~48h hand-woven', atelier: 'Women atelier', limited: 'Limited edition', bags: '15 pieces · numbered', hours: 'h handwork', bundle: 'Easy bundle' },
 es: { hand: '~48h tejido a mano', atelier: 'Atelier de mujeres', limited: 'No se repite', bags: '15 piezas · numeradas', hours: 'h de trabajo', bundle: 'Pack facil' },
 tr: { hand: '~48s el işi', atelier: 'Kadin atolyeleri', limited: 'Tekrar uretilmez', bags: '15 parça · numaralı', hours: 'saat el isi', bundle: 'Kolay set' },
 ar: { hand: '\u0643\u0631\u0648\u0634\u064A\u0647 \u064A\u062F\u0648\u064A', atelier: '\u0648\u0631\u0634\u0629 \u0646\u0633\u0627\u0626\u064A\u0629', limited: '\u0644\u0646 \u064A\u0639\u0627\u062F \u0625\u0646\u062A\u0627\u062C\u0647', bags: '15 \u0644\u0643\u0644 \u0645\u0642\u0627\u0633/\u0644\u0648\u0646', hours: '\u0633\u0627\u0639\u0627\u062A \u0639\u0645\u0644', bundle: '\u0645\u062C\u0645\u0648\u0639\u0629 \u0633\u0647\u0644\u0629' },
 };
 return copy[lang] || copy.fr;
 }
 function cardProofHTML(p) {
 const c = productCardCopy();
 const craft = p.hours ? `${String(p.hours).replace('.', ',')} ${c.hours}` : (p.category === 'bags' ? c.hand : c.atelier);
 const scarcity = p.category === 'bags' ? c.bags : (p.bundle ? c.bundle : c.limited);
 return `<div class="product-card__meta" aria-label="${esc(craft)}"><span>${esc(craft)}</span><span>${esc(scarcity)}</span></div>`;
 }
  // Map a colour name (any of the 5 langs) to a representative hex for the
  // Jacquemus-style swatch dots on listing tiles. Distinct hexes per family so
  // a multi-colour piece reads as varied, not a row of identical dots.
  function cardSwatchHex(name) {
    const n = String(name || '').toLowerCase();
    // Specific named colourways first (compound names that would otherwise match a
    // generic rule, e.g. "Black Olive" → black, "Deep Violet" → mid purple).
    if (/black ?olive|olive ?noir/.test(n)) return '#2c3020';
    if (/deep violet|violet profond/.test(n)) return '#4a2d6b';
    if (/hot red|rouge vif|rouge feu/.test(n)) return '#c0322c';
    // YZA canonical palette (real colourway names) — keep these before the generic hue rules.
    if (/grenade|pomegranate|granada|رمان|رُمّان/.test(n)) return '#7a1f2b';         // Grenade (deep pomegranate)
    if (/coquelicot|poppy|amapola|gelincik/.test(n)) return '#c8352b';               // Rouge Coquelicot
    if (/safran|saffron|azafran|زعفران/.test(n)) return '#e6a01f';                   // Jaune Safran
    if (/vert royal|royal green|verde real|kraliyet|vert profond|profond|deep green/.test(n)) return '#1f3d2e'; // Vert Royal
    if (/vert amande|amande|almond|almendra|badem/.test(n)) return '#8a9a6b';         // Vert Amande
    if (/lilas|lilac|leylak|\blila\b|ليلكي|لَيْلَكي/.test(n)) return '#c3a3d8';       // Lilas
    if (/noir|black/.test(n)) return '#1f1f1f';
    if (/blanc|white|cream|creme|ecru|ivoire|ivory|naturel|natural/.test(n)) return '#efece4';
    if (/bordeaux|burgundy|wine/.test(n)) return '#5e1f2a';
    if (/rouge|\bred\b|brique|brick/.test(n)) return '#b1342f';
    if (/rose|pink/.test(n)) return '#cf9aa3';
    if (/moutarde|mustard/.test(n)) return '#c79a3a';
    if (/jaune|yellow|gold|dore/.test(n)) return '#d9b443';
    if (/majorelle/.test(n)) return '#2b4cb3';
    if (/marine|navy/.test(n)) return '#27365e';
    if (/bleu|blue|turquoise|cyan/.test(n)) return '#3a6ea5';
    if (/profond|deep green|sapin|foret|forest/.test(n)) return '#1f3d2e';
    if (/olive|kaki|khaki/.test(n)) return '#6b6b3a';
    if (/vert|green/.test(n)) return '#5a7048';
    if (/orange|terracotta|terre|clay|rouille|rust/.test(n)) return '#c45e29';
    if (/violet|purple|lilas|lila|mauve|aubergine/.test(n)) return '#7a4b8a';
    if (/beige|sable|sand|taupe|nude|camel|chameau/.test(n)) return '#cdbfa6';
    if (/marron|brown|chocolat|chocolate|cafe/.test(n)) return '#6b4a32';
    if (/gris|grey|gray|argent|silver/.test(n)) return '#9a9a9a';
    return '#cdbfa6';
  }
  // Colour dots under a card. For products that carry real per-colour photography
  // (YZA.jawharaColorMedia) these become REAL buttons that swap the card image; for
  // everything else they stay the decorative, aria-hidden dots they have always been.
  function cardSwatchesHTML(p) {
    const t = T();
    const media = (YZA.jawharaColorMedia || {})[p.handle];
    const swatchable = !!media && Array.isArray(p.colorSlugs) && p.colorSlugs.length > 1;

    if (swatchable) {
      // Les pastilles viennent des coloris DE CETTE PIECE, plus de la liste globale
      // (2026-07-29). Depuis la reouverture du Jaune Safran, la liste globale contient un
      // coloris que toutes les pieces n'ont pas : l'iterer afficherait une pastille safran
      // sur la jupe pareo midi, qui n'en a pas de photo.
      const own = new Set(p.colorSlugs || []);
      const cols = (p.colorSlugs || []).map((slug, index) => {
        const released = media.colors && media.colors[slug];
        const palette = (YZA.jawharaColors || []).find((candidate) => candidate.slug === slug) || {};
        return { ...palette, ...(released || {}), ...(released && released.name ? released.name : (p.availableColors || [])[index] || {}), slug };
      }).filter((c) => own.has(c.slug));
      if (!cols.length) return '';
      const active = p._cardColorSlug || p.defaultColorSlug || cols[0].slug;
      const btns = cols.map((c) => {
        const name = t.pick(c);
        const isOn = c.slug === active;
        // Un coloris epuise se signale AVANT le clic : sinon la cliente choisit sa couleur,
        // attend le chargement, et ne decouvre qu'ensuite qu'elle n'est pas vendue. La
        // pastille reste cliquable — on peut vouloir regarder la couleur — mais son nom
        // accessible et son infobulle disent la verite, et le style la barre.
        const gone = !!(YZA.jawharaColorSoldOut && YZA.jawharaColorSoldOut(p.handle, c.slug));
        const label = gone ? `${name} — ${stockCopy().sold}` : name;
        return `<button type="button" class="product-card__swatch-dot product-card__swatch-dot--btn${isOn ? ' is-active' : ''}${gone ? ' is-sold-out' : ''}"`
          + ` style="background:${esc(c.hex)}" data-color-slug="${esc(c.slug)}" data-color-name="${esc(name)}"`
          + ` aria-pressed="${isOn ? 'true' : 'false'}"`
          + ` aria-label="${esc(t.pick(p.name))} — ${esc(label)}" title="${esc(label)}">`
          + `<span class="sr-only">${esc(label)}</span></button>`;
      }).join('');
      // Not aria-hidden: these are operable controls with names.
      return `<div class="product-card__swatches product-card__swatches--live" data-color-swatches="${esc(p.handle)}"
        role="group" aria-label="${esc(t.t('col.colors'))}">${btns}</div>`;
    }

    const colors = (p.availableColors || []).map((c) => t.pick(c)).filter(Boolean);
    if (colors.length < 2) return '';
    const shown = colors.slice(0, 5);
    const extra = colors.length - shown.length;
    const dots = shown.map((name) =>
      `<span class="product-card__swatch-dot" style="background:${cardSwatchHex(name)}" title="${esc(name)}"></span>`
    ).join('');
    const more = extra > 0 ? `<span class="product-card__more-colors">+${extra} ${esc(t.t('col.colors'))}</span>` : '';
    return `<div class="product-card__swatches" aria-hidden="true">${dots}${more}</div>`;
  }
  // Reviewed individually: keep the white packshot as the primary and show only this
  // product's selected close-up on hover. Never fall back to the orange ring photos.
  const CHARM_CARD_HOVERS = {
    'raffia-cherries-charm-ss26': 'assets/products/charms/hover/cherries.webp',
    'raffia-grapes-charm-ss26': 'assets/products/charms/hover/grapes.webp',
    'raffia-whole-lemon-charm-ss26': 'assets/products/charms/hover/whole-lemon.webp',
    'raffia-whole-orange-charm-ss26': 'assets/products/charms/hover/whole-orange.webp',
    'raffia-tomato-charm-ss26': 'assets/products/charms/hover/tomato.webp',
    'raffia-lemon-slice-charm-ss26': 'assets/products/charms/hover/lemon-slice.webp',
    'raffia-orange-slice-charm-ss26': 'assets/products/charms/hover/orange-slice.webp',
    'raffia-kiwi-slice-charm-ss26': 'assets/products/charms/hover/kiwi-slice.webp',
    'raffia-watermelon-slice-charm-ss26': 'assets/products/charms/hover/watermelon-slice.webp',
    'raffia-avocado-half-charm-ss26': 'assets/products/charms/hover/avocado-half.webp',
  };
  const EARRING_CARD_HOVERS = {
    // The existing kiwi portraits show different attachment hardware. Use the approved pair in detail.
    'kiwi-raffia-earrings-ss26': { src: 'assets/products/earrings-2026-07/kiwi-earrings-card-1440.webp?v=20260909-4k', detail: true },
    'avocado-raffia-earrings-ss26': { src: 'assets/products/earrings/hover/avocado.webp' },
    'lemon-raffia-earrings-ss26': { src: 'assets/products/earrings/hover/lemon.webp' },
    'orange-raffia-earrings-ss26': { src: 'assets/products/earrings/hover/orange.webp' },
    'grapes-raffia-earrings-ss26': { src: 'assets/products/earrings/hover/grapes.webp' },
  };

  function cardHTML(p, index = 0, eager = false, opts = {}) {
    const t = T();
    const tile = !!opts.tile;
    const defaultColorSlug = p._cardColorSlug || p.defaultColorSlug || '';
    const cardView = defaultColorSlug && YZA.resolveProductColorView
      ? YZA.resolveProductColorView(p, defaultColorSlug) : p;
    // Keep one stable product/family label on collection cards. Swatches, mood and
    // spectrum own the selected media and URL; colour-specific names remain on PDPs.
    const canonicalCardProduct = YZA.getProduct?.(p.handle) || p;
    const name = t.pick(displayName(canonicalCardProduct));
    // Page-wide image de-dup (client rule: never the same image twice on a page).
    // When opts.used (a Set of normalised srcs) is passed, show the product's first
    // still-unused gallery photo instead of repeating one already on the page.
    const _normImg = (s) => String(s || '').replace(/\?.*$/, '');
    // Duplicate-card fallbacks must never replace a charm's white primary photo.
    const _whiteCharmCard = p.category === 'charms';
    const _gallery = (_whiteCharmCard ? [cardView.img] : [cardView.img].concat(cardView.gallery || [])).filter(Boolean);
    let primaryImg = cardView.img;
    // Products with per-colour photography opt OUT of the no-duplicate-image de-dup:
    // it can silently substitute a different gallery entry for the primary, which would
    // fight the colour swatch (the card would show colour A while B is selected).
    const _hasColorMedia = !!(YZA.jawharaColorMedia || {})[p.handle];
    // Last-resort source if a colour rendition is ever missing, so a card never
    // renders a broken-image icon. Prefers the product's own default colour photo.
    const _fallbackImg = cardView.img || p.img || '';
    if (opts.used && !_hasColorMedia) {
      primaryImg = _gallery.find((g) => !opts.used.has(_normImg(g))) || cardView.img;
      opts.used.add(_normImg(primaryImg));
    } else if (opts.used) {
      opts.used.add(_normImg(primaryImg));
    }
    // No dedicated hover shot in the colour package — hover stays on the SELECTED colour
    // (never another colourway just to create an effect), so the card simply has none.
    let hoverSrc = _whiteCharmCard ? (CHARM_CARD_HOVERS[p.handle] || '') : _hasColorMedia ? '' : (cardView.hoverImg || ((cardView.gallery && cardView.gallery[1] && cardView.gallery[1] !== primaryImg) ? cardView.gallery[1] : ''));
    if (opts.used && hoverSrc && !_whiteCharmCard) {
      if (opts.used.has(_normImg(hoverSrc))) hoverSrc = _gallery.find((g) => _normImg(g) !== _normImg(primaryImg) && !opts.used.has(_normImg(g))) || '';
      if (hoverSrc) opts.used.add(_normImg(hoverSrc));
    }
    // Un survol identique à l'image principale ne produit AUCUN effet visible : on
    // fondrait la photo vers elle-même. Autant ne pas émettre le calque du tout.
    if (hoverSrc && _normImg(hoverSrc) === _normImg(primaryImg)) hoverSrc = '';
    const status = YZA.inventoryStatus?.(p) || { inventory: null, soldOut: false, almostGone: false };
    const stock = stockCopy();
    const wished = wishlistHas(p.handle);
    const href = p._href || (productUrl(p.handle) + (defaultColorSlug ? '?color=' + encodeURIComponent(defaultColorSlug) : ''));
    const limitedLine = status.almostGone
      ? `<span class="product-card__limited">${status.inventory} ${esc(stock.left)}</span>`
      : '';
    const soldOverlay = status.soldOut ? `<span class="product-card__sold">${esc(stock.sold)}</span>` : '';
    const almostBadge = status.almostGone ? `<span class="product-card__stock">${esc(stock.almost)}</span>` : '';
    // Scarcity is canonical inventory only; legacy editorial `fewLeft` must never
    // contradict a tracked high quantity.
    const fewBadge = '';
    const imgLoad = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
    const wishBtn = `<button class="product-card__wish${wished ? ' is-active' : ''}" type="button" data-wishlist-toggle="${esc(p.handle)}" aria-pressed="${wished ? 'true' : 'false'}" aria-label="${esc(t.t(wished ? 'a.wishRemove' : 'a.wishAdd'))}">${heartIcon()}</button>`;
    const hoverVid = _whiteCharmCard ? '' : (cardView.hoverVideo || '');
    // Épuisement du CORIS affiché au rendu. Les trois appelants dynamiques
    // (applyColorSoldOut) ne tournent que sur la grille prêt-à-porter ; ailleurs la carte
    // n'est rendue qu'une fois, et sans ceci le badge n'apparaîtrait jamais.
    const colorSold = !!(YZA.jawharaColorSoldOut && defaultColorSlug
      && YZA.jawharaColorSoldOut(p.handle, defaultColorSlug));
    const colorSoldTag = colorSold
      ? `<span class="product-card__sold product-card__sold--color">${esc(stock.sold)}</span>` : '';
    /* Pastille de remise (2026-08-06). Volontairement CHIFFREE et non redigee : « -50 % »
       se lit dans les cinq langues du site sans traduction, alors qu'une phrase du type
       « cette semaine seulement » aurait demande fr/en/es/tr/ar et serait restee en
       francais pour trois quarts des visiteuses. La date de fin vit dans la config, pas
       dans le libelle : rien a corriger a la main quand l'operation s'arrete. */
    const saleTag = (p.onSale && p.compareAt > p.price && !status.soldOut && !colorSold)
      ? `<span class="product-card__sale">${esc((YZA.promos?.familySale?.label || {})[T().lang] || '-50 %')}</span>` : '';
    const releaseBadge = p.badge && t.pick(p.badge)
      ? `<span class="product-card__limited">${esc(t.pick(p.badge))}</span>` : '';
    const earringPackshot = p.category === 'earrings' && /\/earrings-2026-07\/[^/]+-earrings-card\.webp$/.test(p.img || '');
    let imageSources = '';
    let hoverPresentation = '';
    if (earringPackshot) {
      // Keep the restored pair first; use only the reviewed secondary view for this earring.
      primaryImg = p.img + '?v=20260909-4k';
      const selectedHover = EARRING_CARD_HOVERS[p.handle];
      hoverSrc = !hoverVid ? (selectedHover?.src || '') : '';
      if (!hoverVid && selectedHover?.detail) hoverPresentation = ' style="transform:scale(1.22)"';
      imageSources = `srcset="${esc(p.img.replace('.webp','-640.webp'))} 640w, ${esc(p.img.replace('.webp','-1440.webp'))} 1440w, ${esc(primaryImg)} 3584w" sizes="(max-width: 600px) 50vw, 33vw"`;
    }
    const mediaLink = `<a class="product-card__media${hoverVid ? ' has-hover-video' : ''}" href="${href}" data-product-card-click="${esc(p.handle)}" aria-label="${esc(name)}">
        ${saleTag}${releaseBadge}${fewBadge}${almostBadge}${soldOverlay}
        <img class="product-card__img" src="${esc(primaryImg)}" ${imageSources} alt="${esc(t.pick(cardView.imageAlt || cardView.name))}" ${imgLoad} width="461" height="615" decoding="async" onerror="this.onerror=null;this.src='${esc(_fallbackImg)}'">
        ${(hoverSrc && isPublicMedia(hoverSrc)) ? `<img class="product-card__img product-card__img--hover" src="${esc(hoverSrc)}"${hoverPresentation} alt="" aria-hidden="true" loading="lazy" width="461" height="615" decoding="async">` : ''}
        ${hoverVid ? `<video class="product-card__vid" muted loop playsinline preload="none" poster="${esc(primaryImg)}" data-hover-video="${esc(hoverVid)}" width="461" height="615" aria-hidden="true"></video>` : ''}
        ${colorSoldTag}
      </a>`;
    const quickAdd = (tile && !status.soldOut && !colorSold)
      ? `<button class="product-card__addbag" type="button" data-quickbuy="${esc(p.handle)}">${esc(t.t('col.addbag'))}</button>`
      : '';
    // Tile mode wraps the heart + image + quick-add so the circular "+" anchors
    // to the image bottom-right even though name/price sit statically below it.
    const media = tile
      ? `<div class="product-card__media-wrap">${wishBtn}${mediaLink}${quickAdd}</div>`
      : `${wishBtn}${mediaLink}`;
    const swatches = tile ? cardSwatchesHTML(p) : '';
    return `<article class="product-card${tile ? ' product-card--tile' : ''}${p.hoverImg ? ' product-card--vibe' : ''}${status.soldOut ? ' is-sold-out' : ''}${colorSold ? ' is-color-sold-out' : ''}" style="--i:${index}" data-product-handle="${esc(p.handle)}">
      ${media}
      ${swatches}
      <a class="product-card__info" href="${href}" data-product-card-click="${esc(p.handle)}">
        <span class="product-card__name" title="${esc(name)}">${esc(name)}</span>
        <span class="product-card__price">${formatCardPrice(p)}</span>
        ${limitedLine}
      </a>
    </article>`;
  }
  // Per-variant hover media (client-specified). Keyed by a token in the variant's
  // image filename ({rouge|violet|noir}-{xs|s|m}-01.jpg), so it targets the exact
  // size+colour combo. video → plays on hover; img → cross-fades on hover.
  const BAG_HOVER = {
    'violet-xs-01': { video: 'assets/lifestyle/bags/la-sculpture-xs-deep-violet-motion.mp4' },
    'rouge-xs-01':  { video: 'assets/lifestyle/bags/la-sculpture-xs-hot-red-motion.mp4' },
    'rouge-m-01':   { video: 'assets/lifestyle/bags/la-sculpture-m-hot-red-motion.mp4' },
    'violet-s-01':  { img: 'assets/products/la-sculpture/sculpture-s-deep-violet-hover.jpg' },
    'violet-m-01':  { img: 'assets/products/la-sculpture/sculpture-m-deep-violet-hover.jpg' },
    // La Nouvelle Vague XS · Rose/Rouge — le sac porte a l'epaule sur la plage (cliente
    // 2026-07-26). Remplace le plan du riad (L01) : celui-ci montre enfin la BANDOULIERE
    // en daim framboise, absente de l'ancien - une cliente pouvait croire qu'elle n'etait
    // pas fournie. Le fichier L01 reste sur le serveur, simplement plus reference ici.
    'lnv-rouge-xs': { img: 'assets/products/la-nouvelle-vague/lnv-rouge-xs-hover.webp?v=20260726l' },
    // La Nouvelle Vague M · Bleu — real street shot, bag carried (client-provided 2026-07-15).
    // Keys are matched with `item.img.includes(k)`, so they still hit despite the ?v= cache-bust.
    'lnv-bleu-m': { img: 'assets/lifestyle/review-accessories/L07-nouvelle-vague-m-bleu-street.jpg' },
    // La Nouvelle Vague S · Bleu — le panier sur la chaise en rotin, dans la palmeraie
    // (cliente 2026-07-26, IMG_6891). Remplace le plan de la terrasse du port : le sac est
    // plus gros, la lumiere est plus nette et les anses perlees se lisent en vignette.
    // Le fichier garde son nom : c'est le ?v qui doit changer, sinon le CDN sert l'ancienne image.
    // NB 'lnv-bleu-s' is NOT a substring of 'lnv-bleu-xs' (the 'x' breaks it), so the XS card
    // is not accidentally caught by this key.
    'lnv-bleu-s': { img: 'assets/products/la-nouvelle-vague/lnv-bleu-s-hover.webp?v=20260726j' },
    // La Nouvelle Vague S · Vert sapin (cliente 2026-07-26, IMG_6900). Premier survol de ce
    // coloris : il n'avait aucune photo lifestyle. ATTENTION au slug : le Vert sapin porte
    // le slug historique 'rose' (voir lnvColors dans products.js), donc la cle est
    // 'lnv-rose-s'. Elle n'est PAS sous-chaine de 'lnv-rose-xs' (le « x » coupe) : aucune
    // collision avec la carte XS.
    'lnv-rose-s': { img: 'assets/products/la-nouvelle-vague/lnv-rose-s-hover.webp?v=20260726m' },
    // La Nouvelle Vague XS . Vert sapin (cliente 2026-07-26, IMG_6908) : le sac tenu a plat
    // sur la main devant la fontaine en zellige vert. Meme slug historique 'rose' que le S.
    'lnv-rose-xs': { img: 'assets/products/la-nouvelle-vague/lnv-rose-xs-hover.webp?v=20260726o' },
    // La Nouvelle Vague M . Vert sapin (cliente 2026-07-26). 'lnv-rose-m' n'est sous-chaine
    // ni de 'lnv-rose-xs' ni de 'lnv-rose-s' : les trois cartes restent independantes.
    'lnv-rose-m': { img: 'assets/products/la-nouvelle-vague/lnv-rose-m-hover.webp?v=20260726q' },
    // La Nouvelle Vague M . Rose/Rouge (cliente 2026-07-26, IMG_6902) : derniere carte de la
    // famille sans survol. Cette photo sert deja la galerie de la fiche M Rose/Rouge, ce qui
    // n'est PAS un doublon : BAG_HOVER ne rend que sur les cartes collections, jamais sur la
    // fiche produit - les deux usages sont sur deux pages differentes.
    'lnv-rouge-m': { img: 'assets/products/la-nouvelle-vague/lnv-rouge-m-hover.webp?v=20260726r' },
    // La Sculpture · Black Olive (Noir) — client shots (WeTransfer, 2026). XS + S cross-fade to
    // the styled editorial still; M plays a 4s ambient clip among the sheers on hover. Keyed on
    // the collection card's primary token ({..}-sculpture-{size}-black-olive.png), matched with
    // item.img.includes(k). NB 'sculpture-s-black-olive' is NOT a substring of the XS filename
    // 'sculpture-xs-black-olive' (the 'x' breaks it), so the S key never catches the XS card.
    'sculpture-xs-black-olive': { img: 'assets/products/la-sculpture/sculpture-xs-black-olive-hover.webp?v=20260724a' },
    'sculpture-s-black-olive':  { img: 'assets/products/la-sculpture/sculpture-s-black-olive-hover.webp?v=20260724a' },
    'sculpture-m-black-olive':  { video: 'assets/lifestyle/bags/la-sculpture-m-black-olive-motion.mp4?v=20260724a' },
    // La Sculpture · Deep Violet (client 2026-07-26) : le M joue un clip de 4 s au survol,
    // le XS passe en fondu sur la nature morte aux fruits violets. Les cles ci-dessous sont
    // celles des images de carte COLLECTIONS (0X-sculpture-<taille>-deep-violet.png) — les
    // vieilles entrees 'violet-*-01' plus haut visent la galerie de la fiche produit et ne
    // matchent donc jamais ces cartes. 'sculpture-s-deep-violet' n'est pas une sous-chaine de
    // 'sculpture-xs-deep-violet' (le « x » coupe) : aucune collision entre tailles.
    'sculpture-xs-deep-violet': { img: 'assets/products/la-sculpture/sculpture-xs-deep-violet-hover.webp?v=20260726b' },
    'sculpture-m-deep-violet':  { video: 'assets/lifestyle/bags/la-sculpture-m-deep-violet-motion.mp4?v=20260726b' },
  };
  /* LA NOUVELLE VAGUE — UNE SEULE SOURCE DE VERITE POUR LE SURVOL (2026-08-06).
     Depuis que la photo PORTEE est devenue la photo de CARTE (voir LNV_MEDIA_20260806 dans
     products.js), les entrees LNV ci-dessus pointaient vers le fichier QUI EST MAINTENANT LA
     CARTE. Deux consequences, toutes deux mauvaises :
       - `BAG_HOVER.img` gagne sur `item.hoverImg` (l'ordre de resolution est juste en
         dessous), donc le survol par coloris+taille pose par products.js n'aurait jamais
         servi ;
       - le garde-fou « survol == carte » les aurait alors annules, laissant les cartes sacs
         SANS aucun survol.
     Le piege de sous-chaine y est pour beaucoup : la cle 'lnv-bleu-xs' matche encore
     'lnv-bleu-xs-hover.webp' via `item.img.includes(cle)`. On retire donc les cles LNV : la
     carte par taille de products.js devient l'unique source, et elle couvre les 9 couples,
     alors qu'il n'y avait ici que 7 entrees ('lnv-bleu-xs' et 'lnv-rouge-s' manquaient). */
  Object.keys(BAG_HOVER).forEach((k) => { if (k.startsWith('lnv-')) delete BAG_HOVER[k]; });
  function bagVariantCardHTML(item, index = 0, eager = false, displayName) {
    const t = T();
    const fullName = t.pick(item.title);
    const name = displayName || fullName;
    const imgLoad = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
    const product = YZA.getProduct?.(item.handle) || item;
    const sizeLabel = releasedSizeLabel(product, item.size, t);
    const status = YZA.inventoryStatus?.(product) || { soldOut: false, almostGone: false, inventory: null };
    const stock = stockCopy();
    const wished = wishlistHas(item.handle);
    // Once a bag row is release-owned, released gallery order is authoritative too;
    // a filename-keyed legacy hover override must not put an old image back on the card.
    const hoverKey = item.releasedColorway ? null : Object.keys(BAG_HOVER).find((k) => String(item.img || '').includes(k));
    const bagHover = hoverKey ? BAG_HOVER[hoverKey] : null;
    const hoverVid = bagHover && bagHover.video;
    // item.hoverImg is set per size+colour by the card-media override (white product image
    // by default, worn/lifestyle shot on hover). It must win over gallery[1], because that
    // override also collapses gallery to a single entry — without this the colour-row cards
    // (XS/S/M of one colourway) would have no hover image at all.
    const _hoverRaw = (bagHover && bagHover.img) || item.hoverImg || ((item.gallery && item.gallery[1] && item.gallery[1] !== item.img) ? item.gallery[1] : '');
    // Même règle que dans cardHTML : un survol égal à l'image principale ne fait rien.
    // (_normImg est local à cardHTML — on refait la normalisation ici, sans dépendance.)
    const _stripQ = (s) => String(s || '').replace(/\?.*$/, '');
    const hoverImgSrc = (_hoverRaw && _stripQ(_hoverRaw) === _stripQ(item.img)) ? '' : _hoverRaw;
    // La couleur DOIT voyager avec le bouton. Sans elle, l'ajout rapide envoyait une
    // variante vide et le panier retombait sur le coloris par défaut du produit : une
    // cliente demandant « S Noir » recevait « S Violet » (signalé le 2026-07-24).
    // Même format que la fiche produit — « Taille / Couleur » dans la langue courante —
    // pour que les deux chemins d'achat produisent des lignes de panier identiques.
    const _qbColor = item.color ? t.pick(item.color) : '';
    const _qbVariant = [sizeLabel, _qbColor].filter(Boolean).join(' / ');
    const addBag = !status.soldOut
      ? `<button class="product-card__addbag" type="button" data-quickbuy="${esc(item.handle || '')}"${_qbVariant ? ` data-quickbuy-variant="${esc(_qbVariant)}"` : ''}>${esc(t.t('col.addbag'))}</button>`
      : '';
    return `<article class="product-card product-card--bag-variant${status.soldOut ? ' is-sold-out' : ''}" data-size="${esc(String(item.size || '').toUpperCase())}" style="--i:${index}" data-product-handle="${esc(item.handle || '')}">
      <div class="product-card__media-wrap">
      <button class="product-card__wish${wished ? ' is-active' : ''}" type="button" data-wishlist-toggle="${esc(item.handle || '')}" aria-pressed="${wished ? 'true' : 'false'}" aria-label="${esc(t.t(wished ? 'a.wishRemove' : 'a.wishAdd'))}">${heartIcon()}</button>
      <a class="product-card__media${hoverVid ? ' has-hover-video' : ''}" href="${esc(item.url)}" data-product-card-click="${esc(item.handle || '')}" aria-label="${esc(fullName)}">
        ${(item.onSale && item.compareAt > item.price && !status.soldOut) ? `<span class="product-card__sale">${esc((YZA.promos?.familySale?.label || {})[t.lang] || '-50 %')}</span>` : ''}
        ${status.almostGone ? `<span class="product-card__stock">${esc(stock.almost)}</span>` : ''}
        ${status.soldOut ? `<span class="product-card__sold">${esc(stock.sold)}</span>` : ''}
        <img class="product-card__img" src="${esc(item.img)}" alt="${esc(t.pick(item.imageAlt || {}) || fullName + ' - YZA')}" ${imgLoad} width="461" height="615" decoding="async">
        ${hoverImgSrc ? `<img class="product-card__img product-card__img--hover" src="${esc(hoverImgSrc)}" alt="" aria-hidden="true" loading="lazy" width="461" height="615" decoding="async">` : ''}
        ${hoverVid ? `<video class="product-card__vid" muted loop playsinline preload="none" poster="${esc(item.img)}" data-hover-video="${esc(hoverVid)}" width="461" height="615" aria-hidden="true"></video>` : ''}
      </a>
      ${addBag}
      </div>
      <a class="product-card__info" href="${esc(item.url)}" data-product-card-click="${esc(item.handle || '')}">
        <span class="product-card__name">${esc(name)}</span>
        <span class="product-card__price">${formatCardPrice(item)}</span>
        ${status.almostGone ? `<span class="product-card__limited">${status.inventory} ${esc(stock.left)}</span>` : ''}
      </a>
    </article>`;
  }
 const stars = (n = 5, label) => {
 const g = '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
 return label ? `<span class="stars" role="img" aria-label="${label}">${g}</span>`
 : `<span class="stars" aria-hidden="true">${g}</span>`;
 };
 const renderGrid = (el, list) => { if (el) el.innerHTML = list.map((p, i) => cardHTML(p, i)).join(''); };

 // ── Unified product carousel (Swiper) ───────────────────────────────
 // Cult-Gaia-style: 4 cards per view on desktop, arrows advance ONE card at
 // a time, looped. Swiper is loaded on demand from the CDN (the site already
 // pulls fonts from a CDN) and reused across every carousel on the page.
 const SWIPER_CSS = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
 const SWIPER_JS = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
 YZA.motion.preference.addEventListener('change', () => {
   document.querySelectorAll('.yza-swiper').forEach(el => {
     const slider = el._swiper; if (!slider || slider.destroyed) return;
     slider.params.speed = YZA.motion.duration('move');
     if (YZA.motion.preference.matches) { slider.setTransition(0); slider.setTranslate(slider.translate); }
   });
 });
 function ensureSwiper() {
 if (window.Swiper) return Promise.resolve(window.Swiper);
 if (YZA._swiperPromise) return YZA._swiperPromise;
 const cssP = new Promise((res) => {
 if (document.querySelector('link[data-swiper-css]')) return res();
 const link = document.createElement('link');
 link.rel = 'stylesheet'; link.href = SWIPER_CSS; link.setAttribute('data-swiper-css', '');
 link.onload = res; link.onerror = res; // never block render on CSS
 document.head.appendChild(link);
 });
 const jsP = new Promise((res, rej) => {
 const s = document.createElement('script');
 s.src = SWIPER_JS; s.async = true;
 s.onload = res; s.onerror = () => rej(new Error('Swiper script failed to load'));
 document.head.appendChild(s);
 });
 YZA._swiperPromise = Promise.all([cssP, jsP]).then(() => window.Swiper);
 return YZA._swiperPromise;
 }
 const navChev = (d) => `<svg viewBox="0 0 9 16" width="9" height="16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d === 'prev' ? '<path d="M7.5 1 1.5 8l6 7"/>' : '<path d="M1.5 1 7.5 8l-6 7"/>'}</svg>`;

 // Lightweight draggable carousel for offer-grid product cards.
 // Click stays for short interactions (under 8px drag); >8px drag suppresses click
 // so users can swipe images without accidentally navigating to the PDP.
 function wireOfferCarousel(media) {
 const count = parseInt(media.getAttribute('data-count'), 10) || 1;
 if (count < 2) return;
 const track = media.querySelector('.offer-card__track');
 const card = media.closest('.offer-card');
 const dots = card ? card.querySelectorAll('.offer-card__dot') : [];
 const overlay = media.querySelector('.offer-card__overlay');
 let idx = 0;
 let startX = 0, startY = 0, dx = 0, dy = 0;
 let dragging = false;
 let didDrag = false;
 let w = 0;
 function setIdx(n) {
 idx = Math.max(0, Math.min(count - 1, n));
 track.style.transform = 'translateX(' + (-idx * 100) + '%)';
 dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
 }
 function down(e) {
 const t = e.touches ? e.touches[0] : e;
 startX = t.clientX; startY = t.clientY; dx = 0; dy = 0;
 dragging = true; didDrag = false;
 w = media.getBoundingClientRect().width;
 track.classList.add('is-dragging');
 if (!e.touches) e.preventDefault();
 }
 function move(e) {
 if (!dragging) return;
 const t = e.touches ? e.touches[0] : e;
 dx = t.clientX - startX;
 dy = t.clientY - startY;
 // Vertical scroll wins — bail
 if (!didDrag && Math.abs(dy) > Math.abs(dx) * 1.4) { up(); return; }
 if (Math.abs(dx) > 8) didDrag = true;
 if (didDrag) {
 if (e.cancelable && e.touches) e.preventDefault();
 track.style.transform = 'translateX(' + (-idx * w + dx) + 'px)';
 }
 }
 function up() {
 if (!dragging) return;
 dragging = false;
 track.classList.remove('is-dragging');
 const threshold = Math.max(40, w * 0.15);
 if (dx < -threshold && idx < count - 1) setIdx(idx + 1);
 else if (dx > threshold && idx > 0) setIdx(idx - 1);
 else setIdx(idx);
 }
 // Swallow click after a drag so the overlay <a> doesn't navigate
 if (overlay) {
 overlay.addEventListener('click', (e) => { if (didDrag) { e.preventDefault(); e.stopPropagation(); didDrag = false; } });
 }
 media.addEventListener('mousedown', down);
 document.addEventListener('mousemove', move);
 document.addEventListener('mouseup', up);
 media.addEventListener('touchstart', down, { passive: true });
 media.addEventListener('touchmove', move, { passive: false });
 media.addEventListener('touchend', up);
 media.addEventListener('touchcancel', up);
 // Click on left/right halves of the media area to step through (when not dragged)
 media.addEventListener('click', (e) => {
 if (didDrag) return;
 if (!e.target.closest('.offer-card__overlay')) return;
 // overlay click is handled by the link
 });
 // Mouse wheel as a secondary affordance
 setIdx(0);
 }

 // Build a product carousel into `el` from `list`, using `cardFn` for each card.
 function buildSwiper(el, list, cardFn, options = {}) {
 if (!el || !list || !list.length) return;
 const make = cardFn || cardHTML;
 const t = T();
 const slides = list.map((p, i) => `<div class="swiper-slide">${make(p, i)}</div>`).join('');
 el.classList.remove('product-grid', 'product-rail');
 el.classList.add('yza-swiper', 'swiper');
 el.innerHTML = `
 <div class="swiper-wrapper">${slides}</div>
 <button type="button" class="yza-swiper__nav yza-swiper__nav--prev" aria-label="${esc(t.t('carousel.prev'))}">${navChev('prev')}</button>
 <button type="button" class="yza-swiper__nav yza-swiper__nav--next" aria-label="${esc(t.t('carousel.next'))}">${navChev('next')}</button>`;
 // Swiper loop needs slides >= 2 * (slidesPerView + loopAdditionalSlides).
 // With slidesPerView=4 desktop + loopAdditionalSlides=4 → 16 needed.
 // Below that, drop the loop and lean on watchOverflow to hide arrows at
 // the ends - the only "loss" is the wraparound, not the slide-by-slide nav.
 const canLoop = list.length >= 16;
 ensureSwiper().then((Swiper) => {
 if (!Swiper || !el.isConnected) return;
 if (el._swiper) { try { el._swiper.destroy(true, false); } catch (e) {} }
 el._swiper = new Swiper(el, {
 slidesPerView: 1.4,
 slidesPerGroup: 1, // arrows move exactly one product
 spaceBetween: 5,
 speed: YZA.motion.duration('move'), // Shared timing; zero for reduced motion.
 longSwipes: true,
 longSwipesRatio: 0.5,
 resistanceRatio: 0.85,
 loop: canLoop,
 loopAdditionalSlides: canLoop ? 4 : 0,
 watchOverflow: true, // hide arrows when everything already fits
 threshold: 5,
 grabCursor: true,
 // Re-measure when a parent (e.g. an alsoRailBlock that toggles hidden)
 // changes - without this Swiper can mount inside a 0-width container.
 observer: true,
 observeParents: true,
 navigation: {
 prevEl: el.querySelector('.yza-swiper__nav--prev'),
 nextEl: el.querySelector('.yza-swiper__nav--next'),
 },
 breakpoints: {
 600: { slidesPerView: 2.4 },
 900: { slidesPerView: 3 },
 1200: { slidesPerView: 4 },
 },
 ...options,
 });
 }).catch((err) => {
 console.warn('YZA carousel: Swiper unavailable, falling back to scroll row.', err);
 el.classList.remove('swiper');
 el.classList.add('yza-swiper--fallback');
 enableDragScroll(el.querySelector('.swiper-wrapper'));
 });
 if (document.documentElement.classList.contains('js')) requestAnimationFrame(wireReveal);
 }

 // Public entry kept for callers: renders a product carousel.
 function renderCarousel(el, list, cardFn) { buildSwiper(el, list, cardFn); }

 // Native scrolling owns momentum and remains interruptible by the visitor.
 function smoothScrollBy(el, delta) { YZA.motion.scrollBy(el, delta); }
 YZA.smoothScrollBy = smoothScrollBy;

 // Pointer drag-to-scroll for any horizontal carousel/rail.
 // Mouse + pen are driven manually (with flick momentum); touch keeps the
 // browser's native momentum scrolling, which is already buttery once the
 // snap type is "proximity" instead of "mandatory".
 function enableDragScroll(el) {
 if (!el || el.dataset.dragReady === '1') return;
 el.dataset.dragReady = '1';
 let down = false, moved = false, startX = 0, startLeft = 0, pid = null;
 let lastX = 0, lastT = 0, vx = 0, raf = 0;
 const stopGlide = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
 el.addEventListener('pointerdown', (e) => {
 if (e.pointerType === 'touch') return; // native scroll owns touch
 if (e.button !== 0) return;
 down = true; moved = false; pid = e.pointerId;
 startX = e.clientX; lastX = e.clientX; lastT = e.timeStamp || 0;
 startLeft = el.scrollLeft; vx = 0; stopGlide();
 el.scrollTo({left:startLeft,behavior:"instant"});
 });
 el.addEventListener('pointermove', (e) => {
 if (!down || e.pointerId !== pid) return;
 const dx = e.clientX - startX;
 if (!moved && Math.abs(dx) > 4) {
 moved = true;
 el.classList.add('is-dragging');
 try { el.setPointerCapture(pid); } catch (_) {}
 }
 if (!moved) return;
 const tNow = e.timeStamp || 0, dt = tNow - lastT;
 if (dt > 0) vx = (e.clientX - lastX) / dt; // px per ms
 lastX = e.clientX; lastT = tNow;
 el.scrollLeft = startLeft - dx;
 e.preventDefault();
 }, { passive: false });
 const release = () => {
 if (!down) return;
 down = false;
 el.classList.remove('is-dragging');
 try { el.releasePointerCapture(pid); } catch (_) {}
 if (moved && Math.abs(vx) > 0.05 && !YZA.motion.preference.matches) {
   smoothScrollBy(el, Math.max(-el.clientWidth * .5, Math.min(el.clientWidth * .5, -vx * 120)));
 }
 };
 el.addEventListener('pointerup', release);
 el.addEventListener('pointercancel', () => { vx = 0; release(); });
 el.addEventListener('lostpointercapture', () => { vx = 0; release(); });
 // Swallow the click that fires right after a drag so cards don't navigate.
 el.addEventListener('click', (e) => {
 if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
 }, true);
 }
 YZA.enableDragScroll = enableDragScroll;

 YZA.renderCarousel = renderCarousel;

 const mediaText = (obj) => obj ? (T().pick(obj) || obj.en || obj.fr || '') : '';
  const mediaImg = (src, alt = 'YZA image', extra = '') => {
    const width = (extra.match(/\bwidth=["']?(\d+)/) || [])[1] || '640';
    const height = (extra.match(/\bheight=["']?(\d+)/) || [])[1] || '860';
    const cleanExtra = extra.replace(/\s*\b(width|height)=["']?\d+["']?/g, '');
    return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" width="${width}" height="${height}" decoding="async" ${cleanExtra}>`;
  };
 const isPublicMedia = (src) => !YZA.publicProductImage || YZA.publicProductImage(src);

 function initHomeVideoHero() {
 const section = $('[data-video-hero]');
 const video = section?.querySelector('.hero__video');
 if (!section || !video) return;

 const mobileQuery = window.matchMedia('(max-width: 767px)');
 const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
 const sourceForViewport = () => mobileQuery.matches ? video.dataset.mobileSrc : video.dataset.desktopSrc;
 const posterForViewport = () => mobileQuery.matches ? video.dataset.mobilePoster : video.dataset.desktopPoster;
 let canLoadVideo = false;

 const setPoster = () => {
 const poster = posterForViewport();
 if (!poster) return;
 // Resolve to an absolute URL before handing it to the custom property:
 // a relative url() inside --hero-poster is otherwise resolved against
 // css/styles.css (the sheet that consumes the var), giving
 // /yza-v2-preview/css/assets/hero/… → 404 and a black hero whenever autoplay is blocked
 // on mobile (Low Power Mode, data-saver, slow connection).
 const absPoster = new URL(poster, document.baseURI).href;
 video.setAttribute('poster', poster);
 section.style.setProperty('--hero-poster', `url("${absPoster}")`);
 };

 const unloadVideo = () => {
 video.pause();
 video.removeAttribute('src');
 video.load();
 section.classList.remove('is-video-ready');
 section.classList.add('hero--poster-only');
 };

 const playVideo = () => {
 if (document.visibilityState === 'hidden') return;
 const playPromise = video.play();
 if (playPromise?.then) {
 playPromise
 .then(() => section.classList.remove('hero--poster-only'))
 .catch(() => section.classList.add('hero--poster-only'));
 }
 };

 const syncVideo = () => {
 setPoster();
 if (motionQuery.matches) {
 unloadVideo();
 return;
 }

 if (!canLoadVideo) {
 section.classList.add('hero--poster-only');
 return;
 }
 section.classList.remove('hero--poster-only');
 const src = sourceForViewport();
 if (!src) return;
 video.setAttribute('autoplay', '');
 if (video.getAttribute('src') !== src) {
 section.classList.remove('is-video-ready');
 video.setAttribute('src', src);
 video.load();
 }
 playVideo();
 };

 video.addEventListener('loadeddata', () => section.classList.add('is-video-ready'), { once: false });
 document.addEventListener('visibilitychange', syncVideo);
 mobileQuery.addEventListener?.('change', syncVideo);
 motionQuery.addEventListener?.('change', syncVideo);
 const loadOnIntent = () => {
 if (canLoadVideo || motionQuery.matches) return;
 canLoadVideo = true;
 syncVideo();
 };
 if ('IntersectionObserver' in window) {
 document.body.classList.add('is-on-video-hero');
 const heroObserver = new IntersectionObserver(([entry]) => {
 document.body.classList.toggle('is-on-video-hero', entry.isIntersecting && entry.intersectionRatio > 0.18);
 }, { threshold: [0, 0.18] });
 heroObserver.observe(section);
 }
 ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach((type) => {
 window.addEventListener(type, loadOnIntent, { once: true, passive: true });
 });
 setPoster();
 section.classList.add('hero--poster-only');
 syncVideo();
 }

 function initFooterWidgetGuard() {
 const footer = document.querySelector('.footer');
 if (!footer || !('IntersectionObserver' in window)) return;
 const observer = new IntersectionObserver((entries) => {
 const isVisible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.03);
 document.body.classList.toggle('is-footer-visible', isVisible);
 }, { threshold: [0, 0.03, 0.12] });
 observer.observe(footer);
 }

 function mediaBreakHTML(story) {
 if (!story) return '';
 const title = mediaText(story.title);
 const kicker = mediaText(story.kicker);
 const text = mediaText(story.text);
 const images = story.images || [];
 if (story.layout === 'wide') {
 return `<section class="product-story product-story--wide" data-reveal>
 <div class="product-story__image">${mediaImg(images[0], title || T().t('alt.editorial.worn'), 'width="1480" height="920"')}</div>
 <div class="product-story__copy product-story__copy--overlay">
 <p class="eyebrow">${esc(kicker)}</p>
 <h2>${esc(title)}</h2>
 </div>
 </section>`;
 }
 return `<section class="product-story product-story--duo" data-reveal>
 <div class="product-story__copy">
 <p class="eyebrow">${esc(kicker)}</p>
 <h2>${esc(title)}</h2>
 ${text ? `<p>${esc(text)}</p>` : ''}
 </div>
 ${images.slice(0, 2).map((src) => `<div class="product-story__image">${mediaImg(src, title || T().t('alt.product.worn'), 'width="1120" height="1400"')}</div>`).join('')}
 </section>`;
 }

 function storyCopy() {
 const lang = T().lang || 'fr';
 const copy = {
 fr: {
 duoKicker: 'Porte par la femme YZA',
 duoTitle: 'Le crochet se comprend mieux sur le corps.',
 duoText: 'Chaque piece garde la tension de la main, les heures de crochet et la finition d atelier qui la rendent impossible a comparer a une production machine.',
 fullKicker: 'La rarete est la regle',
 fullTitle: 'Editions limitees, grands standards.',
 },
 en: {
 duoKicker: 'Worn by the YZA woman',
 duoTitle: 'Crochet makes sense on the body.',
 duoText: 'Every piece carries hand tension, crochet hours and atelier finishing, which is why it should not be compared with machine-made alternatives.',
 fullKicker: 'Scarcity is the rule',
 fullTitle: 'Limited editions, high standards.',
 },
 es: {
 duoKicker: 'Llevado por la mujer YZA',
 duoTitle: 'El crochet se entiende sobre el cuerpo.',
 duoText: 'Cada pieza lleva tension de mano, horas de crochet y acabado de atelier.',
 fullKicker: 'La rareza es la regla',
 fullTitle: 'Series pequenas, estandares altos.',
 },
 tr: {
 duoKicker: 'YZA kadini uzerinde',
 duoTitle: 'Krose vucutta anlam kazanir.',
 duoText: 'Her parca el tansiyonu, saatlerce krose ve atolye bitisi tasir.',
 fullKicker: 'Azlik kuraldir',
 fullTitle: 'Kucuk seriler, yuksek standartlar.',
 },
 ar: {
 duoKicker: '\u062A\u0631\u062A\u062F\u064A\u0647\u0627 \u0627\u0645\u0631\u0623\u0629 YZA',
 duoTitle: '\u0627\u0644\u0643\u0631\u0648\u0634\u064A\u0647 \u064A\u0638\u0647\u0631 \u0639\u0644\u0649 \u0627\u0644\u062C\u0633\u062F.',
 duoText: '\u0643\u0644 \u0642\u0637\u0639\u0629 \u062A\u062D\u0645\u0644 \u0633\u0627\u0639\u0627\u062A \u0639\u0645\u0644 \u064A\u062F\u0648\u064A \u0648\u062A\u0634\u0637\u064A\u0628 \u0648\u0631\u0634\u0629.',
 fullKicker: '\u0627\u0644\u0646\u062F\u0631\u0629 \u0647\u064A \u0627\u0644\u0642\u0627\u0639\u062F\u0629',
 fullTitle: '\u0633\u0644\u0633\u0644\u0627\u062A \u0635\u063A\u064A\u0631\u0629 \u0648\u0645\u0639\u0627\u064A\u064A\u0631 \u0639\u0627\u0644\u064A\u0629.',
 },
 };
 return copy[lang] || copy.fr;
 }
 // Returns the editorial-break list for the active collection category.
 function activeEditorialBreaks() {
 const m = YZA.media || {};
 if (collState.cat === 'charms' && (m.charmEditorialBreaks || []).length) return m.charmEditorialBreaks;
 if (['accessories', 'earrings'].includes(collState.cat) && (m.accessoryEditorialBreaks || []).length) return m.accessoryEditorialBreaks;
 if (['rtw', 'tops', 'pareos', 'pants', 'bottoms'].includes(collState.cat) && (m.rtwEditorialBreaks || []).length) return m.rtwEditorialBreaks;
 return m.editorialBreaks || [];
 }
 function collectionBreakHTML(setIndex) {
 const catBreaks = activeEditorialBreaks();
 if (catBreaks.length) return mediaBreakHTML(catBreaks[setIndex % catBreaks.length]);
 const c = storyCopy();
 const duoSets = [
 ['assets/yza-girls/girls-rin-look-1.jpg', 'assets/yza-girls/girls-rin-look-2.jpg'],
 ['assets/products/bag-sculpture-red-seated.jpg', 'assets/products/charms-on-bag.jpg'],
 ['assets/yza-girls/girls-rin-look-3.jpg', 'assets/products/bag-sculpture-group.jpg'],
 ];
 if (setIndex % 3 === 1) {
 const full = ['assets/lifestyle/hero.jpg', 'assets/lifestyle/editorial-grapes.jpg'][setIndex % 2];
 return `<section class="product-story product-story--wide" data-reveal>
 <div class="product-story__image"><img src="${full}" alt="${esc(T().t('alt.editorial.worn'))}" loading="lazy" width="1480" height="920" decoding="async"></div>
 <div class="product-story__copy product-story__copy--overlay">
 <p class="eyebrow">${esc(c.fullKicker)}</p>
 <h2>${esc(c.fullTitle)}</h2>
 </div>
 </section>`;
 }
 const imgs = duoSets[setIndex % duoSets.length];
 return `<section class="product-story product-story--duo" data-reveal>
 <div class="product-story__copy">
 <p class="eyebrow">${esc(c.duoKicker)}</p>
 <h2>${esc(c.duoTitle)}</h2>
 <p>${esc(c.duoText)}</p>
 </div>
 ${imgs.map((src) => `<div class="product-story__image"><img src="${src}" alt="${esc(T().t('alt.product.worn'))}" loading="lazy" width="1120" height="1400" decoding="async"></div>`).join('')}
 </section>`;
 }
 function renderCollectionGrid(el, list) {
 if (!el) return;
 if (collState.cat === 'bestsellers' && YZA.bestsellerCollection) { YZA.bestsellerCollection.renderGrid(el, list, collState, cardHTML); return; }
 if (collState.cat === 'accessories' && YZA.bijouxCollection) { YZA.bijouxCollection.renderGrid(el, list, collState, cardHTML); return; }
 if (collState.cat === 'charms' && YZA.charmCollection) { YZA.charmCollection.renderGrid(el, list, collState, cardHTML); return; }
 if (collState.cat === 'rtw' && YZA.rtwCollection) {
 el.innerHTML = list.map((product, i) => cardHTML(collState.color ? { ...product, _cardColorSlug: collState.color } : product, i, i < 4, { tile: true })).join('');
 return;
 }
 // Render EVERY editorial break for this category: weave them between product rows
 // (more often when there are many, so a short grid still shows them all), then
 // append any that didn't fit so no selling-point block is ever dropped.
 const catBreaks = activeEditorialBreaks();
 const breakCount = catBreaks.length || 3;
 const interval = breakCount > 3 ? 2 : 4;
 let breakSeq = 0;
 let html = list.map((p, i) => {
 let story = '';
 if ((i + 1) % interval === 0 && i < list.length - 1 && breakSeq < breakCount) {
 story = collectionBreakHTML(breakSeq); breakSeq += 1;
 }
 return cardHTML(p, i, i < 4, { tile: true }) + story;
 }).join('');
 for (; breakSeq < breakCount; breakSeq += 1) html += collectionBreakHTML(breakSeq);
 el.innerHTML = html;
 if (document.documentElement.classList.contains('js')) requestAnimationFrame(wireReveal);
 }

 function renderBagCollectionGrid(el, list) {
 if (!el) return;
 if (YZA.bagCollection) { YZA.bagCollection.renderGrid(el, list, collState, bagVariantCardHTML); return; }
 const t = T();
 const normalizeLabel = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
 const allowedHandles = new Set(list.map((p) => p.handle));
 const q = (collState.q || '').trim().toLowerCase();
 const rowMatches = (row) => {
 if (!q) return true;
 const text = [
 t.pick(row.familyTitle), t.pick(row.rowTitle), t.pick(row.color),
 ...(row.items || []).flatMap((item) => {
  const product = YZA.getProduct?.(item.handle);
  return [t.pick(item.title), item.size, releasedSizeLabel(product, item.size, t), t.pick(item.color)];
 }),
 ].join(' ').toLowerCase();
 return text.includes(q);
 };
 // Deux familles peuvent employer le MÊME slug de couleur pour des teintes
 // différentes : `rouge` = « Hot Red » chez La Sculpture et « Rose / Rouge » chez
 // La Nouvelle Vague. Indexer le filtre sur le seul slug faisait donc disparaître
 // la seconde de la liste, et sélectionner l'une affichait les deux. La valeur du
 // filtre est désormais « famille:slug ». On accepte encore un slug nu, pour ne
 // pas casser un lien déjà partagé.
 // « famille:slug » (nouveau) ou slug nu (ancien lien partagé).
 const colorFilterMatches = (row, value) => {
  const v = String(value || '');
  if (v.indexOf(':') === -1) return row.colorSlug === v;
  const cut = v.indexOf(':');
  return row.familyHandle === v.slice(0, cut) && row.colorSlug === v.slice(cut + 1);
 };
 const rows = (YZA.activeBagRows ? YZA.activeBagRows() : [])
  .map((row) => ({ ...row, items: (row.items || []).filter((item) => allowedHandles.has(item.handle)) }))
  .filter((row) => row.items.length && rowMatches(row)
  && (!collState.family || row.familyHandle === collState.family)
  && (!collState.color || colorFilterMatches(row, collState.color)));
 const groups = new Map();
 rows.forEach((row) => {
 const key = row.familyHandle || t.pick(row.familyTitle);
 if (!groups.has(key)) groups.set(key, []);
 groups.get(key).push(row);
 });
 const sections = Array.from(groups.entries());
 let cardIndex = 0;
 el.innerHTML = sections.map(([key, familyRows], sectionIndex) => {
 const lead = familyRows[0];
 const title = t.pick(lead.familyTitle);
 const eyebrow = t.pick(lead.familyEyebrow) || t.t('col.bags');
 // familyText (« Choisissez d'abord la couleur… ») retiré à la demande du client
 // le 2026-07-24 : consigne redondante avec l'interface.
 const titleEscRe = new RegExp('^' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\u00B7\\-]+', 'i');
 const rowsHtml = familyRows.map((row) => {
 const cards = row.items.map((item) => { const ci = cardIndex++; const dn = t.pick(item.title).replace(titleEscRe, '').trim() || null; return bagVariantCardHTML(item, ci, ci < 4, dn); }).join('');
 const rowTitle = t.pick(row.rowTitle);
 const displayRowTitle = rowTitle.replace(titleEscRe, '').trim() || rowTitle;
 const showRowHead = normalizeLabel(displayRowTitle) !== normalizeLabel(title);
 return `<div class="bag-color-row${showRowHead ? '' : ' bag-color-row--compact'}" data-bag-color="${esc(row.colorSlug || '')}">
 ${showRowHead ? `<div class="bag-color-row__head">
 <h3>${esc(displayRowTitle)}</h3>
 <p>${esc(row.items.map((item) => releasedSizeLabel(YZA.getProduct?.(item.handle), item.size, t)).join(' / '))}</p>
 </div>` : ''}
 <div class="bag-family-grid">${cards}</div>
 </div>`;
 }).join('');
 const bagBreaks = YZA.media?.bagsEditorialBreaks || [];
 const breakHTML = (sectionIndex < sections.length - 1 && bagBreaks.length)
 ? mediaBreakHTML(bagBreaks[sectionIndex % bagBreaks.length])
 : '';
 return `<section class="bag-family-section" data-bag-family="${esc(key)}" data-reveal style="--i:${sectionIndex}">
 <div class="bag-family-head">
 <div>
 <p class="eyebrow">${esc(eyebrow)}</p>
 <h2>${esc(title)}</h2>
 </div>
 </div>
 ${rowsHtml}
 </section>` + breakHTML;
 }).join('');
 if (document.documentElement.classList.contains('js')) requestAnimationFrame(wireReveal);
 }

 /* ================= ACCUEIL ================= */
 function renderHome() {
 const t = T();
 // best-sellers : charms hors coffrets - carrousel landing
 const promoOk = typeof YZA.isLaunchPromoProduct === 'function' ? YZA.isLaunchPromoProduct : (p) => p && p.launchPromo !== false;
 // Page-wide image de-dup: seed with every static image already on the home page
 // (category cards, duo tiles, closing band, charm rotators) so the JS grids never
 // repeat one. Excludes the containers we're about to (re)fill.
 const usedHomeImg = new Set(
 Array.from(document.querySelectorAll('main img[src], main video[src]'))
 .filter((m) => !m.closest('#bestGrid, #offerGrid, #girlsPreviewGrid'))
 .map((m) => String(m.getAttribute('src') || '').replace(/\?.*$/, ''))
 );
 // Offer = 4 curated heroes; keep them OUT of best-sellers so no product/image repeats.
 const offerHandles = ['la-sculpture-xs-basket-bag-ss26', 'yza-palazzo-pants-jawhara-ss26', 'raffia-orange-slice-charm-ss26', 'grapes-raffia-earrings-ss26'];
 // Fixed full-bleed product grid (Jacquemus "New In" style) instead of a carousel — 2 per category.
 const maisonHome = document.body.classList.contains('home-maison');
 YZA.renderHomeMaison?.();
 const bestList = ["raffia-cherries-charm-ss26", "raffia-grapes-charm-ss26", "la-sculpture-s-basket-bag-ss26", "la-sculpture-m-basket-bag-ss26", "yza-scarf-top-jawhara-ss26", "yza-button-up-shirt-jawhara-ss26", "watermelon-raffia-earrings-ss26", "kiwi-raffia-earrings-ss26"].map(h => YZA.getProduct(h)).filter(Boolean);
 const bestGrid = $('#bestGrid');
 if (bestGrid) bestGrid.innerHTML = bestList.map((p, i) => cardHTML(p, i, false, { used: usedHomeImg })).join('');

 // bande presse (savoir-faire fondatrice)
 const press = $('#pressList');
 if (press) press.innerHTML = YZA.press.map(n => `<span>${n}</span>`).join('');

 // L'offre : 4 pièces clés du catalogue, chacune avec carrousel draggable
 const offer = $('#offerGrid');
 if (offer) {
 // One pick per category, each with a multi-image runtime gallery for the draggable carousel.
 const picks = offerHandles.map(h => YZA.getProduct ? YZA.getProduct(h) : null).filter(Boolean);
 // Fixed product grid (Jacquemus style) — standard cards, single image + hover-swap, no per-card swipe.
 offer.innerHTML = picks.map((p, i) => cardHTML(p, i, false, { used: usedHomeImg })).join('');
 }

 // Reviews — THREE real reviews per page (verified ReviewXpo + Instagram), left-aligned,
 // with prev/next arrows + a gentle auto-advance (client: "mieux d'en avoir 3 avec les flèches").
 const tg = $('#testimonialsGrid');
 if (tg) {
 tg.setAttribute('data-placeholder', 'reviews');
 tg.classList.add('reviews-editorial', 'reviews-editorial--trio');
 const reviewNames = ['Chloé', 'Common Saints', 'Wafaa T.'];
 const allReviews = reviewNames.map(name => (YZA.testimonials || []).find(r => r.name === name)).filter(Boolean);
 // strip trailing emoji/space so a quote never ends on a broken 😍 / ❤️
 const EMOJI_END = /(?:️|[☀-➿]|[⬀-⯿]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|\s)+$/;
 const clean = (s) => String(s || '').trim().replace(EMOJI_END, '').trim();
 const isVerified = (r) => !!(r.place && r.place.fr === 'Avis vérifié');
 let PER = 3;
 const pages = Math.max(1, Math.ceil(allReviews.length / PER));
 let page = 0;
 let updateCount = () => {};
 const card = (r) => `<figure class="review-card">
 <span class="review-card__stars" aria-hidden="true">${stars(5, t.t('social.rating'))}</span>
 <blockquote class="review-card__quote">${esc(clean(t.pick(r.text)))}</blockquote>
 <figcaption class="review-card__by"><span class="review-card__name">${esc(r.name)}</span><span class="review-card__src${isVerified(r) ? ' is-verified' : ''}">${esc((r.place && t.pick(r.place)) || '')}</span></figcaption>
 </figure>`;
 const draw = () => {
 const slice = allReviews.slice(page * PER, page * PER + PER);
 tg.innerHTML = '<div class="reviews-trio">' + slice.map(card).join('') + '</div>';
 updateCount();
 };
 const go = (dir) => { page = (page + dir + pages) % pages; draw(); };
 if (allReviews.length) draw();
 // Reviews advance only through their existing controls.
 const wrap = $('.reviews-more-wrap');
 if (wrap && maisonHome) {
 const moreLabels = { fr: ['Voir plus d’avis', 'Réduire les avis'], en: ['More reviews', 'Fewer reviews'], es: ['Más opiniones', 'Menos opiniones'], tr: ['Daha fazla yorum', 'Daha az yorum'], ar: ['المزيد من الآراء', 'آراء أقل'] };
 const labels = moreLabels[t.lang] || moreLabels.fr;
 wrap.innerHTML = '<button type="button" class="home-button" aria-expanded="false">' + labels[0] + '</button>';
 wrap.hidden = allReviews.length <= 8;
 const button = wrap.querySelector('button');
 button.addEventListener('click', () => {
 const expanded = button.getAttribute('aria-expanded') !== 'true';
 button.setAttribute('aria-expanded', String(expanded));
 button.textContent = labels[expanded ? 1 : 0];
 PER = expanded ? allReviews.length : 8;
 draw();
 });
 } else if (wrap && pages > 1) {
 wrap.innerHTML = '<div class="reviews-nav"><button type="button" class="reviews-nav__btn" data-dir="-1" aria-label="Avis précédents"><svg class="reviews-nav__chev" viewBox="0 0 10 16" aria-hidden="true"><path d="M7 2 2 8 7 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="reviews-nav__count" aria-hidden="true"></span><button type="button" class="reviews-nav__btn" data-dir="1" aria-label="Avis suivants"><svg class="reviews-nav__chev" viewBox="0 0 10 16" aria-hidden="true"><path d="M3 2 8 8 3 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>';
 const counter = wrap.querySelector('.reviews-nav__count');
 updateCount = () => { counter.innerHTML = (page + 1) + '<span class="reviews-nav__sep" aria-hidden="true">◆</span>' + pages; };
 updateCount();
 wrap.querySelectorAll('.reviews-nav__btn').forEach((b) => b.addEventListener('click', () => { go(parseInt(b.dataset.dir, 10)); }));
 } else if (wrap) { wrap.hidden = true; }
 }
 const rs = $('#ratingSummary');
 if (rs) {
 rs.setAttribute('data-placeholder', 'reviews');
 const st = YZA.reviewStats;
 rs.innerHTML = st.real
 ? `${stars(st.avg, `${t.t('social.ratingOf')} ${String(st.avg).replace('.', ',')}/5`)} <strong>${String(st.avg).replace('.', ',')}/5</strong> · ${st.count} ${t.t('pp.reviews')}`
 : `${stars(5, t.t('social.rating'))} <span>${t.t('social.rating')}</span>`;
 }
 }

 // Colours still sold in the shop. Any other worn colourway is a sold-out batch (never remade).
 const GIRLS_IN_STORE_COLORS = ['violet', 'rouge', 'noir', 'bleu', 'rose'];
 function girlSoldOut(girl) { return GIRLS_IN_STORE_COLORS.indexOf(String((girl && girl.color) || '').toLowerCase()) === -1; }
 function scarcityPill(extra = '') { return `<span class="scarcity-pill${extra}">${esc(T().t('girls.soldOut'))}</span>`; }

 function girlsCardHTML(girl, index = 0, compact = false) {
 const handles = girl.lookProductHandles || [];
 const handle = handles[0] || '';
 const href = handle ? productUrl(handle) : (girl.lookHref || `yza-girls#${esc(girl.color || 'girls')}`);
 const soldOut = girlSoldOut(girl);
 const cta = soldOut ? T().t('girls.shopCurrent') : T().t('girls.shopLook');
 return `<a class="${compact ? 'girls-home-card' : 'girls-card'}${soldOut ? ' is-soldout' : ''}" href="${href}" data-shop-look="${esc(handle || girl.id || '')}" style="--i:${index}">
 <figure>
 ${mediaImg(girl.src, (typeof girl.alt === 'object' ? T().pick(girl.alt) : girl.alt) || girl.product || 'YZA Girl', 'width="720" height="960"')}
 <figcaption>
 <strong>${esc(girl.name || 'YZA Girl')}</strong>
 <span>${esc(girl.product || '')}${girl.city ? ` / ${esc(girl.city)}` : ''}</span>
 <em>${esc(cta)}</em>
 </figcaption>
 </figure>
 </a>`;
 }

 // Full-bleed band videos: only play the one(s) in view (saves CPU / mobile data).
 // renderPage() (and thus this) re-runs on every language change, so reuse one
 // observer and disconnect it first - otherwise each switch leaks another observer.
 let bandVideoIO = null;
 const pauseAmbientVideos = () => {
   if (document.hidden || YZA.motion.preference.matches) {
     $$('.video-band__media, .product-card__vid').forEach(v => v.pause());
   }
 };
 document.addEventListener('visibilitychange', pauseAmbientVideos);
 YZA.motion.preference.addEventListener('change', pauseAmbientVideos);
 function initBandVideos() {
 const vids = $$('.video-band__media');
 if (!vids.length || !('IntersectionObserver' in window)) return;
 if (bandVideoIO) bandVideoIO.disconnect();
 bandVideoIO = new IntersectionObserver((entries) => {
 entries.forEach((e) => {
 const v = e.target;
 if (e.isIntersecting && !YZA.motion.preference.matches && !document.hidden) {
 // Lazy load: the heavy band clips ship as data-src + preload="none" so they cost
 // zero bytes on first paint; promote to a real src only as they near the viewport.
 if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; v.load(); }
 const p = v.play && v.play(); if (p && p.catch) p.catch(() => {});
 }
 else if (v.pause) v.pause();
 });
 }, { threshold: 0.2, rootMargin: '300px 0px' });
 vids.forEach((v) => bandVideoIO.observe(v));
 }

 // Instagram-style feed tile: portrait image + hover overlay (no permanent caption).
 function girlsFeedCardHTML(girl, index = 0) {
 const handles = girl.lookProductHandles || [];
 const handle = handles[0] || '';
 const href = handle ? productUrl(handle) : (girl.lookHref || `yza-girls#${esc(girl.color || 'girls')}`);
 const soldOut = girlSoldOut(girl);
 const cta = soldOut ? T().t('girls.shopCurrent') : T().t('girls.shopLook');
 const metaLine = [girl.product, girl.city].filter(Boolean).join(' · ');
 return `<a class="girls-feed__item${soldOut ? ' is-soldout' : ''}" href="${href}" data-shop-look="${esc(handle || girl.id || '')}" style="--i:${index}">
 ${mediaImg(girl.src, (typeof girl.alt === 'object' ? T().pick(girl.alt) : girl.alt) || girl.product || 'YZA Girl', 'width="720" height="960"')}
 <span class="girls-feed__meta"><strong>${esc(girl.name || 'YZA Girl')}</strong>${metaLine ? `<span>${esc(metaLine)}</span>` : ''}</span>
 <span class="girls-feed__overlay" aria-hidden="true"><span class="girls-feed__cta">${esc(cta)}</span></span>
 </a>`;
 }

 // Round-robin by name so the same girl's photos never bunch together.
 function interleaveByName(arr) {
 const groups = [];
 const byName = {};
 arr.forEach((g) => { if (!byName[g.name]) { byName[g.name] = []; groups.push(byName[g.name]); } byName[g.name].push(g); });
 const out = [];
 let added = true;
 while (added) { added = false; groups.forEach((b) => { if (b.length) { out.push(b.shift()); added = true; } }); }
 return out;
 }
 // Variety guardrail for every YZA-girls strip: takes a (pre-interleaved) list and drops any
 // entry whose image FILE or near-identical caption (same girl/product/city) was already used,
 // and caps how many tiles any single girl gets so no one person (e.g. Rime) dominates.
 // usedSrc/usedCap can be shared across surfaces (wall + stories) so nothing repeats down a page.
 function balancedGirls(list, opts) {
 opts = opts || {};
 const perName = opts.perName || Infinity;
 const usedSrc = opts.usedSrc instanceof Set ? opts.usedSrc : new Set();
 const usedCap = opts.usedCap instanceof Set ? opts.usedCap : new Set();
 const nameCount = new Map();
 const out = [];
 (list || []).forEach((g) => {
 if (!g || !g.src || usedSrc.has(g.src)) return;
 const cap = [g.name, g.product, g.city].join('|');
 if (usedCap.has(cap)) return;
 const nm = g.name || 'YZA Girl';
 if ((nameCount.get(nm) || 0) >= perName) return;
 nameCount.set(nm, (nameCount.get(nm) || 0) + 1);
 usedSrc.add(g.src);
 usedCap.add(cap);
 out.push(g);
 });
 return out;
 }
 function renderGirlsPreview() {
 const el = $('#girlsPreviewGrid');
 if (el && YZA.modelStories) { YZA.modelStories.render(el, 'home'); return; }
 if (!el || !YZA.media?.yzaGirls?.length) return;
 // Cap to 2 tiles per girl so the home strip stays varied — no single girl (Rime) dominates.
 const publicGirls = balancedGirls(
 interleaveByName(YZA.media.yzaGirls.filter((girl) => isPublicMedia(girl.src))),
 { perName: 2 }
 );
 el.innerHTML = publicGirls.slice(0, document.body.classList.contains('home-maison') ? 6 : 12).map((girl, index) => girlsFeedCardHTML(girl, index)).join('');
 el.querySelectorAll('[data-shop-look]').forEach((link) => {
 link.addEventListener('click', () => YZA.analytics?.track('yza_girls_shop_look_click', { handle: link.dataset.shopLook || '', source: 'home_preview' }));
 });
 }

 function renderGirlsPage() {
 const wall = $('#girlsMasonry');
 if (!wall || !YZA.media?.yzaGirls?.length) return;
 // One page-wide image registry: any photo (or near-identical caption) shown in the wall
 // is never shown again in the colour stories or the living wall. Cap 3 tiles per girl so
 // no single person (Rime) dominates the gallery.
 const usedSrc = new Set();
 const usedCap = new Set();
 const publicGirls = balancedGirls(
 interleaveByName(YZA.media.yzaGirls.filter((girl) => isPublicMedia(girl.src))),
 { perName: 3, usedSrc, usedCap }
 );
 if (YZA.modelStories) {
 YZA.modelStories.render(wall, 'girls');
 } else {
 // Paginated wall + "Charger plus" (client: the page was far too long).
 const CHUNK = 12;
 let shown = Math.min(CHUNK, publicGirls.length);
 let moreBtn = wall.parentElement.querySelector('.girls-loadmore button');
 const drawWall = () => {
 wall.innerHTML = publicGirls.slice(0, shown).map((girl, index) => girlsCardHTML(girl, index)).join('');
 wall.querySelectorAll('[data-shop-look]').forEach((link) => {
 link.addEventListener('click', () => YZA.analytics?.track('yza_girls_shop_look_click', { handle: link.dataset.shopLook || '', source: 'girls_page' }));
 });
 if (moreBtn) moreBtn.parentElement.hidden = shown >= publicGirls.length;
 };
 if (!moreBtn && publicGirls.length > CHUNK) {
 const holder = document.createElement('div');
 holder.className = 'girls-loadmore';
 holder.innerHTML = `<button type="button" class="btn btn--outline" data-i18n="girls.loadMore">${esc(T().t('girls.loadMore'))}</button>`;
 wall.insertAdjacentElement('afterend', holder);
 moreBtn = holder.querySelector('button');
 moreBtn.addEventListener('click', () => { shown = Math.min(shown + CHUNK, publicGirls.length); drawWall(); });
 }
 drawWall();

 }

 // Colour-story galleries: there aren't enough distinct customer photos to fill both the
 // "real life" wall above AND a per-colour story without repeating (or resurfacing Rime),
 // so these tiles use each colour's curated gallery (worn + lookbook + product close-ups).
 // Every image is deduped against the wall and the other stories, so NOTHING repeats.
 const girlsImagesFor = (key) => {
 const story = YZA.media.productStories?.[key];
 const list = (story && story.images) || [];
 const out = [];
 list.forEach((s) => {
 if (out.length >= 3 || !s || !isPublicMedia(s)) return;
 if (usedSrc.has(s)) return;
 out.push(s);
 });
 return out;
 };

 const storyMap = $('#girlsProductMap');
 if (storyMap) {
 const keys = ['jaune', 'violet', 'noir', 'rouge', 'bags', 'charms', 'rtw'];
 storyMap.innerHTML = keys.map((key) => {
 const story = YZA.media.productStories?.[key];
 if (!story) return '';
 const imgs = girlsImagesFor(key).slice(0, 3);
 if (imgs.length < 2) return '';
 imgs.forEach((src) => usedSrc.add(src)); // commit so the living wall never repeats them
 const title = mediaText(story.title);
 const text = mediaText(story.text);
 return `<article class="girls-product-story" id="${esc(key)}">
 <div class="girls-product-story__copy">
 <p class="eyebrow">${esc(mediaText(story.label))}</p>
 <h3>${esc(title)}</h3>
 <p>${esc(text)}</p>
 <a class="link-underline" href="${story.cta || '/collections'}">${T().t('cta.shop')}</a>
 </div>
 <div class="girls-product-story__images">
 ${imgs.map((src) => `<span>${mediaImg(src, title, 'width="560" height="720"')}</span>`).join('')}
 </div>
 </article>`;
 }).join('');
 }

 renderArchiveWall(usedSrc);
 }

 async function renderArchiveWall(used) {
 used = used instanceof Set ? used : new Set();
 const el = $('#girlsArchiveWall');
 if (!el || el.dataset.loaded) return;
 el.dataset.loaded = 'loading';
 try {
 let data = null;
 const ledger = await fetch('data/media-ledger-public.json').catch(() => null);
 if (ledger?.ok) data = await ledger.json();
 if (!data) { el.dataset.loaded = 'empty'; el.innerHTML = ''; return; }
 // Visual blocklist (data/archive-blocklist-public.json): public-safe paths flagged by pixel
 // analysis as black-background cutouts, logos/glyphs, or document-page scans.
 // Keeps the living wall to real editorial photography only.
 const norm = (s) => String(s || '').replace(/\\/g, '/');
 let blocked = new Set();
 try {
 const bl = await fetch('data/archive-blocklist-public.json').then((r) => (r.ok ? r.json() : []));
 blocked = new Set((bl || []).map(norm));
 } catch (e) { /* no blocklist available -> fall back to pattern filter only */ }
 const blockedArchive = /postcard|family-tree|mastercard|visa|payment|favicon|logo|brand|map|waze|google|apple|whatsapp|charte|template|reference|intro-cafe|yza-lookbook-page-\d|p6[1-4]_img\d+_xref14/i;
 const entries = (data.entries || [])
 .filter((entry) => entry.kind === 'image')
 .filter((entry) => {
 if (entry.isReferenceOnly || entry.usage === 'private-reference') return false;
 const group = entry.group || entry.usageGroup || '';
 // Wholesale line sheets, order forms, brand-charter scans, QA shots and
 // internal dossier material must never surface as public imagery.
 if (['charte', 'raffia', 'dossier', 'linesheet2026', 'sheets', 'qa', 'audit', '_charms'].includes(group)) return false;
 if (/linesh|line-?sheet|order ?form|wholesale/i.test([entry.href, entry.fileName, entry.title].filter(Boolean).join(' '))) return false;
 if (blocked.has(norm(entry.href || entry.publicPath))) return false;
 const label = [entry.href, entry.publicPath, entry.fileName, entry.title, group].filter(Boolean).join(' ');
 if (blockedArchive.test(label) || !isPublicMedia(label)) return false;
 return ['lookbook', 'yza-girls'].includes(group) || entry.usage === 'public-yza-editorial' || entry.usage === 'public-yza-product';
 })
 .filter((entry) => entry.href || entry.publicPath)
 .filter((entry) => { const s = entry.href || entry.publicPath; if (!s || used.has(s)) return false; used.add(s); return true; })
 .slice(0, 220);
 // Paginated wall + "Charger plus" (client: 200+ tiles at once made the page endless).
 const AW_CHUNK = 24;
 let awShown = Math.min(AW_CHUNK, entries.length);
 const tileHTML = (entry, index) => {
 const src = entry.href || entry.publicPath;
 return `<figure class="girls-archive-item" style="--i:${index}">
 ${mediaImg(src, entry.title || entry.fileName || 'YZA source image', `width="${entry.width || 640}" height="${entry.height || 860}"`)}
 </figure>`;
 };
 let awBtn = null;
 const drawArchive = () => {
 el.innerHTML = entries.slice(0, awShown).map(tileHTML).join('');
 if (awBtn) awBtn.parentElement.hidden = awShown >= entries.length;
 };
 if (entries.length > AW_CHUNK && !el.parentElement.querySelector('.girls-loadmore')) {
 const holder = document.createElement('div');
 holder.className = 'girls-loadmore';
 holder.innerHTML = `<button type="button" class="btn btn--outline" data-i18n="girls.loadMore">${esc(T().t('girls.loadMore'))}</button>`;
 el.insertAdjacentElement('afterend', holder);
 awBtn = holder.querySelector('button');
 awBtn.addEventListener('click', () => { awShown = Math.min(awShown + AW_CHUNK, entries.length); drawArchive(); });
 }
 drawArchive();
 el.dataset.loaded = 'true';
 } catch (err) {
 el.dataset.loaded = 'error';
 el.innerHTML = '';
 console.warn('YZA archive wall could not load', err);
 }
 }

 /* ================= COLLECTIONS ================= */
 const GRID_DENSITIES = ['3', '4', '6'];
 let savedDensity = '3';
 try { const d = localStorage.getItem('yza_grid_density'); if (GRID_DENSITIES.includes(d)) savedDensity = d; } catch (e) {}
 const SORT_VALUES = ['feat', 'az', 'za', 'asc', 'desc'];
 const initialSort = SORT_VALUES.includes(params.get('sort')) ? params.get('sort') : 'feat';
 const collState = { cat: params.get('cat') || 'all', q: params.get('q') || '', sort: initialSort, family: params.get('family') || '', size: params.get('size') || '', color: params.get('color') || '', rtwGroup: params.get('group') || '', charmGroup: params.get('fruit') || '', bijouxTone: params.get('tone') || '', bestGroup: params.get('group') || '', bagColors: { 'la-sculpture': params.get('sculptureColor') || '', 'la-nouvelle-vague': params.get('vagueColor') || '' }, density: savedDensity };
 function collectionStateUrl() {
 const url = new URL(collectionUrl(collState.cat), location.origin);
 if (collState.q) url.searchParams.set('q', collState.q);
 if (collState.sort !== 'feat') url.searchParams.set('sort', collState.sort);
 if (collState.family) url.searchParams.set('family', collState.family);
 if (collState.size) url.searchParams.set('size', collState.size);
 if (collState.color) url.searchParams.set('color', collState.color);
 if (collState.cat === 'bestsellers' && collState.bestGroup) url.searchParams.set('group', collState.bestGroup);
 if (collState.cat === 'rtw' && collState.rtwGroup) url.searchParams.set('group', collState.rtwGroup);
 if (collState.cat === 'accessories' && collState.bijouxTone) url.searchParams.set('tone', collState.bijouxTone);
 if (collState.cat === 'charms' && collState.charmGroup) url.searchParams.set('fruit', collState.charmGroup);
 if (collState.cat === 'bags') for (const [family,key] of [['la-sculpture','sculptureColor'],['la-nouvelle-vague','vagueColor']]) { if (collState.bagColors[family]) url.searchParams.set(key, collState.bagColors[family]); }
 return url.pathname + url.search;
 }
 function pushCollectionState(replace = false) { history[replace ? 'replaceState' : 'pushState']({ yzaCollection: true }, '', collectionStateUrl()); }
 function readCollectionStateFromLocation() {
 const current = new URL(location.href);
 const match = current.pathname.replace(/^\/yza-v2-preview(?=\/|$)/, '').replace(/\/+$/, '').match(/^\/collections\/([a-z-]+)$/);
 collState.cat = (match && CAT_SLUGS[match[1]]) || current.searchParams.get('cat') || 'all';
 collState.q = current.searchParams.get('q') || '';
 collState.sort = SORT_VALUES.includes(current.searchParams.get('sort')) ? current.searchParams.get('sort') : 'feat';
 collState.family = current.searchParams.get('family') || '';
 collState.size = current.searchParams.get('size') || '';
 collState.color = current.searchParams.get('color') || '';
 collState.rtwGroup = current.searchParams.get('group') || '';
 collState.charmGroup = current.searchParams.get('fruit') || '';
 collState.bijouxTone = current.searchParams.get('tone') || '';
 collState.bestGroup = current.searchParams.get('group') || '';
 collState.bagColors = { 'la-sculpture': current.searchParams.get('sculptureColor') || '', 'la-nouvelle-vague': current.searchParams.get('vagueColor') || '' };
 const sort = $('#sortSelect'); if (sort) sort.value = collState.sort;
 }
 function collFiltered() {
 let list = collState.cat === 'bestsellers' && YZA.bestsellerCollection ? YZA.bestsellerCollection.filter(collState) : YZA.byCategory(collState.cat);
 if (collState.cat === 'accessories' && YZA.bijouxCollection) list = YZA.bijouxCollection.filter(list, collState);
 if (collState.cat === 'charms' && YZA.charmCollection) list = YZA.charmCollection.filter(list, collState);
 if (collState.cat === 'bags' && YZA.bagCollection) list = YZA.bagCollection.filter(list, collState);
 if (collState.cat === 'rtw' && YZA.rtwCollection) list = YZA.rtwCollection.filter(list, collState);
 if (collState.cat === 'bags' && collState.family) {
 const handles = new Set((YZA.activeBagRows ? YZA.activeBagRows(collState.family) : []).flatMap((row) => (row.items || []).map((item) => item.handle)));
 list = list.filter((product) => handles.has(product.handle));
 }
 if (collState.cat === 'bags' && collState.size) list = list.filter((product) =>
  (product.availableSizes || []).some((code) => String(code).toUpperCase() === collState.size.toUpperCase()));
 if (collState.q) {
 list = typeof YZA.searchProducts === 'function'
 ? YZA.searchProducts(collState.q, YZA.products.length, list).map((row) => row.product)
 : list;
 }
 if (collState.sort === 'asc') list = [...list].sort((a, b) => a.price - b.price);
 if (collState.sort === 'desc') list = [...list].sort((a, b) => b.price - a.price);
 if (collState.sort === 'az' || collState.sort === 'za') {
 const tt = T();
 list = [...list].sort((a, b) => (tt.pick(a.name) || '').localeCompare(tt.pick(b.name) || '', undefined, { sensitivity: 'base' }));
 if (collState.sort === 'za') list.reverse();
 }
 return list;
 }
 // Charms-only editorial: raffia fruit charms in YZA studio and basket context.
 function renderCharmStyling() {
 const el = $('#charmStyling'); if (!el) return;
 if (collState.cat !== 'charms' || collState.q) { el.hidden = true; el.innerHTML = ''; return; }
 const t = T();
 // Client 2026-07-21. The captions were on the wrong shots: "Dans le panier, prets a
 // clipser" sat under a basket with NO charm on it, while the shot that actually shows
 // charms clipped to a bag was captioned "Crochetes un a un a Gueliz". Swapped, so the
 // clipped-on-the-bag photo leads. The new close-up of the grape charm being worn takes
 // the "crochetes un a un" slot — it is the one that really shows the handwork.
 // real-luxury-charms.mp4 ("L'orange, qui se balance") dropped at the client's request.
 const shots = [
 { src: 'assets/products/fruit-market/styling/charms-atelier-raffia-detail.jpg', cap: t.t('charm.style.cap1'), width: 720, height: 961, type: 'image' },
 { src: 'assets/products/charms/charm-grappe-portee.jpg?v=20260721a', cap: t.t('charm.style.cap2'), width: 1000, height: 1500, type: 'image' },
 { src: 'assets/video/fruit-stall-charms.mp4?v=20260713l', cap: t.t('charm.style.cap3'), width: 720, height: 1280, type: 'video' },
 { src: 'assets/products/fruit-market/styling/charms-raffia-basket-bowl.jpg', cap: t.t('charm.style.cap4'), width: 1080, height: 1440, type: 'image' },
 ];
 el.hidden = false;
 el.innerHTML = `
 <div class="charm-styling__head" data-reveal>
 <p class="eyebrow">${esc(t.t('charm.style.eyebrow'))}</p>
 <h2>${esc(t.t('charm.style.title'))}</h2>
 <p class="charm-styling__text">${esc(t.t('charm.style.text'))}</p>
 <p class="charm-styling__tag">${esc(t.t('charm.style.tag'))}</p>
 </div>
 <div class="charm-styling__grid">
 ${shots.map((s, i) => `<figure class="charm-styling__item${i === 0 ? ' charm-styling__item--first' : ''}${s.type === 'video' ? ' charm-styling__item--video' : ''}" data-reveal style="--i:${i}">
 ${s.type === 'video' ? `<video autoplay muted loop playsinline preload="metadata" aria-label="${esc(s.cap)} - YZA" width="${s.width}" height="${s.height}"><source src="${esc(s.src)}" type="video/mp4"></video>` : `<img${i === 0 ? ' class="charm-desktop-img"' : ''} src="${esc(s.src)}" alt="${esc(s.cap)} - YZA" loading="lazy" width="${s.width}" height="${s.height}" decoding="async">`}
 <figcaption>${esc(s.cap)}</figcaption>
 </figure>`).join('')}
 </div>
 <div class="charm-styling__cats">
 <p class="charm-styling__cats-label">${esc(t.t('cta.exploreMore'))}</p>
 <div class="charm-related-grid">
 ${['bags','rtw','accessories'].map((cat) => { const p = (YZA.byCategory(cat) || []).find((item) => item.publicVisible !== false && item.img); const key = cat === 'bags' ? 'nav.bags' : cat === 'rtw' ? 'nav.rtw' : 'nav.accessories'; const view = p && p.defaultColorSlug && YZA.resolveProductColorView ? YZA.resolveProductColorView(p, p.defaultColorSlug) : p; return view ? `<a class="charm-related-card" href="${collectionUrl(cat)}"><span class="charm-related-card__media"><img src="${esc(view.img)}" alt="${esc(t.pick(view.imageAlt || view.name))}" loading="lazy" width="720" height="960" decoding="async"></span><span class="charm-related-card__label">${esc(t.t(key))}</span></a>` : ''; }).join('')}
 </div>
 </div>`;
 if (document.documentElement.classList.contains('js')) requestAnimationFrame(wireReveal);
 }
 // Category storytelling (charms craft-time, Jawhara fabric story) — shown only on those collections.
 function renderCollectionStory() {
 // Category story renders BELOW the product grid (client: it was breaking the grid mid-tiles
 // and hiding the last products). Uses the dedicated #colStory container after the grid.
 const el = $('#colStory');
 const grid = $('#collectionGrid'); if (!grid) return;
 grid.querySelectorAll('.col-story--ingrid').forEach((n) => n.remove()); // remove any legacy in-grid panels
 if (!el) return;
 const t = T();
 // `earrings` renvoie au recit charms : le document valide avec Nawal titre cette
 // histoire « FRUIT MARKET — Charms & Bijoux », elle couvre donc explicitement les deux.
 // Sans cette entree, /collections/boucles-d-oreilles n'affichait aucune carte postale
 // alors que les boucles sont, avec les charms, la moitie de la gamme Fruit Market.
 const map = { charms: 'charms', earrings: 'charms', rtw: 'rtw', tops: 'rtw', pareos: 'rtw', pants: 'rtw', bottoms: 'rtw' };
 const list = (YZA.CATEGORY_STORIES || {})[map[collState.cat]];
 if (!list || !list.length || collState.q) { el.hidden = true; el.innerHTML = ''; return; }
 const isRtwStory = map[collState.cat] === 'rtw';
 el.hidden = false;
 el.className = 'col-story col-story--below col-story--postcard' + (isRtwStory ? ' col-story--rtw' : '');
 // Une carte postale de Marrakech — c'est déjà le mot de la maison (« Une carte postale
 // de Marrakech. En format poche. »). Le récit de catégorie prend donc la forme d'un dos
 // de carte postale : le message à gauche, le timbre, le cachet et l'adresse de l'atelier
 // à droite. Timbre = le Yaz amazigh du jeu de symboles maison, jamais un emoji.
 const stamp = '<span class="postcard__stamp" aria-hidden="true">'
 + '<span class="postcard__stamp-sign">' + (YZA.berber ? YZA.berber('yaz') : '') + '</span>'
 + '<span class="postcard__stamp-name">YZA</span></span>';
 const mark = '<span class="postcard__mark" aria-hidden="true">'
 + '<span class="postcard__mark-city">Marrakech</span>'
 + '<span class="postcard__mark-line"></span>'
 + '<span class="postcard__mark-year">SS26</span></span>';
 // Le récit déborde volontairement sur le côté adresse : sur une vraie carte, le
 // message continue à droite quand la place manque à gauche. Ça équilibre les deux
 // colonnes (client 2026-07-26) au lieu de laisser un grand vide sous l'adresse.
 // La coupe se fait sur une FIN DE PHRASE, jamais au milieu d'un mot, et seulement
 // s'il y a au moins deux phrases — sinon tout reste à gauche.
 const couperRecit = (txt) => {
 const phrases = String(txt || '').split(/(?<=[.!?…])\s+/).filter(Boolean);
 if (phrases.length < 3) return [txt, ''];
 const total = phrases.reduce((n, x) => n + x.length, 0);
 let n = 0, i = 0;
 while (i < phrases.length - 1 && n < total * 0.5) { n += phrases[i].length; i += 1; }
 return [phrases.slice(0, i).join(' '), phrases.slice(i).join(' ')];
 };
 el.innerHTML = list.map((s) => {
 const [debut, suite] = couperRecit(t.pick(s.histoire));
 return '<article class="postcard" data-reveal>'
 + '<div class="postcard__msg">'
 + '<blockquote class="postcard__quote">' + esc(t.pick(s.point)) + '</blockquote>'
 + '<h2 class="postcard__title">' + esc(t.pick(s.metaphore)) + '</h2>'
 + '<p class="postcard__text">' + esc(debut) + '</p>'
 + '</div>'
 + '<div class="postcard__addr">'
 + '<div class="postcard__philately">' + stamp + mark + '</div>'
 + (suite ? '<p class="postcard__text postcard__text--suite">' + esc(suite) + '</p>' : '')
 + '<p class="postcard__cta">' + esc(t.pick(s.invitation)) + '</p>'
 + '<p class="postcard__from">66 rue Yougoslavie<br>Guéliz · Marrakech</p>'
 + '</div>'
 + '</article>';
 }).join('');
 if (document.documentElement.classList.contains('js')) requestAnimationFrame(wireReveal);
 }

 /* Survol JOUR / NUIT par coloris (cliente 2026-07-30).
    L'image de carte reste le PACKSHOT — c'est lui qui porte la couleur juste. C'est le
    SURVOL qui prend la photo portée, et il change avec la bascule Jour/Nuit : version
    lumineuse le jour, version du soir la nuit.
    Le survol suit donc DEUX variables, le coloris et l'ambiance. Si le coloris courant
    n'a pas de photo pour l'ambiance courante, on RETIRE le calque : jamais le survol
    d'une autre couleur, c'est exactement ce que la cliente avait signalé le 29/07.
    Le calque est créé à la volée parce que cardHTML ne l'émet pas pour ces pièces (voir
    son commentaire : « No dedicated hover shot in the colour package »). */
 /* LE LIEN DE LA CARTE DOIT EMPORTER LE CORIS AFFICHE (cliente 2026-08-06 : « je clique
    une jupe jaune et j'arrive sur la blanche »).
    La pastille de carte changeait l'image, le survol et l'épuisement — mais jamais le
    `href`. On partait donc sur `/produits/<handle>` sans paramètre, et la fiche, faute de
    `?color=`, ouvrait son coloris PAR DÉFAUT : le Blanc Jasmin. La cliente voyait du jaune,
    cliquait, obtenait du blanc — et rien dans le code ne signalait quoi que ce soit.
    Cette fonction est le pendant exact d'applyColorHover : un seul endroit, appelé partout
    où une carte est habillée d'une couleur (pastille, rail spectre, panachage Jour/Nuit).
    La fiche valide déjà `?color=` contre les coloris réels de la pièce, un slug inconnu y
    est donc ignoré sans dommage. */
 function applyColorLink(card, slug) {
   if (!card) return;
   card.querySelectorAll('a[data-product-card-click]').forEach((a) => {
     const brut = a.getAttribute('href');
     if (!brut) return;
     try {
       const u = new URL(brut, location.origin);
       if (slug) u.searchParams.set('color', slug); else u.searchParams.delete('color');
       a.setAttribute('href', u.pathname + u.search + u.hash);
     } catch (_) { /* href exotique : on préfère un lien intact à un lien cassé */ }
   });
 }

 function applyColorCardCopy(card, handle, slug) {
   if (!card) return;
   const product = YZA.getProduct?.(handle);
   if (!product) return;
   const view = slug && YZA.resolveProductColorView?.(product, slug);
   const stableName = T().pick(displayName(product));
   const name = card.querySelector('.product-card__name');
   if (name) { name.textContent = stableName; name.setAttribute('title', stableName); }
   card.querySelectorAll('.product-card__media[data-product-card-click]').forEach((media) => media.setAttribute('aria-label', stableName));
   const image = card.querySelector('.product-card__img:not(.product-card__img--hover)');
   if (image) image.setAttribute('alt', T().pick(view?.imageAlt || product.imageAlt || product.name) || stableName);
 }

 function applyColorHover(card, handle, slug) {
   const e = (YZA.jawharaColorMedia || {})[handle];
   const c = e && e.colors && e.colors[slug];
   const night = document.documentElement.getAttribute('data-yza-mood') === 'night';
   let src = c ? ((night ? c.hoverNight : c.hoverDay) || '') : '';
   if (collState.cat === 'rtw' && YZA.rtwCollection) src = YZA.rtwCollection.hoverSource(handle, slug, night);
   if (!src && !night && collState.cat === 'rtw' && YZA.rtwCollection) {
     // The released color gallery provides an accurate alternate when no lifestyle hover is published.
     const row = YZA.productColorway?.(handle, slug);
     src = row && (row.gallery || []).find((image) => image !== row.front && /\.(?:webp|png|jpe?g)(?:\?|$)/i.test(image)) || '';
   }
   let img = card.querySelector('.product-card__img--hover');
   if (!src) { if (img) img.remove(); return; }
   if (!img) {
     // :not(--hover) est indispensable : le calque porte AUSSI la classe product-card__img,
     // et sans le filtre un second appel se raccrocherait a lui-meme.
     const main = card.querySelector('.product-card__img:not(.product-card__img--hover)');
     if (!main) return;
     img = document.createElement('img');
     img.className = 'product-card__img product-card__img--hover';
     img.alt = ''; img.setAttribute('aria-hidden', 'true');
     img.loading = 'lazy'; img.decoding = 'async';
     img.width = 800; img.height = 1200;        // 2:3, le cadre des cartes de collection
     main.insertAdjacentElement('afterend', img);   // juste après l'image principale
   }
   if (img.getAttribute('src') !== src) img.setAttribute('src', src);
 }

 /* Épuisement PAR CORIS (cliente 2026-08-03, jupe paréo midi en Jaune Safran).
    inventoryStatus() ne connaît que le produit entier : le passer à zéro aurait retiré la
    midi dans ses dix couleurs alors que seul le safran manque.
    Le badge doit SUIVRE la pastille : la carte n'est pas re-rendue quand on change de
    coloris (applyColor, dressGrid et dress ne touchent qu'à img.src), donc un badge posé
    une fois dans cardHTML resterait figé sur le coloris initial et mentirait. Même schéma
    que applyColorHover : une fonction appelée depuis les trois mêmes endroits.
    L'achat rapide est retiré, pas seulement grisé — un bouton désactivé qui reste dans le
    DOM finit toujours par être cliqué par un script ou au clavier. */
 function applyColorSoldOut(card, handle, slug) {
   const sold = !!(YZA.jawharaColorSoldOut && YZA.jawharaColorSoldOut(handle, slug));
   card.classList.toggle('is-color-sold-out', sold);
   const media = card.querySelector('.product-card__media');
   let tag = card.querySelector('.product-card__sold--color');
   if (!sold) { if (tag) tag.remove(); return; }
   if (!tag && media) {
     tag = document.createElement('span');
     tag.className = 'product-card__sold product-card__sold--color';
     media.appendChild(tag);
   }
   if (tag) tag.textContent = stockCopy().sold;
 }

 /* ================= MODE JOUR / NUIT (collection prêt-à-porter) =================
    Un contrôleur unique plutôt que des conditions dispersées. Il ne s'active que
    sur les catégories vêtement ; partout ailleurs il se retire complètement.
    Il ne touche JAMAIS aux pixels d'une photo produit : l'ambiance vient du fond
    de page, du cadre des cartes et du choix des coloris mis en avant. */
 const moodController = (function () {
  // Prêt-à-porter UNIQUEMENT (client 2026-07-24). Les sous-catégories vêtement
  // (tops, pareos, pants, bottoms) ne sont pas liées dans la navigation — elles ne
  // s'atteignent que par URL directe — donc les exclure ne retire rien de visible.
  const CLOTHING = ['rtw'];
  // Coloris mis en avant par ambiance — uniquement des variantes qui existent
  // vraiment dans le manifeste Jawhara.
  const DAY = ['blanc-jasmin', 'bleu-sama', 'vert-amande-clair', 'violet-lilas'];
  const NIGHT = ['noir-nuit', 'bordeaux', 'bleu-majorelle', 'vert-fonce', 'rouge-coquelicot'];
  let current = null, manualMode = null;

  const isClothing = () => CLOTHING.includes(collState.cat);
  // Each visit follows the visitor's local clock. A toggle choice lasts for this visit.
  const defaultMode = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? 'day' : 'night';
  };
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function label(mode) {
    const t = T();
    // the switch always offers the OTHER mode, so the label is the destination
    return mode === 'night' ? t.t('mood.toDay') : t.t('mood.toNight');
  }

  function paint(mode) {
    document.documentElement.setAttribute('data-yza-mood', mode);
    document.body.classList.add('is-mood');
    // theme-color n'est PLUS touché (client 2026-07-24) : il teinte la barre du
    // navigateur mobile, donc le chrome. L'ambiance reste dans la zone de contenu.
    const btn = $('#moodSwitch');
    if (btn) {
      btn.hidden = false;
      btn.setAttribute('aria-checked', mode === 'night' ? 'true' : 'false');
      btn.setAttribute('aria-label', label(mode));
      // Le bouton n'a plus de texte visible en permanence : l'infobulle native est le
      // seul indice au survol sur les navigateurs qui n'affichent pas notre pastille.
      btn.setAttribute('title', label(mode));
      const l = btn.querySelector('[data-mood-label]');
      if (l) l.textContent = label(mode);
    }
  }

  function teardown() {
    document.documentElement.removeAttribute('data-yza-mood');
    document.body.classList.remove('is-mood');
    const btn = $('#moodSwitch');
    if (btn) btn.hidden = true;
  }

  /* Re-colour the visible grid from the mood's sequence, cycling by card index so the
     page shows a balanced mix rather than nine identical garments. Only cards that
     actually have per-colour photography are touched; everything else is left alone. */
  function dressGrid(mode, animate) {
    if (YZA.rtwCollection) {
      YZA.rtwCollection.applyMood(mode, animate);
      $$('#collectionGrid .product-card[data-product-handle]').forEach(card => {
        const slug = card.querySelector('[data-color-slug].is-active')?.dataset.colorSlug || collState.color || '';
        applyColorHover(card, card.dataset.productHandle, slug);
      });
      return;
    }
    const seq = mode === 'night' ? NIGHT : DAY;
    const cards = $$('#collectionGrid .product-card[data-product-handle]');
    // Un coloris explicitement choisi dans le spectre PRIME sur le panachage : basculer
    // l'ambiance ne doit pas effacer en silence la demande de la visiteuse. C'est le même
    // arbitrage que dans spectrumController.sync(), simplement appliqué aussi ici — sans
    // quoi Jour/Nuit et le spectre se battaient, et le premier gagnait toujours.
    const pin = (typeof spectrumController !== 'undefined' && spectrumController.pinned)
      ? spectrumController.pinned() : null;
    let i = 0;
    cards.forEach((card) => {
      const handle = card.getAttribute('data-product-handle');
      if (!YZA.jawharaColorMedia || !YZA.jawharaColorMedia[handle]) return;
      const cycled = seq[i % seq.length]; i += 1;   // l'index avance quoi qu'il arrive
      const slug = (pin && (YZA.jawharaColorMedia[handle].colors || {})[pin]) ? pin : cycled;
      applyColorHover(card, handle, slug);     // avant le return : le survol suit l'ambiance
      applyColorSoldOut(card, handle, slug);   // et l'épuisement suit la pastille
      applyColorLink(card, slug);              // et le LIEN mène au coloris qu'on regarde
      applyColorCardCopy(card, handle, slug);
      const src = YZA.jawharaImage(handle, slug);
      if (!src) return;
      const img = card.querySelector('.product-card__img');
      if (img && img.getAttribute('src') !== src) {
        if (animate && !reduced()) YZA.motion.swapImage(img, src);
        else { img.src = src; }
      }
      // keep the swatch UI truthful — the selected colour must match what is shown
      const row = card.querySelector('[data-color-swatches]');
      if (row) row.querySelectorAll('[data-color-slug]').forEach((b) => {
        const on = b.getAttribute('data-color-slug') === slug;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      // preload only the NEXT themed image for this card, never all 72
      if (pin) return;                         // épinglé : la suite du cycle ne sera pas montrée
      const nxt = seq[(i) % seq.length];
      const nsrc = YZA.jawharaImage(handle, nxt);
      if (nsrc) { const p = new Image(); p.src = nsrc; }
    });
  }

  function sweep() {
    if (reduced()) return;
    let el = document.querySelector('.mood-sweep');
    if (!el) { el = document.createElement('div'); el.className = 'mood-sweep'; document.body.appendChild(el); }
    el.classList.remove('is-running');
    void el.offsetWidth;
    el.classList.add('is-running');
    setTimeout(() => el.classList.remove('is-running'), 700);
  }

  function set(mode, opts) {
    current = mode;
    paint(mode);
    dressGrid(mode, !!(opts && opts.animate));
    if (opts && opts.sweep) sweep();
    YZA.analytics?.track('rtw_mood', { mode });
  }

  let activeMoodTransition, moodRevision = 0;
  YZA.motion.preference.addEventListener('change', () => { if (YZA.motion.preference.matches) activeMoodTransition?.skipTransition(); });
  function animateTo(mode, btn) {
    const revision = ++moodRevision;
    current = mode;
    const apply = (opts) => { if (revision === moodRevision) set(mode, opts); };
    const root = document.documentElement;
    if (reduced() || typeof document.startViewTransition !== 'function' || !btn) {
      apply({ animate: !reduced(), sweep: false });
      return;
    }
    activeMoodTransition?.skipTransition();
    root.classList.add('is-mood-vt');
    const transition = document.startViewTransition(() => apply({ animate: false }));
    activeMoodTransition = transition;
    const done = () => { if (activeMoodTransition === transition) { activeMoodTransition = null; root.classList.remove('is-mood-vt'); } };
    transition.finished.then(done, done);
    transition.ready.then(() => {
      root.animate({opacity:[0,1]}, {duration:YZA.motion.duration('enter'),easing:'linear',pseudoElement:'::view-transition-new(root)'});
    }, () => {});
  }

  // one delegated listener for the lifetime of the page — re-rendering the grid
  // never adds a second one
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#moodSwitch');
    if (!btn || btn.hidden) return;
    manualMode = current === 'night' ? 'day' : 'night';
    animateTo(manualMode, btn);
  });

  return {
    sync() {
      if (!isClothing()) { teardown(); current = null; manualMode = null; return; }
      set(manualMode || defaultMode(), { animate: false });
    },
  };
 })();

 // ===========================================================================
 // SPECTRE DES COLORIS — prêt-à-porter uniquement.
 // Les 8 pièces Jawhara partagent exactement les mêmes 9 coloris : ce rail les
 // rhabille TOUTES d'un coup, pour voir la collection entière dans une seule
 // couleur. L'état « Mélange » rend la main à la bascule Jour/Nuit, qui elle
 // panache les coloris. Ne touche QUE des pixels : jamais un prix, un stock,
 // une variante de panier ni l'URL d'achat.
 // Écrit après moodController dans renderCollections(), donc un coloris choisi
 // l'emporte toujours sur le panachage de l'humeur.
 // ===========================================================================
 const spectrumController = (() => {
  const KEY = 'yza-rtw-spectrum';
  const MIX = 'mix';
  let current = MIX;
  let built = false;

  const el = (id) => document.getElementById(id);
  const isClothing = () => collState.cat === 'rtw' && !collState.q && !YZA.rtwCollection;
  const palette = () => (window.YZA && YZA.jawharaColors) || [];
  const read = () => { try { return localStorage.getItem(KEY) || MIX; } catch (e) { return MIX; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch (e) {} };
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Les cartes vêtement de la grille qui savent changer de coloris.
  const cards = () => $$('#collectionGrid .product-card[data-product-handle]')
    .filter((c) => (YZA.jawharaColorMedia || {})[c.dataset.productHandle]);

  function label(slug) {
    const t = T();
    if (slug === MIX) return t.t('spectrum.mix');
    const c = palette().find((x) => x.slug === slug);
    return c ? (c[t.lang] || c.fr || c.slug) : '';
  }

  function build() {
    const rail = el('rtwSpectrumRail');
    if (!rail || built) return;
    const list = palette();
    if (!list.length) return; // products.js pas encore prêt : on retentera au prochain sync
    const dot = (slug, style, name) =>
      `<button type="button" class="spectrum__dot" role="radio" aria-checked="false" tabindex="-1"` +
      ` data-spectrum-slug="${esc(slug)}" title="${esc(name)}" aria-label="${esc(name)}">` +
      `<span class="spectrum__chip" style="${style}"></span></button>`;
    // « Mélange » = toutes les couleurs en camaïeu, puis les 9 coloris de la saison.
    const mixStyle = 'background:conic-gradient(' + list.map((c, i) =>
      `${c.hex} ${Math.round((i / list.length) * 100)}% ${Math.round(((i + 1) / list.length) * 100)}%`).join(',') + ')';
    rail.innerHTML = dot(MIX, mixStyle, label(MIX))
      + list.map((c) => dot(c.slug, `background:${esc(c.hex)}`, c[T().lang] || c.fr)).join('');
    rail.setAttribute('aria-label', T().t('spectrum.aria'));
    built = true;
  }

  function paintControl() {
    const rail = el('rtwSpectrumRail');
    const name = el('rtwSpectrumName');
    if (!rail) return;
    let active = null;
    $$('#rtwSpectrumRail .spectrum__dot').forEach((b) => {
      const on = b.dataset.spectrumSlug === current;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;                       // un seul arrêt de tabulation (motif radiogroup)
      if (on) active = b;
    });
    // Le rail défile désormais sur petit écran : on ramène la pastille choisie dans le
    // champ, sinon au retour sur la page le coloris actif reste hors vue et le rail a
    // l'air d'être resté sur « Mélange ». scrollIntoView() ferait remonter TOUTE la page ;
    // on ne touche donc qu'au défilement interne du rail.
    if (active && rail.scrollWidth > rail.clientWidth) {
      const target = active.offsetLeft - (rail.clientWidth - active.offsetWidth) / 2;
      const max = rail.scrollWidth - rail.clientWidth;
      rail.scrollLeft = Math.max(0, Math.min(max, target));
    }
    if (name) name.textContent = label(current);
  }

  // Vidéo de survol neutralisée tant qu'un coloris précis est choisi : une vidéo est
  // tournée dans UN coloris, elle mentirait sur les neuf autres. L'IMAGE de survol, elle,
  // n'est plus concernée depuis applyColorHover() : elle est juste par construction.
  function lockHover(on) {
    cards().forEach((card) => card.classList.toggle('is-spectrum-locked', on));
  }

  // Échange l'image de chaque carte, avec le même fondu que la bascule Jour/Nuit.
  function dress(slug, animate) {
    cards().forEach((card) => {
      const handle = card.dataset.productHandle;
      const img = card.querySelector('.product-card__img');
      if (!img) return;
      // posé ici et pas seulement dans set() : sync() rappelle dress() après chaque
      // re-rendu de la grille, et les cartes neuves n'ont plus la classe.
      card.classList.add('is-spectrum-locked');
      applyColorHover(card, handle, slug);     // avant le return : le survol suit le coloris
      applyColorSoldOut(card, handle, slug);   // et l'épuisement suit la pastille
      applyColorLink(card, slug);
      applyColorCardCopy(card, handle, slug);
      const dots = card.querySelectorAll('[data-color-swatches] [data-color-slug]');
      dots.forEach((d) => {
        const on = d.dataset.colorSlug === slug;
        d.classList.toggle('is-active', on);
        d.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      const src = YZA.jawharaImage(handle, slug);
      if (!src || img.getAttribute('src') === src) return;
      const swap = () => {
        img.setAttribute('src', src);
        const view = YZA.resolveProductColorView?.(handle, slug);
        const alt = T().pick(view?.imageAlt || {});
        if (alt) img.setAttribute('alt', alt);
      };
      if (animate && !reduced()) YZA.motion.swapImage(img, src, swap);
      else swap();
      // les pastilles de la carte doivent suivre le spectre — et le lien avec elles
    });
  }

  function set(slug, opts) {
    const animate = !!(opts && opts.animate);
    current = slug;
    write(slug);
    paintControl();
    if (slug === MIX) {
      // on rend la main au panachage Jour/Nuit — et le survol reprend ses droits
      lockHover(false);
      if (typeof moodController !== 'undefined' && moodController.sync) moodController.sync();
    } else {
      dress(slug, animate);
    }
    if (animate) YZA.analytics?.track('rtw_spectrum', { color: slug });
  }

  // Un seul écouteur délégué pour toute la vie de la page (idem moodController) :
  // re-rendre la grille n'en ajoute jamais un second.
  document.addEventListener('click', (e) => {
    const dot = e.target.closest('#rtwSpectrumRail .spectrum__dot');
    if (!dot) return;
    e.preventDefault();
    set(dot.dataset.spectrumSlug, { animate: true });
  });
  // Glissé : on balaie la collection à la souris sans relâcher.
  // RESERVE A LA SOURIS depuis que le rail défile (2026-07-29) : au doigt, le geste
  // horizontal doit faire DEFILER le rail. Sans ce filtre, glisser pour atteindre les
  // dernières pastilles rhabillait la grille à chaque pastille survolée au passage.
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (!e.buttons) return;
    const rail = e.target.closest && e.target.closest('#rtwSpectrumRail');
    if (!rail) return;
    const dot = e.target.closest('.spectrum__dot');
    if (dot && dot.dataset.spectrumSlug !== current) set(dot.dataset.spectrumSlug, { animate: false });
  });
  // Clavier : flèches / Origine / Fin à l'intérieur du radiogroup.
  document.addEventListener('keydown', (e) => {
    const dot = e.target.closest && e.target.closest('#rtwSpectrumRail .spectrum__dot');
    if (!dot) return;
    const all = $$('#rtwSpectrumRail .spectrum__dot');
    const i = all.indexOf(dot);
    let j = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % all.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + all.length) % all.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = all.length - 1;
    if (j < 0) return;
    e.preventDefault();
    set(all[j].dataset.spectrumSlug, { animate: true });
    all[j].focus();
  });

  return {
    // Coloris épinglé par la visiteuse, ou null si elle est sur « Mélange ».
    // moodController s'en sert pour ne PAS écraser son choix à la bascule Jour/Nuit.
    pinned() { return current && current !== MIX ? current : null; },
    sync() {
      const wrap = el('rtwSpectrum');
      if (!wrap) return;
      if (!isClothing()) { wrap.hidden = true; return; }
      build();
      if (!built) return;
      wrap.hidden = false;
      current = read();
      if (current !== MIX && !palette().some((c) => c.slug === current)) current = MIX;
      paintControl();
      // au rendu, on ré-applique le coloris choisi APRÈS moodController (qui panache),
      // sans animation : la grille vient d'être reconstruite.
      if (current !== MIX) dress(current, false);
    },
  };
 })();

 function renderCollections() {
 const grid = $('#collectionGrid'); if (!grid) return;
 document.body.dataset.collection = collState.cat;
 const presentations = { bestsellers: YZA.bestsellerCollection, bags: YZA.bagCollection, rtw: YZA.rtwCollection, charms: YZA.charmCollection, accessories: YZA.bijouxCollection };
 for (const [cat,module] of Object.entries(presentations)) if (cat !== collState.cat) module?.prepare(collState);
 presentations[collState.cat]?.prepare(collState);
 const list = collFiltered();
 const isBags = collState.cat === 'bags';
 if (!list.length) {
 // Empty / no-results state — show the searched term + a reset link (Jacquemus),
 // instead of filling the grid with unrelated editorial blocks or going blank.
 grid.classList.remove('collection-grid--bag-families');
 grid.removeAttribute('data-density');
 const term = collState.q ? ' « ' + esc(collState.q) + ' »' : '';
 grid.innerHTML = `<div class="collection-empty"><p class="collection-empty__title">${esc(T().t('col.noresults'))}${term}</p><a class="link-underline" href="/collections">${esc(T().t('col.all'))}</a></div>`;
 const cs = $('#charmStyling'); if (cs) cs.hidden = true;
 const st = $('#colStory'); if (st) st.hidden = true;
 } else {
 grid.classList.toggle('collection-grid--bag-families', isBags);
 // Bag families keep their own column layout; the View-by density only drives the standard clothing/charm grid.
 if (isBags) grid.removeAttribute('data-density'); else grid.setAttribute('data-density', collState.density);
 if (isBags) renderBagCollectionGrid(grid, list);
 else renderCollectionGrid(grid, list);
 renderCharmStyling();
 renderCollectionStory();
 }
 // Re-arm the mood controller after every render (sort, filter, density, language,
 // popstate all funnel through here), so it never doubles its listeners.
 moodController.sync();
 // Le spectre passe APRÈS l'humeur : si une cliente a choisi un coloris, il doit
 // l'emporter sur le panachage Jour/Nuit qui vient de repeindre la grille.
 spectrumController.sync();
 const dWrap = $('#gridDensity');
 if (dWrap) {
 dWrap.hidden = isBags;
 $$('#gridDensity .grid-density__btn').forEach((b) => {
 const on = b.dataset.density === collState.density;
 b.classList.toggle('is-active', on);
 b.setAttribute('aria-pressed', on ? 'true' : 'false');
 });
 }
 const count = $('#resultCount'); if (count) count.textContent = list.length + ' ' + T().t('col.results');
 const titleKey = ({
 bestsellers: 'nav.bestSellers',
 charms: 'col.charms',
 earrings: 'col.earrings',
 accessories: 'col.accessories',
 rtw: 'col.rtw',
 tops: 'col.tops',
 pareos: 'col.pareos',
 pants: 'col.pants',
 bottoms: 'col.bottoms',
 bags: 'col.bags',
 })[collState.cat] || 'col.all';
 const tEl = $('#collectionTitleText'); if (tEl) { tEl.setAttribute('data-i18n', titleKey); tEl.textContent = T().t(titleKey); }
 const cEl = $('#collectionCount'); if (cEl) cEl.textContent = list.length;
 const descKey = ({ charms: 'col.desc.charms', earrings: 'col.desc.accessories', accessories: 'col.desc.accessories', bags: 'col.desc.bags', rtw: 'col.desc.rtw', tops: 'col.desc.rtw', pareos: 'col.desc.rtw', pants: 'col.desc.rtw', bottoms: 'col.desc.rtw' })[collState.cat] || 'col.desc.all';
 const dEl = $('#collectionDesc'); if (dEl) { dEl.setAttribute('data-i18n', descKey); dEl.textContent = T().t(descKey); }
 // Top-level pills mirror the site nav exactly (Charms · Accessories · Bags · Prêt-à-porter).
 // Map any granular landing (earrings, tops, …) onto its parent pill so the active state is always clear.
 const PILL_PARENT = { earrings: 'accessories', tops: 'rtw', pareos: 'rtw', pants: 'rtw', bottoms: 'rtw' };
 const activePill = PILL_PARENT[collState.cat] || collState.cat;
 $$('[data-cat]').forEach(b => {
 b.hidden = false;
 b.setAttribute('aria-pressed', b.dataset.cat === activePill ? 'true' : 'false');
 });
 const sortWrap = $('#collectionSort'); if (sortWrap) sortWrap.hidden = isBags;
 const bagGroup = $('#bagFilterGroup'); if (bagGroup) bagGroup.hidden = !isBags;
 const allLabel = ({ fr:'Toutes', en:'All', es:'Todas', tr:'Tümü', ar:'الكل' })[T().lang] || 'Toutes';
 const family = $('#bagFamilyFilter');
 if (family && isBags) { const values = new Map(); (YZA.activeBagRows ? YZA.activeBagRows() : []).forEach((row) => { if (!values.has(row.familyHandle)) values.set(row.familyHandle, T().pick(row.familyTitle)); }); family.innerHTML = `<option value="">${esc(allLabel)}</option>` + Array.from(values, ([value,label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join(''); family.value = collState.family; }
 const size = $('#bagSizeFilter');
 if (size && isBags) {
  const labels = new Map();
  (YZA.activeBagRows ? YZA.activeBagRows(collState.family || '') : []).forEach((row) => {
   (row.items || []).forEach((item) => {
    const code = String(item.size || '');
    if (!code) return;
    if (!labels.has(code)) labels.set(code, new Set());
    labels.get(code).add(releasedSizeLabel(YZA.getProduct?.(item.handle), code, T()));
   });
  });
  const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  size.innerHTML = `<option value="">${esc(allLabel)}</option>` + [...labels.entries()]
   .sort(([left], [right]) => (order.indexOf(left) - order.indexOf(right)) || left.localeCompare(right))
   .map(([code, names]) => `<option value="${esc(code)}">${esc([...names].join(' / '))}</option>`).join('');
  size.value = collState.size;
 } else if (size) size.value = '';
 const color = $('#colorFilter');
 if (color && isBags) { const values = new Map(); (YZA.activeBagRows ? YZA.activeBagRows(collState.family || '') : []).forEach((row) => { const k = row.familyHandle + ':' + row.colorSlug; if (!values.has(k)) values.set(k, T().pick(row.color)); }); color.innerHTML = `<option value="">${esc(allLabel)}</option>` + Array.from(values, ([value,label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join(''); color.value = collState.color; }
 if ($('#searchEcho')) $('#searchEcho').textContent = collState.q ? `"${collState.q}"` : '';
 YZA.rtwCollection?.render(collState, list);
 YZA.bagCollection?.render(collState, list);
 YZA.charmCollection?.render(collState, list);
 YZA.bijouxCollection?.render(collState, list);
 YZA.bestsellerCollection?.render(collState, list);
 YZA.modelStories?.renderPage();
 if (collState.cat === 'rtw' && YZA.rtwCollection) {
 grid.querySelectorAll('.product-card[data-product-handle]').forEach((card) => {
 const slug = card.querySelector('[data-color-slug].is-active')?.dataset.colorSlug;
 if (slug) { applyColorLink(card, slug); applyColorHover(card, card.dataset.productHandle, slug); applyColorSoldOut(card, card.dataset.productHandle, slug); }
 });
 }
 }
 YZA.collectionFilters = {
 update(filters) {
 if (collState.cat === 'bestsellers') {
 if ('group' in filters) collState.bestGroup = ['charms','accessories','bags','rtw'].includes(filters.group) ? filters.group : '';
 if (filters.reset) { collState.bestGroup = ''; collState.q = ''; }
 pushCollectionState(); renderCollections(); return;
 }
 if (collState.cat === 'bags') {
 if ('family' in filters) { collState.family = filters.family || ''; collState.color = ''; }
 if ('size' in filters) collState.size = filters.size || '';
 if (filters.bagColorFamily) { collState.bagColors[filters.bagColorFamily] = filters.bagColor || ''; collState.color = ''; }
 if (filters.reset) { collState.family = ''; collState.size = ''; collState.color = ''; collState.q = ''; collState.bagColors = {}; }
 pushCollectionState(); renderCollections(); return;
 }
 if (collState.cat === 'charms') {
 if ('group' in filters) collState.charmGroup = ['whole','slices'].includes(filters.group) ? filters.group : '';
 if (filters.reset) { collState.charmGroup = ''; collState.q = ''; }
 pushCollectionState(); renderCollections(); return;
 }
 if (collState.cat === 'accessories') {
 if ('tone' in filters) collState.bijouxTone = ['green','citrus','red','purple'].includes(filters.tone) ? filters.tone : '';
 if (filters.reset) { collState.bijouxTone = ''; collState.q = ''; }
 pushCollectionState(); renderCollections(); return;
 }
 if (collState.cat !== 'rtw') return;
 if ('group' in filters) collState.rtwGroup = ['tops','pareos','pants'].includes(filters.group) ? filters.group : '';
 if ('color' in filters) collState.color = filters.color || '';
 if (filters.reset) { collState.rtwGroup = ''; collState.color = ''; collState.q = ''; }
 pushCollectionState(); renderCollections();
 }
 };
 function wireCollections() {
 if (!$('#collectionGrid')) return;
 $$('[data-cat]').forEach(b => b.addEventListener('click', () => {
 collState.cat = b.dataset.cat;
 collState.q = ''; const si = $('#collSearch'); if (si) si.value = '';
 if (collState.cat === 'bags') collState.sort = 'feat'; else { collState.family=''; collState.size=''; collState.color=''; }
 pushCollectionState();
 YZA.analytics?.track('category_filter', { category: collState.cat });
 renderCollections();
 }));
 const sort = $('#sortSelect');
 if (sort) sort.addEventListener('change', () => { collState.sort = SORT_VALUES.includes(sort.value) ? sort.value : 'feat'; pushCollectionState(); renderCollections(); });
 const family = $('#bagFamilyFilter'); if (family) family.addEventListener('change', () => { collState.family=family.value||''; collState.color=''; pushCollectionState(); renderCollections(); });
 const size = $('#bagSizeFilter'); if (size) size.addEventListener('change', () => { collState.size=size.value||''; pushCollectionState(); renderCollections(); });
 const color = $('#colorFilter'); if (color) color.addEventListener('change', () => { collState.color=color.value||''; pushCollectionState(); renderCollections(); });
 $$('#gridDensity .grid-density__btn').forEach((b) => b.addEventListener('click', () => {
 const d = b.dataset.density;
 if (!GRID_DENSITIES.includes(d) || d === collState.density) return;
 collState.density = d;
 try { localStorage.setItem('yza_grid_density', d); } catch (e) {}
 YZA.analytics?.track('grid_density', { density: d });
 renderCollections();
 }));
 window.addEventListener('popstate', () => { readCollectionStateFromLocation(); renderCollections(); });
 }

 /* ================= PAGE PRODUIT ================= */
 function productPageCopy() {
 const lang = T().lang || 'fr';
 const copy = {
 fr: {
 similar: 'Produits similaires',
 also: 'Vous aimerez aussi',
 all: 'Tout voir',
 supportKicker: 'Besoin d aide ?',
 supportTitle: 'Toutes les reponses avant de commander',
 phone: 'Telephone / WhatsApp',
 store: 'Boutique Marrakech',
 prices: 'Guide prix',
 menus: 'Menus utiles',
 craft: 'Chaque piece est crochetee a la main dans l atelier de Guéliz, Marrakech. Pas de machine, peu de quantites, finitions controlees piece par piece.',
 scarce: 'Edition limitee: une fois vendue, la piece ne sera pas refaite a l identique.',
 add: 'Ajouter rapidement',
 },
 en: {
 similar: 'Similar products',
 also: 'You may also like',
 all: 'All products',
 supportKicker: 'Need help?',
 supportTitle: 'Everything buyers need before ordering',
 phone: 'Phone / WhatsApp',
 store: 'Marrakech store',
 prices: 'Price guide',
 menus: 'Useful menus',
 craft: 'Every piece is hand-crocheted in the Guéliz, Marrakech atelier. No machine shortcut, small quantities, finishing checked piece by piece.',
 scarce: 'Limited edition: once sold, the same piece is not remade.',
 add: 'Quick add',
 },
 es: {
 similar: 'Productos similares',
 also: 'Tambien te puede gustar',
 all: 'Ver todo',
 supportKicker: 'Necesitas ayuda?',
 supportTitle: 'Todo antes de comprar',
 phone: 'Telefono / WhatsApp',
 store: 'Tienda Marrakech',
 prices: 'Guia de precios',
 menus: 'Menus utiles',
 craft: 'Cada pieza esta tejida a crochet a mano en el atelier de Guéliz, Marrakech, en pequenas cantidades.',
 scarce: 'Edicion limitada: cuando se agota, no se rehace igual.',
 add: 'Anadir rapido',
 },
 tr: {
 similar: 'Benzer urunler',
 also: 'Bunlari da sevebilirsin',
 all: 'Tum urunler',
 supportKicker: 'Yardim lazim mi?',
 supportTitle: 'Siparis oncesi tum bilgiler',
 phone: 'Telefon / WhatsApp',
 store: 'Marakes magaza',
 prices: 'Fiyat rehberi',
 menus: 'Faydali menuler',
 craft: 'Her parca Guéliz, Marrakech atolyelerinde elle krose yapilir, kucuk adetlerle uretilir.',
 scarce: 'Sinirli uretim: tukenen parca ayni sekilde tekrar uretilmez.',
 add: 'Hizli ekle',
 },
 ar: {
 similar: 'منتجات مشابهة',
 also: 'قد يعجبك ايضا',
 all: 'عرض الكل',
 supportKicker: 'تحتاجين مساعدة؟',
 supportTitle: 'كل المعلومات قبل الطلب',
 phone: 'الهاتف / واتساب',
 store: 'متجر مراكش',
 prices: 'دليل الاسعار',
 menus: 'روابط مفيدة',
 craft: 'كل قطعة تصنع بالكروشيه يدويا في ورشة كليز وبكميات صغيرة مع فحص التشطيب قطعة بقطعة.',
 scarce: 'اصدار محدود: عند النفاد لا يعاد انتاج نفس القطعة.',
 add: 'اضافة سريعة',
 },
 };
 return copy[lang] || copy.fr;
 }

 function priceRangeLabel(list) {
 const prices = list.map((p) => p.price).filter(Boolean);
 if (!prices.length) return '-';
 const min = Math.min(...prices);
 const max = Math.max(...prices);
 return min === max ? T().formatPrice(min) : `${T().formatPrice(min)} - ${T().formatPrice(max)}`;
 }

  function productSupportHTML(p) {
    const t = T();
    const lang = t.lang || 'fr';
    const copy = {
      fr: [
        ['LIVRAISON OFFERTE DES 1 500 DH', 'Livraison suivie au Maroc et retrait possible au studio de Gueliz.'],
        ['RETOURS 30 JOURS', 'Essayez tranquillement, retour possible si la piece reste non portee.'],
        ['ATELIER FEMININ A MARRAKECH', 'Chaque piece passe par les mains de notre atelier.'],
      ],
      en: [
        ['FREE SHIPPING FROM 1,500 DH', 'Tracked Morocco delivery and studio pickup in Gueliz.'],
        ['30-DAY RETURNS', 'Try it calmly, return it unworn if it is not right.'],
        ['WOMEN-LED ATELIER IN MARRAKECH', 'Every piece passes through the hands of our atelier.'],
      ],
      es: [
        ['ENVIO GRATIS DESDE 1.500 DH', 'Entrega con seguimiento en Marruecos y recogida en Gueliz.'],
        ['DEVOLUCIONES 30 DIAS', 'Pruebala con calma, devuelvela sin usar si no encaja.'],
        ['ATELIER FEMENINO EN MARRAKECH', 'Cada pieza pasa por las manos de nuestro atelier.'],
      ],
      tr: [
        ['1.500 DH UZERI UCRETSIZ TESLIMAT', 'Fas ici takipli teslimat ve Gueliz studyo teslimi.'],
        ['30 GUN IADE', 'Sakin deneyin, kullanilmadiysa iade edin.'],
        ['MARRAKECH KADIN ATOLYESI', 'Her parca atolyemizin ellerinden gecer.'],
      ],
      ar: [
        ['توصيل مجاني من 1,500 درهم', 'توصيل متتبع داخل المغرب واستلام من استوديو كليز.'],
        ['ارجاع خلال 30 يوما', 'جربيها بهدوء، ويمكن ارجاعها غير مستعملة.'],
        ['اتولييه نسائي في مراكش', 'كل قطعة تمر بين ايدي اتولييهنا.'],
      ],
    };
    const icons = ['shipping', 'returns', 'repair'];
    return `<div class="product-support__reassurance">
      ${(copy[lang] || copy.fr).map((item, index) => `<article class="product-support__tile">
        <h2>${esc(item[0])}</h2>
        <p>${esc(item[1])}</p>
      </article>`).join('')}
    </div>`;
  }

  function railCardHTML(p, index = 0) {
    return cardHTML(p, index);
  }

 // Tifinagh sign per product - Amazigh script, decorative (aucune signification imposée).
 const TIFINAGH_MAP = [
 [/cherr/i, 'ⵣ'],
 [/grape/i, 'ⴰ'],
 [/whole-lemon|lemon-slice|lemon-raffia/i, 'ⵓ'],
 [/whole-orange|orange-slice|orange-raffia/i, 'ⵔ'],
 [/tomato/i, 'ⵜ'],
 [/avocado/i, 'ⵎ'],
 [/kiwi/i, 'ⵏ'],
 [/watermelon|pasteque/i, 'ⵡ'],
 [/nouvelle-vague/i, 'ⵍ'],
 ];
 function motifTag(p) {
 const h = (p && p.handle) || '';
 for (const [re, sign] of TIFINAGH_MAP) if (re.test(h)) return `<span class="product-tifinagh" aria-hidden="true">${sign}</span>`;
 return '';
 }
 function renderProductStory(p) {
 const root = $('#productStory');
 if (!root) return;
 if (p.fruitStory) {
 const t = T();
 const story = p.fruitStory;
 const gal = productGallery(p).filter(isPublicMedia);
 const images = [...new Set([...(gal.slice(1, 5)), p.img].filter(Boolean))].slice(0, 4);
 root.hidden = false;
 root.innerHTML = `<div class="product-color-story__inner charm-story" data-reveal>
 <div class="product-color-story__copy charm-story__copy">
 ${motifTag(p)}
 <p class="eyebrow">Fruit Market</p>
 <h2>${esc(t.pick(story.title))}</h2>
 <p>${esc(t.pick(story.body))}</p>
 <div class="charm-story__collection">
 <h3>${esc(t.pick(story.collectionTitle))}</h3>
 <p>${esc(t.pick(story.collectionBody))}</p>
 </div>
 <div class="product-color-story__facts">
 <span>${p.hours ? `${String(p.hours).replace('.', ',')} h crochet` : t.t('pp.limited')}</span>
 <span>${p.dimensions ? esc(t.pick(p.dimensions)).split('(')[0].trim() : t.t('pp.limited')}</span>
 </div>
 <a class="link-underline" href="${collectionUrl('charms')}">${esc(t.t('cta.shopCharms') || t.t('cta.shop'))}</a>
 </div>
 <div class="product-color-story__grid">
 ${images.map((src, index) => `<figure class="product-color-story__image product-color-story__image--${index}">
 ${mediaImg(src, `${t.pick(p.name)} - YZA Fruit Market`, 'width="760" height="980"')}
 </figure>`).join('')}
 </div>
 </div>`;
 return;
 }
 if (p._releasedStoryAuthority) {
 root.hidden = true;
 root.innerHTML = '';
 return;
 }
 const story = YZA.media?.pickStory?.(p);
 if (!story) {
 root.hidden = true;
 root.innerHTML = '';
 return;
 }
 const t = T();
 const title = mediaText(story.title);
 const text = mediaText(story.text);
 const label = mediaText(story.label);
 const images = [...new Set([p.img, ...(story.images || [])].filter(Boolean))].filter(isPublicMedia).slice(0, 4);
 root.hidden = false;
 root.innerHTML = `<div class="product-color-story__inner" data-reveal>
 <div class="product-color-story__copy">
 ${motifTag(p)}
 <p class="eyebrow">${esc(label)}</p>
 <h2>${esc(title)}</h2>
 <p>${esc(text)}</p>
 <div class="product-color-story__facts">
 <span>${p.hours ? `${String(p.hours).replace('.', ',')} h crochet` : t.t('pp.limited')}</span>
 ${p.edition && t.pick(p.edition) ? `<span>${esc(t.pick(p.edition)).split('.')[0]}</span>` : ''}
 </div>
 <a class="link-underline" href="${story.cta || '/collections'}">${esc(t.t('cta.shop'))}</a>
 </div>
 <div class="product-color-story__grid">
 ${images.map((src, index) => `<figure class="product-color-story__image product-color-story__image--${index}">
 ${mediaImg(src, `${t.pick(p.name)} - YZA story`, 'width="760" height="980"')}
 </figure>`).join('')}
 </div>
 </div>`;
 }

 function renderProductLifestyleStrip(p) {
 const strip = $('#productLifestyleStrip');
 if (!strip) return;
 if (p.lifestyleVideo) {
 strip.hidden = false;
 strip.innerHTML = `
 <div class="lifestyle-strip__inner">
 <video class="lifestyle-strip__vid" autoplay muted loop playsinline preload="metadata">
 <source src="${esc(p.lifestyleVideo)}" type="video/mp4">
 </video>
 <div class="lifestyle-strip__overlay">
 <p class="eyebrow lifestyle-strip__kicker">En situation</p>
 </div>
 </div>`;
 } else {
 strip.hidden = true;
 }
 }

 function renderProductSupport(p) {
 const panel = $('#productSupport');
 if (!panel) return;
 panel.innerHTML = productSupportHTML(p);
 }

  function renderProductRails(p) {
  const c = productPageCopy();
  const similarRail = $('#similarRail');
  const similarLabel = $('#productRailSimilarLabel');
  const alsoLabel = $('#productRailAlsoLabel');
  if (similarLabel) similarLabel.textContent = c.similar;
  if (alsoLabel) alsoLabel.textContent = c.also;
  if (!similarRail) return;

    const promoOk = typeof YZA.isLaunchPromoProduct === 'function' ? YZA.isLaunchPromoProduct : (x) => x && x.launchPromo !== false;
    const inStock = (x) => !YZA.inventoryStatus?.(x).soldOut;
    const available = (x) => inStock(x) && promoOk(x);
    // Le catalogue PUBLIC, au sens où tout le reste du site l'entend : byCategory('all')
    // renvoie publicProductList(), donc `publicVisible !== false` ET une vraie photo
    // publique. On passe par lui plutôt que de recopier la règle, pour qu'il n'y ait
    // jamais deux définitions de « visible » qui divergent.
    const publicHandles = new Set((YZA.byCategory('all') || []).map((x) => x.handle));
    const isPublic = (x) => publicHandles.has(x.handle);
    // "Similar products" = same-category / same-group siblings. Do NOT gate these on
    // the launch-promo flag — that left bag pages with only 2 cards (the non-promo
    // La Nouvelle Vague bags were excluded). Just drop sold-out pieces.
    // FUITE CORRIGÉE (cliente 2026-08-05 : « on tombe toujours dessus dans produits
    // similaires ») : `sameGroup` partait de YZA.products, c'est-à-dire du catalogue
    // BRUT, sans le filtre de visibilité. La jupe paréo extra longue, retirée de la
    // boutique (`publicVisible: false`), remontait donc dans les « Produits similaires »
    // des SEPT autres pièces prêt-à-porter — elles partagent toutes `group: 'rtw'`.
    // byCategory() et related() étaient déjà protégés : c'était le seul chemin ouvert.
    const sameCategory = YZA.byCategory(p.category).filter((x) => x.handle !== p.handle && inStock(x));
    const sameGroup = p.group
      ? YZA.products.filter((x) => x.group === p.group && x.handle !== p.handle && isPublic(x) && inStock(x))
      : [];
 const similar = [...sameCategory, ...sameGroup.filter((x) => !sameCategory.some((s) => s.handle === x.handle))]
 .slice(0, 12);
    /* « VOUS AIMEREZ AUSSI » = COMPLÉMENTS, pas des jumeaux (cliente 2026-08-06 : « should
       display other products charms or jewellery etc »). L'ancien calcul prenait
       `related()` tel quel ; or related() sert d'abord les pièces du même groupe, si bien
       que les DOUZE places étaient prises par du prêt-à-porter avant même d'atteindre un
       sac ou un charm. Résultat : deux onglets qui montraient la même chose, « Produits
       similaires » et « Vous aimerez aussi ».
       La matrice existait déjà et n'était pas lue ici : `YZA.promos.complements`
       (rtw → sacs + charms, sacs → charms + bijoux, bijoux → charms + sacs). On s'en sert,
       on met en tête les compléments explicitement déclarés sur la pièce (`crossSell`),
       et on EXCLUT le groupe courant pour que l'onglet dise vraiment autre chose. */
    const complements = (YZA.promos && YZA.promos.complements) || {};
    const famillesVoulues = new Set(complements[p.category] || complements[p.group] || complements.default || []);
    const bassin = YZA.related(p.handle, 40).filter(available);
    /* « Autre chose » se juge sur la CATÉGORIE, et le groupe ne sert que de garde-fou —
       sauf si la matrice nomme explicitement la catégorie. Sans cette exception, les
       CHARMS disparaissaient de la fiche BOUCLES : les deux partagent `group:
       'accessories'`, alors que les charms sont justement le complément configuré pour
       les bijoux. Le prêt-à-porter, lui, reste protégé : jupes et pantalons partagent
       `group: 'rtw'` avec les tops et ne figurent dans aucune liste de compléments. */
    const horsGroupe = (x) => x.category !== p.category
      && (x.group !== p.group || famillesVoulues.has(x.category));
    const declares = (p.crossSell || []).map((h) => YZA.getProduct(h))
      .filter((x) => x && available(x) && isPublic(x) && horsGroupe(x));
    const complementaires = bassin.filter((x) => horsGroupe(x)
      && (famillesVoulues.has(x.category) || famillesVoulues.has(x.group)));
    const autres = bassin.filter(horsGroupe);          // filet : toute autre famille
    const vus = new Set();
    const also = [...declares, ...complementaires, ...autres]
      .filter((x) => { if (vus.has(x.handle)) return false; vus.add(x.handle); return true; })
      .slice(0, 12);

  const lists = { similar, also: also.length ? also : similar };

  // For bag pages with a selected color, inject that color into same-family sibling cards
  const bagColorSlug = p.selectedBagVariant?.colorSlug || '';
  const bagColor = bagColorSlug ? (p.color || null) : null;
  const augmentCard = (q) => {
    if (!bagColorSlug || q.familyHandle !== p.familyHandle) return q;
    const base = q.displayName || q.name || {};
    const augName = {};
    ['fr', 'en', 'es', 'tr', 'ar'].forEach((lang) => {
      const n = base[lang] || base.en || base.fr || '';
      const c = bagColor ? (bagColor[lang] || bagColor.en || '') : '';
      augName[lang] = c ? n + ' — ' + c : n;
    });
    return {
      ...q,
      _href: productUrl(q.handle) + '?color=' + encodeURIComponent(bagColorSlug),
      _cardColorSlug: bagColorSlug,
      displayName: augName,
    };
  };

  const tabs = $$('.product-tabs__tab');
  const renderTab = (name) => {
  tabs.forEach((tab) => {
  const active = tab.dataset.productTab === name;
  tab.classList.toggle('is-active', active);
  tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  similarRail.dataset.activeTab = name;
  const layout = p.category === 'charms' || p.group === 'rtw' ? {
    spaceBetween: 16,
    breakpoints: {
      600: { slidesPerView: 2.4, spaceBetween: 24 },
      900: { slidesPerView: 3, spaceBetween: 24 },
      1200: { slidesPerView: 4, spaceBetween: 32 },
    },
  } : {};
  buildSwiper(similarRail, (lists[name] || similar).map(augmentCard), railCardHTML, layout);
  };
  tabs.forEach((tab) => {
  tab.onclick = () => renderTab(tab.dataset.productTab || 'similar');
  });
  renderTab(similarRail.dataset.activeTab || 'similar');
  }

 function renderProductBundle(p) {
 const panel = $('#pBundle');
 if (!panel) return;
 const bundle = typeof YZA.bundleForProduct === 'function' ? YZA.bundleForProduct(p.handle) : null;
 if (!bundle || bundle.items.length < 2) {
 panel.hidden = true;
 panel.innerHTML = '';
 return;
 }

 const t = T();
 panel.hidden = false;
 panel.innerHTML = `<div class="bundle-panel__head">
 <div>
 <span class="bundle-panel__kicker" data-i18n="pp.bundle.title">${t.t('pp.bundle.title')}</span>
 <h3>${esc(t.pick(bundle.title))}</h3>
 </div>
 <strong>${t.formatPrice(bundle.total)}</strong>
 </div>
 <p>${esc(t.pick(bundle.note))}</p>
 <div class="bundle-panel__items" aria-label="${t.t('pp.bundle.includes')}">
 ${bundle.items.map((item) => `<a href="${productUrl(item.handle)}">
 <img aria-hidden="true" src="${item.img}" alt="" width="54" height="72" loading="lazy" decoding="async">
 <span>${esc(t.pick(displayName(item)))}<small>${t.formatPrice(item.price)}</small></span>
 </a>`).join('')}
 </div>
 <button class="btn btn--solid btn--block" data-bundle-add>${t.t('pp.bundle.add')}</button>`;

 panel.querySelector('[data-bundle-add]')?.addEventListener('click', () => {
 bundle.items.forEach((item) => {
  const label = (YZA.defaultVariantLabel && YZA.defaultVariantLabel(item.handle)) || '';
  const sizeCode = (item.availableSizes || []).includes(item.defaultSize)
   ? item.defaultSize : ((item.availableSizes || []).length === 1 ? item.availableSizes[0] : '');
  YZA.cart.add(item.handle, label, 1, { source: 'bundle', sizeCode });
 });
 YZA.cart.open();
 YZA.analytics?.track('bundle_add', {
 sourceHandle: p.handle,
 handles: bundle.items.map((item) => item.handle),
 total: bundle.total,
 });
 const btn = panel.querySelector('[data-bundle-add]');
 btn.textContent = t.t('pp.bundle.added');
 setTimeout(() => { btn.textContent = t.t('pp.bundle.add'); }, 1500);
 });
 }

  function productPriceHTML(p) {
    const t = T();
    return (p.compareAt && p.compareAt > p.price ? `<s class="was">${t.formatPrice(p.compareAt)}</s> ` : '') + t.formatPrice(p.price);
  }
  function productPriceCompact(p) {
    const t = T();
    const price = t.formatPrice(p.price).replace(/\s*DH\b/i, ' dh');
    return p.compareAt && p.compareAt > p.price
      ? `<s class="was">${t.formatPrice(p.compareAt).replace(/\s*DH\b/i, ' dh')}</s> ${price}`
      : price;
  }

 function productGallery(product) {
 const gallery = product.familyGallery?.length
 ? product.familyGallery
 : (product.gallery || [product.img]);
 const safe = [...new Set([product.img, ...(gallery || [])].filter(Boolean))].filter(isPublicMedia);
 return safe.length ? safe : [product.img];
 }

 function textObj(fr, en = fr) {
 return { fr, en, es: en, tr: en, ar: en };
 }
 function slugLite(value) {
 return String(value || '')
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, '-')
 .replace(/^-|-$/g, '');
 }
 function resolveBagVariant(baseProduct) {
 if (!baseProduct || baseProduct.category !== 'bags') return null;
 const queryColor = params.get('color');
 if (queryColor && typeof YZA.bagVariantFor === 'function') {
 const direct = YZA.bagVariantFor(baseProduct.handle, queryColor);
 if (direct) return direct;
 }
 // On essaie visualColor PUIS color, au lieu de s'arreter au premier des deux qui est
 // simplement defini. `visualColor` porte les noms de la palette canonique — "Rouge
 // Coquelicot", "Noir Mille et Une Nuit" — que normalizeBagColours ne normalise pas,
 // alors que les items de BAG_ROWS sont keyes sur leurs alias ("hot-red", "black-olive").
 // Sur XS et M aucune cle ne se recouvrait : resolveBagVariant renvoyait null, donc les
 // URL NUES /produits/la-sculpture-xs-… et -m-… (celles du sitemap et du rail « Produits
 // similaires ») n'affichaient qu'une seule photo, sans coloris ni video.
 // Le repli ne choisit rien arbitrairement : il retombe sur le MEME coloris que celui que
 // visualColor nomme deja, via son alias (XS -> rouge, M -> noir). Le S, qui resolvait
 // deja par visualColor, est inchange.
 for (const visual of [baseProduct.visualColor, baseProduct.color]) {
 if (!visual) continue;
 const colorKeys = [visual.fr, visual.en].map(slugLite).filter(Boolean);
 if (!colorKeys.length) continue;
 for (const row of (YZA.activeBagRows ? YZA.activeBagRows(baseProduct.familyHandle) : [])) {
 const match = (row.items || []).find((item) => {
 if (item.handle !== baseProduct.handle) return false;
 const itemKeys = [item.colorSlug, item.color?.fr, item.color?.en].map(slugLite).filter(Boolean);
 return itemKeys.some((key) => colorKeys.includes(key));
 });
 if (match) return { ...match, row };
 }
 }
 return null;
 }
 function bagViewProduct(baseProduct, bagVariant) {
 if (!bagVariant) return baseProduct;
 if (baseProduct.selectedColorway) {
 const size = bagVariant.size || baseProduct.visualSize || '';
 const sizeLabels = baseProduct.sizeLabels && baseProduct.sizeLabels[size] || {};
 const color = baseProduct.selectedColorway.name || baseProduct.color || {};
 const activeVariantLabel = Object.fromEntries(['fr', 'en', 'es', 'tr', 'ar'].map((lang) => [lang,
 [(sizeLabels && (sizeLabels[lang] || sizeLabels.en || sizeLabels.fr)) || size,
  color[lang] || color.en || color.fr || ''].filter(Boolean).join(' / ')]));
 return { ...baseProduct, visualSize: size, activeVariantLabel, selectedBagVariant: bagVariant };
 }
 const title = bagVariant.title || baseProduct.displayName || baseProduct.name;
 const short = bagVariant.short || baseProduct.displayShort || baseProduct.short;
 const colorFr = bagVariant.color?.fr || '';
 const colorEn = bagVariant.color?.en || colorFr;
 const colorEs = bagVariant.color?.es || colorEn;
 const colorTr = bagVariant.color?.tr || colorEn;
 const colorAr = bagVariant.color?.ar || colorEn;
 const size = bagVariant.size || baseProduct.visualSize || '';
 const sizeLabels = baseProduct.sizeLabels && baseProduct.sizeLabels[size] || {};
 // Client 2026-07-21 ("nettoyer les pages des prompts"). A machine-built description used to
 // be synthesized here — "…Cette page montre le format XS en couleur Bleu." — and it OVERRODE
 // the real hand-written PERSONA_COPY text, so the accordion, the <meta description> and the
 // Product JSON-LD all shipped that filler. Removed: dropping `desc` from the returned object
 // lets `...baseProduct` keep the genuine copy. `titleEn` went with it — it was only ever used
 // by this template.
 return {
 ...baseProduct,
 name: title,
 displayName: title,
 short,
 displayShort: short,
 // no `desc` here on purpose — see the note above; ...baseProduct carries the real copy.
 dimensions: bagVariant.dimensions || baseProduct.dimensions,
 img: bagVariant.img || baseProduct.img,
 gallery: bagVariant.gallery || baseProduct.gallery,
 media: bagVariant.media || baseProduct.media,
 color: bagVariant.color || baseProduct.color,
 visualColor: bagVariant.color || baseProduct.visualColor,
 visualSize: size,
 availableColors: bagVariant.color ? [bagVariant.color] : baseProduct.availableColors,
 availableSizes: size ? [size] : baseProduct.availableSizes,
 activeVariantLabel: {
  fr: `${sizeLabels.fr || sizeLabels.en || size} / ${colorFr}`,
  en: `${sizeLabels.en || sizeLabels.fr || size} / ${colorEn}`,
  es: `${sizeLabels.es || sizeLabels.en || size} / ${colorEs}`,
  tr: `${sizeLabels.tr || sizeLabels.en || size} / ${colorTr}`,
  ar: `${sizeLabels.ar || sizeLabels.en || size} / ${colorAr}`,
 },
 selectedBagVariant: bagVariant,
 };
 }

 function ensureVariantWrap() {
 let wrap = $('#pVariants');
 if (wrap) return wrap;
 wrap = document.createElement('div');
 wrap.className = 'option option--variants';
 wrap.id = 'pVariants';
 wrap.hidden = true;
 wrap.innerHTML = '<div class="option__label" data-variant-label>Options</div><div class="chips chips--variants" id="pVariantOpts"></div>';
 const qtyOption = $('#pQty')?.closest('.option');
 qtyOption?.before(wrap);
 return wrap;
 }

 function ensureProductProofWrap() {
 let wrap = $('#pProof');
 if (wrap) return wrap;
 wrap = document.createElement('section');
 wrap.className = 'product-proof';
 wrap.id = 'pProof';
 const bundle = $('#pBundle');
 bundle?.before(wrap);
 return wrap;
 }

 function renderServiceStrips() {
 // Home strip = the three promises Nawal wants front-and-centre: guaranteed · handmade · easy payment.
 const defaultKeys = ['returns', 'handmade', 'payment'];
 const footerKeys = ['morocco-delivery', 'returns', 'payment'];
 $$('[data-service-strip]').forEach((strip) => {
 const keys = strip.dataset.serviceStrip === 'footer' ? footerKeys : defaultKeys;
 const className = strip.dataset.serviceStrip === 'footer'
 ? 'footer-service__item footer-service__trust-item'
 : 'service-card';
 strip.innerHTML = keys.map((key) => YZA.serviceCard(key, className)).join('');
 });
 }

 function renderProductTrustChips(p) {
 const wrap = $('#pTrustChips');
 if (!wrap || !p) return;
 const t = T();
 const isAccessories = p.group === 'accessories';
 const threshold = isAccessories
 ? (YZA.servicePolicy?.freeShippingAccessoriesDh || 50000)
 : (YZA.servicePolicy?.freeShippingDh || 150000);
 const deliveryFeature = YZA.serviceFeature('morocco-delivery');
 const deliveryChip = deliveryFeature ? `<span class="product-trust-chip" data-service-chip="morocco-delivery">
 ${YZA.serviceIcon(deliveryFeature.icon, 'product-trust-chip__icon')}
 <span>${t.pick({ fr: `Livraison offerte dès ${t.formatPrice(threshold)}`, en: `Free delivery from ${t.formatPrice(threshold)}` })}</span>
 </span>` : '';
 wrap.innerHTML = deliveryChip + ['returns', 'repairs'].map((key) => YZA.serviceChip(key)).join('');
 }

 function buyingProofCopy() {
 const lang = T().lang || 'fr';
 const copy = {
 fr: {
 title: 'Fait à l\'atelier',
 handwork: 'Travail main',
 material: 'Matière',
 scale: 'Dimensions / échelle',
 fits: 'Ce qui rentre',
 attachment: 'Accroche',
 care: 'Entretien',
 packaging: 'Prêt à offrir',
 batch: 'Série',
 shipping: 'Livraison',
 returns: 'Retours',
 ask: 'Question sur WhatsApp',
 sizeGuide: 'Comparer les tailles',
 styleTip: 'Conseil',
 note: 'Note',
 },
 en: {
 title: 'Buying proof',
 handwork: 'Handwork',
 material: 'Material',
 scale: 'Dimensions / scale',
 fits: 'What fits',
 attachment: 'Attachment',
 care: 'Care',
 packaging: 'Gift-ready',
 batch: 'Batch',
 shipping: 'Shipping',
 returns: 'Returns',
 ask: 'Ask on WhatsApp',
 sizeGuide: 'Compare sizes',
 styleTip: 'Style tip',
 note: 'Note',
 },
 es: {
 title: 'Prueba de compra',
 handwork: 'Trabajo manual',
 material: 'Material',
 scale: 'Escala',
 fits: 'Que cabe',
 attachment: 'Enganche',
 care: 'Cuidado',
 packaging: 'Listo para regalar',
 batch: 'Serie',
 shipping: 'Envio',
 returns: 'Devoluciones',
 ask: 'Pregunta por WhatsApp',
 sizeGuide: 'Comparar tallas',
 styleTip: 'Consejo',
 note: 'Nota',
 },
 tr: {
 title: 'Satin alma kaniti',
 handwork: 'El isi',
 material: 'Malzeme',
 scale: 'Olcek',
 fits: 'Icine siganlar',
 attachment: 'Takma',
 care: 'Bakim',
 packaging: 'Hediye hazir',
 batch: 'Seri',
 shipping: 'Teslimat',
 returns: 'Iade',
 ask: 'WhatsApp soru',
 sizeGuide: 'Bedenleri karsilastir',
 styleTip: 'Stil ipucu',
 note: 'Not',
 },
 ar: {
 title: '\u062F\u0644\u064A\u0644 \u0627\u0644\u0634\u0631\u0627\u0621',
 handwork: '\u0639\u0645\u0644 \u064A\u062F\u0648\u064A',
 material: '\u0627\u0644\u062E\u0627\u0645\u0629',
 scale: '\u0627\u0644\u062D\u062C\u0645',
 fits: '\u0645\u0627 \u064A\u062A\u0633\u0639 \u0644\u0647',
 attachment: '\u0627\u0644\u062A\u0639\u0644\u064A\u0642',
 care: '\u0627\u0644\u0639\u0646\u0627\u064A\u0629',
 packaging: '\u062C\u0627\u0647\u0632 \u0644\u0644\u0647\u062F\u064A\u0629',
 batch: '\u0627\u0644\u0633\u0644\u0633\u0644\u0629',
 shipping: '\u0627\u0644\u0634\u062D\u0646',
 returns: '\u0627\u0644\u0625\u0631\u062C\u0627\u0639',
 ask: '\u0633\u0624\u0627\u0644 \u0639\u0644\u0649 WhatsApp',
 sizeGuide: '\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0645\u0642\u0627\u0633\u0627\u062A',
 styleTip: '\u0646\u0635\u064A\u062D\u0629',
 note: '\u0645\u0644\u0627\u062D\u0638\u0629',
 },
 };
 return copy[lang] || copy.fr;
 }

 function productQuestionUrl(product) {
 const phone = (YZA.brand.whatsapp || '').replace(/\D/g, '');
 const t = T();
 const message = [
 'Bonjour YZA, j ai une question avant de commander.',
 `Produit: ${t.pick(displayName(product))}`,
 `Prix: ${t.formatPrice(product.price)}`,
 `Lien: ${location.href}`,
 ].join('\n');
 return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
 }

 function renderProductBuyingProof(product) {
 const wrap = ensureProductProofWrap();
 if (!wrap || !product) return;
 const t = T();
 const c = buyingProofCopy();
 const fields = [
 [c.handwork, product.handworkTime && t.pick(product.handworkTime)],
 [c.material, product.material ? t.pick(product.material) : product.fabric && t.pick(product.fabric)],
 [c.scale, product.dimensions ? t.pick(product.dimensions) : product.size && t.pick(product.size)],
 [c.fits, product.whatFits && t.pick(product.whatFits)],
 [c.attachment, product.attachment && t.pick(product.attachment)],
 [c.care, product.care && t.pick(product.care)],
 [c.packaging, product.packaging && t.pick(product.packaging)],
 [c.batch, product.batch && t.pick(product.batch)],
 [c.shipping, YZA.pickText(YZA.serviceFeature('morocco-delivery')?.text)],
 [c.returns, YZA.pickText(YZA.serviceFeature('returns')?.text)],
 ].filter((row) => row[1]);
 const sizeGuide = product.category === 'bags' && Array.isArray(product.sizeComparison)
 ? `<div class="product-proof__sizes">
 <h3>${esc(c.sizeGuide)}</h3>
 ${product.sizeComparison.map((row) => {
  const sibling = (YZA.familyMembers?.(product) || []).find((candidate) =>
   (candidate.availableSizes || []).some((code) => code === row.sizeCode
    || String(code).toUpperCase() === String(t.pick(row.label) || '').toUpperCase()));
  const code = row.sizeCode || (sibling && (sibling.availableSizes || [])[0]) || '';
  const label = sibling && code ? releasedSizeLabel(sibling, code, t) : t.pick(row.label);
  return `<div>
 <strong>${esc(label)} <span>${t.formatPrice(row.price)}</span></strong>
 <p>${esc(t.pick(row.whatFits))}</p>
 </div>`;
 }).join('')}
 </div>`
 : '';
 wrap.innerHTML = `<div class="product-proof__head">
 <p class="eyebrow">${esc(YZA.brand.masterIdea || 'Modern Marrakech wear')}</p>
 <h2>${esc(c.title)}</h2>
 <a class="link-underline" href="${productQuestionUrl(product)}" target="_blank" rel="noopener" data-product-question>${esc(c.ask)}</a>
 </div>
 <div class="product-proof__grid">
 ${fields.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}
 </div>
 ${sizeGuide}`;
 wrap.querySelector('[data-product-question]')?.addEventListener('click', () => {
 YZA.analytics?.track('product_question_whatsapp', { handle: product.handle, category: product.category });
 });
 }

  function variantLabelFor(product, t) {
    if (product.category === 'bags') return t.t('pp.size');
 if (product.familyHandle === 'jawhara-pareos') {
 return { fr: 'Longueur', en: 'Length', es: 'Largo', tr: 'Uzunluk', ar: 'الطول' }[t.lang] || 'Length';
 }
 if (product.familyHandle === 'jawhara-pants') {
 return { fr: 'Modele', en: 'Model', es: 'Modelo', tr: 'Model', ar: 'الموديل' }[t.lang] || 'Model';
 }
    return t.t('pp.acc.details');
  }
  function releasedFamilyOption(product, t) {
    if (Object.prototype.hasOwnProperty.call(product || {}, 'familyOptionLabel')) {
      return t.pick(product.familyOptionLabel || {}) || t.pick(displayName(product)) || t.pick(product.name);
    }
    return t.pick(product?.variantLabel) || t.pick(product?.size) || t.pick(displayName(product)) || t.pick(product?.name);
  }

  function productUiCopy() {
    const lang = T().lang || 'fr';
    const copy = {
      fr: {
        add: 'AJOUTER AU PANIER',
        color: 'Couleur',
        delivery: 'Livraison le jour meme',
        hint: 'Envoyer un indice',
        deliveryTitle: 'Livraison le jour meme',
        deliveryBody: 'Disponible a Marrakech selon zone et horaire. Ecrivez-nous sur WhatsApp pour confirmer le tarif et le creneau.',
        sizeFit: 'SIZE & FIT NOTES',
        care: 'COMPOSITION AND CARE',
        returns: 'DELIVERY, EXCHANGES AND RETURNS',
        questions: 'QUESTIONS',
        share: 'SHARE',
        ask: 'Ouvrir WhatsApp',
        shareCopy: 'Copier le lien',
        copied: 'Lien copie',
        hintText: 'Bonjour YZA, je pense que cette piece pourrait te plaire :',
        sold: 'Épuisé',
      },
      en: {
        add: 'ADD TO BAG',
        color: 'Color',
        delivery: 'Same Day Delivery',
        hint: 'Drop A Hint',
        deliveryTitle: 'Same Day Delivery',
        deliveryBody: 'Available in Marrakech depending on zone and timing. Message us on WhatsApp to confirm the fee and slot.',
        sizeFit: 'SIZE & FIT NOTES',
        care: 'COMPOSITION AND CARE',
        returns: 'DELIVERY, EXCHANGES AND RETURNS',
        questions: 'QUESTIONS',
        share: 'SHARE',
        ask: 'Open WhatsApp',
        shareCopy: 'Copy link',
        copied: 'Link copied',
        hintText: 'Hello YZA, I think this piece might be perfect for you:',
        sold: 'Sold out',
      },
      es: {
        add: 'ANADIR A LA CESTA',
        color: 'Color',
        delivery: 'Entrega el mismo dia',
        hint: 'Enviar una pista',
        deliveryTitle: 'Entrega el mismo dia',
        deliveryBody: 'Disponible en Marrakech segun zona y horario. Escribenos por WhatsApp para confirmar tarifa y franja.',
        sizeFit: 'TALLA Y AJUSTE',
        care: 'COMPOSICION Y CUIDADOS',
        returns: 'ENTREGA, CAMBIOS Y DEVOLUCIONES',
        questions: 'PREGUNTAS',
        share: 'COMPARTIR',
        ask: 'Abrir WhatsApp',
        shareCopy: 'Copiar enlace',
        copied: 'Enlace copiado',
        hintText: 'Hola YZA, creo que esta pieza te puede gustar:',
        sold: 'Agotado',
      },
      tr: {
        add: 'SEPETE EKLE',
        color: 'Renk',
        delivery: 'Ayni gun teslimat',
        hint: 'Ipucu gonder',
        deliveryTitle: 'Ayni gun teslimat',
        deliveryBody: 'Marrakech icinde bolge ve saate gore mumkun. Ucret ve zaman icin WhatsApp tan yazin.',
        sizeFit: 'BEDEN VE KALIP',
        care: 'ICERIK VE BAKIM',
        returns: 'TESLIMAT, DEGISIM VE IADE',
        questions: 'SORULAR',
        share: 'PAYLAS',
        ask: 'WhatsApp ac',
        shareCopy: 'Baglantiyi kopyala',
        copied: 'Baglanti kopyalandi',
        hintText: 'Merhaba YZA, bu parca sana yakisabilir:',
        sold: 'Tükendi',
      },
      ar: {
        add: 'اضافة الى السلة',
        color: 'اللون',
        delivery: 'توصيل في نفس اليوم',
        hint: 'ارسال تلميح',
        deliveryTitle: 'توصيل في نفس اليوم',
        deliveryBody: 'متاح داخل مراكش حسب المنطقة والوقت. راسلينا عبر واتساب لتأكيد السعر والموعد.',
        sizeFit: 'المقاس والملاءمة',
        care: 'التركيب والعناية',
        returns: 'التوصيل والاستبدال والارجاع',
        questions: 'اسئلة',
        share: 'مشاركة',
        ask: 'فتح واتساب',
        shareCopy: 'نسخ الرابط',
        copied: 'تم نسخ الرابط',
        hintText: 'مرحبا YZA، أعتقد أن هذه القطعة قد تعجبك:',
        sold: 'نفد',
      },
    };
    return copy[lang] || copy.fr;
  }

  function productBullets(product) {
    const t = T();
    if (Object.prototype.hasOwnProperty.call(product || {}, 'buyingBullets') && product.buyingBullets === null) return [];
    if (product.buyingBullets && Array.isArray(product.buyingBullets[t.lang])) {
      return product.buyingBullets[t.lang].filter(Boolean);
    }
    const rows = [
      product.material && t.pick(product.material),
      product.fabric && t.pick(product.fabric),
      product.handworkTime && t.pick(product.handworkTime),
      product.dimensions && t.pick(product.dimensions),
      product.edition && t.pick(product.edition),
      product.packaging && t.pick(product.packaging),
    ].filter(Boolean);
    if (!rows.length && product.features) rows.push(...product.features.map((x) => t.pick(x)).filter(Boolean));
    return rows.slice(0, 5);
  }

  function swatchStyle(name) {
    // Use the accurate hex map (cardSwatchHex) instead of the remapped monochrome
    // brand tokens — those aliased violet→pink and red→ink, so PDP swatches showed
    // the wrong colour (e.g. "Deep Violet" rendered pink, "Hot Red" rendered black).
    return 'background:' + cardSwatchHex(name);
  }

  // All distinct colour rows for a bag's family (La Sculpture -> Hot Red / Deep Violet /
  // Black Olive). Lets the PDP colour swatches become real navigable shortcuts that swap
  // the gallery image, exactly like the size chips already do.
  function familyColorRows(product) {
    if (!product || product.category !== 'bags' || !product.familyHandle) return [];
    const seen = new Set();
    const out = [];
    (YZA.activeBagRows ? YZA.activeBagRows(product.familyHandle) : []).forEach((row) => {
      const key = row.colorSlug || '';
      if (seen.has(key)) return;
      seen.add(key);
      out.push(row);
    });
    return out;
  }
  // Canonical hue names so cardSwatchHex resolves the true colourway -- the brand row
  // names "Noir"/"Rouge"/"Violet" alone would read pure black / generic red / purple.
  const BAG_SWATCH_HUE = { noir: 'black olive', rouge: 'hot red', violet: 'deep violet' };

  // `swapGallery` is renderProduct's own swapGalleryToVariant, handed in by the caller.
  // It is a closure over the gallery markup builders, so it cannot be reached from this
  // module-scope function any other way — passing it beats hanging it off a global.
  function renderProductSwatches(product, swapGallery) {
    const wrap = $('#pColorWrap');
    if (!wrap) return;
    const t = T();

    // Bags in a multi-colour family: every colour becomes a swatch that navigates to that
    // colourway (keeping the current size where it exists), which swaps the gallery image.
    const colorRows = familyColorRows(product);
    if (colorRows.length > 1) {
      const keysFromName = [product.color?.fr, product.color?.en, product.visualColor?.fr, product.visualColor?.en]
        .map(slugLite).filter(Boolean);
      const byName = colorRows.find((row) =>
        [row.colorSlug, row.color?.fr, row.color?.en].map(slugLite).filter(Boolean).some((k) => keysFromName.includes(k)));
      const activeSlug = product.selectedBagVariant?.colorSlug || byName?.colorSlug || colorRows[0].colorSlug;
      const activeRow = colorRows.find((row) => row.colorSlug === activeSlug) || colorRows[0];
      const currentSize = String(
        product.selectedBagVariant?.size || product.visualSize || (product.availableSizes || [])[0] || ''
      ).toUpperCase();
      wrap.hidden = false;
      $('#pColorName').textContent = t.pick(activeRow.color);
      $('#pColorSwatches').innerHTML = colorRows.map((row) => {
        const name = t.pick(row.color);
        const hueName = BAG_SWATCH_HUE[row.colorSlug] || name;
        const item = (row.items || []).find((it) => String(it.size).toUpperCase() === currentSize) || (row.items || [])[0];
        const url = (item && item.url)
          || (productUrl((item && item.handle) || product.handle) + '?color=' + encodeURIComponent(row.colorSlug));
        return `<button type="button" class="product-color__swatch${row.colorSlug === activeSlug ? ' is-active' : ''}" aria-label="${esc(name)}" title="${esc(name)}" style="background:${cardSwatchHex(hueName)}" data-color-name="${esc(name)}" data-color-url="${esc(url)}"></button>`;
      }).join('');
      $('#pColorSwatches').onmouseover = (event) => {
        const btn = event.target.closest('[data-color-name]');
        if (btn) $('#pColorName').textContent = btn.dataset.colorName || '';
      };
      $('#pColorSwatches').onmouseleave = () => { $('#pColorName').textContent = t.pick(activeRow.color); };
      $('#pColorSwatches').onclick = (event) => {
        const btn = event.target.closest('[data-color-url]');
        if (!btn) return;
        YZA.analytics?.track('product_variant_select', { handle: product.handle, familyHandle: product.familyHandle || '', category: 'bags', colorSwap: true });
        location.href = window.yzaPreviewUrl(btn.dataset.colorUrl);
      };
      const viewBag = $('#pViewColors');
      if (viewBag) viewBag.hidden = true;
      return;
    }
    $('#pColorSwatches').onmouseover = null;
    $('#pColorSwatches').onmouseleave = null;

    const colors = product.availableColors?.length
      ? product.availableColors.map((item) => t.pick(item)).filter(Boolean)
      : [product.color && t.pick(product.color), product.variantLabel && t.pick(product.variantLabel)].filter(Boolean);
    if (!colors.length) { wrap.hidden = true; return; }
    wrap.hidden = false;

    // Clothing with real per-colour photography (Jawhara). Renders EVERY colourway — the
    // old slice(0, 8) silently dropped the 9th — uses the manifest hex rather than guessing
    // one from the name, and restores the colour from ?color= instead of always starting on
    // the first swatch.
    const cmedia = (YZA.jawharaColorMedia || {})[product.handle];
    if (cmedia && Array.isArray(YZA.jawharaColors)) {
      // Coloris DE CETTE PIECE uniquement — voir cardSwatchesHTML : la liste globale
      // contient depuis le 2026-07-29 un coloris (Jaune Safran) que la jupe pareo midi
      // n'a pas. Une pastille sans photo derriere ne doit jamais s'afficher.
      const ownSlugs = new Set(product.colorSlugs || []);
      const cols = (product.colorSlugs || []).map((slug, index) => {
        const released = cmedia.colors && cmedia.colors[slug];
        const palette = YZA.jawharaColors.find((candidate) => candidate.slug === slug) || {};
        return { ...palette, ...(released || {}), ...(released && released.name ? released.name : (product.availableColors || [])[index] || {}), slug };
      }).filter((c) => ownSlugs.has(c.slug));
      if (!cols.length) { wrap.hidden = true; return; }
      const fromUrl = params.get('color');
      const activeSlug = (fromUrl && cols.some((c) => c.slug === fromUrl))
        ? fromUrl : (product.defaultColorSlug || cols[0].slug);
      const nameOf = (slug) => t.pick(cols.find((c) => c.slug === slug) || cols[0]);
      $('#pColorName').textContent = nameOf(activeSlug);
      $('#pColorSwatches').innerHTML = cols.map((c) => {
        const on = c.slug === activeSlug;
        const gone = !!(YZA.jawharaColorSoldOut && YZA.jawharaColorSoldOut(product.handle, c.slug));
        const shown = gone ? `${t.pick(c)} — ${stockCopy().sold}` : t.pick(c);
        return `<button type="button" class="product-color__swatch${on ? ' is-active' : ''}${gone ? ' is-sold-out' : ''}"`
          + ` style="background:${esc(c.hex)}" data-color-slug="${esc(c.slug)}" data-color-name="${esc(t.pick(c))}"`
          + ` aria-pressed="${on ? 'true' : 'false'}" title="${esc(shown)}"`
          + ` aria-label="${esc(t.pick(product.name))} — ${esc(shown)}">`
          + `<span class="sr-only">${esc(shown)}</span></button>`;
      }).join('');
      // Vidéos PAR CORIS (client 2026-07-29 : palazzo noir / bordeaux, paréo blanc, la
      // tenue verte). Elles doivent suivre la pastille. On lit `video` directement dans
      // colorMedia et JAMAIS via YZA.jawharaImage(..., 'video') : ce résolveur retombe
      // sur le `front` quand le rôle manque, il rendrait donc une IMAGE dans un <video>.
      const cmedias = (cmedia && cmedia.colors) || {};
      const colorVideos = new Set(
        Object.keys(cmedias).flatMap((s) => {
          const row = cmedias[s] || {};
          return [row.video].concat((row.media || []).filter((item) => item?.type === 'video').map((item) => item.src));
        }).filter(Boolean)
      );
      // Photos SUPPLEMENTAIRES par coloris. Deux rôles aujourd'hui, dans cet ordre
      // d'affichage : `back` (vue de dos, le top foulard) puis `detail` (gros plan, le
      // pantalon paréo). Même principe que les vidéos : elles ne valent que pour LEUR
      // coloris. On les recense toutes pour pouvoir les retirer avant de reposer celles du
      // coloris choisi — sinon le dos du Blanc Jasmin, semé dans p.media au chargement,
      // resterait affiché sous le Bordeaux. Ajouter un rôle = l'ajouter à ce seul tableau.
      /* `hoverDay` / `hoverNight` REJOIGNENT les rôles par coloris (cliente 2026-08-06 :
         « je choisis bleu et je vois les images du blanc »). Depuis le paquet du 06/08,
         chaque couple pièce×coloris possède deux photos PORTÉES qui lui appartiennent
         vraiment : elles ont exactement la propriété qui manquait à la galerie, être
         attribuables à une couleur. Les recenser ici sert deux fois : elles s'affichent
         pour le coloris choisi, et elles sont retirées quand on change de couleur. */
      const EXTRA_ROLES = ['back', 'detail', 'hoverDay', 'hoverNight'];
      const colorExtras = new Set();
      Object.keys(cmedias).forEach((s) => {
        const c = cmedias[s] || {};
        EXTRA_ROLES.forEach((r) => { if (c[r]) colorExtras.add(c[r]); });
      });
      const applyColor = (slug, options = {}) => {
        const src = YZA.jawharaImage(product.handle, slug);
        if (!src) return;
        /* GALERIE 100 % MONOCHROME (cliente 2026-08-06). La version précédente gardait
           `rest` : tout ce que la fiche portait en galerie hors packshots catalogue. Sur
           la Chemise, `rest` valait une prise du lookbook + cinq photos client — et en les
           regardant on trouve DEUX ROBES NOIRES, DEUX PIÈCES BLANCHES À VOLANTS et la
           chemise en lilas. Autrement dit : ni la bonne couleur, ni toujours le bon
           vêtement. Quel que soit le coloris choisi, la cliente voyait ces six-là.
           On ne garde donc QUE ce qui est attribuable au coloris : son packshot, sa vue de
           dos, son détail, ses deux photos portées jour/nuit, sa vidéo. Une pièce affiche
           moins d'images qu'avant, mais aucune n'est mensongère — et c'est précisément la
           règle maison « absent plutôt que faux » déjà appliquée à jawharaImage.
           Les VIDÉOS DE PRODUIT (un geste, pas une couleur) restent, elles, sur les dix
           coloris : elles sont traitées plus bas, dans `media`, pas ici. */
        const own = cmedias[slug] || {};
        const released = YZA.resolveProductColorView?.(product, slug) || product;
        const releasedGallery = Array.isArray(own.gallery) && own.gallery.length ? own.gallery : null;
        const extras = releasedGallery
          ? releasedGallery.filter((item) => item !== src)
          : EXTRA_ROLES.map((r) => own[r]).filter(Boolean);
        const view = Object.assign({}, released, {
          img: src,
          gallery: [src].concat(extras),
          // On retire TOUTES les vidéos de coloris avant de rajouter celle du coloris
          // choisi : sinon la vidéo du coloris par défaut, semée dans p.media au
          // chargement, resterait visible sous une autre couleur — exactement le travers
          // que le sélecteur est censé éviter. Une vidéo de PRODUIT (un geste, pas une
          // couleur : le foulard noué de plusieurs façons) n'est pas dans cette liste et
          // reste donc affichée sur les 9 coloris.
          media: [{ type: 'image', src }]
            .concat(extras.map((d) => ({ type: 'image', src: d })))
            /* On ne reprend de `product.media` que les VIDÉOS. Le filtre d'origine gardait
               aussi les images non attribuées — c'est par là que les robes noires et les
               pièces blanches revenaient dans le visualiseur alors que la galerie, elle,
               venait d'être assainie. Une vidéo de coloris est exclue par `colorVideos` ;
               ne survit donc qu'une vidéo de PRODUIT, valable pour tous les coloris. */
            .concat((product.media || []).filter((m) => m && m.src && m.type === 'video'
              && !colorVideos.has(m.src)))
            .concat((own.media || []).filter((m) => m && m.src && m.type === 'video')),
        });
        // The released colourway alt is the final writer.  Rebuilding it from the
        // embedded product name silently discarded dashboard-authored/localised alt
        // copy every time a customer clicked a swatch.
        const releasedAlt = t.pick(view.imageAlt || {}) || `${t.pick(product.name)} — ${nameOf(slug)}`;
        if (typeof swapGallery === 'function') swapGallery(view, releasedAlt);
        $('#pColorName').textContent = nameOf(slug)
          + ((YZA.jawharaColorSoldOut && YZA.jawharaColorSoldOut(product.handle, slug))
            ? ` — ${stockCopy().sold}` : '');
        $$('#pColorSwatches .product-color__swatch').forEach((el) => {
          const on = el.dataset.colorSlug === slug;
          el.classList.toggle('is-active', on);
          el.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        // Keep the colour shareable/reloadable without stacking history entries.
        if (options.updateUrl !== false) {
          try {
            const u = new URL(location.href);
            u.searchParams.set('color', slug);
            history.replaceState(history.state, '', u.pathname + u.search + u.hash);
            params.set('color', slug);
          } catch (_) { /* non-blocking */ }
        }
        syncColorStock(slug);
        YZA.analytics?.track('product_color_select', { handle: product.handle, color: slug, surface: 'pdp' });
      };
      // Le bouton d'achat doit suivre le CORIS, pas seulement le produit : la jupe paréo
      // midi est vendue dans neuf coloris et épuisée en Jaune Safran. renderProduct ne fixe
      // l'état du bouton qu'une fois, au rendu ; sans ceci on pourrait commander une couleur
      // indisponible en cliquant simplement sa pastille.
      // La fonction est tolérante : #pAdd n'existe pas encore au tout premier appel (il est
      // câblé plus bas dans renderProduct), et un id absent ne doit jamais faire tomber le
      // rendu entier — c'est le piège maison n° 1 de cette page.
      function syncColorStock(slug) {
        const gone = !!(YZA.jawharaColorSoldOut && YZA.jawharaColorSoldOut(product.handle, slug));
        $$('#pColorSwatches .product-color__swatch').forEach((el) => {
          el.classList.toggle('is-sold-out',
            !!(YZA.jawharaColorSoldOut && YZA.jawharaColorSoldOut(product.handle, el.dataset.colorSlug)));
        });
        const btn = $('#pAdd');
        if (!btn) return;
        const lbl = btn.querySelector('.product-add-main__label') || btn;
        // productUiCopy() et NON stockCopy()/pp.add : ce bouton est ecrit au rendu depuis
        // productUiCopy (« AJOUTER AU PANIER », capitales de la charte, « ADD TO BAG » en
        // anglais). Reecrire avec une autre table donnait « Ajouter au panier » en bas de
        // casse — et en anglais une phrase differente. Une seule source pour un seul bouton.
        const ui = productUiCopy();
        if (gone) {
          btn.disabled = true;
          btn.dataset.colorSoldOut = '1';
          lbl.textContent = ui.sold;
        } else if (btn.dataset.colorSoldOut === '1') {
          // On ne réactive QUE ce qu'on a désactivé soi-même : si la pièce entière est
          // épuisée, c'est renderProduct qui commande et on ne doit pas la remettre en vente.
          delete btn.dataset.colorSoldOut;
          const hard = YZA.inventoryStatus?.(product) || { soldOut: false };
          btn.disabled = !!hard.soldOut;
          lbl.textContent = hard.soldOut ? ui.sold : ui.add;
        }
      }
      /* On applique TOUJOURS le coloris actif au chargement, plus seulement quand l'URL en
         porte un. Sans ça, une fiche ouverte sans `?color=` gardait la galerie brute — le
         packshot Blanc Jasmin codé en dur suivi des photos d'autres coloris — et n'était
         assainie qu'au premier clic sur une pastille. La cliente voyait donc les mauvaises
         images précisément au moment qui compte, l'arrivée sur la page. */
      // Hydrate a naked route with the default colour media without rewriting the
      // canonical URL. Only an explicit customer selection creates `?color=`.
      applyColor(activeSlug, { updateUrl: Boolean(fromUrl) });
      $('#pColorSwatches').onclick = (event) => {
        const btn = event.target.closest('[data-color-slug]');
        if (!btn) return;
        const slug = btn.dataset.colorSlug;
        // Re-run the PDP renderer after changing the shareable query so released
        // per-colour copy, details, gallery and metadata all switch atomically.
        try {
          const u = new URL(location.href);
          u.searchParams.set('color', slug);
          history.replaceState(history.state, '', u.pathname + u.search + u.hash);
          params.set('color', slug);
        } catch (_) { /* non-blocking */ }
        renderProduct();
        requestAnimationFrame(() => document.querySelector(`#pColorSwatches [data-color-slug="${CSS.escape(slug)}"]`)?.focus({ preventScroll: true }));
      };
      const viewC = $('#pViewColors');
      if (viewC) {
        viewC.hidden = cols.length < 2;
        viewC.textContent = ({ fr: 'Voir les couleurs', en: 'View the colors', es: 'Ver los colores', tr: 'Renkleri gör', ar: 'عرض الألوان' })[t.lang] || 'View the colors';
        viewC.onclick = () => openColorsModal(viewC.textContent, cols.map((c) => ({
          name: t.pick(c),
          soldOut: !!(YZA.jawharaColorSoldOut && YZA.jawharaColorSoldOut(product.handle, c.slug)),
        })));
      }
      return;
    }

    $('#pColorName').textContent = colors[0];
    // Plus de slice(0, 8) : cette branche de repli coupait le 9e coloris et au-dela, sans
    // rien signaler. Le meme defaut avait deja ete corrige au-dessus pour les pieces qui
    // ont une photographie par coloris (l.2681) ; il restait ici, ou tombe notamment la
    // jupe pareo extra-longue — seule piece Jawhara absente de JAWHARA_COLOR_MEDIA — qui
    // affichait donc 8 pastilles sur les 9 de sa liste.
    $('#pColorSwatches').innerHTML = colors.map((name, index) =>
      `<button type="button" class="product-color__swatch${index === 0 ? ' is-active' : ''}" aria-label="${esc(name)}" title="${esc(name)}" style="${swatchStyle(name)}" data-color-name="${esc(name)}"></button>`
    ).join('');
    $('#pColorSwatches').onclick = (event) => {
      const btn = event.target.closest('[data-color-name]');
      if (!btn) return;
      $$('#pColorSwatches .product-color__swatch').forEach((el) => el.classList.remove('is-active'));
      btn.classList.add('is-active');
      $('#pColorName').textContent = btn.dataset.colorName || '';
      // Per-colour image swap (clothing): when a colour has its own photo (product.colorImages
      // keyed by the FR colour name), swap the gallery main image to it. No-op until populated.
      const cimg = product.colorImages && product.colorImages[btn.dataset.colorName];
      if (cimg) {
        const gm = document.querySelector('#galMain img');
        if (gm) { gm.removeAttribute('srcset'); gm.src = cimg; gm.dataset.colorSwapped = '1'; }
      }
    };
    const view = $('#pViewColors');
    if (view) {
      view.hidden = colors.length < 2;
      view.textContent = ({ fr: 'Voir les couleurs', en: 'View the colors', es: 'Ver los colores', tr: 'Renkleri gör', ar: 'عرض الألوان' })[t.lang] || 'View the colors';
      view.onclick = () => openColorsModal(view.textContent, colors);
    }
  }

  // Premium colour list: each colourway as a real swatch dot + its name, in a clean grid,
  // instead of a plain "Blanc · Noir · …" run of text.
  function openColorsModal(title, colors) {
    let modal = $('#colorsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'product-mini-modal colors-modal';
      modal.id = 'colorsModal';
      modal.innerHTML = '<div class="product-mini-modal__card colors-modal__card" role="dialog" aria-modal="true"><button type="button" class="product-mini-modal__close" aria-label="Close">+</button><h2></h2><ul class="colors-modal__list"></ul></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.closest('.product-mini-modal__close')) modal.classList.remove('is-open');
      });
    }
    modal.querySelector('h2').textContent = title;
    // Accepte une liste de NOMS (branche de repli, historique) ou d'objets {name, soldOut}.
    // Sans cette seconde forme, la popup presentait un coloris epuise exactement comme les
    // neuf autres : on l'apprenait apres l'avoir choisi. C'est le travers deja corrige sur
    // les pastilles ; il restait ici, et cette popup est regardee — elle a ete restylee
    // « premium » a la demande de la cliente.
    modal.querySelector('.colors-modal__list').innerHTML = colors.map((c) => {
      const name = (c && typeof c === 'object') ? c.name : c;
      const gone = !!(c && typeof c === 'object' && c.soldOut);
      return `<li class="colors-modal__item${gone ? ' is-sold-out' : ''}">`
        + `<span class="colors-modal__dot" style="background:${cardSwatchHex(name)}"></span>`
        + `<span class="colors-modal__name">${esc(name)}</span>`
        + (gone ? `<span class="colors-modal__gone">${esc(stockCopy().sold)}</span>` : '')
        + `</li>`;
    }).join('');
    modal.classList.add('is-open');
  }

  function openProductModal(title, body) {
    let modal = $('#productMiniModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'product-mini-modal';
      modal.id = 'productMiniModal';
      modal.innerHTML = '<div class="product-mini-modal__card" role="dialog" aria-modal="true"><button type="button" class="product-mini-modal__close" aria-label="Close">+</button><h2></h2><p></p></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.closest('.product-mini-modal__close')) modal.classList.remove('is-open');
      });
    }
    modal.querySelector('h2').textContent = title;
    modal.querySelector('p').textContent = body;
    modal.classList.add('is-open');
  }

  // Full-screen image zoom (PDP gallery). One reusable modal; close on backdrop / × / Esc.
  function openGalleryZoom(src, alt) {
    let modal = document.getElementById('galleryZoom');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'galleryZoom';
      modal.className = 'gallery-zoom';
      modal.innerHTML = '<button type="button" class="gallery-zoom__close" aria-label="Close">+</button><img class="gallery-zoom__img" alt="">';
      document.body.appendChild(modal);
      const close = () => { modal.classList.remove('is-open'); document.body.style.overflow = ''; };
      modal.addEventListener('click', (ev) => { if (ev.target === modal || ev.target.closest('.gallery-zoom__close')) close(); });
      document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && modal.classList.contains('is-open')) close(); });
    }
    const img = modal.querySelector('.gallery-zoom__img');
    img.src = src; img.alt = alt || '';
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function wireProductAux(product, pageName, addHandler, shareTitle, explicitColorSlug) {
    const c = productUiCopy();
    const pageUrl = `${location.origin}${productUrl(product.handle)}`
      + (explicitColorSlug ? `?color=${encodeURIComponent(explicitColorSlug)}` : '');
    const phone = (YZA.brand?.whatsapp || '').replace(/\D/g, '');
    const sameDay = $('#sameDayDelivery');
    if (sameDay) sameDay.onclick = () => openProductModal(c.deliveryTitle, c.deliveryBody);
    const dropHint = $('#dropHint');
    if (dropHint) dropHint.onclick = () => {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`${c.hintText}\n${pageName}\n${pageUrl}`)}`, '_blank', 'noopener');
    };
    const q = $('#accQuestions');
    if (q) q.innerHTML = `<p>${esc(c.deliveryBody)}</p><button class="link-underline" type="button" data-open-lead-chat>${esc(c.ask)}</button>`;
    const share = $('#accShare');
    if (share) share.innerHTML = `<button class="link-underline" type="button" data-share-product>${esc(c.shareCopy)}</button>`;
    // [data-open-lead-chat] triggers are opened by chrome.js's delegated listener
    // (it calls openChat). Do NOT also click the FAB here — the FAB now opens the popup
    // itself, so clicking it would double-toggle (open then immediately close).
    document.querySelectorAll('[data-share-product]').forEach((btn) => {
      btn.onclick = async () => {
        if (navigator.share) {
          try { await navigator.share({ title: shareTitle || `${pageName} - YZA`, url: pageUrl }); return; } catch (err) {}
        }
        try { await navigator.clipboard.writeText(pageUrl); btn.textContent = c.copied; } catch (err) { location.href = window.yzaPreviewUrl(pageUrl); }
      };
    });
    const mobileBar = $('#mobileProductBar');
    const mobileName = $('#mobileProductBarName');
    const mobileAdd = $('#mobileProductAdd');
    if (mobileBar && mobileName && mobileAdd) {
      mobileName.textContent = pageName;
      mobileAdd.textContent = c.add;
      mobileAdd.onclick = addHandler;
      const mainAdd = $('#pAdd');
 if (!['bags', 'charms', 'earrings'].includes(product.category) && product.group !== 'rtw' && 'IntersectionObserver' in window && mainAdd) {
        const io = new IntersectionObserver(([entry]) => {
          mobileBar.hidden = entry.isIntersecting || window.innerWidth > 860;
          // Lets CSS lift the floating chat/store widgets above the bar (no overlap).
          document.body.classList.toggle('has-product-bar', !mobileBar.hidden);
        }, { threshold: 0.08 });
        io.observe(mainAdd);
      }
    }
  }

 function renderProduct() {
 const root = $('#productRoot'); if (!root) return;
 const handle = params.get('handle');
 const canonicalProduct = YZA.getProduct(handle);
 // Never turn an unknown or unpublished URL into the first product. The PHP route has
 // already returned 404/noindex; this guard keeps the hydrated view equally truthful.
 if (!canonicalProduct) {
  document.title = 'Produit indisponible - YZA';
  root.innerHTML = '<section class="section"><p class="eyebrow">YZA</p><h1>Produit indisponible</h1><p>Cette pièce n’est plus disponible.</p><p><a class="btn btn--solid" href="/collections">Voir la collection</a></p></section>';
  return;
 }
 const requestedColor = params.get('color') || canonicalProduct.defaultColorSlug || '';
 const baseProduct = requestedColor && YZA.resolveProductColorView
  ? YZA.resolveProductColorView(canonicalProduct, requestedColor)
  : canonicalProduct;
 const selectedBagVariant = resolveBagVariant(baseProduct);
 const p = bagViewProduct(baseProduct, selectedBagVariant);
 const t = T();
 const members = selectedBagVariant?.row?.items?.length
 ? selectedBagVariant.row.items.map((item) => {
 const product = YZA.getProduct(item.handle);
 if (!product) return null;
 return {
 ...product,
 price: item.price || product.price,
 variantLabel: product.familyOptionLabel || product.sizeLabels?.[item.size] || textObj(item.size, item.size),
 bagUrl: item.url,
 bagImg: item.img,
 bagColorSlug: item.colorSlug,
 isActiveBagVariant: item.handle === baseProduct.handle && item.colorSlug === selectedBagVariant.colorSlug,
 };
 }).filter(Boolean)
 : (typeof YZA.familyMembers === 'function' ? YZA.familyMembers(p) : [p]);
 let purchaseProduct = p;
 const pageName = t.pick(p.name || displayName(p));
 const explicitColorSlug = params.get('color') || '';
 const brandedProductName = Object.fromEntries(['fr', 'en', 'es', 'tr', 'ar'].map((lang) => {
  const names = canonicalProduct.name && typeof canonicalProduct.name === 'object' ? canonicalProduct.name : {};
  const name = names[lang] || names.en || names.fr || pageName;
  return [lang, name ? `${name} — YZA` : 'YZA'];
 }));
 const seoView = YZA.productSeoView?.(canonicalProduct, explicitColorSlug) || {
  seoTitle: canonicalProduct.seoTitle || brandedProductName,
  seoDescription: canonicalProduct.seoDescription || canonicalProduct.short || canonicalProduct.desc,
  socialTitle: canonicalProduct.socialTitle || canonicalProduct.seoTitle || brandedProductName,
  socialDescription: canonicalProduct.socialDescription || canonicalProduct.seoDescription || canonicalProduct.short || canonicalProduct.desc,
  seoKeywords: canonicalProduct.seoKeywords || null,
 };
 const pageSeoTitle = t.pick(seoView.seoTitle || {}) || `${pageName} - YZA`;
 const pageSeoDescription = t.pick(seoView.seoDescription || {});
 const pageSocialTitle = t.pick(seoView.socialTitle || {}) || pageSeoTitle;
 const pageSocialDescription = t.pick(seoView.socialDescription || {}) || pageSeoDescription;
 const pageSeoKeywords = seoView.seoKeywords;
 document.title = pageSeoTitle;
 if (root.dataset.viewedHandle !== p.handle) {
 root.dataset.viewedHandle = p.handle;
 YZA.analytics?.track('product_view', {
 handle: p.handle,
 familyHandle: p.familyHandle || '',
 category: p.category,
 price: p.price,
 });
 // Ad platforms (GA4/Meta/TikTok via tracking.js) — standard view_item.
 try {
 YZA.track?.('view_item', {
 value: (p.price || 0) / 100,
 currency: 'MAD',
 items: [{ item_id: p.handle, item_name: pageName, item_category: p.category || '', quantity: 1, price: (p.price || 0) / 100 }],
 });
 } catch (e) {}
 }

 const earringGallery = p.category === 'earrings';
 const earringMedia = earringGallery ? YZA.earringGallery?.(p) : null;
 const gal = earringMedia ? earringMedia.filter(item => item.type === 'image').map(item => item.src) : productGallery(p);
      // Server produit-seo.php owns the one Product JSON-LD block. The client updates
      // social metadata only; duplicate client Product schemas previously disagreed.
      try {
        const abs = (u) => (u && String(u).indexOf('http') === 0) ? u : ('https://yza-shop.com/' + String(u || '').replace(/^\//, ''));
        const schemaDesc = (pageSeoDescription || '').toString().replace(/\s+/g, ' ').trim().slice(0, 320);
        const setMeta = (sel, c) => { const el = document.querySelector(sel); if (el && c) el.setAttribute('content', c); };
        setMeta('meta[property="og:title"]', pageSocialTitle);
        if (schemaDesc) setMeta('meta[property="og:description"]', pageSocialDescription || schemaDesc);
        setMeta('meta[property="og:image"]', abs(gal[0]));
      } catch (e) {}
 // Unified ordered media list: prefer p.media (images + videos interleaved, in the
 // brand's own order); otherwise synthesise from the image gallery plus an optional
 // single lifestyle video, so every existing product renders exactly as before.
 const mediaItems = earringMedia || ((Array.isArray(p.media) && p.media.length)
 ? p.media.filter((m) => m && m.src && (m.type === 'video' || isPublicMedia(m.src)))
 : gal.map((src) => ({ type: 'image', src })).concat(
 p.lifestyleVideo ? [{ type: 'video', src: p.lifestyleVideo, poster: gal[gal.length - 1] }] : []
 ));
 if (!mediaItems.length) mediaItems.push({ type: 'image', src: gal[0] });
 // Bag galleries carry ~8 photos; the thumb strip was loading each at FULL resolution,
 // which blew past iOS Safari's per-tab image-decode budget — the gallery rendered blank
 // on real iPhones (page/text still showed). Serve small .thumb.jpg thumbnails for bags
 // (~11 KB vs ~120 KB); onerror falls back to the full image if a thumb is ever missing.
 const isBagGallery = !!(p && p.category === 'bags');
 // Les .thumb.jpg n'ont été générés que pour les JPG (La Nouvelle Vague). Les PNG
 // Sculpture n'en ont aucun : les viser produisait un 404 par vignette, rattrapé par
 // l'onerror mais payé en requête. On ne réécrit donc que les .jpg.
 const galThumb = (u) => (isBagGallery && u) ? u.replace(/\.jpe?g(\?[^"'#]*)?$/i, '.thumb.jpg') : u;
 // Pas de `background` en style en dur ici : il l'emporterait sur la feuille de styles.
 // Les bandes qui comblent le cadre d'une video letterboxee doivent etre BLANCHES, jamais
 // grises — elles doivent se raccorder aux photos produit sur fond blanc de la meme
 // galerie (cliente 2026-07-29 : « never use these grays to fill the space, use white »).
 // La regle qui fait foi est `.gallery__main > video { background: #fff }` dans
 // styles.css ; elle etait deja correcte, c'est ce style en ligne qui l'annulait.
 const videoMainMarkup = (src, poster) => `<video id="galMainVid" autoplay muted loop playsinline src="${esc(src)}"${poster ? ` poster="${esc(poster)}"` : ''} style="width:100%;height:100%;object-fit:contain;display:block"></video>`;
  const releasedImageAlt = t.pick(p.imageAlt || {}) || pageName;
  const imageMainMarkup = (src, altName) => `<img id="galMainImg" src="${esc(src)}" alt="${esc(altName || releasedImageAlt)}" fetchpriority="high" width="900" height="1180" decoding="async" data-zoomable onerror="this.onerror=null;this.src='${esc(gal[0] || p.img || '')}'">`;
 const galleryThumbAria = (altName, index, total) => `${altName || releasedImageAlt} — ${index + 1}/${total}`;
 // Tracks the name for the image currently in the gallery; updated on variant swap so
 // zoom + thumb-rebuild label the SELECTED variant, not the base product.
  let currentGalleryAlt = releasedImageAlt;
 $('#galMain').innerHTML = mediaItems[0].type === 'video' ? videoMainMarkup(mediaItems[0].src, mediaItems[0].poster) : imageMainMarkup(mediaItems[0].src);
 $('#galThumbs').innerHTML = mediaItems.map((it, i) => {
 const isVid = it.type === 'video';
 const thumbSrc = isVid ? (it.poster || gal[0] || it.src) : it.src;
 return `<button class="gallery__thumb${i === 0 ? ' is-active' : ''}${isVid ? ' gallery__thumb--play' : ''}" data-src="${esc(it.src)}" data-poster="${esc(isVid ? (it.poster || '') : '')}" data-gtype="${isVid ? 'video' : 'img'}" aria-label="${esc(galleryThumbAria(currentGalleryAlt, i, mediaItems.length))}"><img aria-hidden="true" src="${esc(galThumb(thumbSrc))}" onerror="this.onerror=null;this.src='${esc(thumbSrc)}'" alt="" loading="lazy" width="76" height="100" decoding="async">${isVid ? '<span class="gallery__play-icon" aria-hidden="true"></span>' : ''}</button>`;
 }).join('');
 $('#galThumbs').onclick = (e) => {
 const b = e.target.closest('.gallery__thumb'); if (!b) return;
 $$('#galThumbs .gallery__thumb').forEach(x => x.classList.remove('is-active'));
 b.classList.add('is-active');
 if (b.dataset.gtype === 'video') {
 $('#galMain').innerHTML = videoMainMarkup(b.dataset.src, b.dataset.poster);
 } else {
 let mainImg = $('#galMainImg');
 if (!mainImg) {
 $('#galMain').innerHTML = imageMainMarkup(b.dataset.src, currentGalleryAlt);
 } else {
 if (mainImg.getAttribute('src') === b.dataset.src) return;
 YZA.motion.swapImage(mainImg, b.dataset.src);
 }
 }
 };

 // Click the main image to open the full-screen zoom (images only, not videos).
 const galMainEl = $('#galMain');
 if (galMainEl) galMainEl.onclick = (e) => {
 if (galMainEl.dataset.didSwipe) return; // a swipe just happened - don't open zoom
 const zi = e.target.closest('#galMainImg[data-zoomable]');
 if (zi) openGalleryZoom(zi.getAttribute('src'), currentGalleryAlt);
 };
 // Horizontal swipe (mobile) / drag (desktop) moves through the gallery left & right.
 // Vertical gestures still scroll the page (touch-action: pan-y on .gallery__main).
 if (galMainEl && !galMainEl.dataset.swipeWired) {
 galMainEl.dataset.swipeWired = '1';
 const galNav = (dir) => {
 const thumbs = $$('#galThumbs .gallery__thumb');
 if (thumbs.length < 2) return;
 let idx = thumbs.findIndex((t) => t.classList.contains('is-active'));
 if (idx < 0) idx = 0;
 thumbs[(idx + dir + thumbs.length) % thumbs.length].click();
 };
 const markSwipe = () => { galMainEl.dataset.didSwipe = '1'; setTimeout(() => { delete galMainEl.dataset.didSwipe; }, 60); };
 let sx = 0, sy = 0, active = false;
 galMainEl.addEventListener('touchstart', (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; active = true; }, { passive: true });
 galMainEl.addEventListener('touchend', (e) => { if (!active) return; active = false; const t = e.changedTouches[0]; const dx = t.clientX - sx, dy = t.clientY - sy; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { markSwipe(); galNav(dx < 0 ? 1 : -1); } }, { passive: true });
 galMainEl.addEventListener('dragstart', (e) => e.preventDefault());
 let mdown = false, mx = 0, my = 0, mmoved = false;
 galMainEl.addEventListener('mousedown', (e) => { mdown = true; mx = e.clientX; my = e.clientY; mmoved = false; });
 window.addEventListener('mousemove', (e) => { if (mdown && Math.abs(e.clientX - mx) > 6) mmoved = true; });
 window.addEventListener('mouseup', (e) => { if (!mdown) return; mdown = false; const dx = e.clientX - mx, dy = e.clientY - my; if (mmoved && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { markSwipe(); galNav(dx < 0 ? 1 : -1); } });
 }
 // Gallery position dots only matter with >1 media; single image hides them.
 $('#galThumbs').hidden = mediaItems.length <= 1;
 // Re-render the gallery for a chosen size/length variant, so picking "Midi" etc.
 // shows that variant's real product images instead of the first variant's. The
 // delegated #galMain/#galThumbs click handlers stay wired (they live on the parents).
 function swapGalleryToVariant(prod, altName) {
 currentGalleryAlt = altName || releasedImageAlt;
 const g = productGallery(prod);
 const items = (Array.isArray(prod.media) && prod.media.length)
 ? prod.media.filter((m) => m && m.src && (m.type === 'video' || isPublicMedia(m.src)))
 : g.map((src) => ({ type: 'image', src })).concat(prod.lifestyleVideo ? [{ type: 'video', src: prod.lifestyleVideo, poster: g[g.length - 1] }] : []);
 if (!items.length) items.push({ type: 'image', src: g[0] });
 $('#galMain').innerHTML = items[0].type === 'video' ? videoMainMarkup(items[0].src, items[0].poster) : imageMainMarkup(items[0].src, altName);
 $('#galThumbs').innerHTML = items.map((it, i) => {
 const isVid = it.type === 'video';
 const thumbSrc = isVid ? (it.poster || g[0] || it.src) : it.src;
 return `<button class="gallery__thumb${i === 0 ? ' is-active' : ''}${isVid ? ' gallery__thumb--play' : ''}" data-src="${esc(it.src)}" data-poster="${esc(isVid ? (it.poster || '') : '')}" data-gtype="${isVid ? 'video' : 'img'}" aria-label="${esc(galleryThumbAria(currentGalleryAlt, i, items.length))}"><img aria-hidden="true" src="${esc(galThumb(thumbSrc))}" onerror="this.onerror=null;this.src='${esc(thumbSrc)}'" alt="" loading="lazy" width="76" height="100" decoding="async">${isVid ? '<span class="gallery__play-icon" aria-hidden="true"></span>' : ''}</button>`;
 }).join('');
 $('#galThumbs').hidden = items.length <= 1;
 }
 const galWish = $('#pGalleryWish');
 if (galWish) {
 const wished = wishlistHas(p.handle);
 galWish.innerHTML = `<button class="gallery__wish-btn${wished ? ' is-active' : ''}" type="button" data-wishlist-toggle="${esc(p.handle)}" aria-pressed="${wished ? 'true' : 'false'}" aria-label="${esc(T().t('a.wishlist') || 'Wishlist')}">${heartIcon()}</button>`;
 }

 const ui = productUiCopy();
 $('#pName').textContent = pageName;
 $('#pPrice').innerHTML = productPriceCompact(purchaseProduct);
 { const ap = $('#pAddPrice'); if (ap) ap.innerHTML = productPriceCompact(purchaseProduct); }
 // The essential product summary is the canonical PDP/order copy. A colour
 // may override it only when the visitor explicitly opened that colour URL;
 // the card-only displayShort field never owns this product-page sentence.
 const pageShort = explicitColorSlug && p.selectedColorway && p.selectedColorway.short
  ? p.selectedColorway.short : canonicalProduct.short;
 $('#pShort').textContent = t.pick(pageShort || p.short || displayShort(p));
 $('#pBreadcrumbName').textContent = pageName;
 $('#pBullets').innerHTML = productBullets(p).map((item) => `<li>${esc(item)}</li>`).join('');
 // Editorial story block — the "Point → Histoire → Objection → Métaphore → Invitation" filter.
 // Keyed by handle, else familyHandle; hidden when a product has no validated story yet.
  { const storyEl = $('#productStory');
   if (storyEl) {
      const st = p._releasedPersonaAuthority
        ? p.productStory
        : (p.productStory || (YZA.PRODUCT_STORIES || {})[p.handle] || (YZA.PRODUCT_STORIES || {})[p.familyHandle]);
      // Once a release carries a product-specific story it is the complete authority;
      // inherited Jawhara prose must not reappear beneath dashboard-managed content.
      const jawharaStory = (p.productStory || p._releasedPersonaAuthority) ? null
        : (/jawhara/i.test(`${p.handle || ''} ${t.pick(p.name) || ''}`) ? YZA.JAWHARA_STORY : null);
      const storyParts = [];
      if (p.fruitStory && p.sectionVisibility?.story !== false) storyParts.push(
        `<section class="product-story__released" data-released-section="story">` +
        `<p class="eyebrow">${esc(t.pick(p.collection || p.categoryLabel || {}))}</p>` +
        `<h2>${esc(t.pick(p.fruitStory.title))}</h2>` +
        `<p>${esc(t.pick(p.fruitStory.body))}</p>` +
        (p.fruitStory.collectionTitle ? `<h3>${esc(t.pick(p.fruitStory.collectionTitle))}</h3>` : '') +
        (p.fruitStory.collectionBody ? `<p>${esc(t.pick(p.fruitStory.collectionBody))}</p>` : '') +
        `</section>`
      );
      if (st) storyParts.push(
        `<div class="product-story__specific" data-released-section="persona">` +
       `<p class="product-story__point">${esc(t.pick(st.point))}</p>` +
       `<p class="product-story__body">${esc(t.pick(st.histoire))}</p>` +
       `<blockquote class="product-story__quote"><p>${esc(t.pick(st.metaphore))}</p></blockquote>` +
       `<p class="product-story__reassure">${esc(t.pick(st.objection))}</p>` +
       `<p class="product-story__invite">${esc(t.pick(st.invitation))}</p>` +
       `</div>`
     );
      if (jawharaStory) storyParts.push(
        `<section class="product-story__fabric" data-released-section="persona" aria-label="Jawhara">` +
       `<p class="eyebrow">${esc(t.pick(jawharaStory.point))}</p>` +
       `<h2>${esc(t.pick(jawharaStory.metaphore))}</h2>` +
       `<p>${esc(t.pick(jawharaStory.histoire))}</p>` +
       `<p>${esc(t.pick(jawharaStory.objection))}</p>` +
       `<p class="product-story__invite">${esc(t.pick(jawharaStory.invitation))}</p>` +
       `</section>`
     );
     if (storyParts.length) {
       storyEl.hidden = false;
       storyEl.innerHTML = storyParts.join('');
     } else { storyEl.hidden = true; storyEl.innerHTML = ''; }
   } }
 renderProductSwatches(p, swapGalleryToVariant);
 { const _sd = $('#sameDayDelivery'); if (_sd) _sd.textContent = ui.delivery; }
 $('#accSizeFitLabel').textContent = ui.sizeFit;
 const _makingLabel = { fr: 'FABRICATION', en: 'THE MAKING', es: 'ELABORACION', tr: 'YAPIM', ar: 'الصناعة' };
 const _mkl = $('#accMakingLabel');
 if (_mkl) _mkl.textContent = _makingLabel[T().lang] || _makingLabel.fr;
 $('#accCareLabel').textContent = ui.care;
 $('#accDeliveryLabel').textContent = ui.returns;
 const catInfo = typeof YZA.categoryInfo === 'function' ? YZA.categoryInfo(p) : { key: 'nav.charms', href: collectionUrl('charms') };
 const catCrumb = $('#pBreadcrumbCat');
 if (catCrumb) {
 catCrumb.href = catInfo.href;
 catCrumb.setAttribute('data-i18n', catInfo.key);
  catCrumb.textContent = t.pick(p.categoryLabel || {}) || t.t(catInfo.key);
 }

 // Preuve sociale (note) + mise en valeur de l'offre au moment du prix
 if ($('#pRating')) {
 const st = YZA.reviewStats;
 $('#pRating').setAttribute('data-placeholder', 'reviews');
 $('#pRating').innerHTML = st.real
 ? `${stars(st.avg, `${t.t('social.ratingOf')} ${String(st.avg).replace('.', ',')}/5`)} <span>${String(st.avg).replace('.', ',')}/5 · ${st.count} ${t.t('pp.reviews')}</span>`
 : `<a class="pp-rating-note" href="/#reviews">${t.t('social.rating')}</a>`;
 }
 if ($('#pValue')) {
 const editionText = p.edition ? t.pick(p.edition) : '';
 const limited = editionText ? `<span class="pp-limited">${esc(editionText)}</span>` : '';
 $('#pValue').innerHTML = (p.compareAt && p.compareAt > p.price)
 ? `<span class="pill-save">${t.t('offer.save')} ${t.formatPrice(p.compareAt - p.price)}</span>${limited}`
 : limited;
 }
 // Honest scarcity above ADD TO CART: only when real inventory is 1-5 (YZA.inventoryStatus,
 // "éditions limitées" made concrete). Untracked inventory (null) shows nothing.
 const renderScarcity = (prod) => {
 const el = $('#pScarcity');
 if (!el) return;
 const st = YZA.inventoryStatus?.(prod) || {};
 if (st.almostGone) {
 el.hidden = false;
 el.textContent = st.inventory === 1 ? t.t('pp.scarcity.one') : t.tFmt('pp.scarcity.count', { n: st.inventory });
 } else { el.hidden = true; el.textContent = ''; }
 };
 renderScarcity(purchaseProduct);
 // Free-shipping line under ADD TO CART: progress computed AS IF this piece were in the
 // cart (assumeItems), so the 500 DH accessories vs 1500 DH general threshold resolves
 // correctly whatever is already in the cart.
 const renderShipBar = (prod) => {
 const el = $('#pShipBar');
 if (!el || !YZA.cart?.shippingProgress) return;
 YZA.cart.load(); // renderProduct can run before cart.init() — read the real cart
 const s = YZA.cart.shippingProgress({ assumeItems: [{ handle: prod.handle, qty: 1 }] });
 el.innerHTML = s.remainingCents > 0
 ? t.tFmt('pp.shipbar.remaining', { x: t.formatPrice(s.remainingCents) })
 : t.t('pp.shipbar.unlockedWith');
 };
 renderShipBar(purchaseProduct);
 // Keep the line honest as the cart changes (adds from the drawer, qty steps…).
 if (!root.dataset.shipbarWired) {
 root.dataset.shipbarWired = '1';
 document.addEventListener('yza:cartchange', () => renderShipBar(purchaseProduct));
 }
 const cross = $('#pCross');
 if (cross) {
 const next = YZA.related(p.handle, 1)[0];
 if (next) {
 cross.hidden = false;
 cross.innerHTML = `<a href="${productUrl(next.handle)}">${t.t('pp.crosssell')} ${esc(t.pick(displayName(next)))} &rarr;</a>`;
 } else {
 cross.hidden = true;
 }
 }
 const badgeEl = $('#pBadge');
 if (badgeEl && p.badge) { badgeEl.hidden = false; badgeEl.className = 'badge'; badgeEl.removeAttribute('data-i18n'); badgeEl.textContent = t.pick(p.badge); }
 else if (badgeEl) badgeEl.hidden = true;

 const finishWrap = $('#pFinish');
 const finishOptions = YZA.productFinishOptions?.(p.handle) || [];
 if (p.category === 'charms' && !p.bundle && finishOptions.length) {
 finishWrap.hidden = false;
 $('#pFinishOpts').innerHTML = finishOptions.map((option, index) =>
  `<button type="button" class="chip${index === 0 ? ' is-active' : ''}" data-finish-key="${esc(option.key)}" aria-pressed="${index === 0 ? 'true' : 'false'}">${esc(t.pick(option.label))}</button>`).join('');
 // Finish labels are presentation; `data-finish-key` is the immutable cart/order
 // identity. A finish selection deliberately never swaps photography: the old map
 // mixed real and generated imagery and was not editable from the dashboard.
 $('#pFinishOpts').onclick = (e) => {
 const b = e.target.closest('.chip'); if (!b) return;
 $$('#pFinishOpts .chip').forEach((x) => { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
 b.classList.add('is-active'); b.setAttribute('aria-pressed', 'true');
 };
 } else { finishWrap.hidden = true; }

 /* TAILLE (cliente 2026-08-03 : « I need all products orders to specify exactly what product
    was purchased, size color price »). Jusqu'ici availableSizes n'apparaissait que sous forme
    de TEXTE dans l'accordéon de détails : la chemise Jawhara était vendue en S/M/L sans aucun
    moyen d'en choisir une, donc la commande partait sans taille et l'atelier devait rappeler
    la cliente. Les pièces en taille unique (toutes les autres, availableSizes: []) n'affichent
    rien — le bloc reste caché.
    Rendu volontairement identique aux puces de finition : même classe .chip, donc aucun CSS
    nouveau à écrire et à maintenir. */
 const sizeWrap = $('#pSize');
 const sizeOpts = $('#pSizeOpts');
 const _pSizes = Array.isArray(p.availableSizes) ? p.availableSizes.filter(Boolean) : [];
 if (sizeWrap && sizeOpts && _pSizes.length > 1) {
 sizeWrap.hidden = false;
 // Aucune taille présélectionnée : on veut un choix DÉLIBÉRÉ, pas un S par défaut
 // qu'on découvre à la livraison.
  const _sizeLabel = (s) => t.pick((p.sizeLabels && p.sizeLabels[s]) || {}) || s;
  sizeOpts.innerHTML = _pSizes.map((s) => {
  const selected = p.defaultSize && p.defaultSize === s;
  return `<button type="button" class="chip${selected ? ' is-active' : ''}" data-size="${esc(s)}" aria-pressed="${selected ? 'true' : 'false'}">${esc(_sizeLabel(s))}</button>`;
  }).join('');
 sizeOpts.onclick = (e) => {
 const b = e.target.closest('.chip'); if (!b) return;
 $$('#pSizeOpts .chip').forEach((x) => { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
 b.classList.add('is-active'); b.setAttribute('aria-pressed', 'true');
 sizeWrap.classList.remove('is-missing');
 YZA.analytics?.track('product_size_select', { handle: p.handle, size: b.dataset.size });
 };
 } else if (sizeWrap) { sizeWrap.hidden = true; }

 const variantWrap = ensureVariantWrap();
 const variantOpts = $('#pVariantOpts');
 if (members.length > 1 && variantWrap && variantOpts) {
 variantWrap.hidden = false;
 const isBagRail = p.category === 'bags';
 variantWrap.classList.remove('option--size-rail');
 variantWrap.querySelector('[data-variant-label]').textContent = isBagRail
 ? (({ fr: 'Taille', en: 'Size', es: 'Talla', tr: 'Beden', ar: 'المقاس' })[t.lang] || 'Size')
 : variantLabelFor(p, t);
 if (isBagRail) {
 // Bag sizes are separate products — render them as plain TEXT boxes (no photos) that
 // navigate to each size's page (client asked to drop the size images under the price).
 variantOpts.className = 'chips chips--variants';
 variantOpts.innerHTML = members.map((item) => {
 const active = item.isActiveBagVariant || (!selectedBagVariant && item.handle === p.handle) ? ' is-active' : '';
 const soldOut = (YZA.inventoryStatus?.(item) || {}).soldOut ? ' is-soldout' : '';
  const sizeLabel = releasedFamilyOption(item, t);
 const tileUrl = item.bagUrl || productUrl(item.handle);
 return '<a class="chip chip--variant' + active + soldOut + '" href="' + esc(tileUrl) + '" data-product-variant="' + esc(item.handle) + '" aria-label="' + esc(t.pick(displayName(item)) || t.pick(item.name)) + '"' + (active ? ' aria-current="true"' : '') + '>'
 + '<span>' + esc(sizeLabel) + '</span>'
 + '</a>';
 }).join('');
 variantOpts.onclick = (e) => {
 const tile = e.target.closest('[data-product-variant]');
 if (!tile) return;
 YZA.analytics?.track('product_variant_select', { handle: tile.dataset.productVariant, familyHandle: p.familyHandle || '', category: 'bags', fullPageSwap: true });
 };
 } else {
 variantOpts.className = 'chips chips--variants';
 variantOpts.innerHTML = members.map((item) => {
 const active = (!selectedBagVariant && item.handle === p.handle) ? ' is-active' : '';
 const soldOut = (YZA.inventoryStatus?.(item) || {}).soldOut ? ' is-soldout' : '';
  const label = releasedFamilyOption(item, t);
 return '<button class="chip chip--variant' + active + soldOut + '" type="button" data-product-variant="' + esc(item.handle) + '"' + (soldOut ? ' aria-disabled="true"' : '') + '>'
 + '<span>' + esc(label) + '</span><em aria-hidden="true">' + t.formatPrice(item.price) + '</em><span class="sr-only"> ' + t.formatPrice(item.price) + '</span>'
 + '</button>';
 }).join('');
 variantOpts.onclick = (e) => {
 const btn = e.target.closest('[data-product-variant]');
 if (!btn) return;
 const selected = YZA.getProduct(btn.dataset.productVariant);
 if (!selected) return;
 /* CHANGER DE LONGUEUR NAVIGUE, ET EMPORTE LE CORIS (cliente 2026-08-06 : « je clique
    une longueur et je retombe sur la version blanche »).
    L'echange SUR PLACE etait la cause : `swapGalleryToVariant` chargeait la galerie
    BRUTE de la piece voisine, c'est-a-dire son coloris par defaut — le Blanc Jasmin.
    Et il mentait doublement : le titre, le fil d'Ariane et l'URL continuaient d'annoncer
    la longueur PRECEDENTE pendant qu'on regardait les images de la nouvelle.
    Reappliquer la couleur sur place n'etait pas praticable : toute la machinerie de
    coloris (applyColor) est liee par fermeture a la piece de LA PAGE, pas a la voisine.
    On navigue donc, en passant `?color=` — la page se reconstruit entierement et tout
    redevient vrai d'un coup : titre, fil d'Ariane, URL partageable, galerie, prix.
    C'est aussi ce que font DEJA les tailles de sac, qui sont de vrais liens : les deux
    familles se comportent enfin pareil. */
 const slugCourant = ($('#pColorSwatches .product-color__swatch.is-active') || {}).dataset?.colorSlug || '';
 const dest = productUrl(selected.handle) + (slugCourant ? '?color=' + encodeURIComponent(slugCourant) : '');
 YZA.analytics?.track('product_variant_select', { handle: selected.handle, familyHandle: selected.familyHandle || '', color: slugCourant, fullPageSwap: true });
 location.href = window.yzaPreviewUrl(dest);
 };
 }
 } else if (variantWrap) {
 variantWrap.hidden = true;
 variantWrap.classList.remove('option--size-rail');
 }

 // Keep editorial content after purchase controls.
 { const _story = $('#productStory'); const _addBtn = $('#pAdd'); const _add = _addBtn && _addBtn.closest('.option--add');
   if (_story && _add && _add.parentNode) _add.after(_story); }

 const detailRows = [];
 // SKU intentionally hidden from customers (client request) — kept in data for internal use.
 if (p.color) detailRows.push(`<strong>${t.t('pp.color')}:</strong> ${esc(t.pick(p.color))}`);
 // Client 2026-07-21: a bag page showed "Coloris disponibles: Bleu / Tailles disponibles: XS"
 // — i.e. only the variant you were already looking at, which tells a shopper nothing. For bags
 // we list the WHOLE family off BAG_ROWS (every colourway, every size) instead of the collapsed
 // single-value arrays that bagViewProduct() builds for the selected variant. Non-bag products
 // keep their own arrays untouched.
 let _colors = p.availableColors;
 let _sizes = p.availableSizes;
 if (p.category === 'bags') {
  const fam = p.familyHandle || (YZA.activeBagRows ? YZA.activeBagRows() : []).find((r) => (r.items || []).some((it) => it.handle === p.handle))?.familyHandle;
  if (fam) {
   const cSeen = new Set(); const cOut = [];
   const sSeen = new Set(); const sOut = [];
   (YZA.activeBagRows ? YZA.activeBagRows(fam) : []).forEach((r) => {
    const label = r.color ? t.pick(r.color) : '';
    if (label && !cSeen.has(label)) { cSeen.add(label); cOut.push(label); }
    (r.items || []).forEach((it) => {
     const s = String(it.size || '').toUpperCase();
     if (s && !sSeen.has(s)) { sSeen.add(s); sOut.push(s); }
    });
   });
   if (cOut.length) _colors = cOut;
   if (sOut.length) _sizes = sOut.sort((a, b) => ['XS', 'S', 'M', 'L', 'XL'].indexOf(a) - ['XS', 'S', 'M', 'L', 'XL'].indexOf(b));
  }
 }
 if (_colors?.length) detailRows.push(`<strong>${t.t('pp.colors')}:</strong> ${_colors.map(c => esc(typeof c === 'string' ? c : t.pick(c))).join(', ')}`);
 if (_sizes?.length) detailRows.push(`<strong>${t.t('pp.availableSizes')}:</strong> ${_sizes.map((s) => {
  const owner = members.find((member) => (member.availableSizes || []).includes(s)) || p;
  return esc(releasedSizeLabel(owner, s, t));
 }).join(', ')}`);
 if (p.material) detailRows.push(`<strong>${t.t('pp.material')}:</strong> ${esc(t.pick(p.material))}`);
 if (p.fabric) detailRows.push(`<strong>${t.t('pp.fabric')}:</strong> ${esc(t.pick(p.fabric))}`);
 if (p.dimensions) detailRows.push(`<strong>${t.t('pp.size.label')}:</strong> ${esc(t.pick(p.dimensions))}`);
 if (p.attachment) detailRows.push(`<strong>${buyingProofCopy().attachment}:</strong> ${esc(t.pick(p.attachment))}`);
 if (p.whatFits) detailRows.push(`<strong>${buyingProofCopy().fits}:</strong> ${esc(t.pick(p.whatFits))}`);
 if (p.edition) detailRows.push(`<strong>${t.t('pp.edition')}:</strong> ${esc(t.pick(p.edition))}`);
 const _ml = ({ fr: 'Mannequin', en: 'Model', es: 'Modelo', tr: 'Manken', ar: 'العارضة' })[t.lang] || 'Model';
 const _sl = ({ fr: 'Conseil style', en: 'Style tip', es: 'Consejo de estilo', tr: 'Stil ipucu', ar: 'نصيحة الإطلالة' })[t.lang] || 'Style tip';
 if (p.modelNote) detailRows.push(`<strong>${_ml}:</strong> ${esc(t.pick(p.modelNote))}`);
 if (p.styleTip) detailRows.push(`<strong>${_sl}:</strong> ${esc(t.pick(p.styleTip))}`);
 if (p.howToWear && p.sectionVisibility?.howToWear !== false) {
 const wear = p.howToWear;
 const wearItems = Array.isArray(wear.items) ? wear.items : [];
 $('#accDetails').innerHTML = `<div class="charm-wear">
 <p class="charm-wear__intro">${esc(t.pick(p.desc))}</p>
 <h3>${esc(t.pick(wear.title))}</h3>
 <p>${esc(t.pick(wear.intro))}</p>
 <ul>${wearItems.map((item) => `<li>${esc(t.pick(item))}</li>`).join('')}</ul>
 <p><strong>${buyingProofCopy().styleTip} :</strong> ${esc(t.pick(wear.styleTip))}</p>
 <p><strong>${buyingProofCopy().note} :</strong> ${esc(t.pick(wear.note))}</p>
 ${detailRows.length ? `<div class="charm-wear__specs">${detailRows.map((r) => `<span>${r}</span>`).join('')}</div>` : ''}
 </div>`;
 } else {
 $('#accDetails').innerHTML = `${esc(t.pick(p.desc))}${detailRows.length ? `<br><br>${detailRows.join('<br>')}` : ''}`;
 }

 const making = p.making || (p.group === 'rtw'
 ? { fr: 'Piece Jawhara SS26 pensee pour les ensembles coordonnes et les silhouettes resort.', en: 'SS26 Jawhara piece designed for coordinated sets and resort silhouettes.' }
 : p.category === 'bags'
 ? { fr: 'Sac assemble a partir de feuilles de bananier, raphia et perles, dans la ligne La Sculpture.', en: 'Bag assembled from banana leaves, raffia and beads in the La Sculpture line.' }
 : { fr: t.t('pp.making.txt'), en: t.t('pp.making.txt') });
 const specs = [];
 if (p.size) specs.push(`<strong>${t.t('pp.size.label')} :</strong> ${esc(t.pick(p.size))}`);
 if (p.handworkTime) specs.push(`<strong>${buyingProofCopy().handwork} :</strong> ${esc(t.pick(p.handworkTime))}`);
 const makingEl = $('#accMaking');
 if (makingEl) makingEl.innerHTML = `${esc(t.pick(making))}${specs.length ? `<br><br>${specs.join('<br>')}` : ''}`;
 const globalService = typeof YZA.serviceLongText === 'function' ? YZA.serviceLongText() : esc(t.t('pp.ship.txt'));
 const productService = [p.shipping && t.pick(p.shipping), p.returns && t.pick(p.returns)].filter(Boolean);
 $('#accShip').innerHTML = globalService + (productService.length
  ? `<div class="product-service-exceptions">${productService.map((value) => `<p>${esc(value)}</p>`).join('')}</div>` : '');
 $('#accCare').innerHTML = `${esc(t.pick(p.care) || t.t('pp.care.txt'))}<br><br><strong>${buyingProofCopy().packaging} :</strong> ${esc(t.pick(p.packaging) || '')}`;

 const add = $('#pAdd');
 const addLabelEl = add.querySelector('.product-add-main__label') || add;
 const addStatus = YZA.inventoryStatus?.(purchaseProduct) || { soldOut: false };
 /* Un CORIS peut etre epuise sans que la piece le soit : on lit la pastille active en plus
    de l'inventaire produit. C'est ICI l'etat initial qui fait foi — syncColorStock() est
    defini plus haut mais s'execute avant que ce bouton soit cable, et serait donc ecrase. */
 const _initSlug = ($('#pColorSwatches .product-color__swatch.is-active') || {}).dataset?.colorSlug
   || purchaseProduct.defaultColorSlug || '';
 const _initColorGone = !!(_initSlug && YZA.jawharaColorSoldOut
   && YZA.jawharaColorSoldOut(purchaseProduct.handle, _initSlug));
 // Le JS est desormais la seule autorite sur ce libelle (cf. data-i18n-lock dans i18n.js).
 addLabelEl.setAttribute('data-i18n-lock', '');
 addLabelEl.textContent = (addStatus.soldOut || _initColorGone) ? ui.sold : ui.add;
 add.disabled = !!addStatus.soldOut || _initColorGone;
 if (_initColorGone) add.dataset.colorSoldOut = '1';
 const handleAdd = () => {
 if (add.disabled) return;
 /* Verrou final : meme si le bouton a ete reactive par un script, un retour arriere ou le
    clavier, on ne met jamais au panier un coloris epuise. */
 const _sw0 = $('#pColorSwatches .product-color__swatch.is-active');
 const _slug0 = _sw0 && _sw0.dataset.colorSlug;
 if (_slug0 && YZA.jawharaColorSoldOut?.(purchaseProduct.handle, _slug0)) return;
 /* Une taille obligatoire non choisie bloque l'ajout : mieux vaut une puce qui clignote
    qu'une commande qu'il faudra rattraper par téléphone. */
 if (sizeWrap && !sizeWrap.hidden && !$('#pSizeOpts .chip.is-active')) {
 sizeWrap.classList.add('is-missing');
 // NB : `reduced()` est défini DANS les IIFE de moodController/spectrumController,
 // pas au niveau module — l'appeler ici casserait tout le bouton d'ajout.
 const _still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 sizeWrap.scrollIntoView({ block: 'center', behavior: _still ? 'auto' : 'smooth' });
 return;
 }
 let variant = '';
 if (p.activeVariantLabel) variant = t.pick(p.activeVariantLabel);
 const f = $('#pFinishOpts .chip.is-active');
 const finishKey = (f && f.dataset.finishKey) || '';
 /* CORIS et TAILLE choisis sur la fiche : sans eux la ligne de panier part vide et
    l'e-mail de commande n'indique pas ce qui a été acheté — c'est exactement la
    commande #29 du 30/07, « YZA Pareo Skirt - Short » sans le moindre coloris.
    On lit la pastille ACTIVE plutôt que #pColorName : les trois branches du sélecteur
    (sacs, pièces Jawhara, repli) maintiennent toutes .is-active + data-color-name,
    alors que #pColorName est réécrit au survol et peut afficher autre chose.
    Les sacs portent déjà « XS / Noir » dans activeVariantLabel : on ne répète pas. */
 const _sw = $('#pColorSwatches .product-color__swatch.is-active');
 const _colorName = (_sw && _sw.dataset.colorName || '').trim();
 if (_colorName && variant.toLowerCase().indexOf(_colorName.toLowerCase()) === -1) {
 variant = variant ? `${variant} / ${_colorName}` : _colorName;
 }
 const _sizeBtn = $('#pSizeOpts .chip.is-active');
 const _sizeName = (_sizeBtn && _sizeBtn.dataset.size || '').trim();
 if (_sizeName) variant = variant ? `${_sizeName} / ${variant}` : _sizeName;
 const familyLabel = purchaseProduct.handle !== p.handle
 ? (t.pick(purchaseProduct.variantLabel) || t.pick(purchaseProduct.size) || t.pick(purchaseProduct.name))
 : '';
 if (familyLabel) variant = variant ? `${familyLabel} / ${variant}` : familyLabel;
 const qty = Math.max(1, parseInt($('#pQty').value || '1', 10));
 const added = YZA.cart.add(purchaseProduct.handle, variant, qty, {
  source: 'pdp', sizeCode: _sizeName || purchaseProduct.defaultSize || '',
  colorSlug: (_sw && _sw.dataset.colorSlug) || _slug0 || '', finishKey,
 });
 if (!added) return;
 YZA.cart.open();
 addLabelEl.textContent = t.t('cta.added');
 setTimeout(() => { addLabelEl.textContent = ui.add; }, 1500);
 };
 add.onclick = handleAdd;
 wireProductAux(p, pageName, handleAdd, pageSocialTitle, explicitColorSlug);

 const trust = $('#pTrustChips');
 if (trust) trust.innerHTML = '';
 const bundle = $('#pBundle');
 if (bundle) { bundle.hidden = true; bundle.innerHTML = ''; }
 renderProductSupport(p);
 renderProductRails(p);

  // Release-managed optional page sections. Commerce-critical price, variant, stock
  // and add-to-cart controls are intentionally outside this hide/reorder boundary.
  const visibility = p.sectionVisibility || {};
  const setVisible = (selector, visible) => {
   const element = document.querySelector(selector);
   if (element) element.hidden = visible === false;
  };
  // gallery + summary are essential layout anchors even though their keys are
  // carried for ordering diagnostics; they can never hide commerce context.
  setVisible('#pBullets', visibility.buyingBullets);
   setVisible('#accordion .accordion__item:first-child', visibility.details);
  setVisible('.product-rail-section', visibility.related);
   document.querySelectorAll('[data-released-section="story"]').forEach((element) => {
    element.hidden = visibility.story === false;
   });
  document.querySelectorAll('[data-released-section="persona"]').forEach((element) => {
   element.hidden = visibility.persona === false;
  });

 // Per-product SEO: keep canonical + social tags + description in sync with the viewed product.
 // Only updates tags that already exist in the head (safe no-op otherwise).
  const absImg = new URL(p.img, location.href).href;
  const metaDesc = pageSeoDescription;
  const ogTitle = pageSocialTitle;
  const socialDesc = pageSocialDescription;
 const setMeta = (sel, val) => { const el = document.head.querySelector(sel); if (el && val) el.setAttribute('content', val); };
 const canonicalUrl = 'https://yza-shop.com' + productUrl(p.handle)
  + (explicitColorSlug ? '?color=' + encodeURIComponent(explicitColorSlug) : '');
 const canon = document.head.querySelector('link[rel="canonical"]');
 if (canon) canon.setAttribute('href', canonicalUrl);
 setMeta('meta[name="description"]', metaDesc);
 setMeta('meta[property="og:url"]', canonicalUrl);
 setMeta('meta[property="og:title"]', ogTitle);
  setMeta('meta[property="og:description"]', socialDesc);
 setMeta('meta[property="og:image"]', absImg);
 setMeta('meta[name="twitter:title"]', ogTitle);
  setMeta('meta[name="twitter:description"]', socialDesc);
 setMeta('meta[name="twitter:image"]', absImg);
 const localizedKeywords = pageSeoKeywords && typeof pageSeoKeywords === 'object'
  ? pageSeoKeywords[t.lang] || pageSeoKeywords.en || pageSeoKeywords.fr : pageSeoKeywords;
 const keywordsContent = Array.isArray(localizedKeywords)
  ? localizedKeywords.filter(Boolean).join(', ') : String(localizedKeywords || '').trim();
 let keywordsMeta = document.head.querySelector('meta[name="keywords"]');
 if (keywordsContent) {
  if (!keywordsMeta) {
   keywordsMeta = document.createElement('meta');
   keywordsMeta.setAttribute('name', 'keywords');
   document.head.appendChild(keywordsMeta);
  }
  keywordsMeta.setAttribute('content', keywordsContent);
 } else if (keywordsMeta) keywordsMeta.remove();
 // Category presentations reuse the existing commerce controls and catalog data.
  YZA.renderBagMaison?.({ product: p, canonicalProduct, members });
  YZA.renderCharmMaison?.({ product: p, canonicalProduct });
  YZA.renderClothingMaison?.({ product: p, canonicalProduct, members });
  YZA.renderEarringMaison?.({ product: p, canonicalProduct });
  YZA.purchaseFirst?.(p);
  YZA.modelStories?.renderPage();
 }

 /* ================= INTERACTIONS GÉNÉRIQUES ================= */
 function enhanceFaqAccordions() {
 document.querySelectorAll('#faqList .faq-qa').forEach((item, index) => {
 const heading = item.querySelector(':scope > .faq-q');
 const panel = item.querySelector(':scope > .faq-a');
 if (!heading || !panel || heading.querySelector('.faq-toggle')) return;
 const panelId = `faq-panel-${item.id || index + 1}`;
 const button = document.createElement('button');
 button.type = 'button';
 button.className = 'accordion__btn faq-toggle';
 button.setAttribute('aria-expanded', 'false');
 button.setAttribute('aria-controls', panelId);
 button.innerHTML = `${heading.innerHTML}<span class="plus" aria-hidden="true"><svg class="acc-glyph" viewBox="0 0 20 20"><path d="M3 10h14"/><path class="acc-bar-v" d="M10 3v14"/></svg></span>`;
 heading.replaceChildren(button);
 item.classList.add('accordion__item', 'faq-item');
 panel.id = panelId;
 panel.classList.add('accordion__panel', 'faq-answer');
 panel.style.maxHeight = '0';
 });
 }
 enhanceFaqAccordions();
 let _accWired = false;
 function wireAccordion() {
 if (_accWired) return;
 _accWired = true;
 document.addEventListener('click', (e) => {
 const btn = e.target.closest('.accordion__btn');
 if (!btn) return;
 const item = btn.closest('.accordion__item');
 if (!item) return;
 const panel = item.querySelector('.accordion__panel');
 const open = item.classList.toggle('is-open');
 btn.setAttribute('aria-expanded', String(open));
 if (panel) { panel.style.maxHeight = open ? 'none' : '0'; if (open) YZA.motion.enter(panel, {fast:true,fadeOnly:true}); }
 });
 }
 wireAccordion();
 // Re-measure open accordion panels after a language swap or resize (inline maxHeight
 // is set from scrollHeight, which goes stale when AR/TR text length changes).
 function remeasureOpenAccordions() {
 document.querySelectorAll('.accordion__item.is-open .accordion__panel').forEach((p) => { p.style.maxHeight = 'none'; });
 }

 function wireReveal() { YZA.motion.scan(); }
  function wireForms() {
 $$('.newsletter__form').forEach(form => form.addEventListener('submit', (e) => {
 e.preventDefault();
 /* `querySelector('input[type="email"], input')` rendait le PIEGE A ROBOTS : une liste de
    selecteurs renvoie le premier element dans l'ordre du DOCUMENT qui matche N'IMPORTE
    quelle branche, et le piege est le premier <input> du formulaire — il matchait `input`.
    On lisait donc sa valeur (toujours vide) comme e-mail : « Entrez un e-mail valide » a
    CHAQUE envoi. Le formulaire du pied de page n'a jamais enregistre personne (0 ligne
    `footer` dans .private/yza-subscribers.php, contre 76 `popup10`). Diagnostique
    2026-08-11. On vise le champ e-mail explicitement, et le repli exclut le piege. */
 const input = form.querySelector('input[type="email"]') || form.querySelector('input:not([aria-hidden="true"])');
 const msg = form.querySelector('[data-news-msg]');
 const email = (input?.value || '').trim();
 const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 if (!ok) {
 if (input) input.classList.add('is-invalid');
 if (msg) { msg.textContent = T().lang === 'fr' ? 'Entrez un e-mail valide.' : 'Enter a valid email.'; msg.hidden = false; }
 YZA.analytics?.track('newsletter_submit_invalid', { source: document.body.dataset.page || '' });
 return;
 }
 input?.classList.remove('is-invalid');
 const nlBtn = form.querySelector('button[type="submit"]');
 if (nlBtn) nlBtn.disabled = true;
 if (msg) { msg.textContent = T().lang === 'fr' ? 'Un instant…' : 'One moment…'; msg.hidden = false; }
 // Piege a robots. Le champ s'appelle `yza_hp_note` et non `company` : les navigateurs et
 // gestionnaires de mots de passe pre-remplissent tout seuls les noms qui ont un sens, et
 // subscribe.php jette alors l'inscription en silence. Nom pose par chrome.js (footer) et
 // promo-popup.js — on ne lit PLUS l'ancien nom, un vieux markup en cache degrade vers
 // « pas de piege » (inscription enregistree) plutot que vers une perte silencieuse.
 const nlHp = form.querySelector('input[name="yza_hp_note"]');
 const nlName = form.querySelector('input[autocomplete="name"]'); // footer form collects a name; pass it through
 fetch('/subscribe.php', {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email, name: nlName ? (nlName.value || '').trim() : '', lang: T().lang || 'fr', page: document.body.dataset.page || '', source: form.dataset.newsSource || '', _hp: nlHp ? nlHp.value : '' }),
 }).then((r) => r.ok).catch(() => false).then((sent) => {
 if (nlBtn) nlBtn.disabled = false;
 if (sent) {
 if (msg) { msg.textContent = T().t('news.ok'); msg.hidden = false; }
 if (input) input.value = '';
 YZA.analytics?.track('newsletter_submit', { source: document.body.dataset.page || '' });
 } else {
 if (msg) { msg.textContent = T().lang === 'fr' ? 'Envoi impossible pour le moment — réessayez.' : 'Could not send right now — please retry.'; msg.hidden = false; }
 YZA.analytics?.track('newsletter_submit_error', { source: document.body.dataset.page || '' });
 }
 });
 }));
 $$('[data-contact-form]').forEach(form => form.addEventListener('submit', (e) => {
 e.preventDefault();
 const msg = form.querySelector('[data-form-msg]');
 const okHTML = msg ? msg.innerHTML : ''; // cache the multilingual success markup
 const fields = Array.from(form.querySelectorAll('[required]'));
 const invalid = fields.find((field) => {
 const value = (field.value || '').trim();
 if (!value) return true;
 if (field.type === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
 return false;
 });
 fields.forEach((field) => field.classList.toggle('is-invalid', field === invalid));
 if (invalid) {
 if (msg) { msg.textContent = T().lang === 'fr' ? 'Completez les champs obligatoires.' : 'Complete the required fields.'; msg.hidden = false; }
 invalid.focus({ preventScroll: false });
 YZA.analytics?.track('contact_form_invalid', { source: document.body.dataset.page || '', field: invalid.name || invalid.id || '' });
 return;
 }
 // Send to the server (e-mails the shop + syncs to Brevo). Best-effort: the UX
 // stays optimistic — read the values BEFORE reset(), then fire-and-forget.
 const cfVal = (n) => { const el = form.querySelector(`[name="${n}"]`); return el ? (el.value || '').trim() : ''; };
 fetch('/contact.php', {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ name: cfVal('name'), email: cfVal('email'), message: cfVal('message'), lang: T().lang || 'fr', _hp: cfVal('yza_hp_note') }),
 }).catch(() => {});
 if (msg) { msg.innerHTML = okHTML; msg.hidden = false; } // restore success markup (error may have overwritten it)
 form.reset();
 YZA.analytics?.track('contact_form_submit', { source: document.body.dataset.page || '' });
    }));
  }
  function wireProductCards() {
    if (YZA._productCardsWired) return;
    YZA._productCardsWired = true;
    const readWishlist = () => {
      try { return JSON.parse(localStorage.getItem('yza_wishlist')) || []; } catch (e) { return []; }
    };
    const writeWishlist = (items) => {
      try {
        const active = Array.from(new Set(items)).filter((handle) => handle && YZA.getProduct?.(handle));
        localStorage.setItem('yza_wishlist', JSON.stringify(active));
        return active;
      } catch (e) { return []; }
    };
    // Header heart badge: show the saved count, hide the badge when empty.
    const syncWishlistCount = () => {
      const current = writeWishlist(readWishlist());
      const n = current.length;
      document.querySelectorAll('[data-wishlist-count]').forEach((el) => { el.textContent = n; });
      document.querySelectorAll('.wishlist-btn').forEach((b) => b.classList.toggle('has-items', n > 0));
    };
    syncWishlistCount();
    document.addEventListener('click', (event) => {
      const wish = event.target.closest('[data-wishlist-toggle]');
      if (wish) {
        event.preventDefault();
        event.stopPropagation();
        const handle = wish.getAttribute('data-wishlist-toggle');
        if (!YZA.getProduct?.(handle)) return;
        const list = readWishlist();
        const exists = list.includes(handle);
        const next = exists ? list.filter((item) => item !== handle) : [...list, handle];
        writeWishlist(next);
        document.querySelectorAll(`[data-wishlist-toggle="${CSS.escape(handle)}"]`).forEach((btn) => {
          btn.classList.toggle('is-active', !exists);
          btn.setAttribute('aria-pressed', !exists ? 'true' : 'false');
        });
        syncWishlistCount();
        if (document.getElementById('wishlistGrid')) renderWishlist();  // live-refresh the favourites page
        YZA.analytics?.track(exists ? 'wishlist_remove' : 'wishlist_add', { handle });
        return;
      }
      const quick = event.target.closest('[data-quickbuy]');
      if (quick) {
        event.preventDefault();
        event.stopPropagation();
        const handle = quick.getAttribute('data-quickbuy');
        if (handle && YZA.cart) {
          // Dernier verrou avant le panier : le CORIS affiché est-il encore disponible ?
          // Le bouton est déjà retiré par applyColorSoldOut, mais il peut rester en place
          // le temps d'un rendu, survivre à un retour arrière, ou être atteint au clavier.
          // On revérifie donc ici, au moment de l'ajout, plutôt que de faire confiance au DOM.
          const _qbCard = quick.closest('.product-card');
          const _qbSlug = _qbCard
            && (_qbCard.querySelector('[data-color-swatches] [data-color-slug].is-active') || {}).dataset?.colorSlug;
          if (_qbSlug && YZA.jawharaColorSoldOut?.(handle, _qbSlug)) {
            if (_qbCard) applyColorSoldOut(_qbCard, handle, _qbSlug);   // remet l'écran d'accord avec la réalité
            return;
          }
          // Variante : soit figée au rendu (cartes sacs, un coloris par carte), soit
          // lue sur la pastille active (prêt-à-porter, où la cliente change de coloris
          // sans recharger). Sans ça la couleur choisie était perdue à l'ajout.
          let variant = quick.getAttribute('data-quickbuy-variant') || '';
          if (!variant) {
            const card = quick.closest('.product-card');
            const active = card && card.querySelector('[data-color-swatches] [data-color-slug].is-active');
            if (active) {
              const nom = (active.querySelector('.sr-only') || {}).textContent
                || active.getAttribute('aria-label') || active.getAttribute('data-color-slug') || '';
              variant = String(nom).trim();
            }
          }
          // A one-click charm card has no finish selector. Choose the first active
          // released option explicitly and persist its immutable key; an omitted key
          // is reserved for migrating historical blank lines to an active `loop` only.
          const _qbProduct = YZA.getProduct?.(handle);
          const _qbHasFinish = Array.isArray(_qbProduct?.finishOptions);
          const _qbFinishKey = (YZA.productFinishOptions?.(handle) || [])[0]?.key || '';
          if (_qbHasFinish && !_qbFinishKey) return;
          const _qbSizeCode = (_qbProduct?.availableSizes || []).includes(_qbProduct?.defaultSize)
            ? _qbProduct.defaultSize : ((_qbProduct?.availableSizes || []).length === 1 ? _qbProduct.availableSizes[0] : '');
          const _qbMeta = { source: 'quick_add', colorSlug: _qbSlug || '', sizeCode: _qbSizeCode };
          if (_qbFinishKey) _qbMeta.finishKey = _qbFinishKey;
          const _qbAdded = YZA.cart.add(handle, variant, 1, _qbMeta);
          if (!_qbAdded) return;
          YZA.cart.refresh?.();
          YZA.cart.open?.();
          YZA.analytics?.track('quick_add', { handle, variant, sizeCode: _qbSizeCode, finishKey: _qbFinishKey });
        }
        return;
      }
      // Colour swatch on a product card. Must be handled BEFORE the navigation lookup
      // below, and must stop propagation — the swatch row sits inside <article
      // class="product-card">, so without this a colour click would navigate away.
      const swatch = event.target.closest('[data-color-slug]');
      if (swatch && swatch.closest('[data-color-swatches]')) {
        event.preventDefault();
        event.stopPropagation();
        const row = swatch.closest('[data-color-swatches]');
        const handle = row.getAttribute('data-color-swatches');
        const slug = swatch.getAttribute('data-color-slug');
        const product = YZA.getProduct?.(handle);
        const colorView = product && YZA.resolveProductColorView?.(product, slug);
        const src = colorView?.img || YZA.jawharaImage?.(handle, slug);
        /* Le lien est mis a jour AVANT le garde `if (src)` et en dehors de lui : la cliente
           a choisi une couleur, le lien doit y mener meme si cette piece n'a pas encore de
           packshot pour ce coloris. Enfermer l'appel dans le `if` reproduirait le bug. */
        applyColorLink(row.closest('.product-card'), slug);
        applyColorCardCopy(row.closest('.product-card'), handle, slug);
        if (src) {
          const article = row.closest('.product-card');
          const img = article && article.querySelector('.product-card__img');
          if (img) {
            // Échange direct : `.is-swapping` n'existe en CSS que sous `.gallery__main img`,
            // donc sur une carte la classe ne fondait rien — elle ne faisait que retarder
            // l'image de 120 ms et la désynchroniser du calque hover réglé juste en dessous.
            img.src = src;
            img.alt = T().pick(colorView?.imageAlt || {}) || swatch.getAttribute('aria-label') || img.alt;
          }
          // Le survol suit le coloris ET l'ambiance — même règle qu'au spectre et à la
          // bascule Jour/Nuit, donc un seul chemin de code. L'ancienne version recopiait
          // le packshot dans le calque faute de photo dédiée : au mieux un survol qui ne
          // change rien, au pire — vu ici — le packshot d'un AUTRE coloris resté en place.
          if (article) { applyColorHover(article, handle, slug); applyColorSoldOut(article, handle, slug); }
        }
        row.querySelectorAll('[data-color-slug]').forEach((b) => {
          const on = b === swatch;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (collState.cat === 'rtw') YZA.rtwCollection?.applyCardMood(row.closest('.product-card'), true);
        YZA.analytics?.track('product_color_select', { handle, color: slug, surface: 'card' });
        return;
      }
      const card = event.target.closest('[data-product-card-click]');
      if (card) {
        const handle = card.getAttribute('data-product-card-click');
        const product = YZA.getProduct?.(handle);
        YZA.analytics?.track('product_card_click', {
          handle,
          category: product?.category || '',
          price: product?.price || 0,
        });
      }
    });
    // Hover-preview videos on product cards (client: "hovering should preview 4 sec").
    // Delegated so it works on re-rendered grids; src is lazy-set on first hover.
    const hoverIn = (e) => {
      const media = e.target.closest('.product-card__media.has-hover-video');
      if (!media || YZA.motion.preference.matches) return;
      const v = media.querySelector('.product-card__vid');
      if (!v) return;
      if (!v.getAttribute('src') && v.dataset.hoverVideo) v.setAttribute('src', v.dataset.hoverVideo);
      try { v.currentTime = 0; const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (err) {}
    };
    const hoverOut = (e) => {
      const media = e.target.closest('.product-card__media.has-hover-video');
      if (!media) return;
      if (e.relatedTarget && media.contains(e.relatedTarget)) return;  // still inside the card
      const v = media.querySelector('.product-card__vid');
      if (v && !v.paused) v.pause();
    };
    document.addEventListener('mouseover', hoverIn);
    document.addEventListener('mouseout', hoverOut);
  }

 /* ================= WISHLIST / FAVOURITES ================= */
 function renderWishlist() {
 const grid = $('#wishlistGrid');
 if (!grid) return;
 const empty = $('#wishlistEmpty');
 let handles = [];
 try { handles = JSON.parse(localStorage.getItem('yza_wishlist')) || []; } catch (e) {}
 const prods = handles.map((h) => (YZA.getProduct ? YZA.getProduct(h) : null)).filter(Boolean);
 if (!prods.length) {
 grid.innerHTML = '';
 grid.hidden = true;
 if (empty) empty.hidden = false;
 return;
 }
 grid.hidden = false;
 if (empty) empty.hidden = true;
 grid.innerHTML = prods.map((p, i) => cardHTML(p, i, i < 4, { tile: true })).join('');
 if (document.documentElement.classList.contains('js')) requestAnimationFrame(wireReveal);
 }

 /* ================= ROUTER ================= */
 function renderPage() {
 renderServiceStrips();
 renderHome();
 renderGirlsPreview();
 initBandVideos();
 renderGirlsPage();
 renderCollections();
 renderProduct();
 renderWishlist();
 YZA.modelStories?.renderPage();
 }
 function activeNav() {
 const page = document.body.dataset.page;
 if (page === 'collections') {
 const cat = params.get('cat') || 'all';
 if (cat === 'bestsellers') return 'nav.bestSellers';
 if (cat === 'bags') return 'nav.bags';
 if (cat === 'rtw' || cat === 'tops' || cat === 'pareos' || cat === 'pants' || cat === 'bottoms') return 'nav.rtw';
 if (cat === 'charms') return 'nav.charms';
 if (cat === 'accessories' || cat === 'earrings') return 'nav.accessories';
 }
 return ({
 histoire: 'nav.story',
 girls: 'nav.girls',
 b2b: 'nav.b2b',
 lookbook: 'nav.lookbook',
 journal: 'nav.journal',
 studio: 'nav.studio',
 faq: 'nav.faq',
 contact: 'nav.contact',
 })[page] || '';
 }

 document.addEventListener('DOMContentLoaded', () => {
 document.documentElement.classList.add('js');
 YZA.i18n.lang = YZA.i18n.detect();
 YZA.chrome.mount(activeNav());
 initHomeVideoHero();
 initFooterWidgetGuard();
 renderPage();
 YZA.cart.init();
 wireCollections();
 YZA.i18n.init();
 YZA.i18n.onChange(() => { renderPage(); YZA.cart.refresh(); requestAnimationFrame(remeasureOpenAccordions); });
 let inventoryPaint = 0;
 const refreshInventoryUI = () => {
  if (inventoryPaint) cancelAnimationFrame(inventoryPaint);
  inventoryPaint = requestAnimationFrame(() => {
   inventoryPaint = 0;
   renderPage();
   YZA.cart?.load?.();
   YZA.cart?.refresh?.();
  });
 };
 document.addEventListener('yza:inventorychange', refreshInventoryUI);
 if (YZA.inventoryReady && typeof YZA.inventoryReady.then === 'function') {
  YZA.inventoryReady.then(() => { if (YZA.inventorySnapshotReady?.()) refreshInventoryUI(); });
 }
 document.addEventListener('yza:currencychange', () => {
  renderPage();
  YZA.cart?.refresh?.();
  requestAnimationFrame(remeasureOpenAccordions);
 });
    wireAccordion();
    wireReveal();
    wireForms();
    wireProductCards();
    document.querySelectorAll('.girls-home-grid, .girls-feed, [data-scroll-row]')
 .forEach((el) => { if (!el.classList.contains('model-gallery-host')) enableDragScroll(el); });
 });
})();

/* Jacquemus-minimal video-band player controls (play/pause · seek · mute · fullscreen) */
(function () {
  function wireBand(bar) {
    var section = bar.closest('.video-band');
    var video = section && section.querySelector('video');
    if (!video) return;
    var playBtn = bar.querySelector('[data-vb-play]');
    var muteBtn = bar.querySelector('[data-vb-mute]');
    var fsBtn = bar.querySelector('[data-vb-fullscreen]');
    var seek = bar.querySelector('[data-vb-seek]');

    function syncPlay() {
      var paused = video.paused;
      if (!playBtn) return;
      playBtn.classList.toggle('is-paused', paused);
      playBtn.setAttribute('aria-label', paused ? 'Lecture' : 'Pause');
      playBtn.setAttribute('aria-pressed', String(!paused));
    }
    function syncMute() {
      var on = !video.muted && video.volume > 0;
      if (!muteBtn) return;
      muteBtn.classList.toggle('is-on', on);
      muteBtn.setAttribute('aria-label', on ? 'Couper le son' : 'Activer le son');
      muteBtn.setAttribute('aria-pressed', String(on));
    }
    function syncProgress() {
      if (!seek) return;
      var d = video.duration;
      if (d && isFinite(d)) {
        var pct = Math.min(100, Math.max(0, (video.currentTime / d) * 100));
        seek.value = String(pct);
        bar.style.setProperty('--vb-pct', pct.toFixed(2) + '%');
      }
    }

    if (playBtn) playBtn.addEventListener('click', function () {
      if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      else { video.pause(); }
    });
    if (muteBtn) muteBtn.addEventListener('click', function () {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) video.volume = 1;
      syncMute();
    });
    if (fsBtn) fsBtn.addEventListener('click', function () {
      try {
        if (document.fullscreenElement) { document.exitFullscreen(); }
        else if (section.requestFullscreen) { section.requestFullscreen(); }
        else if (video.webkitEnterFullscreen) { video.webkitEnterFullscreen(); }
      } catch (e) {}
    });
    if (seek) seek.addEventListener('input', function () {
      var d = video.duration;
      if (d && isFinite(d)) { video.currentTime = (parseFloat(seek.value) / 100) * d; syncProgress(); }
    });

    video.addEventListener('play', syncPlay);
    video.addEventListener('pause', syncPlay);
    video.addEventListener('volumechange', syncMute);
    video.addEventListener('timeupdate', syncProgress);
    video.addEventListener('loadedmetadata', syncProgress);
    try { if (video.preload === 'none') video.preload = 'metadata'; } catch (e) {}
    syncPlay(); syncMute(); syncProgress();
  }
  function init() {
    var bars = document.querySelectorAll('[data-vb-controls]');
    for (var i = 0; i < bars.length; i++) wireBand(bars[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// Fruit-Market: visitor-controlled crossfades; no autonomous rotation.
(function () {
  function wireRotator(tile) {
    var slides = tile.querySelectorAll('.fm-slide');
    if (slides.length < 2) return;
    var idx = 0;
    var down = false, dragging = false, didDrag = false, sx = 0, sy = 0;

    function show(n) {
      slides.forEach(function (s, i) {
        var active = i === n;
        s.classList.toggle('is-active', active);
        s.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
    }
    function go(n) { idx = (n % slides.length + slides.length) % slides.length; show(idx); }
    // Drag / swipe to change slide — mouse on desktop, finger on mobile.
    function pt(e) { return e.changedTouches ? e.changedTouches[0] : (e.touches ? e.touches[0] : e); }
    function dStart(e) { var p = pt(e); down = true; dragging = false; didDrag = false; sx = p.clientX; sy = p.clientY; }
    function dMove(e) { if (!down) return; var p = pt(e); if (Math.abs(p.clientX - sx) > 8 && Math.abs(p.clientX - sx) > Math.abs(p.clientY - sy)) dragging = true; }
    function dEnd(e) {
      if (!down) return; down = false;
      var p = pt(e), dx = p.clientX - sx, dy = p.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { didDrag = true; go(idx + (dx < 0 ? 1 : -1)); }
      dragging = false;
    }
    tile.addEventListener('dragstart', function (e) { e.preventDefault(); });
    tile.addEventListener('click', function (e) { if (didDrag) { e.preventDefault(); e.stopPropagation(); didDrag = false; } }, true);
    tile.addEventListener('touchstart', dStart, { passive: true });
    tile.addEventListener('touchmove', dMove, { passive: true });
    tile.addEventListener('touchend', dEnd);
    tile.addEventListener('mousedown', dStart);
    window.addEventListener('mousemove', dMove);
    window.addEventListener('mouseup', dEnd);

    show(0);
  }
  function init() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    var tiles = document.querySelectorAll('[data-fm-rotator]');
    for (var i = 0; i < tiles.length; i++) wireRotator(tiles[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


/* APERCU TACTILE DES CARTES PRODUIT (cliente 2026-08-05).
   AVANT : sur mobile, chaque carte a l'ecran alternait toute seule photo produit <->
   photo portee toutes les 2,6 s (setInterval pilote par un IntersectionObserver). La
   cliente n'en voulait pas : ca bougeait sans qu'on ait rien demande, et pendant un
   defilement toute la grille clignotait.
   MAINTENANT : le doigt pose sur la carte revele la photo portee, le doigt leve la
   retire. C'est le pendant tactile exact du :hover de l'ordinateur, et il n'y a plus
   aucune minuterie dans ce fichier.
   Le point delicat est de distinguer l'APPUI du DEFILEMENT : sans ca, poser le doigt
   pour faire defiler rallumerait les photos portees au passage, c'est-a-dire tres
   exactement le clignotement qu'on vient de supprimer. */
(function () {
  var wired = new WeakSet();
  var MOVE_CANCEL = 10;      // px de tolerance : au-dela, c'est un defilement
  var releaseActive = null;  // apercu en cours, pour pouvoir le couper globalement
  var touchMode = window.matchMedia && window.matchMedia('(hover: none)').matches;
  /* Plus de garde `prefers-reduced-motion` : elle n'existait qu'a cause de l'animation
     AUTOMATIQUE. Un apercu declenche par la visiteuse elle-meme n'est pas du mouvement
     subi, et le fondu est de toute facon deja neutralise en CSS sous ce reglage. */
  if (!touchMode) return;    // au pointeur, c'est :hover en CSS qui fait le travail

  function wire(card) {
    if (!card || wired.has(card)) return;
    if (!card.querySelector('.product-card__img--hover, .product-card__vid')) return;
    wired.add(card);
    var visible = false;

    function setAlt(on) {
      visible = !!on;
      card.classList.toggle('is-touch-preview', visible);
      /* DEFAUT SIGNALE PAR LA CLIENTE (28/07) : sur mobile, les cartes M Noir et
         M Violet de La Sculpture ne montraient rien. La bascule ci-dessus rend bien la
         video visible (opacity:1 via .is-touch-preview), mais son `src` n'etait JAMAIS
         renseigne et play() n'etait JAMAIS appele : le src est pose paresseusement dans
         hoverIn(), qui depend de `mouseover` — un evenement qui n'existe pas sur un
         ecran tactile. On revelait donc une video VIDE par-dessus la photo produit, ce
         qui se voit exactement comme "il ne se passe rien".
         On charge et on lance donc ici, cote tactile, ce que le survol fait cote
         pointeur. Le chargement paresseux est meilleur qu'avant : la video ne part au
         reseau qu'au moment ou un doigt se pose sur CETTE carte. Auparavant il suffisait
         que la carte defile a l'ecran pour que la minuterie la reclame. */
      var v = card.querySelector('.product-card__vid');
      if (!v) return;
      try {
        if (visible) {
          if (!v.getAttribute('src') && v.dataset.hoverVideo) v.setAttribute('src', v.dataset.hoverVideo);
          v.muted = true;               // condition sine qua non de l'autoplay mobile
          playWhenReady(v);
        } else if (!v.paused) {
          v.pause();
        }
      } catch (err) {}
    }

    /* CES DEUX ETAPES SONT NECESSAIRES — mesure faite dans le navigateur, pas deduite.
       Les deux ordres « evidents » echouent, chacun en silence :
       1. `src` puis play() immediat  -> AbortError (« play() interrupted ») : le
          chargement vient d'etre relance, currentTime reste a 0, rien ne demarre.
       2. `src` puis attendre canplay -> INTERBLOCAGE : la balise porte preload="none",
          donc poser src ne charge RIEN. canplay ne se declenche jamais et on attend
          indefiniment.
       Ce qui marche : appeler play() D'ABORD (c'est lui qui declenche le chargement
       malgre preload="none"), puis, si la promesse est rejetee, retenter une seule fois
       quand la video devient lisible. Verifie : les deux videos passent en readyState 4
       et avancent, et le chemin de RETENTE est bien celui qui aboutit — ce n'est pas
       une precaution decorative, c'est lui qui fait jouer la video.
       Le garde `visible` evite de lancer une lecture apres que la carte est deja
       revenue sur la photo produit. */
    function playWhenReady(v) {
      if (!visible) return;
      var pr = v.play();
      if (!pr || !pr.catch) return;
      pr.catch(function () {
        if (!visible) return;
        v.addEventListener('canplay', function () {
          if (!visible) return;
          var p2 = v.play();
          if (p2 && p2.catch) p2.catch(function () {});   // autoplay refuse : on n'insiste pas
        }, { once: true });
      });
    }
    var startX = 0, startY = 0, pressing = false, previewTimer = 0;

    function release() {
      clearTimeout(previewTimer);
      pressing = false;
      releaseActive = null;
      setAlt(false);
    }

    /* Tous les ecouteurs restent `passive: true` : on ne bloque JAMAIS le defilement.
       L'apercu est purement visuel, la carte reste un lien — un appui bref revele la
       photo portee puis ouvre la fiche, comme un survol suivi d'un clic. */
    card.addEventListener('touchstart', function (e) {
      var t = e.touches && e.touches[0];
      startX = t ? t.clientX : 0;
      startY = t ? t.clientY : 0;
      pressing = true;
      releaseActive = release;
      previewTimer = setTimeout(() => { if (pressing) setAlt(true); }, YZA.motion.duration('hover'));
    }, { passive: true });

    card.addEventListener('touchmove', function (e) {
      if (!pressing) return;
      var t = e.touches && e.touches[0];
      if (!t) return;
      if (Math.abs(t.clientX - startX) > MOVE_CANCEL || Math.abs(t.clientY - startY) > MOVE_CANCEL) {
        release();   // le doigt file : c'est un defilement, on rend la photo produit
      }
    }, { passive: true });

    card.addEventListener('touchend', release, { passive: true });
    card.addEventListener('touchcancel', release, { passive: true });
  }

  function scan() {
    document.querySelectorAll('.product-card').forEach(wire);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  /* Un seul ecouteur pour toute la page, pas un par carte : quitter l'onglet le doigt
     encore pose ne declenche aucun touchend, et l'apercu resterait fige au retour. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (releaseActive) releaseActive(); }
    else scan();
  });
})();
