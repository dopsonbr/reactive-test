# platform-cache

## Boundaries
Files requiring careful review: none (interface-based design allows safe implementation changes)

## Conventions
- All cache operations return Mono (never block)
- Cache failures are logged but never throw exceptions
- TTL is mandatory on every put operation
- Use CacheKeyGenerator for consistent key formats
- JSON serialization via Jackson ObjectMapper

## Warnings
- Do not call `.block()` on cache operations (silently degrades performance)
- Cache misses and Redis errors both return `Mono.empty()` from get()
- put() does not block the caller (use `.subscribe()` or reactive chain)
- delete() is best-effort only (may silently fail if Redis is down)
