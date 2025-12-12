# org.example.price.repository

## Boundaries
Files that require careful review before changes:
- `PriceEntity.java` - Column mappings must match Flyway schema

## Conventions
- Entity is immutable record
- Use @Column for snake_case database columns
- Repository extends R2dbcRepository for reactive operations

## Warnings
- R2DBC treats non-null @Id as existing entity; use R2dbcEntityTemplate.insert() for new records
