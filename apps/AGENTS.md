# Applications Agent Guidelines

This document provides guidance for AI agents working with applications in this directory.

## Key Patterns

### Application Structure

All applications follow the same package structure:

```
org.example.{app}/
├── {App}Application.java      # Entry point with @SpringBootApplication
├── controller/                # REST endpoints
├── service/                   # Business logic
├── repository/{external}/     # External service clients
├── domain/                    # Pure data models (records)
├── config/                    # Configuration classes
├── validation/                # Request validators
└── security/                  # Security config
```

### Adding a New Endpoint

1. Create request/response records in `domain/` or `controller/`
2. Add validation logic in `validation/` package
3. Implement service method in `service/` package
4. Add controller method with validation call
5. Add integration test

### Adding an External Service Call

1. Create package: `repository/{service-name}/`
2. Add request/response records in that package
3. Create repository class with:
   - WebClient injection
   - Resilience decorators (circuit breaker, retry, timeout)
   - Caching (cache-aside or fallback-only)
   - Static FALLBACK constant
4. Add WireMock stubs in tests

### Resilience Pattern

Every repository must use `ReactiveResilience`:

```java
@Repository
public class ExternalRepository {
    private static final ExternalResponse FALLBACK =
        new ExternalResponse("Unavailable", null);

    private final WebClient webClient;
    private final ReactiveResilience resilience;
    private final ReactiveCacheService cache;

    public Mono<ExternalResponse> fetch(String id) {
        return cache.get(cacheKey(id), ExternalResponse.class)
            .switchIfEmpty(
                resilience.decorate("external-service",
                    webClient.get().uri("/api/{id}", id)
                        .retrieve()
                        .bodyToMono(ExternalResponse.class)
                )
                .doOnNext(resp -> cache.put(cacheKey(id), resp, ttl))
            )
            .onErrorReturn(FALLBACK);
    }
}
```

### Caching Patterns

- **Cache-aside**: For static/slow-changing data (merchandise, pricing)
- **Fallback-only**: For real-time data (inventory)

### Testing Pattern

Use Testcontainers for Redis and WireMock for HTTP:

```java
@SpringBootTest
@Testcontainers
class IntegrationTest {
    @Container
    static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

    @RegisterExtension
    static WireMockExtension wiremock = WireMockExtension.newInstance()
        .options(wireMockConfig().port(8082))
        .build();
}
```

## Common Tasks

### Fix a Failing Service Call

1. Check circuit breaker state in logs
2. Verify WireMock stubs match expected requests
3. Check resilience4j config in `application.yml`
4. Verify timeout settings are reasonable

### Add Request Validation

1. Add validation method to existing validator or create new one
2. Call validator in controller before service call
3. Validator returns `Mono<Void>` on success, `Mono.error(ValidationException)` on failure

### Debug Context Propagation

1. Check headers are being passed in request
2. Verify `contextWrite()` is used in controller
3. Use `deferContextual()` to access context in downstream code
4. Never use MDC - use Reactor Context instead

## Anti-patterns

- Calling repository directly from controller (use service layer)
- Using MDC for context propagation (not reactive-safe)
- Missing fallback response in repository
- Hardcoding external service URLs (use configuration)
- Skipping validation in controller
- Not using `@DynamicPropertySource` in tests with Testcontainers

## Reference Applications

- **product-service**: Full reference implementation with all patterns
- **cart-service**: Simpler example focused on Redis persistence

## File Locations

| Purpose | Location |
|---------|----------|
| Application entry | `src/main/java/.../Application.java` |
| REST controllers | `src/main/java/.../controller/` |
| Business logic | `src/main/java/.../service/` |
| External clients | `src/main/java/.../repository/` |
| Configuration | `src/main/resources/application.yml` |
| Integration tests | `src/test/java/.../*IntegrationTest.java` |
| Architecture tests | `src/test/java/.../ArchitectureTest.java` |
