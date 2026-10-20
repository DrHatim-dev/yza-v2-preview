<?php
/* YZA — collecteur d'evenements de premiere partie. Meme origine, sans authentification.
   Le navigateur POSTe ici ; rien ne part vers un tiers.

   TROIS NIVEAUX DE NOTIFICATION (le "pourquoi" du fichier, a lire avant de modifier) :
     CONTACT  -> une alerte immediate, un e-mail par evenement. Les moments qui valent
                 de l'argent : commande, debut de paiement, WhatsApp, formulaire, B2B.
     PARCOURS -> un e-mail quand une visite se termine, SEULEMENT si la visiteuse s'est
                 engagee sans laisser de contact. C'est la preuve qu'une visite vient du
                 marketing et pas du hasard.
     RECAP    -> un e-mail par jour : totaux, repartition, meilleures sources, bruit
                 d'engagement, et le nombre d'alertes supprimees par le budget d'envoi.
   Les micro-evenements (pages vues, defilement, clics de menu) sont STOCKES et AFFICHES
   mais jamais notifies un par un : ils se comptent en centaines par jour, ils
   enterreraient les vrais contacts et feraient marquer tout le flux comme indesirable —
   exactement l'inverse du but. */

require_once __DIR__ . '/yza-track-lib.php';
/* Import garde : si le module de notification manque (deploiement partiel), on
   definit des no-op qui signifient "rien a envoyer" plutot que de laisser une
   erreur fatale transformer chaque evenement en 500 et perdre de vrais contacts.
   Le filet ne remplace PAS l'ordre de deploiement : lib, puis notify, puis collect. */
if (is_readable(__DIR__ . '/yza-track-notify.php')) { require_once __DIR__ . '/yza-track-notify.php'; }
if (!function_exists('yza_trk_notify_lead'))  { function yza_trk_notify_lead($r) { return false; } }
if (!function_exists('yza_trk_digest_maybe')) { function yza_trk_digest_maybe() { return null; } }

/* En-tetes poses AVANT tout traitement : une reponse mise en cache avalerait les
   evenements suivants, et un 200 sans no-store est exactement ce piege. */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');

$origin = isset($_SERVER['HTTP_ORIGIN']) ? (string) $_SERVER['HTTP_ORIGIN'] : '';
$allowed = array('https://yza-shop.com', 'https://www.yza-shop.com');
if ($origin !== '' && in_array($origin, $allowed, true)) {
  header('Access-Control-Allow-Origin: ' . $origin);   // valeur EXACTE, jamais *
  header('Vary: Origin');
}

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method !== 'POST')    { http_response_code(405); echo '{"ok":false,"error":"method"}'; exit; }

/* CORS n'empeche PAS l'arrivee d'un POST simple depuis une autre origine — il empeche
   seulement d'en LIRE la reponse. On filtre donc explicitement sur Origin/Referer ;
   la limitation de debit est la mitigation restante. */
if ($origin !== '' && !in_array($origin, $allowed, true)) {
  http_response_code(403); echo '{"ok":false,"error":"origin"}'; exit;
}

/* LECTURE DU CORPS — NE JAMAIS passer d'arguments d'offset/longueur ici.
   php://input n'est pas repositionnable sans Content-Length, et les envois au moment
   ou la page se ferme (keepalive, clic sur un lien tel:) arrivent justement en chunked.
   file_get_contents('php://input', false, null, 0, N) renvoie FALSE pour toutes ces
   requetes : la version precedente de ce systeme perdait AINSI chaque clic-pour-appeler
   pendant que les fetch normaux passaient. On lit en entier, PUIS on plafonne. */
$raw = file_get_contents('php://input');
if ($raw === false) { $raw = ''; }
if (strlen($raw) > 65536) { http_response_code(413); echo '{"ok":false,"error":"size"}'; exit; }

/* On IGNORE Content-Type et on parse en JSON quoi qu'il arrive : les transports de
   secours envoient text/plain pour eviter un preflight, et un parseur conditionne au
   type rendrait un corps vide sans le moindre message d'erreur. */
