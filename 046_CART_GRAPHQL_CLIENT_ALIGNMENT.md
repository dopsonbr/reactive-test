# 046_CART_GRAPHQL_CLIENT_ALIGNMENT

**Status: DRAFT**

---

## Overview

Close the gap between the cart-service GraphQL implementation and the archived plan by restoring REST parity (context propagation + validation), adding missing subscription coverage, and aligning the ecommerce-web client to consume the GraphQL API. Work spans backend GraphQL plumbing, tests/docs, and frontend data hooks/mocks.

## Findings

- GraphQL resolvers never attach `RequestMetadata` to the Reactor context, so downstream client calls run with storeNumber 0 and missing headers (diverges from REST behavior).
- `GraphQLInputValidator` omits several REST validations (header metadata and null/body checks), breaking the “parity with REST validator” requirement in the plan/AGENTS.
- GraphQL subscription integration lacks an end-to-end controller test and the README promised in the plan; mutation tests don’t exercise product/discount/fulfillment flows.
- ecommerce-web still uses REST endpoints and MSW handlers; no GraphQL queries/mutations/subscriptions or typed client exist.

## Goals

1. Reintroduce RequestMetadata/context propagation for all GraphQL operations and align validation rules with REST.
2. Add the missing GraphQL docs/tests (including subscription coverage) to match the plan scope.
3. Switch ecommerce-web cart data access to the GraphQL API with updated types, mocks, and optional live updates.

## References

**Standards:**
- `docs/standards/validation.md` — ensure GraphQL validation matches REST aggregation rules.
- `docs/standards/backend/testing-integration.md` — GraphQL + pub/sub integration patterns.
- `docs/standards/frontend/architecture.md` — feature hooks + TanStack Query conventions for ecommerce-web.

**ADRs:**
- `docs/ADRs/004_graphql_subscriptions_architecture.md` — SSE transport + Redis pub/sub expectations.

## Architecture

```
Browser (GraphQL fetch + EventSource)
        │
        ▼
ecommerce-web cart hooks (GraphQL client) ──► /graphql (POST/SSE)
        │                                        │
        ▼                                        ▼
   Cart GraphQL resolvers ──► RequestMetadata context ──► CartService
        │                                        │
        └──────── Redis Pub/Sub ◄── CartEventPublisher/Subscriber ──► cartUpdated/storeCartEvents
```

### Dependency Order

```
046A_backend-graphql-parity
         │
         ▼
046B_graphql-tests-docs ──┐
                          ├──► 046C_frontend-graphql-client
046A prerequisite ────────┘
```

### Sub-plan Split

| Plan | Scope | Depends On |
|------|-------|------------|
| `046A_backend-graphql-parity.md` | Context propagation + validation parity in GraphQL controllers/validator | None |
| `046B_graphql-tests-docs.md` | Subscription E2E test, broader mutation/query tests, GraphQL README | 046A |
| `046C_frontend-graphql-client.md` | ecommerce-web GraphQL client/hooks, mocks, type updates | 046A, 046B (for stable API surface) |

---

## Phase 1: Backend GraphQL Parity (Context + Validation)

**Prereqs:** Existing GraphQL controllers/validator, `CartRequestValidator`, `StructuredLogger`, Redis config, security config.  
**Blockers:** None known; note: need header access within GraphQL (WebGraphQlInterceptor or controller arg).

### 1.1 Add RequestMetadata to GraphQL Context

**Files:**
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/graphql/CartQueryController.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/graphql/CartMutationController.java`
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/GraphQlContextInterceptor.java` (or equivalent)

**Implementation:**
- Capture required headers (`x-store-number`, `x-order-number`, `x-userid`, `x-sessionid`) in a `WebGraphQlInterceptor` and write `ContextKeys.METADATA` into Reactor context before resolver execution.
- Ensure controller methods (queries/mutations/subscriptions) are invoked with the metadata-present context so downstream service calls use the correct store/order/user/session values.

### 1.2 Align GraphQL Validation with REST

**Files:**
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/graphql/validation/GraphQLInputValidator.java`
- MODIFY (optional for reuse): `apps/cart-service/src/main/java/org/example/cart/validation/CartRequestValidator.java`

**Implementation:**
- Reuse/shared constants and helpers so UUID/SKU/quantity/storeNumber ranges match REST.
- Add validation for required headers (via interceptor-provided metadata) and missing/null inputs where REST validator enforces presence.
- Keep error aggregation behavior identical to REST (collect all errors before throwing `ValidationException`).

---

## Phase 2: GraphQL Tests and Docs Completion

**Prereqs:** Phase 1 completed; Redis Testcontainers setup already available.  
**Blockers:** None.

### 2.1 Subscription Controller Test

**Files:**
- CREATE: `apps/cart-service/src/test/java/org/example/cart/graphql/CartSubscriptionControllerTest.java`

**Implementation:**
- Use `WebGraphQlTester` to open `cartUpdated` subscription, trigger a mutation (e.g., addProduct), and assert the first event payload (type/cartId/itemCount) arrives.

### 2.2 Broaden Mutation/Query Coverage

**Files:**
- MODIFY: `apps/cart-service/src/test/java/org/example/cart/graphql/CartMutationControllerTest.java`
- MODIFY: `apps/cart-service/src/test/java/org/example/cart/graphql/CartQueryControllerTest.java`

**Implementation:**
- Add cases for product add/update/remove, discount apply/remove, and fulfillment add/update/remove, asserting responses and validation failures where applicable.

### 2.3 GraphQL README Presence

**Files:**
- CREATE: `apps/cart-service/src/main/resources/graphql/README.md`

**Implementation:**
- Document endpoint, auth scopes, example query/mutation/subscription, and SSE client note consistent with ADR 004.

---

## Phase 3: ecommerce-web GraphQL Client Adoption

**Prereqs:** Phase 1 complete (backend honors metadata/validation).  
**Blockers:** None; network mocks must be updated alongside.

### 3.1 GraphQL Client Utility

**Files:**
- CREATE: `libs/frontend/shared-data/api-client/src/lib/graphql-client.ts` (or extend existing client)
- MODIFY: `apps/ecommerce-web/src/features/cart/types/cart.ts`

**Implementation:**
- Implement a typed GraphQL POST helper to `/graphql` using existing header injection (store/order/user/session); parse `{data,errors}` and surface `ApiError` on errors.
- Align cart types with GraphQL schema additions (name/imageUrl/originalUnitPrice/inStock, etc.) and add a `CartEvent` type for subscriptions.

### 3.2 Replace REST Cart Hooks with GraphQL

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/cart/api/useCart.ts`
- MODIFY: `apps/ecommerce-web/src/shared/layouts/Header.tsx`
- MODIFY: `apps/ecommerce-web/src/features/cart/pages/CartPage.tsx`

