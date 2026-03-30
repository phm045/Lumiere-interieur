-- ================================================
-- LUMIÈRE INTÉRIEURE — Table alertes restock
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ================================================

-- Supprimer l'ancienne table si elle existe (pour repartir propre)
DROP TABLE IF EXISTS restock_subscribers;

-- Table des inscriptions aux alertes de restock
CREATE TABLE restock_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  UNIQUE(email, product_slug)
);

-- Activer RLS
ALTER TABLE restock_subscribers ENABLE ROW LEVEL SECURITY;

-- Permettre à TOUT LE MONDE (y compris visiteurs non connectés / rôle anon) d'insérer
CREATE POLICY "Inscription publique restock"
  ON restock_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- L'admin peut tout voir et gérer
CREATE POLICY "Admin lit restock"
  ON restock_subscribers FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

CREATE POLICY "Admin modifie restock"
  ON restock_subscribers FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

CREATE POLICY "Admin supprime restock"
  ON restock_subscribers FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');
