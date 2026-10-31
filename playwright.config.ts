import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    // En tu compu usa el Chrome ya instalado.
    // En el CI (GitHub) usa el navegador que descarga Playwright.
    ...(process.env.CI ? {} : { channel: 'msedge' }),
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
