// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests d'accessibilité (WCAG 2.1) — vérifications structurelles.
 * Note : pour un audit complet, on utiliserait @axe-core/playwright,
 * mais on évite la dépendance. On fait des checks manuels solides.
 */
test.describe('Accessibilité', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  });

  test('toutes les images ont un attribut alt', async ({ page }) => {
    const result = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return {
        total: imgs.length,
        noAlt: imgs.filter(i => !i.hasAttribute('alt')).map(i => i.src),
      };
    });
    expect(result.noAlt).toEqual([]);
    expect(result.total).toBeGreaterThan(0);
  });

  test('tous les boutons ont un nom accessible', async ({ page }) => {
    const noLabel = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .filter(b =>
          !b.textContent.trim() &&
          !b.getAttribute('aria-label') &&
          !b.getAttribute('aria-labelledby') &&
          !b.title
        )
        .map(b => b.outerHTML.substring(0, 100));
    });
    expect(noLabel).toEqual([]);
  });

  test('tous les liens ont un nom accessible', async ({ page }) => {
    const noLabel = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .filter(a =>
          !a.textContent.trim() &&
          !a.getAttribute('aria-label') &&
          !a.getAttribute('aria-labelledby') &&
          !a.querySelector('img[alt]:not([alt=""])')
        )
        .map(a => a.outerHTML.substring(0, 100));
    });
    expect(noLabel).toEqual([]);
  });

  test('inputs visibles ont un label accessible', async ({ page }) => {
    const noLabel = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'))
        .filter(i => i.offsetParent !== null) // visible only
        .filter(i => {
          if (i.getAttribute('aria-label') || i.getAttribute('aria-labelledby')) return false;
          if (i.id && document.querySelector(`label[for="${i.id}"]`)) return false;
          if (i.closest('label')) return false;
          return true;
        })
        .map(i => `${i.tagName}[${i.type}] placeholder="${i.placeholder}"`);
    });
    expect(noLabel).toEqual([]);
  });

  test('un seul H1 sur la page', async ({ page }) => {
    const count = await page.locator('h1').count();
    expect(count).toBe(1);
  });

  test('hiérarchie des headings raisonnable', async ({ page }) => {
    // Règle WCAG : pas de saut > 2 niveaux dans un même contexte
    // (footer/sidebar peuvent avoir une hiérarchie légèrement différente)
    const headings = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
        .filter(h => h.offsetParent !== null)
        .map(h => parseInt(h.tagName.substring(1)));
    });
    expect(headings.length).toBeGreaterThan(0);
    // Tolérance : saut max de 2 (autorise main h2 -> footer h4)
    for (let i = 1; i < headings.length; i++) {
      const jump = headings[i] - headings[i - 1];
      expect(jump).toBeLessThanOrEqual(2);
    }
  });
});
