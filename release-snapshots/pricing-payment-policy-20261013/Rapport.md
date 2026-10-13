# YZA — Prix et moyens de paiement, 13 octobre 2026

Publié et vérifié sur https://yza-shop.com/checkout.html.

Le catalogue conserve ses 33 références, dont 32 actives. Vingt produits correspondent au document transmis : 17 prix internationaux ont été corrigés, 3 étaient déjà corrects. Les prix Maroc renseignés correspondent déjà au catalogue. Le prix Maroc du charm avocat n’est pas renseigné dans le PDF : son prix de 380 DH est conservé. Les 13 autres références du catalogue conservent leurs deux tarifs. Aucun produit n’a été créé ou activé.

La liste complète des produits existants et de leurs tarifs avant/après se trouve dans `Prix-produits-existants.csv`. Les coûts, marges, prix B2B, références futures, identifiants internes du document et le PDF confidentiel sont exclus de cette mise à jour et de GitHub.

Le tarif Maroc est réservé aux connexions géolocalisées au Maroc. Tous les autres pays utilisent le tarif international en euros, y compris USA, Golfe, Afrique et Asie. Une localisation inconnue utilise le tarif international. La décision vient du serveur ; changer un champ du navigateur ne donne pas accès au tarif Maroc. Le règlement par carte continue en MAD au taux existant de 11 DH par euro, annoncé avant le paiement.

Pour une livraison au Maroc, le checkout propose paiement à la livraison et carte bancaire. Pour toute livraison internationale, il propose uniquement la carte. Les nouveaux virements Maroc et euro sont rejetés côté serveur. Les instructions et coordonnées de virement ont été retirées du checkout ; les textes de paiement du panier, des fiches produit et des services ont été actualisés dans les cinq langues. Les anciennes commandes restent dans leur historique.

Livraison conservée : Maroc 50 DH, Union européenne 20 €, autres pays 50 €. Les remises et coupons restent inchangés. Les parcours de collecte des coordonnées et leads restent en place.

Vérification : 277 contrôles sur les règles et projections ; 34 contrôles sur le catalogue, la géolocalisation réelle du serveur et la validation des montants ; 13 scénarios navigateur avant publication et 13 sur les fichiers en production, avec les 5 langues, mobile/ordinateur et anciennes demandes enregistrées. Les pays des scénarios navigateur sont simulés ; leurs requêtes de commande sont interceptées. Quatre requêtes HTTP invalides réelles confirment le rejet des virements et du paiement à la livraison à l’étranger. Aucun paiement réel ni commande valide n’a été effectué.

Les 68 fichiers installés ont été vérifiés sur le serveur. Les 63 fichiers publics statiques ont aussi été vérifiés par SHA-256 via HTTP, ainsi que les versions de scripts sur le checkout, le Journal et un article. Les pages du Journal conservent leur mise en page ; leurs seuls changements sont les versions des scripts partagés. Le popup newsletter reste désactivé.

Release canonique : `rel-20261013213004-297feb595a65`.

## Livraison technique

`after/` contient uniquement les fichiers publics modifiés. `files.tar.gz` et `manifest.tsv` permettent la publication ciblée avec vérification des fichiers précédents. Les tarifs sont stockés dans les releases SQL immuables via la proposition et l’approbation natives du catalogue, avec audit et contrôle de concurrence. Le fichier physique `catalog-current.js` n’a pas été remplacé.

Le ZIP est une mise à jour ciblée, pas une copie complète du site ni de ses médias. Ne pas le déposer intégralement dans le docroot : les scripts de publication doivent rester dans le dossier de release hors docroot. La sauvegarde serveur des fichiers remplacés est `rollback-before.tar.gz`. `rollback.sh check` contrôle la possibilité de retour arrière sans modification ; `rollback.sh restore` restaure d’abord les prix par le workflow natif puis les fichiers, et refuse une release ultérieure.
