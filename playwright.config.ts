import { defineConfig, devices } from '@playwright/test';

// The e2e run has its own site, API and database (ports 3100 and 18080), so it never touches the
// demo data and never calls Google, whatever key the development .env holds.
const WEB_URL = 'http://localhost:3100';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:18080';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: WEB_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
  webServer: [
    {
      // Serves the e2e web export with production headers; `npm run e2e` builds it first.
      command: 'EXPO_PUBLIC_API_URL=' + API_URL + ' node scripts/preview.mjs dist-e2e 3100',
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
    },
    {
      // Needs MongoDB (a replica set) from `make db-up` in the API repository. The Google key is
      // blanked on purpose: the tests expect the "not configured" behavior.
      command:
        'bash -c "cd ../rinotravel-api && set -a && . ./.env && set +a && ' +
        'PORT=18080 API_PUBLIC_URL=' +
        API_URL +
        ' AUTH_RATE_LIMIT=1000 MONGODB_DATABASE=rinotravel_e2e GOOGLE_MAPS_API_KEY= ' +
        'CORS_ALLOWED_ORIGINS=' +
        WEB_URL +
        ' go run ./cmd/api"',
      url: `${API_URL}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
