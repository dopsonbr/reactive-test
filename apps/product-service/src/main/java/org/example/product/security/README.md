# Security

## Purpose
Configures OAuth2 authentication for inbound requests (resource server) and outbound downstream service calls (client credentials).

## Behavior
Validates JWT tokens on all API endpoints except health checks, and automatically adds OAuth2 bearer tokens to outbound WebClient requests. Tokens are cached in-memory until expiration, then automatically refreshed.

## Quirks
- OAuth2 client is disabled in tests via `app.security.oauth2-client.enabled=false`
- Uses single client registration `downstream-services` for all outbound requests
- CSRF protection disabled for stateless API operation
