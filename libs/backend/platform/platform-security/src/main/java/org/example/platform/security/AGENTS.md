# Security

## Boundaries
Files requiring careful review: SecurityConfig.java (endpoint rules affect all authentication/authorization), JwtValidatorConfig.java (validation failures block all requests)

## Conventions
- All scopes must be prefixed with "SCOPE_" for Spring Security authorities
- Security error responses use the shared ErrorResponse model
- OAuth2 client uses "downstream-services" registration ID
- JWT validation is conditional on app.security.enabled=true

## Warnings
- Disabling CSRF is safe only for stateless JWT-based APIs
- OAuth2ClientConfig requires spring.security.oauth2.client.registration.downstream-services in config
- Changing allowed issuers or required audience will invalidate existing tokens
- In-memory token cache is lost on restart
