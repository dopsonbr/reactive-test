# org.example.user

## Purpose
Provides user authentication, authorization, and profile management with JWT token generation.

## Behavior
Exposes REST APIs for user CRUD operations, preference management, and JWT token generation. Issues signed tokens for authenticated users and validates requests via Spring Security.

## Quirks
- DevTokenController only available in dev/test profiles for testing without authentication
- JWT keys auto-generated on startup if not provided
- Uses reactive R2DBC for database access with separate Flyway DataSource
