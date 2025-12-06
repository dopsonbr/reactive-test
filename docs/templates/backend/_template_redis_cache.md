# Redis Cache Repository Template

This template defines the standard structure for reactive Redis repositories used exclusively for **caching**.

Replace `{Entity}`, `{entity}`, and `{identifier}` with your domain-specific names (e.g., `Product`/`product`/`sku`, `Cart`/`cart`/`cartId`).

## When to Use Redis Caching

Use Redis caching for:
- **Read-through caching** - Frequently accessed data with simple key-value access patterns
- **Session data** - User sessions and short-lived authentication state
- **Rate limiting** - Counters and sliding windows
- **Ephemeral state** - Data that can be regenerated if lost
- **Fallback data** - Cached copies for resilience when upstream services fail

Do NOT use Redis caching for:
- **Primary data storage** - Data that cannot be regenerated (use Postgres)
- **Transactional data** - Data requiring ACID guarantees (use Postgres)
- **Complex queries** - Data requiring joins or aggregations (use Postgres)
- **Audit trails** - Compliance data that must be durable (use Postgres + Redis Streams)
- **Real-time notifications** - Use Redis Pub/Sub instead (see `_template_redis_pubsub.md`)

## Dependencies

Add to `build.gradle.kts`:

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")
}
```

## Configuration

`application.yml`:

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      timeout: 1000ms
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 2
          max-wait: 100ms

# Application-specific cache configuration
cache:
  {entity}:
    ttl: 15m
    key-prefix: "{entity}:"
```

## Key Naming Conventions

Consistent key naming is critical for maintainability and debugging.

### Pattern: `{domain}:{identifier}` or `{domain}:{scope}:{identifier}`

```java
// Simple entity cache
"{entity}:{id}"                         // e.g., "product:123456", "cart:abc-def"

// Scoped cache (e.g., store-specific data)
"{entity}:store:{storeNumber}:{id}"     // e.g., "product:store:1234:123456"

// Composite keys for nested data
"{entity}:{id}:{aspect}"                // e.g., "cart:abc-def:totals", "user:U123:preferences"
```

### Key Builder Pattern

```java
public final class CacheKeys {
    private CacheKeys() {}

    public static String {entity}(String id) {
        return "{entity}:" + id;
    }

    public static String {entity}ForStore(int storeNumber, String id) {
        return "{entity}:store:" + storeNumber + ":" + id;
    }
}
```

## Cache Repository Interface

```java
package org.example.{domain}.repository;

import reactor.core.publisher.Mono;

/**
 * Repository interface for cached {Entity} data.
 *
 * <p>Defines cache-specific operations with TTL support.
 * All operations are non-blocking and cache failures should not
 * break the application flow.
 */
public interface {Entity}CacheRepository {

    /**
     * Get a cached {entity}.
     *
     * @param id the {entity} identifier
     * @return the cached {entity}, or empty if not cached
     */
    Mono<Cached{Entity}> findById(String id);

    /**
     * Cache an {entity} with default TTL.
     *
     * @param {entity} the {entity} to cache
     * @return true if cached successfully
     */
    Mono<Boolean> save(Cached{Entity} {entity});

    /**
     * Invalidate a cached {entity}.
     *
     * @param id the {entity} identifier
     * @return true if key was deleted
     */
    Mono<Boolean> evict(String id);
}
```

## Redis Cache Repository Implementation

