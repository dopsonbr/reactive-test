import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// MSW-mocked tests only - for full-stack tests, see e2e/kiosk-fullstack/
const baseURL = process.env['BASE_URL'] || 'http://localhost:3002';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    // Always use MSW mocks for this project
    command: 'VITE_MSW_ENABLED=true pnpm exec nx run kiosk-web:serve --port 3002',
    url: 'http://localhost:3002',
    reuseExistingServer: true,
    cwd: workspaceRoot,
    timeout: 120000,
    env: { VITE_MSW_ENABLED: 'true' },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
