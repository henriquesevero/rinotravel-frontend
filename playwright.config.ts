import { defineConfig, devices } from '@playwright/test';

const WEB_URL = 'http://localhost:3000';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080';

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
      // Serves the production web export; run `npm run build:web` first (`npm run e2e` does).
      command: 'npx serve -s dist -l 3000',
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
    },
    {
      // Needs MongoDB (a replica set) from `make db-up` in the API repository.
      command:
        'bash -c "cd ../rinotravel-api && set -a && . ./.env && set +a && ' +
        'AUTH_RATE_LIMIT=1000 MONGODB_DATABASE=rinotravel_e2e CORS_ALLOWED_ORIGINS=' +
        WEB_URL +
        ' go run ./cmd/api"',
      url: `${API_URL}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
