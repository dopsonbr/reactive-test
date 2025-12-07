# 038D_KIOSK_E2E_TESTING

**Status: DRAFT**

---

## Overview

Comprehensive E2E testing strategy for the kiosk application, including shared MSW handlers, Playwright test specs, and full-stack integration testing.

**Related Plans:**
- `038_SELF_CHECKOUT_KIOSK.md` - Parent initiative
- `038C_KIOSK_FEATURES.md` - Features being tested

## Goals

1. Create shared MSW mock handlers for reuse across apps
2. Build comprehensive E2E test suite for kiosk flows
3. Establish full-stack E2E testing with Docker services
4. Ensure accessibility compliance for kiosk UI

## References

**Standards:**
- `docs/standards/frontend/testing.md` - Testing Trophy, E2E patterns

---

## E2E Testing Strategy

### Two-Track Approach

| Track | Purpose | Speed | When |
|-------|---------|-------|------|
| **Mocked (MSW)** | Fast feedback, all scenarios | ~2 min | Every PR |
| **Full-Stack** | Real service integration | ~10 min | Main branch, nightly |

### Test Coverage Matrix

| Flow | Happy Path | Error Cases | Edge Cases |
|------|------------|-------------|------------|
| **Scan** | Scan product → Added | Product not found, Out of stock | Rapid scans, Manual entry |
| **Cart** | Update qty, Remove | Empty cart, API errors | Max quantity, Zero quantity |
| **Loyalty** | Phone found, Email found | Not found, Invalid input | Skip loyalty |
| **Checkout** | Complete payment | Payment failed, Timeout | Discounts applied |
| **Session** | Start/reset transaction | Inactivity timeout | Cancel mid-transaction |

---

## Phase 1: Shared Mock Handlers Library

**Prereqs:** None
**Blockers:** None

### 1.1 Create Library Structure

**Files:**
- CREATE: `libs/frontend/shared-testing/mock-handlers/project.json`
- CREATE: `libs/frontend/shared-testing/mock-handlers/src/index.ts`
- MODIFY: `tsconfig.base.json` - Add path alias

Path alias: `@reactive-platform/mock-handlers`

### 1.2 Product Mock Handlers

**Files:**
- CREATE: `libs/frontend/shared-testing/mock-handlers/src/handlers/products.ts`

**Implementation:**
```typescript
import { http, HttpResponse, delay } from 'msw';
import { mockProducts } from '../data/products';

export const productHandlers = [
  // Search products
  http.get('*/products/search', async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    const category = url.searchParams.get('category') || '';

    let filtered = [...mockProducts];
    if (query) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    return HttpResponse.json({
      products: filtered,
      total: filtered.length,
      page: 1,
      totalPages: 1,
    });
  }),

  // Get product by SKU
  http.get('*/products/:sku', async ({ params }) => {
    await delay(50);
    const product = mockProducts.find(p => p.sku === params.sku);
    if (!product) {
      return HttpResponse.json(
        { message: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }
    return HttpResponse.json(product);
  }),
];
```

### 1.3 Cart Mock Handlers

**Files:**
- CREATE: `libs/frontend/shared-testing/mock-handlers/src/handlers/cart.ts`

**Implementation:**
```typescript
export const cartHandlers = [
  // Get cart
  http.get('*/carts/:id', async ({ params }) => {
    await delay(50);
    const cart = getCart(params.id as string);
    return HttpResponse.json(calculateCartTotals(cart));
  }),

  // Create cart
  http.post('*/carts', async () => {
    const cart = createCart();
    return HttpResponse.json(cart, { status: 201 });
  }),

  // Add to cart
  http.post('*/carts/:id/products', async ({ params, request }) => {
    await delay(50);
    const body = await request.json() as AddToCartRequest;
    const cart = addToCart(params.id as string, body);
    return HttpResponse.json(calculateCartTotals(cart));
  }),

  // Update cart item
  http.put('*/carts/:id/products/:sku', async ({ params, request }) => {
    const body = await request.json() as { quantity: number };
    const cart = updateCartItem(params.id as string, params.sku as string, body.quantity);
    return HttpResponse.json(calculateCartTotals(cart));
  }),

  // Remove from cart
  http.delete('*/carts/:id/products/:sku', async ({ params }) => {
    const cart = removeFromCart(params.id as string, params.sku as string);
    return HttpResponse.json(calculateCartTotals(cart));
  }),
];
```

### 1.4 Customer Mock Handlers

**Files:**
- CREATE: `libs/frontend/shared-testing/mock-handlers/src/handlers/customers.ts`

