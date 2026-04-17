-- ================================================================
-- UNE VOIX INTÉRIEURE — Corrections manquantes
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ================================================================

-- ------------------------------------------------
-- Table pins (épinglage d'articles/produits)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  section TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique pins" ON pins FOR SELECT USING (true);
CREATE POLICY "Admin gère pins" ON pins FOR ALL
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- ------------------------------------------------
-- Colonnes manquantes dans boutique_products
-- ------------------------------------------------
ALTER TABLE boutique_products ADD COLUMN IF NOT EXISTS images_gallery JSONB DEFAULT '[]';
ALTER TABLE boutique_products ADD COLUMN IF NOT EXISTS short_description TEXT DEFAULT '';
ALTER TABLE boutique_products ADD COLUMN IF NOT EXISTS description_sections JSONB DEFAULT '[]';

-- ------------------------------------------------
-- RPC get_visiteur_count (lecture compteur visiteurs)
-- Compatible avec la colonne "total" existante
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION get_visiteur_count()
RETURNS BIGINT AS $$
BEGIN
  RETURN (SELECT total FROM visiteurs WHERE id = 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
