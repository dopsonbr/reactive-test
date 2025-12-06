# Spring Authorization Server for Platform Authentication

* Status: approved
* Deciders: Platform Team, Security Team
* Date: 2025-12-06
* Supersedes: [ADR-005 User Service Authentication Strategy](005_user_service_authentication_strategy.md)

## Context and Problem Statement

The platform requires authentication and authorization for three user types: SERVICE_ACCOUNT (self-checkout kiosks), CUSTOMER (B2C online), and EMPLOYEE (in-store assisted selling). ADR-005 proposed a "Hybrid IdP Model" where the User Service would issue JWTs using custom code (jjwt library) with manual JWK endpoint implementation.

Upon further analysis, this approach requires implementing OAuth/OIDC functionality from scratch—token issuance, JWK endpoints, refresh token handling, key rotation—that Spring Authorization Server already provides. Additionally, the focus on local development with fake accounts (no external auth provider) makes a self-contained OAuth server more practical than the multi-issuer complexity proposed in ADR-005.

## Decision Drivers

1. **Standards compliance**: OAuth 2.1 and OpenID Connect 1.0 compatibility for future integrations
2. **Local development focus**: Must work entirely offline with fake accounts, no external IdP dependency
3. **Reduced implementation effort**: Leverage Spring Authorization Server instead of custom JWT code
4. **Simplified consuming services**: Standard Spring Security OAuth2 Resource Server configuration
5. **Custom claims support**: User type, permissions, and store number in access tokens
6. **Grant type flexibility**: Different authentication flows for different user types

## Considered Options

1. **Spring Authorization Server** - Official Spring OAuth2 authorization server (chosen)
2. **Custom JWT Issuance (ADR-005)** - Build token issuance with jjwt library
3. **Keycloak** - External identity provider with Docker deployment
4. **Auth0/Okta Development Tenant** - Cloud-hosted development IdP

## Decision Outcome

Chosen option: **Spring Authorization Server**

The User Service embeds Spring Authorization Server, providing a fully compliant OAuth 2.1 authorization server with built-in JWK endpoints, token customization, and multiple grant types. This replaces the custom JWT implementation proposed in ADR-005.

### Architecture

```
user-service (Port 8084)
├── Spring Authorization Server
│   ├── POST /oauth2/token              ← Token endpoint (all grant types)
│   ├── GET  /oauth2/authorize          ← Authorization code flow
│   ├── POST /oauth2/revoke             ← Token revocation
│   ├── POST /oauth2/introspect         ← Token introspection
│   ├── GET  /.well-known/jwks.json     ← JWK Set (auto-generated)
│   └── GET  /.well-known/openid-configuration ← OIDC Discovery
├── Dev Support (dev profile only)
│   ├── POST /dev/token                 ← Instant token without password
│   └── POST /dev/users/fake            ← Create fake user on-the-fly
├── User Management
│   ├── GET/POST/PUT /users             ← User CRUD
│   └── GET/PUT /users/{id}/preferences ← User preferences
└── PostgreSQL
    ├── users                           ← User accounts
    ├── user_preferences                ← User preferences
    └── oauth2_registered_client        ← OAuth clients (Spring Auth Server)
```

### Grant Types by User Type

| User Type | OAuth Grant | Use Case |
|-----------|-------------|----------|
| SERVICE_ACCOUNT | `client_credentials` | Kiosk authenticates with client ID/secret, no user interaction |
| CUSTOMER | `authorization_code` | Standard web login flow with consent |
| EMPLOYEE | `password` (dev) / `authorization_code` (prod) | POS terminal login |

### Token Claims

Access tokens include custom claims for authorization:

```json
{
  "iss": "http://user-service:8084",
  "sub": "user-uuid",
  "aud": ["reactive-platform"],
  "user_type": "EMPLOYEE",
  "permissions": ["read", "write", "admin", "customer_search"],
  "scope": "read write admin customer_search",
  "store_number": 1234,
  "iat": 1733500000,
  "exp": 1733503600
}
```

### Positive Consequences

- **Full OAuth 2.1 compliance**: Works with any standard OAuth client library
- **Built-in JWK endpoint**: No custom implementation, automatic key exposure
- **Token introspection/revocation**: Standard endpoints for token management
- **Key rotation support**: Spring Authorization Server handles RSA key lifecycle
- **Simplified consuming services**: Just `issuer-uri` configuration, no multi-issuer complexity
- **Dev-friendly**: `/dev/token` endpoint for instant testing without OAuth flow
- **Future-proof**: Can add federated identity providers later via Spring Security