**Implementation:**
- Rewrite `useCart`, `useAddToCart`, `useUpdateCartItem`, `useRemoveFromCart` to issue GraphQL queries/mutations (`cart`, `createCart`/`addProduct`/`updateProduct`/`removeProduct`), handling SKU string conversion and empty-cart fallback.
- Propagate shape changes to consumers (header/cart page) and ensure React Query keys remain stable.

### 3.3 Mocks and Tests

**Files:**
- MODIFY: `apps/ecommerce-web/src/mocks/handlers.ts`
- MODIFY: `apps/ecommerce-web/src/mocks/data.ts`
- MODIFY: `apps/ecommerce-web/src/features/products/components/*.test.tsx`
- MODIFY: `apps/ecommerce-web/src/features/cart/components/*.test.tsx`

**Implementation:**
- Switch MSW handlers to GraphQL operations for cart flows; keep pricing/totals calculation consistent.
- Update component/unit tests to the GraphQL-backed hooks and adjusted cart shape; ensure mock data covers new fields.
- Optional: add an EventSource helper for `cartUpdated` subscription and a thin smoke test if feasible.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/cart-service/src/main/java/org/example/cart/graphql/GraphQlContextInterceptor.java` | Inject RequestMetadata into Reactor context for GraphQL |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/graphql/CartQueryController.java` | Ensure queries run with metadata/validation parity |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/graphql/CartMutationController.java` | Ensure mutations run with metadata/validation parity |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/graphql/validation/GraphQLInputValidator.java` | Align validation rules with REST |
| CREATE | `apps/cart-service/src/test/java/org/example/cart/graphql/CartSubscriptionControllerTest.java` | End-to-end subscription coverage |
| MODIFY | `apps/cart-service/src/test/java/org/example/cart/graphql/CartMutationControllerTest.java` | Add mutation coverage for product/discount/fulfillment |
| MODIFY | `apps/cart-service/src/test/java/org/example/cart/graphql/CartQueryControllerTest.java` | Add query/validation cases |
| CREATE | `apps/cart-service/src/main/resources/graphql/README.md` | GraphQL API usage docs |
| CREATE | `libs/frontend/shared-data/api-client/src/lib/graphql-client.ts` | Shared GraphQL fetch helper |
| MODIFY | `apps/ecommerce-web/src/features/cart/api/useCart.ts` | Switch cart hooks to GraphQL |
| MODIFY | `apps/ecommerce-web/src/features/cart/types/cart.ts` | Align types with GraphQL schema |
| MODIFY | `apps/ecommerce-web/src/mocks/handlers.ts` | MSW GraphQL handlers for cart flows |
| MODIFY | `apps/ecommerce-web/src/mocks/data.ts` | Mock data aligned to GraphQL cart shape |
| MODIFY | `apps/ecommerce-web/src/features/cart/pages/CartPage.tsx` | Consume updated hooks/data shape |
| MODIFY | `apps/ecommerce-web/src/shared/layouts/Header.tsx` | Consume updated cart hook |
| MODIFY | `apps/ecommerce-web/src/features/*/components/*.test.tsx` | Update tests to GraphQL/mocks |

---

## Testing Strategy

- Backend: `pnpm nx test :apps:cart-service` (includes GraphQL + pub/sub integration tests).
- Frontend: `pnpm nx test ecommerce-web` plus `pnpm nx e2e ecommerce-web-e2e` with updated MSW handlers.
- Optional smoke: manual subscription check via `pnpm nx serve cart-service` + EventSource client hitting `/graphql`.

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `apps/cart-service/src/main/resources/graphql/README.md` | Add GraphQL usage, auth scopes, subscription example |
| `README.md` | Brief note that cart GraphQL is the preferred client API (optional) |
| `CLAUDE.md` | No change unless new commands/tooling added |

---

## Checklist

- [ ] Phase 1 complete (context + validation parity)
- [ ] Phase 2 complete (tests + README)
- [ ] Phase 3 complete (frontend GraphQL hooks + mocks/tests)
- [ ] All tests passing (backend + frontend)
- [ ] Documentation updated
