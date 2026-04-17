-- ─── Correction table paniers ────────────────────────────────────────────────
-- La table existe mais sans colonne id ni structure correcte.
-- On la recrée proprement avec toutes les colonnes attendues par app.js.

-- Supprimer l'ancienne table si elle existe (structure cassée)
DROP TABLE IF EXISTS public.paniers;

-- Recréer avec le bon schéma
CREATE TABLE public.paniers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenu     jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Index sur user_id pour les upsert/select rapides
CREATE INDEX IF NOT EXISTS paniers_user_id_idx ON public.paniers (user_id);

-- RLS : chaque utilisateur ne voit que son propre panier
ALTER TABLE public.paniers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paniers_select_own" ON public.paniers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "paniers_insert_own" ON public.paniers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "paniers_update_own" ON public.paniers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "paniers_delete_own" ON public.paniers
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS paniers_updated_at ON public.paniers;
CREATE TRIGGER paniers_updated_at
  BEFORE UPDATE ON public.paniers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
