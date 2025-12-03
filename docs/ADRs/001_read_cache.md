# Adopt Redis Read Cache for Fan-Out Service Calls

* Status: accepted
* Deciders: platform-core + product squads
* Date: 2025-12-03

## Context and Problem Statement

Product-service fans out to three downstream systems (merchandise, price, inventory) per request and exposes the results through a single aggregated response. Each repository already wires a `ReactiveCacheService` to shield those HTTP calls: price and merchandise use a cache-aside lookup before calling the upstream (`apps/product-service/src/main/java/org/example/product/repository/price/PriceRepository.java:37` and `.../merchandise/MerchandiseRepository.java:37`), while inventory always tries HTTP first and then falls back to cache when errors exhaust retries (`.../inventory/InventoryRepository.java:39`). The cache layer itself is implemented once in `libs/platform/platform-cache`, where `RedisCacheService` uses a `ReactiveRedisTemplate` and swallows driver failures so that cache outages never bubble into business logic (`libs/platform/platform-cache/src/main/java/org/example/platform/cache/RedisCacheService.java:32`). TTLs are configurable per downstream via `CacheProperties` (`apps/product-service/src/main/java/org/example/product/config/CacheProperties.java:7`), and keys follow deterministic prefixes through `CacheKeyGenerator`.

The open question: do we continue to lean on Redis for this read cache, or adopt a different approach now that Redis is already deployed for Docker-based environments?

## Decision Drivers

1. **Latency and stability** – cache hits must avoid remote calls and reduce 95th percentile latency without introducing blocking code.
2. **Cross-instance consistency** – product-service scales horizontally, so cached responses should be visible to every pod instead of staying on a single node.
3. **Graceful degradation** – cache failures cannot break the request path; repositories must still fall back to remote calls or default responses.
4. **Operational fit** – the platform already runs Docker Compose + Redis locally and can provision managed Redis in cloud environments with existing playbooks.
5. **Flexibility** – the same cache abstractions should allow different TTLs and caching patterns (cache-aside vs. fallback-only) without extra boilerplate.

## Considered Options

1. Keep the current reactive Redis cache (status quo).
2. Replace Redis with in-process caches such as Caffeine (one cache per JVM instance).
3. Push caching responsibility to upstream services or a durable backing store (HTTP caching/CDN, or persisting snapshots in Postgres) and drop the dedicated cache tier.

## Decision Outcome

Chosen option: **keep the reactive Redis cache**.

Redis remains the best fit because it already satisfies every driver with the code we have in place today. The platform-cache module encapsulates Redis templates, serialization, and failure handling, so feature work in the applications only consumes the simple `ReactiveCacheService` contract. We can continue to tune TTLs via configuration, add new prefixes, and reuse the same cache in other services without touching application code. No other alternative meets the combination of cross-instance consistency, non-blocking APIs, and zero-impact failure semantics without introducing new infrastructure or invasive refactors.

### Positive Consequences

- Preserves shared cache state across horizontally scaled pods, so a single hit warms every instance.
- Keeps request handling entirely reactive: cache IO stays on the same pipeline and never blocks event loops.
- Cache failures stay isolated thanks to the `.onErrorResume` guards inside `RedisCacheService`, aligning with the "never break the happy path" requirement.
- Reuses the Docker + managed Redis footprint that already exists for other workloads and monitoring.
- Makes it straightforward to add new cached data sources by depending on `platform-cache` and provisioning keys/TTLs.

### Negative Consequences

- We must keep Redis highly available; otherwise cache cold-starts add load to downstream systems simultaneously.
- Adds an extra moving part to local development and CI, increasing startup time for full-stack environments.
- Requires operational guardrails (eviction policies, memory sizing, TLS, backup) that developers must coordinate with the platform team.

## Pros and Cons of the Options

### 1. Keep the reactive Redis cache (chosen)

**Good**
- Distributed cache shared by every pod eliminates duplicate work after the first miss.
- Reactive Redis client plus JSON serialization already exists; extending it to other services is near-zero cost.
- Failure handling is centrally tested and keeps cache concerns out of repositories.

**Bad**
- Needs a managed Redis cluster in production and a local container for developers.
- Requires observability on cache hit/miss ratios so the team can detect regressions.

### 2. Switch to in-process caches (Caffeine, Guava)

**Good**
- Simplifies operations: no network hop, no external dependency, no serialization cost.
- Warmup times are predictable for each JVM, making tests faster.

**Bad**
- Each pod would build its own cache; for popular SKUs a cold pod still hammers downstreams until it warms up.
- Memory pressure grows with pod count because data is duplicated, and eviction policies diverge per instance.
- Requires new instrumentation to ensure caches are invalidated consistently, especially for fallback patterns like inventory.

### 3. Push caching upstream or into a durable store

**Good**
- Offloads cache ownership to teams that manage source systems or to infrastructure (CDN/HTTP caching), reducing the surface area inside product-service.
- A durable materialized view (Postgres, Cassandra, etc.) could double as a reporting store with broader use.

**Bad**
- Requires significant upstream or schema changes; the product-service team loses direct control over cache TTLs and fallback semantics.
- HTTP caching and CDN layers do not help for POST-based price/inventory calls or for private data that cannot be shared publicly.
- Durable stores introduce write-path contention and increase consistency lag compared to in-memory Redis.

## Implementation Notes and Next Steps

- Applications should keep using `ReactiveCacheService` from `platform-cache`; no application code should instantiate Redis clients directly.
- Continue exposing per-domain TTLs via `CacheProperties`, and wire them into configuration defaults so SRE can tune them without code changes.
- Add observability (metrics/logs) for cache hit/miss ratios in future iterations so we can validate the effectiveness of the TTL mix.
- When adding new services, follow the `CacheKeyGenerator` pattern for deterministic prefixes and consider whether the cache-aside or fallback-only variant applies.

## References

- `libs/platform/platform-cache/src/main/java/org/example/platform/cache/RedisCacheService.java`
- `apps/product-service/src/main/java/org/example/product/repository/merchandise/MerchandiseRepository.java`
- `apps/product-service/src/main/java/org/example/product/repository/price/PriceRepository.java`
- `apps/product-service/src/main/java/org/example/product/repository/inventory/InventoryRepository.java`
- `apps/product-service/src/main/java/org/example/product/config/CacheProperties.java`
