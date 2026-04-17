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
const { initDB } = require('./db/database');

// --- Vérification des variables d'environnement obligatoires ---
if (!process.env.JWT_SECRET) {
  console.error('\n✘ ERREUR FATALE : JWT_SECRET non défini.');
  console.error('  Créez un fichier .env avec : JWT_SECRET=votre-secret-ici\n');
  process.exit(1);
}
if (!process.env.COOKIE_SECRET) {
  console.error('\n✘ ERREUR FATALE : COOKIE_SECRET non défini.');
  console.error('  Créez un fichier .env avec : COOKIE_SECRET=votre-secret-ici\n');
  process.exit(1);
}

async function demarrer() {
  // Initialiser la base de données
  await initDB();
  console.log('✓ Base de données SQLite initialisée');

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

  // --- Route Newsletter (Brevo) ---
  const limiteurNewsletter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { succes: false, erreur: 'Trop de tentatives. R\u00e9essayez dans 15 minutes.' }
  });

  app.post('/api/newsletter', limiteurNewsletter, async (req, res) => {
    try {
      var prenom = (req.body.prenom || '').trim();
      var email = (req.body.email || '').trim().toLowerCase();

      if (!prenom || !email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
        return res.status(400).json({ succes: false, erreur: 'Pr\u00e9nom et email valides requis.' });
      }

      var brevoKey = process.env.BREVO_API_KEY;
      if (!brevoKey) {
        console.error('BREVO_API_KEY non d\u00e9fini');
        return res.status(500).json({ succes: false, erreur: 'Service newsletter indisponible.' });
      }

      var response = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoKey
        },
        body: JSON.stringify({
          email: email,
          attributes: { PRENOM: prenom },
          listIds: [3],
          updateEnabled: true
        })
      });

      if (response.status === 201 || response.status === 204) {
        return res.json({ succes: true, nouveau: response.status === 201 });
      }

      var data = await response.json().catch(function() { return {}; });
      if (data.code === 'duplicate_parameter') {
        return res.json({ succes: true, nouveau: false });
      }

      return res.json({ succes: true });
    } catch (err) {
      console.error('Erreur newsletter:', err.message);
      return res.status(500).json({ succes: false, erreur: 'Erreur serveur.' });
    }
  });

  // --- Route de protection CSRF : fournir le token ---
  app.get('/api/csrf-token', (req, res) => {
    res.json({ succes: true });
  });

  // --- Démarrage du serveur ---
  app.listen(PORT, () => {
    console.log(`\n✦ Une voix intérieure — Serveur démarré`);
    console.log(`  → http://localhost:${PORT}`);
    console.log(`  → Environnement : ${process.env.NODE_ENV || 'development'}\n`);
  });
}

demarrer().catch(err => {
  console.error('Erreur au démarrage :', err);
  process.exit(1);
});
