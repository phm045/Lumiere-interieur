-- ================================================
-- LUMIERE INTERIEURE — Audit & renforcement RLS
-- A executer dans : Supabase Dashboard > SQL Editor
-- ================================================

-- Verifier que RLS est active sur toutes les tables
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t.tablename);
    RAISE NOTICE 'RLS active sur %', t.tablename;
  END LOOP;
END $$;

-- blog_comments : tout le monde peut lire et inserer (pas modifier/supprimer)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_comments' AND policyname='Lecture publique des commentaires') THEN
    CREATE POLICY "Lecture publique des commentaires" ON blog_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_comments' AND policyname='Insertion publique des commentaires') THEN
    CREATE POLICY "Insertion publique des commentaires" ON blog_comments FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- temoignages : tout le monde peut inserer, seul l'admin peut lire/modifier/supprimer
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='temoignages' AND policyname='Insertion publique des temoignages') THEN
    CREATE POLICY "Insertion publique des temoignages" ON temoignages FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='temoignages' AND policyname='Lecture publique des temoignages approuves') THEN
    CREATE POLICY "Lecture publique des temoignages approuves" ON temoignages FOR SELECT USING (approuve = true OR auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');
  END IF;
END $$;

-- blog_articles : lecture publique, ecriture admin seulement
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_articles' AND policyname='Lecture publique des articles') THEN
    CREATE POLICY "Lecture publique des articles" ON blog_articles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_articles' AND policyname='Admin gere les articles') THEN
    CREATE POLICY "Admin gere les articles" ON blog_articles FOR ALL USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com') WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');
  END IF;
END $$;

-- boutique_products : lecture publique, ecriture admin seulement
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='boutique_products' AND policyname='Lecture publique des produits') THEN
    CREATE POLICY "Lecture publique des produits" ON boutique_products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='boutique_products' AND policyname='Admin gere les produits') THEN
    CREATE POLICY "Admin gere les produits" ON boutique_products FOR ALL USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com') WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');
  END IF;
END $$;
