/* The atelier chat presentation. Existing lead capture and WhatsApp handlers remain in chrome.js. */
(function () {
  'use strict';
  const Y = window.YZA = window.YZA || {};
  const icon = '/yza-v2-preview/assets/brand/icons/chat-arrow.svg';
  const copy = {
    fr: {
      title: 'L’atelier', open: 'Studio ouvert · Guéliz', closed: 'Studio fermé · Guéliz',
      greeting: 'Bonjour — bienvenue à l’atelier de Guéliz. Dites-nous ce qu’il vous faut, ou prenez un raccourci ci-dessous.',
      guide: 'Guide YZA', you: 'Vous', placeholder: 'Écrivez votre question', whatsapp: 'Continuer sur WhatsApp', visit: 'Venir au studio', studio: 'Découvrir le studio', other: 'Autre question',
      ack: 'Merci ! Laissez votre prénom et votre WhatsApp pour transmettre votre question à l’atelier.',
      topics: ['Quelle taille je prends ?', 'C’est encore disponible ?', 'C’est pour offrir', 'Livraison et délais', 'Retours et réparations', 'Commander en gros'],
      answers: ['La coupe et les dimensions figurent sur chaque fiche produit. Le prêt-à-porter Jawhara est en taille libre, du XS au XXL. Pour un conseil sur une pièce, écrivez-nous ou venez l’essayer au studio.', 'Les disponibilités et les coloris sont indiqués sur la fiche de chaque pièce. Pour une couleur épuisée ou une commande spéciale, contactez l’atelier : nous confirmerons les possibilités et le délai.', 'L’emballage cadeau et un mot écrit à la main sont offerts. Vous pouvez les demander dans le panier ou lors de la commande.', 'La livraison au Maroc coûte 50 DH. Elle est offerte dès 500 DH pour les accessoires, ou 1 500 DH pour les sacs et le prêt-à-porter. Retrait gratuit au studio de Guéliz. Les frais internationaux se calculent au paiement ; les délais sont confirmés selon la destination.', 'Vous disposez de 30 jours pour changer d’avis, pour une pièce non portée et dans son état d’origine. Les pièces YZA se réparent à vie à l’atelier de Guéliz. Contactez-nous pour organiser un retour ou une réparation.', 'La sélection grossiste commence à 10 pièces. Composez votre sélection sur la page grossistes ; l’atelier vous confirme le devis, les disponibilités et les délais.'],
      links: ['Voir le prêt-à-porter', 'Voir les best sellers', 'Découvrir les charms', 'Livraison & retours', 'Nos garanties', 'Page grossistes']
    },
    en: {
      title: 'The atelier', open: 'Studio open · Guéliz', closed: 'Studio closed · Guéliz', greeting: 'Hello — welcome to our Guéliz atelier. Tell us what you need, or choose a question below.', guide: 'YZA guide', you: 'You', placeholder: 'Write your question', whatsapp: 'Continue on WhatsApp', visit: 'Visit the studio', studio: 'Discover the studio', other: 'Another question', ack: 'Thank you! Leave your first name and WhatsApp so we can pass your question to the atelier.',
      topics: ['Which size should I choose?', 'Is it still available?', 'It’s a gift', 'Delivery and timing', 'Returns and repairs', 'Wholesale orders'],
      answers: ['Each product page includes its fit and measurements. Jawhara clothing is size-free, from XS to XXL. For advice about a particular piece, message us or try it at the studio.', 'Available pieces and colours are shown on each product page. For a sold-out colour or special order, contact the atelier to confirm options and timing.', 'Gift wrapping and a handwritten note are complimentary. Request them in your cart or during checkout.', 'Delivery within Morocco is 50 DH, free from 500 DH for accessories or 1,500 DH for bags and clothing. Studio pickup in Guéliz is free. International fees are calculated at checkout; timing is confirmed for your destination.', 'You have 30 days to return an unworn piece in its original condition. YZA pieces can be repaired for life at the Guéliz atelier. Contact us to arrange a return or repair.', 'Wholesale selections start at 10 pieces. Build your selection on the wholesale page; the atelier will confirm your quote, availability and timing.'],
      links: ['Shop clothing', 'Shop best sellers', 'Discover charms', 'Delivery & returns', 'Our guarantees', 'Wholesale page']
    },
    es: {
      title: 'El atelier', open: 'Estudio abierto · Guéliz', closed: 'Estudio cerrado · Guéliz', greeting: 'Hola — bienvenida al atelier de Guéliz. Cuéntanos qué necesitas o elige una pregunta.', guide: 'Guía YZA', you: 'Tú', placeholder: 'Escribe tu pregunta', whatsapp: 'Continuar por WhatsApp', visit: 'Visitar el estudio', studio: 'Descubrir el estudio', other: 'Otra pregunta', ack: '¡Gracias! Déjanos tu nombre y WhatsApp para transmitir tu pregunta al atelier.',
      topics: ['¿Qué talla elijo?', '¿Sigue disponible?', 'Es para regalar', 'Envíos y plazos', 'Devoluciones y reparaciones', 'Pedidos al por mayor'],
      answers: ['Cada ficha incluye el corte y las medidas. La ropa Jawhara es de talla libre, de XS a XXL. Escríbenos para un consejo o pruébatela en el estudio.', 'Consulta los colores disponibles en cada ficha. Para un color agotado o un pedido especial, el atelier confirmará las opciones y el plazo.', 'El envoltorio de regalo y una nota manuscrita son gratuitos. Puedes solicitarlos en la cesta o al finalizar la compra.', 'El envío en Marruecos cuesta 50 DH y es gratuito desde 500 DH en accesorios o 1.500 DH en bolsos y ropa. Recogida gratuita en Guéliz. Los gastos internacionales se calculan al pagar; confirmamos el plazo según el destino.', 'Dispones de 30 días para devolver una pieza sin usar y en su estado original. Reparamos las piezas YZA de por vida en Guéliz. Contáctanos para organizar una devolución o reparación.', 'Los pedidos al por mayor empiezan en 10 piezas. Prepara tu selección en la página de mayoristas; confirmaremos presupuesto, disponibilidad y plazos.'],
      links: ['Ver ropa', 'Ver best sellers', 'Descubrir charms', 'Envíos y devoluciones', 'Nuestras garantías', 'Página mayoristas']
    },
    tr: {
      title: 'Atölye', open: 'Stüdyo açık · Guéliz', closed: 'Stüdyo kapalı · Guéliz', greeting: 'Merhaba — Guéliz atölyemize hoş geldiniz. Sorunuzu yazın veya aşağıdan bir konu seçin.', guide: 'YZA rehberi', you: 'Siz', placeholder: 'Sorunuzu yazın', whatsapp: 'WhatsApp’ta devam et', visit: 'Stüdyoyu ziyaret et', studio: 'Stüdyoyu keşfet', other: 'Başka bir soru', ack: 'Teşekkürler! Sorunuzu atölyeye iletmemiz için adınızı ve WhatsApp numaranızı bırakın.',
      topics: ['Hangi bedeni seçmeliyim?', 'Hâlâ mevcut mu?', 'Hediye olarak alıyorum', 'Teslimat ve süreler', 'İade ve onarım', 'Toptan sipariş'],
      answers: ['Kesim ve ölçüler ürün sayfasında yer alır. Jawhara giysiler XS–XXL arası serbest bedendir. Bir ürün için bize yazın veya stüdyoda deneyin.', 'Mevcut renkler ürün sayfasında gösterilir. Tükenen renkler ve özel siparişler için seçenekleri ve süreyi atölyeden teyit edin.', 'Hediye paketi ve el yazısı not ücretsizdir. Sepette veya ödeme sırasında isteyebilirsiniz.', 'Fas içinde teslimat 50 DH; aksesuarlarda 500 DH, çanta ve giysilerde 1.500 DH üzeri ücretsizdir. Guéliz stüdyosundan teslim ücretsizdir. Uluslararası ücret ödeme sırasında hesaplanır; süre varış yerine göre teyit edilir.', 'Kullanılmamış, orijinal durumdaki ürünler için 30 gün iade hakkınız vardır. YZA ürünleri Guéliz atölyesinde ömür boyu onarılabilir. İade veya onarım için bize ulaşın.', 'Toptan seçimler 10 parçadan başlar. Toptan satış sayfasından seçiminizi hazırlayın; atölye fiyatı, stok durumunu ve süreyi teyit eder.'],
      links: ['Giysileri keşfet', 'Çok satanlar', 'Charm’ları keşfet', 'Teslimat ve iadeler', 'Garantilerimiz', 'Toptan satış']
    },
    ar: {
      title: 'الأتيليه', open: 'الاستوديو مفتوح · كليز', closed: 'الاستوديو مغلق · كليز', greeting: 'مرحبًا بكم في أتيليه كليز. أخبرونا بما تحتاجونه أو اختاروا سؤالًا من القائمة.', guide: 'دليل YZA', you: 'أنتم', placeholder: 'اكتبوا سؤالكم', whatsapp: 'المتابعة عبر واتساب', visit: 'زيارة الاستوديو', studio: 'اكتشاف الاستوديو', other: 'سؤال آخر', ack: 'شكرًا! اتركوا الاسم ورقم واتساب لنرسل سؤالكم إلى الأتيليه.',
      topics: ['أي مقاس أختار؟', 'هل القطعة متوفرة؟', 'أريد تقديم هدية', 'التوصيل والمواعيد', 'الإرجاع والإصلاح', 'طلبات الجملة'],
      answers: ['تجدون القَصّة والمقاسات في صفحة كل قطعة. ملابس Jawhara بمقاس حر من XS إلى XXL. راسلونا للمساعدة أو جرّبوا القطعة في الاستوديو.', 'تظهر الألوان المتوفرة في صفحة كل قطعة. للألوان النافدة أو الطلبات الخاصة، يؤكد الأتيليه الخيارات والمدة.', 'تغليف الهدية ورسالة بخط اليد مجانًا. يمكن طلبهما في السلة أو عند إتمام الطلب.', 'التوصيل داخل المغرب 50 درهم، ومجاني ابتداءً من 500 درهم للإكسسوارات أو 1500 درهم للحقائب والملابس. الاستلام من استوديو كليز مجاني. تُحسب رسوم التوصيل الدولي عند الدفع، وتُؤكد المدة حسب الوجهة.', 'يمكن إرجاع القطعة غير المستعملة وفي حالتها الأصلية خلال 30 يومًا. يمكن إصلاح قطع YZA مدى الحياة في أتيليه كليز. تواصلوا معنا لترتيب الإرجاع أو الإصلاح.', 'تبدأ اختيارات الجملة من 10 قطع. جهّزوا اختياركم في صفحة الجملة، ويؤكد الأتيليه عرض السعر والتوفر والمواعيد.'],
      links: ['اكتشاف الملابس', 'الأكثر مبيعًا', 'اكتشاف التمائم', 'التوصيل والإرجاع', 'ضماناتنا', 'صفحة الجملة']
    }
  };
  const destinations = ['/collections/pret-a-porter', '/collections/best-sellers', '/collections/charms', '/faq#livraison', '/faq', '/grossistes'];
  const language = () => Y.i18n?.lang || document.documentElement.lang || 'fr';
  const text = () => copy[language()] || copy.fr;
  function studioOpen(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Casablanca', weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(now);
    const day = parts.find(p => p.type === 'weekday').value, hour = Number(parts.find(p => p.type === 'hour').value);
    return day !== 'Tue' && hour >= 12 && hour < (day === 'Mon' ? 16 : 20);
  }
  function element(tag, className, content) {
    const node = document.createElement(tag); if (className) node.className = className;
    if (content) node.textContent = content; return node;
  }
  function stamp() { return new Intl.DateTimeFormat(language(), { hour: '2-digit', minute: '2-digit' }).format(new Date()); }
  function refresh(panel) {
    if (!panel?.classList.contains('chat-maison')) return;
    const c = text(), open = studioOpen();
    panel.querySelector('#leadChatTitle').textContent = c.title;
    panel.querySelector('#leadChatGreeting').textContent = c.greeting;
    panel.querySelector('.lead-chat__eyebrow').textContent = open ? c.open : c.closed;
    panel.querySelector('.lead-chat__dot').classList.toggle('is-closed', !open);
    panel.querySelector('#lcMsg').placeholder = c.placeholder;
    panel.querySelector('#lcWhatsNow span').textContent = c.whatsapp;
    panel.querySelector('.chat-maison-links summary').textContent = c.visit;
    panel.querySelector('.chat-studio-link').textContent = c.studio;
    panel.querySelector('.chat-greeting-stamp').textContent = c.guide + ' · ' + panel.dataset.greetTime;
    panel.querySelectorAll('[data-chat-topic-index]').forEach(b => b.querySelector('span').textContent = c.topics[Number(b.dataset.chatTopicIndex)]);
    const selected = Number(panel.dataset.selectedTopic);
    if (panel.hasAttribute('data-selected-topic')) renderTopic(panel, selected, false);
  }
  function renderTopic(panel, index, scroll = true) {
    const c = text(), thread = panel.querySelector('#leadChatThread'), topics = panel.querySelector('.chat-topics');
    panel.querySelector('.chat-topic-answer')?.remove(); topics.hidden = true;
    panel.dataset.selectedTopic = String(index); panel.dataset.topic = c.topics[index];
    const answer = element('div', 'chat-topic-answer');
    for (const [content, who] of [[c.topics[index], 'user'], [c.answers[index], 'bot']]) {
      const bubble = element('div', 'lead-chat__msg lead-chat__msg--' + who);
      bubble.append(element('p', '', content), element('small', 'chat-message-stamp', (who === 'user' ? c.you : c.guide) + ' · ' + stamp())); answer.append(bubble);
    }
    const actions = element('div', 'chat-topic-actions'), link = element('a', '', c.links[index]); link.href = destinations[index];
    const reset = element('button', 'chat-topic-reset', c.other); reset.type = 'button';
    reset.addEventListener('click', () => { answer.remove(); topics.hidden = false; delete panel.dataset.selectedTopic; delete panel.dataset.topic; topics.querySelector('button')?.focus(); });
    actions.append(link, reset); answer.append(actions); topics.after(answer);
    if (scroll) thread.scrollTo({ top: thread.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function enhance(panel) {
    if (panel.classList.contains('chat-maison')) return;
    panel.classList.add('chat-maison'); panel.tabIndex = -1; panel.dataset.greetTime = stamp();
    const thread = panel.querySelector('#leadChatThread'); thread.setAttribute('role', 'log'); thread.setAttribute('aria-live', 'polite'); thread.setAttribute('aria-relevant', 'additions');
    const glyph = panel.querySelector('.lead-chat__avatar img'); glyph.src = '/yza-v2-preview/assets/brand/icons/chat-atelier.png'; glyph.width = 22; glyph.height = 22;
    const closeIcon = element('img'); closeIcon.src = '/yza-v2-preview/assets/brand/icons/chat-close.svg'; closeIcon.alt = ''; closeIcon.width = 14; closeIcon.height = 14; panel.querySelector('#leadChatClose').replaceChildren(closeIcon);
    thread.firstElementChild.append(element('small', 'chat-message-stamp chat-greeting-stamp'));
    const topics = element('div', 'chat-topics');
    text().topics.forEach((label, index) => {
      const button = element('button'); button.type = 'button'; button.dataset.chatTopicIndex = String(index);
      const arrow = element('img'); arrow.src = icon; arrow.alt = ''; arrow.width = 13; arrow.height = 13;
      button.append(element('span', '', label), arrow); button.addEventListener('click', () => renderTopic(panel, index)); topics.append(button);
    }); thread.append(topics);
    const footer = element('div', 'chat-maison-footer');
    const composer = panel.querySelector('#leadChatComposer'), form = panel.querySelector('#leadChatForm'), wa = panel.querySelector('#lcWhatsNow'), maps = panel.querySelector('.lead-chat__maps');
    const arrow = element('img'); arrow.src = icon; arrow.alt = ''; arrow.width = 15; arrow.height = 15; composer.querySelector('button').replaceChildren(arrow);
    const waIcon = element('img'); waIcon.src = '/yza-v2-preview/assets/brand/icons/chat-bubble.svg'; waIcon.alt = ''; waIcon.width = 15; waIcon.height = 15; wa.querySelector('svg').replaceWith(waIcon);
    const links = element('div', 'chat-maison-links'), directions = element('details'), summary = element('summary'), studio = element('a', 'chat-studio-link'); studio.href = '/studio';
    directions.append(summary, maps); maps.append(studio);
    const mail = element('a', '', 'contact@yza-shop.com'); mail.href = 'mailto:contact@yza-shop.com'; links.append(directions, mail);
    footer.append(composer, form, wa, links); panel.append(footer);
    composer.querySelector('textarea').maxLength = 2000;
    composer.querySelector('textarea').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); composer.requestSubmit(); } });
    composer.addEventListener('submit', () => { if (composer.querySelector('textarea').value.trim()) { topics.hidden = true; panel.querySelector('.chat-topic-answer')?.remove(); delete panel.dataset.selectedTopic; } });
    refresh(panel);
  }
  Y.chatMaison = { enhance, refresh, ack: () => text().ack };
  const update = () => { const panel = document.getElementById('leadChat'); if (panel) refresh(panel); };
  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