**Implementation:**
```typescript
import { mockCustomers } from '../data/customers';

export const customerHandlers = [
  // Search customers (binary match)
  http.get('*/customers/search', async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');
    const email = url.searchParams.get('email');

    let customer = null;
    if (phone) {
      customer = mockCustomers.find(c => c.phone === phone);
    } else if (email) {
      customer = mockCustomers.find(c => c.email === email);
    }

    return HttpResponse.json(customer ? [customer] : []);
  }),

  // Get customer by ID
  http.get('*/customers/:id', async ({ params }) => {
    const customer = mockCustomers.find(c => c.id === params.id);
    if (!customer) {
      return HttpResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json(customer);
  }),
];
```

### 1.5 Checkout Mock Handlers

**Files:**
- CREATE: `libs/frontend/shared-testing/mock-handlers/src/handlers/checkout.ts`

**Implementation:**
```typescript
export const checkoutHandlers = [
  // Initiate checkout
  http.post('*/checkout/initiate', async ({ request }) => {
    await delay(200);
    const body = await request.json() as InitiateCheckoutRequest;
    const cart = getCart(body.cartId);
    const discounts = calculateDiscounts(cart, body.customerId);

    return HttpResponse.json({
      checkoutId: crypto.randomUUID(),
      cartId: body.cartId,
      customerId: body.customerId,
      subtotal: cart.subtotal,
      discounts,
      discountTotal: discounts.reduce((sum, d) => sum + d.amount, 0),
      tax: cart.tax,
      total: cart.total - discounts.reduce((sum, d) => sum + d.amount, 0),
      fulfillmentType: 'IMMEDIATE',
    });
  }),

  // Complete checkout
  http.post('*/checkout/complete', async ({ request }) => {
    await delay(500); // Simulate payment processing
    const body = await request.json() as CompleteCheckoutRequest;

    // Simulate payment failure for testing
    if (body.paymentDetails?.cardNumber === '4111111111111111') {
      return HttpResponse.json(
        { message: 'Payment declined', code: 'PAYMENT_DECLINED' },
        { status: 402 }
      );
    }

    return HttpResponse.json({
      orderId: crypto.randomUUID(),
      orderNumber: `ORD-${Date.now()}`,
      status: 'COMPLETED',
      total: body.total,
    }, { status: 201 });
  }),
];
```

### 1.6 Mock Data

**Files:**
- CREATE: `libs/frontend/shared-testing/mock-handlers/src/data/products.ts`
- CREATE: `libs/frontend/shared-testing/mock-handlers/src/data/customers.ts`
- CREATE: `libs/frontend/shared-testing/mock-handlers/src/data/cart.ts`

**Implementation:**
```typescript
// products.ts - 10 products across categories
export const mockProducts: Product[] = [
  { sku: 'SKU-001', name: 'Wireless Headphones', price: 299.99, ... },
  // ... same as existing mock data
];

// customers.ts - Test customers for loyalty lookup
export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '5551234567',
    loyaltyTier: 'GOLD',
    loyaltyPoints: 1500,
  },
  {
    id: 'cust-002',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '5559876543',
    loyaltyTier: 'SILVER',
    loyaltyPoints: 500,
  },
];
```

### 1.7 Combined Handler Export

**Files:**
- MODIFY: `libs/frontend/shared-testing/mock-handlers/src/index.ts`

**Implementation:**
```typescript
export * from './handlers/products';
export * from './handlers/cart';
export * from './handlers/customers';
export * from './handlers/checkout';
export * from './data/products';
export * from './data/customers';

// All handlers combined
export const allHandlers = [
  ...productHandlers,
  ...cartHandlers,
  ...customerHandlers,
  ...checkoutHandlers,
];
```

---

## Phase 2: Kiosk MSW Setup

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Kiosk MSW Browser Setup

**Files:**
- CREATE: `apps/kiosk-web/src/mocks/browser.ts`
- CREATE: `apps/kiosk-web/src/mocks/index.ts`

**Implementation:**
```typescript
// browser.ts
import { setupWorker } from 'msw/browser';
import { allHandlers } from '@reactive-platform/mock-handlers';

export const worker = setupWorker(...allHandlers);
```

### 2.2 Conditional MSW Loading

**Files:**
- MODIFY: `apps/kiosk-web/src/main.tsx`

**Implementation:**
```typescript
async function enableMocking() {
  if (import.meta.env.VITE_MSW_ENABLED !== 'true') {
    return;
  }
  const { worker } = await import('./mocks/browser');
  return worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
```

---

## Phase 3: Playwright E2E Tests

**Prereqs:** Phase 2 complete, kiosk app functional
**Blockers:** 038C_KIOSK_FEATURES must be complete

### 3.1 E2E Project Setup

**Files:**
- CREATE: `apps/kiosk-web/e2e/playwright.config.ts`
- CREATE: `apps/kiosk-web/e2e/fixtures/index.ts`

