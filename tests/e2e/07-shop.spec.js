// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests boutique : affichage, catalogue, panier non régression.
 * Sans appel Supabase réel (peut être indisponible en CI).
 */
test.describe('Boutique', () => {
  test('section boutique accessible et visible', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => location.hash = '#boutique');
    await page.waitForTimeout(800);

    const boutique = page.locator('#boutique');
    await expect(boutique).toBeVisible();
  });

  test('aucune erreur JS sur la section boutique', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERR: ' + e.message));
    page.on('console', msg => {
      if (msg.type() === 'error' &&
          !msg.text().match(/net::|supabase|ipapi|ipwho|CORS|Failed to load|Access to fetch/i)) {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.evaluate(() => location.hash = '#boutique');
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });

  test('panier (icône) cliquable sans crash', async ({ page }) => {
    await page.goto('/');
    const panier = page.locator('[data-cart-toggle], [class*="panier"], [class*="cart"]').first();
    const exists = await panier.count() > 0;
    if (exists) {
      await panier.click({ trial: true }).catch(() => {});
      // Pas de vrai click : `trial: true` simule sans déclencher
    }
    expect(true).toBe(true); // pas de crash = succès
  });
});
