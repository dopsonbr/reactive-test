# Mocked E2E Tests

Fast, isolated frontend E2E tests using **MSW (Mock Service Worker)** to mock API responses.

## Purpose

These tests validate frontend user journeys without requiring backend services. API responses are mocked using MSW handlers, enabling:

- Fast test execution (~2 minutes)
- Deterministic test data
- Edge case testing (error states, loading states, empty states)
- No Docker or backend setup required

## When These Run

- **Every PR**: Blocks merge on failure
- **Local development**: Quick feedback loop

## Running Locally

```bash
# Run all mocked E2E tests
pnpm nx e2e ecommerce-web-e2e

# Run with UI mode for debugging
pnpm nx e2e ecommerce-web-e2e --ui

# Run specific test file
pnpm nx e2e ecommerce-web-e2e --grep "product search"
```

## Directory Structure

```
e2e/
├── playwright.config.ts   # Playwright configuration
├── project.json           # Nx project configuration
├── specs/                 # Test specifications
│   └── *.spec.ts
└── README.md              # This file
```

## Adding New Tests

1. Add MSW handlers in `src/mocks/handlers.ts` for any new API endpoints
2. Add mock data in `src/mocks/data.ts`
3. Create spec file in `specs/` directory

### Example Test Pattern

```typescript
import { test, expect } from '@playwright/test';

test('displays product details', async ({ page }) => {
  await page.goto('/products/SKU-001');
  await expect(page.getByRole('heading', { name: /product name/i })).toBeVisible();
});

// Testing error states via route interception
test('handles API error gracefully', async ({ page }) => {
  await page.route('**/products/**', (route) =>
    route.fulfill({ status: 500, body: 'Server error' })
  );
  await page.goto('/products/SKU-001');
  await expect(page.getByText(/error/i)).toBeVisible();
});
```

## Comparison with Full-Stack E2E

| Aspect | Mocked (this directory) | Full-Stack (`e2e/ecommerce-fullstack`) |
|--------|-------------------------|----------------------------------------|
| Backend | Mocked (MSW) | Real services (Docker) |
| Speed | Fast (~2 min) | Slower (~10 min) |
| CI trigger | Every PR | Main + nightly |
| Use case | Frontend logic, UI flows | End-to-end integration |

## Related Documentation

- [MSW Documentation](https://mswjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- Root `CLAUDE.md` for full E2E testing overview