```java
package org.example.{domain}.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

/**
 * Redis implementation for {entity} caching.
 *
 * <p>Key pattern: {entity}:{id}
 *
 * <p>All cache operations are resilient - failures return empty/false
 * rather than propagating errors to callers.
 */
@Repository
public class Redis{Entity}CacheRepository implements {Entity}CacheRepository {

    private static final String KEY_PREFIX = "{entity}:";
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(15);

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ReactiveValueOperations<String, String> valueOps;
    private final ObjectMapper objectMapper;

    public Redis{Entity}CacheRepository(
            ReactiveRedisTemplate<String, String> redisTemplate,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.valueOps = redisTemplate.opsForValue();
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Cached{Entity}> findById(String id) {
        return valueOps.get(key(id))
                .flatMap(this::deserialize)
                .onErrorResume(e -> {
                    // Cache miss or deserialization error - return empty
                    // Log at DEBUG level; cache errors are expected in degraded scenarios
                    return Mono.empty();
                });
    }

    @Override
    public Mono<Boolean> save(Cached{Entity} {entity}) {
        return serialize({entity})
                .flatMap(json -> valueOps.set(key({entity}.id()), json, DEFAULT_TTL))
                .onErrorReturn(false);  // Don't fail if cache write fails
    }

    @Override
    public Mono<Boolean> evict(String id) {
        return redisTemplate.delete(key(id))
                .map(count -> count > 0)
                .onErrorReturn(false);
    }

    // ==================== Key Builders ====================

    private String key(String id) {
        return KEY_PREFIX + id;
    }

    // ==================== Serialization ====================

    private Mono<String> serialize(Cached{Entity} {entity}) {
        return Mono.fromCallable(() -> objectMapper.writeValueAsString({entity}))
                .onErrorMap(JsonProcessingException.class,
                        e -> new RuntimeException("Failed to serialize {entity}", e));
    }

    private Mono<Cached{Entity}> deserialize(String json) {
        return Mono.fromCallable(() -> objectMapper.readValue(json, Cached{Entity}.class))
                .onErrorMap(JsonProcessingException.class,
                        e -> new RuntimeException("Failed to deserialize {entity}", e));
    }
}
```

## TTL Strategies

### Fixed TTL (Most Common)

```java
private static final Duration DEFAULT_TTL = Duration.ofMinutes(15);

public Mono<Boolean> save(Cached{Entity} {entity}) {
    return valueOps.set(key({entity}.id()), json, DEFAULT_TTL);
}
```

### Configurable TTL

```java
@ConfigurationProperties(prefix = "cache.{entity}")
public record {Entity}CacheProperties(Duration ttl, String keyPrefix) {
    public {Entity}CacheProperties {
        if (ttl == null) ttl = Duration.ofMinutes(15);
        if (keyPrefix == null) keyPrefix = "{entity}:";
    }
}
```

### Sliding TTL (Refresh on Read)

```java
public Mono<Cached{Entity}> findById(String id) {
    String cacheKey = key(id);
    return valueOps.get(cacheKey)
            .flatMap(json ->
                // Refresh TTL on hit
                redisTemplate.expire(cacheKey, DEFAULT_TTL)
                        .then(deserialize(json))
            )
            .onErrorResume(e -> Mono.empty());
}
```

## Cache Service Patterns

### Cache-Aside Pattern (Read-Through)

Use when cached data is relatively stable and cache misses are acceptable.

```java
package org.example.{domain}.service;

import org.example.{domain}.repository.{Entity}CacheRepository;
import org.example.{domain}.repository.{Entity}Repository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Service implementing cache-aside pattern.
 *
 * <p>Flow: Check cache → if miss, fetch from source → cache result → return
 */
@Service
public class {Entity}Service {

    private final {Entity}CacheRepository cache;
    private final {Entity}Repository source;  // HTTP client, database, etc.

    public Mono<{Entity}> get{Entity}(String id) {
        return cache.findById(id)
                .map(this::toDomain)
                // Cache miss - fetch from source and cache
                .switchIfEmpty(
                        source.findById(id)
                                .flatMap({entity} ->
                                        cache.save(toCache({entity}))
                                                .thenReturn({entity}))
                );
    }

    private {Entity} toDomain(Cached{Entity} cached) { /* ... */ }
    private Cached{Entity} toCache({Entity} {entity}) { /* ... */ }
}
```

### Fallback Cache Pattern

Use when fresh data is preferred but stale cached data is acceptable during failures.

