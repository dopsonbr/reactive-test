# Full-Stack E2E Tests

Integration E2E tests that run against **real backend services** in Docker.

## Purpose

These tests validate critical user journeys through the entire stack, including:

- Real API calls to backend services
- Database interactions
- Service-to-service communication
- Production-like environment validation

## When These Run

- **Main branch merges**: After PR is merged
- **Nightly builds**: Full regression suite
- **Manual execution**: For integration validation before releases

## Prerequisites

- Docker and Docker Compose installed
- Backend services running via Docker Compose

## Running Locally

```bash
# 1. Start backend services
docker compose -f docker/docker-compose.e2e.yml up -d --build

# 2. Seed test data
npx tsx e2e/ecommerce-fullstack/fixtures/seed-data.ts

# 3. Run full-stack E2E tests
pnpm nx e2e ecommerce-fullstack-e2e

# Keep services running for debugging
E2E_KEEP_RUNNING=true pnpm nx e2e ecommerce-fullstack-e2e
```

## Directory Structure

```
ecommerce-fullstack/
├── fixtures/              # Test data seeding
│   └── seed-data.ts       # Seeds database with known test data
├── specs/                 # Test specifications
│   └── *.spec.ts
├── playwright.config.ts   # Playwright configuration
├── project.json           # Nx project configuration
└── README.md              # This file
```

## Adding New Tests

1. Add seed data in `fixtures/seed-data.ts` for any new test scenarios
2. Add WireMock stubs if mocking external services
3. Create spec file in `specs/` directory

### Example Test Pattern

```typescript
import { test, expect } from '@playwright/test';

// Set up session data before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('cartId', 'e2e-cart-001');
  });
});

test('completes checkout flow', async ({ page }) => {
  await page.goto('/cart');
  await page.getByRole('button', { name: /checkout/i }).click();
  await expect(page.getByText(/order confirmed/i)).toBeVisible();
});
```

## Test Data Management

- **Seed data**: Created via `fixtures/seed-data.ts` before test runs
- **Cleanup**: Tests should be idempotent; seed script handles reset
- **Known IDs**: Use predictable IDs (e.g., `e2e-cart-001`) for reliable assertions

## Comparison with Mocked E2E

| Aspect | Full-Stack (this directory) | Mocked (`apps/ecommerce-web/e2e`) |
|--------|-----------------------------|------------------------------------|
| Backend | Real services (Docker) | Mocked (MSW) |
| Speed | Slower (~10 min) | Fast (~2 min) |
| CI trigger | Main + nightly | Every PR |
| Use case | End-to-end integration | Frontend logic, UI flows |

## Troubleshooting

### Services not starting

```bash
# Check service logs
docker compose -f docker/docker-compose.e2e.yml logs -f

# Restart services
docker compose -f docker/docker-compose.e2e.yml down -v
docker compose -f docker/docker-compose.e2e.yml up -d --build
```

### Test data issues

```bash
# Re-run seed script
npx tsx e2e/ecommerce-fullstack/fixtures/seed-data.ts

# Verify data was seeded
curl http://localhost:8080/products/e2e-product-001
```

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Docker Compose E2E Configuration](../../docker/docker-compose.e2e.yml)
- Root `CLAUDE.md` for full E2E testing overview
