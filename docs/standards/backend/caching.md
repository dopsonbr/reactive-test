# Caching Standard

## Intent

Reduce load on external services and improve response times by caching data appropriately based on freshness requirements.

## Outcomes

- Faster response times for cached data
- Reduced external service calls
- Graceful degradation when services fail
- Clear caching strategy per data type

## Patterns

### Two Caching Strategies

| Strategy | When to Use | Data Flow |
|----------|-------------|-----------|
| **Cache-Aside** | Data changes infrequently | Cache first, then origin |
| **Fallback-Only** | Data MUST be fresh | Origin first, cache on error |

### Cache-Aside Pattern

Use for data that changes infrequently (merchandise, pricing).

```
Request arrives
       │
       ▼
  Cache lookup
       │
   ┌───┴───┐
  HIT     MISS
   │       │
   ▼       ▼
Return   Call origin service
cached        │
value         ▼
         Success?
              │
          ┌───┴───┐
         Yes     No
          │       │
          ▼       ▼
     Cache PUT   Return
          │      fallback
          ▼
       Return
       value
```

```java
Mono<Merchandise> getMerchandise(long sku) {
    String key = "merchandise:sku:" + sku;
    return cache.get(key, () -> fetchFromService(sku));
}
```

### Fallback-Only Pattern

Use for data that MUST be fresh (inventory, real-time availability).

```
Request arrives
       │
       ▼
  Call origin service (always)
       │
   Success?
       │
   ┌───┴───┐
  Yes     No
   │       │
   ▼       ▼
Cache PUT   Cache GET
   │        (stale)
   ▼           │
Return      Found?
value          │
           ┌───┴───┐
          Yes     No
           │       │
           ▼       ▼
        Return   Return
        stale    static
        value    fallback
```

```java
Mono<Inventory> getInventory(long sku, int storeNumber) {
    String key = "inventory:sku:" + sku + ":store:" + storeNumber;
    return fetchFromService(sku, storeNumber)
        .doOnNext(inv -> cache.put(key, inv))
        .onErrorResume(e -> cache.get(key)
            .switchIfEmpty(Mono.just(FALLBACK)));
}
```

### TTL Guidelines

| Data Type | TTL | Pattern | Rationale |
|-----------|-----|---------|-----------|
| Static reference data | 15-30 min | Cache-aside | Rarely changes |
| Merchandise/product info | 5-15 min | Cache-aside | Changes occasionally |
| Pricing | 2-5 min | Cache-aside | May change for promotions |
| Inventory/availability | 30 sec - 2 min | Fallback-only | Must be fresh |
| User session | 30 min | Cache-aside | Session timeout |
| Cart data | 7 days | Write-through | Persist user intent |

### Key Generation

Use consistent, hierarchical key format:

```
{entity}:{identifier-type}:{identifier}[:{qualifier}:{value}]

Examples:
  merchandise:sku:123456
  price:sku:123456
  inventory:sku:123456:store:1234
  cart:id:abc-def-123
  session:user:john123
```

Key generation utility:
```java
class CacheKeyGenerator {
    static String forMerchandise(long sku) {
        return "merchandise:sku:" + sku;
    }

    static String forInventory(long sku, int storeNumber) {
        return "inventory:sku:" + sku + ":store:" + storeNumber;
    }
}
```

### Cache Service Interface

```java
interface ReactiveCacheService {
    <T> Mono<T> get(String key, Class<T> type);
    <T> Mono<T> get(String key, Supplier<Mono<T>> loader);
    <T> Mono<Void> put(String key, T value);
    <T> Mono<Void> put(String key, T value, Duration ttl);
    Mono<Boolean> delete(String key);
}
```

### Redis Configuration

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      timeout: 100ms        # Fast timeout for cache operations
      lettuce:
        pool:
          max-active: 50    # Connection pool size
          max-idle: 10
          min-idle: 5

cache:
  default-ttl: 5m           # Default TTL if not specified
  merchandise-ttl: 15m
  price-ttl: 5m
  inventory-ttl: 30s
```

### Cache Warming (Optional)

For critical data, pre-populate cache on startup:

```java
@EventListener(ApplicationReadyEvent.class)
void warmCache() {
    log.info("Warming cache for top products");
    topProductsService.getTopSkus()
        .flatMap(sku -> merchandiseRepository.getMerchandise(sku))
        .subscribe();
}
```

## Anti-patterns

### Caching Volatile Data with Long TTL

```java
// DON'T - stale inventory causes overselling
cache.put("inventory:" + sku, inventory, Duration.ofHours(1));

// DO - short TTL or fallback-only pattern
cache.put("inventory:" + sku, inventory, Duration.ofSeconds(30));
```

### No TTL (Stale Data Forever)

```java
// DON'T - data never expires
cache.put(key, value);  // No TTL = infinite

// DO - always set TTL
cache.put(key, value, Duration.ofMinutes(15));
```

### Inconsistent Key Formats

```java
// DON'T - inconsistent keys
cache.get("product_123");
cache.get("PRODUCT:123");
cache.get("prod-123");

// DO - consistent format
cache.get("product:sku:123");
cache.get("product:sku:456");
```

### Caching Errors (Negative Caching Without Intent)

```java
// DON'T - caches error response
Mono<Product> get(long sku) {
    return cache.get(key, () ->
        fetchFromService(sku)
            .onErrorReturn(FALLBACK)  // Caches FALLBACK!
    );
}

// DO - don't cache fallback values
Mono<Product> get(long sku) {
    return cache.get(key, () -> fetchFromService(sku))
        .onErrorReturn(FALLBACK);  // Only returns fallback, doesn't cache it
}
```

### Cache Stampede

```java
// DON'T - all requests hit origin simultaneously
// When cache expires, 100 concurrent requests all miss and call origin

// DO - use cache.get with loader (provides locking/deduplication)
cache.get(key, () -> fetchFromService(sku));
// Or: implement request coalescing
```

### No Cache Timeout

```java
// DON'T - cache operation can block forever
redis.get(key).block();

// DO - set aggressive timeout for cache operations
redis.get(key)
    .timeout(Duration.ofMillis(100))
    .onErrorResume(e -> Mono.empty());  // Treat timeout as cache miss
```

### Caching User-Specific Data Globally

```java
// DON'T - security issue
cache.put("cart", userCart);  // All users see same cart!

// DO - include user/session in key
cache.put("cart:user:" + userId, userCart);
cache.put("cart:session:" + sessionId, userCart);
```

### Cache Without Resilience

```java
// DON'T - Redis failure breaks everything
Mono<Product> get(long sku) {
    return cache.get(key)  // If Redis down, error propagates
        .switchIfEmpty(fetchFromService(sku));
}

// DO - handle cache failures gracefully
Mono<Product> get(long sku) {
    return cache.get(key)
        .onErrorResume(e -> {
            log.warn("Cache error, falling back to origin", e);
            return Mono.empty();
        })
        .switchIfEmpty(fetchFromService(sku));
}
```

## Reference

- `apps/product-service/src/.../repository/merchandise/` - Cache-aside example
- `apps/product-service/src/.../repository/inventory/` - Fallback-only example
- `libs/platform/platform-cache/` - Cache abstraction
