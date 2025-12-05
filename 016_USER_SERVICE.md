# 016_USER_SERVICE

**Status: DRAFT**

---

## Overview

Create a User Service that manages user contexts for three distinct channels: self-checkout (service accounts), B2C online (customer users), and in-store assisted selling (employee users). The service issues signed JWTs containing permission claims and enforces authorization based on user type, with special customer search capabilities restricted to employees only.

**Related Plans:**
- 015_CUSTOMER_SERVICE - Customer data management (User Service authenticates users who access customer data)

## Goals

1. Support three user types: service accounts, customers, and employees
2. Issue signed JWTs with permission claims (read, write, admin, customer_search)
3. Enforce customer search restriction to employee users only
4. Provide user authentication and token refresh capabilities
5. Follow established platform patterns for security, validation, and observability

## References

**Standards:**
- `docs/standards/security.md` - OAuth2/JWT patterns, scope-based authorization
- `docs/standards/validation.md` - Request validation pattern (mandatory)
- `docs/standards/architecture.md` - Layered architecture, package structure

**Templates:**
- `docs/templates/_template_controller.md` - REST controller pattern
- `docs/templates/_template_postgres_repository.md` - R2DBC repository pattern

**ADRs:**
- `docs/ADRs/002_write_data_store.md` - PostgreSQL for durable user storage

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Clients                                         │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐          │
│   │ Self-Checkout│    │   B2C Web    │    │  In-Store POS/Tablet │          │
│   │   (Kiosk)    │    │   (Online)   │    │    (Employee)        │          │
│   └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘          │
└──────────┼───────────────────┼───────────────────────┼──────────────────────┘
           │                   │                       │
           ▼                   ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           User Service (Port 8084)                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         AuthController                                  │ │