### Negative Consequences

- **Additional dependency**: `spring-security-oauth2-authorization-server`
- **Learning curve**: Team must understand Spring Authorization Server configuration
- **Database tables**: Spring Auth Server requires additional tables for clients/authorizations

## Comparison with ADR-005 (Superseded)

| Aspect | ADR-005 (Custom JWT) | ADR-011 (Spring Auth Server) |
|--------|---------------------|------------------------------|
| OAuth compliance | Custom, non-standard | Full OAuth 2.1 + OIDC |
| JWK endpoint | Manual implementation (~200 LOC) | Built-in |
| Key rotation | Must build | Built-in |
| Token revocation | Custom refresh_tokens table | Built-in with introspection |
| Grant types | Custom `/auth/token` only | client_credentials, password, auth_code, refresh |
| Consuming service config | Multi-issuer decoder | Standard `issuer-uri` |
| Implementation effort | ~2000+ lines | ~300 lines (configuration) |
| Local dev story | Manual seeding | `/dev/token` + seeded clients |

## Pros and Cons of the Options

### Spring Authorization Server (chosen)

**Good**
- Standards-compliant OAuth 2.1 and OIDC 1.0
- Built-in JWK, introspection, revocation endpoints
- Token customization via `OAuth2TokenCustomizer`
- Multiple grant types for different user types
- Spring Security team maintains and updates
- Works with any OAuth client library
- Future path to federated identity

**Bad**
- Additional Spring dependency to manage
- More complex initial configuration than simple JWT
- Database tables for OAuth clients/tokens

### Custom JWT Issuance (ADR-005)

**Good**
- Full control over token format
- Minimal dependencies (jjwt only)
- Simple mental model (generate and validate JWT)

**Bad**
- Must implement JWK endpoint manually
- No standard OAuth flows
- Custom token refresh handling
- No introspection/revocation support
- Multi-issuer complexity in consuming services
- Significant implementation effort

### Keycloak

**Good**
- Full-featured identity provider
- Admin UI for user management
- Federation, MFA, social login built-in

**Bad**
- Heavy Docker container (~500MB)
- Separate service to manage
- Over-engineered for current requirements
- Additional operational complexity

### Auth0/Okta Development Tenant

**Good**
- Zero infrastructure to manage
- Enterprise-grade security
- Rich feature set

**Bad**
- Requires internet connectivity
- Cannot run fully offline
- External dependency for local development
- Cost at scale

## Implementation Notes

### Consuming Service Configuration

With Spring Authorization Server, consuming services use standard Spring Security:

```yaml
# product-service application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://user-service:8084
```

Spring Security automatically:
- Fetches `/.well-known/openid-configuration`
- Retrieves JWK Set from `jwks_uri`
- Validates token signatures and claims

### Local Development Flow

```bash
# 1. Get token instantly (no password required in dev)
curl -X POST http://localhost:8084/dev/token \
  -H "Content-Type: application/json" \
  -d '{"username": "test-employee", "userType": "EMPLOYEE", "storeNumber": 1234}'

# 2. Use token with other services
curl http://localhost:8080/products/SKU-001 \
  -H "Authorization: Bearer <token>"
```

### Pre-seeded OAuth Clients (dev profile)

```yaml
spring:
  security:
    oauth2:
      authorizationserver:
        client:
          kiosk-client:
            registration:
              client-id: "kiosk"
              client-secret: "{noop}kiosk-secret"
              authorization-grant-types:
                - client_credentials
              scopes:
                - read
          dev-client:
            registration:
              client-id: "dev"
              client-secret: "{noop}dev-secret"
              authorization-grant-types:
                - password
                - refresh_token
              scopes:
                - read
                - write
                - admin
                - customer_search
```

## References

- [Spring Authorization Server Documentation](https://docs.spring.io/spring-authorization-server/reference/)
- [OAuth 2.1 Specification](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-07)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- `docs/archive/not-implemented/016_USER_SERVICE.md` - Previous implementation plan (superseded)
- `docs/ADRs/005_user_service_authentication_strategy.md` - Previous ADR (superseded by this document)
