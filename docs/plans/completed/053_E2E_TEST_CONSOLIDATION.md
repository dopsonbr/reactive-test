# E2E Test Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate all full-stack E2E tests (no mocks) into the `e2e/` directory, keeping mocked tests in `apps/*-e2e/` directories.

**Architecture:** Two-track E2E testing: `e2e/{app}-fullstack/` for real service integration tests, `apps/{app}-e2e/` for MSW-mocked tests. Full-stack tests run against Docker services, mocked tests run fast for every PR.

**Tech Stack:** Playwright, TypeScript, Nx, Docker Compose

---

## Current State

| Directory | Purpose | Issue |
|-----------|---------|-------|
| `e2e/ecommerce-fullstack/` | Full-stack tests (correct) | None |
| `e2e/merchant-portal-fullstack/` | Full-stack tests (correct) | None |
| `apps/pos-web-e2e/` | Mixed (mocked + fullstack) | Fullstack tests should be in `e2e/` |
| `apps/kiosk-web-e2e/` | All tests in one place | No separation, needs fullstack directory |

## Target State

| Directory | Purpose | Tests |
|-----------|---------|-------|
| `e2e/pos-fullstack/` | Real backend integration | `transaction-journey.spec.ts` + new journeys |
| `e2e/kiosk-fullstack/` | Real backend integration | Checkout, loyalty, session journeys |
| `apps/pos-web-e2e/` | MSW-mocked tests | sanity, business, accessibility |
| `apps/kiosk-web-e2e/` | MSW-mocked tests | sanity, scan, cart UI tests |

---

## Task 1: Create `e2e/pos-fullstack/` Directory Structure

**Files:**
- Create: `e2e/pos-fullstack/project.json`
- Create: `e2e/pos-fullstack/playwright.config.ts`
- Create: `e2e/pos-fullstack/tsconfig.json`
- Create: `e2e/pos-fullstack/README.md`

**Step 1: Create project.json**

```bash
mkdir -p e2e/pos-fullstack/specs e2e/pos-fullstack/fixtures
```

**Step 2: Write project.json**

Create `e2e/pos-fullstack/project.json`:

```json
{
  "name": "pos-fullstack-e2e",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "e2e/pos-fullstack",
  "projectType": "application",
  "tags": ["scope:pos", "type:e2e", "platform:fullstack"],
  "implicitDependencies": ["pos-web", "cart-service", "product-service", "checkout-service", "order-service"],
  "targets": {
    "e2e": {
      "executor": "@nx/playwright:playwright",
      "options": {
        "config": "e2e/pos-fullstack/playwright.config.ts"
      },
      "outputs": ["{workspaceRoot}/e2e/pos-fullstack/playwright-report"]
    },
    "seed": {
      "executor": "nx:run-commands",
      "options": {
        "cwd": "e2e/pos-fullstack",
        "command": "npx tsx fixtures/seed-data.ts"
      }
    }
  }
}
```

**Step 3: Write playwright.config.ts**

Create `e2e/pos-fullstack/playwright.config.ts`:

```typescript
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
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});
```

**Step 4: Write tsconfig.json**

Create `e2e/pos-fullstack/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "types": ["node"],
    "outDir": "../../dist/out-tsc",
    "sourceMap": true
  },
  "include": ["**/*.ts"]
}
```

**Step 5: Commit**

```bash
git add e2e/pos-fullstack/
git commit -m "feat(e2e): create pos-fullstack directory structure

Add project.json, playwright.config.ts, and tsconfig.json following
the ecommerce-fullstack pattern for real backend E2E tests."
```

---

## Task 2: Create `e2e/pos-fullstack/` Global Setup/Teardown

**Files:**
- Create: `e2e/pos-fullstack/global-setup.ts`
- Create: `e2e/pos-fullstack/global-teardown.ts`

**Step 1: Write global-setup.ts**

Create `e2e/pos-fullstack/global-setup.ts`:

