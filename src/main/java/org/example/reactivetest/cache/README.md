# Cache

## Purpose
Provides non-blocking Redis caching for external service calls to reduce latency and improve resilience.

## Behavior
Supports cache-aside pattern (check cache, miss calls upstream, store result) and fallback-only pattern (cache errors, skip cache on success). All Redis failures are swallowed and logged, never propagating errors to callers.

## Quirks
- GET returns empty Mono on cache miss, deserialization failure, or Redis connection error
- PUT fails silently on Redis errors and returns false
- Cache keys use service-specific prefixes (merchandise:sku:, price:sku:, inventory:sku:)