│  │   POST /auth/token      - Authenticate & issue JWT                     │ │
│  │   POST /auth/refresh    - Refresh expired token                        │ │
│  │   POST /auth/validate   - Validate token (internal)                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         UserController                                  │ │
│  │   GET  /users/{id}      - Get user profile                             │ │
│  │   POST /users           - Create user (admin only)                     │ │
│  │   PUT  /users/{id}      - Update user (admin only)                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│  ┌─────────────────┐  ┌────────────┴───────────┐  ┌─────────────────────┐  │
│  │  AuthService    │  │     UserService        │  │  TokenService       │  │
│  │  - authenticate │  │     - CRUD ops         │  │  - generateToken    │  │
│  │  - validateCreds│  │     - permission check │  │  - refreshToken     │  │
│  └────────┬────────┘  └────────────┬───────────┘  │  - validateToken    │  │
│           │                        │              └──────────┬──────────┘  │
│           │                        │                         │             │
│           ▼                        ▼                         ▼             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      UserRepository (R2DBC)                          │   │
│  │                         PostgreSQL                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

                              JWT Token Structure
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header:  { "alg": "RS256", "typ": "JWT" }                                  │
│  Payload: {                                                                 │
│    "sub": "user-uuid",                                                      │
│    "user_type": "EMPLOYEE|CUSTOMER|SERVICE_ACCOUNT",                        │
│    "permissions": ["read", "write", "admin", "customer_search"],            │
│    "store_number": 1234,           // For employees                         │
│    "iat": 1234567890,                                                       │
│    "exp": 1234571490                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Permission Model

| User Type       | Allowed Permissions                        | Use Case                    |
|-----------------|--------------------------------------------|-----------------------------|
| SERVICE_ACCOUNT | `read`                                     | Self-checkout kiosks        |
| CUSTOMER        | `read`, `write`                            | B2C online shopping         |
| EMPLOYEE        | `read`, `write`, `admin`, `customer_search`| In-store assisted selling   |

**Permission Definitions:**
- `read` - View products, prices, inventory, own profile
- `write` - Modify cart, place orders, update own profile
- `admin` - Manage users, override prices, process returns
- `customer_search` - Search customer records (EMPLOYEE ONLY)

### Package Naming

| Module | Package |
|--------|---------|
| user-service | `org.example.user` |
| user-service.controller | `org.example.user.controller` |
| user-service.service | `org.example.user.service` |
| user-service.repository | `org.example.user.repository` |
| user-service.model | `org.example.user.model` |
| user-service.config | `org.example.user.config` |

---

## Phase 1: Project Setup & Database Schema

### 1.1 Create Application Module

**Files:**
- CREATE: `apps/user-service/build.gradle.kts`
- MODIFY: `settings.gradle.kts`

**Implementation:**

```kotlin
// apps/user-service/build.gradle.kts
plugins {
    id("platform.application-conventions")
}

dependencies {
    implementation(platform(project(":libs:platform:platform-bom")))

    // Platform libraries
    implementation(project(":libs:platform:platform-logging"))
    implementation(project(":libs:platform:platform-error"))
    implementation(project(":libs:platform:platform-webflux"))
    implementation(project(":libs:platform:platform-cache"))

    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // R2DBC PostgreSQL
    implementation("org.postgresql:r2dbc-postgresql")

    // Flyway migrations (JDBC driver required)
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    // JWT generation and signing
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    // Password hashing
    implementation("org.springframework.security:spring-security-crypto")

    // Test dependencies
    testImplementation(project(":libs:platform:platform-test"))
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:r2dbc")
}
```

### 1.2 Database Schema

**Files:**
- CREATE: `apps/user-service/src/main/resources/db/migration/V001__create_users_table.sql`

**Implementation:**

```sql
-- V001__create_users_table.sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    user_type       VARCHAR(20) NOT NULL CHECK (user_type IN ('SERVICE_ACCOUNT', 'CUSTOMER', 'EMPLOYEE')),
    permissions     TEXT[] NOT NULL DEFAULT '{}',
    store_number    INTEGER,                    -- Required for EMPLOYEE, null for others
    email           VARCHAR(255),
    display_name    VARCHAR(200),
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ,

    -- Employees must have a store number
    CONSTRAINT chk_employee_store CHECK (
        user_type != 'EMPLOYEE' OR store_number IS NOT NULL
    )
);

-- Indexes for common queries
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_store_number ON users(store_number) WHERE store_number IS NOT NULL;
CREATE INDEX idx_users_active ON users(active) WHERE active = true;

-- Refresh tokens table for secure token refresh
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked         BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked = false;
```

### 1.3 Application Configuration

**Files:**
- CREATE: `apps/user-service/src/main/resources/application.yml`
- CREATE: `apps/user-service/src/main/java/org/example/user/UserServiceApplication.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/config/JwtProperties.java`

**Implementation:**

```yaml
# application.yml
server:
  port: 8084

spring:
  application:
    name: user-service
  r2dbc:
    url: r2dbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:userdb}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:postgres}
    pool:
      initial-size: 5
      max-size: 20
  flyway:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:userdb}
    user: ${DB_USER:postgres}
    password: ${DB_PASSWORD:postgres}
    locations: classpath:db/migration

jwt:
  private-key-path: ${JWT_PRIVATE_KEY_PATH:classpath:keys/private.pem}
  public-key-path: ${JWT_PUBLIC_KEY_PATH:classpath:keys/public.pem}
  issuer: user-service
  access-token-expiry: 1h
  refresh-token-expiry: 7d

management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  endpoint:
    health:
      show-details: when_authorized
```

---

## Phase 2: Domain Models & Repository

### 2.1 Domain Models

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/model/UserType.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/model/Permission.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/model/User.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/model/AuthToken.java`

**Implementation:**

```java
// UserType.java
public enum UserType {
    SERVICE_ACCOUNT,  // Self-checkout kiosks
    CUSTOMER,         // B2C online users
    EMPLOYEE          // In-store assisted selling
}

// Permission.java
public enum Permission {
    READ,             // View resources
    WRITE,            // Modify resources
    ADMIN,            // Administrative actions
    CUSTOMER_SEARCH   // Search customer records (EMPLOYEE only)
}

// User.java - Domain model
public record User(
    UUID id,
    String username,
    UserType userType,
    Set<Permission> permissions,
    Integer storeNumber,    // Required for EMPLOYEE
    String email,
    String displayName,
    boolean active,
    Instant createdAt,
    Instant updatedAt,
    Instant lastLoginAt
) {
    public boolean canSearchCustomers() {
        return userType == UserType.EMPLOYEE
            && permissions.contains(Permission.CUSTOMER_SEARCH);
    }
}

// AuthToken.java - Token response
public record AuthToken(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresIn,
    Set<Permission> permissions,
    UserType userType
) {}
```

### 2.2 Repository Layer

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/entity/UserEntity.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/entity/RefreshTokenEntity.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/UserSpringRepository.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/RefreshTokenSpringRepository.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/UserRepository.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/UserRepositoryImpl.java`

**Implementation:**

Per `docs/templates/_template_postgres_repository.md`:
- Entity records map database columns
- Spring Data interfaces extend `ReactiveCrudRepository`
- Domain repository interface defines business operations
- Implementation converts between domain and entity

---

## Phase 3: Authentication & Token Services

### 3.1 Token Service

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/service/TokenService.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/service/TokenServiceImpl.java`

**Implementation:**

```java
// TokenService.java
public interface TokenService {
    Mono<AuthToken> generateTokens(User user);
    Mono<AuthToken> refreshTokens(String refreshToken);
    Mono<User> validateAccessToken(String accessToken);
    Mono<Void> revokeRefreshToken(String refreshToken);
}
```

Key behaviors:
- Generate RS256-signed JWTs with user claims
- Include `user_type` and `permissions` array in payload
- Store refresh token hash (not plaintext) in database
- Validate token signature and expiry on refresh

### 3.2 Authentication Service

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/service/AuthService.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/service/AuthServiceImpl.java`

**Implementation:**

```java
// AuthService.java
public interface AuthService {
    Mono<AuthToken> authenticate(String username, String password);
    Mono<AuthToken> refreshToken(String refreshToken);
    Mono<Void> logout(String refreshToken);
}
```

Key behaviors:
- Validate credentials against stored password hash (BCrypt)
- Enforce permission rules based on user type
- Update `last_login_at` on successful authentication

---

## Phase 4: Controllers

### 4.1 Auth Controller

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/AuthController.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/dto/TokenRequest.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/dto/RefreshRequest.java`

**Implementation:**

Per `docs/templates/_template_controller.md`:

```java
@RestController
@RequestMapping("/auth")
public class AuthController {

    // POST /auth/token - Authenticate and issue JWT
    @PostMapping("/token")
    public Mono<ResponseEntity<AuthToken>> authenticate(
        @RequestBody @Valid TokenRequest request,
        ServerHttpRequest httpRequest
    ) {
        // Validate request, authenticate, return tokens
    }

    // POST /auth/refresh - Refresh expired token
    @PostMapping("/refresh")
    public Mono<ResponseEntity<AuthToken>> refresh(
        @RequestBody @Valid RefreshRequest request,
        ServerHttpRequest httpRequest
    ) {
        // Validate refresh token, issue new tokens
    }

    // POST /auth/validate - Validate token (internal use)
    @PostMapping("/validate")
    public Mono<ResponseEntity<User>> validate(
        @RequestHeader("Authorization") String authorization,
        ServerHttpRequest httpRequest
    ) {
        // Extract and validate token, return user info
    }
}
```

### 4.2 User Controller

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/UserController.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/dto/CreateUserRequest.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/dto/UpdateUserRequest.java`

**Implementation:**

```java
@RestController
@RequestMapping("/users")
public class UserController {

    // GET /users/{id} - Get user profile
    // Requires: read permission, can only view own profile unless admin
    @GetMapping("/{id}")
    public Mono<ResponseEntity<User>> getUser(
        @PathVariable UUID id,
        @RequestHeader("Authorization") String authorization
    ) { ... }

    // POST /users - Create user (admin only)
    @PostMapping
    public Mono<ResponseEntity<User>> createUser(
        @RequestBody @Valid CreateUserRequest request,
        @RequestHeader("Authorization") String authorization
    ) { ... }

    // PUT /users/{id} - Update user (admin only)
    @PutMapping("/{id}")
    public Mono<ResponseEntity<User>> updateUser(
        @PathVariable UUID id,
        @RequestBody @Valid UpdateUserRequest request,
        @RequestHeader("Authorization") String authorization
    ) { ... }
}
```

---

## Phase 5: Permission Enforcement

### 5.1 Permission Validation Filter

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/config/PermissionFilter.java`

**Implementation:**

```java
@Component
public class PermissionFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // Skip auth endpoints (they don't require existing token)
        if (exchange.getRequest().getPath().value().startsWith("/auth/token")) {
            return chain.filter(exchange);
        }

        // Extract token, validate, add user to context
        return extractAndValidateToken(exchange)
            .flatMap(user -> chain.filter(exchange)
                .contextWrite(ctx -> ctx.put("user", user)));
    }
}
```

### 5.2 Permission Enforcement in Services

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/service/PermissionService.java`

