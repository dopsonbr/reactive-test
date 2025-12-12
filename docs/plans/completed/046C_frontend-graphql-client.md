# 046C_frontend-graphql-client

**Status: COMPLETED**

---

## Overview

Refactor ecommerce-web cart data access to use the cart-service GraphQL API, including a shared GraphQL client helper, updated hooks/types, MSW/test adjustments, and subscription support for live cart updates.

**Related Plans:**
- `046_CART_GRAPHQL_CLIENT_ALIGNMENT.md` — umbrella plan
- `046A_backend-graphql-parity.md` — required for correct headers/validation
- `046B_graphql-tests-docs.md` — ensures server behavior is tested before client switch

## Goals

1. Provide a shared GraphQL fetch helper that reuses existing header injection and surfaces GraphQL errors cleanly.
2. Replace cart REST hooks with GraphQL queries/mutations and align types with the GraphQL schema.
3. Update mocks/tests to the GraphQL flow.
4. Implement subscription support for `cartUpdated` with non-mocked E2E tests.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| GraphQL client | Simple fetch wrapper + `graphql-sse` for subscriptions | TanStack Query best practice; minimal dependencies; codegen is future work |
| SKU type | Change to `string` in frontend | Aligns with GraphQL schema; avoids conversion at API boundary |
| Cart creation | `useCart()` handles via `createCart` mutation | Single hook responsibility; transparent to consumers |
| MSW approach | Native GraphQL support (`graphql.query()`, `graphql.mutation()`) | Built-in MSW feature; cleaner than manual POST parsing |
| REST mocks | Remove from MSW | Clean cutover; REST backend stays alive for other clients |
| Subscriptions | Required (not optional) | Full feature parity; E2E tests prove real behavior |
| E2E tests | Non-mocked in `e2e/ecommerce-fullstack/` | Proves subscriptions work against real backend |

## References

**Standards:**
- `docs/standards/frontend/architecture.md` — feature hooks and data fetching patterns.
- `docs/standards/frontend/error-handling.md` — handling ApiError equivalents in UI.

