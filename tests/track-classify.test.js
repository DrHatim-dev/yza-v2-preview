/* Tests de la couche de capture (js/yza-track.js) exécutables sans navigateur.
   Lancer : node tests/track-classify.test.js
   Ils couvrent les deux classificateurs qui décident si un contact est attribué à la
   bonne campagne et s'il est vu comme un contact tout court — les deux endroits où une
   régression est totalement silencieuse. */
'use strict';
const path = require('path');

/* Shim minimal : le module s'auto-exécute et cherche window/document. On lui donne un
   faux window sans document pour qu'il n'attache aucun écouteur, puis on récupère ses
   classificateurs via module.exports. */
global.window = { location: { hostname: 'yza-shop.com', search: '' }, navigator: {}, document: null };
const T = require(path.join(__dirname, '..', 'js', 'yza-track.js'));

let pass = 0, fail = 0;
function eq(actual, expected, name) {
  if (actual === expected) { pass++; return; }
  fail++;
  console.log(`  ECHEC  ${name}\n         attendu : ${JSON.stringify(expected)}\n         obtenu  : ${JSON.stringify(actual)}`);
}

/* --- A1 : un cas par identifiant de clic, sortie EXACTE ------------------------- */
console.log('\nA1 — classification des canaux (identifiants de clic)');
const CH = [
  [{ gclid: 'x' },     'Google Ads'],
  [{ wbraid: 'x' },    'Google Ads'],          // iOS ATT — omis = trafic iPhone dé-crédité
  [{ gbraid: 'x' },    'Google Ads'],
  [{ dclid: 'x' },     'Google Display'],
  [{ srsltid: 'x' },   'Google Shopping'],     // surfaces organiques, pas Ads
  [{ msclkid: 'x' },   'Microsoft / Bing Ads'],
  [{ ttclid: 'x' },    'TikTok Ads'],
  [{ twclid: 'x' },    'X / Twitter Ads'],
  [{ li_fat_id: 'x' }, 'LinkedIn Ads'],
  [{ ScCid: 'x' },     'Snapchat Ads'],        // casse EXACTE
  [{ epik: 'x' },      'Pinterest Ads'],
  [{ rdt_cid: 'x' },   'Reddit Ads'],
  [{ fbclid: 'x' },    'Facebook / Instagram'],
  [{ igshid: 'x' },    'Facebook / Instagram'],
  [{ mc_eid: 'x' },    'Email campaign'],
  [{ _kx: 'x' },       'Email campaign'],
];
CH.forEach(([p, want]) => eq(T.channel('', p, 'yza-shop.com'), want, Object.keys(p)[0]));

/* Piège de casse : sccid en minuscules ne DOIT PAS être reconnu — c'est exactement ce
   qui rendrait Snapchat invisible sans erreur si on normalisait la table. */
eq(T.channel('', { sccid: 'x' }, 'yza-shop.com'), 'Direct / lien enregistre', 'sccid minuscule ignoré');

console.log('A1 — UTM et referrers');
eq(T.channel('', { utm_source: 'newsletter' }, 'yza-shop.com'), 'newsletter', 'utm_source verbatim');
eq(T.channel('', { utm_source: 'meta', utm_medium: 'cpc' }, 'yza-shop.com'), 'meta (paid)', 'utm medium payant');
eq(T.channel('https://www.google.com/', {}, 'yza-shop.com'), 'Google (recherche)', 'google organique');
eq(T.channel('https://duckduckgo.com/', {}, 'yza-shop.com'), 'Autre moteur de recherche', 'ddg groupé');
eq(T.channel('https://www.bing.com/', {}, 'yza-shop.com'), 'Autre moteur de recherche', 'bing groupé');
eq(T.channel('https://www.instagram.com/', {}, 'yza-shop.com'), 'Facebook / Instagram', 'instagram');
eq(T.channel('https://mail.google.com/', {}, 'yza-shop.com'), 'Lien e-mail', 'webmail');
eq(T.channel('https://maps.google.com/', {}, 'yza-shop.com'), 'Cartes / Navigation', 'maps');
eq(T.channel('https://exemple-inconnu.fr/p', {}, 'yza-shop.com'), 'Referral — exemple-inconnu.fr', 'longue traîne visible');

/* --- A2 : referrer interne et absent -> Direct, jamais "Internal" --------------- */
console.log('A2 — direct / referrer interne');
eq(T.channel('', {}, 'yza-shop.com'), 'Direct / lien enregistre', 'aucun referrer');
eq(T.channel('https://yza-shop.com/collections', {}, 'yza-shop.com'), 'Direct / lien enregistre', 'referrer interne');
eq(T.channel('https://www.yza-shop.com/x', {}, 'yza-shop.com'), 'Direct / lien enregistre', 'interne avec www');

