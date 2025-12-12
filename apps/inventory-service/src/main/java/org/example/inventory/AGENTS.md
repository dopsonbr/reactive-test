# Inventory Service

## Boundaries
Files that require careful review before changes:
- InventoryServiceApplication.java (scanBasePackages affects platform integration)

## Conventions
- All service methods return Mono or Flux
- DTOs for service-to-service, entities for merchant portal
- Use R2dbcEntityTemplate.insert() for new records with non-null IDs

## Warnings
- Never use repository.save() for new entities with pre-assigned SKUs - use template.insert()
- Flyway DataSource is separate from R2DBC connection pool
