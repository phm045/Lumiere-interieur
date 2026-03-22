// ========================================
// Routes d'authentification — Inscription, Connexion, Déconnexion
// ========================================

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { requiertAuth } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;
const JWT_EXPIRATION = '7d';

// Options du cookie d'authentification
function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
  };
}

// --- Règles de validation ---
const reglesInscription = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom est requis.')
    .isLength({ max: 100 }).withMessage('Le nom ne doit pas dépasser 100 caractères.'),
  body('prenom')
    .trim()
    .notEmpty().withMessage('Le prénom est requis.')
    .isLength({ max: 100 }).withMessage('Le prénom ne doit pas dépasser 100 caractères.'),
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis.')
    .isEmail().withMessage('Veuillez entrer une adresse email valide.')
    .normalizeEmail(),
  body('mot_de_passe')
    .notEmpty().withMessage('Le mot de passe est requis.')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule.')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),
  body('telephone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[+]?[\d\s\-.()]{6,20}$/).withMessage('Numéro de téléphone invalide.')
];

const reglesConnexion = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis.')
    .isEmail().withMessage('Veuillez entrer une adresse email valide.')
    .normalizeEmail(),
  body('mot_de_passe')
    .notEmpty().withMessage('Le mot de passe est requis.')
];

// ========================================
// POST /api/auth/inscription
// ========================================
router.post('/inscription', reglesInscription, async (req, res) => {
  // Vérifier les erreurs de validation
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    return res.status(400).json({
      succes: false,
      erreurs: erreurs.array().map(e => e.msg)
    });
  }

  const { nom, prenom, email, mot_de_passe, telephone } = req.body;

  try {
    // Vérifier si l'email existe déjà
    const clientExistant = db.prepare('SELECT id FROM clients WHERE email = ?').get(email);
    if (clientExistant) {
      return res.status(409).json({
        succes: false,
        erreurs: ['Un compte existe déjà avec cette adresse email.']
      });
    }

    // Hasher le mot de passe
    const hash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);

    // Insérer le nouveau client
    const result = db.prepare(`
      INSERT INTO clients (nom, prenom, email, mot_de_passe, telephone)
      VALUES (?, ?, ?, ?, ?)
    `).run(nom, prenom, email, hash, telephone || '');

    // Créer le token JWT
    const token = jwt.sign(
      { id: result.lastInsertRowid, email, prenom, nom },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Envoyer le cookie
    res.cookie('auth_token', token, cookieOptions());

    res.status(201).json({
      succes: true,
      message: 'Inscription réussie ! Bienvenue, ' + prenom + '.',
      client: { id: result.lastInsertRowid, nom, prenom, email }
    });
  } catch (err) {
    console.error('Erreur lors de l\'inscription :', err);
    res.status(500).json({
      succes: false,
      erreurs: ['Une erreur interne est survenue. Veuillez réessayer.']
    });
  }
});

// ========================================
// POST /api/auth/connexion
// ========================================
router.post('/connexion', reglesConnexion, async (req, res) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    return res.status(400).json({
      succes: false,
      erreurs: erreurs.array().map(e => e.msg)
    });
  }

  const { email, mot_de_passe } = req.body;

  try {
    // Chercher le client par email
    const client = db.prepare('SELECT * FROM clients WHERE email = ?').get(email);
    if (!client) {
      return res.status(401).json({
        succes: false,
        erreurs: ['Email ou mot de passe incorrect.']
      });
    }

    // Vérifier le mot de passe
    const motDePasseValide = await bcrypt.compare(mot_de_passe, client.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({
        succes: false,
        erreurs: ['Email ou mot de passe incorrect.']
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { id: client.id, email: client.email, prenom: client.prenom, nom: client.nom },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Envoyer le cookie
    res.cookie('auth_token', token, cookieOptions());

    res.json({
      succes: true,
      message: 'Connexion réussie ! Bonjour, ' + client.prenom + '.',
      client: {
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        email: client.email
      }
    });
  } catch (err) {
    console.error('Erreur lors de la connexion :', err);
    res.status(500).json({
      succes: false,
      erreurs: ['Une erreur interne est survenue. Veuillez réessayer.']
    });
  }
});

// ========================================
// POST /api/auth/deconnexion
// ========================================
router.post('/deconnexion', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({
    succes: true,
    message: 'Déconnexion réussie. À bientôt !'
  });
});

// ========================================
// GET /api/auth/profil — Récupérer le profil du client connecté
// ========================================
router.get('/profil', requiertAuth, (req, res) => {
  const client = db.prepare(
    'SELECT id, nom, prenom, email, telephone, date_creation FROM clients WHERE id = ?'
  ).get(req.client.id);

  if (!client) {
    return res.status(404).json({
      succes: false,
      message: 'Client introuvable.'
    });
  }

  res.json({
    succes: true,
    client
  });
});

// ========================================
// GET /api/auth/statut — Vérifier si l'utilisateur est connecté
// ========================================
router.get('/statut', (req, res) => {
  if (req.client) {
    res.json({
      connecte: true,
      client: {
        prenom: req.client.prenom,
        nom: req.client.nom,
        email: req.client.email
      }
    });
  } else {
    res.json({ connecte: false });
  }
});

module.exports = router;
