-- ================================================
-- LUMIÈRE INTÉRIEURE — Tables Supabase
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ================================================

-- Table des commandes
CREATE TABLE IF NOT EXISTS commandes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  methode_paiement TEXT NOT NULL DEFAULT 'stripe',
  statut TEXT NOT NULL DEFAULT 'payé',
  stripe_session_id TEXT,
  date_creation TIMESTAMPTZ DEFAULT now()
);

-- Table des coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  reduction_pourcent INTEGER,
  reduction_montant DECIMAL(10,2),
  valide_jusqu_au TIMESTAMPTZ,
  usage_max INTEGER DEFAULT 1,
  usage_actuel INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  date_creation TIMESTAMPTZ DEFAULT now()
);

-- Table des coupons utilisés par les clients
CREATE TABLE IF NOT EXISTS coupons_utilises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  commande_id UUID REFERENCES commandes(id) ON DELETE SET NULL,
  date_utilisation TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, coupon_id)
);

-- Activer Row Level Security
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons_utilises ENABLE ROW LEVEL SECURITY;

-- Politiques : chaque client ne voit que ses propres données
CREATE POLICY "Les clients voient leurs commandes"
  ON commandes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les clients créent leurs commandes"
  ON commandes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tout le monde peut lire les coupons actifs"
  ON coupons FOR SELECT
  USING (actif = true);

CREATE POLICY "Les clients voient leurs coupons utilisés"
  ON coupons_utilises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les clients enregistrent leurs coupons"
  ON coupons_utilises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mettre à jour le compteur d'utilisation des coupons
CREATE OR REPLACE FUNCTION incrementer_usage_coupon()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons SET usage_actuel = usage_actuel + 1 WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_usage_coupon
  AFTER INSERT ON coupons_utilises
  FOR EACH ROW
  EXECUTE FUNCTION incrementer_usage_coupon();

-- Table des réservations / RDV
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  date_rdv TIMESTAMPTZ NOT NULL,
  statut TEXT NOT NULL DEFAULT 'à venir',
  notes TEXT DEFAULT '',
  date_creation TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_voir_rdv" ON reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_creer_rdv" ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Exemple de coupon de bienvenue (vous pouvez modifier)
INSERT INTO coupons (code, description, reduction_pourcent, valide_jusqu_au)
VALUES ('BIENVENUE10', 'Réduction de bienvenue : -10% sur votre première consultation', 10, '2027-12-31');

-- Fonction RPC pour permettre à un utilisateur de supprimer son propre compte
-- Les tables avec ON DELETE CASCADE suppriment automatiquement les données liées
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