```java
package org.example.{domain}.service;

/**
 * Service implementing fallback cache pattern.
 *
 * <p>Flow: Fetch from source → on success, update cache → on error, try cache → return
 *
 * <p>Use this pattern for volatile data where:
 * - Fresh data is strongly preferred
 * - Stale data is acceptable during outages
 * - Complete failure returns a safe default
 */
@Service
public class {Entity}Service {

    private final {Entity}CacheRepository cache;
    private final {Entity}HttpRepository http;

    public Mono<{Entity}> get{Entity}(String id) {
        return http.fetch(id)
                // On success: update cache and return
                .flatMap({entity} ->
                        cache.save(toCache({entity}))
                                .thenReturn({entity}))
                // On error: try cache
                .onErrorResume(e ->
                        cache.findById(id)
                                .map(this::toDomain)
                                // No cache: return fallback or empty
                                .switchIfEmpty(Mono.empty())
                );
    }
}
```

### Write-Through Pattern

Use when cache consistency is critical and writes are infrequent.

```java
/**
 * Write-through: Update source first, then cache.
 */
public Mono<{Entity}> update{Entity}({Entity} {entity}) {
    return repository.save({entity})
            .flatMap(saved ->
                cache.save(toCache(saved))
                        .thenReturn(saved)
            );
}
```

## Using Sets for Secondary Indexes

For queries beyond simple key lookups, use Redis Sets as secondary indexes.

```java
/**
 * Example using Redis Sets for secondary indexes.
 */
@Repository
public class Redis{Entity}CacheRepository {

    private static final String KEY_PREFIX = "{entity}:";
    private static final String INDEX_PREFIX = "{entity}:index:";
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(30);

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ReactiveValueOperations<String, String> valueOps;
    private final ReactiveSetOperations<String, String> setOps;

    // Cache an entity AND add to secondary index
    public Mono<Boolean> save(Cached{Entity} {entity}) {
        return serialize({entity})
                .flatMap(json -> valueOps.set(entityKey({entity}.id()), json, DEFAULT_TTL))
                .then(setOps.add(indexKey({entity}.groupId()), {entity}.id()))
                .then(redisTemplate.expire(indexKey({entity}.groupId()), DEFAULT_TTL))
                .thenReturn(true)
                .onErrorReturn(false);
    }

    // Find all entities by secondary index
    public Flux<Cached{Entity}> findByGroupId(String groupId) {
        return setOps.members(indexKey(groupId))
                .flatMap(id -> valueOps.get(entityKey(id)))
                .flatMap(this::deserialize)
                .onErrorResume(e -> Flux.empty());
    }

    // Remove from both cache and index
    public Mono<Boolean> evict(String id, String groupId) {
        return redisTemplate.delete(entityKey(id))
                .then(setOps.remove(indexKey(groupId), id))
                .thenReturn(true)
                .onErrorReturn(false);
    }

    private String entityKey(String id) {
        return KEY_PREFIX + id;
    }

    private String indexKey(String groupId) {
        return INDEX_PREFIX + groupId;
    }
}
```

## Testing

```java
package org.example.{domain}.repository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.test.StepVerifier;

@SpringBootTest
@Testcontainers
class Redis{Entity}CacheRepositoryTest {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
    }

    @Autowired
    private Redis{Entity}CacheRepository repository;

    @Autowired
    private ReactiveRedisTemplate<String, String> redisTemplate;

    @BeforeEach
    void setUp() {
        // Clear Redis before each test
        redisTemplate.execute(connection -> connection.serverCommands().flushAll())
                .blockLast();
    }

    @Test
    void shouldCacheAndRetrieve() {
        Cached{Entity} {entity} = new Cached{Entity}("test-id", "Test Data");

        StepVerifier.create(repository.save({entity}))
                .expectNext(true)
                .verifyComplete();

        StepVerifier.create(repository.findById("test-id"))
                .expectNextMatches(cached -> cached.id().equals("test-id"))
                .verifyComplete();
    }

    @Test
    void shouldReturnEmptyOnCacheMiss() {
        StepVerifier.create(repository.findById("nonexistent"))
                .verifyComplete();  // Empty
    }

    @Test
    void shouldEvictCachedEntity() {
        Cached{Entity} {entity} = new Cached{Entity}("test-id", "Test Data");
        repository.save({entity}).block();

        StepVerifier.create(repository.evict("test-id"))
                .expectNext(true)
                .verifyComplete();

        StepVerifier.create(repository.findById("test-id"))
                .verifyComplete();  // Empty after eviction
    }

    @Test
    void shouldHandleRedisErrorsGracefully() {
        // Simulate by stopping Redis or testing with invalid data
        // Cache operations should return empty/false, not throw
    }
}
```

