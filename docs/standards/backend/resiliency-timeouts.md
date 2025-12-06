# Timeout Standard

## Intent

Fail fast when external services are slow to prevent thread/connection blocking and ensure predictable response times.

## Outcomes

- Predictable response times for clients
- No hung requests consuming resources
- Resources freed for other requests
- Clear SLA boundaries

## Patterns

### Configuration Structure

```yaml
resilience4j:
  timelimiter:
    configs:
      default:
        timeout-duration: 2s
        cancel-running-future: true

    instances:
      merchandise-service:
        base-config: default
      price-service:
        base-config: default
      inventory-service:
        base-config: default
        timeout-duration: 1s  # Inventory should be fast
```

### Configuration Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `timeout-duration` | 2s | Maximum time to wait for response |
| `cancel-running-future` | true | Cancel the underlying future on timeout |

### Timeout Guidelines

| Operation Type | Timeout | Rationale |
|----------------|---------|-----------|
| Cache lookup (Redis) | 100-200ms | Should be fast; fail to origin on timeout |
| Internal microservice | 1-2s | Within same datacenter |
| External API | 2-5s | Network latency variability |
| Slow/batch API | 5-10s | Known slow operations |
| Background job | 30s-60s | Non-blocking, can be slower |
| File upload/download | 30s-120s | Large payload transfer |

### Decorator Order

Timeout is the innermost decorator (closest to the actual call):

```
Request → Bulkhead → Retry → Circuit Breaker → TIMEOUT → HTTP Call
                                                  ↑
                                          (innermost)
```

Why innermost?
- Each retry gets its own timeout
- Circuit breaker sees timeout failures
- Bulkhead permit is held for timeout duration

### Usage Pattern

```java
@Repository
class MerchandiseRepository {
    private static final String SERVICE_NAME = "merchandise-service";

    Mono<Merchandise> getMerchandise(long sku) {
        // Timeout is applied innermost by ReactiveResilience
        return resilience.decorate(SERVICE_NAME, fetchFromService(sku))
            .onErrorResume(this::handleError);
    }

    private Mono<Merchandise> handleError(Throwable error) {
        if (error instanceof TimeoutException) {
            log.warn("Timeout calling {}", SERVICE_NAME);
        }
        return Mono.just(FALLBACK);
    }
}
```

### Timeout vs Connect Timeout vs Read Timeout

```yaml
# Resilience4j TimeLimiter - overall operation timeout
resilience4j.timelimiter.instances.service:
  timeout-duration: 2s  # Total time for entire operation

# WebClient - low-level HTTP timeouts
spring.webflux.client:
  connect-timeout: 1s   # Time to establish connection
  read-timeout: 5s      # Time to read response body
```

Relationship:
```
├─ Connect Timeout (1s)
│   └─ Time to establish TCP connection
│
├─ Read Timeout (5s)
│   └─ Time to receive response after connection
│
└─ TimeLimiter (2s)
    └─ Overall operation time (should be ≤ connect + read)
```

### Calculating Timeouts

Consider the full request path:

```
Client Request
    │
    ▼ (2s budget)
┌─────────────────────────────────────────┐
│ Your Service                            │
│                                         │
│   ├─ Validation: ~10ms                  │
│   │                                     │
│   ├─ Service A call (timeout: 500ms)    │
│   │   └─ With 2 retries: max 900ms      │
│   │                                     │
│   ├─ Service B call (timeout: 500ms)    │
│   │   └─ With 2 retries: max 900ms      │
│   │                                     │
│   └─ Aggregation: ~10ms                 │
│                                         │
│   Total if sequential: ~1.8s            │
│   Total if parallel: ~900ms             │
└─────────────────────────────────────────┘
    │
    ▼
Client Response
```

### Parallel Calls

When making parallel calls, timeout applies to each independently:

```java
Mono<Product> getProduct(long sku) {
    return Mono.zip(
        // Each has its own 500ms timeout + retries
        resilience.decorate("merchandise", getMerchandise(sku)),
        resilience.decorate("price", getPrice(sku)),
        resilience.decorate("inventory", getInventory(sku))
    ).map(this::aggregate);
    // Total time ≈ max(merchandise, price, inventory) ≈ 500ms + retry delays
}
```

### Timeout Metrics

Key Prometheus metrics:
- `resilience4j_timelimiter_calls_total{kind="successful"}` - Completed in time
- `resilience4j_timelimiter_calls_total{kind="timeout"}` - Timed out
- `resilience4j_timelimiter_calls_total{kind="failed"}` - Failed for other reasons

## Anti-patterns

### No Timeout

```java
// DON'T - infinite wait possible
Mono<Response> fetch() {
    return webClient.get()
        .retrieve()
        .bodyToMono(Response.class);
}

// DO - always set timeout
Mono<Response> fetch() {
    return resilience.decorate("service",
        webClient.get()
            .retrieve()
            .bodyToMono(Response.class)
    );
}
```

### Timeout > Total Retry Time

```yaml
# DON'T - retry never completes before timeout
timelimiter:
  instances:
    service:
      timeout-duration: 10s

retry:
  instances:
    service:
      max-attempts: 3
      wait-duration: 100ms
      # Max retry time: ~300ms, but timeout is 10s

# DO - timeout allows for retries but has reasonable upper bound
timelimiter:
  instances:
    service:
      timeout-duration: 2s  # Allows 3 attempts with backoff
```

### Same Timeout for Cache and HTTP

```yaml
# DON'T - cache should be faster
timelimiter:
  instances:
    redis-cache:
      timeout-duration: 2s
    external-service:
      timeout-duration: 2s

# DO - cache timeout should be aggressive
timelimiter:
  instances:
    redis-cache:
      timeout-duration: 100ms  # Fast fail to origin
    external-service:
      timeout-duration: 2s
```

### Timeout Without Fallback

```java
// DON'T - timeout propagates as 504
Mono<Product> get(long sku) {
    return resilience.decorate("service", fetch(sku));
}

// DO - provide fallback on timeout
Mono<Product> get(long sku) {
    return resilience.decorate("service", fetch(sku))
        .onErrorResume(TimeoutException.class, e -> {
            log.warn("Timeout getting product {}", sku);
            return Mono.just(FALLBACK);
        });
}
```

### Hiding Timeout Cause

```java
// DON'T - generic error logging
.onErrorResume(e -> {
    log.error("Error", e);
    return Mono.just(FALLBACK);
});

// DO - distinguish timeout from other errors
.onErrorResume(e -> {
    if (e instanceof TimeoutException) {
        log.warn("Request timed out for {} after {}ms", SERVICE_NAME, TIMEOUT_MS);
    } else {
        log.error("Error calling {}: {}", SERVICE_NAME, e.getMessage());
    }
    return Mono.just(FALLBACK);
});
```

### Not Canceling on Timeout

```yaml
# DON'T - continues processing after timeout
timelimiter:
  instances:
    service:
      cancel-running-future: false  # Wastes resources

# DO - cancel to free resources
timelimiter:
  instances:
    service:
      cancel-running-future: true
```

### Client Timeout < Service Timeout

```
# DON'T - client gives up before service
Client timeout: 1s
Service timeout: 5s
# Client abandons, but service keeps processing

# DO - service timeout < client timeout
Client timeout: 5s
Service timeout: 2s
# Service fails fast, client gets response
```

## Reference

- `apps/product-service/src/main/resources/application.yml` - Configuration
- `libs/platform/platform-resilience/ReactiveResilience.java` - Implementation
