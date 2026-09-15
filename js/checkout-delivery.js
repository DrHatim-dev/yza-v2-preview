/* ZIP 16 delivery presentation and device-only, opt-in address memory. */
(function () {
  'use strict';
  const Y = window.YZA = window.YZA || {};
  const copy = {
    fr: ['Comment vous joindre','Où l’envoyer','Un cadeau, une précision','Nous vous contactons pour confirmer la commande et organiser la livraison.','Livraison à domicile','Retrait au studio','Gratuit','66 rue Yougoslavie, Guéliz · Marrakech','Retrait à convenir avec le studio après confirmation de votre commande.','Les champs marqués · sont nécessaires. Aucun compte à créer.','Garder mes coordonnées sur cet appareil','À utiliser sur un appareil personnel. Décochez pour effacer les coordonnées enregistrées.','Continuer vers le paiement','Votre retrait au studio','Téléphone (WhatsApp)','Votre numéro : ','Paiement au retrait','Réglez lors du retrait au studio.','Livraison suivie depuis Marrakech. Le délai est confirmé avec vous selon la destination.','Vérifiez le numéro : 10 chiffres au Maroc, ou le format international.'],
    en: ['How to reach you','Where to send it','A gift, a special request','We will contact you to confirm your order and arrange delivery.','Home delivery','Studio pickup','Free','66 rue Yougoslavie, Guéliz · Marrakech','Arrange pickup with the studio after your order is confirmed.','Fields marked · are required. No account needed.','Remember my details on this device','Use a personal device. Uncheck to delete saved details.','Continue to payment','Your studio pickup','Phone (WhatsApp)','Your number: ','Pay at pickup','Pay when collecting your order at the studio.','Tracked delivery from Marrakech. We confirm the delivery window for your destination.','Check the number: 10 digits in Morocco, or an international number.'],
    es: ['Cómo contactarte','Dónde enviarlo','Un regalo, una petición','Te contactaremos para confirmar el pedido y organizar la entrega.','Entrega a domicilio','Recogida en el estudio','Gratis','66 rue Yougoslavie, Guéliz · Marrakech','Acuerda la recogida con el estudio tras confirmar tu pedido.','Los campos marcados · son obligatorios. Sin crear una cuenta.','Recordar mis datos en este dispositivo','Usa un dispositivo personal. Desmarca para borrar los datos guardados.','Continuar al pago','Tu recogida en el estudio','Teléfono (WhatsApp)','Tu número: ','Pagar al recoger','Paga al recoger tu pedido en el estudio.','Envío con seguimiento desde Marrakech. Confirmamos el plazo según el destino.','Comprueba el número: 10 dígitos en Marruecos o formato internacional.'],
    tr: ['Size nasıl ulaşalım','Nereye gönderelim','Bir hediye, bir not','Siparişinizi onaylamak ve teslimatı düzenlemek için sizinle iletişime geçeriz.','Adrese teslim','Stüdyodan teslim alma','Ücretsiz','66 rue Yougoslavie, Guéliz · Marakeş','Sipariş onayından sonra stüdyoyla teslim alma zamanını belirleyin.','· ile işaretli alanlar zorunludur. Hesap gerekmez.','Bilgilerimi bu cihazda hatırla','Kişisel cihaz kullanın. Kaydedilen bilgileri silmek için işareti kaldırın.','Ödemeye devam et','Stüdyodan teslim alma','Telefon (WhatsApp)','Numaranız: ','Teslim alırken öde','Siparişinizi stüdyodan alırken ödeyin.','Marakeş’ten takipli gönderim. Teslimat süresini adresinize göre onaylarız.','Numarayı kontrol edin: Fas için 10 hane veya uluslararası format.'],
    ar: ['كيف نتواصل معك','إلى أين نرسلها','هدية أو ملاحظة','نتواصل معك لتأكيد الطلب وترتيب التوصيل.','التوصيل إلى المنزل','الاستلام من الأتيليه','مجاني','66 شارع يوغوسلافيا، كليز · مراكش','يُحدّد موعد الاستلام مع الأتيليه بعد تأكيد الطلب.','الحقول المعلّمة بـ · مطلوبة. لا حاجة لإنشاء حساب.','حفظ بياناتي على هذا الجهاز','استخدم جهازًا شخصيًا. أزل العلامة لحذف البيانات المحفوظة.','المتابعة إلى الدفع','الاستلام من الأتيليه','الهاتف (واتساب)','رقمك: ','الدفع عند الاستلام من الأتيليه','ادفع عند استلام طلبك من الأتيليه.','شحن متتبّع من مراكش. نؤكد المدة معك حسب الوجهة.','تحقق من الرقم: 10 أرقام في المغرب أو الصيغة الدولية.']
  };
  const key = 'yza.checkout.remembered';
  const fields = ['name','phone','email','address','city','zip','country'];
  function text(index) { return (copy[Y.i18n?.lang] || copy.fr)[index]; }
  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (!saved || !saved.expires || saved.expires < Date.now()) { localStorage.removeItem(key); return null; }
      return Object.fromEntries(fields.map(k => [k, typeof saved[k] === 'string' ? saved[k].slice(0,254) : '']));
    } catch (_) { return null; }
  }
  function remember(ship, enabled) {
    try {
      if (!enabled) { localStorage.removeItem(key); return; }
      const saved = Object.fromEntries(fields.map(k => [k,String(ship[k] || '').slice(0,254)]));
      saved.expires = Date.now() + 30 * 86400000;
      localStorage.setItem(key, JSON.stringify(saved));
    } catch (_) {}
  }
  function phone(value, country) {
    const raw = String(value || '').trim();
    if (!raw) return {valid:false, formatted:''};
    const digits = raw.replace(/\D/g,'');
    if (!/^[+\d\s().-]+$/.test(raw)) return {valid:false,formatted:''};
    const ma = /^(?:\+212|00212)/.test(raw) || (country === 'MA' && !/^(?:\+|00)/.test(raw));
    if (ma) {
      const n = digits.replace(/^(?:00212|212|0)/,'');
      const valid = /^(?:\+212|00212|0)/.test(raw) && /^[5-7]\d{8}$/.test(n);
      return {valid, formatted:valid ? '+212 ' + n[0] + ' ' + n.slice(1).match(/.{2}/g).join(' ') : ''};
    }
    return {valid:/^\d{9,15}$/.test(digits),formatted:''};
  }
  function totals(cart, region, pickup) {
    const t = cart.orderTotals(region);
    return pickup ? {...t, shippingCents:0, shippingFree:true, shippingQuoteOnly:false, grandTotalCents:t.merchandiseCents, region:'morocco'} : t;
  }
  Y.checkoutDelivery = {text, read, remember, phone, totals};
}());
