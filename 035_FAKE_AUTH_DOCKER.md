# 035_FAKE_AUTH_DOCKER

**Status: DRAFT**

---

## Overview

Implement a simple fake authentication solution for Docker testing that allows the frontend to "log in" as test users without a real OAuth2 provider. This enables end-to-end testing of authenticated flows in Docker Compose without external dependencies.

## Goals

1. Create a fake auth endpoint that returns test JWT tokens
2. Add a simple login UI to the frontend for Docker mode
3. Configure the frontend to send JWT tokens with API requests
4. Enable security on backend services in Docker while using fake tokens

## References

**Standards:**
- `docs/standards/backend/security.md` - JWT validation patterns

**Existing Code:**
- `libs/backend/platform/platform-security/` - JWT validation infrastructure
- `libs/backend/platform/platform-test/src/main/java/org/example/platform/test/TestJwtBuilder.java` - Test token generation

## Architecture

```
┌─────────────────────┐     ┌─────────────────────────────┐
│   ecommerce-web     │     │       wiremock              │
│   (React + nginx)   │────►│  /fake-auth/token           │
│                     │     │  (returns test JWT)         │
└─────────────────────┘     └─────────────────────────────┘
          │
          │ Authorization: Bearer <jwt>
          ▼
┌─────────────────────┐
│  Backend Services   │
│  (JWT validation)   │
└─────────────────────┘
```

### Approach: WireMock Fake Auth Endpoint

Use WireMock (already in Docker Compose) to serve fake JWT tokens. This avoids creating a new service and leverages existing infrastructure.

### Dependency Order

```
Phase 1 (WireMock stub)
        │
        ▼
Phase 2 (Frontend login)
        │
        ▼
Phase 3 (Enable security)
```

---

## Phase 1: WireMock Fake Auth Endpoint

**Prereqs:** WireMock container running in Docker Compose
**Blockers:** None

### 1.1 Create Static Test JWT

Generate a long-lived test JWT signed with a known key that WireMock can return.

**Files:**
- CREATE: `docker/wiremock/mappings/fake-auth.json`
- CREATE: `docker/wiremock/__files/fake-token-response.json`
- CREATE: `tools/generate-test-jwt.mjs` (one-time token generator)

**Implementation:**

The fake auth endpoint will return pre-generated JWTs for test users. We'll use a simple symmetric key (HS256) for Docker testing only.

`docker/wiremock/mappings/fake-auth.json`:
```json
{
  "request": {
    "method": "POST",
    "urlPath": "/fake-auth/token"
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    "jsonBody": {
      "access_token": "{{request.body.username}}",
      "token_type": "Bearer",
      "expires_in": 86400
    },
    "transformers": ["response-template"]
  }
}
```

For simplicity, we'll create predefined tokens for test users and return them based on username.

### 1.2 Create Predefined Test Users

**Files:**
- CREATE: `docker/wiremock/mappings/fake-auth-users.json`

Define test users with different permission levels:

| Username | Scopes | Purpose |
|----------|--------|---------|
| `admin` | `product:read product:write cart:read cart:write checkout:read checkout:write` | Full access |
| `customer` | `product:read cart:read cart:write checkout:write` | Normal customer |
| `readonly` | `product:read` | Read-only access |

### 1.3 Add CORS Preflight Handler

**Files:**
- CREATE: `docker/wiremock/mappings/fake-auth-cors.json`

Handle OPTIONS preflight for the fake auth endpoint.

---

## Phase 2: Frontend Login Component

**Prereqs:** Phase 1 complete, WireMock serving tokens
**Blockers:** None

### 2.1 Create Auth Context

**Files:**
- CREATE: `apps/ecommerce-web/src/context/AuthContext.tsx`

Simple React context to manage auth state:
- `isAuthenticated`: boolean
- `user`: { username, scopes }
- `token`: string | null
- `login(username)`: async function
- `logout()`: function

### 2.2 Create Login Component

**Files:**
- CREATE: `apps/ecommerce-web/src/features/auth/components/LoginForm.tsx`
- CREATE: `apps/ecommerce-web/src/features/auth/components/UserMenu.tsx`

