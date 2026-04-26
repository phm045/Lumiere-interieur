// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests des formulaires publics : structure, validation HTML5,
 * sans soumission réelle (on ne casse pas la BDD).
 */
test.describe('Formulaires publics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('formulaire newsletter présent et bien formé', async ({ page }) => {
    const form = page.locator('form[data-newsletter]').first();
    await expect(form).toBeVisible();

    // Champs requis avec aria-label (correction Chantier 2)
    const prenom = form.locator('input[name="prenom"]');
    const email = form.locator('input[name="email"]');
    await expect(prenom).toHaveAttribute('aria-label', /prénom/i);
    await expect(email).toHaveAttribute('aria-label', /adresse email/i);
    await expect(prenom).toHaveAttribute('required', '');
    await expect(email).toHaveAttribute('required', '');
    await expect(email).toHaveAttribute('type', 'email');

    // maxlength sur le prénom (Chantier C.2 audit Verdnet45 transposé)
    const maxlength = await prenom.getAttribute('maxlength');
    expect(parseInt(maxlength || '0')).toBeGreaterThan(0);
  });

  test('validation HTML5 bloque la soumission vide (newsletter)', async ({ page }) => {
    const form = page.locator('form[data-newsletter]').first();
    const submit = form.locator('button[type="submit"]');
    await submit.click();
    // L'input requis prend le focus → la soumission ne s'effectue pas
    const stillOnPage = page.url();
    expect(stillOnPage).not.toContain('?'); // pas de query string ajoutée
  });

  test('validation HTML5 rejette un email mal formé (newsletter)', async ({ page }) => {
    const form = page.locator('form[data-newsletter]').first();
    await form.locator('input[name="prenom"]').fill('Test');
    await form.locator('input[name="email"]').fill('pas-un-email');
    await form.locator('button[type="submit"]').click();

    // Le navigateur affiche son message natif → on vérifie via validity
    const isValid = await form.locator('input[name="email"]').evaluate(
      el => /** @type {HTMLInputElement} */(el).validity.valid
    );
    expect(isValid).toBe(false);
  });

  test('formulaire contact présent', async ({ page }) => {
    await page.evaluate(() => location.hash = '#contact');
    await page.waitForTimeout(500);
    // Au moins un formulaire ou un lien tel: + email
    const tel = page.locator('a[href^="tel:"]').first();
    const mailto = page.locator('a[href^="mailto:"]').first();
    const hasContactInfo = (await tel.count()) > 0 || (await mailto.count()) > 0;
    expect(hasContactInfo).toBe(true);
  });

  test('boutons paiement Stripe/PayPal présents dans services', async ({ page }) => {
    await page.evaluate(() => location.hash = '#services');
    await page.waitForTimeout(500);
    // Au moins un lien vers buy.stripe.com ou un bouton PayPal
    const stripeLinks = await page.locator('a[href*="buy.stripe.com"], button[data-payment="stripe"]').count();
    const paypalLinks = await page.locator('button.btn--paypal, [data-payment="paypal"]').count();
    expect(stripeLinks + paypalLinks).toBeGreaterThan(0);
  });
});
