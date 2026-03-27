-- ================================================
-- Mise à jour de l'email admin dans les politiques RLS
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ================================================

-- Coupons
DROP POLICY IF EXISTS "Admin gere les coupons" ON coupons;
CREATE POLICY "Admin gere les coupons"
  ON coupons FOR ALL
  USING (auth.jwt() ->> 'email' = 'equi.libre.916@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'equi.libre.916@gmail.com');

-- Articles blog
DROP POLICY IF EXISTS "Admin gère les articles" ON blog_articles;
CREATE POLICY "Admin gère les articles"
  ON blog_articles FOR ALL
  USING (auth.jwt() ->> 'email' = 'equi.libre.916@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'equi.libre.916@gmail.com');

-- Produits boutique
DROP POLICY IF EXISTS "Admin gère les produits" ON boutique_products;
CREATE POLICY "Admin gère les produits"
  ON boutique_products FOR ALL
  USING (auth.jwt() ->> 'email' = 'equi.libre.916@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'equi.libre.916@gmail.com');

-- Disponibilités
DROP POLICY IF EXISTS "Admin gère les disponibilités" ON disponibilites;
CREATE POLICY "Admin gère les disponibilités"
  ON disponibilites FOR ALL
  USING (auth.jwt() ->> 'email' = 'equi.libre.916@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'equi.libre.916@gmail.com');

-- Images produits (si la table existe)
DROP POLICY IF EXISTS "Admin gère les images produits" ON product_images;
CREATE POLICY "Admin gère les images produits"
  ON product_images FOR ALL
  USING (auth.jwt() ->> 'email' = 'equi.libre.916@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'equi.libre.916@gmail.com');
