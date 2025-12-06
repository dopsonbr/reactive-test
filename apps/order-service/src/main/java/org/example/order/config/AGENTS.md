# config

## Boundaries
Files that require careful review before changes: R2dbcConfiguration.java

## Conventions
- All custom R2DBC converters must be registered in R2dbcCustomConversions bean
- Use PostgresDialect.INSTANCE for PostgreSQL-specific configuration
- Converters must be annotated with @ReadingConverter or @WritingConverter

## Warnings
- Modifying converters affects all JsonValue fields across all entities
- Converter changes require database compatibility testing
- Do not register conflicting converters for the same type pairs