$payload = json_decode($raw, true);
if ($payload === null || (!is_array($payload))) {
  http_response_code(400); echo '{"ok":false,"error":"json"}'; exit;   // un 5 ou "x" nu est refuse
}

$events = array();
if (isset($payload['batch']) && is_array($payload['batch'])) {
  if (count($payload['batch']) > 50) { http_response_code(400); echo '{"ok":false,"error":"batch"}'; exit; }
  $events = $payload['batch'];
} else {
  $events = array($payload);
}

/* --- exclusion interne : AVANT stockage, compteurs, parcours et notifications ------
   Filtrer seulement a l'affichage laisserait quand meme partir l'alerte et
   empoisonnerait les compteurs deja ecrits. On repond 200 EXPRES : le navigateur n'a
   rien fait de mal, et un 4xx ferait re-tenter cet evenement indefiniment. */
$ip     = yza_trk_ip();
$ipHash = yza_trk_ip_hash($ip);
if (yza_trk_cookie_optout() || yza_trk_ip_is_internal($ip)) {
  echo json_encode(array('ok' => true, 'ignored' => 'internal'));
  exit;
}

/* --- robots declares (2026-09-30) ------------------------------------------------
   Storebot-Google (Merchant Center) parcourt le tunnel de commande pour le verifier : ses
   pages vues, ajouts au panier et « paiement commence » gonflaient les chiffres comme
   ceux d'une cliente. Meme liste que le registre des paiements. Import garde, comme pour
   les notifications : une lib manquante ne doit pas transformer chaque evenement en 500. */
if (is_readable(__DIR__ . '/checkout-store-lib.php')) { require_once __DIR__ . '/checkout-store-lib.php'; }
if (function_exists('yza_co_bot_ua') && yza_co_bot_ua(isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '')) {
  echo json_encode(array('ok' => true, 'ignored' => 'bot'));
  exit;
}

/* --- garde anti-abus : ~60 evenements / 60 s par empreinte d'IP -------------------
   Un visiteur engage reste tres en dessous (1 page vue + 4 paliers de defilement +
   quelques clics + sortie) ; un script, non. Le seau incremente est persiste AVANT de
   repondre 429, sinon etre limite remettrait le compteur a zero. */
$now = time();
if ($ipHash !== '') {
  $over = yza_trk_state(function (&$st) use ($ipHash, $now) {
    yza_trk_sweep($st, $now);
    if (!isset($st['rl']) || !is_array($st['rl'])) { $st['rl'] = array(); }
    $b = isset($st['rl'][$ipHash]) && is_array($st['rl'][$ipHash]) ? $st['rl'][$ipHash] : array('n' => 0, 't' => $now);
    if (($now - (int) $b['t']) > 60) { $b = array('n' => 0, 't' => $now); }
    $b['n'] = (int) $b['n'] + 1;
    $st['rl'][$ipHash] = $b;
    return $b['n'] > 60;
  });
  if ($over === true) { http_response_code(429); echo '{"ok":false,"error":"rate"}'; exit; }
}

/* --- politique des contacts : UNE liste nommee, cote serveur ----------------------
   Le client emet des noms d'evenements neutres et ignore lesquels sont "chauds".
   Changer la politique de notification se fait ICI, en une ligne — sans reconstruire
   le JavaScript ni vider le cache du CDN. */
$LEADS = array('order_placed', 'checkout_start', 'whatsapp_open', 'contact_form',
               'b2b_enquiry', 'add_to_cart', 'newsletter_signup');
