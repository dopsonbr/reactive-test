# Service

## Boundaries
Files that require careful review before changes:
- InventoryService.java (business logic affects all endpoints)

## Conventions
- All methods return Mono or Flux
- Use R2dbcEntityTemplate.insert() for new records with pre-assigned IDs
- Transform entities to DTOs for service-to-service responses

## Warnings
- Never use repository.save() for new entities - R2DBC interprets non-null ID as existing record
