# Bulkhead Standard

## Intent

Limit concurrent requests to external services to prevent resource exhaustion. Named after ship bulkheads that contain flooding to one compartment.

## Outcomes

- No single service can consume all threads/connections
- Graceful degradation under high load
- Protection against slow consumers
- Isolation between service dependencies

## Patterns

### Configuration Structure

```yaml
resilience4j:
  bulkhead:
    configs:
      default:
        max-concurrent-calls: 25
        max-wait-duration: 0s

    instances:
      merchandise-service:
        base-config: default
      price-service:
        base-config: default
      inventory-service:
        base-config: default
        max-concurrent-calls: 30  # Higher limit for critical service
```

### Configuration Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `max-concurrent-calls` | 25 | Maximum parallel calls allowed |
| `max-wait-duration` | 0s | Time to wait for a permit (0 = fail immediately) |

### Sizing Guidelines

| Service Type | Max Concurrent | Rationale |
|--------------|----------------|-----------|
| Critical (inventory, auth) | 25-30 | Higher priority, more resources |
| Standard (merchandise, price) | 25 | Balanced allocation |
| Low priority (analytics, logging) | 10-15 | Preserve resources for critical services |
| Slow services | 10-15 | Prevent blocking resources |

### Behavior Flow

```
Request arrives
       │
       ▼
Check bulkhead permits available?
       │
   ┌───┴───┐
   Yes     No
   │       │
   ▼       ▼
Acquire   max-wait-duration > 0?
permit         │
   │       ┌───┴───┐
   │       Yes     No
   │       │       │
   │       ▼       ▼
   │     Wait    REJECT
   │       │    (BulkheadFullException)
   │       │
   │    Permit available?
   │       │
   │   ┌───┴───┐
   │   Yes     No
   │   │       │
   └───┴───┐   ▼
           │  REJECT
           ▼
    Execute call
           │
           ▼
    Release permit
```

### Usage Pattern

```java
@Repository
class MerchandiseRepository {
    private static final String SERVICE_NAME = "merchandise-service";

    Mono<Merchandise> getMerchandise(long sku) {
        // Bulkhead is outermost decorator
        // Order: bulkhead → retry → circuit-breaker → timeout
        return resilience.decorate(SERVICE_NAME, fetchFromService(sku))
            .onErrorResume(this::handleError);
    }

    private Mono<Merchandise> handleError(Throwable error) {
        if (error instanceof BulkheadFullException) {
            log.warn("Bulkhead full for {}, rejecting request", SERVICE_NAME);
        }
        return Mono.just(FALLBACK);
    }
}
```

### Calculating Max Concurrent Calls

Consider:
1. **Pod count**: If running 4 pods, total concurrent = 25 × 4 = 100
2. **Downstream capacity**: Don't exceed what downstream can handle
3. **Local resources**: Connection pool size, file descriptors
4. **Response time**: Slower services need lower limits

Formula:
```
max_concurrent = min(
    downstream_service_capacity / pod_count,
    local_connection_pool_size,
    desired_throughput × avg_response_time
)
```

### Thread Pool Bulkhead (Alternative)

For blocking operations, use thread pool bulkhead:

```yaml
resilience4j:
  thread-pool-bulkhead:
    instances:
      blocking-service:
        max-thread-pool-size: 10
        core-thread-pool-size: 5
        queue-capacity: 100
        keep-alive-duration: 20ms
```

Use this only for legacy blocking code. Prefer semaphore bulkhead for reactive.

### Metrics

Key Prometheus metrics:
- `resilience4j_bulkhead_available_concurrent_calls` - Current available permits
- `resilience4j_bulkhead_max_allowed_concurrent_calls` - Configured maximum

## Anti-patterns

### No Bulkhead (Unbounded Concurrency)

```java
// DON'T - can exhaust all connections
Mono<Response> fetch() {
    return webClient.get()
        .retrieve()
        .bodyToMono(Response.class);
}

// DO - limit concurrency
Mono<Response> fetch() {
    return resilience.decorate("service",
        webClient.get()
            .retrieve()
            .bodyToMono(Response.class)
    );
}
```

### max-wait > 0 with Timeout

```yaml
# DON'T - double waiting
bulkhead:
  instances:
    service:
      max-wait-duration: 5s  # Waits here

timelimiter:
  instances:
    service:
      timeout-duration: 2s  # And here

# Total wait could be 7s!

# DO - fail fast at bulkhead
bulkhead:
  instances:
    service:
      max-wait-duration: 0s  # Immediate rejection
```

### Same Limit for All Services

```yaml
# DON'T - no prioritization
bulkhead:
  configs:
    default:
      max-concurrent-calls: 25
  instances:
    critical-auth-service:
      base-config: default
    low-priority-analytics:
      base-config: default

# DO - prioritize critical services
bulkhead:
  instances:
    critical-auth-service:
      max-concurrent-calls: 30
    low-priority-analytics:
      max-concurrent-calls: 10
```

### Bulkhead Too Small

```yaml
# DON'T - rejects requests under normal load
max-concurrent-calls: 2  # Almost always full

# DO - size for peak load with headroom
max-concurrent-calls: 25  # Handles bursts
```

### Bulkhead Too Large

```yaml
# DON'T - defeats the purpose
max-concurrent-calls: 10000  # No protection

# DO - balance protection vs throughput
max-concurrent-calls: 25
```

### Ignoring BulkheadFullException

```java
// DON'T - silent rejection
.onErrorResume(e -> Mono.just(FALLBACK));

// DO - log and potentially alert
.onErrorResume(e -> {
    if (e instanceof BulkheadFullException) {
        log.warn("Bulkhead full for {}, returning fallback", SERVICE_NAME);
        metrics.counter("bulkhead.rejected", "service", SERVICE_NAME).increment();
    }
    return Mono.just(FALLBACK);
});
```

### Not Releasing Permits on Error

```java
// DON'T - manual bulkhead without cleanup
Mono<Response> fetch() {
    return bulkhead.acquirePermission()
        .then(webClient.get().retrieve().bodyToMono(Response.class));
    // Permit never released on error!
}

// DO - use ReactiveResilience wrapper (handles cleanup)
Mono<Response> fetch() {
    return resilience.decorate("service",
        webClient.get().retrieve().bodyToMono(Response.class)
    );
}
```

## Reference

- `apps/product-service/src/main/resources/application.yml` - Configuration
- `libs/platform/platform-resilience/` - ReactiveResilience wrapper