Simple dropdown with predefined users (admin, customer, readonly) - no password needed for fake auth.

### 2.3 Update API Client to Send Token

**Files:**
- MODIFY: `libs/frontend/shared-data/api-client/src/lib/api-client.ts`

Add Authorization header when token is present:
```typescript
const token = sessionStorage.getItem('authToken');
if (token) {
  headers.set('Authorization', `Bearer ${token}`);
}
```

### 2.4 Add Auth Provider to App

**Files:**
- MODIFY: `apps/ecommerce-web/src/app/providers.tsx`
- MODIFY: `apps/ecommerce-web/src/app/App.tsx`

Wrap app with AuthProvider, add UserMenu to header.

---

## Phase 3: Backend Security Configuration

**Prereqs:** Phase 1 and 2 complete
**Blockers:** Need to ensure test JWT key matches backend validation

### 3.1 Create Docker-Specific JWT Decoder

**Files:**
- CREATE: `libs/backend/platform/platform-security/src/main/java/org/example/platform/security/FakeJwtDecoder.java`
- CREATE: `libs/backend/platform/platform-security/src/main/java/org/example/platform/security/FakeJwtConfig.java`

A JWT decoder that uses a symmetric key (matching what we generate tokens with) activated by profile `fake-auth`.

### 3.2 Update Docker Compose

**Files:**
- MODIFY: `docker/docker-compose.yml`

For services that need auth testing:
```yaml
environment:
  - SPRING_PROFILES_ACTIVE=docker,fake-auth
  - APP_SECURITY_ENABLED=true
```

### 3.3 Add Nginx Proxy for Fake Auth

**Files:**
- MODIFY: `docker/nginx-frontend.conf`

Add proxy for `/fake-auth` to WireMock:
```nginx
location /fake-auth {
    proxy_pass http://wiremock:8080/fake-auth;
}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `docker/wiremock/mappings/fake-auth.json` | Main fake auth endpoint |
| CREATE | `docker/wiremock/mappings/fake-auth-users.json` | Predefined user tokens |
| CREATE | `docker/wiremock/mappings/fake-auth-cors.json` | CORS preflight handling |
| CREATE | `apps/ecommerce-web/src/context/AuthContext.tsx` | Auth state management |
| CREATE | `apps/ecommerce-web/src/features/auth/components/LoginForm.tsx` | Login UI |
| CREATE | `apps/ecommerce-web/src/features/auth/components/UserMenu.tsx` | User menu dropdown |
| CREATE | `libs/backend/platform/platform-security/.../FakeJwtDecoder.java` | Symmetric key decoder |
| CREATE | `libs/backend/platform/platform-security/.../FakeJwtConfig.java` | Fake auth config |
| MODIFY | `libs/frontend/shared-data/api-client/src/lib/api-client.ts` | Add auth header |
| MODIFY | `apps/ecommerce-web/src/app/providers.tsx` | Add AuthProvider |
| MODIFY | `docker/docker-compose.yml` | Enable security with fake-auth profile |
| MODIFY | `docker/nginx-frontend.conf` | Proxy /fake-auth to WireMock |

---

## Testing Strategy

1. **Manual Testing:**
   - Start Docker Compose
   - Open http://localhost:3001
   - Click login, select user
   - Verify API calls include Authorization header
   - Verify backend accepts the token

2. **Verify Token Flow:**
   ```bash
   # Get token from WireMock
   curl -X POST http://localhost:8082/fake-auth/token \
     -H "Content-Type: application/json" \
     -d '{"username": "customer"}'

   # Use token with backend
   curl http://localhost:3001/products/search?q=test \
     -H "Authorization: Bearer <token>"
   ```

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add fake-auth profile to Docker section |
| `docker/README.md` | Document fake auth setup and test users |

---

## Checklist

- [ ] Phase 1: WireMock fake auth endpoint
- [ ] Phase 2: Frontend login component
- [ ] Phase 3: Backend security configuration
- [ ] Manual testing in Docker complete
- [ ] Documentation updated
