# Redis Cache Implementation Plan

## Overview

Add Redis caching to the reactive Spring WebFlux application with two distinct caching patterns:

1. **Cache-Aside Pattern** (Merchandise & Price): Check cache first, call HTTP on miss
2. **Fallback-Only Pattern** (Inventory): Always call HTTP first, use cache only on errors after retry exhaustion

### Key Requirements
- Merchandise & Price: Check cache before HTTP call
- Inventory: Check cache only after errors (with retry), return -1 for backordered status
- All TTLs configurable via properties
- Redis metrics in Grafana dashboard

---

## Phase 1: Dependencies and Configuration

### 1.1 build.gradle

Add dependencies:
```groovy
implementation 'org.springframework.boot:spring-boot-starter-data-redis-reactive'
testImplementation 'org.testcontainers:testcontainers:1.20.4'
testImplementation 'org.testcontainers:junit-jupiter:1.20.4'
```

### 1.2 application.yml

Add cache configuration with configurable TTLs (shorter defaults):
```yaml
cache:
  merchandise:
    ttl: 15m    # Product descriptions
  price:
    ttl: 2m     # Prices (more volatile)
  inventory:
    ttl: 30s    # Fallback cache only

spring:
  data:
    redis:
      host: localhost
      port: 6379
      timeout: 1000ms
```

### 1.3 application-docker.yml

```yaml
spring:
  data:
    redis:
      host: redis
      port: 6379
```

---

## Phase 2: Redis Infrastructure

### 2.1 RedisConfig.java (NEW)
`src/main/java/org/example/reactivetest/config/RedisConfig.java`

- Configure `ReactiveRedisTemplate<String, Object>` with Jackson JSON serialization
- Use `StringRedisSerializer` for keys
- Use `Jackson2JsonRedisSerializer` for values

### 2.2 CacheProperties.java (NEW)
`src/main/java/org/example/reactivetest/config/CacheProperties.java`

```java
@ConfigurationProperties(prefix = "cache")
public class CacheProperties {
    private ServiceCache merchandise = new ServiceCache(Duration.ofMinutes(15));
    private ServiceCache price = new ServiceCache(Duration.ofMinutes(2));
    private ServiceCache inventory = new ServiceCache(Duration.ofSeconds(30));

    public static class ServiceCache {
        private Duration ttl;
        // getters/setters
    }
}
```

---

## Phase 3: Cache Service Layer

### 3.1 ReactiveCacheService.java (NEW)
`src/main/java/org/example/reactivetest/cache/ReactiveCacheService.java`

Interface for reactive cache operations:
```java
public interface ReactiveCacheService {
    <T> Mono<T> get(String key, Class<T> type);
    <T> Mono<Boolean> put(String key, T value, Duration ttl);
    Mono<Boolean> delete(String key);
}
```

### 3.2 RedisCacheService.java (NEW)
`src/main/java/org/example/reactivetest/cache/RedisCacheService.java`

Implementation with graceful degradation:
- All Redis errors return `Mono.empty()` or `Mono.just(false)` - never propagate
- Log cache operations for observability
- Handle serialization/deserialization errors gracefully

### 3.3 CacheKeyGenerator.java (NEW)
`src/main/java/org/example/reactivetest/cache/CacheKeyGenerator.java`

Key patterns:
- `merchandise:sku:{sku}`
- `price:sku:{sku}`
- `inventory:sku:{sku}`

---

## Phase 4: Repository Modifications

### 4.1 MerchandiseRepository.java (MODIFY)
**Pattern: Cache-Aside**

```java
public Mono<MerchandiseResponse> getDescription(long sku) {
    String cacheKey = CacheKeyGenerator.merchandiseKey(sku);

    return cacheService.get(cacheKey, MerchandiseResponse.class)
        .switchIfEmpty(Mono.defer(() -> fetchAndCache(sku, cacheKey)));
}

private Mono<MerchandiseResponse> fetchAndCache(long sku, String cacheKey) {
    return resilience.decorate(RESILIENCE_NAME, httpCall)
        .flatMap(response -> cacheService.put(cacheKey, response, ttl).thenReturn(response))
        .onErrorResume(this::handleError);
}
```

### 4.2 PriceRepository.java (MODIFY)
**Pattern: Cache-Aside** (same as Merchandise)

### 4.3 InventoryRepository.java (MODIFY)
**Pattern: Fallback-Only with Retry-Then-Cache**

```java
public Mono<InventoryResponse> getAvailability(long sku) {
    String cacheKey = CacheKeyGenerator.inventoryKey(sku);

    // Always call HTTP first (resilience already includes retry)
    return resilience.decorate(RESILIENCE_NAME, httpCall)
        .flatMap(response -> cacheAndReturn(cacheKey, response))
        .onErrorResume(t -> handleErrorWithCacheFallback(t, sku, cacheKey));
}

private Mono<InventoryResponse> handleErrorWithCacheFallback(Throwable t, long sku, String key) {
    // After retry exhaustion, try cache for ALL error types
    return cacheService.get(key, InventoryResponse.class)
        .switchIfEmpty(Mono.just(BACKORDERED_FALLBACK)); // -1 = backordered
}
```

