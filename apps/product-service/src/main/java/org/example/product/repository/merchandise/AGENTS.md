# merchandise

## Boundaries
Files that require careful review before changes: MerchandiseRepository.java (resilience decorator order matters)

## Conventions
- All methods return Mono (never Flux)
- Errors always return fallback, never propagate upstream
- Cache keys generated via CacheKeyGenerator.merchandiseKey()

## Warnings
- Changing fallback response affects all downstream consumers
- Resilience decorator order is: timeout → circuit breaker → retry → bulkhead
