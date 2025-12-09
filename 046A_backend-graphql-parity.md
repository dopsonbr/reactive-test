# 046A_backend-graphql-parity

**Status: DRAFT**

---

## Overview

Restore REST parity for cart-service GraphQL by propagating request metadata into Reactor context and aligning validation rules with the REST validator. This ensures downstream product/discount/fulfillment calls receive required headers and GraphQL inputs are validated identically.

**Related Plans:**
- `046_CART_GRAPHQL_CLIENT_ALIGNMENT.md` — umbrella plan
- `046B_graphql-tests-docs.md` — follows for tests/docs
- `046C_frontend-graphql-client.md` — depends on stable API surface

## Goals

1. Inject `RequestMetadata` into all GraphQL operations so service layer sees correct store/order/user/session values.
2. Align GraphQL validation with REST rules, including header-derived constraints and error aggregation.

## References

**Standards:**
- `docs/standards/validation.md` — error aggregation rules and field-level messaging.

**ADRs:**
- `docs/ADRs/004_graphql_subscriptions_architecture.md` — GraphQL entrypoint expectations (context setup before resolver execution).

## Architecture

```
GraphQL request (POST/SSE)
        │  headers (store/order/user/session)
        ▼
WebGraphQlInterceptor → Reactor Context (ContextKeys.METADATA)
        │
        ▼
Resolvers → CartService → downstream clients (headers applied)
```

---

## Phase 1: Context Propagation

**Prereqs:** Existing GraphQL controllers; `ContextKeys`/`RequestMetadata` available; security config allows header access.  
**Blockers:** None identified.

### 1.1 Add GraphQL Interceptor

**Files:**
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/GraphQlContextInterceptor.java`

**Implementation:**
- Implement `WebGraphQlInterceptor` to read `x-store-number`, `x-order-number`, `x-userid`, `x-sessionid`, build `RequestMetadata`, and write it into Reactor context before data fetchers run. Log missing headers in dev mode but fail validation later.

### 1.2 Wire Controllers to Context

**Files:**
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/graphql/CartQueryController.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/graphql/CartMutationController.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/graphql/CartSubscriptionController.java`

**Implementation:**
- Ensure resolvers execute under the interceptor-provided context (no manual header parsing in methods). Add defensive checks if context is absent to surface a clear validation error.

---

## Phase 2: Validation Parity

**Prereqs:** Phase 1 merged; `CartRequestValidator` available.  
**Blockers:** None.

### 2.1 Share Validation Rules

**Files:**
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/graphql/validation/GraphQLInputValidator.java`
- MODIFY (if helper extraction needed): `apps/cart-service/src/main/java/org/example/cart/validation/CartRequestValidator.java`

**Implementation:**
- Reuse constants/helpers for UUID/SKU/quantity/store ranges.
- Add validation that leverages metadata (storeNumber/orderNumber/userId/sessionId) similar to REST, preserving aggregated `ValidationException` output.
- Validate null/missing inputs (body equivalents) to match REST behavior.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/cart-service/src/main/java/org/example/cart/graphql/GraphQlContextInterceptor.java` | Inject RequestMetadata into Reactor context for GraphQL |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/graphql/CartQueryController.java` | Ensure queries run with metadata context |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/graphql/CartMutationController.java` | Ensure mutations run with metadata context |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/graphql/CartSubscriptionController.java` | Ensure subscriptions read metadata context |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/graphql/validation/GraphQLInputValidator.java` | Align validation rules with REST |
| MODIFY | `apps/cart-service/src/main/java/org/example/cart/validation/CartRequestValidator.java` | Share helpers/constants if needed |

---

## Testing Strategy

- `pnpm nx test :apps:cart-service` with added coverage for validation errors.
- Manual smoke: invoke GraphQL mutation with headers and verify downstream calls receive metadata (via logs or mock assertions).

---

## Checklist

- [ ] Context interceptor in place
- [ ] Controllers run with metadata
- [ ] GraphQL validation matches REST
- [ ] Tests passing
