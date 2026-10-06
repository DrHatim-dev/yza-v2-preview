/* Checkout ZIP 13 presentation and recommendation logic. Prices remain owned by cart.js. */
(function () {
  'use strict';
  const Y = window.YZA = window.YZA || {};
  const copy = {
    fr: { back:'Retour à la boutique', help:'Une question ?', cartTitle:'Votre panier', cartIntro:'Éditions limitées : tant que c’est dans le panier, ce n’est pas réservé.', shipIntro:'Expédition suivie depuis Marrakech. Vos coordonnées nous permettent de préparer la livraison.', payIntro:'Choisissez votre mode de paiement. Aucun compte à créer.', edit:'Modifier', show:'Voir le récapitulatif', hide:'Masquer le récapitulatif', suggestLead:'Tant qu’on prépare le colis, il reste de la place.', choose:'Choisir ma taille', add:'Ajouter', added:'Ajouté', intl:'Frais de livraison à confirmer avec vous pour cette destination.', tracked:'Livraison suivie', morocco:'Maroc · suivi, 2–5 jours', pickup:'Vous êtes à Marrakech ? Le retrait au studio est possible à Guéliz, 66 rue Yougoslavie. Contactez-nous avant de commander pour l’organiser.', pickupLink:'Organiser un retrait', giftEdit:'Modifier le cadeau', unavailable:'Cette pièce n’est plus disponible dans cette quantité.', note:'Note cadeau', addon:'Envie d’un fruit en plus ? Demandez un ajout au colis sur WhatsApp, avant son expédition.', phoneError:'Indiquez un numéro de téléphone valide (9 à 15 chiffres).', summary:'Récapitulatif', total:'Total', cod:'Maroc', card:'Carte', transfer:'Virement', thanks:'Votre commande', unknownEmail:'Vous pouvez retrouver les détails de votre commande ci-dessous.' },
    en: { back:'Back to the shop', help:'A question?', cartTitle:'Your bag', cartIntro:'Limited editions: items in your bag are not reserved yet.', shipIntro:'Tracked delivery from Marrakech. Your details help us prepare your delivery.', payIntro:'Choose how to pay. No account needed.', edit:'Edit', show:'Show order summary', hide:'Hide order summary', suggestLead:'While we prepare your parcel, there is room for a little more.', choose:'Choose my size', add:'Add', added:'Added', intl:'Shipping costs for this destination will be confirmed with you.', tracked:'Tracked delivery', morocco:'Morocco · tracked, 2–5 days', pickup:'In Marrakech? Studio pickup is available at 66 rue Yougoslavie, Guéliz. Contact us before ordering to arrange it.', pickupLink:'Arrange studio pickup', giftEdit:'Edit gift option', unavailable:'This quantity is no longer available.', note:'Gift note', addon:'One more fruit? Request an addition to your parcel on WhatsApp before dispatch.', phoneError:'Enter a valid phone number (9–15 digits).', summary:'Order summary', total:'Total', cod:'Morocco', card:'Card', transfer:'Transfer', thanks:'Your order', unknownEmail:'You can find your order details below.' },
    es: { back:'Volver a la tienda', help:'¿Una pregunta?', cartTitle:'Tu cesta', cartIntro:'Ediciones limitadas: las piezas de la cesta aún no están reservadas.', shipIntro:'Envío con seguimiento desde Marrakech. Tus datos nos ayudan a preparar la entrega.', payIntro:'Elige cómo pagar. No necesitas una cuenta.', edit:'Modificar', show:'Ver resumen del pedido', hide:'Ocultar resumen', suggestLead:'Mientras preparamos tu paquete, aún queda sitio.', choose:'Elegir mi talla', add:'Añadir', added:'Añadido', intl:'Confirmaremos contigo el coste de envío a este destino.', tracked:'Envío con seguimiento', morocco:'Marruecos · seguimiento, 2–5 días', pickup:'¿Estás en Marrakech? Puedes recoger en el estudio: 66 rue Yougoslavie, Guéliz. Contáctanos antes de comprar para organizarlo.', pickupLink:'Organizar la recogida', giftEdit:'Modificar regalo', unavailable:'Esta cantidad ya no está disponible.', note:'Nota de regalo', addon:'¿Una fruta más? Solicita añadirla a tu paquete por WhatsApp antes del envío.', phoneError:'Introduce un teléfono válido (9–15 dígitos).', summary:'Resumen del pedido', total:'Total', cod:'Marruecos', card:'Tarjeta', transfer:'Transferencia', thanks:'Tu pedido', unknownEmail:'Los detalles de tu pedido aparecen a continuación.' },
    tr: { back:'Mağazaya dön', help:'Bir sorunuz mu var?', cartTitle:'Sepetiniz', cartIntro:'Sınırlı üretim: sepetteki ürünler henüz rezerve edilmez.', shipIntro:'Marakeş’ten takipli teslimat. Bilgileriniz teslimatı hazırlamamıza yardımcı olur.', payIntro:'Ödeme yönteminizi seçin. Hesap gerekmez.', edit:'Düzenle', show:'Sipariş özetini göster', hide:'Sipariş özetini gizle', suggestLead:'Paketinizi hazırlarken bir parça daha ekleyebilirsiniz.', choose:'Bedenimi seç', add:'Ekle', added:'Eklendi', intl:'Bu varış noktası için kargo ücreti sizinle onaylanacaktır.', tracked:'Takipli teslimat', morocco:'Fas · takipli, 2–5 gün', pickup:'Marakeş’te misiniz? 66 rue Yougoslavie, Guéliz stüdyosundan teslim alabilirsiniz. Siparişten önce bizimle görüşün.', pickupLink:'Stüdyodan teslim al', giftEdit:'Hediyeyi düzenle', unavailable:'Bu miktar artık mevcut değil.', note:'Hediye notu', addon:'Bir meyve daha? Gönderimden önce WhatsApp üzerinden paketinize eklenmesini isteyin.', phoneError:'Geçerli bir telefon numarası girin (9–15 rakam).', summary:'Sipariş özeti', total:'Toplam', cod:'Fas', card:'Kart', transfer:'Havale', thanks:'Siparişiniz', unknownEmail:'Sipariş ayrıntılarınız aşağıdadır.' },
    ar: { back:'العودة إلى المتجر', help:'لديك سؤال؟', cartTitle:'سلتك', cartIntro:'إصدارات محدودة: القطع في السلة ليست محجوزة بعد.', shipIntro:'توصيل مع تتبع من مراكش. تساعدنا بياناتك على تجهيز التسليم.', payIntro:'اختاري طريقة الدفع. لا حاجة لإنشاء حساب.', edit:'تعديل', show:'عرض ملخص الطلب', hide:'إخفاء ملخص الطلب', suggestLead:'بينما نجهز طلبك، ما زال هناك مكان لقطعة أخرى.', choose:'اختيار مقاسي', add:'إضافة', added:'تمت الإضافة', intl:'سنؤكد معك تكلفة التوصيل إلى هذه الوجهة.', tracked:'توصيل مع تتبع', morocco:'المغرب · تتبع، 2–5 أيام', pickup:'هل أنت في مراكش؟ يمكن الاستلام من الاستوديو في 66 شارع يوغوسلافيا، كيليز. تواصلي معنا قبل الطلب لترتيبه.', pickupLink:'ترتيب الاستلام', giftEdit:'تعديل الهدية', unavailable:'هذه الكمية لم تعد متوفرة.', note:'رسالة الهدية', addon:'فاكهة أخرى؟ اطلبي إضافتها إلى طلبك عبر واتساب قبل الشحن.', phoneError:'أدخلي رقم هاتف صالحاً (9–15 رقماً).', summary:'ملخص الطلب', total:'المجموع', cod:'المغرب', card:'بطاقة', transfer:'تحويل', thanks:'طلبك', unknownEmail:'تفاصيل طلبك مذكورة أدناه.' }
  };
  copy.fr.couponEmail = 'Saisissez votre e-mail ci-dessus, puis appliquez votre code.';
  copy.en.couponEmail = 'Enter your email above, then apply your code.';
  copy.es.couponEmail = 'Introduce tu correo arriba y aplica tu código.';
  copy.tr.couponEmail = 'Yukarıya e-posta adresinizi girip kodunuzu uygulayın.';
  copy.ar.couponEmail = 'أدخلي بريدك الإلكتروني أعلاه ثم طبّقي الرمز.';
  const paymentKeys = ['payContact','payAddress','payMethod','payCard','payCardNote','payCodDetail','payInstant','payInternational','payCopyError'];
  const paymentCopy = {
    fr:['Contact','Livrer à','Méthode','Payer par carte','Paiement sécurisé par Zazu. Vous saisissez vos coordonnées bancaires sur la page de paiement, puis revenez ici.','Vous réglez à la réception. Nous vous contactons pour confirmer la commande et organiser la livraison.','Instantané','International','Copie indisponible — sélectionnez le numéro.'],
    en:['Contact','Deliver to','Method','Pay by card','Secure payment through Zazu. Enter your card details on the payment page, then return here.','Pay on receipt. We will contact you to confirm the order and arrange delivery.','Instant','International','Copy unavailable — select the number.'],
    es:['Contacto','Enviar a','Método','Pagar con tarjeta','Pago seguro con Zazu. Introduce los datos de tu tarjeta en la página de pago y vuelve aquí.','Paga al recibir el pedido. Te contactaremos para confirmar el pedido y organizar la entrega.','Instantáneo','Internacional','No se pudo copiar — selecciona el número.'],
    tr:['İletişim','Teslimat adresi','Yöntem','Kartla öde','Zazu ile güvenli ödeme. Kart bilgilerinizi ödeme sayfasına girin, ardından buraya dönün.','Teslim alırken ödeyin. Siparişi onaylamak ve teslimatı düzenlemek için sizinle iletişime geçeriz.','Anında','Uluslararası','Kopyalanamadı — numarayı seçin.'],
    ar:['التواصل','التوصيل إلى','الطريقة','الدفع بالبطاقة','دفع آمن عبر Zazu. أدخل بيانات بطاقتك في صفحة الدفع ثم عد إلى هنا.','ادفع عند الاستلام. نتواصل معك لتأكيد الطلب وترتيب التوصيل.','فوري','دولي','تعذّر النسخ — حدّد الرقم.']
  };
  Object.keys(paymentCopy).forEach(lang => paymentKeys.forEach((key,i) => { copy[lang][key] = paymentCopy[lang][i]; }));
  const addonErrors = {fr:'La demande n’a pas abouti. Réessayez.',en:'The request did not go through. Try again.',es:'No se pudo enviar la solicitud. Inténtalo de nuevo.',tr:'İstek gönderilemedi. Tekrar deneyin.',ar:'لم يتم إرسال الطلب. حاول مجددًا.'};
  Object.keys(addonErrors).forEach(lang => { copy[lang].addonError = addonErrors[lang]; });
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = (key, values = {}) => (copy[Y.i18n?.lang] || copy.fr)[key].replace(/\{(\w+)\}/g, (_, k) => values[k] == null ? '' : values[k]);
  const price = cents => Y.i18n.formatPrice(cents);
  function previewAddition(product, region, cart = Y.cart) {
    // All derived calculations run against a shadow cart. No save, events or real adds.
    const trial = Object.create(cart);
    trial.items = cart.items.concat({handle:product.handle, qty:1});
    return { quote:trial.shippingQuote(region), total:trial.orderTotals(region) };
  }
  // Delivery is never free (2026-10-05): no threshold to bridge, so the block only offers
  // two pieces that complete the order. The delivery fee itself lives in the summary.
  function bridgeModel(region, cart = Y.cart) {
    const quote = cart.shippingQuote(region);
    if (!cart.items.length || quote.quoteOnly) return {quote, picks:[]};
    const pool = Y.cartSuggestions(cart.items, {limit:100, categories:['accessories','rtw','bags']}).filter(p => p.price > 0).map(product => ({product, ...previewAddition(product, region, cart)}));
    return {quote, picks:pool.slice(0,2)};
  }
  function bridgeHTML(region) {
    if (!Y.cart.items.length) return '';
    const m = bridgeModel(region), q=m.quote;
    if (q.quoteOnly) return `<section class="co-bridge co-bridge--quote"><p>${esc(text('intl'))}</p></section>`;
    const cards = m.picks.map(({product:p}) => {
      const slug=p.defaultColorSlug || '', view=slug && Y.resolveProductColorView ? Y.resolveProductColorView(p,slug) : p;
      const href='/produits/'+encodeURIComponent(p.handle)+(slug?'?color='+encodeURIComponent(slug):'');
      const choose=(p.availableSizes || []).length>1;
      const name=Y.i18n.pick(p.displayName || p.name);
      return `<article class="co-bridge__card"><a class="co-bridge__image" href="${esc(href)}"><img src="${esc(view.img)}" alt="${esc(name)}" width="56" height="72" loading="lazy"></a><div class="co-bridge__info"><a href="${esc(href)}">${esc(name)}</a><span>${price(p.price)}</span></div>${choose?`<a class="co-bridge__choose" href="${esc(href)}">${esc(text('choose'))}</a>`:`<button type="button" data-upsell-add="${esc(p.handle)}" aria-label="${esc(text('add')+' '+name)}">+</button>`}</article>`;
    }).join('');
    if (!cards) return '';
    return `<section class="co-bridge" aria-label="${esc(text('suggestLead'))}"><div class="co-bridge__suggestions"><p>${esc(text('suggestLead'))}</p><div class="co-bridge__grid">${cards}</div></div></section>`;
  }
  function giftHTML() {
    return `<div class="co-gift"><label><input type="checkbox" data-co-gift ${Y.cart.gift.enabled?'checked':''} aria-controls="coGiftNote"><span>${esc(Y.cart.copy('gift'))}</span><small>${esc(Y.cart.copy('free'))}</small></label><div id="coGiftNote" ${Y.cart.gift.enabled?'':'hidden'}><label for="coGiftMessage">${esc(Y.cart.copy('message'))}</label><textarea id="coGiftMessage" data-co-gift-note maxlength="200" rows="2">${esc(Y.cart.gift.message)}</textarea></div></div>`;
  }
  Y.checkoutMaison = {text,esc,bridgeModel,previewAddition,bridgeHTML,giftHTML};
}());
