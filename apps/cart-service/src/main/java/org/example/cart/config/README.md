# Config

## Purpose
Configures security and database connectivity for cart-service.

## Behavior
SecurityConfig enforces JWT-based OAuth2 authentication with scope-based authorization; R2dbcConfiguration registers custom converters for PostgreSQL JSONB column mapping.

## Quirks
- CSRF protection disabled for stateless JWT authentication
- Scope authorities prefixed with "SCOPE_" by Spring Security
- JsonValue wrapper prevents converter from applying to non-JSON VARCHAR columns
