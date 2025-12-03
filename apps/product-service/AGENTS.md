# Product Service Agent Guidelines

This is the reference implementation for reactive platform patterns. Other services should follow patterns established here.

## Key Files

| File | Purpose |
|------|---------|
| `ProductController.java` | REST endpoint with validation and context propagation |
| `ProductService.java` | Orchestrates parallel calls to repositories |
| `MerchandiseRepository.java` | Cache-aside pattern example |
| `InventoryRepository.java` | Fallback-only caching example |
| `ProductRequestValidator.java` | Request validation with error aggregation |
| `SecurityConfig.java` | OAuth2 resource server configuration |
| `OAuth2ClientConfig.java` | Client credentials for downstream calls |
| `application.yml` | Resilience4j and cache configuration |
| `ArchitectureTest.java` | ArchUnit enforcement of layered architecture |

## Common Tasks

### Add a New External Service Call

1. Create package: `repository/{service-name}/`
2. Add request/response records:
   ```java
   public record NewServiceRequest(String id) {}
   public record NewServiceResponse(String data) {}
   ```
3. Create repository with resilience pattern:
   ```java
   @Repository
   public class NewServiceRepository {
       private static final NewServiceResponse FALLBACK =
           new NewServiceResponse("Unavailable");

       private final WebClient webClient;
       private final ReactiveResilience resilience;
       private final ReactiveCacheService cache;

       public Mono<NewServiceResponse> fetch(String id) {
           return cache.get(cacheKey(id), NewServiceResponse.class)
               .switchIfEmpty(
                   resilience.decorate("new-service",
                       webClient.get()
                           .uri("/api/{id}", id)
                           .retrieve()
                           .bodyToMono(NewServiceResponse.class)
                   )
                   .doOnNext(resp -> cache.put(cacheKey(id), resp, Duration.ofMinutes(5)))
               )
               .onErrorReturn(FALLBACK);
       }
   }
   ```
4. Add resilience4j config in `application.yml`:
   ```yaml
   resilience4j:
     circuitbreaker:
       instances:
         new-service:
           base-config: default
     retry:
       instances:
         new-service:
           base-config: default
     timelimiter:
       instances:
         new-service:
           base-config: default
     bulkhead:
       instances:
         new-service:
           base-config: default
   ```
5. Add WireMock stubs in tests

### Add a New Endpoint

1. Add request validation if needed in `ProductRequestValidator`
2. Add service method in `ProductService`
3. Add controller method in `ProductController`:
   ```java
   @GetMapping("/new-endpoint")
   public Mono<Response> newEndpoint(
           @RequestHeader HttpHeaders headers,
           @PathVariable long id) {
       return validator.validate(id, headers)
           .then(Mono.defer(() -> service.processNewEndpoint(id)))
           .contextWrite(ContextKeys.fromHeaders(headers));
   }
   ```
4. Add integration test

### Debug a Circuit Breaker Issue

1. Check circuit breaker state:
   ```http
   GET /actuator/health
   ```
   Look for `circuitBreakers` section

2. Check metrics:
   ```http
   GET /actuator/prometheus | grep circuitbreaker
   ```

3. Check logs for circuit breaker state transitions

4. Verify resilience4j config matches expected behavior

### Modify Caching Strategy

**Cache-aside** (default - check cache first):
- Used for: merchandise, price
- Modify TTL in `application.yml` under `cache.{service}.ttl`

**Fallback-only** (call first, cache on error):
- Used for: inventory
- Pattern in repository switches order of cache check vs HTTP call

## Patterns in This Service

### Parallel External Calls

```java
Mono.zip(
    merchandiseRepo.getMerchandise(sku),
    priceRepo.getPrice(sku, storeNumber),
    inventoryRepo.getInventory(sku, storeNumber)
)
.map(tuple -> new Product(
    sku,
    tuple.getT1().description(),
    tuple.getT2().price(),
    tuple.getT3().quantity()
));
```

### Context Propagation

Headers → Controller → contextWrite → Available in all downstream code via deferContextual

### Fallback Response

Every repository has a static `FALLBACK` constant returned when:
- Circuit breaker is open
- All retries exhausted
- Timeout exceeded

## Anti-patterns to Avoid

- Calling repositories directly from controller
- Using MDC instead of Reactor Context
- Missing fallback responses
- Hardcoding service URLs
- Skipping validation
- Not using `@DynamicPropertySource` in tests

## Test Files

| File | Purpose |
|------|---------|
| `ProductServiceApplicationTest.java` | Context load test |
| `ProductServiceIntegrationTest.java` | Full integration with Redis + WireMock |
| `ArchitectureTest.java` | Layered architecture enforcement |

## Configuration Files

| File | Purpose |
|------|---------|
| `application.yml` | Main configuration |
| `build.gradle.kts` | Dependencies |
