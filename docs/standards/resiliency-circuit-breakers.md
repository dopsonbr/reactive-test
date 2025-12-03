# Circuit Breaker Standard

## Intent

Prevent cascading failures by stopping requests to failing services. When a downstream service is unhealthy, fail fast rather than waiting and consuming resources.

## Outcomes

- Failed services don't take down the entire system
- Fast failure when service is known to be down
- Automatic recovery when service recovers
- Observable state for monitoring and alerting

## Patterns

### State Machine

```
CLOSED ──[failure rate >= threshold]──► OPEN
   ▲                                      │
   │                                      │
   │                           [wait duration expires]
   │                                      │
   │                                      ▼
   └──[success rate >= threshold]── HALF_OPEN
                                          │
                                 [failure]│
                                          ▼
                                        OPEN
```

States:
- **CLOSED**: Normal operation, requests flow through
- **OPEN**: Circuit tripped, requests fail immediately (no downstream call)
- **HALF_OPEN**: Testing if service recovered, limited requests allowed

### Configuration Structure

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        register-health-indicator: true
        sliding-window-type: COUNT_BASED
        sliding-window-size: 10
        minimum-number-of-calls: 5
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
        permitted-number-of-calls-in-half-open-state: 3
        automatic-transition-from-open-to-half-open-enabled: true

    instances:
      merchandise-service:
        base-config: default
      price-service:
        base-config: default
        failure-rate-threshold: 60  # Override for specific service
```

### Configuration Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `sliding-window-type` | COUNT_BASED | COUNT_BASED or TIME_BASED |
| `sliding-window-size` | 10 | Number of calls (COUNT) or seconds (TIME) |
| `minimum-number-of-calls` | 5 | Min calls before calculating failure rate |
| `failure-rate-threshold` | 50 | Percentage that triggers OPEN state |
| `wait-duration-in-open-state` | 10s | Time before transitioning to HALF_OPEN |
| `permitted-number-of-calls-in-half-open-state` | 3 | Test calls in HALF_OPEN |

### Usage Pattern

```java
@Repository
class MerchandiseRepository {
    private static final String CIRCUIT_BREAKER_NAME = "merchandise-service";
    private static final Merchandise FALLBACK = new Merchandise("Unavailable", null);

    private final WebClient webClient;
    private final ReactiveResilience resilience;

    Mono<Merchandise> getMerchandise(long sku) {
        return resilience.decorate(
            CIRCUIT_BREAKER_NAME,
            fetchFromService(sku)
        ).onErrorResume(this::handleError);
    }

    private Mono<Merchandise> handleError(Throwable error) {
        // Log circuit breaker state
        if (error instanceof CallNotPermittedException) {
            log.warn("Circuit breaker OPEN for {}", CIRCUIT_BREAKER_NAME);
        }
        return Mono.just(FALLBACK);
    }
}
```

### Fallback Response

Every repository MUST define a static fallback:

```java
// Fallback for product data
private static final Merchandise FALLBACK = new Merchandise(
    "Product information temporarily unavailable",
    null,
    0
);

// Fallback for inventory (safety: assume unavailable)
private static final Inventory FALLBACK = new Inventory(0, false);

// Fallback for price
private static final Price FALLBACK = new Price("N/A", null);
```

### Naming Convention

Circuit breaker names should match the external service:

| External Service | Circuit Breaker Name |
|------------------|---------------------|
| Merchandise API | `merchandise-service` |
| Price API | `price-service` |
| Inventory API | `inventory-service` |

### Health Indicator

Circuit breakers register as Spring Boot health indicators:

```json
{
  "status": "UP",
  "components": {
    "circuitBreakers": {
      "status": "UP",
      "details": {
        "merchandise-service": {
          "status": "UP",
          "details": {
            "state": "CLOSED",
            "failureRate": "-1%",
            "slowCallRate": "-1%"
          }
        }
      }
    }
  }
}
```

### Monitoring Metrics

Key Prometheus metrics:
- `resilience4j_circuitbreaker_state` - Current state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
- `resilience4j_circuitbreaker_calls_total` - Call counts by outcome
- `resilience4j_circuitbreaker_failure_rate` - Current failure rate

## Anti-patterns

### No Fallback Response

```java
// DON'T - errors propagate to user
Mono<Merchandise> get(long sku) {
    return resilience.decorate("service", fetch(sku));
    // No onErrorResume = 503 to client
}

// DO - always provide fallback
Mono<Merchandise> get(long sku) {
    return resilience.decorate("service", fetch(sku))
        .onErrorResume(e -> Mono.just(FALLBACK));
}
```

### Circuit Breaker Without Timeout

```java
// DON'T - calls can hang forever
resilience.decorate("service", slowCall());

// DO - always combine with timeout
resilience.decorateWithTimeout("service", call(), Duration.ofSeconds(2));
```

### Same Name for Different Services

```java
// DON'T - shared circuit breaker
resilience.decorate("external-service", merchandiseCall());
resilience.decorate("external-service", priceCall());
// If merchandise fails, price circuit also opens!

// DO - separate circuit breakers
resilience.decorate("merchandise-service", merchandiseCall());
resilience.decorate("price-service", priceCall());
```

### Ignoring Circuit Breaker State in Logs

```java
// DON'T - generic error logging
.onErrorResume(e -> {
    log.error("Error", e);
    return Mono.just(FALLBACK);
});

// DO - log circuit breaker state
.onErrorResume(e -> {
    if (e instanceof CallNotPermittedException) {
        log.warn("Circuit OPEN for {}, returning fallback", SERVICE_NAME);
    } else {
        log.error("Error calling {}: {}", SERVICE_NAME, e.getMessage());
    }
    return Mono.just(FALLBACK);
});
```

### Too Aggressive Settings

```yaml
# DON'T - opens too quickly
failure-rate-threshold: 10  # Opens after 1 failure in 10
minimum-number-of-calls: 1

# DO - allow for transient errors
failure-rate-threshold: 50
minimum-number-of-calls: 5
```

### Too Conservative Settings

```yaml
# DON'T - takes too long to protect
sliding-window-size: 100
minimum-number-of-calls: 50
wait-duration-in-open-state: 60s

# DO - balance protection and recovery
sliding-window-size: 10
minimum-number-of-calls: 5
wait-duration-in-open-state: 10s
```

## Reference

- `apps/product-service/src/main/resources/application.yml` - Configuration
- `apps/product-service/src/.../repository/` - Usage patterns
- `libs/platform/platform-resilience/` - ReactiveResilience wrapper
