# Redis Repository Template

This template defines the standard structure for reactive Redis repositories for caching.

## When to Use Redis

Use Redis for:
- **Caching** - Frequently accessed data with simple key-value access patterns
- **Session data** - User sessions and short-lived authentication state
- **Rate limiting** - Counters and sliding windows
- **Ephemeral state** - Data that can be regenerated if lost
- **Fallback data** - Cached copies for resilience when upstream services fail

Do NOT use Redis for:
- Transactional data requiring ACID guarantees (use Postgres)
- Primary data storage for core business entities (use Postgres)
- Data requiring complex queries or joins (use Postgres)
- Audit trails or compliance data (use Postgres)

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
```

## Cache Repository Interface

```java
package org.example.product.repository;

import reactor.core.publisher.Mono;

/**
 * Repository interface for cached data.
 *
 * <p>Defines cache-specific operations with TTL support.
 */
public interface ProductCacheRepository {

    /**
     * Get a cached product.
     *
     * @param sku the product SKU
     * @return the cached product, or empty if not cached
     */
    Mono<CachedProduct> findBySku(long sku);

    /**
     * Cache a product with default TTL.
     *
     * @param product the product to cache
     * @return true if cached successfully
     */
    Mono<Boolean> save(CachedProduct product);

    /**
     * Invalidate a cached product.
     *
     * @param sku the product SKU
     * @return true if key was deleted
     */
    Mono<Boolean> evict(long sku);
}
```

## Redis Repository Implementation

```java
package org.example.product.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

/**
 * Redis implementation for product caching.
 *
 * <p>Key patterns:
 * <ul>
 *   <li>product:{sku} - Individual product cache</li>
 *   <li>product:store:{storeNumber}:{sku} - Store-specific product data</li>
 * </ul>
 */
@Repository
public class RedisProductCacheRepository implements ProductCacheRepository {

    private static final String KEY_PREFIX = "product:";
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(15);

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ReactiveValueOperations<String, String> valueOps;
    private final ObjectMapper objectMapper;

    public RedisProductCacheRepository(
            ReactiveRedisTemplate<String, String> redisTemplate,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.valueOps = redisTemplate.opsForValue();
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<CachedProduct> findBySku(long sku) {
        return valueOps.get(key(sku))
                .flatMap(this::deserialize)
                .onErrorResume(e -> {
                    // Cache miss or deserialization error - return empty
                    return Mono.empty();
                });
    }

    @Override
    public Mono<Boolean> save(CachedProduct product) {
        return serialize(product)
                .flatMap(json -> valueOps.set(key(product.sku()), json, DEFAULT_TTL))
                .onErrorReturn(false);  // Don't fail if cache write fails
    }

    @Override
    public Mono<Boolean> evict(long sku) {
        return redisTemplate.delete(key(sku))
                .map(count -> count > 0)
                .onErrorReturn(false);
    }

    // ==================== Key Builders ====================

    private String key(long sku) {
        return KEY_PREFIX + sku;
    }

    // ==================== Serialization ====================

    private Mono<String> serialize(CachedProduct product) {
        return Mono.fromCallable(() -> objectMapper.writeValueAsString(product))
                .onErrorMap(JsonProcessingException.class,
                        e -> new RuntimeException("Failed to serialize product", e));
    }

    private Mono<CachedProduct> deserialize(String json) {
        return Mono.fromCallable(() -> objectMapper.readValue(json, CachedProduct.class))
                .onErrorMap(JsonProcessingException.class,
                        e -> new RuntimeException("Failed to deserialize product", e));
    }
}
```

## Cache Service Pattern (Cache-Aside)

```java
package org.example.product.service;

import org.example.product.repository.ProductCacheRepository;
import org.example.product.repository.ProductHttpRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Service implementing cache-aside pattern.
 *
 * <p>Check cache first, fall back to HTTP, cache on miss.
 */
@Service
public class ProductService {

    private final ProductCacheRepository cache;
    private final ProductHttpRepository http;

    public Mono<Product> getProduct(long sku, int storeNumber) {
        return cache.findBySku(sku)
                .map(this::toDomain)
                // Cache miss - fetch from HTTP and cache
                .switchIfEmpty(
                        http.fetchProduct(sku, storeNumber)
                                .flatMap(product ->
                                        cache.save(toCache(product))
                                                .thenReturn(product))
                );
    }
}
```

## Fallback Cache Pattern

```java
package org.example.product.service;

/**
 * Service implementing fallback cache pattern.
 *
 * <p>Always call HTTP first, use cache only on error.
 */
@Service
public class InventoryService {

    private final InventoryCacheRepository cache;
    private final InventoryHttpRepository http;

