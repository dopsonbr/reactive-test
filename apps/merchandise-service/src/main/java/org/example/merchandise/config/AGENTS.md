# config

## Boundaries
Files requiring careful review: FlywayConfiguration.java (affects database migrations)

## Conventions
- Use @FlywayDataSource annotation for Flyway-specific DataSource
- DataSource properties map to spring.datasource.* configuration

## Warnings
- Do not remove FlywayConfiguration when using R2DBC or migrations will fail
