# Price Repository

## Boundaries
Files that require careful review before changes: PriceRepository.java (caching sequence)

## Conventions
- Uses cache-aside pattern (check cache first, then fetch)
- All errors return fallback response ("0.00")
- Resilience name: "price"
- Cache key format: `CacheKeyGenerator.priceKey(sku)`

## Warnings
- Changing the cache pattern (e.g., to fallback-only) affects cache hit rates
- Fallback price is hardcoded; changing it affects error behavior across the system
