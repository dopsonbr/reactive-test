# controller

## Purpose
Exposes REST endpoints for user management, JWT token generation, and OIDC well-known endpoints.

## Behavior
Handles HTTP requests for user CRUD, preference updates, and JWT token issuance. DevTokenController provides testing endpoints for generating tokens without authentication in non-prod environments.

## Quirks
- DevTokenController only active when dev/test profiles enabled
- WellKnownController serves OIDC discovery and JWKS endpoints
