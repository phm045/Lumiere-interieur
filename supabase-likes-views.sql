-- ================================================
-- LUMIÈRE INTÉRIEURE — Tables likes & vues blog
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ================================================

-- Table des likes par article
CREATE TABLE IF NOT EXISTS blog_likes (
  article_id TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les likes
CREATE POLICY "Lecture publique des likes"
  ON blog_likes FOR SELECT
  USING (true);

-- Tout le monde peut insérer (pour le upsert)
CREATE POLICY "Insertion publique des likes"
  ON blog_likes FOR INSERT
  WITH CHECK (true);

-- Tout le monde peut mettre à jour (pour le upsert)
CREATE POLICY "Mise à jour publique des likes"
  ON blog_likes FOR UPDATE
  USING (true);

-- Table des vues par article
CREATE TABLE IF NOT EXISTS blog_views (
  article_id TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blog_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique des vues"
  ON blog_views FOR SELECT
  USING (true);

CREATE POLICY "Insertion publique des vues"
  ON blog_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Mise à jour publique des vues"
  ON blog_views FOR UPDATE
  USING (true);

-- Fonction RPC pour incrémenter les likes atomiquement
CREATE OR REPLACE FUNCTION increment_blog_like(p_article_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO blog_likes (article_id, count, updated_at)
  VALUES (p_article_id, 1, now())
  ON CONFLICT (article_id) DO UPDATE
  SET count = blog_likes.count + 1, updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction RPC pour incrémenter les vues atomiquement
CREATE OR REPLACE FUNCTION increment_blog_view(p_article_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO blog_views (article_id, count, updated_at)
  VALUES (p_article_id, 1, now())
  ON CONFLICT (article_id) DO UPDATE
  SET count = blog_views.count + 1, updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