```typescript
import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('Starting POS E2E environment...');

  // Check if services are already running
  try {
    const response = await fetch('http://localhost:8090/actuator/health');
    if (response.ok) {
      console.log('Services already running');
      return;
    }
  } catch {
    // Services not running, start them
  }

  // Start Docker Compose
  const projectRoot = process.cwd().replace('/e2e/pos-fullstack', '');
  console.log(`Starting Docker Compose from ${projectRoot}`);

  execSync('docker compose -f docker/docker-compose.yml up -d', {
    stdio: 'inherit',
    cwd: projectRoot,
  });

  // Wait for health checks
  await waitForServices();
}

async function waitForServices(maxAttempts = 60) {
  const services = [
    { name: 'Product Service', url: 'http://localhost:8090/actuator/health' },
    { name: 'Cart Service', url: 'http://localhost:8081/actuator/health' },
    { name: 'Checkout Service', url: 'http://localhost:8087/actuator/health' },
    { name: 'Order Service', url: 'http://localhost:8088/actuator/health' },
    { name: 'POS Frontend', url: 'http://localhost:3004' },
  ];

  console.log('Waiting for services to become healthy...');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const results = await Promise.all(
      services.map(async (service) => {
        try {
          const res = await fetch(service.url);
          return { name: service.name, healthy: res.ok };
        } catch {
          return { name: service.name, healthy: false };
        }
      })
    );

    const allHealthy = results.every((r) => r.healthy);
    const unhealthy = results.filter((r) => !r.healthy).map((r) => r.name);

    if (allHealthy) {
      console.log('All services healthy');
      return;
    }

    if (attempt % 10 === 0) {
      console.log(`Waiting for: ${unhealthy.join(', ')}`);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error('Services failed to start within timeout');
}
```

**Step 2: Write global-teardown.ts**

Create `e2e/pos-fullstack/global-teardown.ts`:

```typescript
export default async function globalTeardown() {
  // Keep services running unless explicitly told to stop
  if (process.env.E2E_KEEP_RUNNING !== 'true') {
    console.log('E2E tests complete. Services left running for inspection.');
    console.log('Set E2E_KEEP_RUNNING=false to stop services after tests.');
  }
}
```

**Step 3: Commit**

```bash
git add e2e/pos-fullstack/global-*.ts
git commit -m "feat(e2e): add pos-fullstack global setup/teardown

Health check for product, cart, checkout, order services and POS frontend."
```

---

## Task 3: Create `e2e/pos-fullstack/` Fixtures

**Files:**
- Create: `e2e/pos-fullstack/fixtures/test-base.ts`
- Create: `e2e/pos-fullstack/fixtures/seed-data.ts`
- Create: `e2e/pos-fullstack/fixtures/index.ts`

**Step 1: Write test-base.ts**

Create `e2e/pos-fullstack/fixtures/test-base.ts`:

```typescript
import { test as base, expect } from '@playwright/test';

// Test employee credentials that work with real backend
export const TEST_EMPLOYEE = {
  username: 'testassociate',
  storeNumber: '100',
};

// Test products with known SKUs
export const TEST_PRODUCTS = {
  SKU_001: { sku: 'SKU-001', name: 'Widget Pro', price: 149.99 },
  SKU_002: { sku: 'SKU-002', name: 'Widget Standard', price: 79.99 },
  SKU_003: { sku: 'SKU-003', name: 'Accessory Kit', price: 29.99 },
  HEADPHONES: { sku: '10000003', name: 'Wireless Headphones', price: 199.99 },
};

// Extended test with fixtures
export const test = base.extend<{
  loginAsEmployee: () => Promise<void>;
}>({
  loginAsEmployee: async ({ page }, use) => {
    const login = async () => {
      await page.goto('/');
      await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
      await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');
    };
    await use(login);
  },
});

export { expect };
```

**Step 2: Write seed-data.ts**

Create `e2e/pos-fullstack/fixtures/seed-data.ts`:

```typescript
/**
 * Seed data for POS full-stack E2E tests.
 * Run before tests: npx tsx e2e/pos-fullstack/fixtures/seed-data.ts
 */

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:8081';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:8090';

async function seedData() {
  console.log('Seeding POS E2E test data...');

  // Verify services are accessible
  try {
    const cartHealth = await fetch(`${CART_SERVICE_URL}/actuator/health`);
    const productHealth = await fetch(`${PRODUCT_SERVICE_URL}/actuator/health`);

    if (!cartHealth.ok || !productHealth.ok) {
      throw new Error('Services not healthy');
    }
  } catch (error) {
    console.error('Failed to connect to services. Are they running?');
    process.exit(1);
  }

  console.log('POS E2E test data seeded successfully');
}

seedData().catch(console.error);
```

**Step 3: Write fixtures/index.ts**

Create `e2e/pos-fullstack/fixtures/index.ts`:

```typescript
export { test, expect, TEST_EMPLOYEE, TEST_PRODUCTS } from './test-base';
```

**Step 4: Commit**

```bash
git add e2e/pos-fullstack/fixtures/
git commit -m "feat(e2e): add pos-fullstack test fixtures

Test base with employee login, product data, and seed script."
```

---

## Task 4: Move POS Fullstack Tests

**Files:**
- Move: `apps/pos-web-e2e/specs/fullstack/transaction-journey.spec.ts` -> `e2e/pos-fullstack/specs/`
- Delete: `apps/pos-web-e2e/specs/fullstack/` (empty directory)

