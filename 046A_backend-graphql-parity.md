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

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Interceptor responsibility | Context population only | Keeps concerns separated; interceptor sets up context, validator handles business rules |
| Missing header behavior | Reject with 400 Bad Request | Standard HTTP semantics for malformed requests; descriptive error in GraphQL `errors` array |
| Subscription context | Capture once at subscription start | Auth happens at subscribe time; events are data relay; cart data is self-contained |

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
- Implement `WebGraphQlInterceptor` to read `x-store-number`, `x-order-number`, `x-userid`, `x-sessionid` from request headers.
- Build `RequestMetadata` record and write it into Reactor context via `contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata))`.
- **Do NOT validate in interceptor** — only populate context. Validation happens in `GraphQLInputValidator`.
- If headers are missing/malformed, still populate context with defaults (e.g., `storeNumber=0`, empty strings) so validator can produce aggregated errors.

```java
@Component
public class GraphQlContextInterceptor implements WebGraphQlInterceptor {
    @Override
    public Mono<WebGraphQlResponse> intercept(WebGraphQlRequest request, Chain chain) {
        HttpHeaders headers = request.getHeaders();
        RequestMetadata metadata = extractMetadata(headers);
        return chain.next(request)
            .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    private RequestMetadata extractMetadata(HttpHeaders headers) {
        int storeNumber = parseStoreNumber(headers.getFirst("x-store-number"));
        String orderNumber = headers.getFirst("x-order-number");
        String userId = headers.getFirst("x-userid");
        String sessionId = headers.getFirst("x-sessionid");
        return new RequestMetadata(storeNumber, orderNumber, userId, sessionId);
    }

    private int parseStoreNumber(String value) {
        if (value == null || value.isBlank()) return 0;
        try { return Integer.parseInt(value); }
        catch (NumberFormatException e) { return 0; }
    }
}
```

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

**Header Validation in GraphQLInputValidator:**
```java
public Mono<Void> validateMetadata(RequestMetadata metadata) {
    List<ValidationError> errors = new ArrayList<>();

    // x-store-number: required, 1-2000
    if (metadata.storeNumber() < 1 || metadata.storeNumber() > 2000) {
        errors.add(new ValidationError("x-store-number", "Must be between 1 and 2000"));
    }

    // x-order-number: required, UUID format
    if (!isValidUuid(metadata.orderNumber())) {
        errors.add(new ValidationError("x-order-number", "Must be a valid UUID"));
    }

    // x-userid: required, 6 alphanumeric
    if (!isValidUserId(metadata.userId())) {
        errors.add(new ValidationError("x-userid", "Must be 6 alphanumeric characters"));
    }

    // x-sessionid: required, UUID format
    if (!isValidUuid(metadata.sessionId())) {
        errors.add(new ValidationError("x-sessionid", "Must be a valid UUID"));
    }

    return errors.isEmpty()
        ? Mono.empty()
        : Mono.error(new ValidationException(errors)); // Returns 400 with all errors
}
```

**Error Response Format (400 Bad Request):**
```json
{
  "errors": [{
    "message": "Validation failed",
    "extensions": {
      "classification": "BAD_REQUEST",
      "validationErrors": {
        "x-store-number": "Must be between 1 and 2000",
        "x-userid": "Must be 6 alphanumeric characters"
      }
    }
  }]
}
```

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
