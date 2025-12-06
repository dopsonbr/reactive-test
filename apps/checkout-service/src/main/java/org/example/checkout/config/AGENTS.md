# config

## Boundaries

Files that require careful review before changes:
- `SecurityConfig.java` - OAuth2 configuration affects all endpoint authorization
- `R2dbcConfiguration.java` - JSON converters affect all database operations

## Conventions

- R2DBC uses custom ReadingConverter and WritingConverter for JSONB columns
- Security uses JwtAuthenticationConverter from platform-security
- Scopes: checkout:read for queries, checkout:write for mutations
- CSRF disabled for stateless API

## Warnings

- Changing JSON converters breaks existing data compatibility
- Actuator endpoint security controlled by Spring profiles (dev vs prod)
- JWT issuer-uri must match OAuth2 provider configuration
