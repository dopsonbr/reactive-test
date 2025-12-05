# 023B_FULLSTACK_E2E

**Status: DRAFT**

---

## Overview

Configure full-stack Playwright E2E tests that run against real backend services via Docker Compose. Create data seeding scripts, E2E-specific compose file, and CI jobs for both mocked and full-stack E2E tracks.

**Parent Plan:** [023_FRONTEND_FLOWS_AND_E2E](./023_FRONTEND_FLOWS_AND_E2E.md)

**Prerequisites:**
- `023A_MOCKED_E2E.md` complete (ecommerce-web app exists)
- Backend services buildable (`./gradlew bootJar`)
- Docker and Docker Compose installed

**Blockers:**
- `apps/ecommerce-web` must be functional
- Backend services must have stable API contracts
- Redis and PostgreSQL must be configured in Docker Compose

---

## Goals

1. Create E2E-specific Docker Compose configuration
2. Implement data seeding for reproducible test state
3. Create full-stack Playwright E2E project
4. Configure CI jobs for mocked and full-stack tracks
5. Document extensibility patterns in AGENTS.md

---

## Exit Criteria

- [ ] `docker compose -f docker-compose.e2e.yml up` starts all services
- [ ] Seeding script populates test data
- [ ] `nx e2e ecommerce-fullstack-e2e` passes against live services
- [ ] CI workflow runs both E2E tracks
- [ ] AGENTS.md documents E2E patterns

---

## Phase 1: E2E Docker Compose

**Prereqs:** Backend services exist, main docker-compose.yml works

### 1.1 E2E Compose File

**File:** `docker/docker-compose.e2e.yml`

```yaml
# Docker Compose for E2E testing - minimal services, fast startup
name: reactive-e2e

services:
  # Database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: e2e
      POSTGRES_PASSWORD: e2e
      POSTGRES_DB: e2e
    ports:
      - "5433:5432"
    volumes:
      - ./e2e-init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U e2e"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # External service mocks
  wiremock:
    image: wiremock/wiremock:3.3.1
    ports:
      - "8082:8080"
    volumes:
      - ../e2e-test/wiremock:/home/wiremock
    command: --verbose --global-response-templating

  # Product Service
  product-service:
    build:
      context: ../apps/product-service
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: e2e
      MERCHANDISE_URL: http://wiremock:8080
      PRICE_URL: http://wiremock:8080
      INVENTORY_URL: http://wiremock:8080
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      redis:
        condition: service_healthy
      wiremock:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 10s
      timeout: 5s
      retries: 10

  # Cart Service
  cart-service:
    build:
      context: ../apps/cart-service
      dockerfile: Dockerfile
    ports:
      - "8081:8080"
    environment:
      SPRING_PROFILES_ACTIVE: e2e
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: e2e
      POSTGRES_USER: e2e
      POSTGRES_PASSWORD: e2e
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 10s
      timeout: 5s
      retries: 10

  # Frontend (built for E2E)
  ecommerce-web:
    build:
      context: ..
      dockerfile: apps/ecommerce-web/Dockerfile
    ports:
      - "4200:80"
    environment:
      VITE_API_BASE_URL: http://localhost:8080
      VITE_CART_API_URL: http://localhost:8081
    depends_on:
      product-service:
        condition: service_healthy
      cart-service:
        condition: service_healthy
```

### 1.2 Database Init Script

**File:** `docker/e2e-init/01-schema.sql`

```sql
-- Cart service schema
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY,
    user_id VARCHAR(6) NOT NULL,
    store_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY,
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
```

---

## Phase 2: Data Seeding

**Prereqs:** Phase 1 complete

### 2.1 Seed Data Script

**File:** `e2e/ecommerce-fullstack/fixtures/seed-data.ts`