/* --- classification des clics --------------------------------------------------- */
function el(o) {
  const self = {
    tagName: (o.tag || 'A').toUpperCase(),
    textContent: o.text || '',
    getAttribute: (k) => (o.attrs && k in o.attrs ? o.attrs[k] : null),
    closest: (sel) => {
      const anc = o.ancestors || [];
      const parts = sel.split(',').map((s) => s.trim());
      return anc.some((a) => parts.some((p) => a === p)) ? self : null;
    },
  };
  return self;
}
console.log('\nClics — destination avant conteneur');
eq(el, el, 'shim');
eq(T.classify(el({ attrs: { href: 'tel:+212600000000' } }), 'yza-shop.com').e, 'call', 'tel:');
eq(T.classify(el({ attrs: { href: 'https://wa.me/212600000000' } }), 'yza-shop.com').e, 'whatsapp_open', 'wa.me');
eq(T.classify(el({ attrs: { href: 'mailto:contact@yza-shop.com' } }), 'yza-shop.com').e, 'contact_form', 'mailto');
eq(T.classify(el({ attrs: { href: '/checkout' } }), 'yza-shop.com').e, 'checkout_start', 'checkout');
eq(T.classify(el({ attrs: { href: 'https://maps.app.goo.gl/abc' } }), 'yza-shop.com').e, 'directions', 'maps');

/* C7 : un composant construit sur <div onclick> DOIT produire un événement. Un
   sélecteur limité à "a, button" les ignorait tous, en silence. */
eq(T.classify(el({ tag: 'div', text: 'Voir les couleurs', attrs: { onclick: 'x' } }), 'yza-shop.com').e,
   'element_click', 'div onclick capturé');

/* C8a : PIÈGE D'ORDRE. Un lanceur de discussion rendu DANS l'en-tête doit rester un
   contact, pas un clic de menu. La règle conteneur ne doit jamais passer devant. */
const chatDansHeader = el({ tag: 'button', text: 'Chat', ancestors: ['[class*=chat]', 'header'] });
eq(T.classify(chatDansHeader, 'yza-shop.com').e, 'whatsapp_open', 'chat dans header != nav_click');

/* [data-track] : crochet d'adhésion, prioritaire sur le conteneur */
eq(T.classify(el({ tag: 'div', text: 'Devis', attrs: { 'data-track': 'b2b_enquiry' }, ancestors: ['header'] }), 'yza-shop.com').e,
   'b2b_enquiry', 'data-track prioritaire');

eq(T.classify(el({ tag: 'a', text: 'Boutique', attrs: { href: '/collections' }, ancestors: ['nav'] }), 'yza-shop.com').e,
   'nav_click', 'lien de menu');
eq(T.classify(el({ tag: 'summary', text: 'Quels sont les délais ?' }), 'yza-shop.com').e, 'faq_open', 'accordéon');
eq(T.classify(el({ attrs: { href: 'https://instagram.com/yzahandmade' }, text: 'Instagram' }), 'yza-shop.com').e,
   'outbound', 'sortant');
eq(T.classify(el({ tag: 'div', text: '' })), null, 'sans libellé : rien');

/* --- formulaires ---------------------------------------------------------------- */
console.log('\nFormulaires');
const form = (id) => ({ getAttribute: (k) => (k === 'id' ? id : null) });
eq(T.formEvent(form('form-contact')), 'contact_form', 'contact');
eq(T.formEvent(form('b2b-form')), 'b2b_enquiry', 'b2b');
eq(T.formEvent(form('newsletter')), 'newsletter_signup', 'newsletter');

/* --- exhaustivité de la liste d'identifiants ------------------------------------ */
console.log('\nListe des identifiants de clic');
['gclid', 'wbraid', 'gbraid', 'dclid', 'srsltid', 'fbclid', 'igshid', 'msclkid', 'ttclid',
 'twclid', 'li_fat_id', 'ScCid', 'epik', 'rdt_cid', 'mc_eid', '_kx', 'ref', 'source']
  .forEach((k) => eq(T.CLICK_IDS.indexOf(k) >= 0, true, `${k} présent dans CLICK_IDS`));

console.log(`\n${fail === 0 ? 'OK' : 'ECHEC'} — ${pass} réussis, ${fail} échoués`);
process.exit(fail === 0 ? 0 : 1);
