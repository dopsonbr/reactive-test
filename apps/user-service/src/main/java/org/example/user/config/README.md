# config

## Purpose
Configures application security, JWT token signing, and database migration for the user service.

## Behavior
Sets up Spring Security with JWT validation, configures JWK source for token signing, and provides separate Flyway DataSource for schema migrations with reactive R2DBC for queries.
