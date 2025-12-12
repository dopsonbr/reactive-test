# 046_CART_GRAPHQL_CLIENT_ALIGNMENT

**Status: COMPLETED**

---

## Overview

Close the gap between the cart-service GraphQL implementation and the archived plan by restoring REST parity (context propagation + validation), adding missing subscription coverage, and aligning the ecommerce-web client to consume the GraphQL API. Work spans backend GraphQL plumbing, tests/docs, and frontend data hooks/mocks.

## Findings

- GraphQL resolvers never attach `RequestMetadata` to the Reactor context, so downstream client calls run with storeNumber 0 and missing headers (diverges from REST behavior).
- `GraphQLInputValidator` omits several REST validations (header metadata and null/body checks), breaking the "parity with REST validator" requirement in the plan/AGENTS.
- GraphQL subscription integration lacks an end-to-end controller test and the README promised in the plan; mutation tests don't exercise product/discount/fulfillment flows.
- ecommerce-web still uses REST endpoints and MSW handlers; no GraphQL queries/mutations/subscriptions or typed client exist.

## Goals

1. Reintroduce RequestMetadata/context propagation for all GraphQL operations and align validation rules with REST.
2. Add the missing GraphQL docs/tests (including subscription coverage) to match the plan scope.
3. Switch ecommerce-web cart data access to the GraphQL API with updated types, mocks, and live subscription updates.

## Key Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Interceptor responsibility | Context population only | Keeps concerns separated; interceptor sets up context, validator handles business rules |
| 2 | Missing header behavior | Reject with 400 Bad Request | Standard HTTP semantics; descriptive error in GraphQL `errors` array |
| 3 | Subscription context | Capture once at subscription start | Auth happens at subscribe time; events are data relay; cart data is self-contained |
| 4 | Subscription test approach | Full HTTP layer via `WebGraphQlTester` | Tests real SSE transport; catches integration issues |
| 5 | README location | `apps/cart-service/README.md` | Better discoverability at service root |
| 6 | GraphQL client | Simple fetch wrapper + `graphql-sse` | TanStack Query best practice; minimal dependencies; codegen is future work |
| 7 | SKU type | Change to `string` in frontend | Aligns with GraphQL schema; avoids conversion at API boundary |
| 8 | Cart creation | `useCart()` handles via `createCart` mutation | Single hook responsibility; transparent to consumers |
| 9 | MSW approach | Native GraphQL support (`graphql.query()`, `graphql.mutation()`) | Built-in MSW feature; cleaner than manual POST parsing |
| 10 | REST mocks | Remove from MSW | Clean cutover; REST backend stays alive for other clients |
| 11 | Subscriptions | Required (not optional) | Full feature parity; E2E tests prove real behavior |
| 12 | E2E tests | Non-mocked in `e2e/ecommerce-fullstack/` | Proves subscriptions work against real backend |
| 13 | Migration approach | Clean cutover | No feature flag; simpler implementation |

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

### 2.3 GraphQL Documentation

**Files:**
- MODIFY: `apps/cart-service/README.md`

**Implementation:**
- Add GraphQL API section documenting endpoint, auth scopes, required headers, example query/mutation/subscription, and SSE client note consistent with ADR 004.

---

## Phase 3: ecommerce-web GraphQL Client Adoption

**Prereqs:** Phase 1 complete (backend honors metadata/validation).
**Blockers:** None; network mocks must be updated alongside.

### 3.1 GraphQL Client Utility

**Files:**
- CREATE: `libs/frontend/shared-data/api-client/src/lib/graphql-client.ts`
- MODIFY: `apps/ecommerce-web/src/features/cart/types/cart.ts`

**Dependencies:**
- Add `graphql-sse` package for SSE subscription support.

**Implementation:**
- Implement a typed GraphQL POST helper using existing header injection; parse `{data,errors}` and surface `ApiError` on errors.
- Add `graphql-sse` client for subscriptions with `subscribeToCart()` helper.
- Change cart types: `sku: string` (not number), add `CartEvent` type for subscriptions.

