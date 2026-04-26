-- ================================================================
-- Une Voix Intérieure — CORRECTIF D'URGENCE RLS (fuite de données)
-- À EXÉCUTER IMMÉDIATEMENT dans : Supabase Dashboard > SQL Editor
-- ================================================================
--
-- CONTEXTE
-- --------
-- L'audit live du 2026-04-26 a révélé que :
--
-- 1. La table `visites_log` (600 lignes contenant IP, géoloc, ISP, UA)
--    était LISIBLE publiquement par n'importe qui possédant l'anon key.
--    → fuite RGPD (catégorie "données techniques permettant l'identification").
--
-- 2. La table `restock_subscribers` (emails d'abonnés produits)
--    était LISIBLE publiquement par n'importe qui.
--    → fuite RGPD (donnée à caractère personnel : adresse email).
--
-- La migration `2026-04-12-visites_log_rls.sql` posait pourtant
-- la bonne politique (admin-only SELECT). Elle n'a soit pas été
-- exécutée, soit été écrasée par une autre opération.
--
-- Cette migration est IDEMPOTENTE et peut être ré-exécutée sans risque.
-- ================================================================


-- ----------------------------------------------------------------
-- 1. visites_log
-- ----------------------------------------------------------------

ALTER TABLE IF EXISTS visites_log ENABLE ROW LEVEL SECURITY;

-- Supprimer toute politique permissive existante
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE tablename = 'visites_log' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.visites_log', pol.policyname);
  END LOOP;
END $$;

-- INSERT public OK (tracking visiteurs anonymes)
CREATE POLICY "visites_log_insert_public"
  ON visites_log FOR INSERT
  WITH CHECK (true);

-- SELECT admin uniquement
CREATE POLICY "visites_log_select_admin"
  ON visites_log FOR SELECT
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- UPDATE admin uniquement
CREATE POLICY "visites_log_update_admin"
  ON visites_log FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- DELETE admin uniquement
CREATE POLICY "visites_log_delete_admin"
  ON visites_log FOR DELETE
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');


-- ----------------------------------------------------------------
-- 2. restock_subscribers
-- ----------------------------------------------------------------

ALTER TABLE IF EXISTS restock_subscribers ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE tablename = 'restock_subscribers' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.restock_subscribers', pol.policyname);
  END LOOP;
END $$;

-- INSERT public OK (souscription anonyme)
CREATE POLICY "restock_subscribers_insert_public"
  ON restock_subscribers FOR INSERT
  WITH CHECK (true);

-- SELECT admin uniquement (jamais d'exposition publique des emails)
CREATE POLICY "restock_subscribers_select_admin"
  ON restock_subscribers FOR SELECT
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- UPDATE admin uniquement (marquer "notified")
CREATE POLICY "restock_subscribers_update_admin"
  ON restock_subscribers FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- DELETE admin uniquement
CREATE POLICY "restock_subscribers_delete_admin"
  ON restock_subscribers FOR DELETE
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');


-- ----------------------------------------------------------------
-- 3. Renforcement défense en profondeur sur toutes les tables sensibles
-- ----------------------------------------------------------------
-- Active RLS sur toutes les tables publiques (idempotent)

DO $$
DECLARE t RECORD;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;


-- ----------------------------------------------------------------
-- 4. Vérification (à exécuter manuellement après la migration)
-- ----------------------------------------------------------------
-- SELECT tablename, COUNT(*) FILTER (WHERE policyname IS NOT NULL) AS nb_policies,
--        bool_or(rowsecurity) AS rls_active
--   FROM pg_tables t
--   LEFT JOIN pg_policies p USING (tablename)
--  WHERE t.schemaname = 'public'
--  GROUP BY tablename
--  ORDER BY tablename;
