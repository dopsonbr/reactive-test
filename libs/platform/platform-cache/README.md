# Platform Cache

Non-blocking Redis cache abstraction with reactive API.

## Features

- Reactive cache operations (non-blocking)
- Interface-based design for testability
- JSON serialization via Jackson
- Configurable TTL per entry
- Cache key generation utilities

## Usage

### Inject ReactiveCacheService

```java
@Repository
public class ExternalRepository {
    private final ReactiveCacheService cache;

    public ExternalRepository(ReactiveCacheService cache) {
        this.cache = cache;
    }
}
```

### Cache-Aside Pattern

Check cache first, fetch on miss:

```java
public Mono<Response> fetchData(String id) {
    String key = cacheKey(id);

    return cache.get(key, Response.class)
        .switchIfEmpty(
            fetchFromService(id)
                .doOnNext(resp -> cache.put(key, resp, Duration.ofMinutes(5)).subscribe())
        );
}
```

### Fallback-Only Pattern

Fetch first, use cache on error:

```java
public Mono<Response> fetchData(String id) {
    String key = cacheKey(id);

    return fetchFromService(id)
        .doOnNext(resp -> cache.put(key, resp, Duration.ofSeconds(30)).subscribe())
        .onErrorResume(e -> cache.get(key, Response.class)
            .defaultIfEmpty(FALLBACK)
        );
}
```

### Delete Cache Entry

```java
cache.delete(key).subscribe();
```

## Key Generation

Use consistent key format:

```java
private String cacheKey(String id) {
    return CacheKeyGenerator.key("entity", "id", id);
}
// Returns: "entity:id:123"
```

For store-specific data:

```java
private String cacheKey(String id, int storeNumber) {
    return CacheKeyGenerator.key("entity", "id", id, "store", storeNumber);
}
// Returns: "entity:id:123:store:1234"
```

## Classes

| Class | Purpose |
|-------|---------|
| `ReactiveCacheService` | Cache service interface |
| `RedisCacheService` | Redis implementation |
| `RedisCacheAutoConfiguration` | Auto-configuration |
| `CacheKeyGenerator` | Key generation utilities |

## Configuration

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      timeout: 1000ms
```

## TTL Guidelines

| Data Type | TTL | Pattern |
|-----------|-----|---------|
| Static reference | 15-30 min | Cache-aside |
| Pricing | 2-5 min | Cache-aside |
| Inventory | 30 sec | Fallback-only |
| User session | 30 min | Cache-aside |

## Testing

Use `RedisTestSupport` from `platform-test`:

```java
@Container
static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

@DynamicPropertySource
static void configureProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.data.redis.host", redis::getHost);
    registry.add("spring.data.redis.port",
        () -> RedisTestSupport.getRedisPort(redis));
}
```
