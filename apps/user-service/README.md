# User Service

## Purpose

Centralized identity provider for the reactive platform, providing JWT tokens for authentication and authorization across all services.

## Behavior

The user-service acts as an OAuth2/OIDC-compatible identity provider:

1. **Dev Token Endpoint** (`/dev/token`) - Generates JWT tokens instantly without password validation for rapid local development
2. **OIDC Discovery** (`/.well-known/*`) - Standard OpenID Connect endpoints for token verification by consuming services
3. **User Management** (`/users/*`) - CRUD operations for user accounts and preferences

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/dev/token` | Generate dev token (no auth required) |
| POST | `/dev/users/fake` | Create fake user for testing |
| GET | `/dev/users` | List all users |
| GET | `/.well-known/openid-configuration` | OIDC discovery metadata |
| GET | `/.well-known/jwks.json` | JWK Set for token verification |
| GET | `/users/{id}` | Get user by ID |
| POST | `/users` | Create new user |
| PUT | `/users/{id}` | Update user |
| GET | `/users/{id}/preferences` | Get user preferences |
| PUT | `/users/{id}/preferences` | Update user preferences |

## User Types

| Type | Default Permissions | Description |
|------|---------------------|-------------|
| SERVICE_ACCOUNT | read | Machine-to-machine (kiosks, services) |
| CUSTOMER | read, write | Customer users |
| EMPLOYEE | read, write, admin, customer_search | Store employees with full access |

## Seeded Dev Users

The service seeds these users for local development:

| Username | Password | Type | Store |
|----------|----------|------|-------|
| dev-employee | dev123 | EMPLOYEE | 1234 |
| dev-customer | dev123 | CUSTOMER | - |
| dev-kiosk | dev123 | SERVICE_ACCOUNT | - |

## Quick Start

```bash
# Get a dev token instantly
curl -X POST http://localhost:8089/dev/token \
  -H "Content-Type: application/json" \
  -d '{"username": "dev-employee", "userType": "EMPLOYEE", "storeNumber": 1234}'

# Use the token
curl http://localhost:8080/products/SKU-001 \
  -H "Authorization: Bearer <token>"
```

## JWT Token Structure

```json
{
  "iss": "http://localhost:8089",
  "sub": "11111111-1111-1111-1111-111111111111",
  "username": "dev-employee",
  "user_type": "EMPLOYEE",
  "permissions": ["READ", "WRITE", "ADMIN", "CUSTOMER_SEARCH"],
  "scope": "read write admin customer_search",
  "store_number": 1234,
  "aud": "reactive-platform",
  "exp": 1735135200,
  "iat": 1735048800,
  "jti": "..."
}
```

## Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `server.port` | 8089 | Service port |
| `jwt.issuer` | http://localhost:8089 | JWT issuer claim |
| `spring.r2dbc.url` | r2dbc:postgresql://localhost:5432/userdb | Database URL |

## Docker Compose

```yaml
user-service:
  build:
    context: ..
    dockerfile: docker/Dockerfile.user-service
  ports:
    - "8089:8089"
  environment:
    - SPRING_PROFILES_ACTIVE=docker
```

## Consuming Service Configuration

Other services validate tokens from user-service with minimal configuration:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${USER_SERVICE_URL:http://localhost:8089}
```

Spring Security automatically fetches OIDC metadata and validates tokens.
