# Config

## Boundaries
Files that require careful review before changes:
- FlywayConfiguration.java (dual datasource setup affects migrations)

## Conventions
- Flyway uses blocking JDBC, service uses R2DBC
- DataSource properties come from spring.datasource namespace

## Warnings
- Do not remove @FlywayDataSource annotation - it isolates migration from R2DBC pool
