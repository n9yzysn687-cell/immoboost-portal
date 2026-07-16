# Sécurité ImmoBoost AI™

## État de cette version

Cette branche contient le socle commercial sécurisé. Elle n'est autorisée pour une vente publique qu'après création de la base D1 réelle, installation de la migration, configuration des secrets et réussite d'un achat de bout en bout sur les environnements de test des plateformes.

## Données et secrets

- La clé fournisseur reste exclusivement côté serveur et ne doit jamais porter le préfixe `NEXT_PUBLIC_`.
- Les réponses API sont demandées avec `store: false`.
- ImmoBoost ne persiste ni situation, ni photo, ni kit côté serveur.
- Les emails et références de commande sont stockés sous forme de HMAC-SHA256 avec une clé secrète, jamais en clair.
- Les jetons de session sont aléatoires et seul leur HMAC est stocké.
- Les liens pilote sont aléatoires, stockés uniquement sous forme de HMAC, utilisables une seule fois et expirent sans activation après 7 jours. Le jeton reste dans le fragment `#` du lien et n'est donc pas transmis dans l'URL de la requête initiale.
- Le fournisseur peut conserver des journaux de prévention des abus jusqu'à 30 jours selon ses conditions et le régime de rétention du projet.
- Les erreurs serveur ne journalisent jamais le texte, la photo, la réponse du modèle ou la clé API.
- Chaque réponse reçoit un identifiant aléatoire utilisable pour le support sans exposer le contenu de la mission.

## Contrôles actifs

- politique de sécurité du contenu et interdiction d'intégration dans une iframe ;
- HSTS, `nosniff`, politique de référent et restrictions de permissions ;
- contrôle d'origine des requêtes navigateur ;
- JSON obligatoire et limite de taille vérifiée avant et après lecture ;
- formats d'image limités à JPEG, PNG et WebP encodés en base64 ;
- normalisation et longueur maximale de la situation ;
- limitation anti-abus avec adresse client hachée ;
- limitation distribuée persistante dans D1 en mode commercial ;
- délai maximal et une seule nouvelle tentative pour les erreurs temporaires ;
- validation structurelle du kit avant affichage ;
- liens réglementaires HTTPS limités à une liste de domaines officiels ;
- absence de débit de Boost sur une mission échouée ;
- idempotence des achats, réservations et débits dans le moteur de portefeuille.
- vérification HMAC, fenêtre anti-rejeu et identifiant unique pour chaque webhook Etsy ;
- vérification HMAC et déduplication persistante pour les webhooks Lemon Squeezy ;
- cookie de session `HttpOnly`, `Secure`, `SameSite=Lax` et expiration à 30 jours ;
- export des données du compte et suppression avec révocation des licences ;
- production forcée en mode commercial fermé : l'absence du coffre bloque les missions.
- redirections de paiement limitées à Etsy, Lemon Squeezy et aux domaines de paiement Stripe explicitement autorisés ; aucune redirection libre ;
- conversion directe des comptes Etsy désactivée par défaut et protégée par un drapeau de configuration après validation de la politique applicable ;
- prochaine action exportée en fichier calendrier dans le navigateur, sans transmettre son contenu à un calendrier tiers depuis le serveur.

## Contrôles obligatoires avant vente

1. Créer la base D1 de production, appliquer `migrations/0001_commerce.sql` et vérifier la restauration Time Travel.
2. Générer puis sauvegarder `AUTH_PEPPER` dans un coffre de secrets ; ne jamais le faire tourner sans migration planifiée.
3. Lier la base au Worker sous `IMMOBOOST_DB`. Limiter le jeton API Cloudflare à la migration locale de cette seule base et ne jamais l'installer comme secret du Worker.
4. Enregistrer l'application Etsy, son OAuth et ses webhooks signés ; configurer le catalogue des identifiants de listings.
5. Configurer éventuellement Lemon Squeezy et son secret de signature pour les achats directs et abonnements.
6. Configurer `ETSY_RECHARGE_URL`, `DIRECT_RECHARGE_URL` et `DIRECT_SUBSCRIPTION_URL`. Conserver `ETSY_DIRECT_UPGRADE_ENABLED=false` sans validation écrite contraire.
7. Générer `PILOT_ADMIN_SECRET`, créer un lien test, vérifier son usage unique puis révoquer le compte pilote de contrôle.
8. Activer les plafonds de dépenses et alertes du projet fournisseur IA.
9. Exécuter les tests de bout en bout achat → activation → mission → débit → remboursement.
10. Réaliser un test d'intrusion applicatif avant l'ouverture publique.

## Règles du portefeuille

- Le solde ne peut jamais devenir négatif.
- Une mission réserve son coût avant l'appel externe.
- La réservation est débitée uniquement après validation complète du kit.
- Toute erreur libère la réservation.
- Une clé d'idempotence ne peut produire qu'un seul achat ou débit.
- Tant que le compte existe, le journal financier est append-only ; une correction utilise une nouvelle écriture compensatoire. La suppression RGPD du compte efface aussi ce journal pseudonymisé.
- Les remboursements retirent uniquement les Boosts encore disponibles et ne peuvent jamais créer un solde négatif.

## Hébergement commercial

Vercel Hobby est limité aux projets personnels non commerciaux. ImmoBoost conserve Vercel pour les previews techniques mais utilise Cloudflare Workers/OpenNext pour la production commerciale. Le plan gratuit convient au pilote sous réserve de mesurer la limite de 10 ms de CPU par invocation ; le palier payant commence à 5 USD par mois si cette limite devient insuffisante. Le domaine, les appels IA et les commissions des plateformes restent des coûts variables distincts.

## Dépendances

Le contrôle `npm run security:audit` doit être exécuté avant chaque livraison. Au 17 juillet 2026, l'audit signale quatre occurrences du même avis PostCSS modéré héritées de Next.js/OpenNext, sans correctif disponible. L'application ne transforme pas de CSS fourni par les utilisateurs, ce qui limite l'exposition à cet avis. Toute vulnérabilité élevée ou critique bloque la livraison.

## Signalement responsable

Ne jamais publier une vulnérabilité ou une donnée client dans une issue publique. Utiliser la fonctionnalité privée **Security advisories** du dépôt GitHub.