**External:**
- [TanStack Query GraphQL docs](https://tanstack.com/query/latest/docs/framework/react/graphql) — framework-agnostic fetching patterns.
- [graphql-sse](https://github.com/enisdenjo/graphql-sse) — SSE client for GraphQL subscriptions.

## Architecture

```
React components → cart hooks (TanStack Query) → graphqlClient POST /graphql
                                     │
                                     └─ graphql-sse client for cartUpdated subscription
```

---

## Phase 1: GraphQL Client Helper

**Prereqs:** Existing `api-client` headers utility; env vars for API base URLs.
**Blockers:** None.

### 1.1 Add GraphQL Client

**Files:**
- CREATE: `libs/frontend/shared-data/api-client/src/lib/graphql-client.ts`

**Dependencies to add:**
```bash
pnpm add graphql-sse
```

**Implementation:**

```typescript
// graphql-client.ts
import { createClient } from 'graphql-sse';
import { getHeaders } from './api-client';
import { ApiError } from './errors';

const GRAPHQL_URL = import.meta.env.VITE_CART_API_URL
  ? `${import.meta.env.VITE_CART_API_URL}/graphql`
  : '/api/cart/graphql';

// Query/Mutation client (simple fetch wrapper per TanStack Query best practices)
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(), // Injects x-store-number, x-order-number, x-userid, x-sessionid
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors?.length) {
    const error = json.errors[0];
    const validationErrors = error.extensions?.validationErrors;
    throw new ApiError(
      error.message,
      response.status,
      validationErrors ? { details: validationErrors } : undefined
    );
  }

  return json.data as T;
}

// Subscription client (graphql-sse for SSE transport)
export const subscriptionClient = createClient({
  url: GRAPHQL_URL,
  headers: getHeaders,  // Function called per-request for fresh headers
});

// Helper to subscribe with callback pattern (works with React effects)
export function subscribeToCart<T>(
  cartId: string,
  onData: (event: T) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubscribe = subscriptionClient.subscribe(
    {
      query: `
        subscription CartUpdated($cartId: ID!) {
          cartUpdated(cartId: $cartId) {
            eventType
            cart {
              id
              products { sku name quantity unitPrice lineTotal imageUrl inStock }
              totals { subtotal discountTotal fulfillmentTotal taxTotal grandTotal }
            }
          }
        }
      `,
      variables: { cartId },
    },
    {
      next: (result) => {
        if (result.data) {
          onData(result.data as T);
        }
      },
      error: (err) => onError?.(err instanceof Error ? err : new Error(String(err))),
      complete: () => {},
    }
  );

  return unsubscribe;
}
```

---

## Phase 2: Cart Hooks and Types

**Prereqs:** Phase 1 complete; backend GraphQL parity from `046A` available.
**Blockers:** None.

### 2.1 Align Types

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/cart/types/cart.ts`

**Implementation:**
- Change `sku` from `number` to `string` (aligns with GraphQL schema).
- Add `CartEvent` type for subscriptions.
- Ensure all fields match GraphQL schema (name/imageUrl/originalUnitPrice/inStock, etc.).

```typescript
// cart.ts - Updated types
export interface CartItem {
  sku: string;  // Changed from number to string
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

export interface CartEvent {
  eventType: 'PRODUCT_ADDED' | 'PRODUCT_REMOVED' | 'PRODUCT_UPDATED' |
             'DISCOUNT_APPLIED' | 'DISCOUNT_REMOVED' |
             'FULFILLMENT_ADDED' | 'FULFILLMENT_UPDATED' | 'FULFILLMENT_REMOVED' |
             'CUSTOMER_SET' | 'TOTALS_RECALCULATED';
  cart: Cart;
}
```

### 2.2 Rewrite Cart Hooks

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/cart/api/useCart.ts`
- MODIFY: `apps/ecommerce-web/src/shared/layouts/Header.tsx`
- MODIFY: `apps/ecommerce-web/src/features/cart/pages/CartPage.tsx`

**Implementation:**
- Use GraphQL operations (`cart`, `createCart`, `addProduct`, `updateProduct`, `removeProduct`).
- `useCart()` handles cart creation: if no cart exists (null response), call `createCart` mutation.
- Consumers (Header, CartPage) require no changes if hook signatures stay the same.

```typescript
// useCart.ts - GraphQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@reactive-platform/api-client';

const CART_QUERY = `
  query Cart($id: ID!) {
    cart(id: $id) {
      id
      storeNumber
      customerId
      products { sku name description unitPrice originalUnitPrice quantity availableQuantity imageUrl category lineTotal inStock }
      totals { subtotal discountTotal fulfillmentTotal taxTotal grandTotal }
      createdAt
      updatedAt
    }
  }
`;

const CREATE_CART_MUTATION = `
  mutation CreateCart($input: CreateCartInput!) {
    createCart(input: $input) { id }
  }
`;

export function useCart() {
  const cartId = getCartId(); // From sessionStorage
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['cart', cartId],
    queryFn: async () => {
      if (!cartId) {
        // No cart exists, create one
        const { createCart } = await graphqlRequest<{ createCart: { id: string } }>(
          CREATE_CART_MUTATION,
          { input: { storeNumber: getStoreNumber() } }
        );
        setCartId(createCart.id);
        return graphqlRequest<{ cart: Cart }>(CART_QUERY, { id: createCart.id });
      }
      const result = await graphqlRequest<{ cart: Cart | null }>(CART_QUERY, { id: cartId });
      if (!result.cart) {
        // Cart was deleted, create new one
        const { createCart } = await graphqlRequest<{ createCart: { id: string } }>(
          CREATE_CART_MUTATION,
          { input: { storeNumber: getStoreNumber() } }
        );
        setCartId(createCart.id);
        return graphqlRequest<{ cart: Cart }>(CART_QUERY, { id: createCart.id });
      }
      return result;
    },
    select: (data) => data.cart,
  });
}
```

### 2.3 Subscription Hook

**Files:**
- CREATE: `apps/ecommerce-web/src/features/cart/api/useCartSubscription.ts`

**Implementation:**
- Hook that subscribes to `cartUpdated` and invalidates TanStack Query cache on events.

```typescript
// useCartSubscription.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToCart } from '@reactive-platform/api-client';
import type { CartEvent } from '../types/cart';

export function useCartSubscription(cartId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!cartId) return;

    const unsubscribe = subscribeToCart<{ cartUpdated: CartEvent }>(
      cartId,
      (data) => {
        // Update cache with new cart data from subscription
        queryClient.setQueryData(['cart', cartId], { cart: data.cartUpdated.cart });
      },
      (error) => {
        console.error('Cart subscription error:', error);
      }
    );

    return unsubscribe;
  }, [cartId, queryClient]);
}
```

---

## Phase 3: Mocks and Tests

**Prereqs:** Phase 2 in progress; MSW setup in place.
**Blockers:** None.

### 3.1 MSW GraphQL Handlers

**Files:**
- MODIFY: `apps/ecommerce-web/src/mocks/handlers.ts`
- MODIFY: `apps/ecommerce-web/src/mocks/data.ts`

**Implementation:**
- Remove REST cart handlers (clean cutover).
- Add MSW native GraphQL handlers using `graphql.query()` and `graphql.mutation()`.

```typescript
// handlers.ts - GraphQL handlers
import { graphql, HttpResponse } from 'msw';
import { mockCart, calculateCartTotals, mockProducts } from './data';

export const handlers = [
  // Cart query
  graphql.query('Cart', ({ variables }) => {
    const { id } = variables;
    if (mockCart.id !== id) {
      return HttpResponse.json({ data: { cart: null } });
    }
    return HttpResponse.json({ data: { cart: mockCart } });
  }),

  // Create cart mutation
  graphql.mutation('CreateCart', ({ variables }) => {
    const { input } = variables;
    mockCart.id = crypto.randomUUID();
    mockCart.storeNumber = input.storeNumber;
    mockCart.products = [];
    mockCart.totals = calculateCartTotals([]);
    return HttpResponse.json({ data: { createCart: { id: mockCart.id } } });
  }),

  // Add product mutation
  graphql.mutation('AddProduct', ({ variables }) => {
    const { cartId, input } = variables;
    const product = mockProducts.find(p => p.sku === input.sku);
    if (product) {
      const existing = mockCart.products.find(p => p.sku === input.sku);
      if (existing) {
        existing.quantity += input.quantity;
        existing.lineTotal = String(parseFloat(existing.unitPrice) * existing.quantity);
      } else {
        mockCart.products.push({
          ...product,
          quantity: input.quantity,
          lineTotal: String(parseFloat(product.unitPrice) * input.quantity),
        });
      }
      mockCart.totals = calculateCartTotals(mockCart.products);
    }
    return HttpResponse.json({ data: { addProduct: mockCart } });
  }),

  // Update product mutation
  graphql.mutation('UpdateProduct', ({ variables }) => {
    const { sku, input } = variables;
    const item = mockCart.products.find(p => p.sku === sku);
    if (item) {
      item.quantity = input.quantity;
      item.lineTotal = String(parseFloat(item.unitPrice) * input.quantity);
      mockCart.totals = calculateCartTotals(mockCart.products);
    }
    return HttpResponse.json({ data: { updateProduct: mockCart } });
  }),

  // Remove product mutation
  graphql.mutation('RemoveProduct', ({ variables }) => {
    const { sku } = variables;
    mockCart.products = mockCart.products.filter(p => p.sku !== sku);
    mockCart.totals = calculateCartTotals(mockCart.products);
    return HttpResponse.json({ data: { removeProduct: mockCart } });
  }),

  // ... keep product REST handlers for product-service
];
```

### 3.2 Update Component/Hook Tests

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/cart/components/*.test.tsx`
- MODIFY: `apps/ecommerce-web/src/features/products/components/*.test.tsx`

**Implementation:**
- Update mock data to use `sku: string` instead of `sku: number`.
- Tests should work unchanged since MSW intercepts at network layer.
- Add test for subscription hook if needed.

---

## Phase 4: E2E Subscription Tests

**Prereqs:** Phases 1-3 complete; Docker full-stack E2E setup available.
**Blockers:** None.

### 4.1 Add Full-Stack Subscription E2E Test

**Files:**
- CREATE: `e2e/ecommerce-fullstack/specs/cart-subscriptions.spec.ts`

**Implementation:**
- Non-mocked E2E test that proves subscriptions work against real backend.
- Uses Playwright's native request/response monitoring.
- Test flow: subscribe → add item via mutation → verify UI updates via subscription.

```typescript
// cart-subscriptions.spec.ts
import { test, expect } from '../fixtures/test-base';

test.describe('Cart Subscriptions', () => {
  test.beforeEach(async ({ page }) => {
    // Initialize session storage with test user
    await page.addInitScript(() => {
      sessionStorage.setItem('userId', 'E2EUSR');
      sessionStorage.setItem('storeNumber', '1');
      sessionStorage.setItem('orderNumber', crypto.randomUUID());
      sessionStorage.setItem('sessionId', crypto.randomUUID());
    });
  });

  test('should receive real-time cart updates via SSE subscription', async ({ page }) => {
    // Navigate to cart page (triggers subscription)
    await page.goto('/cart');

    // Wait for initial cart load
    await expect(page.getByTestId('cart-summary')).toBeVisible();
    const initialTotal = await page.getByTestId('cart-total').textContent();

    // Open product page in same browser context to add item
    const productPage = await page.context().newPage();
    await productPage.goto('/products/SKU-001');
    await productPage.getByRole('button', { name: 'Add to Cart' }).click();
    await productPage.waitForResponse(resp =>
      resp.url().includes('/graphql') && resp.status() === 200
    );

    // Verify cart page updates via subscription (no manual refresh)
    await expect(page.getByTestId('cart-total')).not.toHaveText(initialTotal, {
      timeout: 5000, // Allow time for SSE event
    });

    // Verify item appears in cart
    await expect(page.getByText('SKU-001')).toBeVisible();

    await productPage.close();
  });

  test('should reconnect subscription after connection drop', async ({ page }) => {
    await page.goto('/cart');

    // Simulate network interruption
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);
    await page.context().setOffline(false);

    // Add item after reconnect
    const productPage = await page.context().newPage();
    await productPage.goto('/products/SKU-002');
    await productPage.getByRole('button', { name: 'Add to Cart' }).click();

    // Verify cart still receives updates after reconnect
    await expect(page.getByText('SKU-002')).toBeVisible({ timeout: 10000 });

    await productPage.close();
  });
});
```

### 4.2 Update E2E Fixtures for SSE

**Files:**
- MODIFY: `e2e/ecommerce-fullstack/fixtures/test-base.ts`

**Implementation:**
- Add helper to monitor SSE connections if needed for debugging.

```typescript
// Add to test-base.ts
export const test = base.extend({
  // Optional: Add SSE monitoring for debugging
  sseMonitor: async ({ page }, use) => {
    const sseEvents: Array<{ url: string; data: string }> = [];

    // Monitor fetch requests that return text/event-stream
    page.on('response', async (response) => {
      if (response.headers()['content-type']?.includes('text/event-stream')) {
        sseEvents.push({
          url: response.url(),
          data: 'SSE connection established',
        });
      }
    });

    await use(sseEvents);
  },
});
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `libs/frontend/shared-data/api-client/src/lib/graphql-client.ts` | Shared GraphQL fetch helper + subscription client |
| MODIFY | `apps/ecommerce-web/src/features/cart/types/cart.ts` | Align cart types with GraphQL schema (sku: string) |
| MODIFY | `apps/ecommerce-web/src/features/cart/api/useCart.ts` | Switch hooks to GraphQL queries/mutations |
| CREATE | `apps/ecommerce-web/src/features/cart/api/useCartSubscription.ts` | SSE subscription hook for cartUpdated |
| MODIFY | `apps/ecommerce-web/src/shared/layouts/Header.tsx` | Minor updates if needed |
| MODIFY | `apps/ecommerce-web/src/features/cart/pages/CartPage.tsx` | Use subscription hook |
| MODIFY | `apps/ecommerce-web/src/mocks/handlers.ts` | GraphQL MSW handlers (remove REST cart handlers) |
| MODIFY | `apps/ecommerce-web/src/mocks/data.ts` | Mock data with sku: string |
| MODIFY | `apps/ecommerce-web/src/features/*/components/*.test.tsx` | Tests updated for GraphQL/mocks |
| CREATE | `e2e/ecommerce-fullstack/specs/cart-subscriptions.spec.ts` | Non-mocked E2E subscription tests |
| MODIFY | `e2e/ecommerce-fullstack/fixtures/test-base.ts` | SSE monitoring helper |

---

## Testing Strategy

- `pnpm nx test ecommerce-web` — Unit/component tests with MSW GraphQL handlers.
- `pnpm nx e2e ecommerce-web-e2e` — Mocked E2E tests (fast, every PR).
- `pnpm nx e2e ecommerce-fullstack-e2e` — Non-mocked E2E tests proving subscriptions work against real backend.

**Full-stack E2E subscription test:**
```bash
# Start Docker services
docker compose -f docker/docker-compose.e2e.yml up -d --build

# Seed data
npx tsx e2e/ecommerce-fullstack/fixtures/seed-data.ts

# Run E2E tests including subscriptions
pnpm nx e2e ecommerce-fullstack-e2e

# Keep services running for debugging
E2E_KEEP_RUNNING=true pnpm nx e2e ecommerce-fullstack-e2e
```

---

## Checklist

- [ ] GraphQL client helper added (with `graphql-sse` dependency)
- [ ] Cart types aligned (`sku: string`, `CartEvent` type)
- [ ] Cart hooks migrated to GraphQL (with cart creation handling)
- [ ] Subscription hook implemented (`useCartSubscription`)
- [ ] MSW handlers updated (GraphQL, REST cart handlers removed)
- [ ] Component tests updated
- [ ] Non-mocked E2E subscription tests added and passing
- [ ] All frontend tests passing
