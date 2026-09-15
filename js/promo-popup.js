/* YZA — atelier letter. Existing welcome offer, capture endpoint and discovery triggers. */
(function () {
  'use strict';
  if (!document || !document.body) return;
  var NOPE = { checkout:1, cart:1, panier:1, order:1, confirmation:1, merci:1, account:1, compte:1 };
  if (NOPE[document.body.dataset.page]) return;
  var KEY='yza_promo10_v1', ONCE_PER=86400000, CODE='YZA10';
  try { var last=parseInt(localStorage.getItem(KEY)||'0',10); if(last && Date.now()-last<ONCE_PER)return; } catch(e) {}
  var lang=(window.YZA && YZA.i18n && YZA.i18n.lang)||document.documentElement.lang||'fr';
  // The shared locale can still be initializing when this deferred script runs.
  try { lang=YZA.i18n.detect()||lang; } catch(e) {}
  var COPY={
    fr:{eyebrow:'Lettre de l’atelier',title:'Ce qui sort de l’atelier, avant tout le monde.',intro:'Les nouvelles pièces, les petites séries et la vie de l’atelier, rue Yougoslavie.',perks:['Les nouvelles séries à découvrir en premier','Les couleurs de nos éditions limitées','Les nouvelles de l’atelier, à Guéliz'],email:'E-mail',wa:'WhatsApp',waOpt:'Me prévenir aussi sur WhatsApp des nouvelles séries',btn:'Recevoir la lettre',offer:'Et −10 % sur votre première commande dès 500 DH.',fine:'Désinscription à tout moment.',skip:'Continuer sans s’inscrire',close:'Fermer',sending:'Un instant…',retry:'Envoi impossible pour le moment — réessayez.',errEmail:'Entrez un e-mail valide ou choisissez WhatsApp.',incomplete:'Adresse incomplète',errWa:'Entrez un numéro WhatsApp valide.',okTitle:'C’est noté — à bientôt.',okBody:'Bienvenue dans la lettre de l’atelier. En attendant, découvrez quelques pièces YZA.',okPhone:'C’est noté pour WhatsApp. En attendant, découvrez quelques pièces YZA.',code:'Votre code de bienvenue',codeNote:'−10 % sur votre première commande dès 500 DH.',shop:'Découvrir les pièces',photo:'Un panier YZA porté dans une entrée ensoleillée'},
    en:{eyebrow:'Letters from the atelier',title:'Fresh from the atelier, before everyone else.',intro:'New pieces, small collections and life at the atelier on rue Yougoslavie.',perks:['Discover the new collections first','The colours of our limited editions','News from the atelier in Guéliz'],email:'Email',wa:'WhatsApp',waOpt:'Also let me know about new collections on WhatsApp',btn:'Receive the letter',offer:'Plus 10% off your first order from 500 DH.',fine:'Unsubscribe at any time.',skip:'Continue without subscribing',close:'Close',sending:'One moment…',retry:'Could not send right now — please retry.',errEmail:'Enter a valid email or choose WhatsApp.',incomplete:'Incomplete address',errWa:'Enter a valid WhatsApp number.',okTitle:'You’re on the list — see you soon.',okBody:'Welcome to our atelier letters. In the meantime, discover a few YZA pieces.',okPhone:'We’ve noted your WhatsApp request. In the meantime, discover a few YZA pieces.',code:'Your welcome code',codeNote:'10% off your first order from 500 DH.',shop:'Discover the pieces',photo:'A YZA basket carried in a sunlit doorway'},
    es:{eyebrow:'La carta del taller',title:'Lo nuevo del taller, antes que nadie.',intro:'Nuevas piezas, pequeñas series y la vida del taller en la calle Yougoslavie.',perks:['Descubre primero las nuevas series','Los colores de nuestras ediciones limitadas','Noticias del taller en Guéliz'],email:'E-mail',wa:'WhatsApp',waOpt:'Avisadme también por WhatsApp de las nuevas series',btn:'Recibir la carta',offer:'Y un 10 % en tu primer pedido desde 500 DH.',fine:'Puedes darte de baja cuando quieras.',skip:'Continuar sin suscribirme',close:'Cerrar',sending:'Un momento…',retry:'No se pudo enviar — inténtalo de nuevo.',errEmail:'Introduce un email válido o elige WhatsApp.',incomplete:'Dirección incompleta',errWa:'Introduce un número de WhatsApp válido.',okTitle:'Ya está — hasta pronto.',okBody:'Bienvenida a la carta del taller. Mientras tanto, descubre algunas piezas YZA.',okPhone:'Hemos anotado tu solicitud por WhatsApp. Descubre algunas piezas YZA.',code:'Tu código de bienvenida',codeNote:'10 % en tu primer pedido desde 500 DH.',shop:'Descubrir las piezas',photo:'Un bolso YZA llevado en una entrada soleada'},
    tr:{eyebrow:'Atölyeden mektuplar',title:'Atölyeden çıkanlar, herkesten önce.',intro:'Yeni parçalar, küçük seriler ve Yougoslavie sokağındaki atölyeden haberler.',perks:['Yeni serileri ilk keşfeden siz olun','Sınırlı üretimlerimizin renkleri','Guéliz’deki atölyeden haberler'],email:'E-posta',wa:'WhatsApp',waOpt:'Yeni serilerden WhatsApp ile de haberdar olmak istiyorum',btn:'Mektubu al',offer:'Ayrıca 500 DH ve üzeri ilk siparişinizde %10 indirim.',fine:'İstediğiniz zaman abonelikten çıkabilirsiniz.',skip:'Abone olmadan devam et',close:'Kapat',sending:'Bir saniye…',retry:'Şu an gönderilemedi — tekrar deneyin.',errEmail:'Geçerli bir e-posta girin veya WhatsApp’ı seçin.',incomplete:'Eksik adres',errWa:'Geçerli bir WhatsApp numarası girin.',okTitle:'Not ettik — yakında görüşürüz.',okBody:'Atölye mektuplarına hoş geldiniz. Bu arada YZA parçalarını keşfedin.',okPhone:'WhatsApp talebinizi not ettik. Bu arada YZA parçalarını keşfedin.',code:'Hoş geldin kodunuz',codeNote:'500 DH ve üzeri ilk siparişinizde %10 indirim.',shop:'Parçaları keşfet',photo:'Güneşli bir girişte taşınan YZA sepet çanta'},
    ar:{eyebrow:'رسالة من الأتيليه',title:'جديد الأتيليه، قبل الجميع.',intro:'قطع جديدة، وسلاسل صغيرة، وأخبار الأتيليه في شارع يوغوسلافيا.',perks:['اكتشفي السلاسل الجديدة أولاً','ألوان إصداراتنا المحدودة','أخبار الأتيليه في جليز'],email:'البريد الإلكتروني',wa:'WhatsApp',waOpt:'أرغب أيضاً في معرفة جديد السلاسل عبر WhatsApp',btn:'أريد الرسالة',offer:'وخصم 10٪ على طلبك الأول ابتداءً من 500 درهم.',fine:'يمكنك إلغاء الاشتراك في أي وقت.',skip:'المتابعة دون الاشتراك',close:'إغلاق',sending:'لحظة…',retry:'تعذّر الإرسال الآن — حاولي مجدداً.',errEmail:'أدخلي بريداً صحيحاً أو اختاري WhatsApp.',incomplete:'العنوان غير مكتمل',errWa:'أدخلي رقم WhatsApp صحيحاً.',okTitle:'تمّ — نراك قريباً.',okBody:'مرحباً بك في رسالة الأتيليه. اكتشفي في انتظارها بعض قطع YZA.',okPhone:'سجّلنا طلبك عبر WhatsApp. اكتشفي بعض قطع YZA.',code:'رمز الترحيب الخاص بك',codeNote:'خصم 10٪ على طلبك الأول ابتداءً من 500 درهم.',shop:'اكتشفي القطع',photo:'حقيبة سلة YZA محمولة عند مدخل مشمس'}
  };
  var c=COPY[lang]||COPY.fr;
  var esc=s=>String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  var css=`
    .yzapop-ov{position:fixed;inset:0;z-index:9990;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(46,46,46,.42);opacity:0;visibility:hidden;transition:opacity var(--motion-modal-exit,150ms) linear,visibility 0s linear var(--motion-modal-exit,150ms)}
    .yzapop-ov.is-open{opacity:1;visibility:visible}
    .yzapop,.yzapop *{box-sizing:border-box}
    .yzapop{position:relative;display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);width:100%;max-width:920px;max-height:calc(100dvh - 40px);overflow:hidden;background:#fff;color:#2e2e2e;box-shadow:0 24px 60px rgba(46,46,46,.24);font-family:var(--font-body,'Jost',sans-serif);text-align:start;isolation:isolate}
    .yzapop [hidden]{display:none!important}
    .yzapop__img{position:relative;min-height:650px;background:#f6f4f0}
    .yzapop__img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:38% 22%}
    .yzapop__body{min-width:0;padding:40px 46px;position:relative;overflow-y:auto;max-height:calc(100dvh - 40px)}
    .yzapop__x{position:absolute;inset-block-start:14px;inset-inline-end:14px;width:44px;height:44px;z-index:2;display:grid;place-items:center;border:0;background:#fff;color:#767676;cursor:pointer;padding:12px}
    .yzapop__ey{display:flex;align-items:center;gap:13px;margin:0 26px 24px 0;font-size:10px;line-height:1.5;font-weight:400;letter-spacing:.24em;text-transform:uppercase;color:#767676}
    .yzapop__ey img{width:18px;height:18px;object-fit:contain;opacity:.65}
    .yzapop__h,.yzapop__ok h2{font-family:'Fraunces',Georgia,serif;font-weight:200;font-size:38px;line-height:1.05;letter-spacing:-.02em;margin:0 0 14px;color:#2e2e2e;max-width:17ch;text-wrap:pretty}
    .yzapop__intro{font-size:14px;line-height:1.75;color:#4a4a4a;margin:0 0 22px}
    .yzapop__perks{list-style:none;margin:0 0 22px;padding:0;border-top:1px solid rgba(46,46,46,.14)}
    .yzapop__perks li{display:flex;align-items:baseline;gap:14px;padding:9px 0;border-bottom:1px solid rgba(46,46,46,.12);font-size:13px;line-height:1.6;color:#4a4a4a}
    .yzapop__perks li::before{content:'';width:4px;height:4px;border-radius:50%;background:#e07a45;flex:0 0 4px}
    .yzapop__f{display:block;margin:0}
    .yzapop__field{display:block;margin:0 0 8px}
    .yzapop__label{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:10px;line-height:1.5;letter-spacing:.18em;text-transform:uppercase;color:#767676}
    .yzapop__hint{letter-spacing:0;text-transform:none;font-size:11px;color:#a4491c}
    .yzapop__field input{display:block;width:100%;min-height:44px;border:0;border-bottom:1px solid rgba(46,46,46,.28);border-radius:0;background:#fff;padding:10px 0;font:400 15px/1.5 var(--font-body,'Jost',sans-serif);color:#2e2e2e;box-shadow:none}
    .yzapop__field input::placeholder{color:#89847d;opacity:1}
    .yzapop__field input:not(:placeholder-shown),.yzapop__field input:focus{border-bottom-color:#2e2e2e}
    .yzapop__field input.is-bad{border-bottom-color:#a4491c}
    .yzapop__wa{display:flex;align-items:center;gap:11px;min-height:44px;margin:8px 0 12px;font-size:12.5px;line-height:1.5;color:#4a4a4a;cursor:pointer}
    .yzapop__wa input{appearance:auto;width:16px;height:16px;flex:0 0 16px;margin:0;accent-color:#2e2e2e;cursor:pointer}
    .yzapop__phone{margin:0 0 18px}
    .yzapop__btn,.yzapop__shop{display:block;width:100%;border:1px solid #2e2e2e;border-radius:0;background:#2e2e2e;color:#fff;padding:17px 12px;font:400 10.5px/1.5 var(--font-body,'Jost',sans-serif);text-align:center;letter-spacing:.23em;text-transform:uppercase;text-decoration:none;cursor:pointer;transition:opacity var(--motion-hover,150ms) linear}
    .yzapop__btn:disabled{opacity:.55;cursor:wait}
    .yzapop__offer,.yzapop__fine{font-size:11.5px;line-height:1.65;color:#767676;margin:10px 0 0}
    .yzapop__fine{margin-top:3px}
    .yzapop__skip{display:block;width:fit-content;max-width:100%;margin:14px 0 0;border:0;border-bottom:1px solid rgba(46,46,46,.18);border-radius:0;background:none;padding:8px 0;color:#767676;font:400 10px/1.5 var(--font-body,'Jost',sans-serif);letter-spacing:.13em;text-transform:uppercase;cursor:pointer;text-align:start}
    .yzapop__msg{font-size:12px;line-height:1.5;margin:10px 0 0;color:#a4491c}.yzapop__msg:empty{display:none}
    .yzapop :is(input,button,a):focus-visible{outline:2px solid #80572f;outline-offset:4px}
    .yzapop__ok{min-height:570px;display:flex;flex-direction:column;justify-content:center}
    .yzapop__mark{width:38px;height:38px;object-fit:contain;margin-bottom:24px}
    .yzapop__ok h2{font-size:42px;max-width:15ch}
    .yzapop__ok>p{font-size:14px;line-height:1.75;color:#4a4a4a;margin:0 0 22px}
    .yzapop__picks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:0 0 24px}
    .yzapop__pick{color:#2e2e2e;text-decoration:none;min-width:0}
    .yzapop__pick img{display:block;width:100%;max-height:180px;aspect-ratio:3/4;object-fit:contain;background:#fff}
    .yzapop__pick>span{display:block;border-top:1px solid rgba(46,46,46,.14);margin-top:12px;padding-top:10px;font-size:13px;line-height:1.4}
    .yzapop__pick small{display:block;font-size:12px;color:#767676;margin-top:3px}
    .yzapop__code{border-top:1px solid rgba(46,46,46,.14);border-bottom:1px solid rgba(46,46,46,.14);padding:12px 0;margin:0 0 22px;font-size:11.5px;line-height:1.7;color:#767676}
    .yzapop__code strong{display:block;font-size:17px;letter-spacing:.14em;font-weight:400;color:#2e2e2e}
    @media(hover:hover){.yzapop__btn:not(:disabled):hover,.yzapop__shop:hover{background:#fff;color:#2e2e2e}.yzapop__skip:hover,.yzapop__pick:hover{color:#2e2e2e;border-color:#2e2e2e}.yzapop__x:hover{color:#2e2e2e}}
    @media(min-width:641px) and (max-height:800px){.yzapop__body{padding:28px 36px}.yzapop__h{font-size:34px}.yzapop__ey{margin-bottom:18px}.yzapop__intro,.yzapop__perks{margin-bottom:16px}.yzapop__perks li{padding:7px 0}.yzapop__img{min-height:610px}}
    @media(max-width:760px){.yzapop{grid-template-columns:40% minmax(0,1fr)}.yzapop__body{padding:32px 28px}.yzapop__h{font-size:33px}}
    @media(max-width:640px){.yzapop-ov{padding:12px}.yzapop{display:block;max-width:440px;max-height:calc(100dvh - 24px)}.yzapop__img{display:none}.yzapop__body{padding:34px 24px 24px;max-height:calc(100dvh - 24px)}.yzapop__ey{font-size:9px;margin-bottom:20px}.yzapop__h{font-size:33px;max-width:18ch}.yzapop__intro{font-size:13px;margin-bottom:18px}.yzapop__perks{margin-bottom:18px}.yzapop__perks li{font-size:12px;padding:8px 0}.yzapop__field input{font-size:16px}.yzapop__wa{font-size:12px}.yzapop__ok{min-height:0}.yzapop__ok h2{font-size:36px}.yzapop__pick img{max-height:200px}.yzapop__skip{min-height:44px}.yzapop__x{inset-block-start:10px;inset-inline-end:10px}}
    @media(prefers-reduced-motion:reduce){.yzapop-ov,.yzapop__btn{transition:none}}
  `;
  var ov=document.createElement('div');ov.className='yzapop-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','yzapopTitle');
  if(lang==='ar')ov.dir='rtl';
  ov.innerHTML=`<div class="yzapop"><button type="button" class="yzapop__x" aria-label="${esc(c.close)}"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14"/></svg></button><div class="yzapop__img"><img src="/yza-v2-preview/assets/newsletter/style-doorway.jpg" alt="${esc(c.photo)}" width="1000" height="1335" decoding="async"></div><div class="yzapop__body"><p class="yzapop__ey"><img src="/yza-v2-preview/assets/studio/maison/am-06.png" alt="" width="18" height="18">${esc(c.eyebrow)}</p><h2 class="yzapop__h" id="yzapopTitle">${esc(c.title)}</h2><p class="yzapop__intro">${esc(c.intro)}</p><ul class="yzapop__perks">${c.perks.map(p=>'<li>'+esc(p)+'</li>').join('')}</ul><form class="yzapop__f" novalidate><label class="yzapop__field"><span class="yzapop__label">${esc(c.email)}<span class="yzapop__hint" id="yzapopEmailHint" aria-live="polite"></span></span><input type="email" name="email" aria-label="${esc(c.email)}" autocomplete="email" placeholder="vous@exemple.com" dir="ltr" aria-describedby="yzapopEmailHint yzapopMsg"></label><label class="yzapop__wa"><input type="checkbox" name="whatsapp_optin" aria-controls="yzapopPhone" aria-expanded="false"><span>${esc(c.waOpt)}</span></label><label class="yzapop__field yzapop__phone" id="yzapopPhone" hidden><span class="yzapop__label">${esc(c.wa)}</span><input type="tel" name="phone" autocomplete="tel" placeholder="+212 6…" dir="ltr" disabled aria-describedby="yzapopMsg"></label><input type="text" name="yza_hp_note" tabindex="-1" autocomplete="off" aria-hidden="true" data-1p-ignore data-lpignore="true" data-form-type="other" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);opacity:0;pointer-events:none"><button type="submit" class="yzapop__btn">${esc(c.btn)}</button><p class="yzapop__msg" id="yzapopMsg" data-msg role="status" aria-live="polite"></p><p class="yzapop__offer">${esc(c.offer)}</p><p class="yzapop__fine">${esc(c.fine)}</p><button type="button" class="yzapop__skip">${esc(c.skip)}</button></form></div></div>`;
  var style=document.createElement('style');style.textContent=css;
  var opened=false,done=false,submitting=false,previousFocus,previousOverflow,inerted=[];
  function remember(){try{localStorage.setItem(KEY,String(Date.now()));}catch(e){}}
  function open(){
    if(opened||done||document.querySelector('#cartDrawer.is-open,#drawer.is-open'))return;
    opened=true;remember();previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;
    document.head.appendChild(style);document.body.appendChild(ov);
    Array.from(document.body.children).forEach(el=>{if(el!==ov&&!el.inert&&!/^(SCRIPT|STYLE|LINK)$/.test(el.tagName)){el.inert=true;inerted.push(el);}});
    document.body.style.overflow='hidden';ov.classList.add('is-open');YZA.motion.enter(ov,{fast:true,fadeOnly:true});
    ov.querySelector('.yzapop__x').focus({preventScroll:true});document.addEventListener('keydown',onKey);
    YZA.analytics?.track('promo10_open',{source:'home_popup'});
  }
  function close(){
    if(!ov.isConnected)return;
    ov.classList.remove('is-open');remember();document.removeEventListener('keydown',onKey);
    document.body.style.overflow=previousOverflow;
    inerted.forEach(el=>{el.inert=false;});inerted=[];
    YZA.motion.afterExit(ov,()=>{ov.remove();style.remove();});
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  }
  function onKey(e){
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key!=='Tab')return;
    var controls=Array.from(ov.querySelectorAll('button,input,a[href]')).filter(el=>!el.disabled&&el.tabIndex!==-1&&el.getClientRects().length);
    var first=controls[0],last=controls[controls.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('.yzapop__x,.yzapop__skip'))close();});
  var emailEl=ov.querySelector('[name=email]'),phoneEl=ov.querySelector('[name=phone]'),waEl=ov.querySelector('[name=whatsapp_optin]');
  var validEmail=()=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
  function emailHint(){var bad=!!emailEl.value.trim()&&!validEmail();emailEl.classList.toggle('is-bad',bad);emailEl.setAttribute('aria-invalid',String(bad));ov.querySelector('#yzapopEmailHint').textContent=bad?c.incomplete:'';}
  emailEl.addEventListener('input',emailHint);emailEl.addEventListener('blur',emailHint);
  waEl.addEventListener('change',()=>{var on=waEl.checked;ov.querySelector('#yzapopPhone').hidden=!on;phoneEl.disabled=!on;waEl.setAttribute('aria-expanded',String(on));phoneEl.classList.remove('is-bad');phoneEl.removeAttribute('aria-invalid');});
  function success(phoneOnly){
    var picks=['kiwi-raffia-earrings-ss26','raffia-cherries-charm-ss26'].map(handle=>YZA.getProduct?.(handle)).filter(Boolean);
    var pick=v=>YZA.i18n?.pick(v)||v?.fr||v||'';
    var cards=picks.map(p=>`<a class="yzapop__pick" href="/produits/${esc(p.handle)}"><img src="/${esc(p.img.replace(/^\//,''))}" alt="${esc(pick(p.name))}" width="300" height="400"><span>${esc(pick(p.name))}<small>${esc(YZA.i18n.formatPrice(p.price))}</small></span></a>`).join('');
    ov.querySelector('.yzapop__body').innerHTML=`<div class="yzapop__ok"><img class="yzapop__mark" src="/yza-v2-preview/assets/studio/maison/am-woven.png" alt="" width="38" height="38"><h2 id="yzapopTitle" tabindex="-1">${esc(c.okTitle)}</h2><p>${esc(phoneOnly?c.okPhone:c.okBody)}</p>${cards?'<div class="yzapop__picks">'+cards+'</div>':''}<div class="yzapop__code">${esc(c.code)}<strong dir="ltr">${CODE}</strong>${esc(c.codeNote)}</div><a class="yzapop__shop" href="/collections/best-sellers">${esc(c.shop)}</a></div>`;
    if(ov.isConnected)ov.querySelector('#yzapopTitle').focus({preventScroll:true});
    ov.querySelector('.yzapop__body').scrollTop=0;
  }
  ov.addEventListener('submit',e=>{
    e.preventDefault();if(submitting||done)return;
    var f=e.target,msg=f.querySelector('[data-msg]'),btn=f.querySelector('[type=submit]');
    var email=emailEl.value.trim(),phone=waEl.checked?phoneEl.value.trim():'';
    var okEmail=validEmail(),okPhone=phone.replace(/\D/g,'').length>=6;
    // Keep the existing phone-only signup route; an unchecked WhatsApp field sends no number.
    if((!okEmail&&!okPhone)||(waEl.checked&&!okPhone)){
      var phoneBad=waEl.checked&&!okPhone;msg.textContent=phoneBad?c.errWa:c.errEmail;
      emailEl.classList.toggle('is-bad',!okEmail&&!okPhone);emailEl.setAttribute('aria-invalid',String(!okEmail&&!okPhone));
      phoneEl.classList.toggle('is-bad',phoneBad);phoneEl.setAttribute('aria-invalid',String(phoneBad));
      (phoneBad?phoneEl:emailEl).focus();return;
    }
    submitting=true;btn.disabled=true;btn.textContent=c.sending;f.setAttribute('aria-busy','true');msg.textContent='';
    fetch('/subscribe.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:okEmail?email:'',phone:phone,lang:lang,page:'home_popup',source:'popup10',_hp:f.querySelector('[name=yza_hp_note]').value})})
      .then(r=>r.ok?r.json():Promise.reject(new Error('subscribe failed')))
      .then(result=>{if(!result||result.ok!==true)throw new Error('subscribe rejected');done=true;remember();YZA.analytics?.track('promo10_submit',{source:'home_popup'});success(!okEmail);})
      .catch(()=>{msg.textContent=c.retry;})
      .finally(()=>{submitting=false;if(btn.isConnected){btn.disabled=false;btn.textContent=c.btn;f.removeAttribute('aria-busy');}});
  });
  // Preserve the existing daily discovery-page welcome timing and accelerators.
  var t=setTimeout(open,3200);
  function onScroll(){var sc=window.scrollY||document.documentElement.scrollTop||0,h=(document.documentElement.scrollHeight-window.innerHeight)||1;if(sc/h>.45){clearTimeout(t);window.removeEventListener('scroll',onScroll);open();}}
  window.addEventListener('scroll',onScroll,{passive:true});
  function onExit(e){if(e.clientY<=0){clearTimeout(t);document.removeEventListener('mouseout',onExit);open();}}
  if(window.matchMedia&&window.matchMedia('(pointer:fine)').matches)document.addEventListener('mouseout',onExit);
})();
