# ImmoBoost AI™

L'assistant intelligent qui comprend une situation immobilière et prépare immédiatement la meilleure solution.

## Version 0.6 — Fondations sécurisées

Le parcours principal est maintenant opérationnel :

- une seule question d'entrée : « Que se passe-t-il aujourd'hui ? » ;
- saisie texte, dictée vocale et ajout de photo ;
- sélection automatique de l'expert métier ;
- génération directe dans ImmoBoost, sans redirection ni copier-coller vers une autre IA ;
- kit structuré : diagnostic, objectif, plan, email, SMS, script d'appel, checklist, documents et prochaine action ;
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

## Vérifier avant livraison

```bash
npm run typecheck
npm test
npm run build
npm run security:audit
```

## Sécurité et mise en production

Consulter `SECURITY.md` avant tout déploiement commercial. Le portefeuille en mémoire présent dans cette version valide les règles métier mais ne doit pas être utilisé comme stockage de production. La prochaine étape est son adaptateur transactionnel D1 avec comptes, licences et webhooks signés.