### 3.2 Replace REST Cart Hooks with GraphQL

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/cart/api/useCart.ts`
- CREATE: `apps/ecommerce-web/src/features/cart/api/useCartSubscription.ts`
- MODIFY: `apps/ecommerce-web/src/features/cart/pages/CartPage.tsx`

**Implementation:**
- Rewrite `useCart`, `useAddToCart`, `useUpdateCartItem`, `useRemoveFromCart` to issue GraphQL queries/mutations.
- `useCart()` handles cart creation: if no cart exists (null response), call `createCart` mutation.
- Add `useCartSubscription` hook that subscribes to `cartUpdated` and updates TanStack Query cache.
- CartPage uses subscription hook for real-time updates.

### 3.3 Mocks and Tests

**Files:**
- MODIFY: `apps/ecommerce-web/src/mocks/handlers.ts`
- MODIFY: `apps/ecommerce-web/src/mocks/data.ts`
- MODIFY: `apps/ecommerce-web/src/features/cart/components/*.test.tsx`

**Implementation:**
- Remove REST cart handlers from MSW (clean cutover).
- Add MSW native GraphQL handlers using `graphql.query()` and `graphql.mutation()`.
- Update mock data to use `sku: string`.

### 3.4 E2E Subscription Tests

**Files:**
- CREATE: `e2e/ecommerce-fullstack/specs/cart-subscriptions.spec.ts`
- MODIFY: `e2e/ecommerce-fullstack/fixtures/test-base.ts`

**Implementation:**
- Non-mocked E2E test that proves subscriptions work against real backend.
- Test flow: subscribe → add item via mutation → verify UI updates via subscription (no manual refresh).
- Test reconnection after network interruption.

---

## Files Summary

### Backend (046A + 046B)

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/cart-service/src/main/java/org/example/cart/graphql/GraphQlContextInterceptor.java` | Inject RequestMetadata into Reactor context for GraphQL |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/graphql/CartQueryController.java` | Ensure queries run with metadata context |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/graphql/CartMutationController.java` | Ensure mutations run with metadata context |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/graphql/CartSubscriptionController.java` | Ensure subscriptions read metadata context |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/graphql/validation/GraphQLInputValidator.java` | Align validation rules with REST (including header validation) |
| CREATE | `apps/cart-service/src/test/java/org/example/cart/graphql/CartSubscriptionControllerTest.java` | Full HTTP/SSE subscription coverage |
| MODIFY | `apps/cart-service/src/test/java/org/example/cart/graphql/CartMutationControllerTest.java` | Add mutation coverage |
| MODIFY | `apps/cart-service/src/test/java/org/example/cart/graphql/CartQueryControllerTest.java` | Add query/validation cases |
| MODIFY | `apps/cart-service/README.md` | Add GraphQL API documentation section |

### Frontend (046C)

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `libs/frontend/shared-data/api-client/src/lib/graphql-client.ts` | GraphQL fetch helper + `graphql-sse` subscription client |
| MODIFY | `apps/ecommerce-web/src/features/cart/types/cart.ts` | Align types (`sku: string`, `CartEvent` type) |
| MODIFY | `apps/ecommerce-web/src/features/cart/api/useCart.ts` | Switch hooks to GraphQL (with cart creation handling) |
| CREATE | `apps/ecommerce-web/src/features/cart/api/useCartSubscription.ts` | SSE subscription hook for `cartUpdated` |
| MODIFY | `apps/ecommerce-web/src/features/cart/pages/CartPage.tsx` | Use subscription hook |
| MODIFY | `apps/ecommerce-web/src/mocks/handlers.ts` | GraphQL MSW handlers (remove REST cart handlers) |
| MODIFY | `apps/ecommerce-web/src/mocks/data.ts` | Mock data with `sku: string` |
| MODIFY | `apps/ecommerce-web/src/features/cart/components/*.test.tsx` | Update tests for GraphQL/mocks |
| CREATE | `e2e/ecommerce-fullstack/specs/cart-subscriptions.spec.ts` | Non-mocked E2E subscription tests |
| MODIFY | `e2e/ecommerce-fullstack/fixtures/test-base.ts` | SSE monitoring helper |

---

## Testing Strategy

**Backend:**
- `pnpm nx test :apps:cart-service` — Unit + integration tests (includes GraphQL + pub/sub via Testcontainers).

**Frontend:**
- `pnpm nx test ecommerce-web` — Unit/component tests with MSW GraphQL handlers.
- `pnpm nx e2e ecommerce-web-e2e` — Mocked E2E tests (fast, every PR).
- `pnpm nx e2e ecommerce-fullstack-e2e` — **Non-mocked E2E tests proving subscriptions work against real backend.**

**Full-stack E2E subscription test:**
```bash
docker compose -f docker/docker-compose.e2e.yml up -d --build
npx tsx e2e/ecommerce-fullstack/fixtures/seed-data.ts
pnpm nx e2e ecommerce-fullstack-e2e
```

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `apps/cart-service/README.md` | Add GraphQL API section (endpoint, headers, auth scopes, examples) |
| `README.md` | Brief note that cart GraphQL is the preferred client API (optional) |

---

## Checklist

- [ ] Phase 1 complete (context interceptor + validation parity)
- [ ] Phase 2 complete (subscription test via full HTTP layer + README updated)
- [ ] Phase 3 complete (frontend GraphQL hooks + subscription + mocks/tests)
- [ ] Non-mocked E2E subscription tests passing
- [ ] All tests passing (backend + frontend)
- [ ] Documentation updated
