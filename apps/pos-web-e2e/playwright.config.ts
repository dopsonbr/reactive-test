import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['E2E_BASE_URL'] || 'http://localhost:3004';

/**
 * POS Web E2E Test Configuration
 *
 * Mocked tests using MSW for API mocking.
 * For full-stack tests, see: e2e/pos-fullstack/
 */
export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Run sanity checks first to catch fundamental issues
    {
      name: 'sanity',
      testMatch: /sanity\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Business scenarios depend on sanity passing
    {
      name: 'chromium',
      testMatch: /business\/.+\.spec\.ts/,
      dependencies: ['sanity'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'accessibility',
      testMatch: /accessibility\/.+\.spec\.ts/,
      dependencies: ['sanity'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'VITE_MSW_ENABLED=true pnpm nx serve pos-web',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