**Inventory Fallback Values:**
- Cache hit after error: Return cached value (stale data better than nothing)
- Cache miss after error: Return `-1` (backordered status)

---

## Phase 5: Docker Stack Updates

### 5.1 docker-compose.yml (MODIFY)

Add Redis service:
```yaml
redis:
  image: redis:7.4-alpine
  container_name: redis
  command: ["redis-server", "--maxmemory", "128mb", "--maxmemory-policy", "allkeys-lru"]
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 5s
    timeout: 3s
    retries: 10
  networks:
    - observability

redis-exporter:
  image: oliver006/redis_exporter:v1.66.0
  container_name: redis-exporter
  environment:
    - REDIS_ADDR=redis:6379
  ports:
    - "9121:9121"
  depends_on:
    redis:
      condition: service_healthy
  networks:
    - observability
```

Add `redis-data` volume.

Update `reactive-test` service to depend on `redis: service_healthy`.

### 5.2 prometheus.yml (MODIFY)

Add scrape config:
```yaml
- job_name: 'redis'
  static_configs:
    - targets: ['redis-exporter:9121']
```

### 5.3 reactive-test.json (MODIFY)

Add Grafana dashboard panels:
- Cache hit/miss ratio by service
- Redis memory usage
- Redis command latency
- Cache operation counts

---

## Phase 6: Testing

### 6.1 Unit Tests (NEW)

`src/test/java/org/example/reactivetest/cache/RedisCacheServiceTest.java`
- Cache get/put operations
- Graceful degradation on Redis failure
- Serialization/deserialization

`src/test/java/org/example/reactivetest/repository/*CacheTest.java`
- MerchandiseRepository: Cache-aside behavior
- PriceRepository: Cache-aside behavior
- InventoryRepository: Fallback-only behavior with -1 backordered

### 6.2 Integration Tests (NEW)

`src/test/java/org/example/reactivetest/integration/CacheIntegrationTest.java`
- Use Testcontainers with Redis
- End-to-end cache flow validation

---

## Implementation Order

1. **Infrastructure** (Phase 1-2)
   - Add dependencies to build.gradle
   - Create RedisConfig.java
   - Create CacheProperties.java
   - Update application.yml and application-docker.yml

2. **Cache Service** (Phase 3)
   - Create ReactiveCacheService interface
   - Create RedisCacheService implementation
   - Create CacheKeyGenerator

3. **Repository Changes** (Phase 4)
   - Modify MerchandiseRepository (cache-aside)
   - Modify PriceRepository (cache-aside)
   - Modify InventoryRepository (fallback-only)

4. **Docker Stack** (Phase 5)
   - Add Redis and Redis Exporter to docker-compose.yml
   - Update Prometheus scrape config
   - Add Grafana dashboard panels

5. **Testing** (Phase 6)
   - Unit tests for cache service
   - Unit tests for repositories
   - Integration tests with Testcontainers

---

## Critical Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `build.gradle` | MODIFY | Add Spring Data Redis Reactive + Testcontainers |
| `src/main/resources/application.yml` | MODIFY | Add cache TTL and Redis config |
| `src/main/resources/application-docker.yml` | MODIFY | Add Docker Redis host |
| `src/main/java/.../config/RedisConfig.java` | CREATE | ReactiveRedisTemplate configuration |
| `src/main/java/.../config/CacheProperties.java` | CREATE | Configurable TTL properties |
| `src/main/java/.../cache/ReactiveCacheService.java` | CREATE | Cache interface |
| `src/main/java/.../cache/RedisCacheService.java` | CREATE | Redis implementation |
| `src/main/java/.../cache/CacheKeyGenerator.java` | CREATE | Key generation utility |
| `src/main/java/.../repository/merchandise/MerchandiseRepository.java` | MODIFY | Add cache-aside |
| `src/main/java/.../repository/price/PriceRepository.java` | MODIFY | Add cache-aside |
| `src/main/java/.../repository/inventory/InventoryRepository.java` | MODIFY | Add fallback-only cache |
| `docker/docker-compose.yml` | MODIFY | Add Redis + Redis Exporter |
| `docker/prometheus/prometheus.yml` | MODIFY | Add Redis scrape config |
| `docker/grafana/provisioning/dashboards/reactive-test.json` | MODIFY | Add Redis panels |

---

## Design Decisions

### Why Two Caching Patterns?

- **Merchandise & Price**: Relatively stable data. Cache-first reduces upstream load and improves latency.
- **Inventory**: Highly volatile. Showing stale inventory could cause overselling. Only use cache as fallback when the service is unavailable.

### Inventory Fallback Strategy

After user clarification: **Retry first, then cache for all errors**
- Resilience4j retry is applied before cache check
- After retry exhaustion (any error type), check cache
- Cache hit: Return cached value
- Cache miss: Return -1 (backordered)

### Redis Failure Handling

Application continues working if Redis is unavailable:
- Cache operations return empty/false on errors
- Repositories fall back to direct HTTP calls
- No exceptions propagate from cache layer

### TTL Configuration

All TTLs are configurable via `application.yml`:
- Merchandise: 15 minutes (default)
- Price: 2 minutes (default)
- Inventory: 30 seconds (fallback only)
