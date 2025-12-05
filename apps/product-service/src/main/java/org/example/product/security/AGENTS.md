# Security

## Boundaries
Files that require careful review before changes: SecurityConfig.java (authorization rules affect all endpoints)

## Conventions
- All API endpoints require authentication except `/actuator/health/**`, `/actuator/info`, `/actuator/prometheus`
- OAuth2 client uses `@ConditionalOnProperty` to disable in tests
- Platform security components (JwtAuthenticationConverter, SecurityErrorHandler) are injected from `platform-security`

## Warnings
- Changing path matchers in SecurityConfig affects authentication for all requests
- OAuth2ClientConfig requires `downstream-services` client registration in application.yml
