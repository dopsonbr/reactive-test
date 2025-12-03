# Platform Resilience

Resilience4j reactive wrappers providing unified resilience patterns.

## Features

- Unified decorator applying all resilience patterns
- Correct decorator order: timeout → circuit breaker → retry → bulkhead
- Configuration via Spring Boot application.yml
- Auto-configuration of Resilience4j registries

## Usage

### Inject ReactiveResilience

```java
@Repository
public class ExternalRepository {
    private final WebClient webClient;
    private final ReactiveResilience resilience;

    public ExternalRepository(
            WebClient webClient,
            ReactiveResilience resilience) {
        this.webClient = webClient;
        this.resilience = resilience;
    }
}
```

### Decorate External Calls

```java
public Mono<Response> fetchData(String id) {
    return resilience.decorate("service-name",
        webClient.get()
            .uri("/api/{id}", id)
            .retrieve()
            .bodyToMono(Response.class)
    );
}
```

### With Fallback

```java
private static final Response FALLBACK = new Response("Unavailable", null);

public Mono<Response> fetchData(String id) {
    return resilience.decorate("service-name",
        webClient.get()
            .uri("/api/{id}", id)
            .retrieve()
            .bodyToMono(Response.class)
    )
    .onErrorReturn(FALLBACK);
}
```

## Decorator Order

Decorators are applied in this order (innermost to outermost):

```
bulkhead → retry → circuit-breaker → TIMEOUT → actual call
```

This means:
1. Timeout applies first to the actual call
2. Circuit breaker sees timeout failures
3. Retry retries on circuit breaker failures
4. Bulkhead limits concurrent retries

## Configuration

### application.yml

```yaml
resilience4j:
  # Circuit Breaker
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
      service-name:
        base-config: default

  # Retry
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
        ignore-exceptions:
          - WebClientResponseException$BadRequest
    instances:
      service-name:
        base-config: default

  # Timeout
  timelimiter:
    configs:
      default:
        timeout-duration: 2s
        cancel-running-future: true
    instances:
      service-name:
        base-config: default

  # Bulkhead
  bulkhead:
    configs:
      default:
        max-concurrent-calls: 25
        max-wait-duration: 0s
    instances:
      service-name:
        base-config: default
```

## Classes

| Class | Purpose |
|-------|---------|
| `ReactiveResilience` | Main decorator service |

## Dependencies

- `resilience4j-spring-boot3` - Spring Boot integration
- `resilience4j-reactor` - Project Reactor support
- `resilience4j-micrometer` - Metrics integration
