import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false, // Run sequentially for transaction flow
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for sequential tests
  reporter: [['html', { open: 'never' }], ['list']],
  outputDir: '../../dist/.playwright/apps/offline-pos-e2e/test-results',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3005',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't start webserver - expect app to be running
  // webServer: {
  //   command: 'go run .',
  //   url: 'http://localhost:3000/api/status',
  //   reuseExistingServer: true,
  // },
});
