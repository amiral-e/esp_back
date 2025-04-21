# ComptaCompanion

ComptaCompanion est une plateforme de chat en ligne qui permet d'accéder à des informations et des conseils sur la comptabilité et la finance de manière facile et rapide.

> Plus d'infos et de détailles sur le cahier des charges: [esp_docs/cahier_des_charges](https://github.com/amiral-e/esp_docs/tree/main/cahier_des_charges).

## Demo

Une version production du backend est accessible ici: [backend](https://cc-back-prod.fly.dev/).

## Fonctionnalités

La documentations des différentes routes est disponnible ici: [backend/docs](https://cc-back-prod.fly.dev/docs).

Les routes sont regroupées par tag. Les routes d'administration ont un tag qui commence par `admins-` et les routes utilisateur par `users-`.

Chaque route est documentée de la sorte :
- une description
- les differentes réponses possibles avec des placeholders
- un exmeple de commande curl pour tester la route
- un bouton `Test Request` pour tester la route en direct

## Technologies utilisées

- **Hono.dev** framework web
- **supabase-js** pour les intéractions avec la base de donnée
- **scalar** pour la documentation des routes
- **typedoc** pour la documentation du code
- **Fly.io** pour le déploiement


## Cloner et lancer localement
1. Vous aurez d'abord besoin d'un projet Supabase qui peut être créé [via le tableau de bord Supabase](https://database.new)
2. Clonez le repository github
3. Installez bun
4. utilisez la commande `bun install` pour installer les dépendances
4. créer un .env à partir du .env.example et le remplir
5. utilisez la commande `bun run dev` pour lancer le projet


## Lancement avec docker

```bash
  docker build -t esp_back .
  docker run -p 3000:3000 --env-file .env esp_back
```

## Structure du repository


```
├── src : dossier principal contenant les pages et les composants
│   ├── test : routes debug pour faciliter les tests sur dev
│   ├── middlewares : middlewares liés à l'authentification
│   ├── admins : routes admins
│   │   ├── collections : gestion des collections globale de la plateforme
|   |   ├── documents : gestion des documents des collections globales
│   │   ├── config : configuration de la plateforme (prix, prompts)
│   │   ├── forum : gestion et administration du forum
│   │   ├── profile : administration des profiles utilisateurs (credits, niveau de connaissance)
│   │   ├── questions : configuration des question predefinies de la plateforme
│   │   ├── self : gestion des admins
|   |   └── users : lister les users
│   └── users : routes utilisateurs
│       ├── chat : envoie de messages à l'assistant
│       ├── collections : gestion des collections
|       ├── documents : gestion des documents des collections
│       ├── conversations : gestion des conversations
│       ├── forum : interaction avec le forum
│       ├── profile : gestion du profil utilisateur
│       ├── questions : récupération des questions prédéfinies selon le niveau de connaissance
|       └── reports : génération et gestion des rapports de l'assistant
└── sonar : documentation pour SonarQube (installation, scan)
```

## Liste des commandes Bun disponnibles

- `bun install` installe toutes les dependances
- `bun run dev` lance le serveur de développement
- `bun run build` build le projet pour la production
- `bun run format ./ ./src/` formatte le code des fichiers
- `bun run deploy-dev` déployer le projet dans l'environnement de développement fly.io
- `bun run deploy-prod` déployer le projet dans l'environnement de production fly.io
- `bun --env-file=.env ...` exécute la commande bun en utilisant un fichier d'environnement spécifique