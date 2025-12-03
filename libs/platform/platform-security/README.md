# Platform Security

OAuth2/JWT validation configuration for resource servers.

## Features

- JWT token validation
- Configurable issuers and audiences
- Role extraction from JWT claims
- Security error handling with consistent responses
- Client credentials support for downstream calls

## Usage

### Resource Server Configuration

Import in your application:

```java
@SpringBootApplication
@Import(JwtValidatorConfig.class)
public class MyApplication {
}
```

Or rely on auto-configuration via component scanning.

### Security Properties

```yaml
app:
  security:
    enabled: true
    jwk-set-uri: ${OAUTH_JWKS_URI:http://auth-server/.well-known/jwks.json}
    allowed-issuers:
      - ${OAUTH_ISSUER_URI:http://auth-server}
      - test-issuer
    required-audience: ${OAUTH_AUDIENCE:my-api}
    clock-skew-seconds: 30
```

### Spring Security OAuth2 Config

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${OAUTH_ISSUER_URI:http://auth-server}
          jwk-set-uri: ${OAUTH_JWKS_URI:http://auth-server/.well-known/jwks.json}
```

### Client Credentials for Downstream Calls

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          downstream-services:
            client-id: ${CLIENT_ID:my-client}
            client-secret: ${CLIENT_SECRET:secret}
            authorization-grant-type: client_credentials
            scope: service:read,service:write
            provider: downstream-auth
        provider:
          downstream-auth:
            token-uri: ${TOKEN_URI:http://auth-server/oauth/token}
```

## Classes

| Class | Purpose |
|-------|---------|
| `JwtValidatorConfig` | JWT validation configuration |
| `JwtAuthenticationConverter` | Extracts roles from JWT claims |
| `SecurityProperties` | Configuration properties |
| `SecurityErrorHandler` | Consistent error responses |

## JWT Claims

Expected JWT structure:

```json
{
  "iss": "http://auth-server",
  "aud": "my-api",
  "sub": "user-id",
  "exp": 1234567890,
  "iat": 1234567800,
  "scope": "read write",
  "roles": ["ROLE_USER", "ROLE_ADMIN"]
}
```

## Security Error Responses

All security errors return consistent JSON:

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "path": "/api/resource",
  "status": 401
}
```

## Testing

Use `TestSecurityConfig` from `platform-test`:

```java
@SpringBootTest
@Import(TestSecurityConfig.class)
class SecurityTest {

    @Test
    void testWithToken() {
        String token = TestJwtBuilder.builder()
            .subject("user-123")
            .claim("roles", List.of("ROLE_USER"))
            .build();

        webTestClient.get()
            .uri("/api/resource")
            .header("Authorization", "Bearer " + token)
            .exchange()
            .expectStatus().isOk();
    }
}
```

## Disabling Security

For development/testing:

```yaml
app:
  security:
    enabled: false
```

Or use `TestSecurityConfig` which provides a permissive configuration.
