# 046C_frontend-graphql-client

**Status: DRAFT**

---

## Overview

Refactor ecommerce-web cart data access to use the cart-service GraphQL API, including a shared GraphQL client helper, updated hooks/types, and MSW/test adjustments. Optional: add subscription support for live cart updates.

**Related Plans:**
- `046_CART_GRAPHQL_CLIENT_ALIGNMENT.md` — umbrella plan
- `046A_backend-graphql-parity.md` — required for correct headers/validation
- `046B_graphql-tests-docs.md` — ensures server behavior is tested before client switch

## Goals

1. Provide a shared GraphQL fetch helper that reuses existing header injection and surfaces GraphQL errors cleanly.
2. Replace cart REST hooks with GraphQL queries/mutations and align types with the GraphQL schema.
3. Update mocks/tests to the GraphQL flow; optionally expose subscription helper for `cartUpdated`.

## References

**Standards:**
- `docs/standards/frontend/architecture.md` — feature hooks and data fetching patterns.
- `docs/standards/frontend/error-handling.md` — handling ApiError equivalents in UI.

## Architecture

```
React components → cart hooks (TanStack Query) → graphqlClient POST /graphql
                                     │
                                     └─ optional EventSource for cartUpdated
```

---

## Phase 1: GraphQL Client Helper

**Prereqs:** Existing `api-client` headers utility; env vars for API base URLs.  
**Blockers:** None.

### 1.1 Add GraphQL Client

**Files:**
- CREATE: `libs/frontend/shared-data/api-client/src/lib/graphql-client.ts`

**Implementation:**
- POST to `/graphql` (respecting `VITE_CART_API_URL`/proxy) with header injection from existing helper; parse `{data, errors}` and throw `ApiError` on errors; support variables.

---

## Phase 2: Cart Hooks and Types

**Prereqs:** Phase 1 complete; backend GraphQL parity from `046A` available.  
**Blockers:** None.

### 2.1 Align Types

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/cart/types/cart.ts`

**Implementation:**
- Reflect schema fields (name/imageUrl/originalUnitPrice/inStock, etc.) and add `CartEvent` type for subscriptions.

### 2.2 Rewrite Cart Hooks

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/cart/api/useCart.ts`
- MODIFY: `apps/ecommerce-web/src/shared/layouts/Header.tsx`
- MODIFY: `apps/ecommerce-web/src/features/cart/pages/CartPage.tsx`

**Implementation:**
- Use GraphQL operations (`cart`, `createCart`, `addProduct`, `updateProduct`, `removeProduct`) with SKU string conversion and empty-cart fallback on 404-like GraphQL null. Update consumers to new shapes.

### 2.3 Optional Subscription Helper

**Files:**
- OPTIONAL CREATE: `apps/ecommerce-web/src/features/cart/api/useCartSubscription.ts` (or inline)

**Implementation:**
- Thin EventSource wrapper for `cartUpdated` if live updates are desired; not required for initial migration.

---

## Phase 3: Mocks and Tests

**Prereqs:** Phase 2 in progress; MSW setup in place.  
**Blockers:** None.

### 3.1 MSW GraphQL Handlers

**Files:**
- MODIFY: `apps/ecommerce-web/src/mocks/handlers.ts`
- MODIFY: `apps/ecommerce-web/src/mocks/data.ts`

**Implementation:**
- Replace REST handlers with GraphQL query/mutation handlers for cart flows; keep totals calculation consistent with UI expectations.

### 3.2 Update Component/Hook Tests

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/cart/api/useCart.ts` (tests if present)
- MODIFY: `apps/ecommerce-web/src/features/cart/components/*.test.tsx`
- MODIFY: `apps/ecommerce-web/src/features/products/components/*.test.tsx`

**Implementation:**
- Adjust tests to use GraphQL-backed hooks/mocks and updated cart shape; ensure TanStack Query expectations still hold.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `libs/frontend/shared-data/api-client/src/lib/graphql-client.ts` | Shared GraphQL fetch helper |
| MODIFY | `apps/ecommerce-web/src/features/cart/types/cart.ts` | Align cart types with GraphQL schema |
| MODIFY | `apps/ecommerce-web/src/features/cart/api/useCart.ts` | Switch hooks to GraphQL queries/mutations |
| MODIFY | `apps/ecommerce-web/src/shared/layouts/Header.tsx` | Consume updated cart hook shape |
| MODIFY | `apps/ecommerce-web/src/features/cart/pages/CartPage.tsx` | Consume updated cart hook shape |
| MODIFY | `apps/ecommerce-web/src/mocks/handlers.ts` | GraphQL MSW handlers for cart flows |
| MODIFY | `apps/ecommerce-web/src/mocks/data.ts` | Mock data aligned to GraphQL shape |
| MODIFY | `apps/ecommerce-web/src/features/*/components/*.test.tsx` | Tests updated for GraphQL/mocks |
| OPTIONAL CREATE | `apps/ecommerce-web/src/features/cart/api/useCartSubscription.ts` | SSE helper for cartUpdated |

---

## Testing Strategy

- `pnpm nx test ecommerce-web` for unit/component hooks.
- `pnpm nx e2e ecommerce-web-e2e` with updated MSW handlers.
- Optional manual SSE smoke if subscription helper is added.

---

## Checklist

- [ ] GraphQL client helper added
- [ ] Cart types aligned
- [ ] Cart hooks migrated to GraphQL
- [ ] Mocks/tests updated
- [ ] Optional subscription helper (if chosen)
- [ ] Frontend tests passing
