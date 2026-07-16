# ImmoBoost AI™

L'assistant intelligent qui comprend une situation immobilière et prépare immédiatement la meilleure solution.

## Version 0.5 — Mission Brain + Growth Pack

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
- interface premium, responsive et mobile-first.

## Lancer le projet

```bash
npm install
cp .env.example .env.local
npm run dev
```

Renseigner `OPENAI_API_KEY` dans `.env.local`. Le modèle par défaut est `gpt-5.6-terra` et reste configurable avec `OPENAI_MODEL`.

## Vérifier avant livraison

```bash
npm run typecheck
npm run build
```

## Déploiement Vercel

Ajouter `OPENAI_API_KEY` et, si nécessaire, `OPENAI_MODEL` dans les variables d'environnement du projet Vercel, puis déployer la branche validée.
