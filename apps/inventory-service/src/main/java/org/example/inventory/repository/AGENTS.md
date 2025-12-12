# Repository

## Boundaries
Files that require careful review before changes:
- StockEntity.java (schema changes require migration)

## Conventions
- Entity is immutable record
- Repository extends R2dbcRepository
- Custom query methods follow Spring Data naming

## Warnings
- Do not use repository.save() for new entities with pre-assigned SKUs
