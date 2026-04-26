// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests page d'accueil : chargement, contenu critique, SEO, sécurité.
 */
test.describe('Page d\'accueil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('charge sans erreur console', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push('PAGEERR: ' + err.message));

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Tolérer 0 erreur (en local : peut y avoir des erreurs réseau Supabase qu'on filtre)
    const realErrors = errors.filter(e =>
      !e.match(/net::|supabase|ipapi|ipwho|CORS|Failed to load resource|Access to fetch/i)
    );
    expect(realErrors).toEqual([]);
  });

  test('affiche le titre et la meta description', async ({ page }) => {
    await expect(page).toHaveTitle(/Une voix intérieure/);
    const desc = page.locator('meta[name="description"]');
    await expect(desc).toHaveAttribute('content', /voyance/i);
  });

  test('affiche le hero et le bouton CTA', async ({ page }) => {
    const hero = page.locator('.hero, [class*="hero"]').first();
    await expect(hero).toBeVisible();
    // Au moins un CTA "Découvrir / Réserver / Consulter"
    const cta = page.getByRole('link', { name: /découvrir|réserver|consulter|services/i }).first();
    await expect(cta).toBeVisible();
  });

  test('navigation principale visible et accessible', async ({ page }) => {
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
    // Vérifier les liens essentiels
    for (const label of ['Accueil', 'Services', 'Boutique', 'Contact']) {
      await expect(page.getByRole('link', { name: new RegExp(label, 'i') }).first()).toBeVisible();
    }
  });

  test('skip link présent (a11y)', async ({ page }) => {
    const skip = page.locator('.skip-link, [href="#main"]').first();
    await expect(skip).toHaveCount(1);
  });

  test('langue documentaire = fr', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('fr');
  });

  test('CSP active (meta http-equiv)', async ({ page }) => {
    const csp = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(csp).toHaveCount(1);
    const content = await csp.getAttribute('content');
    expect(content).toMatch(/default-src 'self'/);
    expect(content).toMatch(/upgrade-insecure-requests/);
  });

  test('headers de sécurité présents', async ({ page }) => {
    await expect(page.locator('meta[http-equiv="X-Content-Type-Options"]')).toHaveCount(1);
    await expect(page.locator('meta[http-equiv="Permissions-Policy"]')).toHaveCount(1);
    await expect(page.locator('meta[name="referrer"]')).toHaveCount(1);
  });

  test('JSON-LD structured data valide', async ({ page }) => {
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toBeTruthy();
    const parsed = JSON.parse(jsonLd);
    // @graph attendu après Chantier 2
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@graph']).toBeDefined();
    expect(Array.isArray(parsed['@graph'])).toBe(true);
    const types = parsed['@graph'].map(e => e['@type']);
    expect(types).toContain('LocalBusiness');
    expect(types).toContain('WebSite');
  });

  test('canonical URL correcte', async ({ page }) => {
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://www.une-voix-interieure.fr/');
  });
});