```typescript
#!/usr/bin/env npx tsx
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
  database: process.env.POSTGRES_DB || 'e2e',
  user: process.env.POSTGRES_USER || 'e2e',
  password: process.env.POSTGRES_PASSWORD || 'e2e',
});

async function seedDatabase() {
  const client = await pool.connect();
  try {
    // Clear existing data
    await client.query('TRUNCATE carts, cart_items CASCADE');

    // Seed test cart
    await client.query(`
      INSERT INTO carts (id, user_id, store_number)
      VALUES ('e2e-cart-001', 'E2EUSR', 1)
    `);

    // Seed cart items
    await client.query(`
      INSERT INTO cart_items (id, cart_id, sku, quantity, price)
      VALUES
        ('item-001', 'e2e-cart-001', 'SKU-001', 2, 299.99),
        ('item-002', 'e2e-cart-001', 'SKU-002', 1, 199.99)
    `);

    console.log('✅ Database seeded successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

async function seedWireMock() {
  // Add E2E-specific WireMock stubs
  const response = await fetch('http://localhost:8082/__admin/mappings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request: {
        method: 'GET',
        urlPathPattern: '/merchandise/SKU-E2E.*',
      },
      response: {
        status: 200,
        jsonBody: {
          sku: 'SKU-E2E-001',
          name: 'E2E Test Product',
          description: 'Product for E2E testing',
        },
      },
    }),
  });

  if (response.ok) {
    console.log('✅ WireMock stubs configured');
  }
}

async function main() {
  await seedDatabase();
  await seedWireMock();
}

main().catch(console.error);
```

### 2.2 Seed Runner Script

**File:** `e2e/ecommerce-fullstack/scripts/seed.sh`

```bash
#!/usr/bin/env bash
set -e

echo "🌱 Seeding E2E test data..."

# Wait for services to be healthy
echo "Waiting for services..."
until curl -sf http://localhost:8080/actuator/health > /dev/null; do
  sleep 2
done
until curl -sf http://localhost:8081/actuator/health > /dev/null; do
  sleep 2
done

# Run seed script
npx tsx fixtures/seed-data.ts

echo "✅ E2E environment ready"
```

---

## Phase 3: Full-Stack E2E Project

**Prereqs:** Phase 2 complete

### 3.1 Generate E2E Project

```bash
nx g @nx/playwright:configuration ecommerce-fullstack-e2e \
  --project=ecommerce-web \
  --directory=e2e/ecommerce-fullstack \
  --tags="scope:ecommerce,type:e2e"
```

### 3.2 Playwright Config

**File:** `e2e/ecommerce-fullstack/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false, // Sequential for data consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for full-stack tests
  reporter: [['html'], ['json', { outputFile: 'results.json' }]],
  timeout: 60000, // Longer timeout for real services
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});
```

### 3.3 Global Setup

**File:** `e2e/ecommerce-fullstack/global-setup.ts`

```typescript
import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('🚀 Starting E2E environment...');

  // Check if services are already running
  try {
    const response = await fetch('http://localhost:8080/actuator/health');
    if (response.ok) {
      console.log('✅ Services already running');
      return;
    }
  } catch {
    // Services not running, start them
  }

  // Start Docker Compose
  execSync('docker compose -f docker/docker-compose.e2e.yml up -d', {
    stdio: 'inherit',
    cwd: process.cwd().replace('/e2e/ecommerce-fullstack', ''),
  });

  // Wait for health checks
  await waitForServices();

  // Seed data
  execSync('bash scripts/seed.sh', { stdio: 'inherit' });
}

async function waitForServices(maxAttempts = 30) {
  const services = [
    'http://localhost:8080/actuator/health',
    'http://localhost:8081/actuator/health',
    'http://localhost:4200',
  ];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const results = await Promise.all(
      services.map(async (url) => {
        try {
          const res = await fetch(url);
          return res.ok;
        } catch {
          return false;
        }
      })
    );

    if (results.every(Boolean)) {
      console.log('✅ All services healthy');
      return;
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error('Services failed to start');
}
```

### 3.4 Global Teardown

**File:** `e2e/ecommerce-fullstack/global-teardown.ts`

