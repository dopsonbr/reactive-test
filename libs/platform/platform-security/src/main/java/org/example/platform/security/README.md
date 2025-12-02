# Security

## Purpose
Implements OAuth2 resource server authentication and authorization using JWT bearer tokens to protect API endpoints and enable secure downstream service calls.

## Behavior
Validates inbound JWT tokens against configured JWK Set URI, extracting scopes from multiple claim formats and converting them to Spring Security authorities. Returns structured 401/403 JSON error responses when authentication or authorization fails. Provides OAuth2 client credentials flow with in-memory token caching for outbound service calls.

## Quirks
- Supports three scope claim formats: "scope" (OAuth2 standard), "scp" (Azure AD), and "scopes" (array)
- All scopes are prefixed with "SCOPE_" when converted to GrantedAuthority
- Security can be disabled via app.security.enabled=false for testing
- OAuth2 client tokens are cached in memory until expiration, then auto-refreshed
- Actuator health/info/prometheus endpoints are public, all others require authentication
