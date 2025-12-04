# Cart Repository

## Boundaries

Files that require careful review before changes:
- `CartRepository.java` - Interface contract used by service layer
- `CartEntity.java` - Must match database schema (migration scripts)
- `PostgresCartRepository.java` - Changes affect JSONB serialization and data integrity

## Conventions

- CartRepository returns domain Cart objects, never CartEntity
- All database operations are reactive (return Mono/Flux)
- Cart ID is UUID in database, String in domain
- JSONB columns used for nested collections (products, discounts, fulfillments, totals)
- Empty collections deserialize to empty lists, not null
- JSON serialization errors propagate as reactive error signals

## Warnings

- Changing CartEntity fields requires corresponding database migration
- JSONB column changes can break existing data without migration
- Do not expose CartEntity outside this package
- UUID conversion failures return Mono.error, not null
- ObjectMapper must be configured for domain model types
