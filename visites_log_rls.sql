-- ================================================================
-- Une Voix Intérieure — Fix traçage visiteurs anonymes
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ================================================================

-- Créer la table si elle n'existe pas encore
CREATE TABLE IF NOT EXISTS visites_log (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT,
  ville TEXT,
  region TEXT,
  pays TEXT,
  navigateur TEXT,
  page TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE visites_log ENABLE ROW LEVEL SECURITY;

-- Permettre l'insertion par tous les visiteurs (anonymes inclus)
DROP POLICY IF EXISTS "Insert public visites_log" ON visites_log;
CREATE POLICY "Insert public visites_log"
  ON visites_log FOR INSERT
  WITH CHECK (true);

-- Seul l'admin peut lire les visites
DROP POLICY IF EXISTS "Admin lit visites_log" ON visites_log;
CREATE POLICY "Admin lit visites_log"
  ON visites_log FOR SELECT
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');

-- Seul l'admin peut supprimer des visites
DROP POLICY IF EXISTS "Admin supprime visites_log" ON visites_log;
CREATE POLICY "Admin supprime visites_log"
  ON visites_log FOR DELETE
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');