**Implementation:**

```java
@Service
public class PermissionService {

    public Mono<Void> requirePermission(Permission required) {
        return Mono.deferContextual(ctx -> {
            User user = ctx.get("user");
            if (!user.permissions().contains(required)) {
                return Mono.error(new AccessDeniedException(
                    "Permission denied: " + required));
            }
            return Mono.empty();
        });
    }

    public Mono<Void> requireCustomerSearchPermission() {
        return Mono.deferContextual(ctx -> {
            User user = ctx.get("user");
            if (!user.canSearchCustomers()) {
                return Mono.error(new AccessDeniedException(
                    "Customer search requires EMPLOYEE user type with CUSTOMER_SEARCH permission"));
            }
            return Mono.empty();
        });
    }
}
```

---

## Phase 6: Integration & Testing

### 6.1 Docker Configuration

**Files:**
- MODIFY: `docker/docker-compose.yml`

**Implementation:**

Add user-service with dedicated PostgreSQL database.

### 6.2 Integration Tests

**Files:**
- CREATE: `apps/user-service/src/test/java/org/example/user/AuthControllerIntegrationTest.java`
- CREATE: `apps/user-service/src/test/java/org/example/user/UserControllerIntegrationTest.java`
- CREATE: `apps/user-service/src/test/java/org/example/user/PermissionEnforcementTest.java`