```typescript
import { execSync } from 'child_process';

export default async function globalTeardown() {
  if (process.env.E2E_KEEP_RUNNING) {
    console.log('⏭️ Keeping services running (E2E_KEEP_RUNNING=true)');
    return;
  }

  console.log('🧹 Stopping E2E environment...');
  execSync('docker compose -f docker/docker-compose.e2e.yml down -v', {
    stdio: 'inherit',
    cwd: process.cwd().replace('/e2e/ecommerce-fullstack', ''),
  });
}
```

### 3.5 Full-Stack E2E Tests

**File:** `e2e/ecommerce-fullstack/specs/product-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Product Flow (Full-Stack)', () => {
  test('loads real product data from backend', async ({ page }) => {
    await page.goto('/');

    // Wait for real API response
    const response = await page.waitForResponse('**/products/search**');
    expect(response.status()).toBe(200);

    // Verify products loaded
    await expect(page.getByTestId(/product-card-/)).toHaveCount.greaterThan(0);
  });

  test('product detail shows real inventory status', async ({ page }) => {
    await page.goto('/products/SKU-001');

    // Real inventory check
    await expect(page.getByText(/in stock/i).or(page.getByText(/out of stock/i))).toBeVisible();
  });
});
```

**File:** `e2e/ecommerce-fullstack/specs/cart-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Cart Flow (Full-Stack)', () => {
  test.beforeEach(async ({ page }) => {
    // Set session for seeded cart
    await page.addInitScript(() => {
      sessionStorage.setItem('cartId', 'e2e-cart-001');
      sessionStorage.setItem('userId', 'E2EUSR');
      sessionStorage.setItem('storeNumber', '1');
    });
  });

  test('displays seeded cart items', async ({ page }) => {
    await page.goto('/cart');

    // Seeded items visible
    await expect(page.getByText('Wireless Headphones')).toBeVisible();
    await expect(page.getByText('Smart Watch')).toBeVisible();
  });

  test('persists cart updates to database', async ({ page }) => {
    await page.goto('/cart');

    // Update quantity
    const quantityInput = page.getByTestId('item-quantity').first();
    await quantityInput.fill('3');
    await quantityInput.blur();

    // Reload page
    await page.reload();

    // Quantity persisted
    await expect(page.getByTestId('item-quantity').first()).toHaveValue('3');
  });

  test('add to cart creates real database entry', async ({ page }) => {
    await page.goto('/products/SKU-003');

    await page.getByRole('button', { name: /add to cart/i }).click();

    // Navigate to cart
    await page.goto('/cart');

    // New item visible
    await expect(page.getByText('SKU-003')).toBeVisible();
  });
});
```

---

## Phase 4: CI Configuration

**Prereqs:** Phases 1-3 complete

### 4.1 E2E Workflow

**File:** `.github/workflows/e2e.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 6 * * *' # Nightly full-stack run

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Fast mocked E2E for all PRs
  e2e-mocked:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium webkit

      - name: Run Mocked E2E
        run: nx e2e ecommerce-web-e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-mocked-report
          path: apps/ecommerce-web/e2e/playwright-report/

  # Full-stack E2E (nightly or on main)
  e2e-fullstack:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    if: github.ref == 'refs/heads/main' || github.event_name == 'schedule'
    needs: e2e-mocked
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Build Backend JARs
        run: ./gradlew bootJar -x test

      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium

      - name: Start E2E Environment
        run: docker compose -f docker/docker-compose.e2e.yml up -d --build

      - name: Wait for Services
        run: |
          timeout 120 bash -c 'until curl -sf http://localhost:8080/actuator/health; do sleep 5; done'
          timeout 120 bash -c 'until curl -sf http://localhost:8081/actuator/health; do sleep 5; done'

      - name: Seed Data
        run: npx tsx e2e/ecommerce-fullstack/fixtures/seed-data.ts

      - name: Run Full-Stack E2E
        run: nx e2e ecommerce-fullstack-e2e

      - name: Collect Logs
        if: failure()
        run: docker compose -f docker/docker-compose.e2e.yml logs > docker-logs.txt

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-fullstack-artifacts
          path: |
            e2e/ecommerce-fullstack/playwright-report/
            docker-logs.txt

      - name: Cleanup
        if: always()
        run: docker compose -f docker/docker-compose.e2e.yml down -v
```

