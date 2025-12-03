# Cart Service Agent Guidelines

A simpler service focused on Redis persistence. Use product-service as the reference for more complex patterns.

## Key Files

| File | Purpose |
|------|---------|
| `CartController.java` | REST endpoints for cart CRUD operations |
| `CartService.java` | Business logic with Redis operations |
| `Cart.java` | Cart domain record with computed fields |
| `CartItem.java` | Cart item domain record |
| `application.yml` | Redis and server configuration |

## Common Tasks

### Add a New Endpoint

1. Add controller method in `CartController.java`
2. Add service method in `CartService.java`
3. Add integration test

Example controller method:
```java
@DeleteMapping("/{cartId}")
public Mono<Void> deleteCart(
        @PathVariable String cartId,
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        ServerHttpRequest request) {
    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

    return Mono.deferContextual(ctx -> {
        logRequest(ctx, request);
        return cartService.deleteCart(cartId)
            .doOnSuccess(v -> logResponse(ctx, request, 204, null));
    })
    .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
}
```

### Add OAuth2 Security

Follow product-service patterns:
1. Add `platform-security` dependency
2. Create `security/SecurityConfig.java`
3. Configure in `application.yml`

### Add Resilience4j

If external HTTP calls are added:
1. Add `platform-resilience` dependency
2. Create repository classes following product-service pattern
3. Configure resilience4j in `application.yml`

## Patterns in This Service

### Context Propagation

Same pattern as product-service:
```java
return Mono.deferContextual(ctx -> {
    // Access context here
    return service.method();
})
.contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
```

### Structured Logging

Uses `StructuredLogger` for JSON-formatted logs:
```java
structuredLogger.logRequest(ctx, LOGGER_NAME, requestData);
structuredLogger.logResponse(ctx, LOGGER_NAME, responseData);
```

### Domain Records with Computed Fields

Cart has computed fields (different from pure data model standard):
```java
public record Cart(String id, String userId, List<CartItem> items, ...) {
    public BigDecimal total() {
        return items.stream().map(CartItem::total).reduce(...);
    }

    public int itemCount() {
        return items.stream().mapToInt(CartItem::quantity).sum();
    }
}
```

Note: This is a deviation from the pure data model standard. Consider moving these calculations to `CartService` if the model needs to be strictly pure.

## Anti-patterns to Avoid

- Blocking Redis operations (use reactive templates)
- Using MDC instead of Reactor Context
- Missing context propagation on endpoints
- Hardcoding Redis connection details

## What's Missing (Compared to Product Service)

- [ ] OAuth2/JWT security
- [ ] Request validation (header format checking)
- [ ] Resilience4j (no external HTTP calls yet)
- [ ] Architecture tests
- [ ] Full integration tests

## Test Files

Currently minimal testing. To add:
1. Create `CartServiceApplicationTest.java` for context load
2. Create `CartServiceIntegrationTest.java` with Redis Testcontainer
3. Create `ArchitectureTest.java` extending platform rules

## File Locations

| Purpose | Location |
|---------|----------|
| Application entry | `src/main/java/.../CartServiceApplication.java` |
| REST controller | `src/main/java/.../controller/CartController.java` |
| Business logic | `src/main/java/.../service/CartService.java` |
| Domain models | `src/main/java/.../domain/` |
| Configuration | `src/main/resources/application.yml` |
