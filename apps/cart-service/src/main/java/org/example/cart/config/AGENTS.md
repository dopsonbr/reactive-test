# Config

## Boundaries
Files that require careful review before changes: SecurityConfig.java (authorization rules affect API access control)

## Conventions
- All cart API endpoints require authentication except /actuator/**.
- Scope-based authorization: cart:read for GET, cart:write for POST/PUT/DELETE.

## Warnings
- Authorization rules are path-based; changing endpoint paths requires updating SecurityConfig.
- JWT validation requires proper spring.security.oauth2.resourceserver.jwt properties in application.yml.