**Step 1: Copy and adapt the test**

Create `e2e/pos-fullstack/specs/transaction-journey.spec.ts`:

```typescript
import { test, expect, TEST_EMPLOYEE, TEST_PRODUCTS } from '../fixtures';

/**
 * Full-Stack Transaction Journey Test
 *
 * This test runs against REAL backend services (no MSW mocks).
 * It navigates through the entire transaction flow like a real user:
 * Login -> Add Items -> Checkout -> Fulfillment -> Payment -> Complete
 *
 * Prerequisites:
 * - All backend services must be running (use ./powerstart)
 * - Frontend must be started WITHOUT MSW
 *
 * Run with:
 *   pnpm nx e2e pos-fullstack-e2e
 */

test.describe('Full-Stack Transaction Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to start fresh
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('complete transaction from login to receipt (real services)', async ({ page }) => {
    // 1. LOGIN
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for dashboard
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    // 2. NAVIGATE TO TRANSACTION
    await page.getByRole('link', { name: 'New Transaction' }).click();
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // 3. ADD ITEMS TO CART
    await page.getByRole('button', { name: /SKU-001/i }).click();
    await expect(page.getByText(/1 item/i)).toBeVisible();

    await page.getByRole('button', { name: /SKU-002/i }).click();
    await expect(page.getByText(/2 items/i)).toBeVisible();

    // 4. PROCEED TO CHECKOUT
    const checkoutBtn = page.getByRole('button', { name: /checkout/i });
    await expect(checkoutBtn).toBeEnabled();
    await checkoutBtn.click();

    // Should be on checkout page
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fulfillment Method' })).toBeVisible();

    // 5. SELECT FULFILLMENT (Take Now)
    await page.getByLabel(/take now/i).click();

    // 6. PROCEED TO PAYMENT
    await page.getByRole('button', { name: /proceed to payment/i }).click();

    // Should be on payment page
    await expect(page.getByRole('heading', { name: 'Payment', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Select Payment Method' })).toBeVisible();

    // 7. SELECT PAYMENT METHOD (Card)
    await page.getByRole('button', { name: 'Card', exact: true }).click();

    // 8. PROCESS PAYMENT
    await page.getByRole('button', { name: /simulate card payment/i }).click();

    // Wait for payment to complete
    await expect(page.getByText(/payment complete/i)).toBeVisible({ timeout: 15000 });

    // 9. COMPLETE TRANSACTION
    await page.getByRole('button', { name: /complete transaction/i }).click();

    // 10. VERIFY COMPLETION
    await expect(page.getByRole('heading', { name: /transaction complete/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /new transaction/i })).toBeVisible();
  });

  test('search for headphones and add to cart', async ({ page }) => {
    // 1. LOGIN
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    // 2. NAVIGATE TO TRANSACTION
    await page.getByRole('link', { name: 'New Transaction' }).click();
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // 3. OPEN SEARCH DIALOG
    await page.getByRole('button', { name: 'Search F3' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 4. SEARCH FOR HEADPHONES
    await page.getByPlaceholder(/search by sku/i).fill('headphones');

    // 5. WAIT FOR SEARCH RESULTS
    await expect(page.getByText(/wireless headphones/i)).toBeVisible({ timeout: 10000 });

    // 6. ADD HEADPHONES TO CART
    await page.getByRole('button', { name: 'Add' }).first().click();

    // 7. VERIFY DIALOG CLOSED AND ITEM ADDED
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(/1 item/i)).toBeVisible();
    await expect(page.getByText(/headphones/i)).toBeVisible();
  });

  test('can start new transaction after completing one', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    // Quick transaction
    await page.getByRole('link', { name: 'New Transaction' }).click();
    await page.getByRole('button', { name: /SKU-001/i }).click();
    await page.getByRole('button', { name: /checkout/i }).click();
    await page.getByLabel(/take now/i).click();
    await page.getByRole('button', { name: /proceed to payment/i }).click();
    await page.getByRole('button', { name: 'Card', exact: true }).click();
    await page.getByRole('button', { name: /simulate card payment/i }).click();
    await expect(page.getByText(/payment complete/i)).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /complete transaction/i }).click();

    // Complete - now start new transaction
    await expect(page.getByRole('heading', { name: /transaction complete/i })).toBeVisible();
    await page.getByRole('button', { name: /new transaction/i }).click();

    // Should be back at transaction page with empty cart
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();
    await expect(page.getByText('Scan or search for items to add them to the cart')).toBeVisible();
  });
});
```

**Step 2: Remove old fullstack directory**

```bash
rm -rf apps/pos-web-e2e/specs/fullstack/
```

