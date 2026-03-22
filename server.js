// ========================================
// LUMIÈRE INTÉRIEURE — Serveur Express
// ========================================

require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { verifierToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');

// --- Vérification des variables d'environnement obligatoires ---
if (!process.env.JWT_SECRET) {
  console.error('\n\u2718 ERREUR FATALE : JWT_SECRET non défini.');
  console.error('  Créez un fichier .env avec : JWT_SECRET=votre-secret-ici\n');
  process.exit(1);
}
if (!process.env.COOKIE_SECRET) {
  console.error('\n\u2718 ERREUR FATALE : COOKIE_SECRET non défini.');
  console.error('  Créez un fichier .env avec : COOKIE_SECRET=votre-secret-ici\n');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// --- Sécurité HTTP (Helmet) ---
app.use(helmet({
  contentSecurityPolicy: false // Désactivé pour permettre les polices et scripts externes
}));

// --- Analyse du corps des requêtes ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Cookies ---
app.use(cookieParser(process.env.COOKIE_SECRET));

// --- Limitation de débit sur les routes d'authentification ---
const limiteurAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Maximum 20 tentatives par IP
  message: {
    succes: false,
    erreurs: ['Trop de tentatives. Veuillez réessayer dans 15 minutes.']
  },
  standardHeaders: true,
  legacyHeaders: false
});

// --- Limitation générale ---
const limiteurGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiteurGeneral);

// --- Vérification du token JWT sur toutes les requêtes ---
app.use(verifierToken);

// --- Fichiers statiques (le site existant) ---
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
  index: 'index.html'
}));

// --- Routes d'authentification ---
app.use('/api/auth', limiteurAuth, authRoutes);

// --- Route de protection CSRF : fournir le token ---
app.get('/api/csrf-token', (req, res) => {
  // Avec JWT + cookies httpOnly + sameSite strict, la protection CSRF
  // est assurée nativement. Ce endpoint est un placeholder si besoin.
  res.json({ succes: true });
});

// --- Démarrage du serveur ---
app.listen(PORT, () => {
  console.log(`\n✦ Lumière Intérieure — Serveur démarré`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → Environnement : ${process.env.NODE_ENV || 'development'}\n`);
});
