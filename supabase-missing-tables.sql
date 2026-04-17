-- ================================================================
-- UNE VOIX INTÉRIEURE — Tables et fonctions manquantes
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- Complément de supabase-setup.sql
-- ================================================================

-- ------------------------------------------------
-- Table blog_likes
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique likes" ON blog_likes FOR SELECT USING (true);
CREATE POLICY "Admin gère likes" ON blog_likes FOR ALL
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- ------------------------------------------------
-- Table blog_views
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE blog_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique vues" ON blog_views FOR SELECT USING (true);
CREATE POLICY "Admin gère vues" ON blog_views FOR ALL
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- ------------------------------------------------
-- Table blog_comments
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT NOT NULL,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique commentaires" ON blog_comments FOR SELECT USING (true);
CREATE POLICY "Insertion publique commentaires" ON blog_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin supprime commentaires" ON blog_comments FOR DELETE
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- ------------------------------------------------
-- Table pins (articles/produits épinglés)
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
-- Table visiteurs (compteur global de visites)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS visiteurs (
  id INTEGER DEFAULT 1 PRIMARY KEY,
  count BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- Initialiser l'unique ligne du compteur
INSERT INTO visiteurs (id, count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
ALTER TABLE visiteurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique visiteurs" ON visiteurs FOR SELECT USING (true);
CREATE POLICY "Admin gère visiteurs" ON visiteurs FOR ALL
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- ------------------------------------------------
-- Colonnes manquantes dans boutique_products
-- ------------------------------------------------
ALTER TABLE boutique_products ADD COLUMN IF NOT EXISTS stripe_link TEXT;
ALTER TABLE boutique_products ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;
ALTER TABLE boutique_products ADD COLUMN IF NOT EXISTS images_gallery JSONB DEFAULT '[]';
ALTER TABLE boutique_products ADD COLUMN IF NOT EXISTS short_description TEXT DEFAULT '';
ALTER TABLE boutique_products ADD COLUMN IF NOT EXISTS description_sections JSONB DEFAULT '[]';

-- ------------------------------------------------
-- RPC increment_blog_like
-- Incrémente le compteur de likes d'un article et retourne le nouveau total.
-- Appelée dans app.js via supabase.rpc('increment_blog_like', { p_article_id })
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION increment_blog_like(p_article_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO blog_likes (article_id, count)
    VALUES (p_article_id, 1)
  ON CONFLICT (article_id)
    DO UPDATE SET count = blog_likes.count + 1, updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------
-- RPC increment_blog_view
-- Incrémente le compteur de vues d'un article et retourne le nouveau total.
-- Appelée dans app.js via supabase.rpc('increment_blog_view', { p_article_id })
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION increment_blog_view(p_article_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO blog_views (article_id, count)
    VALUES (p_article_id, 1)
  ON CONFLICT (article_id)
    DO UPDATE SET count = blog_views.count + 1, updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------
-- RPC increment_visiteur
-- Incrémente le compteur global de visiteurs.
-- Appelée par la Edge Function visitor-counter (POST).
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION increment_visiteur()
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE visiteurs
    SET count = count + 1, updated_at = now()
    WHERE id = 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------
-- RPC get_visiteur_count
-- Retourne le compteur global de visiteurs.
-- Appelée par la Edge Function visitor-counter (GET).
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION get_visiteur_count()
RETURNS BIGINT AS $$
BEGIN
  RETURN (SELECT count FROM visiteurs WHERE id = 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
