# config

## Boundaries
Files requiring careful review: none

## Conventions
- All R2DBC services must provide a separate JDBC DataSource for Flyway
- Use `@FlywayDataSource` qualifier to prevent bean conflicts

## Warnings
- Removing this configuration will break database migrations
- Do not modify unless upgrading Spring Boot or changing persistence technology
