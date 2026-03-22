// ========================================
// Base de données SQLite — Gestion des clients
// ========================================

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'clients.db');

// Connexion à la base de données
const db = new Database(DB_PATH);

// Activer le mode WAL pour de meilleures performances
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Création de la table des clients
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mot_de_passe TEXT NOT NULL,
    telephone TEXT DEFAULT '',
    date_creation TEXT DEFAULT (datetime('now')),
    date_modification TEXT DEFAULT (datetime('now'))
  )
`);

// Créer un index sur l'email pour des recherches rapides
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email)
`);

module.exports = db;
