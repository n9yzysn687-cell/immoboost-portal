# Sécurité ImmoBoost AI™

## État de cette version

Cette branche pose les fondations de sécurité mais n'est pas encore autorisée pour une facturation publique. Le produit ne passera en production commerciale qu'après raccordement des comptes, licences et Boosts à une base transactionnelle persistante.

## Données et secrets

- La clé fournisseur reste exclusivement côté serveur et ne doit jamais porter le préfixe `NEXT_PUBLIC_`.
- Les réponses API sont demandées avec `store: false`.
- ImmoBoost ne persiste actuellement ni situation, ni photo, ni kit côté serveur.
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
- délai maximal et une seule nouvelle tentative pour les erreurs temporaires ;
- validation structurelle du kit avant affichage ;
- liens réglementaires HTTPS limités à une liste de domaines officiels ;
- absence de débit de Boost sur une mission échouée ;
- idempotence des achats, réservations et débits dans le moteur de portefeuille.

## Contrôles obligatoires avant vente

1. Remplacer le limiteur local par un limiteur distribué Cloudflare.
2. Implémenter les comptes et sessions avec cookies `Secure`, `HttpOnly` et `SameSite`.
3. Stocker les licences et le journal des Boosts dans D1 avec transactions et contraintes d'unicité.
4. Vérifier cryptographiquement les webhooks du prestataire de paiement.
5. Ajouter sauvegarde, export et suppression des données du compte.
6. Activer les plafonds de dépenses et alertes du projet fournisseur.
7. Exécuter les tests de bout en bout achat → mission → débit → remboursement.
8. Réaliser un test d'intrusion applicatif avant l'ouverture publique.

## Règles du portefeuille

- Le solde ne peut jamais devenir négatif.
- Une mission réserve son coût avant l'appel externe.
- La réservation est débitée uniquement après validation complète du kit.
- Toute erreur libère la réservation.
- Une clé d'idempotence ne peut produire qu'un seul achat ou débit.
- Le journal financier est append-only ; une correction utilise une nouvelle écriture compensatoire.

## Dépendances

Le contrôle `npm run security:audit` doit être exécuté avant chaque livraison. Au 16 juillet 2026, l'audit signale deux avis PostCSS modérés hérités de Next.js, sans correctif disponible. L'application ne transforme pas de CSS fourni par les utilisateurs, ce qui limite l'exposition à ces avis. Toute vulnérabilité élevée ou critique bloque la livraison.

## Signalement responsable

Ne jamais publier une vulnérabilité ou une donnée client dans une issue publique. Utiliser la fonctionnalité privée **Security advisories** du dépôt GitHub.
