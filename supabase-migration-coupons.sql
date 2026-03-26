-- ================================================
-- MIGRATION : Activer les coupons sur les paiements
-- A executer dans : Supabase Dashboard > SQL Editor
-- ================================================

-- Permettre aux clients de lier leurs coupons a leurs commandes
-- (necessaire pour que le retour Stripe puisse mettre a jour commande_id)
CREATE POLICY IF NOT EXISTS "Les clients lient leurs coupons aux commandes"
  ON coupons_utilises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
