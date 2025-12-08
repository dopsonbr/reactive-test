# 043D_FRONTEND_ALIGNMENT

**Status: COMPLETE**

---

## Overview

Update frontend TypeScript types to match backend responses and update all tests. After this phase, frontend can consume backend responses directly without mapping.

**Parent Plan:** `043_MODEL_ALIGNMENT.md`
**Prereqs:** `043C_BACKEND_SERVICES.md` (backend must return all fields first)

---

## Goals

1. Update frontend Product type to match backend response
2. Update frontend Cart/CartItem types to match backend response
3. Remove mapping functions (no longer needed)
4. Update component usage (items to products)
5. Update all unit, integration, and E2E tests

---

## Phase 6: Frontend Alignment

**Prereqs:** 043C complete (backend returns all fields)
**Blockers:** None

### 6.1 Update Frontend Product Type

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/products/types/product.ts`

**Align with backend response:**
```typescript
export interface Product {
  sku: number;
  name: string;
  description: string;
  price: string;           // String for BigDecimal precision
  originalPrice?: string;  // Nullable
  availableQuantity: number;
  imageUrl: string;
  category: string;
  inStock: boolean;        // Derived by backend
  onSale: boolean;         // Derived by backend
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}
```

### 6.2 Update Frontend Cart Types

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/cart/types/cart.ts`

**Align with backend:**
```typescript
export interface CartItem {
  sku: number;
  name: string;
  description: string;
  unitPrice: string;
  originalUnitPrice?: string;
  quantity: number;
  availableQuantity: number;
  imageUrl: string;
  category: string;
  lineTotal: string;
  inStock: boolean;
}

export interface CartTotals {
  subtotal: string;
  discountTotal: string;
  fulfillmentTotal: string;
  taxTotal: string;
  grandTotal: string;
}

export interface Cart {
  id: string;
  storeNumber: number;
  customerId?: string;
  products: CartItem[];    // Note: backend uses 'products' not 'items'
  totals: CartTotals;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  sku: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  sku: number;
  quantity: number;
}
```

### 6.3 Remove Mapping Functions

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/cart/api/useCart.ts`

**Remove:**
- `BackendCartProduct` interface (lines 10-17)
- `BackendCart` interface (lines 19-27)
- `mapBackendCart()` function (lines 29-46)

**Replace with direct typing:**
```typescript
import type { Cart, CartItem } from '../types';

export function useCart() {
  const cartId = getCartId();

  return useQuery({
    queryKey: cartKeys.detail(cartId),
    queryFn: async () => {
      try {
        // Backend now returns frontend-compatible shape
        const cart = await apiClient<Cart>(`/carts/${cartId}`);
        return cart;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return emptyCart(cartId);
        }
        throw error;
      }
    },
  });
}

