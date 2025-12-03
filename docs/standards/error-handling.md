# Error Handling Standard

## Intent

Provide consistent, informative error responses without leaking implementation details or compromising security.

## Outcomes

- Structured error responses for all error types
- Appropriate HTTP status codes
- Trace IDs for debugging correlation
- No stack traces or sensitive details to clients
- Fallback values for non-critical failures

## Patterns

### Error Response Structure

All errors return a consistent JSON structure:

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/products/123",
  "status": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "traceId": "abc123def456",
  "details": {
    "x-store-number": "Must be between 1 and 2000",
    "x-userid": "Must be 6 alphanumeric characters"
  }
}
```

### Exception to HTTP Status Mapping

| Exception | HTTP Status | Description |
|-----------|-------------|-------------|
| `ValidationException` | 400 Bad Request | Request validation failed |
| `WebClientResponseException$BadRequest` | 400 Bad Request | Upstream 400 |
| `WebClientResponseException$NotFound` | 404 Not Found | Resource not found |
| `WebClientResponseException$Unauthorized` | 401 Unauthorized | Auth required |
| `WebClientResponseException$Forbidden` | 403 Forbidden | Permission denied |
| `CallNotPermittedException` | 503 Service Unavailable | Circuit breaker open |
| `BulkheadFullException` | 503 Service Unavailable | Too many concurrent requests |
| `TimeoutException` | 504 Gateway Timeout | Request timeout |
| `WebClientResponseException$ServiceUnavailable` | 503 Service Unavailable | Upstream 503 |
| `WebClientResponseException$GatewayTimeout` | 504 Gateway Timeout | Upstream 504 |
| `Exception` (default) | 500 Internal Server Error | Unexpected error |

### Global Error Handler

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class GlobalErrorHandler implements ErrorWebExceptionHandler {

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        return Mono.deferContextual(ctx -> {
            String traceId = extractTraceId(ctx);
            ErrorResponse response = mapToErrorResponse(ex, exchange, traceId);

            exchange.getResponse().setStatusCode(response.status());
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

            return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory()
                    .wrap(serialize(response)))
            );
        });
    }
}
```

### Repository Fallbacks

Every repository that calls external services MUST define a static fallback:

```java
@Repository
class MerchandiseRepository {
    // Fallback for when service is unavailable
    private static final Merchandise FALLBACK = new Merchandise(
        "Product information temporarily unavailable",
        null,
        0
    );

    Mono<Merchandise> getMerchandise(long sku) {
        return resilience.decorate("merchandise-service", fetchFromService(sku))
            .onErrorResume(this::handleError);
    }

    private Mono<Merchandise> handleError(Throwable error) {
        if (error instanceof CallNotPermittedException) {
            log.warn("Circuit breaker OPEN, returning fallback");
        } else if (error instanceof TimeoutException) {
            log.warn("Timeout, returning fallback");
        } else {
            log.error("Error fetching merchandise: {}", error.getMessage());
        }
        return Mono.just(FALLBACK);
    }
}
```

### Error Categories

| Category | Behavior | Example |
|----------|----------|---------|
| **Client errors (4xx)** | Return error response | Validation failure |
| **Infrastructure errors** | Return fallback | Circuit breaker open |
| **Business errors** | Return error or fallback | Product not found |

### Fallback Design

Fallbacks should be:
- **Safe**: Don't expose sensitive data
- **Informative**: Indicate temporary unavailability
- **Consistent**: Same structure as normal response

```java
// Good fallback - safe and informative
private static final Product FALLBACK = new Product(
    0,
    "Product information temporarily unavailable",
    "N/A",
    0  // Safe: assume not available
);

// Bad fallback - misleading
private static final Product BAD_FALLBACK = new Product(
    sku,
    "Error",
    "0.00",
    999  // Dangerous: claims high availability
);
```

### Error Logging

Log errors with appropriate levels:

```java
private Mono<Product> handleError(Throwable error) {
    if (error instanceof ValidationException) {
        // Client error - INFO level
        log.info("Validation failed: {}", error.getMessage());
    } else if (error instanceof CallNotPermittedException) {
        // Expected infrastructure - WARN level
        log.warn("Circuit breaker open for {}", SERVICE_NAME);
    } else if (error instanceof TimeoutException) {
        // Expected infrastructure - WARN level
        log.warn("Timeout calling {}", SERVICE_NAME);
    } else {
        // Unexpected - ERROR level with stack trace
        log.error("Unexpected error calling {}: {}", SERVICE_NAME, error.getMessage(), error);
    }
    return Mono.just(FALLBACK);
}
```

