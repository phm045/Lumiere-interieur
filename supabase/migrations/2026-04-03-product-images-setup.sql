-- ================================================
-- LUMIÈRE INTÉRIEURE — Table des images produits
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ================================================

-- Table pour stocker plusieurs images par produit
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_slug TEXT NOT NULL,
  image_url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les images produits
CREATE POLICY "Lecture publique des images produits"
  ON product_images FOR SELECT
  USING (true);

-- Seul l'admin peut gérer les images produits
CREATE POLICY "Admin gère les images produits"
  ON product_images FOR ALL
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- Politique anon INSERT pour permettre l'upload sans auth admin (si nécessaire via service role)
-- L'admin authentifié peut insérer/supprimer grâce à la politique ci-dessus

-- Index pour un chargement rapide par produit
CREATE INDEX IF NOT EXISTS idx_product_images_slug ON product_images(product_slug);
