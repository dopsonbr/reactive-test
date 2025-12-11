# Merchant Portal E2E Tests

End-to-end tests for the Merchant Portal running against real backend services (no mocks).

## Prerequisites

The following services must be running via Docker:

- `merchant-portal` (port 3010)
- `merchandise-service` (port 8091)
- `price-service` (port 8092)
- `inventory-service` (port 8093)
- `user-service` (port 8089)

## Test Data Management

Tests use isolated data to prevent flakiness:

### Strategy
1. **Unique SKUs**: Tests that create products use timestamp-based unique SKUs
2. **Automatic Cleanup**: Created test data is tracked and cleaned up after each test
3. **Known Test Data**: Predictable SKUs (9000001-9999999) reserved for E2E tests
4. **API Direct Access**: Setup/teardown uses API calls, not UI interactions

### Using Test Fixtures

```typescript
import { test, expect, testApi } from '../fixtures/test-base';

test('creates a product', async ({ page, uniqueSku, testData }) => {
  const sku = uniqueSku();     // Generate unique SKU
  testData.trackSku(sku);       // Track for auto-cleanup
  // ... test creates product with this SKU
  // Cleanup happens automatically after test
});
```

### Direct API Access

For test setup that bypasses UI:

```typescript
import { testApi } from '../fixtures/test-base';

// Create test data before test
await testApi.createProduct({ sku: 9000001, name: 'Test', suggestedRetailPrice: 19.99 });

// Set specific inventory state
await testApi.setInventory(9000001, 5);  // Low stock

// Cleanup after test
await testApi.deleteProduct(9000001);
```

## Running Tests

### Start the backend services

```bash
cd docker
docker compose up -d merchant-portal
```

Wait for all services to be healthy:

```bash
docker compose ps
```

### Run the tests

```bash
# Run all merchant portal E2E tests
pnpm nx e2e merchant-portal-fullstack-e2e

# Run with headed browser (for debugging)
pnpm nx e2e merchant-portal-fullstack-e2e -- --headed

# Run a specific test file
pnpm nx e2e merchant-portal-fullstack-e2e -- --grep "Products Journey"

# Keep browser open after failure
pnpm nx e2e merchant-portal-fullstack-e2e -- --headed --debug
```

### Custom base URL

By default, tests run against `http://localhost:3010`. To use a different URL:

```bash
E2E_BASE_URL=http://localhost:4201 pnpm nx e2e merchant-portal-fullstack-e2e
```

## Test Coverage

| Journey | Tests |
|---------|-------|
| Products | View list, Create, Edit, Cancel edit, Pagination |
| Pricing | View list, Update price, Set sale price, Cancel edit, Pagination |
| Inventory | View list, Update quantity, Stock status, Low stock filter, Cancel edit, Pagination |

## Debugging

### View test report

After running tests, open the HTML report:

```bash
npx playwright show-report e2e/merchant-portal-fullstack/playwright-report
```

### Traces

On failure, traces are saved automatically. View them with:

```bash
npx playwright show-trace e2e/merchant-portal-fullstack/test-results/<test-name>/trace.zip
```
