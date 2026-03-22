# Lumière Intérieure

Site web du salon de bien-être Lumière Intérieure avec système d'authentification client.

## Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur

## Installation

```bash
# Cloner le dépôt
git clone <url-du-repo>
cd Lumiere-interieur

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Modifier les valeurs dans .env (surtout JWT_SECRET et COOKIE_SECRET en production)
```

## Lancement

```bash
# Mode production
npm start

# Mode développement (rechargement automatique)
npm run dev
```

Le site est accessible sur `http://localhost:3000`

## Variables d'environnement

| Variable | Description | Valeur par défaut |
|---|---|---|
| `JWT_SECRET` | Clé secrète pour la signature des tokens JWT | *(obligatoire)* |
| `COOKIE_SECRET` | Clé secrète pour les cookies de session | *(obligatoire)* |
| `PORT` | Port du serveur | `3000` |
| `NODE_ENV` | Environnement (`development` / `production`) | `development` |

## Fonctionnalités d'authentification

- **Inscription** : formulaire avec nom, prénom, email, mot de passe et téléphone (optionnel)
- **Connexion** : email et mot de passe
- **Page Mon compte** : affichage des informations du client connecté
- **Déconnexion** : suppression du cookie d'authentification

## Sécurité

- Hashage des mots de passe avec bcrypt (12 rounds)
- Tokens JWT stockés dans des cookies `httpOnly` + `sameSite: strict`
- Validation des entrées (email, mot de passe fort, longueur des champs)
- Limitation de débit (rate limiting) sur les routes d'authentification
- En-têtes de sécurité HTTP via Helmet
- Base de données SQLite locale (pas de serveur externe requis)

## Structure du projet

```
├── server.js              # Point d'entrée du serveur Express
├── db/
│   └── database.js        # Configuration SQLite et création des tables
├── routes/
│   └── auth.js            # Routes d'authentification (API)
├── middleware/
│   └── auth.js            # Middleware de vérification JWT
├── index.html             # Page principale (SPA)
├── app.js                 # Logique frontend
├── style.css              # Styles du site
├── base.css               # Reset CSS
├── .env.example           # Modèle de variables d'environnement
└── package.json           # Dépendances et scripts
```

## API

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/inscription` | Créer un nouveau compte client |
| `POST` | `/api/auth/connexion` | Se connecter |
| `POST` | `/api/auth/deconnexion` | Se déconnecter |
| `GET` | `/api/auth/statut` | Vérifier l'état de connexion |
| `GET` | `/api/auth/profil` | Récupérer le profil du client connecté |
