-- ================================================
-- LUMIÈRE INTÉRIEURE — Table alertes restock
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ================================================

-- Table des inscriptions aux alertes de restock
CREATE TABLE IF NOT EXISTS restock_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  UNIQUE(email, product_slug)
);

ALTER TABLE restock_subscribers ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut s'inscrire (INSERT) sans être connecté
CREATE POLICY "Inscription publique restock"
  ON restock_subscribers FOR INSERT
  WITH CHECK (true);

-- L'admin peut tout voir et gérer
CREATE POLICY "Admin gère restock"
  ON restock_subscribers FOR ALL
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- Empêcher les doublons au niveau SQL (déjà fait via UNIQUE)
-- Si un visiteur s'inscrit deux fois pour le même produit, ça ne crée pas de doublon