### Error Propagation Rules

| Scenario | Action |
|----------|--------|
| Validation error | Return 400 immediately |
| Single dependency fails | Return fallback, continue processing |
| All dependencies fail | Return partial response with fallbacks |
| Critical dependency fails | Return 503 |
| Unexpected error | Return 500, log full error |

### Partial Success Response

When aggregating from multiple services, return partial data:

```java
Mono<Product> getProduct(long sku) {
    return Mono.zip(
        getMerchandise(sku).onErrorReturn(MERCHANDISE_FALLBACK),
        getPrice(sku).onErrorReturn(PRICE_FALLBACK),
        getInventory(sku).onErrorReturn(INVENTORY_FALLBACK)
    ).map(tuple -> new Product(
        tuple.getT1(),  // May be fallback
        tuple.getT2(),  // May be fallback
        tuple.getT3()   // May be fallback
    ));
}
```

## Anti-patterns

### Returning Stack Traces to Clients

```java
// DON'T - exposes internal details
.onErrorResume(e -> {
    return ServerResponse.status(500)
        .bodyValue(Map.of(
            "error", e.getMessage(),
            "stackTrace", Arrays.toString(e.getStackTrace())  // NEVER!
        ));
});

// DO - return sanitized error
.onErrorResume(e -> {
    log.error("Internal error", e);  // Log full error internally
    return ServerResponse.status(500)
        .bodyValue(Map.of(
            "error", "Internal Server Error",
            "message", "An unexpected error occurred",
            "traceId", traceId
        ));
});
```

### Generic "Internal Server Error" for All Errors

```java
// DON'T - unhelpful for clients
.onErrorResume(e -> {
    return ServerResponse.status(500)
        .bodyValue("Internal Server Error");
});

// DO - map to appropriate status
.onErrorResume(ValidationException.class, e ->
    ServerResponse.badRequest()
        .bodyValue(new ErrorResponse(400, "Validation failed", e.getDetails())))
.onErrorResume(CallNotPermittedException.class, e ->
    ServerResponse.status(503)
        .bodyValue(new ErrorResponse(503, "Service temporarily unavailable")));
```

### No Fallback Responses

```java
// DON'T - errors propagate to client
Mono<Product> getProduct(long sku) {
    return merchandiseRepository.get(sku);  // No fallback
}

// DO - provide fallback
Mono<Product> getProduct(long sku) {
    return merchandiseRepository.get(sku)
        .onErrorReturn(FALLBACK);
}
```

### Swallowing Errors Silently

```java
// DON'T - error hidden, debugging impossible
.onErrorResume(e -> Mono.empty());

// DO - log error, then handle
.onErrorResume(e -> {
    log.error("Error processing: {}", e.getMessage(), e);
    return Mono.empty();
});
```

### Exposing Sensitive Information

```java
// DON'T - leaks database details
catch (SQLException e) {
    return errorResponse("Database error: " + e.getMessage());
    // "Database error: Connection to postgres://user:password@host:5432 failed"
}

// DO - generic message
catch (SQLException e) {
    log.error("Database error", e);
    return errorResponse("A database error occurred. Please try again.");
}
```

### Different Error Formats

```java
// DON'T - inconsistent error formats
// Endpoint A returns:
{"error": "Bad request"}

// Endpoint B returns:
{"message": "Invalid input", "code": 400}

// Endpoint C returns:
{"errors": [{"field": "sku", "message": "required"}]}

// DO - consistent format everywhere
{
  "error": "Bad Request",
  "message": "Validation failed",
  "status": 400,
  "traceId": "abc123",
  "details": {...}
}
```

### Missing Trace ID in Errors

```java
// DON'T - no way to correlate with logs
{"error": "Service unavailable"}

// DO - include trace ID
{
  "error": "Service Unavailable",
  "traceId": "abc123def456",
  "message": "Please try again later"
}
```

## Reference

- `libs/platform/platform-error/GlobalErrorHandler.java` - Global handler
- `libs/platform/platform-error/ErrorResponse.java` - Error response model
- `apps/product-service/src/.../repository/*/` - Fallback examples
