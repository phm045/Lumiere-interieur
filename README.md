# Une voix intérieure

Site web du cabinet de voyance / cartomancie **Une voix intérieure**.

🌐 https://www.une-voix-interieure.fr

## Architecture

Site **100 % statique** servi par **GitHub Pages**, alimenté par :

| Couche | Technologie | Rôle |
|---|---|---|
| Frontend | HTML / CSS / JS vanilla | Pages, blog, boutique, formulaires |
| Données | [Supabase](https://supabase.com) | Base PostgreSQL + RLS, Realtime, Storage |
| Backend serverless | Supabase **Edge Functions** (Deno) | `brevo-proxy`, `cal-proxy`, `stripe-checkout`, `stripe-webhook`, `visitor-counter`, `geocode-retroactif` |
| Paiements | [Stripe Payment Links](https://stripe.com/payments/payment-links) | Liens de paiement directs (pas de backend custom) |
| Newsletter | [Brevo](https://brevo.com) (via Edge Function `brevo-proxy`) | Inscription en liste 3 |
| Hébergement | GitHub Pages (CNAME : `www.une-voix-interieure.fr`) | Cert HTTPS Let's Encrypt |

## Structure du dépôt

```
.
├── index.html              # Page principale
├── astrologie-boussole.html # Page astrologie
├── app.js                  # JS client unique (à découper à terme)
├── style.css, base.css     # Styles
├── manifest.json, sw.js    # PWA
├── CNAME                   # Domaine custom GitHub Pages
├── supabase/
│   ├── functions/          # Edge Functions Deno
│   │   ├── brevo-proxy/
│   │   ├── cal-proxy/
│   │   ├── geocode-retroactif/
│   │   ├── stripe-checkout/
│   │   ├── stripe-webhook/
│   │   └── visitor-counter/
│   └── migrations/         # Scripts SQL versionnés (à appliquer manuellement
│                           #  via Supabase Dashboard > SQL Editor)
├── config/
│   └── tracker.config.json # Config du tracker visiteurs
└── *.png, *.jpg, *.mp3     # Assets médias
```

## Développement local

Comme le site est statique, n'importe quel serveur HTTP local fonctionne :

```bash
# Python (intégré sur la plupart des OS)
python3 -m http.server 8000

# Ou avec npx
npx serve .
```

Puis ouvrir http://localhost:8000.

## Edge Functions Supabase

Les Edge Functions (dans `supabase/functions/`) tournent sur Deno côté Supabase. Variables d'environnement à configurer **dans le dashboard Supabase** (Project Settings → Edge Functions → Secrets) :

| Variable | Utilisée par | Description |
|---|---|---|
| `BREVO_API_KEY` | `brevo-proxy` | Clé API Brevo (newsletter, transactionnel) |
| `STRIPE_SECRET_KEY` | `stripe-checkout`, `stripe-webhook` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` | Secret de signature webhook Stripe |
| `CAL_API_KEY` | `cal-proxy` | Clé API Cal.com (calendrier rendez-vous) |

Déploiement d'une Edge Function :

```bash
# Prérequis : npx supabase CLI installé et project lié
npx supabase functions deploy brevo-proxy
```

## Migrations SQL

Les scripts dans `supabase/migrations/` doivent être **appliqués manuellement** dans l'ordre via le **SQL Editor** du dashboard Supabase. Ils ne sont **pas** appliqués automatiquement (le projet n'utilise pas la CLI Supabase pour les migrations).

## Déploiement

GitHub Pages déploie automatiquement le contenu de la branche `main` à chaque push. Aucune action CI/CD nécessaire.

## Sécurité

- 🔒 **Aucun secret côté client** : la clé Supabase utilisée dans `app.js` est la clé publique `anon` (sécurité assurée par les Row-Level Security policies)
- 🔒 **Edge Functions** : c'est le seul endroit où les secrets vivent (Brevo API, Stripe Secret, Cal API)
- 🔒 **Stripe** : les paiements passent par des Payment Links Stripe-hosted, aucune clé secrète Stripe côté client

## Licence

ISC