/* Un booleen par type limite : la cliente change d'avis sans toucher au code. */
$NOTIFY = array(
  'order_placed'     => true,
  /* 2026-08-24 : PASSES A false. Ces deux evenements ne portent AUCUNE identite — leur
     charge utile est {via:"lien"} ou {via:"bouton"}, rien d'autre. Chaque ouverture de
     la bulle de discussion declenchait donc un e-mail « Nouveau contact » pour quelqu'un
     d'introuvable ; et la bulle etant une bascule, l'ouvrir puis la fermer en envoyait
     deux. Le 23/08 : 72 whatsapp_open et 64 checkout_start pour zero personne joignable.
     Ce bruit consommait aussi le budget global de 40 alertes/heure (yza-track-notify.php
     :20-36), qui a deja avale de vraies alertes de contact. Ils restent COMPTES dans le
     recapitulatif quotidien — on ne perd rien, on cesse seulement de sonner pour rien. */
  'checkout_start'   => false,
  'whatsapp_open'    => false,
  'contact_form'     => true,
  'b2b_enquiry'      => true,
  'add_to_cart'      => false,   // volume trop eleve : compte dans le rapport, pas d'alerte
  /* 2026-08-11 : PASSE A true. La pop-up « -10 % » etait jusqu'ici classee a tort en
     `contact_form` (son <form> n'a ni id ni name), et c'est ce mauvais classement qui
     faisait arriver ses inscriptions dans la boite. Maintenant qu'elle est correctement
     rangee en newsletter, la laisser a false aurait fait DISPARAITRE les alertes des 19
     seules vraies adresses collectees a ce jour. Le bruit qu'on voulait supprimer, c'etait
     les envois VIDES — traites en amont dans yza-track.js, pas ici. */
  'newsletter_signup'=> true,
);

/* LISTE BLANCHE DES CLES DE `data` — APPLIQUEE COTE SERVEUR, pas seulement dans le
   navigateur. Le tracker filtre deja les champs de formulaire, mais ce point d'entree
   est PUBLIC : n'importe qui peut y poster, et une future modification du JavaScript
   pourrait se remettre a envoyer un corps de message. Un filtrage uniquement cote
   client ferait finir du texte libre — potentiellement une donnee de sante, juridique
   ou financiere tapee dans un formulaire — dans un fichier d'analyse.
   DEFAUT REEL, trouve en verifiant le magasin apres le premier envoi de test : le champ
   `message` d'un formulaire de contact etait bien stocke.
   Tout ce qui n'est pas ici est jete en silence. Ajouter une cle demande de se demander
   d'abord si c'est du texte libre. */
$DATA_OK = array(
  // identite / contact (deja limites a 120 caracteres en amont)
  'name', 'nom', 'prenom', 'phone', 'tel', 'telephone', 'whatsapp', 'email', 'mail',
  'subject', 'sujet', 'company', 'societe', 'ville', 'city',
  // commerce
  'value', 'order', 'currency',
  // contexte d'interaction
  'via', 'app', 'label', 'tag', 'host', 'question', 'file', 'depth', 'newSession',
  // mesures de sortie de page
  'secondsOnPage', 'engagedSeconds', 'maxScroll', 'eventCount',
);

$stored = 0; $notified = 0; $failed = false; $via = '';
$dir = yza_trk_dir();

