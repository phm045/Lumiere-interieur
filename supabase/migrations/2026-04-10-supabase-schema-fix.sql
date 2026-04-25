-- ============================================================
-- CORRECTION COMPLÈTE DU SCHÉMA SUPABASE
-- Projet : dhbbwzpfwtdtdiuixrmq — Une voix intérieure
-- Date : 17 avril 2026
-- ============================================================

-- ============================================================
-- 1. TABLE coupons — colonnes manquantes
-- ============================================================
-- Colonnes existantes : id, code, description, actif, usage_max, date_creation, applicable_a
-- Colonnes manquantes : reduction_pourcent, reduction_montant, valide_jusqu_au, usage_actuel

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS reduction_pourcent integer,
  ADD COLUMN IF NOT EXISTS reduction_montant  numeric(10,2),
  ADD COLUMN IF NOT EXISTS valide_jusqu_au    timestamptz,
  ADD COLUMN IF NOT EXISTS usage_actuel       integer NOT NULL DEFAULT 0;

-- Index pour les recherches fréquentes sur code actif
CREATE INDEX IF NOT EXISTS coupons_code_actif_idx ON public.coupons (code) WHERE actif = true;

-- ============================================================
-- 2. TABLE commandes — colonnes manquantes
-- ============================================================
-- Colonnes existantes : id, stripe_session_id, service, montant, statut, user_id, methode_paiement, date_creation
-- Colonnes manquantes dans certains usages : paypal_tx_id (usage très mineur, ajout préventif)

ALTER TABLE public.commandes
  ADD COLUMN IF NOT EXISTS paypal_tx_id text;

-- ============================================================
-- 3. TABLE profiles — colonnes manquantes
-- ============================================================
-- Colonnes existantes : id, nom, prenom, email, telephone, date_creation
-- avatar_url est utilisé dans app.js (admin-avatar, photo profil)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- ============================================================
-- 4. TABLE reservations — cohérence avec rendez_vous
-- ============================================================
-- La table reservations est la table principale pour les RDV Cal.com
-- Elle a : id, user_id, service, date_rdv, statut, notes, date_creation
-- Pas de colonnes manquantes critiques détectées

-- ============================================================
-- 5. TRIGGER usage_actuel — auto-incrément à chaque utilisation coupon
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.coupons
    SET usage_actuel = usage_actuel + 1
    WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_coupon_usage ON public.coupons_utilises;
CREATE TRIGGER trg_increment_coupon_usage
  AFTER INSERT ON public.coupons_utilises
  FOR EACH ROW EXECUTE FUNCTION public.increment_coupon_usage();

-- ============================================================
-- 6. RLS — vérification et complétion
-- ============================================================

-- profiles : les utilisateurs peuvent lire et modifier leur propre profil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_select_own'
  ) THEN
    CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_update_own'
  ) THEN
    CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_insert_own'
  ) THEN
    CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- reservations : les utilisateurs voient leurs propres réservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='reservations' AND policyname='reservations_select_own'
  ) THEN
    CREATE POLICY reservations_select_own ON public.reservations FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='reservations' AND policyname='reservations_insert_own'
  ) THEN
    CREATE POLICY reservations_insert_own ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='reservations' AND policyname='reservations_update_own'
  ) THEN
    CREATE POLICY reservations_update_own ON public.reservations FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- commandes : les utilisateurs voient leurs propres commandes
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='commandes' AND policyname='commandes_select_own'
  ) THEN
    CREATE POLICY commandes_select_own ON public.commandes FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='commandes' AND policyname='commandes_insert_own'
  ) THEN
    CREATE POLICY commandes_insert_own ON public.commandes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- coupons : lecture publique (pour validation côté client)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='coupons_select_public'
  ) THEN
    CREATE POLICY coupons_select_public ON public.coupons FOR SELECT USING (true);
  END IF;
END $$;

-- coupons_utilises : les utilisateurs voient et insèrent leurs propres usages
ALTER TABLE public.coupons_utilises ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='coupons_utilises' AND policyname='coupons_utilises_select_own'
  ) THEN
    CREATE POLICY coupons_utilises_select_own ON public.coupons_utilises FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='coupons_utilises' AND policyname='coupons_utilises_insert_own'
  ) THEN
    CREATE POLICY coupons_utilises_insert_own ON public.coupons_utilises FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- temoignages : lecture publique des approuvés, insert authentifié
ALTER TABLE public.temoignages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='temoignages' AND policyname='temoignages_select_approuves'
  ) THEN
    CREATE POLICY temoignages_select_approuves ON public.temoignages FOR SELECT USING (approuve = true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='temoignages' AND policyname='temoignages_insert_auth'
  ) THEN
    CREATE POLICY temoignages_insert_auth ON public.temoignages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- restock_subscribers : lecture/insert publics (email seul, pas de données sensibles)
ALTER TABLE public.restock_subscribers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='restock_subscribers' AND policyname='restock_select_public'
  ) THEN
    CREATE POLICY restock_select_public ON public.restock_subscribers FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='restock_subscribers' AND policyname='restock_insert_public'
  ) THEN
    CREATE POLICY restock_insert_public ON public.restock_subscribers FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- Confirmation
-- ============================================================
SELECT 'Schema fix applied successfully' AS status;
