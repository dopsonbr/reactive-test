# Tracing Standard

## Intent

Track request flow across services for debugging distributed systems and understanding latency breakdown.

## Outcomes

- End-to-end request visibility
- Latency breakdown by service/operation
- Error correlation across services
- Performance bottleneck identification

## Patterns

### Trace Concepts

```
Trace (entire request journey)
├── Span A: product-service /products/{sku}
│   ├── Span B: merchandise-repository GET /merchandise/{sku}
│   ├── Span C: price-repository GET /price/{sku}
│   └── Span D: inventory-repository GET /inventory/{sku}
```

- **Trace**: Complete request journey across all services
- **Span**: Single operation within a trace
- **Trace ID**: Unique identifier for the entire trace
- **Span ID**: Unique identifier for a single span
- **Parent Span ID**: Links child spans to their parent

### Trace Propagation

Trace context flows via W3C standard HTTP headers:

```
traceparent: 00-{trace-id}-{span-id}-{flags}
tracestate: {vendor-specific data}

Example:
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
```

### Configuration

```yaml
management:
  tracing:
    enabled: true
    sampling:
      probability: 1.0  # 100% in dev/staging, lower in production

  otlp:
    tracing:
      endpoint: http://tempo:4318/v1/traces

spring:
  application:
    name: product-service  # Used as service name in traces
```

### Sampling Rates

| Environment | Sampling | Rationale |
|-------------|----------|-----------|
| Development | 100% | Debug everything |
| Staging | 100% | Full visibility |
| Production | 1-10% | Balance visibility vs cost |

Production sampling strategies:
- **Rate-based**: Sample 1% of all requests
- **Error-based**: Always sample errors (100%)
- **Head-based**: Decide at request start
- **Tail-based**: Decide after seeing full trace

```yaml
# Production with error sampling
management:
  tracing:
    sampling:
      probability: 0.01  # 1% of normal requests
```

### Span Naming

| Span Type | Naming Pattern | Example |
|-----------|----------------|---------|
| HTTP server | `{method} {path}` | `GET /products/{sku}` |
| HTTP client | `HTTP {method}` | `HTTP GET` |
| Database | `{operation} {table}` | `SELECT products` |
| Cache | `cache {operation}` | `cache get` |
| Custom | `{component}.{operation}` | `product.aggregate` |

### WebClient Tracing

WebClient automatically propagates trace headers when using Spring Boot's auto-configuration:

```java
@Bean
WebClient.Builder webClientBuilder() {
    return WebClient.builder();  // Auto-instrumented
}

// Trace headers are automatically added to outbound requests
webClient.get()
    .uri("/external-service")
    .retrieve()  // traceparent header added automatically
    .bodyToMono(Response.class);
```

### Custom Spans

Create custom spans for significant operations:

```java
@Component
class ProductService {
    private final Tracer tracer;

    Mono<Product> aggregateProduct(long sku) {
        return Mono.defer(() -> {
            Span span = tracer.nextSpan()
                .name("product.aggregate")
                .tag("sku", String.valueOf(sku))
                .start();

            return doAggregation(sku)
                .doOnSuccess(p -> span.end())
                .doOnError(e -> {
                    span.tag("error", e.getMessage());
                    span.end();
                });
        });
    }
}
```

### Span Tags (Attributes)

Add contextual information to spans:

| Tag | Example | Purpose |
|-----|---------|---------|
| `http.method` | `GET` | HTTP method |
| `http.url` | `/products/123` | Request URL |
| `http.status_code` | `200` | Response status |
| `sku` | `123456` | Business identifier |
| `store.number` | `1234` | Store context |
| `error` | `true` | Error indicator |
| `error.message` | `Timeout` | Error description |

```java
span.tag("sku", String.valueOf(sku))
    .tag("store.number", String.valueOf(storeNumber))
    .tag("cache.hit", String.valueOf(cacheHit));
```

### Trace Visualization

Traces can be viewed in:
- **Grafana Tempo**: Native trace exploration
- **Jaeger**: Open-source tracing UI
- **Zipkin**: Alternative tracing backend

Query traces by:
- Service name
- Trace ID
- Span name
- Tags/attributes
- Duration
- Error status

### Correlation with Logs

Include trace ID in logs for correlation:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "logger": "productservice",
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "spanId": "b7ad6b7169203331",
  "message": "Processing request"
}
```

In Grafana: Click trace ID in logs → Jump to trace view

## Anti-patterns

### 100% Sampling in Production

```yaml
# DON'T - too much data, high cost
management:
  tracing:
    sampling:
      probability: 1.0  # 100% in production

# DO - sample appropriately
management:
  tracing:
    sampling:
      probability: 0.01  # 1% in production
```

### Not Propagating Context to External Calls

```java
// DON'T - trace context lost
HttpClient client = HttpClient.newHttpClient();
client.send(request, ...);  // No trace headers

// DO - use instrumented WebClient
webClient.get()
    .uri("/external-service")
    .retrieve()  // Trace headers propagated
    .bodyToMono(Response.class);
```

### Missing Span Names

```java
// DON'T - unnamed spans are hard to understand
Span span = tracer.nextSpan().start();

// DO - name spans meaningfully
Span span = tracer.nextSpan()
    .name("product.fetchMerchandise")
    .start();
```

### Too Many Custom Spans

```java
// DON'T - span per small operation
for (Product p : products) {
    Span span = tracer.nextSpan().name("process.product").start();
    process(p);
    span.end();  // Creates thousands of spans!
}

// DO - span for significant operations
Span span = tracer.nextSpan()
    .name("process.products")
    .tag("count", String.valueOf(products.size()))
    .start();
for (Product p : products) {
    process(p);
}
span.end();
```

### High-Cardinality Span Tags

```java
// DON'T - creates indexing problems
span.tag("user.id", userId);        // Millions of values
span.tag("request.body", body);     // Huge, unique values

// DO - bounded cardinality
span.tag("user.type", "premium");   // Few distinct values
span.tag("request.size", "large");  // Categorized
```

### Not Recording Errors in Spans

```java
// DON'T - error not visible in trace
.doOnError(e -> span.end());

// DO - tag errors for visibility
.doOnError(e -> {
    span.tag("error", "true");
    span.tag("error.message", e.getMessage());
    span.end();
});
```

### Forgetting to End Spans

```java
// DON'T - span never ends (memory leak, incorrect timing)
Span span = tracer.nextSpan().name("operation").start();
return doOperation();  // Span not ended!

// DO - always end spans
Span span = tracer.nextSpan().name("operation").start();
return doOperation()
    .doFinally(signal -> span.end());
```

### Breaking Trace Context in Async Boundaries

```java
// DON'T - context lost across thread boundaries
CompletableFuture.runAsync(() -> {
    // No trace context here
    processAsync();
});

// DO - propagate context
Mono.fromCallable(() -> processAsync())
    .subscribeOn(Schedulers.boundedElastic());
// Reactor context automatically propagates
```

## Reference

- `docker/docker-compose.yml` - Tempo configuration
- `apps/product-service/src/main/resources/application.yml` - Tracing config
- Grafana Explore → Tempo for trace visualization
