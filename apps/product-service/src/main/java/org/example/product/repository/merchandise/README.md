# merchandise

## Purpose
Retrieves product descriptions from the external merchandise service.

## Behavior
Implements cache-aside pattern: checks cache first, fetches from HTTP endpoint on miss, then caches the result. Applies circuit breaker, retry, and timeout via ReactiveResilience. Returns fallback message on all errors.

## Quirks
- Cache TTL controlled by `CacheProperties.merchandise.ttl`
- Fallback response is "Description unavailable" for all error types
