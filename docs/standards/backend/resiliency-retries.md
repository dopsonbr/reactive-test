# Retry Standard

## Intent

Recover from transient failures without burdening the system. Many failures are temporary (network blips, brief overloads) and succeed on retry.

## Outcomes

- Transient network errors don't cause request failures
- Exponential backoff prevents thundering herd
- Non-retryable errors fail fast
- Clear distinction between retryable and terminal failures

## Patterns

### Configuration Structure

```yaml
resilience4j:
  retry:
    configs:
      default:
        max-attempts: 3
        wait-duration: 100ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
        retry-exceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
          - org.springframework.web.reactive.function.client.WebClientResponseException$ServiceUnavailable
          - org.springframework.web.reactive.function.client.WebClientResponseException$GatewayTimeout
        ignore-exceptions:
          - org.springframework.web.reactive.function.client.WebClientResponseException$BadRequest
          - org.springframework.web.reactive.function.client.WebClientResponseException$NotFound
          - org.springframework.web.reactive.function.client.WebClientResponseException$Unauthorized
          - org.springframework.web.reactive.function.client.WebClientResponseException$Forbidden

    instances:
      merchandise-service:
        base-config: default
      price-service:
        base-config: default
        max-attempts: 2  # Override for specific service
```

### Retry Timing (Exponential Backoff)

```
Attempt 1: immediate
Attempt 2: 100ms delay
Attempt 3: 200ms delay (100ms × 2)
Attempt 4: 400ms delay (200ms × 2) [if max-attempts: 4]
```

Total maximum delay: ~300ms + call time (for 3 attempts)

### Retryable vs Non-Retryable

| Retryable (retry-exceptions) | Non-Retryable (ignore-exceptions) |
|------------------------------|-----------------------------------|
| 503 Service Unavailable | 400 Bad Request |
| 504 Gateway Timeout | 404 Not Found |
| 502 Bad Gateway | 401 Unauthorized |
| IOException | 403 Forbidden |
| TimeoutException | 422 Unprocessable Entity |
| ConnectException | ValidationException |
| SocketException | BusinessException |

### Usage Pattern

Retry is typically combined with circuit breaker:

```java
@Repository
class MerchandiseRepository {
    private static final String SERVICE_NAME = "merchandise-service";

    Mono<Merchandise> getMerchandise(long sku) {
        // Resilience decorators apply: retry → circuit-breaker → timeout
        return resilience.decorate(SERVICE_NAME, fetchFromService(sku))
            .onErrorResume(this::handleError);
    }
}
```

### Configuration Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `max-attempts` | 3 | Total attempts including initial call |
| `wait-duration` | 100ms | Initial delay between retries |
| `enable-exponential-backoff` | true | Increase delay exponentially |
| `exponential-backoff-multiplier` | 2 | Multiply delay by this factor |
| `retry-exceptions` | [] | Exceptions that trigger retry |
| `ignore-exceptions` | [] | Exceptions that should NOT retry |

### Retry Decision Tree

```
Exception occurs
       │
       ▼
Is it in ignore-exceptions?
       │
   ┌───┴───┐
   Yes     No
   │       │
   ▼       ▼
 FAIL   Is it in retry-exceptions?
         │
     ┌───┴───┐
     Yes     No
     │       │
     ▼       ▼
   RETRY   FAIL (default: don't retry unknown exceptions)
```

### Jitter (Optional)

Add randomness to prevent synchronized retries:

```yaml
resilience4j:
  retry:
    instances:
      service:
        enable-randomized-wait: true
        randomized-wait-factor: 0.5  # ±50% of wait duration
```

This spreads out retries when multiple instances fail simultaneously.

## Anti-patterns

### Retrying on 4xx Errors

```yaml
# DON'T - wastes resources, will never succeed
retry-exceptions:
  - WebClientResponseException$BadRequest
  - WebClientResponseException$NotFound

# DO - only retry transient errors
retry-exceptions:
  - WebClientResponseException$ServiceUnavailable
  - WebClientResponseException$GatewayTimeout
```

### Linear Backoff

```yaml
# DON'T - can overload recovering service
enable-exponential-backoff: false
wait-duration: 100ms
# All retries hit at 100ms intervals

# DO - exponential backoff spreads load
enable-exponential-backoff: true
exponential-backoff-multiplier: 2
```

### Too Many Retries

```yaml
# DON'T - delays user response significantly
max-attempts: 10
wait-duration: 500ms
# Total delay: 500 + 1000 + 2000 + 4000 + 8000 + ... = very long

# DO - balance reliability vs latency
max-attempts: 3
wait-duration: 100ms
# Total delay: 100 + 200 = 300ms max
```

### Retrying Without Circuit Breaker

```java
// DON'T - keeps retrying even when service is down
Mono<Response> fetch() {
    return webClient.get()
        .retrieve()
        .bodyToMono(Response.class)
        .retryWhen(Retry.backoff(10, Duration.ofMillis(100)));
}

// DO - circuit breaker stops retries when service is down
Mono<Response> fetch() {
    return resilience.decorate("service",
        webClient.get()
            .retrieve()
            .bodyToMono(Response.class)
    );
}
```

### Retrying Non-Idempotent Operations

```java
// DON'T - retry may cause duplicate orders
Mono<Order> createOrder(OrderRequest request) {
    return resilience.decorate("order-service",
        webClient.post()
            .bodyValue(request)
            .retrieve()
            .bodyToMono(Order.class)
    );
}

// DO - use idempotency key or don't retry mutations
Mono<Order> createOrder(OrderRequest request, String idempotencyKey) {
    return webClient.post()
        .header("Idempotency-Key", idempotencyKey)
        .bodyValue(request)
        .retrieve()
        .bodyToMono(Order.class);
    // Or: don't apply retry to POST requests
}
```

### Hiding Retry Status

```java
// DON'T - no visibility into retries
.onErrorResume(e -> Mono.just(FALLBACK));

// DO - log retry attempts
.doOnError(e -> log.warn("Attempt failed for {}: {}", SERVICE_NAME, e.getMessage()))
.onErrorResume(e -> {
    log.error("All retries exhausted for {}", SERVICE_NAME);
    return Mono.just(FALLBACK);
});
```

## Reference

- `apps/product-service/src/main/resources/application.yml` - Configuration
- `libs/platform/platform-resilience/` - ReactiveResilience wrapper
