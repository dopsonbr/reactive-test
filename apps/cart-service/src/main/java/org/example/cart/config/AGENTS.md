# Config

## Boundaries
Files requiring careful review: SecurityConfig.java (authorization rules affect API access), R2dbcConfiguration.java (JSONB converter changes impact persistence)

## Conventions
- All cart API endpoints require authentication except /actuator/**
- Scope-based authorization: cart:read for GET, cart:write for POST/PUT/DELETE, cart:admin for admin operations
- JSONB columns must use JsonValue wrapper type

## Warnings
- Authorization rules are path-based; endpoint path changes require SecurityConfig updates
- JWT validation requires spring.security.oauth2.resourceserver.jwt properties in application.yml
- JsonValue wrapper prevents String converter from applying to JSONB columns