foreach ($events as $ev) {
  if (!is_array($ev)) { continue; }
  $name = isset($ev['event']) ? yza_trk_cut($ev['event'], 40) : '';
  if ($name === '') { continue; }                    // sans nom : ignore en silence

  /* HORODATAGE : on garde celui du client s'il est plausible (+/- 48 h), sinon l'heure
     de reception. Estampiller toute la requete a l'heure serveur re-daterait chaque
     evenement d'une file rejouee des heures plus tard et detruirait la chronologie sur
     laquelle repose tout le rapport de parcours. */
  $ts = isset($ev['ts']) ? strtotime((string) $ev['ts']) : false;
  if ($ts === false || abs($now - $ts) > 172800) { $ts = $now; }

  $rec = array(
    'ts'       => gmdate('c', $ts),
    'seq'      => isset($ev['seq']) ? (int) $ev['seq'] : 0,
    'event'    => $name,
    'page'     => yza_trk_cut(isset($ev['page']) ? $ev['page'] : '', 200),
    'title'    => yza_trk_cut(isset($ev['title']) ? $ev['title'] : '', 140),
    'lang'     => yza_trk_cut(isset($ev['lang']) ? $ev['lang'] : '', 5),
    'visitor'  => yza_trk_cut(isset($ev['visitor']) ? $ev['visitor'] : '', 40),
    'session'  => yza_trk_cut(isset($ev['session']) ? $ev['session'] : '', 40),
    'referrer' => yza_trk_cut(isset($ev['referrer']) ? $ev['referrer'] : '', 300),
    'first'    => yza_trk_clean(isset($ev['firstTouch']) ? $ev['firstTouch'] : array()),
    'device'   => yza_trk_clean(isset($ev['device']) ? $ev['device'] : array()),
    'params'   => yza_trk_clean(isset($ev['params']) ? $ev['params'] : array()),
    'data'     => yza_trk_pick(yza_trk_clean(isset($ev['data']) ? $ev['data'] : array()), $DATA_OK),
    'ipHash'   => $ipHash,
    'ipCoarse' => yza_trk_ip_coarse($ip),
    'lead'     => in_array($name, $LEADS, true) ? 1 : 0,
  );

  // Preserve diagnostic labels only for known checkout events. Never persist field values.
  if (in_array($name, array('checkout_validation_error', 'checkout_request_failure', 'checkout_order_rejected', 'checkout_submit', 'checkout_stage'), true)) {
    $diagnosticInput = isset($ev['data']) && is_array($ev['data']) ? $ev['data'] : array();
    $diagnosticLabels = array(
      'stage' => array('cart','shipping','payment','done'),
      'payment_type' => array('cod','card'),
      'field' => array('name','phone','email','address','city','country','zip','note'),
      'reason' => array('required','invalid_email','invalid_phone','invalid_country','timeout','http','network_or_response'),
      'trigger' => array('continue'),
      'endpoint' => array('order','card_create','card_status'),
    );
    // Diagnostics must not inherit the contact keys accepted for actual lead events.
    $rec['data'] = array();
    foreach ($diagnosticLabels as $key => $labels) {
      if (isset($diagnosticInput[$key]) && is_string($diagnosticInput[$key]) && in_array($diagnosticInput[$key], $labels, true)) $rec['data'][$key] = $diagnosticInput[$key];
    }
    if (isset($diagnosticInput['status']) && is_scalar($diagnosticInput['status']) && preg_match('/^[1-5][0-9]{2}$/', (string)$diagnosticInput['status'])) $rec['data']['status'] = (string)$diagnosticInput['status'];
  }

  /* UN FORMULAIRE SANS COORDONNEE VALABLE N'EST PAS UN CONTACT (2026-09-30).
     yza-track.js journalise l'envoi AVANT que le formulaire ne le valide : le 29/09,
     quatre « newsletter_signup » portaient l'e-mail « a », et chacun a declenche une
     alerte « nouveau contact » pour une personne injoignable. La ligne est gardee (le
     parcours reste lisible), sans le statut de contact — donc sans alerte ni compteur. */
  if ($rec['lead'] && in_array($name, array('newsletter_signup', 'contact_form', 'b2b_enquiry'), true)) {
    $joignable = false;
    foreach (array('email', 'mail') as $k) {
      if (!empty($rec['data'][$k]) && filter_var((string) $rec['data'][$k], FILTER_VALIDATE_EMAIL)) { $joignable = true; }
    }
    foreach (array('phone', 'tel', 'telephone', 'whatsapp') as $k) {
      $chiffres = !empty($rec['data'][$k]) ? preg_replace('/\D/', '', (string) $rec['data'][$k]) : '';
      if (strlen($chiffres) >= 9 && strlen($chiffres) <= 15) { $joignable = true; }
    }
    if (!$joignable) { $rec['lead'] = 0; $rec['incomplet'] = 1; }
  }

  /* ANTI-DOUBLON SUR LES CONTACTS (2026-08-11).
     Quand UN evenement d'un lot echoue a l'ecriture, la reponse est 5xx et le navigateur
     remet TOUT le lot en file (yza-track.js, send(body, true)) : les evenements deja
     ecrits repartent a l'identique. Preuve relevee dans le journal du 11/08 : 20 lignes
     `checkout_start` pour 10 clics reels, avec des `seq` IDENTIQUES dans la meme session
     — donc une seule emission navigateur, deux ecritures serveur. Chaque doublon
     declenchait aussi un e-mail d'alerte.
     La cle (session|seq|event) identifie un evenement de facon unique : `seq` est un
     compteur par chargement de page, jamais reutilise dans une session.
     On ne desactive PAS le re-essai : il protege les contacts en cas de vraie panne. On
     ne dedoublonne QUE les contacts (une centaine au total), pour ne pas payer un verrou
     par page vue — le bruit d'engagement peut rester approximatif, pas les leads. */
  if ($rec['lead']) {
    $cle = substr(sha1($rec['session'] . '|' . $rec['seq'] . '|' . $rec['event']), 0, 16);
    $dejaVu = yza_trk_state(function (&$st) use ($cle, $now) {
      if (!isset($st['seen']) || !is_array($st['seen'])) { $st['seen'] = array(); }
      if (isset($st['seen'][$cle])) { return true; }              // deja encaisse
      $st['seen'][$cle] = $now;
      if (count($st['seen']) > 600) {                              // fenetre glissante
        asort($st['seen']);
        $st['seen'] = array_slice($st['seen'], -400, null, true);
      }
      return false;
    });
    if ($dejaVu === true) { $stored++; continue; }                 // compte, n'ecrit pas, n'alerte pas
  }

  /* STOCKER PUIS DECIDER : l'ecriture passe avant compteurs et notifications, et un
     echec d'envoi ne doit jamais annuler le stockage. L'e-mail est la partie fragile ;
     la preuve doit survivre a une panne du serveur de mail. */
  if ($dir) {
    $file = $dir . '/events-' . gmdate('Y-m', $ts) . '.jsonl';
    $line = json_encode($rec, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    /* On VERIFIE le resultat de l'ecriture. La version precedente l'ignorait et
       incrementait "stored" quand meme : un disque plein renvoyait {"ok":true,
       "stored":3} sans rien avoir ecrit. Un echec doit rendre 5xx pour que la file
       du navigateur conserve l'evenement. */
    $w = @file_put_contents($file, $line, FILE_APPEND | LOCK_EX);
    if ($w === false || $w < strlen($line)) { $failed = true; } else { $stored++; }
  } else {
    $failed = true;
  }

  if ($rec['lead']) {
    yza_trk_state(function (&$st) use ($rec, $now) {
      yza_trk_sweep($st, $now);
      $d = yza_trk_local_day($rec['ts']);
      if (!isset($st['days'][$d]) || !is_array($st['days'][$d])) { $st['days'][$d] = array('leads' => 0, 'suppressed' => 0); }
      $st['days'][$d]['leads'] = (int) $st['days'][$d]['leads'] + 1;
      return null;
    });
  }

  if ($rec['lead'] && !empty($NOTIFY[$name])) {
    $t = yza_trk_notify_lead($rec);
    if ($t) { $notified++; $via = $t; }
  }
}

/* Le recapitulatif quotidien part paresseusement au premier evenement apres minuit :
   il n'y a pas de cron garanti sur cet hebergement. Le signet n'avance QUE sur un envoi
   confirme, et on boucle sur TOUS les jours en attente — sinon un jour sans trafic ne
   serait jamais envoye ni rattrape. */
yza_trk_digest_maybe();

if ($failed && $stored === 0) {
  http_response_code(500);
  echo json_encode(array('ok' => false, 'error' => 'store'));
  exit;
}
/* `via` dit PAR QUEL transport l'alerte est partie. Sans lui, {"notified":1}
   ne distingue pas un envoi remis d'un envoi avale en silence. */
echo json_encode(array('ok' => true, 'stored' => $stored, 'notified' => $notified, 'via' => $via));
