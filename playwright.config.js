// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration Playwright — Une voix intérieure
 * Tests E2E sur les parcours critiques (accueil, navigation, formulaires, boutique).
 *
 * En CI, le serveur est démarré automatiquement (python http.server) avant les tests.
 * En local, lance `npm run serve` dans un autre terminal puis `npm test`.
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // 1 worker par défaut : python http.server est mono-thread,
  // plusieurs workers en parallèle saturent le socket et provoquent des timeouts.
  workers: 1,

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    // Désactive le service worker pour éviter les caches qui cassent les tests
    serviceWorkers: 'block',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    // Firefox + WebKit activables si besoin (commentés pour CI rapide)
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: process.env.CI
    ? {
        command: 'python3 -m http.server 8080',
        url: 'http://localhost:8080',
        reuseExistingServer: false,
        timeout: 30_000,
      }
    : undefined,
});