    public Mono<Integer> getAvailability(long sku, int storeNumber) {
        return http.fetchInventory(sku, storeNumber)
                // On success: update cache and return
                .flatMap(inventory ->
                        cache.save(toCache(inventory))
                                .thenReturn(inventory.quantity()))
                // On error: try cache
                .onErrorResume(e ->
                        cache.findBySku(sku)
                                .map(CachedInventory::quantity)
                                // No cache: return fallback (backordered)
                                .switchIfEmpty(Mono.just(-1))
                );
    }
}
```

## Using Sets for Secondary Indexes

```java
/**
 * Example using Redis Sets for secondary indexes.
 */
@Repository
public class RedisCartCacheRepository {

    private static final String CART_KEY_PREFIX = "cart:";
    private static final String STORE_INDEX_PREFIX = "cart:store:";

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ReactiveValueOperations<String, String> valueOps;
    private final ReactiveSetOperations<String, String> setOps;

    // Cache a cart AND add to store index
    public Mono<Boolean> save(Cart cart) {
        return serialize(cart)
                .flatMap(json -> valueOps.set(cartKey(cart.id()), json, DEFAULT_TTL))
                .then(setOps.add(storeIndexKey(cart.storeNumber()), cart.id()))
                .then(redisTemplate.expire(storeIndexKey(cart.storeNumber()), DEFAULT_TTL))
                .thenReturn(true);
    }

    // Find all carts for a store using the index
    public Flux<Cart> findByStoreNumber(int storeNumber) {
        return setOps.members(storeIndexKey(storeNumber))
                .flatMap(cartId -> valueOps.get(cartKey(cartId)))
                .flatMap(this::deserialize);
    }

    private String cartKey(String cartId) {
        return CART_KEY_PREFIX + cartId;
    }

    private String storeIndexKey(int storeNumber) {
        return STORE_INDEX_PREFIX + storeNumber;
    }
}
```

## Testing

```java
package org.example.product.repository;

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
class RedisProductCacheRepositoryTest {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
    }

    @Autowired
    private RedisProductCacheRepository repository;

    @Autowired
    private ReactiveRedisTemplate<String, String> redisTemplate;

    @BeforeEach
    void setUp() {
        // Clear Redis before each test
        redisTemplate.execute(connection -> connection.serverCommands().flushAll())
                .blockLast();
    }

    @Test
    void shouldCacheAndRetrieveProduct() {
        CachedProduct product = new CachedProduct(123456L, "Test Product", "19.99", 10);

        StepVerifier.create(repository.save(product))
                .expectNext(true)
                .verifyComplete();

        StepVerifier.create(repository.findBySku(123456L))
                .expectNextMatches(cached -> cached.sku() == 123456L)
                .verifyComplete();
    }

    @Test
    void shouldReturnEmptyOnCacheMiss() {
        StepVerifier.create(repository.findBySku(999999L))
                .verifyComplete();  // Empty
    }
}
```

## Anti-Patterns

### Blocking Redis as Primary Store

```java
// DON'T - treating Redis as primary data store
public Mono<Void> createCart(Cart cart) {
    return cache.save(cart);  // Data could be lost on Redis failure!
}

// DO - use Postgres as primary, Redis as cache
public Mono<Cart> createCart(Cart cart) {
    return postgres.save(cart)
            .flatMap(saved -> cache.save(saved).thenReturn(saved));
}
```

### Missing TTL

```java
// DON'T - no TTL (data never expires)
public Mono<Boolean> save(Product product) {
    return valueOps.set(key(product.sku()), serialize(product));
}

// DO - always set TTL for cache entries
public Mono<Boolean> save(Product product) {
    return valueOps.set(key(product.sku()), serialize(product), Duration.ofMinutes(15));
}
```

### Failing on Cache Errors

```java
// DON'T - cache error breaks the flow
public Mono<Product> getProduct(long sku) {
    return cache.findBySku(sku)  // If Redis is down, everything fails
            .switchIfEmpty(http.fetch(sku));
}

// DO - cache errors should be swallowed
public Mono<Product> getProduct(long sku) {
    return cache.findBySku(sku)
            .onErrorResume(e -> Mono.empty())  // Cache error = cache miss
            .switchIfEmpty(http.fetch(sku));
}
```

## Checklist

Before using this template, verify:

- [ ] Added Redis reactive starter dependency
- [ ] Added Redis configuration to application.yml
- [ ] Defined clear key naming patterns
- [ ] Set appropriate TTL for all cached data
- [ ] Cache errors are handled gracefully (don't break the flow)
- [ ] Using cache-aside or fallback pattern appropriately
- [ ] Added integration tests with Testcontainers
