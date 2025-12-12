# repository.entity

## Boundaries
none

## Conventions
- All entities are immutable records
- Use @Table and @Column for explicit mappings
- Column names match database schema defined in Flyway migrations

## Warnings
- Schema changes require corresponding Flyway migrations
- Entity field types must match R2DBC driver capabilities
