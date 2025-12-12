# config

## Purpose
Provides infrastructure configuration for R2DBC and Flyway migration support.

## Behavior
Creates a JDBC DataSource for Flyway migrations since Spring Boot 4.0 does not auto-create one when R2DBC is present.

## Quirks
- Requires manual DataSource bean creation when using R2DBC
- FlywayDataSource annotation ensures Flyway uses the correct DataSource
