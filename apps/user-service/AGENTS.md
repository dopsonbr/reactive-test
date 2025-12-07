# User Service

## Boundaries

Files that require careful review before changes:

| File | Reason |
|------|--------|
| `JwtConfig.java` | RSA key generation affects token signing across all services |
| `JwtService.java` | Token structure affects all consuming services |
| `db/migration/*.sql` | Schema changes require migration |
| `SecurityConfig.java` | Security configuration affects endpoint access |

## Conventions

- All dev endpoints are under `/dev/*` prefix
- Token expiration is 24 hours in dev mode
- User types follow strict enum: SERVICE_ACCOUNT, CUSTOMER, EMPLOYEE
- Passwords use BCrypt encoding (even though dev mode doesn't validate)
- All reactive streams use `Mono.defer()` for lazy evaluation in switchIfEmpty

## Warnings

- **Never expose dev endpoints in production** - `@Profile({"dev", "docker", "default"})` restricts access
- **RSA keys regenerate on restart** - Keys are generated at startup, not persisted
- **Token issuer must match** - Consuming services must use matching `issuer-uri`
- **Database migrations are versioned** - Never modify existing V001, V002, V003 files