## Anti-Patterns

### Using Redis as Primary Store

```java
// DON'T - treating Redis as primary data store
public Mono<Void> create({Entity} {entity}) {
    return cache.save({entity});  // Data could be lost on Redis failure!
}

// DO - use Postgres as primary, Redis as cache
public Mono<{Entity}> create({Entity} {entity}) {
    return repository.save({entity})
            .flatMap(saved -> cache.save(toCache(saved)).thenReturn(saved));
}
```

### Missing TTL

```java
// DON'T - no TTL (data never expires, cache grows unbounded)
public Mono<Boolean> save(Cached{Entity} {entity}) {
    return valueOps.set(key({entity}.id()), serialize({entity}));
}

// DO - always set TTL for cache entries
public Mono<Boolean> save(Cached{Entity} {entity}) {
    return valueOps.set(key({entity}.id()), serialize({entity}), Duration.ofMinutes(15));
}
```

### Failing on Cache Errors

```java
// DON'T - cache error breaks the flow
public Mono<{Entity}> get(String id) {
    return cache.findById(id)  // If Redis is down, everything fails
            .switchIfEmpty(source.findById(id));
}

// DO - cache errors should be swallowed
public Mono<{Entity}> get(String id) {
    return cache.findById(id)
            .onErrorResume(e -> Mono.empty())  // Cache error = cache miss
            .switchIfEmpty(source.findById(id));
}
```

### Blocking Serialization

```java
// DON'T - blocking call in reactive chain
public Mono<Boolean> save(Cached{Entity} {entity}) {
    String json = objectMapper.writeValueAsString({entity});  // BLOCKING!
    return valueOps.set(key({entity}.id()), json, DEFAULT_TTL);
}

// DO - wrap in Mono.fromCallable for non-blocking
public Mono<Boolean> save(Cached{Entity} {entity}) {
    return Mono.fromCallable(() -> objectMapper.writeValueAsString({entity}))
            .flatMap(json -> valueOps.set(key({entity}.id()), json, DEFAULT_TTL));
}
```

### Inconsistent Key Naming

```java
// DON'T - inconsistent key patterns across the codebase
"{Entity}:" + id           // Capitalized
"{entity}_" + id           // Underscore
"{entities}/" + id         // Plural with slash

// DO - consistent pattern with centralized key builders
CacheKeys.{entity}(id)     // "{entity}:123"
```

## Checklist

Before using this template, verify:

- [ ] Added Redis reactive starter dependency
- [ ] Added Redis configuration to application.yml
- [ ] Defined consistent key naming patterns (use key builder class)
- [ ] Set appropriate TTL for all cached data
- [ ] Cache errors are handled gracefully (don't break the flow)
- [ ] Using appropriate pattern (cache-aside vs. fallback) for data volatility
- [ ] Serialization is non-blocking (`Mono.fromCallable`)
- [ ] Added integration tests with Testcontainers
- [ ] Cache operations logged at DEBUG level for troubleshooting

## Related Templates

- `_template_redis_pubsub.md` - For real-time notifications and event fan-out
- `_template_postgres_repository.md` - For primary data storage with ACID guarantees
