# YZA Journal — publication du 12 octobre 2026

Les dix articles de Nawal fournis par Hatim sont publiés dans le Journal : https://yza-shop.com/journal#articles-nawal. Les dix photographies originales du dossier `Downloads/blogs thumbnails yza` suivent les indications des captures, y compris les deux photographies distinctes des articles 6 et 7. Les originaux sont conservés à l'identique sur le serveur et dans GitHub ; le CDN Hostinger peut recomprimer les JPEG distribués, avec leurs dimensions conservées.

Les photos intégrées dans les textes proviennent du premier produit ou lien pertinent de la galerie publique du site lorsque cette image est disponible. Les liens produits utilisent le catalogue actuel. Les 30 anciens articles restent accessibles. Les dix nouvelles pages sont en français, signées Nawal ; aucune traduction n'a été inventée.

## Articles publiés

1. [Les breloques fruits en raffia](https://yza-shop.com/blogs/journal/breloques-fruits-raffia-tendance-bijou-ete-2026/)
2. [Que porter à Marrakech quand il fait 40 °C](https://yza-shop.com/blogs/journal/que-porter-marrakech-40-degres/)
3. [La marque de mode locale à acheter à Marrakech](https://yza-shop.com/blogs/journal/marque-mode-locale-marrakech/)
4. [Que porter à Marrakech au printemps](https://yza-shop.com/blogs/journal/que-porter-marrakech-printemps/)
5. [Comment une seule taille va du XS au XXL](https://yza-shop.com/blogs/journal/no-size-xs-xxl/)
6. [Un peu de Marrakech sous le sapin](https://yza-shop.com/blogs/journal/cadeau-noel-marrakech/)
7. [Le cadeau de demoiselle d'honneur](https://yza-shop.com/blogs/journal/cadeau-demoiselle-honneur/)
8. [Trois techniques de raffia utilisées à l'atelier YZA](https://yza-shop.com/blogs/journal/techniques-raffia-atelier-yza/)
9. [Où faire du shopping durable à Marrakech](https://yza-shop.com/blogs/journal/shopping-durable-marrakech/)
10. [Combien de temps dure un panier YZA ?](https://yza-shop.com/blogs/journal/duree-panier-yza/)

## Ajustements éditoriaux et présentation

Deux mentions de prix anciennes ont été actualisées à partir du catalogue public : article 3, 40 à 65 € ; article 6, à partir de 40 €. Le top bateau utilise l'alias existant vers le top bandeau Jawhara ; La Vague renvoie vers la collection Sacs, car le modèle initial n'est pas actif dans le catalogue. Aucune page Wedding n'a été inventée.

Les nouvelles pages reprennent les styles et scripts de la V2 en production. Leurs titres sont dimensionnés pour rester lisibles et le bloc de garanties dupliqué au-dessus du texte est masqué ; le pied de page conserve les informations de service partagées. Les dix cartes sont placées avant les anciens articles.

## Déploiement et preuves

Publication ciblée de 23 fichiers : dix HTML, dix JPEG, une CSS, l'index du Journal et le sitemap. Les hashes initiaux de l'index et du sitemap ont été vérifiés avant remplacement. Les 23 hashes finaux correspondent sur le serveur. Les 23 ressources publiques répondent 200 ; les dix nouvelles URL figurent une seule fois dans le sitemap public dynamique. La révision du catalogue demeure `rel-20261009173024-a273053f4a0b` et le popup newsletter reste désactivé.

Les tests Chrome ont vérifié le Journal et les dix articles sur mobile, puis le Journal et le premier article sur ordinateur : photos chargées, titres exacts, canonicals, trois FAQ, trois liens produits par page et absence de débordement horizontal. Inspection visuelle des couvertures, de la grille et des articles 1, 6 et 7. Les tests bloquent toute écriture et ne créent aucune commande ni inscription. Le sitemap mis à jour ne prouve pas l'indexation Google.

Sauvegarde serveur : `/home/u800901920/yza-journal-articles-20261012/before.tar.gz` (index et sitemap précédents). Le dossier contient aussi le manifeste et un rollback protégé contre les modifications intervenues depuis cette publication.

GitHub : https://github.com/DrHatim-dev/yza-v2-preview/pull/2, branche `codex/journal-articles-20261012`, base `codex/v2-preview`. Le package complet est enregistré sous `release-snapshots/journal-20261012/` ; la PR reste ouverte. Le site a été publié manuellement, indépendamment de la PR.

Fichiers de travail : `artifacts/journal-articles-20261012/` avec textes, photos, manifeste, rapports et captures. Les 21 ajouts ont aussi été copiés dans `source/` ; ses index et sitemap historiques ont reçu uniquement les ajouts éditoriaux. Les autres sections et modifications locales ont été préservées, avec copie locale des deux fichiers précédents dans `source-before/`. Le dossier `source/` complet contient toujours des travaux non publiés et ne doit pas remplacer la production V2.
