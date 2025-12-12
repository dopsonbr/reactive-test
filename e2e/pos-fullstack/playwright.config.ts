import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false, // Sequential for data consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for full-stack tests
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'results.json' }],
  ],
  timeout: 60000, // Longer timeout for real services
  use: {
    // Default to Docker-served POS
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3004',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Run sanity checks first to catch fundamental issues
    {
      name: 'sanity',
      testMatch: /sanity\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Journey tests depend on sanity passing
    {
      name: 'chromium',
      testMatch: /.*-journey\.spec\.ts/,
      dependencies: ['sanity'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});
