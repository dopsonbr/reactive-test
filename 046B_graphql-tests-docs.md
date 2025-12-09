# 046B_graphql-tests-docs

**Status: DRAFT**

---

## Overview

Add the missing GraphQL subscription integration test, broaden query/mutation coverage, and supply the GraphQL README promised in the plan. Confirms backend behavior after context/validation parity is restored.

**Related Plans:**
- `046_CART_GRAPHQL_CLIENT_ALIGNMENT.md` — umbrella plan
- `046A_backend-graphql-parity.md` — prerequisite for stable behavior
- `046C_frontend-graphql-client.md` — depends on tested API surface

## Goals

1. Cover cart GraphQL subscriptions end-to-end (mutation triggers event).
2. Expand mutation/query tests to exercise product/discount/fulfillment flows and validation failures.
3. Document GraphQL endpoint usage, auth scopes, and examples.

## References

**Standards:**
- `docs/standards/backend/testing-integration.md` — GraphQL + Testcontainers patterns.

**ADRs:**
- `docs/ADRs/004_graphql_subscriptions_architecture.md` — SSE subscription expectations.

## Architecture

```
WebGraphQlTester (subscription)
        │
        ▼
GraphQL subscription resolver → Redis pub/sub → published event from mutation
```

---

## Phase 1: Subscription Integration Test

**Prereqs:** `046A` merged; Redis Testcontainers available via AbstractGraphQLIntegrationTest.  
**Blockers:** None.

### 1.1 Add Subscription Controller Test

**Files:**
- CREATE: `apps/cart-service/src/test/java/org/example/cart/graphql/CartSubscriptionControllerTest.java`

**Implementation:**
- Use `WebGraphQlTester` to open `cartUpdated` subscription, perform a mutation (e.g., `addProduct`), assert first event matches cartId/type, and completes via `StepVerifier`/flux take(1).

---

## Phase 2: Broader Query/Mutation Coverage

**Prereqs:** Phase 1 complete.  
**Blockers:** None.

### 2.1 Expand Mutation Tests

**Files:**
- MODIFY: `apps/cart-service/src/test/java/org/example/cart/graphql/CartMutationControllerTest.java`

**Implementation:**
- Add cases for add/update/remove product, apply/remove discount, add/update/remove fulfillment, and validation failure assertions.

### 2.2 Expand Query Tests

**Files:**
- MODIFY: `apps/cart-service/src/test/java/org/example/cart/graphql/CartQueryControllerTest.java`

**Implementation:**
- Add assertions for product/discount/fulfillment lookups and validation errors (bad UUID, bad storeNumber) to mirror REST coverage.

---

## Phase 3: GraphQL README

**Prereqs:** Phases 1-2 in progress OK; contents align with final schema.  
**Blockers:** None.

### 3.1 Add README

**Files:**
- CREATE: `apps/cart-service/src/main/resources/graphql/README.md`

**Implementation:**
- Document `/graphql` endpoint, auth scopes (`cart:read/write/admin`), example query/mutation/subscription, SSE note per ADR 004, and error format note (validation errors in extensions).

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/cart-service/src/test/java/org/example/cart/graphql/CartSubscriptionControllerTest.java` | Subscription coverage |
| MODIFY | `apps/cart-service/src/test/java/org/example/cart/graphql/CartMutationControllerTest.java` | Broader mutation coverage |
| MODIFY | `apps/cart-service/src/test/java/org/example/cart/graphql/CartQueryControllerTest.java` | Broader query/validation coverage |
| CREATE | `apps/cart-service/src/main/resources/graphql/README.md` | GraphQL usage documentation |

---

## Testing Strategy

- `pnpm nx test :apps:cart-service` (includes new subscription/mutation/query tests).
- Optional manual SSE smoke with EventSource against `/graphql` to confirm event delivery.

---

## Checklist

- [ ] Subscription test added and passing
- [ ] Mutation/query tests expanded
- [ ] GraphQL README added
- [ ] All tests passing