function emptyCart(id: string): Cart {
  return {
    id,
    storeNumber: 0,
    products: [],
    totals: {
      subtotal: "0",
      discountTotal: "0",
      fulfillmentTotal: "0",
      taxTotal: "0",
      grandTotal: "0"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
```

### 6.4 Update Component Usage

**Files:**
- AUDIT: All components using Product or Cart types

**Common changes:**
- `cart.items` to `cart.products` (matches backend field name)
- Price display: already string, may need formatting
- Remove any `.toString()` or `Number()` conversions

**Search for usages:**
```bash
grep -r "cart\.items" apps/ecommerce-web/src/
grep -r "\.items\." apps/ecommerce-web/src/features/cart/
```

**Update each occurrence to use `cart.products`.**

---

## Phase 7: Test Updates

**Prereqs:** Phase 6 complete
**Blockers:** None

### 7.1 Update Unit Tests

**Files:**
- MODIFY: `libs/backend/shared-model/shared-model-product/src/test/java/**/*.java`
- MODIFY: `apps/product-service/src/test/java/**/*.java`
- MODIFY: `apps/cart-service/src/test/java/**/*.java`

**Changes:**
- Update test fixtures with new fields
- Add tests for `inStock()` and `onSale()` methods
- Update assertions for extended responses
- Use BigDecimal for price assertions

**Example test fixture update:**
```java
// Before
new Product(12345L, "Description", "99.99", 100);

// After
new Product(
    12345L,
    "Test Product",
    "Description",
    new BigDecimal("99.99"),
    new BigDecimal("129.99"),
    100,
    "https://cdn.example.com/products/default.jpg",
    "General"
);
```

### 7.2 Update Integration Tests

**Files:**
- MODIFY: `apps/product-service/src/test/java/org/example/product/integration/*.java`
- MODIFY: `apps/cart-service/src/test/java/org/example/cart/integration/*.java`

**Changes:**
- Update expected response shapes
- Verify all new fields are present in responses
- Update WireMock stub expectations to match 043A changes

### 7.3 Update E2E Test Fixtures

**Files:**
- VERIFY: `e2e/ecommerce-fullstack/fixtures/seed-data.ts`

**Ensure seed data includes all new fields with correct types:**
```typescript
const seedProduct = {
  sku: 12345,
  name: "Test Widget",
  description: "A test widget for E2E testing",
  price: "99.99",
  originalPrice: "129.99",
  availableQuantity: 100,
  imageUrl: "https://cdn.example.com/products/widget.jpg",
  category: "Widgets",
  inStock: true,
  onSale: true
};
```

### 7.4 Update Frontend Tests

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/products/**/*.test.ts`
- MODIFY: `apps/ecommerce-web/src/features/cart/**/*.test.ts`

**Changes:**
- Update mock data with new shapes
- Remove mapping function tests (they no longer exist)
- Update assertions for new field names
- Change `items` to `products` in cart assertions

**Example mock update:**
```typescript
// Before
const mockCart = {
  id: 'cart-1',
  items: [{ sku: 12345, unitPrice: '99.99', quantity: 2 }]
};

// After
const mockCart: Cart = {
  id: 'cart-1',
  storeNumber: 1,
  products: [{
    sku: 12345,
    name: 'Test Product',
    description: 'Description',
    unitPrice: '99.99',
    originalUnitPrice: '129.99',
    quantity: 2,
    availableQuantity: 100,
    imageUrl: 'https://cdn.example.com/products/default.jpg',
    category: 'General',
    lineTotal: '199.98',
    inStock: true
  }],
  totals: {
    subtotal: '199.98',
    discountTotal: '0',
    fulfillmentTotal: '0',
    taxTotal: '0',
    grandTotal: '199.98'
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};
```

### 7.5 Update MSW Handlers

**Files:**
- MODIFY: `apps/ecommerce-web/src/mocks/handlers.ts`
- MODIFY: `apps/ecommerce-web/src/mocks/data.ts`

**Changes:**
- Update mock API responses to match new shapes
- Ensure all new fields are present in mock data

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `apps/ecommerce-web/.../types/product.ts` | Align with backend |
| MODIFY | `apps/ecommerce-web/.../types/cart.ts` | Align with backend |
| MODIFY | `apps/ecommerce-web/.../api/useCart.ts` | Remove mapping |
| AUDIT  | `apps/ecommerce-web/**/*.tsx` | items to products |
| MODIFY | `libs/backend/**/test/**/*.java` | Update fixtures |
| MODIFY | `apps/product-service/src/test/**/*.java` | Update tests |
| MODIFY | `apps/cart-service/src/test/**/*.java` | Update tests |
| MODIFY | `e2e/ecommerce-fullstack/fixtures/*.ts` | Update seed data |
| MODIFY | `apps/ecommerce-web/**/*.test.ts` | Update mocks |
| MODIFY | `apps/ecommerce-web/src/mocks/*.ts` | Update MSW handlers |

---

## Verification

After completing this phase:

```bash
# Build all
pnpm nx run-many -t build

# Run all tests
pnpm nx run-many -t test

# Run E2E tests
pnpm nx e2e ecommerce-fullstack-e2e

# Manual verification
# 1. Product detail page shows image, category
# 2. Cart shows all product details
# 3. Prices display correctly (string formatted)
# 4. No console errors about missing fields
```

---

## Rollback Strategy

This is a coordinated change. If issues arise:
1. Revert backend changes (043B, 043C)
2. Revert frontend changes (043D)
3. Revert WireMock stubs (043A)

All four sub-plans must be reverted together.

---

## Checklist

### Phase 6: Frontend Types
- [ ] Update Product type with all backend fields
- [ ] Update Cart/CartItem types with all backend fields
- [ ] Remove BackendCartProduct interface
- [ ] Remove BackendCart interface
- [ ] Remove mapBackendCart() function
- [ ] Update cart.items to cart.products everywhere

### Phase 7: Tests
- [ ] Update shared model unit tests
- [ ] Update product-service unit tests
- [ ] Update cart-service unit tests
- [ ] Update product-service integration tests
- [ ] Update cart-service integration tests
- [ ] Verify E2E fixtures have all fields
- [ ] Update frontend product tests
- [ ] Update frontend cart tests
- [ ] Update MSW handlers/data
- [ ] All tests passing

### Final Verification
- [ ] Build succeeds: `pnpm nx run-many -t build`
- [ ] All tests pass: `pnpm nx run-many -t test`
- [ ] E2E flow works: `pnpm nx e2e ecommerce-fullstack-e2e`
- [ ] No console errors in browser
- [ ] Product detail shows image and category
- [ ] Cart shows all product details
