import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    browserName: 'chromium',
    headless: true,
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: process.env.PLAYWRIGHT_BROWSER_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_BROWSER_EXECUTABLE }
      : undefined
  },
  webServer: { command: 'npx vite --host 127.0.0.1 --port 4173', port: 4173, reuseExistingServer: true },
  reporter: 'list'
});
