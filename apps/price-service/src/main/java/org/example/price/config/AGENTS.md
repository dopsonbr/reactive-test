# org.example.price.config

## Boundaries
Files that require careful review before changes:
- `FlywayConfiguration.java` - Required for R2DBC + Flyway compatibility

## Conventions
- DataSource uses spring.datasource.* properties
- @FlywayDataSource annotation ensures isolation from R2DBC ConnectionFactory

## Warnings
- Do not remove FlywayConfiguration; R2DBC applications need explicit JDBC DataSource for migrations
