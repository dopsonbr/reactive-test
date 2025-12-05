# Inventory Repository

## Boundaries
Files requiring careful review before changes: InventoryRepository.java (caching pattern is fallback-only, not cache-aside)

## Conventions
- All methods return Mono for reactive composition
- Uses fallback-only caching: HTTP first, cache on error
- Applies resilience decorators: timeout, circuit breaker, retry
- Cache updates happen on success only

## Warnings
- Changing cache pattern from fallback-only to cache-aside will break inventory freshness guarantees
- The -1 backordered sentinel value is part of the API contract
- Cache is intentionally NOT checked before HTTP call
