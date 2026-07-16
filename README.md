# ImmoBoost AI™

L'assistant intelligent qui comprend une situation immobilière et prépare immédiatement la meilleure solution.

## Version 0.7 — Accès commercial sécurisé

Le parcours principal est maintenant opérationnel :

- une seule question d'entrée : « Que se passe-t-il aujourd'hui ? » ;
- saisie texte, dictée vocale et ajout de photo ;
- sélection automatique de l'expert métier ;
- génération directe dans ImmoBoost, sans redirection ni copier-coller vers une autre IA ;
- kit structuré : diagnostic, objectif, plan, email, SMS, script d'appel, checklist, documents et prochaine action ;
- ajout de la prochaine action au calendrier du téléphone en un clic, sans OAuth ni stockage serveur ;
- liste « Aujourd'hui » alimentée automatiquement par les kits et conservée uniquement sur l'appareil ;
- Growth Pack déclenché automatiquement pour les besoins marketing : annonce, Instagram, Facebook, LinkedIn, publicité, Reel, brief Canva et prompts IA ;
- textes adaptés à chaque canal au lieu d'un même contenu dupliqué ;
- copie individuelle ou copie du pack marketing complet en une action ;
- recherche web limitée aux demandes réglementaires belges ;
- historique de réponse API désactivé (`store: false`) ;
- isolation du fournisseur IA derrière une interface remplaçable ;
- validation d'origine, de type, de taille et de format sur chaque requête ;
- limitation anti-abus sans conservation d'adresse IP en clair ;
- filtrage des liens réglementaires vers une liste de domaines officiels ;
- délais, nouvelle tentative contrôlée et erreurs sans fuite de données ;
- passeport de données visible dans chaque kit ;
- moteur de Boosts idempotent : réservation, débit après succès et libération après échec ;
- portefeuille persistant et transactionnel dans Cloudflare D1 ;
- activation sans mot de passe avec email et référence de commande hachés ;
- sessions de 30 jours dans un cookie `HttpOnly`, `Secure` et `SameSite` ;
- intégration Etsy `order.paid`/`order.canceled` avec signature, anti-rejeu et licence automatique ;
- intégration Lemon Squeezy optionnelle pour achats directs, recharges et abonnements ;
- ventes directes, recharges et abonnements indépendants d'Etsy via un checkout ImmoBoost ;
- liens pilote personnels, gratuits, à usage unique et à durée limitée ;
- export et suppression du compte ;
- limitation distribuée entre toutes les instances ;
- pack pays belge explicite et versionné ;
- en-têtes HTTP de sécurité et politique CSP ;
- interface premium, responsive et mobile-first.

## Lancer le projet

```bash
npm install
cp .env.example .env.local
npm run dev
```

Renseigner `OPENAI_API_KEY` dans `.env.local`. Les missions courantes utilisent `OPENAI_MODEL` et les missions complexes `OPENAI_MODEL_COMPLEX`.

La clé reste exclusivement côté serveur. Elle ne doit jamais être préfixée par `NEXT_PUBLIC_` ni envoyée au navigateur.

## Parcours client sans compte complexe

1. Le fichier numérique livré par Etsy contient le lien ImmoBoost et une instruction unique.
2. À la première visite, l'agent saisit l'email d'achat et sa référence de commande.
3. ImmoBoost valide la vente, ouvre une session sécurisée de 30 jours et affiche seulement le solde disponible dans l'en-tête.
4. Les visites suivantes arrivent directement sur « Que se passe-t-il aujourd'hui ? », sans mot de passe ni tableau de bord.
5. « Ajouter des Boosts » renvoie automatiquement un client Etsy vers la fiche de recharge Etsy, et un client direct vers le checkout direct autorisé.

L'espace personnel est volontairement réduit au solde, à la recharge, à l'export des données, à la fermeture de session et à la suppression du compte.

## Canaux de vente et pilotes

Etsy et les autres marketplaces sont des canaux d'acquisition one-shot. Le produit, le portefeuille et la relation client vivent sur ImmoBoost. Les visiteurs acquis directement et les pilotes peuvent acheter ou s'abonner via `DIRECT_RECHARGE_URL` et `DIRECT_SUBSCRIPTION_URL`, avec Lemon Squeezy ou un lien de paiement Stripe autorisé.

Pour un compte provenant d'Etsy, le passage vers un paiement direct reste désactivé par défaut. `ETSY_DIRECT_UPGRADE_ENABLED=true` ne doit être activé qu'après validation écrite de la politique Etsy applicable. Cette barrière commerciale est indépendante de l'architecture : le même compte accepte déjà de nouvelles licences issues du canal direct.

La page privée `/pilot` permet au propriétaire de générer depuis son téléphone un lien test à usage unique pour l'email professionnel du testeur. L'email est immédiatement haché, le lien doit être activé dans les 7 jours, ouvre directement une session et contient entre 3 et 50 Boosts pour 1 à 30 jours. Si le testeur achète ensuite directement avec le même email, sa licence rejoint le même compte.

## Vérifier avant livraison

```bash
npm run typecheck
npm test
npm run build
npm run security:audit
npm run build:cloudflare
```

## Sécurité et mise en production

Consulter `SECURITY.md` avant tout déploiement commercial.

### Mise en service commerciale avec coût fixe minimal

Vercel Hobby est réservé aux usages personnels non commerciaux. Les previews de Pull Request peuvent y rester, mais la production ImmoBoost doit être déployée sur Cloudflare Workers avec l’adaptateur OpenNext déjà configuré dans ce dépôt. Le plan Workers Free permet de valider les premières ventes, avec 100 000 requêtes par jour mais une limite de 10 ms de CPU par invocation. Le bundle ImmoBoost pèse environ 943 KiB compressé, sous la limite gratuite de 3 MiB. Si les mesures réelles dépassent la limite CPU, le plan Workers Paid commence à 5 USD par mois ; aucun passage payant n’est automatique.

1. Créer la base avec `npx wrangler d1 create immoboost`.
2. Ajouter à `wrangler.jsonc` le bloc `d1_databases` rendu par Wrangler, avec le binding nommé exactement `IMMOBOOST_DB`.
3. Créer localement un jeton limité à cette seule base, renseigner les trois variables `CLOUDFLARE_*`, puis exécuter `npm run db:migrate`.
4. Stocker `AUTH_PEPPER`, `PILOT_ADMIN_SECRET`, les secrets Etsy/Lemon et les clés IA avec `npx wrangler secret put NOM_DU_SECRET`. Le jeton D1 REST sert à la migration locale et ne doit pas être ajouté au Worker : l’application utilise le binding D1 natif.
5. Configurer les webhooks Etsy et/ou Lemon Squeezy vers `/api/webhooks/etsy` et `/api/webhooks/lemon`.
6. Valider un achat test complet avant le premier client.
7. Déployer avec `npm run deploy:cloudflare`.

Le lancement commercial ne doit pas utiliser `COMMERCE_MODE=preview`. Hors environnement de développement ou preview Vercel explicitement identifié, le code force le mode sécurisé et bloque les missions si le coffre commercial est absent.
