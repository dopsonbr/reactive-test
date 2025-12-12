# config

## Purpose
Resolves R2DBC-Flyway DataSource incompatibility in Spring Boot 4.0.

## Behavior
Manually creates a JDBC DataSource for Flyway migrations when R2DBC ConnectionFactory is present.

## Quirks
- Required because Spring Boot 4.0 skips JDBC DataSource autoconfiguration when R2DBC is detected
- Uses `@FlywayDataSource` qualifier to distinguish from R2DBC ConnectionFactory
