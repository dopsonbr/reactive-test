# Contents

| File | Description |
|------|-------------|
| `SecurityConfig.java` | Main security filter chain with OAuth2 resource server and endpoint authorization rules |
| `JwtAuthenticationConverter.java` | Extracts scopes from JWT claims and converts to Spring Security authorities |
| `JwtValidatorConfig.java` | Custom JWT validators for audience, issuer, and expiration with clock skew tolerance |
| `OAuth2ClientConfig.java` | OAuth2 client credentials configuration with in-memory token caching for downstream calls |
| `SecurityErrorHandler.java` | Handles authentication and authorization errors with structured JSON responses |
| `SecurityProperties.java` | Configuration properties binding for app.security settings |