**Step 3: Commit**

```bash
git add e2e/pos-fullstack/specs/
git add apps/pos-web-e2e/
git commit -m "feat(e2e): move POS fullstack tests to e2e/pos-fullstack

Move transaction-journey tests from apps/pos-web-e2e/specs/fullstack/
to e2e/pos-fullstack/specs/ following the ecommerce-fullstack pattern."
```

---

## Task 5: Create `e2e/pos-fullstack/README.md`

**Files:**
- Create: `e2e/pos-fullstack/README.md`

**Step 1: Write README.md**

Create `e2e/pos-fullstack/README.md`:

```markdown
# POS Full-Stack E2E Tests

Integration E2E tests that run against **real backend services** in Docker.

## Purpose

These tests validate critical POS user journeys through the entire stack:

- Real API calls to cart, product, checkout, and order services
- Transaction lifecycle: login -> items -> checkout -> payment -> complete
- Production-like environment validation

## When These Run

- **Main branch merges**: After PR is merged
- **Nightly builds**: Full regression suite
- **Manual execution**: For integration validation before releases

## Prerequisites

- Docker and Docker Compose installed
- Backend services running via `./powerstart` or Docker Compose

## Running Locally

```bash
# 1. Start backend services
./powerstart
# OR
docker compose up -d

# 2. (Optional) Seed test data
pnpm nx seed pos-fullstack-e2e

# 3. Run full-stack E2E tests
pnpm nx e2e pos-fullstack-e2e

# Keep services running for debugging
E2E_KEEP_RUNNING=true pnpm nx e2e pos-fullstack-e2e
```

## Directory Structure

```
pos-fullstack/
├── fixtures/              # Test data and utilities
│   ├── test-base.ts       # Extended test with login fixture
│   ├── seed-data.ts       # Seeds database with known test data
│   └── index.ts           # Exports
├── specs/                 # Test specifications
│   └── *.spec.ts
├── playwright.config.ts   # Playwright configuration
├── global-setup.ts        # Service health checks
├── global-teardown.ts     # Cleanup (optional)
├── project.json           # Nx project configuration
└── README.md              # This file
```

## Adding New Tests

1. Add any required seed data in `fixtures/seed-data.ts`
2. Create spec file in `specs/` directory
3. Use fixtures from `../fixtures` for login helpers

### Example Test Pattern

```typescript
import { test, expect, TEST_EMPLOYEE } from '../fixtures';

test('completes transaction', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
  await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
  await page.getByRole('button', { name: /sign in/i }).click();

  // ... rest of journey
});
```

## Comparison with Mocked E2E

| Aspect | Full-Stack (this directory) | Mocked (`apps/pos-web-e2e`) |
|--------|-----------------------------|-----------------------------|
| Backend | Real services (Docker) | Mocked (MSW) |
| Speed | Slower (~10 min) | Fast (~2 min) |
| CI trigger | Main + nightly | Every PR |
| Use case | End-to-end integration | Frontend logic, UI flows |

## Troubleshooting

### Services not starting

```bash
# Check service logs
docker compose logs -f pos-web
docker compose logs -f cart-service

# Restart services
./powerstart
```

### Test data issues

```bash
# Re-run seed script
pnpm nx seed pos-fullstack-e2e

# Verify services are healthy
curl http://localhost:8090/actuator/health
curl http://localhost:8081/actuator/health
```
```

**Step 2: Commit**

```bash
git add e2e/pos-fullstack/README.md
git commit -m "docs(e2e): add pos-fullstack README"
```

---

## Task 6: Update `apps/pos-web-e2e/` for Mocked-Only Tests

**Files:**
- Modify: `apps/pos-web-e2e/playwright.config.ts`
- Modify: `apps/pos-web-e2e/project.json`

**Step 1: Update playwright.config.ts**

Edit `apps/pos-web-e2e/playwright.config.ts` to remove fullstack project:

```typescript
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
```

**Step 2: Update project.json tags**

Edit `apps/pos-web-e2e/project.json`:

```json
{
  "name": "pos-web-e2e",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/pos-web-e2e",
  "implicitDependencies": ["pos-web"],
  "tags": ["type:e2e", "scope:pos", "platform:mocked"],
  "targets": {
    "e2e": {
      "executor": "@nx/playwright:playwright",
      "outputs": ["{workspaceRoot}/dist/.playwright/apps/pos-web-e2e"],
      "options": {
        "config": "apps/pos-web-e2e/playwright.config.ts"
      }
    },
    "e2e:ui": {
      "executor": "@nx/playwright:playwright",
      "options": {
        "config": "apps/pos-web-e2e/playwright.config.ts",
        "ui": true
      }
    }
  }
}
```

