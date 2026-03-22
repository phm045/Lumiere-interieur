// ========================================
// Middleware d'authentification JWT
// ========================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Vérifie le token JWT dans le cookie httpOnly.
 * Si valide, ajoute req.client avec les infos du client.
 * Si absent ou invalide, req.client reste null.
 */
function verifierToken(req, res, next) {
  const token = req.cookies?.auth_token;
  req.client = null;

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.client = {
      id: payload.id,
      email: payload.email,
      prenom: payload.prenom,
      nom: payload.nom
    };
  } catch (err) {
    // Token invalide ou expiré — on le supprime
    res.clearCookie('auth_token');
  }

  next();
}

/**
 * Protège une route — redirige vers la page de connexion si non authentifié.
 */
function requiertAuth(req, res, next) {
  if (!req.client) {
    return res.status(401).json({
      succes: false,
      message: 'Vous devez être connecté pour accéder à cette ressource.'
    });
  }
  next();
}

module.exports = { verifierToken, requiertAuth };
