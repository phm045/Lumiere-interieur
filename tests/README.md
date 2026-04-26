# Tests E2E — Une voix intérieure

Suite de tests bout-en-bout avec [Playwright](https://playwright.dev/).

## Lancer en local

```bash
# 1. Installer les dépendances (une fois)
npm install
npx playwright install --with-deps chromium

# 2. Démarrer le serveur HTTP local (laisser tourner dans un terminal)
npm run serve
# → http://localhost:8080

# 3. Lancer les tests (autre terminal)
npm test                  # tous les tests
npm run test:headed       # avec navigateur visible
npm run test:ui           # mode interactif
npm run test:report       # voir le rapport HTML
```

## Couverture

| Fichier | Description | # tests |
|---|---|---|
| `01-homepage.spec.js` | Chargement, titre, hero, navigation, CSP, JSON-LD | 10 |
| `02-navigation.spec.js` | Navigation entre sections (SPA hash) | 9 |
| `03-accessibility.spec.js` | Images alt, boutons/liens labellisés, headings | 6 |
| `04-seo.spec.js` | robots.txt, sitemap.xml, meta tags, JSON-LD, OG, Twitter | 7 |
| `05-forms.spec.js` | Newsletter, validation HTML5, paiement Stripe/PayPal | 5 |
| `06-performance.spec.js` | Preconnect, WebP, lazy loading, images < 500 Ko | 6 |
| `07-shop.spec.js` | Boutique : affichage, erreurs JS, panier | 3 |
| **Total** | | **46** |

Multiplié par 2 navigateurs (Chromium desktop + mobile Pixel 5) = **92 tests**.

## CI/CD

Les tests s'exécutent automatiquement sur :
- Chaque push sur `main`
- Chaque pull request vers `main`
- Manuellement via `workflow_dispatch`

Workflow : [`.github/workflows/e2e-tests.yml`](../.github/workflows/e2e-tests.yml)

Les rapports HTML et traces (en cas d'échec) sont uploadés en artifacts pendant 14 jours.

## Bonnes pratiques

- **Pas de soumission réelle** des formulaires (on ne pollue pas la BDD Supabase).
- **Service worker bloqué** dans la config Playwright (évite les caches qui faussent les tests).
- **`workers: 1`** car `python http.server` est mono-thread (parallèle = timeouts).
- **Filtre des erreurs réseau externes** (Supabase, ipapi, CORS) dans les tests "0 erreur console" : ces erreurs surviennent uniquement en localhost et ne sont pas représentatives de la production.

## Ajouter un test

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Mon nouveau groupe', () => {
  test('mon test', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Une voix/);
  });
});
```

Sauve dans `tests/e2e/<numero>-<nom>.spec.js`.
