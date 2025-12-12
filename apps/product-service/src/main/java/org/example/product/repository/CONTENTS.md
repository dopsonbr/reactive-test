# Contents

| File | Description |
|------|-------------|
| `catalog/CatalogSearchRepository.java` | Searches products via Catalog Service with resilience patterns |
| `inventory/InventoryRepository.java` | Fetches available quantity with fallback-only caching |
| `inventory/InventoryResponse.java` | Response record containing available quantity |
| `merchandise/MerchandiseRepository.java` | Fetches product metadata with cache-aside pattern |
| `merchandise/MerchandiseResponse.java` | Response record containing product metadata |
| `price/PriceRepository.java` | Fetches product price with cache-aside pattern |
| `price/PriceResponse.java` | Response record containing price and currency |
