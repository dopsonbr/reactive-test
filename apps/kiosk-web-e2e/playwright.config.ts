import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import { fileURLToPath } from 'url';

// ESM-compatible __filename
const __filename = fileURLToPath(import.meta.url);

// For CI, you may want to set BASE_URL to the deployed application.
// When BASE_URL is set, we assume the server is already running (e.g., manual testing)
// Default to port 3002 (Vite dev server with proxy support for real backend E2E tests)
const baseURL = process.env['BASE_URL'] || 'http://localhost:3002';
const useExistingServer = !!process.env['BASE_URL'];
// Enable MSW (mock service worker) only when explicitly requested
const useMsw = process.env['VITE_MSW_ENABLED'] === 'true';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Run your local dev server before starting the tests */
  /* When BASE_URL is set, skip webServer (assume it's already running) */
  ...(useExistingServer ? {} : {
    webServer: {
      // Use Vite dev server (with proxy) for real backend E2E tests
      // Use preview server (no proxy) only when MSW mocks are enabled
      command: useMsw
        ? 'pnpm exec nx run kiosk-web:preview --port 3002'
        : 'pnpm exec nx run kiosk-web:serve --port 3002',
      url: 'http://localhost:3002',
      reuseExistingServer: true,
      cwd: workspaceRoot,
      timeout: 120000, // 2 minutes for dev server startup
      ...(useMsw ? { env: { VITE_MSW_ENABLED: 'true' } } : {}),
    },
  }),
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    
    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
