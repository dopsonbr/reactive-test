# security

## Boundaries

Files that require careful review before changes:
- `SecurityConfig.java` - affects all endpoint authorization

## Conventions

- Uses JwtAuthenticationConverter from platform-security
- All /customers/** endpoints require authentication
- Scopes: customer:read for queries, customer:write for mutations, customer:delete for deletion
- CSRF disabled for stateless API
- Actuator endpoints controlled by Spring profiles (dev vs prod)

## Warnings

- Customer delete has separate scope from write operations
- Changing actuator access rules affects monitoring and debugging
- Scopes defined must match OAuth2 provider configuration
