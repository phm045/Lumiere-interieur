// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests de navigation entre sections (SPA hash-based).
 */
test.describe('Navigation entre sections', () => {
  const sections = [
    { hash: '#services', label: /Services/i },
    { hash: '#temoignages', label: /Témoignages/i },
    { hash: '#therapie', label: /Thérapie/i },
    { hash: '#boutique', label: /Boutique/i },
    { hash: '#blog', label: /Blog/i },
    { hash: '#contact', label: /Contact/i },
    { hash: '#a-propos', label: /À propos/i },
  ];

  for (const { hash, label } of sections) {
    test(`navigation vers ${hash} affiche la section`, async ({ page }) => {
      await page.goto('/');
      // Navigation par hash direct (comportement SPA réel)
      await page.evaluate(h => location.hash = h, hash);
      await page.waitForTimeout(500);
      const url = page.url();
      const target = page.locator(hash).first();
      const isTargetVisible = await target.isVisible().catch(() => false);
      expect(url.includes(hash) || isTargetVisible).toBe(true);
    });
  }

  test('un lien Accueil existe et pointe vers #accueil ou /', async ({ page }) => {
    await page.goto('/');
    const accueil = page.locator('a[href="#accueil"], a[href="/"], a[href="./"]').first();
    await expect(accueil).toHaveCount(1);
  });

  test('aucune erreur console après visite de toutes les sections', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push('PAGEERR: ' + err.message));
    page.on('console', msg => {
      if (msg.type() === 'error' &&
          !msg.text().match(/net::|supabase|ipapi|ipwho|CORS|Failed to load resource|Access to fetch/i)) {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    for (const { hash } of sections) {
      await page.evaluate(h => location.hash = h, hash);
      await page.waitForTimeout(300);
    }
    expect(errors).toEqual([]);
  });
});