---

## Phase 5: Documentation

**Prereqs:** Phase 4 complete

### 5.1 AGENTS.md Update

Add to AGENTS.md:

```markdown
## Frontend E2E Testing

### Two E2E Tracks

| Track | When | Speed | Coverage |
|-------|------|-------|----------|
| **Mocked** | Every PR | ~2 min | All journeys, mocked APIs |
| **Full-Stack** | Main + nightly | ~10 min | Critical paths, real services |

### Running E2E Locally

```bash
# Mocked E2E (fast, no backend needed)
nx e2e ecommerce-web-e2e

# Full-stack E2E (requires Docker)
docker compose -f docker/docker-compose.e2e.yml up -d
npx tsx e2e/ecommerce-fullstack/fixtures/seed-data.ts
nx e2e ecommerce-fullstack-e2e

# Keep services running for debugging
E2E_KEEP_RUNNING=true nx e2e ecommerce-fullstack-e2e
```

### Adding New E2E Journeys

1. **Mocked tests** (`apps/ecommerce-web/e2e/specs/`):
   - Add MSW handlers in `src/mocks/handlers.ts`
   - Add mock data in `src/mocks/data.ts`
   - Create spec file with Playwright tests

2. **Full-stack tests** (`e2e/ecommerce-fullstack/specs/`):
   - Add seed data in `fixtures/seed-data.ts`
   - Add WireMock stubs if needed
   - Create spec with `test.beforeEach` for session setup

### E2E Test Patterns

```typescript
// Mocked: Use route interception for edge cases
test('handles API error gracefully', async ({ page }) => {
  await page.route('**/products/**', (route) =>
    route.fulfill({ status: 500, body: 'Server error' })
  );
  await page.goto('/products/SKU-001');
  await expect(page.getByText(/error/i)).toBeVisible();
});

// Full-stack: Use seeded data for consistency
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('cartId', 'e2e-cart-001');
  });
});
```

### CI Integration

- **PR builds**: Run `e2e-mocked` job (blocks merge on failure)
- **Main branch**: Run both `e2e-mocked` and `e2e-fullstack`
- **Nightly**: Full regression with `e2e-fullstack`
```

### 5.2 App README

**File:** `apps/ecommerce-web/README.md`

```markdown
# E-commerce Web

React + Vite e-commerce storefront with TanStack Router/Query.

## Development

```bash
# Start with mocked API (recommended for development)
VITE_MSW_ENABLED=true nx serve ecommerce-web

# Start against real backend
nx serve ecommerce-web
```

## Testing

```bash
# Unit/integration tests
nx test ecommerce-web

# Mocked E2E
nx e2e ecommerce-web-e2e

# Ladle stories
nx ladle ecommerce-web
```

## Feature Structure

```
src/features/{domain}/
├── api/          # TanStack Query hooks
├── components/   # Smart + presentational
├── pages/        # Route components
└── types/        # TypeScript types
```
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `docker/docker-compose.e2e.yml` | E2E Docker environment |
| CREATE | `docker/e2e-init/01-schema.sql` | Database schema |
| CREATE | `e2e/ecommerce-fullstack/` | Full-stack E2E project |
| CREATE | `e2e/ecommerce-fullstack/fixtures/seed-data.ts` | Data seeding |
| CREATE | `e2e/ecommerce-fullstack/specs/` | E2E test specs |
| CREATE | `.github/workflows/e2e.yml` | CI workflow |
| MODIFY | `AGENTS.md` | E2E documentation |
| CREATE | `apps/ecommerce-web/README.md` | App documentation |

---

## Checklist

- [ ] Phase 1: docker-compose.e2e.yml created
- [ ] Phase 2: Seeding scripts working
- [ ] Phase 3: ecommerce-fullstack-e2e project created
- [ ] Phase 4: CI workflow configured
- [ ] Phase 5: Documentation updated
- [ ] Full-stack E2E passes locally
- [ ] CI runs both E2E tracks
- [ ] AGENTS.md documents E2E patterns