**Test Scenarios:**

1. **Authentication Tests:**
   - Valid credentials return JWT with correct claims
   - Invalid credentials return 401
   - Inactive user cannot authenticate
   - Token refresh with valid refresh token
   - Token refresh with revoked token fails

2. **Permission Tests:**
   - SERVICE_ACCOUNT only gets `read` permission
   - CUSTOMER gets `read` and `write` permissions
   - EMPLOYEE gets all permissions including `customer_search`
   - Non-employee cannot access customer search

3. **User Management Tests:**
   - Only admin can create users
   - Users can view own profile
   - Admin can view any profile
   - Employee creation requires store_number

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/user-service/build.gradle.kts` | Application build configuration |
| CREATE | `apps/user-service/src/main/resources/application.yml` | Application configuration |
| CREATE | `apps/user-service/src/main/resources/db/migration/V001__create_users_table.sql` | Database schema |
| CREATE | `apps/user-service/src/main/java/org/example/user/UserServiceApplication.java` | Application entry point |
| CREATE | `apps/user-service/src/main/java/org/example/user/config/JwtProperties.java` | JWT configuration properties |
| CREATE | `apps/user-service/src/main/java/org/example/user/config/PermissionFilter.java` | Permission enforcement filter |
| CREATE | `apps/user-service/src/main/java/org/example/user/model/UserType.java` | User type enum |
| CREATE | `apps/user-service/src/main/java/org/example/user/model/Permission.java` | Permission enum |
| CREATE | `apps/user-service/src/main/java/org/example/user/model/User.java` | User domain model |
| CREATE | `apps/user-service/src/main/java/org/example/user/model/AuthToken.java` | Token response model |
| CREATE | `apps/user-service/src/main/java/org/example/user/repository/entity/UserEntity.java` | User database entity |
| CREATE | `apps/user-service/src/main/java/org/example/user/repository/entity/RefreshTokenEntity.java` | Refresh token entity |
| CREATE | `apps/user-service/src/main/java/org/example/user/repository/UserSpringRepository.java` | Spring Data interface |
| CREATE | `apps/user-service/src/main/java/org/example/user/repository/RefreshTokenSpringRepository.java` | Refresh token repository |
| CREATE | `apps/user-service/src/main/java/org/example/user/repository/UserRepository.java` | Domain repository interface |
| CREATE | `apps/user-service/src/main/java/org/example/user/repository/UserRepositoryImpl.java` | Repository implementation |
| CREATE | `apps/user-service/src/main/java/org/example/user/service/TokenService.java` | Token service interface |
| CREATE | `apps/user-service/src/main/java/org/example/user/service/TokenServiceImpl.java` | Token service implementation |
| CREATE | `apps/user-service/src/main/java/org/example/user/service/AuthService.java` | Auth service interface |
| CREATE | `apps/user-service/src/main/java/org/example/user/service/AuthServiceImpl.java` | Auth service implementation |
| CREATE | `apps/user-service/src/main/java/org/example/user/service/PermissionService.java` | Permission enforcement |
| CREATE | `apps/user-service/src/main/java/org/example/user/controller/AuthController.java` | Authentication endpoints |
| CREATE | `apps/user-service/src/main/java/org/example/user/controller/UserController.java` | User management endpoints |
| CREATE | `apps/user-service/src/main/java/org/example/user/controller/dto/*.java` | Request/response DTOs |
| MODIFY | `settings.gradle.kts` | Add user-service module |
| MODIFY | `docker/docker-compose.yml` | Add user-service and postgres |
| MODIFY | `CLAUDE.md` | Add user-service documentation |

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add user-service to Applications table (port 8084), add build/run commands |
| `apps/user-service/README.md` | API documentation, authentication flow, permission model |
| `apps/user-service/AGENTS.md` | AI guidance for user-service packages |

---

## Checklist

- [ ] Phase 1: Project setup, database schema, application config
- [ ] Phase 2: Domain models and repository layer
- [ ] Phase 3: Token and authentication services
- [ ] Phase 4: Auth and User controllers
- [ ] Phase 5: Permission enforcement filter and service
- [ ] Phase 6: Docker configuration and integration tests
- [ ] All tests passing
- [ ] Documentation updated (CLAUDE.md, README.md, AGENTS.md)
