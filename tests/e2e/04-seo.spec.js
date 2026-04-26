// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests SEO : robots.txt, sitemap.xml, meta tags, JSON-LD.
 */
test.describe('SEO', () => {
  test('robots.txt accessible et bien formé', async ({ request }) => {
    const resp = await request.get('/robots.txt');
    expect(resp.status()).toBe(200);
    const body = await resp.text();
    expect(body).toMatch(/User-agent: \*/);
    expect(body).toMatch(/Sitemap: https?:\/\/[^\s]*sitemap\.xml/);
    // Bots IA bloqués
    expect(body).toMatch(/User-agent: GPTBot[\s\S]*Disallow: \//);
  });

  test('sitemap.xml accessible et bien formé', async ({ request }) => {
    const resp = await request.get('/sitemap.xml');
    expect(resp.status()).toBe(200);
    const body = await resp.text();
    expect(body).toMatch(/<\?xml version="1\.0"/);
    expect(body).toMatch(/<urlset/);
    expect(body).toMatch(/<loc>https:\/\/www\.une-voix-interieure\.fr\//);
  });

  test('manifest.json accessible (PWA)', async ({ request }) => {
    const resp = await request.get('/manifest.json');
    expect(resp.status()).toBe(200);
  });

  test('meta description optimale (120-200 chars)', async ({ page }) => {
    await page.goto('/');
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc.length).toBeLessThanOrEqual(200);
  });

  test('Open Graph complet', async ({ page }) => {
    await page.goto('/');
    for (const prop of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:locale']) {
      await expect(page.locator(`meta[property="${prop}"]`).first()).toHaveCount(1);
    }
  });

  test('Twitter Cards complet', async ({ page }) => {
    await page.goto('/');
    for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
      await expect(page.locator(`meta[name="${name}"]`)).toHaveCount(1);
    }
  });

  test('JSON-LD : LocalBusiness avec champs critiques', async ({ page }) => {
    await page.goto('/');
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    const parsed = JSON.parse(jsonLd);
    const business = (parsed['@graph'] || [parsed]).find(e => e['@type'] === 'LocalBusiness');
    expect(business).toBeDefined();
    expect(business.name).toBe('Une voix intérieure');
    expect(business.telephone).toMatch(/^\+33/);
    expect(business.url).toMatch(/^https:\/\/www\.une-voix-interieure\.fr/);
  });
});
