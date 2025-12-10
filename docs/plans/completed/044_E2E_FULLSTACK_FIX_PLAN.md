# 044 E2E Fullstack Test Fix Plan

## Status: COMPLETE

## Test Results Summary

- **Total Tests**: 7
- **Passed**: 7
- **Failed**: 0

## Changes Made

### Backend Fixes
1. **Cart-service auto-creation** (`CartService.java`): Added `getCartOrCreate()` helper that auto-creates cart on first `addProduct()` call (upsert pattern)

### Frontend Fixes
1. **Cart response mapping** (`useCart.ts`): Added `mapBackendCart()` to transform backend `products` array to frontend `items` array
2. **Price parsing** (`ProductCard.tsx`, `ProductDetail.tsx`): Added `Number()` wrapping for price fields since backend returns strings for decimal precision

### Test Fixes
1. **Cart test UUID** (`cart-flow.spec.ts:7`): Changed cartId from timestamp to `crypto.randomUUID()`
2. **Cart test 201 status** (`cart-flow.spec.ts:32`): Changed expected status from 200 to 201 (CREATED)
3. **Cart test wait strategy** (`cart-flow.spec.ts:38-61`): Set up response listeners before actions
4. **Product test locator** (`product-flow.spec.ts:32`): Added `.first()` to handle multiple matching elements

### WireMock Fixes
1. **SKU format** (`catalog-search.json`): Changed SKUs from 4-digit (1001-1010) to 6-digit (100001-100010) for cart-service validation

---

## Failed Tests Analysis

### Failure 1: "add to cart calls real backend" (cart-flow.spec.ts:14)

**Symptom**: API returns 400 instead of expected 200 on `/carts/**/products`

**Root Cause**: Test sets invalid cartId format
```typescript
// Current (INVALID)
const cartId = `e2e-cart-${Date.now()}`;  // e.g., "e2e-cart-1733664000000"
```

Cart-service validation requires cartId to be a valid UUID:
```java
// CartRequestValidator.java:308
errors.add(new ValidationError("cartId", "Cart ID must be a valid UUID"));
```

**Fix**: Update test to use UUID format
```typescript
// Fixed
const cartId = crypto.randomUUID();  // Valid UUID
```

**File**: `e2e/ecommerce-fullstack/specs/cart-flow.spec.ts` (line 7)

---

### Failure 2: "cart page loads from real backend" (cart-flow.spec.ts:37)

**Symptom**: Can't find text matching `/your cart/i` or `/empty/i`

**Root Cause**: Cascading failure from #1 - add to cart fails with 400, so when navigating to cart page:
1. Cart API returns 404 (cart doesn't exist)
2. useCart hook returns empty cart object with `items: []`
3. CartPage renders EmptyCart component
4. Test looks for text but timing may cause issue

The CartPage component shows correct text:
```tsx
// Line 28: Empty cart case
<h1 className="text-2xl font-bold mb-6">Your Cart</h1>

// Line 36: Cart with items
<h1 className="text-2xl font-bold mb-6">Your Cart</h1>
```

**Fix**:
1. Fix cartId issue (from Failure 1)
2. Test should pass once cart operations work

**Verification**: After fixing cartId, this test should pass without code changes.

---

### Failure 3: "product detail shows real inventory status" (product-flow.spec.ts:15)

**Symptom**: Can't find text matching `/in stock/i` or `/out of stock/i`

**Root Cause**: Test waits for wrong API response pattern
```typescript
// Current - catches initial product list response, not product detail
await page.locator('[data-testid^="product-card-"]').first().click();
await page.waitForResponse('**/products/**');  // Too generic
```

The `**/products/**` pattern matches the initial `/products/search` response that already completed. The product detail API call (`/products/1001`) happens after navigation, but the test proceeds before it completes.

Error context shows empty `<main>` - ProductDetail component hasn't rendered yet.

**Fix**: Wait for specific product detail API response or rendered content
```typescript
// Option A: Wait for specific API pattern
await page.waitForResponse((res) =>
  res.url().includes('/products/') &&
  !res.url().includes('/search')
);

// Option B: Wait for rendered content directly
await page.waitForSelector('text=/in stock/i, text=/out of stock/i');

// Option C: Wait for URL change then content
await expect(page).toHaveURL(/\/products\/\d+/);
await expect(
  page.getByText(/in stock/i).or(page.getByText(/out of stock/i))
).toBeVisible({ timeout: 10000 });
```

**File**: `e2e/ecommerce-fullstack/specs/product-flow.spec.ts` (lines 19-27)

---

## Implementation Tasks

### Task 1: Fix Cart Test cartId Format
**File**: `e2e/ecommerce-fullstack/specs/cart-flow.spec.ts`
**Change**: Line 7 - Replace timestamp-based cartId with UUID

```diff
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
-     const cartId = `e2e-cart-${Date.now()}`;
+     const cartId = crypto.randomUUID();
      sessionStorage.setItem('cartId', cartId);
      sessionStorage.setItem('userId', 'E2EUSR');
      sessionStorage.setItem('storeNumber', '1');
    });
  });
```

### Task 2: Fix Product Detail Test Wait Strategy
**File**: `e2e/ecommerce-fullstack/specs/product-flow.spec.ts`
**Change**: Lines 19-27 - Use proper wait strategy for product detail

```diff
  test('product detail shows real inventory status', async ({ page }) => {
    await page.goto('/');

    // Click on first product
    await page.locator('[data-testid^="product-card-"]').first().click();

-   // Wait for product detail API call
-   await page.waitForResponse('**/products/**');
+   // Wait for navigation to product detail page
+   await expect(page).toHaveURL(/\/products\/\d+/);

    // Verify stock status is displayed (from real backend)
    await expect(
      page.getByText(/in stock/i).or(page.getByText(/out of stock/i))
-   ).toBeVisible();
+   ).toBeVisible({ timeout: 10000 });
  });
```

---

## Verification Steps

After implementing fixes:

```bash
# Run full-stack e2e tests
E2E_BASE_URL=http://localhost:3001 pnpm nx e2e ecommerce-fullstack-e2e

# Expected result: 7/7 tests passing
```

---

## Files to Modify

| File | Change |
|------|--------|
| `e2e/ecommerce-fullstack/specs/cart-flow.spec.ts` | Line 7: Use `crypto.randomUUID()` for cartId |
| `e2e/ecommerce-fullstack/specs/product-flow.spec.ts` | Lines 19-27: Fix wait strategy for product detail |

---

## Risk Assessment

**Low Risk**: These are test-only changes, no production code affected.

**Confidence**: High - Root causes are clearly identified:
1. UUID validation mismatch is definitive (400 error message confirms)
2. Wait strategy issue is evident from empty page snapshot
