-- ================================================
-- CRÉER LA TABLE DISPONIBILITÉS
-- À copier-coller dans : Supabase Dashboard > SQL Editor
-- Projet : dhbbwzpfwtdtdiuixrmq
-- ================================================

CREATE TABLE IF NOT EXISTS disponibilites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,          -- 'horaires', 'absence', 'date_speciale'
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE disponibilites ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire (nécessaire pour la bannière d'absence visible par tous)
CREATE POLICY "Lecture publique des disponibilités"
  ON disponibilites FOR SELECT
  USING (true);

-- Seul l'admin peut créer / modifier / supprimer
CREATE POLICY "Admin gère les disponibilités"
  ON disponibilites FOR ALL
  USING (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'philippe.medium45@gmail.com');
