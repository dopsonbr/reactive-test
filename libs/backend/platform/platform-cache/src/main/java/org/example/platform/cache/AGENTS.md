# Cache

## Boundaries
Files that require careful review before changes: all (cache failures must never propagate to callers)

## Conventions
- All Redis errors are caught with onErrorResume and return empty/false
- GET returns Mono.empty() on miss, error, or deserialization failure
- PUT returns Mono<Boolean> and fails silently
- Use CacheKeyGenerator for all cache keys to ensure consistency

## Warnings
- Never propagate Redis exceptions upstream
- Cache operations must remain non-blocking (no blocking Redis calls)
- Deserialization errors are logged but treated as cache miss
