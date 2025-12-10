# repository

## Boundaries

Files that require careful review before changes:
- `PostgresOrderRepository.java` - JSON serialization logic affects all nested data
- `OrderEntity.java` - schema changes require database migrations

## Conventions

- OrderRepository is the domain interface
- PostgresOrderRepository handles entity mapping and JSON serialization
- OrderEntityRepository extends ReactiveCrudRepository for Spring Data R2DBC
- Nested objects stored as JSONB using JsonValue wrapper
- OrderEntity implements `Persistable<UUID>` for insert vs update detection

## Warnings

- Changing JSON serialization breaks existing data compatibility
- orderId is the business identifier, id is the database primary key
- JSONB columns require custom R2DBC converters in R2dbcConfiguration
- Query by store number uses custom repository method
