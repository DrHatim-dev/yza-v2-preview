/* Wholesale presentation derives its state from the existing catalog composer. */
(function () {
  'use strict';
  const YZA = window.YZA = window.YZA || {};
  const copy = {
    fr: { announcement:'Wholesale SS26/27 · Présentoir et kit marketing offerts', studio:'Le Studio', fill:'Remplir', chosen:'Choisi', total:'pièces au total', pieces:'pièces', reached:'Atteint', add:'à ajouter', minimum:'Minimum de commande', boutique:'Palier boutique', volume:'Palier volume', empty:'Choisissez vos pièces, ou partez d’une sélection type ci-dessus.', start:'Commencez par une sélection type, ou choisissez pièce par pièce.', more:'Ajouter une pièce', less:'Retirer une pièce', close:'Fermer le détail', review:'Revoir et envoyer', groups:{charms:'charms',earrings:'bijoux',bags:'paniers & sacs',rtw:'pièces Jawhara'} },
    en: { announcement:'Wholesale SS26/27 · Display and marketing kit included', studio:'The Studio', fill:'Fill', chosen:'Selected', total:'pieces in total', pieces:'pieces', reached:'Reached', add:'to add', minimum:'Minimum order', boutique:'Boutique milestone', volume:'Volume milestone', empty:'Choose your pieces, or start with a preset above.', start:'Start with a preset, or choose piece by piece.', more:'Add one piece', less:'Remove one piece', close:'Close details', review:'Review and send', groups:{charms:'charms',earrings:'jewellery pieces',bags:'baskets & bags',rtw:'Jawhara pieces'} },
    es: { announcement:'Wholesale SS26/27 · Expositor y kit de marketing incluidos', studio:'El estudio', fill:'Rellenar', chosen:'Elegido', total:'piezas en total', pieces:'piezas', reached:'Alcanzado', add:'por añadir', minimum:'Pedido mínimo', boutique:'Nivel boutique', volume:'Nivel volumen', empty:'Elige tus piezas o empieza con una selección de arriba.', start:'Empieza con una selección o elige pieza por pieza.', more:'Añadir una pieza', less:'Quitar una pieza', close:'Cerrar detalles', review:'Revisar y enviar', groups:{charms:'charms',earrings:'joyas',bags:'cestas y bolsos',rtw:'piezas Jawhara'} },
    tr: { announcement:'Wholesale SS26/27 · Teşhir ve pazarlama kiti dahil', studio:'Stüdyo', fill:'Doldur', chosen:'Seçildi', total:'toplam parça', pieces:'parça', reached:'Ulaşıldı', add:'ekleyin', minimum:'Minimum sipariş', boutique:'Butik aşaması', volume:'Hacim aşaması', empty:'Parçalarınızı seçin veya yukarıdaki hazır seçimle başlayın.', start:'Hazır seçimle başlayın veya parça parça seçin.', more:'Bir parça ekle', less:'Bir parça çıkar', close:'Detayları kapat', review:'İncele ve gönder', groups:{charms:'charm',earrings:'takı',bags:'sepet ve çanta',rtw:'Jawhara parçası'} },
    ar: { announcement:'Wholesale SS26/27 · حامل العرض ومجموعة التسويق مجانًا', studio:'الاستوديو', fill:'املئي', chosen:'مختارة', total:'قطعة بالمجموع', pieces:'قطع', reached:'مكتمل', add:'للإضافة', minimum:'الحد الأدنى للطلب', boutique:'مرحلة البوتيك', volume:'مرحلة الكمية', empty:'اختاري قطعك أو ابدئي بتشكيلة جاهزة أعلاه.', start:'ابدئي بتشكيلة جاهزة أو اختاري قطعة بقطعة.', more:'أضيفي قطعة', less:'احذفي قطعة', close:'أغلقي التفاصيل', review:'راجعي وأرسلي', groups:{charms:'تعليقات',earrings:'مجوهرات',bags:'سلال وحقائب',rtw:'قطع جوهرة'} },
  };
  const words = () => copy[YZA.i18n?.lang] || copy.fr;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const quantity = (input) => Math.max(0, parseInt(input.value || '0', 10) || 0);
  function header() {
    if (document.body.classList.contains('site-maison')) return;
    const inner = document.querySelector('.header__inner');
    if (!inner) return;
    const nav = inner.querySelector('.nav'), actions = inner.querySelector('.header__actions');
    for (const path of ['studio','grossistes']) {
      const link = nav?.querySelector(`a[href="${path}"],a[href="/${path}"]`);
      if (!link || !actions) continue;
      const wrapper = link.closest('.nav-item');
      link.classList.add('wholesale-nav-link');
      actions.insertBefore(link, actions.querySelector('#searchOpen'));
      if (wrapper && !wrapper.children.length) wrapper.remove();
    }
    const studio = inner.querySelector('.wholesale-nav-link[href="/studio"],.wholesale-nav-link[href="studio"]');
    if (studio) studio.textContent = words().studio;
    const current = inner.querySelector('.wholesale-nav-link[href="/grossistes"],.wholesale-nav-link[href="grossistes"]');
    if (current) current.setAttribute('aria-current','page');
    const burger = inner.querySelector('#burger');
    if (burger && !inner.querySelector('.wholesale-menu-slot')) {
      const slot = document.createElement('div'); slot.className = 'wholesale-menu-slot';
      slot.append(burger); inner.prepend(slot);
    }
    const line = document.querySelector('.announcement__line');
    if (line) { line.removeAttribute('data-i18n'); line.textContent = words().announcement; }
    document.querySelector('.skip-link')?.setAttribute('href','/grossistes#main');
  }
  YZA.renderWholesaleMaison = function (thresholds) {
    if (!document.body.classList.contains('wholesale-maison')) return;
    const form = document.getElementById('b2bForm'), core = YZA.b2bComposer;
    if (!form || !core) return;
    const c = words(), inputs = [...form.querySelectorAll('.b2b-qty')];
    const n = inputs.reduce((sum,input) => sum + quantity(input),0);
    const limits = thresholds || core.thresholds();
    document.querySelectorAll('#b2bTemplates [data-tpl]').forEach((card) => {
      const groupCounts = {};
      let count = 0;
      for (const input of inputs) {
        const q = core.presetQuantity(card.dataset.tpl,input);
        const group = input.closest('[data-wholesale-group]')?.dataset.wholesaleGroup;
        count += q;
        if (q && group) groupCounts[group] = (groupCounts[group] || 0) + q;
      }
      const selected = core.selectedPreset === card.dataset.tpl;
      card.setAttribute('aria-pressed',String(selected));
      card.querySelector('.wholesale-preset-hint').textContent = selected ? c.chosen : c.fill;
      card.querySelector('.wholesale-preset-total').textContent = `${count} ${c.total}`;
      card.querySelector('.wholesale-preset-lines').innerHTML = Object.entries(groupCounts).map(([group,q]) => `<span>${q} ${esc(c.groups[group])}</span>`).join('');
    });
    document.querySelectorAll('[data-wholesale-group]').forEach((group) => {
      const count = [...group.querySelectorAll('.b2b-qty')].reduce((sum,input) => sum + quantity(input),0);
      group.querySelector('[data-group-count]').textContent = count || '—';
    });
    document.querySelectorAll('.b2b-matrix').forEach((matrix) => {
      const count = [...matrix.querySelectorAll('.b2b-qty')].reduce((sum,input) => sum + quantity(input),0);
      const label = matrix.querySelector('.wholesale-family-count');
      if (label) label.textContent = count || '—';
    });
    for (const input of inputs) {
      const minus = input.parentElement.querySelector('[data-step="-1"]');
      const plus = input.parentElement.querySelector('[data-step="1"]');
      minus.disabled = quantity(input) === 0;
      minus.setAttribute('aria-label',`${c.less} — ${input.dataset.name}`);
      plus.setAttribute('aria-label',`${c.more} — ${input.dataset.name}`);
    }
    const values = [limits.minimum,limits.tierOne,limits.bulk];
    const labels = [c.minimum,c.boutique,c.volume];
    document.querySelectorAll('[data-tier-progress]').forEach((bar,i) => {
      const start = i ? values[i-1] : 0;
      bar.style.width = `${Math.max(0,Math.min(1,(n-start)/Math.max(1,values[i]-start)))*100}%`;
    });
    document.getElementById('b2bTierRows').innerHTML = values.map((value,i) => `<div class="wholesale-tier${n>=value?' is-reached':''}"><i aria-hidden="true"></i><span>${esc(labels[i])} · ${value} ${esc(c.pieces)}</span><small>${n>=value?esc(c.reached):`${value-n} ${esc(c.add)}`}</small></div>`).join('');
    const lines = document.getElementById('b2bLines');
    const scroll = lines.querySelector('ul')?.scrollTop || 0;
    const chosen = inputs.filter(input => quantity(input)>0);
    lines.innerHTML = chosen.length ? '<ul>'+chosen.map(input=>`<li><span>${esc(input.dataset.name)}</span><i aria-hidden="true"></i><strong>×${quantity(input)}</strong></li>`).join('')+'</ul>' : `<p class="wholesale-empty"><img src="assets/studio/maison/am-06.png" alt="" width="24" height="24">${esc(c.empty)}</p>`;
    if (lines.querySelector('ul')) lines.querySelector('ul').scrollTop = scroll;
    if (!n) {
      const status = document.getElementById('b2bStatus');
      status.textContent = c.start; status.className = 'b2b-status';
    }
    const toggle = document.querySelector('[data-summary-toggle]');
    if (toggle) toggle.textContent = toggle.getAttribute('aria-expanded') === 'true' ? c.close : c.review;
    header();
  };
  function init() {
    if (!document.body.classList.contains('wholesale-maison')) return;
    header();
    YZA.b2bComposer?.refresh();
    YZA.i18n?.onChange(header);
    const composer = document.getElementById('b2bComposer');
    const summary = document.getElementById('b2bSummary');
    const toggle = summary.querySelector('[data-summary-toggle]');
    const small = matchMedia('(max-width: 1100px)');
    function setOpen(open) {
      summary.classList.toggle('is-summary-open',open);
      toggle.setAttribute('aria-expanded',String(open));
      toggle.textContent = open ? words().close : words().review;
      if (open) summary.scrollTop = 0;
    }
    toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
    summary.addEventListener('keydown',(event)=>{
      if (event.key==='Escape' && small.matches && summary.classList.contains('is-summary-open')) {
        setOpen(false); toggle.focus();
      }
    });
    small.addEventListener('change',()=>setOpen(false));
    new IntersectionObserver((entries)=>{
      const active = entries[0].isIntersecting;
      document.body.classList.toggle('wholesale-composer-active',active);
      if (!active) setOpen(false);
    },{threshold:0}).observe(composer);
    document.getElementById('b2bReset').addEventListener('click',()=>{
      document.querySelectorAll('#b2bForm .b2b-qty').forEach(input=>{input.value=0;});
      YZA.b2bComposer.selectedPreset=null;
      YZA.b2bComposer.refresh();
    });
    document.getElementById('b2bBuyer').addEventListener('input',(event)=>{
      const input = event.target;
      if (input.getAttribute('aria-invalid') !== 'true') return;
      const valid = input.value.trim() && (input.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
      if (valid) { input.classList.remove('is-invalid'); input.setAttribute('aria-invalid','false'); }
      if (!document.querySelector('#b2bBuyer [aria-invalid="true"]')) {
        const message = document.getElementById('b2bBuyerStatus');
        message.hidden = true; message.textContent = '';
      }
    });
    document.getElementById('b2bForm').addEventListener('focusin',(event)=>{
      if (small.matches && event.target.closest('.wholesale-buyer')) setOpen(false);
    });
  }
  if (document.readyState!=='complete') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
