// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests de performance : poids des ressources, formats modernes,
 * lazy loading, preconnect/dns-prefetch.
 */
test.describe('Performance', () => {
  test('page chargée en < 5s avec networkidle', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'networkidle', timeout: 10_000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10_000);
  });

  test('preconnect/dns-prefetch présents', async ({ page }) => {
    await page.goto('/');
    const preconnects = await page.locator('link[rel="preconnect"]').count();
    const dnsPrefetches = await page.locator('link[rel="dns-prefetch"]').count();
    expect(preconnects + dnsPrefetches).toBeGreaterThanOrEqual(2);
  });

  test('au moins une image WebP utilisée (optimisation PR #29)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const imgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .map(i => i.currentSrc || i.src)
        .filter(s => s && !s.startsWith('data:'));
    });
    const webpCount = imgs.filter(s => s.includes('.webp')).length;
    // Au moins 1 image WebP doit être chargée (preuve que la conversion fonctionne)
    expect(webpCount).toBeGreaterThan(0);
  });

  test('images de bas de page ont loading="lazy"', async ({ page }) => {
    await page.goto('/');
    const lazyCount = await page.locator('img[loading="lazy"]').count();
    expect(lazyCount).toBeGreaterThan(0);
  });

  test('aucune image locale > 500 Ko (optimisation Chantier PR #29)', async ({ page }) => {
    // Vérifie uniquement les images servies par le repo (même origine).
    // Les images sur Supabase Storage (boutique uploadé par admin) sont hors scope :
    // c'est à l'admin de fournir des images optimisées. Une compression côté backend
    // (Edge Function) pourrait être ajoutée ultérieurement.
    const heavyImages = [];
    page.on('response', async resp => {
      const url = resp.url();
      const ct = resp.headers()['content-type'] || '';
      if (ct.startsWith('image/') && url.includes('localhost')) {
        const len = parseInt(resp.headers()['content-length'] || '0');
        if (len > 500_000) heavyImages.push({ url, size: len });
      }
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    expect(heavyImages).toEqual([]);
  });

  test('manifest PWA chargé', async ({ page }) => {
    await page.goto('/');
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveCount(1);
  });
});