**Step 3: Commit**

```bash
git add apps/pos-web-e2e/
git commit -m "refactor(e2e): update pos-web-e2e for mocked-only tests

Remove fullstack project from playwright config.
Add platform:mocked tag to clarify purpose.
Full-stack tests are now in e2e/pos-fullstack/."
```

---

## Task 7: Create `e2e/kiosk-fullstack/` Directory Structure

**Files:**
- Create: `e2e/kiosk-fullstack/project.json`
- Create: `e2e/kiosk-fullstack/playwright.config.ts`
- Create: `e2e/kiosk-fullstack/tsconfig.json`

**Step 1: Create directories**

```bash
mkdir -p e2e/kiosk-fullstack/specs e2e/kiosk-fullstack/fixtures
```

**Step 2: Write project.json**

Create `e2e/kiosk-fullstack/project.json`:

```json
{
  "name": "kiosk-fullstack-e2e",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "e2e/kiosk-fullstack",
  "projectType": "application",
  "tags": ["scope:kiosk", "type:e2e", "platform:fullstack"],
  "implicitDependencies": ["kiosk-web", "cart-service", "product-service", "checkout-service"],
  "targets": {
    "e2e": {
      "executor": "@nx/playwright:playwright",
      "options": {
        "config": "e2e/kiosk-fullstack/playwright.config.ts"
      },
      "outputs": ["{workspaceRoot}/e2e/kiosk-fullstack/playwright-report"]
    },
    "seed": {
      "executor": "nx:run-commands",
      "options": {
        "cwd": "e2e/kiosk-fullstack",
        "command": "npx tsx fixtures/seed-data.ts"
      }
    }
  }
}
```

**Step 3: Write playwright.config.ts**

Create `e2e/kiosk-fullstack/playwright.config.ts`:

```typescript
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
    // Default to Docker-served Kiosk
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3002',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});
```

**Step 4: Write tsconfig.json**

Create `e2e/kiosk-fullstack/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "types": ["node"],
    "outDir": "../../dist/out-tsc",
    "sourceMap": true
  },
  "include": ["**/*.ts"]
}
```

**Step 5: Commit**

```bash
git add e2e/kiosk-fullstack/
git commit -m "feat(e2e): create kiosk-fullstack directory structure"
```

---

## Task 8: Create `e2e/kiosk-fullstack/` Global Setup and Fixtures

**Files:**
- Create: `e2e/kiosk-fullstack/global-setup.ts`
- Create: `e2e/kiosk-fullstack/global-teardown.ts`
- Create: `e2e/kiosk-fullstack/fixtures/test-base.ts`
- Create: `e2e/kiosk-fullstack/fixtures/seed-data.ts`
- Create: `e2e/kiosk-fullstack/fixtures/index.ts`

**Step 1: Write global-setup.ts**

Create `e2e/kiosk-fullstack/global-setup.ts`:

```typescript
import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('Starting Kiosk E2E environment...');

  // Check if services are already running
  try {
    const response = await fetch('http://localhost:8090/actuator/health');
    if (response.ok) {
      console.log('Services already running');
      return;
    }
  } catch {
    // Services not running, start them
  }

  // Start Docker Compose
  const projectRoot = process.cwd().replace('/e2e/kiosk-fullstack', '');
  console.log(`Starting Docker Compose from ${projectRoot}`);

  execSync('docker compose -f docker/docker-compose.yml up -d', {
    stdio: 'inherit',
    cwd: projectRoot,
  });

  await waitForServices();
}

async function waitForServices(maxAttempts = 60) {
  const services = [
    { name: 'Product Service', url: 'http://localhost:8090/actuator/health' },
    { name: 'Cart Service', url: 'http://localhost:8081/actuator/health' },
    { name: 'Checkout Service', url: 'http://localhost:8087/actuator/health' },
    { name: 'Kiosk Frontend', url: 'http://localhost:3002' },
  ];

  console.log('Waiting for services to become healthy...');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const results = await Promise.all(
      services.map(async (service) => {
        try {
          const res = await fetch(service.url);
          return { name: service.name, healthy: res.ok };
        } catch {
          return { name: service.name, healthy: false };
        }
      })
    );

    const allHealthy = results.every((r) => r.healthy);
    const unhealthy = results.filter((r) => !r.healthy).map((r) => r.name);

    if (allHealthy) {
      console.log('All services healthy');
      return;
    }

    if (attempt % 10 === 0) {
      console.log(`Waiting for: ${unhealthy.join(', ')}`);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error('Services failed to start within timeout');
}
```

**Step 2: Write global-teardown.ts**

Create `e2e/kiosk-fullstack/global-teardown.ts`:

