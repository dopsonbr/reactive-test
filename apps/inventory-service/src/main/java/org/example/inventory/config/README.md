# Config

## Purpose
Configures Flyway for blocking schema migrations in an R2DBC reactive application.

## Behavior
Provides a separate JDBC DataSource for Flyway while the service uses R2DBC for queries.
