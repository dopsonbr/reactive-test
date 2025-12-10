import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['E2E_BASE_URL'] || 'http://localhost:3003';

/**
 * POS Web E2E Test Configuration
 *
 * Tests run against MSW-mocked APIs by default.
 * Set VITE_MSW_ENABLED=true when starting the dev server.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './specs' }),
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
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'accessibility',
      testMatch: /accessibility\/.+\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment for additional browser coverage
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  webServer: {
    command: 'VITE_MSW_ENABLED=true pnpm nx serve pos-web',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    cwd: workspaceRoot,
  },
});
