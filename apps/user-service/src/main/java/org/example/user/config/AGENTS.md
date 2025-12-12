# config

## Boundaries
All files require careful review before changes.

## Conventions
- JWK source uses in-memory keys for dev, externalize for prod
- Security config permits actuator endpoints without authentication
- Flyway uses blocking JDBC, R2DBC for application queries

## Warnings
- Changing JWT configuration breaks existing tokens
- FlywayConfiguration must run before R2DBC initialization
