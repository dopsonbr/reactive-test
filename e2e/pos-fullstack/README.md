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
