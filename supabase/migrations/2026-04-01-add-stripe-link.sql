-- Ajouter la colonne stripe_link à la table boutique_products
-- À exécuter dans : Supabase Dashboard > SQL Editor
ALTER TABLE boutique_products ADD COLUMN IF NOT EXISTS stripe_link TEXT DEFAULT '';