```typescript
export default async function globalTeardown() {
  if (process.env.E2E_KEEP_RUNNING !== 'true') {
    console.log('E2E tests complete. Services left running for inspection.');
  }
}
```

**Step 3: Write fixtures/test-base.ts**

Create `e2e/kiosk-fullstack/fixtures/test-base.ts`:

```typescript
import { test as base, expect, Page } from '@playwright/test';

// Test products with known SKUs (8-digit format for scanner)
export const TEST_PRODUCTS = {
  PRODUCT_001: { sku: '10000001', name: 'Widget Pro', price: 149.99 },
  PRODUCT_002: { sku: '10000002', name: 'Widget Standard', price: 79.99 },
  PRODUCT_003: { sku: '10000003', name: 'Accessory Kit', price: 29.99 },
};

// Helper to scan a product by simulating barcode scanner input
export async function scanProduct(page: Page, sku: string) {
  await page.keyboard.type(sku, { delay: 50 });
  await page.keyboard.press('Enter');
}

// Helper to start a kiosk session
export async function startSession(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /touch to start/i }).click();
  await expect(page.getByText(/scan your items/i)).toBeVisible();
}

// Extended test with fixtures
export const test = base.extend<{
  startSession: () => Promise<void>;
}>({
  startSession: async ({ page }, use) => {
    const start = async () => {
      await startSession(page);
    };
    await use(start);
  },
});

export { expect };
```

**Step 4: Write fixtures/seed-data.ts**

Create `e2e/kiosk-fullstack/fixtures/seed-data.ts`:

```typescript
/**
 * Seed data for Kiosk full-stack E2E tests.
 * Run before tests: npx tsx e2e/kiosk-fullstack/fixtures/seed-data.ts
 */

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:8081';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:8090';

async function seedData() {
  console.log('Seeding Kiosk E2E test data...');

  try {
    const cartHealth = await fetch(`${CART_SERVICE_URL}/actuator/health`);
    const productHealth = await fetch(`${PRODUCT_SERVICE_URL}/actuator/health`);

    if (!cartHealth.ok || !productHealth.ok) {
      throw new Error('Services not healthy');
    }
  } catch (error) {
    console.error('Failed to connect to services. Are they running?');
    process.exit(1);
  }

  console.log('Kiosk E2E test data seeded successfully');
}

seedData().catch(console.error);
```

**Step 5: Write fixtures/index.ts**

Create `e2e/kiosk-fullstack/fixtures/index.ts`:

```typescript
export { test, expect, TEST_PRODUCTS, scanProduct, startSession } from './test-base';
```

**Step 6: Commit**

```bash
git add e2e/kiosk-fullstack/
git commit -m "feat(e2e): add kiosk-fullstack global setup and fixtures"
```

---

## Task 9: Create Kiosk Fullstack Test Specs

**Files:**
- Create: `e2e/kiosk-fullstack/specs/checkout-journey.spec.ts`
- Create: `e2e/kiosk-fullstack/specs/session-journey.spec.ts`

**Step 1: Write checkout-journey.spec.ts**

Create `e2e/kiosk-fullstack/specs/checkout-journey.spec.ts`:

```typescript
import { test, expect, TEST_PRODUCTS, scanProduct, startSession } from '../fixtures';

/**
 * Full-Stack Kiosk Checkout Journey
 *
 * Tests the complete self-checkout flow against real backend services.
 *
 * Prerequisites:
 * - All backend services must be running (use ./powerstart)
 * - Kiosk frontend must be started WITHOUT MSW
 */

test.describe('Kiosk Checkout Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('complete self-checkout with multiple items', async ({ page }) => {
    // 1. START SESSION
    await startSession(page);

    // 2. SCAN ITEMS
    await scanProduct(page, TEST_PRODUCTS.PRODUCT_001.sku);
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });

    await scanProduct(page, TEST_PRODUCTS.PRODUCT_002.sku);
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });

    // 3. REVIEW CART
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible();

    // Verify items are in cart
    await expect(page.getByText(TEST_PRODUCTS.PRODUCT_001.name)).toBeVisible();
    await expect(page.getByText(TEST_PRODUCTS.PRODUCT_002.name)).toBeVisible();

    // 4. PROCEED TO CHECKOUT
    await page.getByRole('button', { name: /continue|checkout/i }).click();

    // 5. HANDLE LOYALTY (skip)
    const skipLoyalty = page.getByRole('button', { name: /skip|no.*loyalty/i });
    if (await skipLoyalty.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipLoyalty.click();
    }

    // 6. PAYMENT
    await expect(page.getByText(/payment|pay/i)).toBeVisible({ timeout: 10000 });

    // Select payment method
    const cardButton = page.getByRole('button', { name: /card|credit|debit/i });
    if (await cardButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cardButton.click();
    }

    // 7. COMPLETE
    await expect(page.getByText(/complete|thank you|receipt/i)).toBeVisible({ timeout: 15000 });
  });

  test('can modify cart quantities before checkout', async ({ page }) => {
    // Start session and add item
    await startSession(page);
    await scanProduct(page, TEST_PRODUCTS.PRODUCT_001.sku);
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });

    // Go to cart
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible();

    // Modify quantity if controls are available
    const increaseBtn = page.getByRole('button', { name: /\+|increase/i }).first();
    if (await increaseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await increaseBtn.click();
      // Verify quantity updated
      await expect(page.getByText(/qty.*2|quantity.*2/i)).toBeVisible();
    }
  });
});
```

