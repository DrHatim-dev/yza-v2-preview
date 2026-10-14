# YZA — Journal et messages de service, 14 octobre 2026

Cette release ciblée est publiée sur https://yza-shop.com/journal. Elle s’appuie sur la version V2 actuellement en production, avec la mise à jour des prix et paiements du 13 octobre, et conserve la révision canonique `rel-20261013213004-297feb595a65`.

Les messages des services sont simplifiés dans les cinq langues :

- **Livraison suivie internationale.** Maroc : 50 DH · Union européenne : 20 € · autres destinations : 50 €.
- **Garantie à vie.** À l’atelier de Marrakech. Premier retour sous 30 jours : 100 % pris en charge par YZA.
- **Paiement sécurisé.** Maroc : carte bancaire ou paiement à la livraison. International : carte bancaire.

Les conditions détaillées de retour sont conservées dans les rubriques prévues pour cela. Les fonctionnalités de paiement, prix, remises, frais de livraison et collecte des coordonnées restent inchangées.

Le Journal utilise des vignettes portrait 3:4 avec un point de cadrage individuel pour chacune des dix photos originales. La une utilise un cadrage 4:5. Les trente vignettes associées aux articles lisibles reçoivent le même cadrage. Les titres restent limités à deux lignes, leur texte complet reste conservé. Les images, les textes et les boutons sont alignés par rangée.

Les trois visuels des « pièces du Journal » passent en 4:5 : panier La Sculpture mis en scène avec des fruits, charm citron tenu dans la main et chemise Jawhara blanche portée. Ce sont des photos déjà présentes sur le site. Les dimensions HTML correspondent aux dimensions réelles des fichiers. Les photos originales ne sont pas modifiées ; le cadrage est appliqué par CSS. Les descriptions alternatives des trois nouveaux visuels sont mises à jour pour décrire la nouvelle image.

Le style du header et du footer est conservé ; seuls les messages de service demandés changent. Les titres, dates, paragraphes, URLs, canonical et métadonnées SEO des pages sont conservés. Les nouvelles versions des scripts partagés sont référencées dans les pages concernées. Les autres règles du template de lecture restent inchangées.

## Vérification et publication

65 fichiers publics existants ont été installés avec garde SHA-256, sauvegarde serveur et remplacement atomique des fichiers. Leur contenu a été vérifié sur le serveur puis par HTTP. Quatre routes canoniques ont été contrôlées : Journal, checkout et deux articles.

Douze scénarios navigateur passent avant publication et douze sur les fichiers en production : mobile 360/390 px, tablette 768 px, ordinateur 1440 px, cinq langues, messages des services, 33 références du catalogue, ratios, images chargées et visibles, alignement, titres sur deux lignes, filtres et archives. Les requêtes d’écriture sont bloquées pendant ces vérifications. Le contrat du catalogue est valide et la release produit/prix est inchangée. Aucun formulaire réel, commande ou paiement n’a été soumis.

`after/` contient les seuls fichiers modifiés. `manifest.tsv` et `files.tar.gz` sont utilisés par `deploy.sh check` / `deploy.sh swap` depuis le dossier de release hors docroot. Le ZIP est une mise à jour ciblée, pas une copie complète du site ou de ses médias. La sauvegarde serveur `rollback-before.tar.gz` permet `rollback.sh check` / `rollback.sh restore`, avec refus si un fichier a été modifié par une release ultérieure.

Les données confidentielles, secrets et données clients sont exclus du package et de GitHub. Les éléments de vérification sont stockés dans cette release ; les captures visuelles sont aussi incluses dans le ZIP.
