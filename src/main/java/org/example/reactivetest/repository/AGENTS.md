# Repository

## Boundaries
Carefully review changes to fallback values and cache key generation logic.

## Conventions
- All repositories return Mono with resilience decorators applied
- WebClient instances are injected per-service (priceWebClient, inventoryWebClient, merchandiseWebClient)
- Request/response models use Java records
- Cache keys follow pattern: "service:sku" (e.g., "inventory:12345")
- Redis operations never throw exceptions; failures are logged and ignored

## Warnings
- Changing fallback values affects downstream error handling behavior
- Cache TTL is configured per-repository (merchandise: 300s, inventory: 60s)
- InventoryRepository has both cache-aside (write on success) and fallback-only (read on error) patterns
- MerchandiseRepository uses cache-aside only (no fallback read from cache)
