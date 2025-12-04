# Config

## Purpose
Configures OAuth2 resource server security for cart-service API endpoints.

## Behavior
Enforces JWT-based authentication and scope-based authorization, requiring cart:read for GET operations and cart:write for modifications, while allowing public access to actuator endpoints.

## Quirks
- CSRF protection is disabled (stateless JWT authentication).
- Scope authorities are prefixed with "SCOPE_" by Spring Security.
