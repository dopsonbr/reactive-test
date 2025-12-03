# platform-security

## Boundaries

Files requiring careful review before changes:
- `JwtValidatorConfig.java` - Security chain misconfiguration affects all protected endpoints
- `JwtAuthenticationConverter.java` - Role extraction errors impact authorization decisions

## Conventions

- Security can be disabled via `app.security.enabled=false` for local dev
- All security errors return consistent JSON via `SecurityErrorHandler`
- JWT claims must include `iss`, `aud`, `exp` for validation
- Roles extracted from `roles` or `scope` claims

## Warnings

- Changing issuer/audience validation affects all services using this library
- Clock skew defaults to 30 seconds; too high reduces security, too low causes false rejections
- Import `JwtValidatorConfig` explicitly or rely on component scanning
- Client credentials config (OAuth2ClientConfig) is application-specific, not in this library