**Implementation:**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './specs',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'VITE_MSW_ENABLED=true pnpm nx serve kiosk-web',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3.2 Scan Journey Tests

**Files:**
- CREATE: `apps/kiosk-web/e2e/specs/scan-journey.spec.ts`

**Implementation:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Scan Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /start/i }).click();
  });

  test('can scan product and add to cart', async ({ page }) => {
    // Simulate barcode scan (keyboard input)
    await page.keyboard.type('SKU-001');
    await page.keyboard.press('Enter');

    // Verify product displayed
    await expect(page.getByText('Wireless Headphones')).toBeVisible();
    await expect(page.getByText('$299.99')).toBeVisible();
    await expect(page.getByText('Added to cart')).toBeVisible();

    // Verify cart count
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  test('shows error for unknown product', async ({ page }) => {
    await page.keyboard.type('UNKNOWN-SKU');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Product not found')).toBeVisible();
  });

  test('can enter SKU manually', async ({ page }) => {
    await page.getByRole('button', { name: /enter sku manually/i }).click();

    // Use numeric keypad
    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: '0' }).click();
    await page.getByRole('button', { name: '0' }).click();
    await page.getByRole('button', { name: '1' }).click(); // SKU-1001

    await page.getByRole('button', { name: /submit/i }).click();

    await expect(page.getByText('Product not found')).toBeVisible();
  });

  test('can scan multiple products rapidly', async ({ page }) => {
    // Scan 3 products
    await page.keyboard.type('SKU-001');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    await page.keyboard.type('SKU-002');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    await page.keyboard.type('SKU-003');
    await page.keyboard.press('Enter');

    // Verify cart count
    await expect(page.getByTestId('cart-count')).toHaveText('3');
  });
});
```

### 3.3 Cart Journey Tests

**Files:**
- CREATE: `apps/kiosk-web/e2e/specs/cart-journey.spec.ts`

**Implementation:**
```typescript
test.describe('Cart Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: start transaction and add items
    await page.goto('/');
    await page.getByRole('button', { name: /start/i }).click();
    await page.keyboard.type('SKU-001');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /review cart/i }).click();
  });

  test('displays cart items correctly', async ({ page }) => {
    await expect(page.getByTestId('cart-item-SKU-001')).toBeVisible();
    await expect(page.getByText('Wireless Headphones')).toBeVisible();
    await expect(page.getByText('$299.99')).toBeVisible();
  });

  test('can increase item quantity', async ({ page }) => {
    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(page.getByTestId('item-quantity')).toHaveValue('2');
  });

  test('can remove item from cart', async ({ page }) => {
    await page.getByRole('button', { name: /remove/i }).click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('shows correct totals', async ({ page }) => {
    // Subtotal: $299.99
    // Tax (8%): $24.00
    // Total: $323.99
    await expect(page.getByTestId('cart-subtotal')).toContainText('299.99');
    await expect(page.getByTestId('cart-total')).toContainText('323.99');
  });
});
```

### 3.4 Loyalty Journey Tests

**Files:**
- CREATE: `apps/kiosk-web/e2e/specs/loyalty-journey.spec.ts`

**Implementation:**
```typescript
test.describe('Loyalty Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: start transaction, add item, go to loyalty
    await page.goto('/');
    await page.getByRole('button', { name: /start/i }).click();
    await page.keyboard.type('SKU-001');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /review cart/i }).click();
    await page.getByRole('button', { name: /continue to loyalty/i }).click();
  });

  test('can look up customer by phone', async ({ page }) => {
    await page.getByRole('button', { name: /phone/i }).click();

    // Enter phone using keypad
    for (const digit of '5551234567') {
      await page.getByRole('button', { name: digit }).click();
    }

    await page.getByRole('button', { name: /look up/i }).click();

    await expect(page.getByText('Welcome back, John Smith')).toBeVisible();
    await expect(page.getByText('GOLD')).toBeVisible();
  });

  test('can look up customer by email', async ({ page }) => {
    await page.getByRole('button', { name: /email/i }).click();
    await page.getByRole('textbox').fill('john@example.com');
    await page.getByRole('button', { name: /look up/i }).click();

    await expect(page.getByText('Welcome back, John Smith')).toBeVisible();
  });

  test('shows not found for unknown customer', async ({ page }) => {
    await page.getByRole('button', { name: /phone/i }).click();
    for (const digit of '0000000000') {
      await page.getByRole('button', { name: digit }).click();
    }
    await page.getByRole('button', { name: /look up/i }).click();

    await expect(page.getByText('No account found')).toBeVisible();
  });

  test('can skip loyalty lookup', async ({ page }) => {
    await page.getByRole('button', { name: /skip/i }).click();
    await expect(page).toHaveURL('/checkout');
  });
});
```

### 3.5 Checkout Journey Tests

**Files:**
- CREATE: `apps/kiosk-web/e2e/specs/checkout-journey.spec.ts`

**Implementation:**
```typescript
test.describe('Checkout Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Full flow setup
    await page.goto('/');
    await page.getByRole('button', { name: /start/i }).click();
    await page.keyboard.type('SKU-001');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /review cart/i }).click();
    await page.getByRole('button', { name: /continue to loyalty/i }).click();
    await page.getByRole('button', { name: /skip/i }).click();
  });

  test('displays checkout summary correctly', async ({ page }) => {
    await expect(page.getByText('Wireless Headphones')).toBeVisible();
    await expect(page.getByTestId('checkout-total')).toBeVisible();
  });

  test('can complete payment', async ({ page }) => {
    await page.getByRole('button', { name: /pay/i }).click();

    // Wait for payment processing
    await expect(page.getByText('Payment Successful')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/ORD-/)).toBeVisible();
  });

  test('shows discounts when loyalty customer linked', async ({ page }) => {
    // This test would need different setup with loyalty linked
    // Verify discount display and total calculation
  });
});
```

### 3.6 Session Management Tests

**Files:**
- CREATE: `apps/kiosk-web/e2e/specs/session-management.spec.ts`

**Implementation:**
```typescript
test.describe('Session Management', () => {
  test('can start new transaction from idle', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page).toHaveURL('/scan');
  });

  test('shows timeout warning after inactivity', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /start/i }).click();

    // Wait for timeout warning (would need to configure short timeout for testing)
    // await expect(page.getByText('Are you still there?')).toBeVisible();
  });

  test('can cancel transaction and return to start', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /start/i }).click();
    await page.keyboard.type('SKU-001');
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: /cancel/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    await expect(page).toHaveURL('/');
  });

  test('resets to start after completing transaction', async ({ page }) => {
    // Complete full flow...
    // After confirmation, click "Done"
    // Should return to start screen
  });
});
```

### 3.7 Accessibility Tests

**Files:**
- CREATE: `apps/kiosk-web/e2e/specs/accessibility.spec.ts`

**Implementation:**
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('start screen has no a11y violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('scan screen has no a11y violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /start/i }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('all interactive elements have min 44x44 touch target', async ({ page }) => {
    await page.goto('/');
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});
```

