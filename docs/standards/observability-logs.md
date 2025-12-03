# Logging Standard

## Intent

Provide consistent, structured, searchable logs for debugging and monitoring across all services.

## Outcomes

- JSON-formatted logs for machine parsing
- Request correlation via trace IDs
- Searchable metadata (store, user, session)
- No sensitive data in logs
- Consistent log format across services

## Patterns

### Log Structure

All logs are JSON-formatted with consistent fields:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "logger": "productservice",
  "traceId": "abc123def456",
  "spanId": "789xyz",
  "metadata": {
    "storeNumber": 1234,
    "orderNumber": "uuid-order-123",
    "userId": "abc123",
    "sessionId": "uuid-session-456"
  },
  "data": {
    "message": "Processing request",
    "sku": 123456
  }
}
```

### Logger Names

Use lowercase, no dots, component name only:

| Component | Logger Name |
|-----------|-------------|
| ProductController | `productcontroller` |
| ProductService | `productservice` |
| MerchandiseRepository | `merchandiserepository` |
| PriceRepository | `pricerepository` |
| InventoryRepository | `inventoryrepository` |

```java
private static final String LOGGER_NAME = "productservice";
```

### Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| ERROR | Exceptions, failures requiring attention | Database connection failed |
| WARN | Recoverable issues, fallbacks used | Circuit breaker open, using fallback |
| INFO | Request/response, state changes | Request received, response sent |
| DEBUG | Detailed flow (disabled in prod) | Cache hit/miss, intermediate values |
| TRACE | Very detailed debugging | Full request/response bodies |

### Context Propagation

**CRITICAL: Use Reactor Context, NOT MDC**

MDC is thread-local and does not work correctly with reactive streams. Always use Reactor Context for correlation data.

```java
// DON'T - MDC is not reactive-safe
MDC.put("traceId", traceId);
log.info("Processing request");  // May log wrong traceId

// DO - Use Reactor Context
Mono.deferContextual(ctx -> {
    structuredLogger.logMessage(ctx, LOGGER_NAME, "Processing request");
    return processRequest();
});
```

### StructuredLogger Usage

```java
@Component
class ProductService {
    private static final String LOGGER_NAME = "productservice";

    private final StructuredLogger structuredLogger;

    Mono<Product> getProduct(long sku) {
        return Mono.deferContextual(ctx -> {
            structuredLogger.logMessage(ctx, LOGGER_NAME,
                "Fetching product", Map.of("sku", sku));
            return fetchProduct(sku);
        });
    }
}
```

### WebClient Logging

All WebClient beans MUST include logging filter:

```java
@Bean
WebClient merchandiseWebClient(
        WebClient.Builder builder,
        WebClientLoggingFilter loggingFilter) {
    return builder
        .baseUrl(merchandiseBaseUrl)
        .filter(loggingFilter.create("merchandiserepository"))
        .build();
}
```

This logs:
- Outbound request (method, URL, headers)
- Inbound response (status, timing)
- Errors with context

### Request Metadata Extraction

Extract and propagate headers at the controller level:

```java
@GetMapping("/products/{sku}")
Mono<Product> getProduct(@PathVariable long sku, ServerHttpRequest request) {
    RequestMetadata metadata = RequestMetadata.fromHeaders(request.getHeaders());
    return service.getProduct(sku)
        .contextWrite(ctx -> ctx.put(ContextKeys.REQUEST_METADATA, metadata));
}
```

### Log Message Guidelines

| Good | Bad |
|------|-----|
| "Fetching merchandise for SKU" | "Getting data" |
| "Circuit breaker OPEN for price-service" | "Error occurred" |
| "Cache HIT for merchandise:sku:123" | "Found in cache" |
| "Request completed in 45ms" | "Done" |

Include relevant identifiers in log data:
```java
structuredLogger.logMessage(ctx, LOGGER_NAME, "Processing order",
    Map.of(
        "orderId", orderId,
        "sku", sku,
        "quantity", quantity
    ));
```

### Logging Configuration

```yaml
logging:
  level:
    root: INFO
    org.example: INFO
    org.springframework.web: WARN
    io.netty: WARN
    reactor.netty: WARN

  pattern:
    console: "%d{ISO8601} %highlight(%-5level) [%thread] %cyan(%logger{36}) - %msg%n"
```

Production (JSON):
```yaml
logging:
  config: classpath:logback-json.xml
```

### Sensitive Data

NEVER log:
- Passwords or secrets
- Full credit card numbers
- Social Security Numbers
- Authentication tokens (JWT, API keys)
- PII without masking

```java
// DON'T
log.info("User authenticated with password: {}", password);
log.info("Processing card: {}", cardNumber);

// DO - mask sensitive data
log.info("User authenticated: {}", userId);
log.info("Processing card ending in: {}", last4Digits);
```

## Anti-patterns

### Using MDC (Not Reactive-Safe)

```java
// DON'T - thread switching breaks correlation
MDC.put("traceId", traceId);
return webClient.get()
    .retrieve()
    .bodyToMono(Response.class)
    .map(r -> {
        log.info("Response received");  // Wrong traceId!
        return r;
    });
```

### Logging Without Context

```java
// DON'T - no correlation possible
log.info("Processing request");

// DO - include context
Mono.deferContextual(ctx -> {
    structuredLogger.logMessage(ctx, LOGGER_NAME, "Processing request");
    return process();
});
```

### println/System.out

```java
// DON'T - not structured, not captured
System.out.println("Debug: " + value);

// DO - use logger
log.debug("Processing value: {}", value);
```

### Excessive Logging

```java
// DON'T - log in tight loops
for (Product p : products) {
    log.info("Processing product: {}", p.sku());  // 1000s of logs
}

// DO - log summary
log.info("Processing {} products", products.size());
```

### Logging Entire Objects

```java
// DON'T - may contain sensitive data, excessive size
log.info("Request: {}", request);
log.info("Response: {}", response);

// DO - log specific fields
log.info("Request for SKU {} from store {}", request.sku(), request.storeNumber());
```

### Missing Error Context

```java
// DON'T - loses stack trace
.onErrorResume(e -> {
    log.error("Error occurred");  // Which error? Where?
    return Mono.empty();
});

// DO - include error details
.onErrorResume(e -> {
    log.error("Error fetching product {}: {}", sku, e.getMessage(), e);
    return Mono.empty();
});
```

### Inconsistent Logger Names

```java
// DON'T - different conventions
Logger log1 = LoggerFactory.getLogger(ProductService.class);
Logger log2 = LoggerFactory.getLogger("PRODUCT_SERVICE");
Logger log3 = LoggerFactory.getLogger("product.service");

// DO - consistent pattern
private static final String LOGGER_NAME = "productservice";
structuredLogger.logMessage(ctx, LOGGER_NAME, message);
```

## Reference

- `libs/platform/platform-logging/StructuredLogger.java` - Core logging utility
- `libs/platform/platform-logging/WebClientLoggingFilter.java` - HTTP logging
- `apps/product-service/src/.../config/ProductServiceConfig.java` - WebClient setup
