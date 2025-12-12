# Controller

## Boundaries
Files that require careful review before changes:
- InventoryController.java (API contract affects product-service and merchant portal)

## Conventions
- Service-to-service endpoints return DTOs
- Merchant portal endpoints return entities
- All methods return Mono or Flux

## Warnings
- Changing response types breaks downstream service contracts