---

## Phase 4: Full-Stack E2E Tests

**Prereqs:** All mocked tests passing, Docker services working
**Blockers:** None

### 4.1 Full-Stack Test Configuration

**Files:**
- CREATE: `e2e/kiosk-fullstack/playwright.config.ts`

**Implementation:**
```typescript
export default defineConfig({
  testDir: './specs',
  use: {
    baseURL: 'http://localhost:3002',
  },
  webServer: {
    command: 'docker compose -f docker/docker-compose.e2e.yml up -d --build',
    url: 'http://localhost:3002',
    timeout: 120000,
  },
});
```

### 4.2 Seed Data Script

**Files:**
- CREATE: `e2e/kiosk-fullstack/fixtures/seed-data.ts`

**Implementation:**
```typescript
// Seed test data into backend services
// - Create test products in product-service
// - Create test customers in customer-service
// - Configure WireMock for downstream services
```

### 4.3 Full-Stack Test Specs

**Files:**
- CREATE: `e2e/kiosk-fullstack/specs/complete-transaction.spec.ts`

**Implementation:**
```typescript
test('complete kiosk transaction end-to-end', async ({ page }) => {
  // Full flow with real services:
  // 1. Start transaction
  // 2. Scan products
  // 3. Look up loyalty customer
  // 4. Complete checkout with discounts
  // 5. Verify order created in order-service
});
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `libs/frontend/shared-testing/mock-handlers/` | Shared MSW handlers |
| CREATE | `apps/kiosk-web/src/mocks/` | Kiosk MSW setup |
| CREATE | `apps/kiosk-web/e2e/` | Playwright E2E tests |
| CREATE | `e2e/kiosk-fullstack/` | Full-stack E2E tests |
| MODIFY | `apps/ecommerce-web/src/mocks/` | Use shared handlers |

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `libs/frontend/shared-testing/mock-handlers/README.md` | Document handler usage |
| `apps/kiosk-web/README.md` | Add E2E testing section |
| `CLAUDE.md` | Add E2E test commands |

---

## Checklist

- [ ] Phase 1: Shared mock handlers library created
- [ ] Phase 2: Kiosk MSW setup working
- [ ] Phase 3: All Playwright tests passing
- [ ] Phase 4: Full-stack E2E tests passing
- [ ] Accessibility tests passing
- [ ] CI integration configured