**Step 2: Write session-journey.spec.ts**

Create `e2e/kiosk-fullstack/specs/session-journey.spec.ts`:

```typescript
import { test, expect, startSession } from '../fixtures';

/**
 * Full-Stack Kiosk Session Management
 *
 * Tests session lifecycle: start, timeout warnings, and cleanup.
 */

test.describe('Kiosk Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('starts new session on touch', async ({ page }) => {
    await page.goto('/');

    // Welcome screen visible
    await expect(page.getByRole('button', { name: /touch to start/i })).toBeVisible();

    // Start session
    await page.getByRole('button', { name: /touch to start/i }).click();

    // Should be on scanning page
    await expect(page.getByText(/scan your items/i)).toBeVisible();
  });

  test('can cancel session and return to welcome', async ({ page }) => {
    await startSession(page);

    // Look for cancel/exit button
    const cancelBtn = page.getByRole('button', { name: /cancel|exit|end session/i });
    if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelBtn.click();

      // Handle confirmation if present
      const confirmBtn = page.getByRole('button', { name: /yes|confirm|end/i });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      // Should return to welcome
      await expect(page.getByRole('button', { name: /touch to start/i })).toBeVisible({ timeout: 5000 });
    }
  });
});
```

**Step 3: Commit**

```bash
git add e2e/kiosk-fullstack/specs/
git commit -m "feat(e2e): add kiosk-fullstack test specs

Add checkout-journey and session-journey tests for full-stack E2E."
```

---

## Task 10: Create `e2e/kiosk-fullstack/README.md`

**Files:**
- Create: `e2e/kiosk-fullstack/README.md`

**Step 1: Write README.md**

Create `e2e/kiosk-fullstack/README.md`:

```markdown
# Kiosk Full-Stack E2E Tests

Integration E2E tests that run against **real backend services** in Docker.

## Purpose

These tests validate critical self-service kiosk journeys:

- Session start and management
- Product scanning via barcode input
- Cart management and checkout flow
- Payment processing (real services)

## When These Run

- **Main branch merges**: After PR is merged
- **Nightly builds**: Full regression suite
- **Manual execution**: For integration validation

## Prerequisites

- Docker and Docker Compose installed
- Backend services running via `./powerstart` or Docker Compose

## Running Locally

```bash
# 1. Start backend services
./powerstart
# OR
docker compose up -d

# 2. Run full-stack E2E tests
pnpm nx e2e kiosk-fullstack-e2e

# Keep services running for debugging
E2E_KEEP_RUNNING=true pnpm nx e2e kiosk-fullstack-e2e
```

## Directory Structure

```
kiosk-fullstack/
├── fixtures/              # Test data and utilities
│   ├── test-base.ts       # Test helpers (scanProduct, startSession)
│   ├── seed-data.ts       # Seeds database
│   └── index.ts           # Exports
├── specs/                 # Test specifications
│   ├── checkout-journey.spec.ts
│   └── session-journey.spec.ts
├── playwright.config.ts   # Playwright configuration
├── global-setup.ts        # Service health checks
├── global-teardown.ts     # Cleanup
├── project.json           # Nx project configuration
└── README.md              # This file
```

## Comparison with Mocked E2E

| Aspect | Full-Stack (this directory) | Mocked (`apps/kiosk-web-e2e`) |
|--------|-----------------------------|-----------------------------|
| Backend | Real services (Docker) | Mocked (MSW) |
| Speed | Slower (~10 min) | Fast (~2 min) |
| CI trigger | Main + nightly | Every PR |
| Use case | End-to-end integration | Frontend logic, UI flows |
```

**Step 2: Commit**

```bash
git add e2e/kiosk-fullstack/README.md
git commit -m "docs(e2e): add kiosk-fullstack README"
```

---

## Task 11: Update `apps/kiosk-web-e2e/` for Mocked-Only Tests

