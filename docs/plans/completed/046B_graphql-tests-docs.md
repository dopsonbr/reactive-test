# 046B_graphql-tests-docs

**Status: COMPLETED**

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

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Subscription test approach | Full HTTP layer via `WebGraphQlTester` | Tests real SSE transport, not just controller method; catches integration issues |
| README location | `apps/cart-service/README.md` | Better discoverability at service root; schema files remain in `resources/graphql/` |

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
- Use `WebGraphQlTester` to open `cartUpdated` subscription via full HTTP layer (SSE transport).
- Test flow: subscribe → trigger mutation (e.g., `addProduct`) → assert first event matches cartId/type.
- Use `StepVerifier` to verify subscription flux behavior.

```java
@Test
void shouldReceiveCartUpdatedEventOnProductAdd() {
    // Create cart first
    String cartId = createTestCart();

    // Subscribe to cart updates via SSE
    Flux<CartEvent> events = graphQlTester
        .document("""
            subscription {
                cartUpdated(cartId: "%s") {
                    eventType
                    cart { id itemCount }
                }
            }
            """.formatted(cartId))
        .executeSubscription()
        .toFlux("cartUpdated", CartEvent.class);

    // Trigger mutation in parallel
    StepVerifier.create(events.take(1))
        .then(() -> addProductToCart(cartId, "SKU-001", 2))
        .assertNext(event -> {
            assertThat(event.eventType()).isEqualTo("PRODUCT_ADDED");
            assertThat(event.cart().id()).isEqualTo(cartId);
        })
        .verifyComplete();
}
```

**Test Headers:** Ensure test sends required headers (`x-store-number`, `x-order-number`, `x-userid`, `x-sessionid`) via `HttpGraphQlTester` configuration.

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

### 3.1 Update Service README with GraphQL Section

**Files:**
- MODIFY: `apps/cart-service/README.md`

**Implementation:**
Add a GraphQL API section documenting:
- `/graphql` endpoint (POST for queries/mutations, SSE for subscriptions)
- Auth scopes (`cart:read`, `cart:write`, `cart:admin`)
- Required headers (`x-store-number`, `x-order-number`, `x-userid`, `x-sessionid`)
- Example query, mutation, and subscription
- SSE client note per ADR 004
- Error format (validation errors in `extensions.validationErrors`)

**README Section Template:**
```markdown
## GraphQL API

### Endpoint
- **URL:** `/graphql`
- **Queries/Mutations:** POST with `Content-Type: application/json`
- **Subscriptions:** GET/POST with `Accept: text/event-stream` (SSE)

### Required Headers
| Header | Format | Example |
|--------|--------|---------|
| `x-store-number` | Integer 1-2000 | `42` |
| `x-order-number` | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `x-userid` | 6 alphanumeric | `USER01` |
| `x-sessionid` | UUID | `7c9e6679-7425-40de-944b-e07fc1f90ae7` |

### Auth Scopes
- `cart:read` — Query operations
- `cart:write` — Mutation operations
- `cart:admin` — Store-wide subscriptions

### Example Subscription (SSE)
```javascript
const eventSource = new EventSource(
  '/graphql?query=subscription{cartUpdated(cartId:"abc"){eventType,cart{id,totals{grandTotal}}}}',
  { headers: { 'Authorization': 'Bearer <token>' } }
);
eventSource.onmessage = (e) => console.log(JSON.parse(e.data));
```

### Error Format
Validation errors return 400 with details in extensions:
```json
{
  "errors": [{
    "message": "Validation failed",
    "extensions": {
      "classification": "BAD_REQUEST",
      "validationErrors": { "x-store-number": "Must be between 1 and 2000" }
    }
  }]
}
```
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/cart-service/src/test/java/org/example/cart/graphql/CartSubscriptionControllerTest.java` | Subscription coverage via full HTTP/SSE layer |
| MODIFY | `apps/cart-service/src/test/java/org/example/cart/graphql/CartMutationControllerTest.java` | Broader mutation coverage |
| MODIFY | `apps/cart-service/src/test/java/org/example/cart/graphql/CartQueryControllerTest.java` | Broader query/validation coverage |
| MODIFY | `apps/cart-service/README.md` | Add GraphQL API documentation section |

---

## Testing Strategy

- `pnpm nx test :apps:cart-service` (includes new subscription/mutation/query tests).
- Optional manual SSE smoke with EventSource against `/graphql` to confirm event delivery.

---

## Checklist

- [ ] Subscription test added and passing (full HTTP/SSE layer)
- [ ] Mutation/query tests expanded (header validation coverage)
- [ ] GraphQL section added to `apps/cart-service/README.md`
- [ ] All tests passing
