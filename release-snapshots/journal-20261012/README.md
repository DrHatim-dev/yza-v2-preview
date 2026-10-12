# YZA Journal — dix articles de Nawal, 12 octobre 2026

Publication préparée à partir des dix textes et dix photographies fournis par Hatim. Les JPEG sont conservés à l'identique. Les couvertures suivent les captures de référence ; les articles 6 et 7 utilisent leurs deux photographies distinctes. Une photo de la galerie du premier produit ou lien du site est ajoutée dans l'article quand elle est disponible.

Le dossier `staging/` contient exactement 23 fichiers publics : dix articles, dix couvertures, une feuille de style, l'index du Journal et le sitemap. Les 30 anciens articles restent accessibles. Les articles sont en français, signés Nawal et datés du 12 octobre 2026. Aucun texte traduit n'a été inventé.

Deux mentions de prix ont été actualisées sur la base du catalogue public : article 3, 40 à 65 € ; article 6, à partir de 40 €. Le top bateau utilise l'alias existant du top bandeau Jawhara ; La Vague renvoie à la collection Sacs, car ce modèle n'est pas un produit actif du catalogue actuel.

Ces fichiers utilisent les chemins et scripts actuels de la production V2. Le dépôt de prévisualisation a des chemins différents : cette sauvegarde ne remplace pas sa racine. Ne jamais déployer tout le dossier historique `source/` sur la V2.

Déploiement manuel ciblé sur Hostinger. `manifest.tsv` vérifie les fichiers préparés et l'état initial de l'index et du sitemap. Les fichiers sont installés après sauvegarde, puis vérifiés par SHA-256. Les assets précèdent les articles ; l'index et le sitemap sont installés en dernier. Le serveur conserve `before.tar.gz` et `rollback.sh` dans `/home/u800901920/yza-journal-articles-20261012`.

Validation : dix textes/pages, dix couvertures originales, 25 cibles publiques, dix nouvelles URL de sitemap, et onze pages testées dans Chrome sur téléphone et ordinateur. Les tests bloquent toutes les requêtes d'écriture et ne créent aucune commande ou inscription. Les rapports de validation accompagnent la sauvegarde. L'accessibilité d'un sitemap ne prouve pas l'indexation dans Google.
