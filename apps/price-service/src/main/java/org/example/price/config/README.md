# org.example.price.config

## Purpose
Configures Flyway database migrations for R2DBC-based applications.

## Behavior
Creates a separate JDBC DataSource exclusively for Flyway, working around Spring Boot 4.0's behavior of not auto-configuring JDBC when R2DBC is present.

## Quirks
- Required because R2DBC ConnectionFactory does not support Flyway migrations
- DataSource is annotated with @FlywayDataSource to isolate it from application data access