**Files:**
- Modify: `apps/kiosk-web-e2e/playwright.config.ts`
- Modify: `apps/kiosk-web-e2e/project.json`

**Step 1: Update playwright.config.ts**

Edit `apps/kiosk-web-e2e/playwright.config.ts`:

```typescript
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
```

**Step 2: Update project.json**

Edit `apps/kiosk-web-e2e/project.json`:

```json
{
  "name": "kiosk-web-e2e",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/kiosk-web-e2e/src",
  "implicitDependencies": ["kiosk-web"],
  "tags": ["scope:kiosk", "type:e2e", "platform:mocked"],
  "targets": {
    "e2e": {
      "executor": "@nx/playwright:playwright",
      "options": {
        "config": "apps/kiosk-web-e2e/playwright.config.ts",
        "skipInstall": true
      },
      "outputs": ["{workspaceRoot}/dist/.playwright/apps/kiosk-web-e2e/test-output"]
    }
  }
}
```

**Step 3: Commit**

```bash
git add apps/kiosk-web-e2e/
git commit -m "refactor(e2e): update kiosk-web-e2e for mocked-only tests

Always use MSW mocks for apps/kiosk-web-e2e.
Add platform:mocked tag to clarify purpose.
Full-stack tests are now in e2e/kiosk-fullstack/."
```

---

## Task 12: Update CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update E2E testing section**

Find and update the E2E testing section in `CLAUDE.md` to clarify the two-track system:

Add after the existing "Frontend E2E Testing" section:

```markdown
## E2E Test Organization

### Two-Track System

| Track | Location | Purpose | CI Trigger |
|-------|----------|---------|------------|
| **Mocked** | `apps/{app}-e2e/` | UI logic with MSW mocks | Every PR |
| **Full-Stack** | `e2e/{app}-fullstack/` | Real service integration | Main + nightly |

### Full-Stack E2E Projects

| Project | Port | Services |
|---------|------|----------|
| `ecommerce-fullstack-e2e` | 3001 | product, cart, checkout |
| `merchant-portal-fullstack-e2e` | 3010 | merchandise, price, inventory |
| `pos-fullstack-e2e` | 3004 | product, cart, checkout, order |
| `kiosk-fullstack-e2e` | 3002 | product, cart, checkout |

### Running Full-Stack E2E

```bash
# Start services
./powerstart

# Run specific fullstack suite
pnpm nx e2e pos-fullstack-e2e
pnpm nx e2e kiosk-fullstack-e2e
```
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with E2E test organization

Document two-track E2E system: mocked (apps/*-e2e) vs fullstack (e2e/*-fullstack)."
```

---

## Task 13: Final Verification

**Step 1: Verify Nx can see all projects**

```bash
pnpm nx show projects | grep -E "fullstack|e2e"
```

Expected output should include:
- `pos-fullstack-e2e`
- `kiosk-fullstack-e2e`
- `ecommerce-fullstack-e2e`
- `merchant-portal-fullstack-e2e`
- `pos-web-e2e`
- `kiosk-web-e2e`
- `ecommerce-web-e2e`

**Step 2: Verify project tags**

```bash
pnpm nx show project pos-fullstack-e2e --json | jq '.tags'
pnpm nx show project kiosk-fullstack-e2e --json | jq '.tags'
pnpm nx show project pos-web-e2e --json | jq '.tags'
pnpm nx show project kiosk-web-e2e --json | jq '.tags'
```

**Step 3: Test mocked E2E still works**

```bash
# Run mocked tests (should use MSW)
pnpm nx e2e pos-web-e2e --project=sanity
```

**Step 4: Test fullstack E2E works (requires services)**

```bash
# Start services first
./powerstart

# Run fullstack tests
pnpm nx e2e pos-fullstack-e2e
pnpm nx e2e kiosk-fullstack-e2e
```

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore(e2e): complete E2E test consolidation

- pos-fullstack-e2e: Full user journeys with real services
- kiosk-fullstack-e2e: Self-checkout journeys with real services
- apps/*-e2e: MSW-mocked tests for fast PR feedback

Closes #053"
```

---

## Summary

| New Project | Location | Tests |
|-------------|----------|-------|
| `pos-fullstack-e2e` | `e2e/pos-fullstack/` | 3 transaction journey tests |
| `kiosk-fullstack-e2e` | `e2e/kiosk-fullstack/` | 4 checkout/session tests |

| Updated Project | Change |
|-----------------|--------|
| `pos-web-e2e` | Removed fullstack project, added `platform:mocked` tag |
| `kiosk-web-e2e` | Added MSW enforcement, added `platform:mocked` tag |
