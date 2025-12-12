# DTO

## Boundaries
Files that require careful review before changes:
- InventoryResponse.java (service contract affects product-service)

## Conventions
- All DTOs are immutable records
- Request DTOs include Jakarta validation annotations
- Response DTOs contain only necessary fields

## Warnings
- Changing InventoryResponse breaks product-service contract
