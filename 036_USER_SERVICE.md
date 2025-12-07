# 036_USER_SERVICE

**Status: ACTIVE**

---

## Overview

Create a User Service that provides OAuth 2.1 authorization server capabilities using Spring Authorization Server, along with user management and preferences. The service supports three user types: SERVICE_ACCOUNT (self-checkout kiosks), CUSTOMER (B2C online), and EMPLOYEE (in-store assisted selling).

**Key Focus**: Local development with fake accounts—no external auth provider required. QA testers can quickly select user types from the frontend login dialog without entering credentials.

**Related Documents:**
- `docs/ADRs/011_spring_authorization_server.md` - Architecture decision (approved)
- `035_FAKE_AUTH_DOCKER.md` - Existing fake auth implementation (to be integrated/superseded)
- `docs/archive/not-implemented/016_USER_SERVICE.md` - Previous plan (superseded)
- `docs/ADRs/005_user_service_authentication_strategy.md` - Previous ADR (superseded)

**Existing Frontend Auth Code (from 035):**
- `apps/ecommerce-web/src/features/auth/` - AuthContext, LoginDialog, UserMenu
- `e2e-test/wiremock/mappings/fake-auth/` - WireMock stubs for fake tokens
- `tools/generate-fake-auth-tokens.mjs` - Token generation script

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
           │ client_credentials│ authorization_code    │ password (dev)
           │                   │ (or password in dev)  │
           ▼                   ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    User Service (Port 8089)                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │              Spring Authorization Server                                │ │
│  │   POST /oauth2/token           ← Token endpoint (all grant types)      │ │
│  │   GET  /oauth2/authorize       ← Authorization code flow               │ │
│  │   POST /oauth2/revoke          ← Token revocation                      │ │
│  │   POST /oauth2/introspect      ← Token introspection                   │ │
│  │   GET  /.well-known/jwks.json  ← JWK Set (auto-generated)              │ │
│  │   GET  /.well-known/openid-configuration ← OIDC Discovery              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │              Dev Support (dev profile only)                             │ │
│  │   POST /dev/token              ← Instant token without password        │ │
│  │   POST /dev/users/fake         ← Create fake user on-the-fly           │ │
│  │   GET  /dev/users              ← List all dev users                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │              User Management                                            │ │
│  │   GET  /users/{id}             ← Get user profile                      │ │
│  │   POST /users                  ← Create user (admin)                   │ │
│  │   PUT  /users/{id}             ← Update user (admin)                   │ │
│  │   GET  /users/{id}/preferences ← Get user preferences                  │ │
│  │   PUT  /users/{id}/preferences ← Update user preferences               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│           ┌────────────────────────┴────────────────────────┐              │
│           ▼                                                  ▼              │
│  ┌─────────────────────┐                      ┌─────────────────────────┐  │
│  │   UserRepository    │                      │ UserPreferencesRepo     │  │
│  │   (R2DBC)           │                      │ (R2DBC)                 │  │
│  └─────────┬───────────┘                      └───────────┬─────────────┘  │
│            │                                              │                │
│            └──────────────────┬───────────────────────────┘                │
│                               ▼                                            │
│                     ┌─────────────────┐                                    │
│                     │   PostgreSQL    │                                    │
│                     │  users          │                                    │
│                     │  user_prefs     │                                    │
│                     │  oauth2_*       │  ← Spring Auth Server tables       │
│                     └─────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Grant Types by User Type

| User Type | OAuth Grant | Use Case |
|-----------|-------------|----------|
| SERVICE_ACCOUNT | `client_credentials` | Kiosk authenticates with client ID/secret |
| CUSTOMER | `password` (dev) / `authorization_code` (prod) | B2C web login |
| EMPLOYEE | `password` (dev) / `authorization_code` (prod) | POS terminal login |

### Permission Model

| User Type | Permissions | Use Case |
|-----------|-------------|----------|
| SERVICE_ACCOUNT | `read` | Self-checkout kiosks (read-only) |
| CUSTOMER | `read`, `write` | B2C online shopping |
| EMPLOYEE | `read`, `write`, `admin`, `customer_search` | In-store assisted selling |

### Package Structure

| Package | Purpose |
|---------|---------|
| `org.example.user` | Application root |
| `org.example.user.config` | Security, OAuth, and application config |
| `org.example.user.controller` | REST controllers |
| `org.example.user.controller.dto` | Request/response DTOs |
| `org.example.user.service` | Business logic |
| `org.example.user.repository` | Data access |
| `org.example.user.repository.entity` | Database entities |
| `org.example.user.model` | Domain models (User, UserType, Permission) |

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
    // Platform BOM for version management
    implementation(platform(project(":libs:backend:platform:platform-bom")))

    // Platform libraries
    implementation(project(":libs:backend:platform:platform-logging"))
    implementation(project(":libs:backend:platform:platform-error"))
    implementation(project(":libs:backend:platform:platform-webflux"))

    // Spring Boot starters (versions from BOM)
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Spring Authorization Server
    implementation("org.springframework.security:spring-security-oauth2-authorization-server")

    // PostgreSQL (R2DBC)
    implementation("org.postgresql:r2dbc-postgresql")

    // Database migrations
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    // Prometheus metrics
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    // Test dependencies
    testImplementation(project(":libs:backend:platform:platform-test"))
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:r2dbc")
}
```

### 1.2 Database Schema

**Files:**
- CREATE: `apps/user-service/src/main/resources/db/migration/V001__create_users_table.sql`
- CREATE: `apps/user-service/src/main/resources/db/migration/V002__create_user_preferences.sql`
- CREATE: `apps/user-service/src/main/resources/db/migration/V003__seed_dev_users.sql`

**Implementation:**

```sql
-- V001__create_users_table.sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    user_type       VARCHAR(20) NOT NULL CHECK (user_type IN ('SERVICE_ACCOUNT', 'CUSTOMER', 'EMPLOYEE')),
    permissions     TEXT[] NOT NULL DEFAULT '{}',
    store_number    INTEGER,
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

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_store_number ON users(store_number) WHERE store_number IS NOT NULL;
CREATE INDEX idx_users_active ON users(active) WHERE active = true;
```

```sql
-- V002__create_user_preferences.sql
CREATE TABLE user_preferences (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    locale              VARCHAR(10) DEFAULT 'en-US',
    timezone            VARCHAR(50) DEFAULT 'America/New_York',
    currency            VARCHAR(3) DEFAULT 'USD',

    -- Communication preferences
    marketing_email     BOOLEAN DEFAULT false,
    marketing_sms       BOOLEAN DEFAULT false,
    order_updates_email BOOLEAN DEFAULT true,
    order_updates_sms   BOOLEAN DEFAULT false,

    -- Display preferences
    display_theme       VARCHAR(20) DEFAULT 'system',
    items_per_page      INTEGER DEFAULT 20,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

```sql
-- V003__seed_dev_users.sql
-- Only runs in dev/docker profiles via Flyway configuration

-- Dev employee with full permissions
INSERT INTO users (id, username, password_hash, user_type, permissions, store_number, email, display_name)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'dev-employee',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3o6EaNsj2R/N1OAb2.O2', -- password: dev123
    'EMPLOYEE',
    '{read,write,admin,customer_search}',
    1234,
    'employee@dev.local',
    'Dev Employee'
);

-- Dev customer
INSERT INTO users (id, username, password_hash, user_type, permissions, email, display_name)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'dev-customer',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3o6EaNsj2R/N1OAb2.O2', -- password: dev123
    'CUSTOMER',
    '{read,write}',
    'customer@dev.local',
    'Dev Customer'
);

-- Dev service account (kiosk)
INSERT INTO users (id, username, password_hash, user_type, permissions, display_name)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'dev-kiosk',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3o6EaNsj2R/N1OAb2.O2', -- password: dev123
    'SERVICE_ACCOUNT',
    '{read}',
    'Dev Kiosk'
);

-- Default preferences for dev users
INSERT INTO user_preferences (user_id) VALUES
    ('11111111-1111-1111-1111-111111111111'),
    ('22222222-2222-2222-2222-222222222222'),
    ('33333333-3333-3333-3333-333333333333');
```

### 1.3 Application Configuration

**Files:**
- CREATE: `apps/user-service/src/main/resources/application.yml`
- CREATE: `apps/user-service/src/main/resources/application-docker.yml`
- CREATE: `apps/user-service/src/main/java/org/example/user/UserServiceApplication.java`

**Implementation:**

```yaml
# application.yml
server:
  port: 8089

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

# RSA key pair for JWT signing (generated at startup in dev, mounted in prod)
jwt:
  issuer: http://localhost:8089

management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  endpoint:
    health:
      show-details: when_authorized
```

```yaml
# application-docker.yml
spring:
  r2dbc:
    url: r2dbc:postgresql://postgres:5432/userdb
    username: user_user
    password: user_pass
  flyway:
    url: jdbc:postgresql://postgres:5432/userdb
    user: user_user
    password: user_pass

jwt:
  issuer: http://user-service:8089
```

```java
// UserServiceApplication.java
package org.example.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {
    "org.example.user",
    "org.example.platform.logging",
    "org.example.platform.error",
    "org.example.platform.webflux"
})
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
```

---

## Phase 2: Domain Models & Repository

### 2.1 Domain Models

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/model/UserType.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/model/Permission.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/model/User.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/model/UserPreferences.java`

**Implementation:**

```java
// UserType.java
package org.example.user.model;

import java.util.Set;

public enum UserType {
    SERVICE_ACCOUNT(Set.of(Permission.READ)),
    CUSTOMER(Set.of(Permission.READ, Permission.WRITE)),
    EMPLOYEE(Set.of(Permission.READ, Permission.WRITE, Permission.ADMIN, Permission.CUSTOMER_SEARCH));

    private final Set<Permission> defaultPermissions;

    UserType(Set<Permission> defaultPermissions) {
        this.defaultPermissions = defaultPermissions;
    }

    public Set<Permission> getDefaultPermissions() {
        return defaultPermissions;
    }
}

// Permission.java
package org.example.user.model;

public enum Permission {
    READ,
    WRITE,
    ADMIN,
    CUSTOMER_SEARCH
}

// User.java
package org.example.user.model;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record User(
    UUID id,
    String username,
    UserType userType,
    Set<Permission> permissions,
    Integer storeNumber,
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

    public String scopeString() {
        return permissions.stream()
            .map(p -> p.name().toLowerCase())
            .reduce((a, b) -> a + " " + b)
            .orElse("");
    }
}

// UserPreferences.java
package org.example.user.model;

import java.util.UUID;

public record UserPreferences(
    UUID userId,
    String locale,
    String timezone,
    String currency,
    boolean marketingEmail,
    boolean marketingSms,
    boolean orderUpdatesEmail,
    boolean orderUpdatesSms,
    String displayTheme,
    int itemsPerPage
) {}
```

### 2.2 Repository Layer

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/entity/UserEntity.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/entity/UserPreferencesEntity.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/UserSpringRepository.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/UserPreferencesSpringRepository.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/UserRepository.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/repository/UserRepositoryImpl.java`

**Implementation:**

```java
// UserEntity.java
package org.example.user.repository.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("users")
public record UserEntity(
    @Id UUID id,
    String username,
    @Column("password_hash") String passwordHash,
    @Column("user_type") String userType,
    String[] permissions,
    @Column("store_number") Integer storeNumber,
    String email,
    @Column("display_name") String displayName,
    boolean active,
    @Column("created_at") Instant createdAt,
    @Column("updated_at") Instant updatedAt,
    @Column("last_login_at") Instant lastLoginAt
) {}

// UserSpringRepository.java
package org.example.user.repository;

import org.example.user.repository.entity.UserEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface UserSpringRepository extends ReactiveCrudRepository<UserEntity, UUID> {
    Mono<UserEntity> findByUsername(String username);
    Mono<UserEntity> findByUsernameAndActiveTrue(String username);
}

// UserRepository.java (domain interface)
package org.example.user.repository;

import org.example.user.model.User;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface UserRepository {
    Mono<User> findById(UUID id);
    Mono<User> findByUsername(String username);
    Mono<User> findActiveByUsername(String username);
    Mono<User> save(User user, String passwordHash);
    Mono<User> updateLastLogin(UUID id);
    Flux<User> findAll();
}
```

---

## Phase 3: Spring Authorization Server Configuration

### 3.1 Authorization Server Config

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/config/AuthorizationServerConfig.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/config/JwtConfig.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/config/RegisteredClientConfig.java`

**Implementation:**

```java
// AuthorizationServerConfig.java
package org.example.user.config;

import org.example.user.model.Permission;
import org.example.user.model.User;
import org.example.user.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.web.SecurityFilterChain;

import java.time.Duration;
import java.util.UUID;
import java.util.stream.Collectors;

@Configuration
public class AuthorizationServerConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
        return http.build();
    }

    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder()
            .issuer("http://localhost:8089")
            .build();
    }

    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        // Dev client - supports password grant for testing
        RegisteredClient devClient = RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("dev-client")
            .clientSecret("{noop}dev-secret")
            .authorizationGrantType(AuthorizationGrantType.PASSWORD)
            .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
            .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
            .scope("read")
            .scope("write")
            .scope("admin")
            .scope("customer_search")
            .scope(OidcScopes.OPENID)
            .tokenSettings(TokenSettings.builder()
                .accessTokenTimeToLive(Duration.ofHours(1))
                .refreshTokenTimeToLive(Duration.ofDays(7))
                .build())
            .build();

        // Kiosk client - client_credentials only
        RegisteredClient kioskClient = RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("kiosk-client")
            .clientSecret("{noop}kiosk-secret")
            .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
            .scope("read")
            .tokenSettings(TokenSettings.builder()
                .accessTokenTimeToLive(Duration.ofHours(8))
                .build())
            .build();

        // Frontend web client - authorization_code for production
        RegisteredClient webClient = RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("ecommerce-web")
            .clientSecret("{noop}web-secret")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
            .redirectUri("http://localhost:3001/callback")
            .redirectUri("http://localhost:4200/callback")
            .scope("read")
            .scope("write")
            .scope(OidcScopes.OPENID)
            .scope(OidcScopes.PROFILE)
            .tokenSettings(TokenSettings.builder()
                .accessTokenTimeToLive(Duration.ofHours(1))
                .refreshTokenTimeToLive(Duration.ofDays(7))
                .build())
            .build();

        return new InMemoryRegisteredClientRepository(devClient, kioskClient, webClient);
    }

    /**
     * Customizes JWT tokens with user-specific claims.
     */
    @Bean
    public OAuth2TokenCustomizer<JwtEncodingContext> tokenCustomizer(UserRepository userRepository) {
        return context -> {
            if (context.getTokenType() == OAuth2TokenType.ACCESS_TOKEN) {
                String username = context.getPrincipal().getName();

                // Block here is acceptable in token customizer (runs in servlet context)
                User user = userRepository.findActiveByUsername(username).block();

                if (user != null) {
                    context.getClaims()
                        .claim("user_type", user.userType().name())
                        .claim("permissions", user.permissions().stream()
                            .map(Permission::name)
                            .collect(Collectors.toList()))
                        .claim("scope", user.scopeString());

                    if (user.storeNumber() != null) {
                        context.getClaims().claim("store_number", user.storeNumber());
                    }

                    if (user.email() != null) {
                        context.getClaims().claim("email", user.email());
                    }
                }
            }
        };
    }
}
```

```java
// JwtConfig.java
package org.example.user.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.UUID;

@Configuration
public class JwtConfig {

    @Bean
    public JWKSource<SecurityContext> jwkSource() {
        KeyPair keyPair = generateRsaKey();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();

        RSAKey rsaKey = new RSAKey.Builder(publicKey)
            .privateKey(privateKey)
            .keyID(UUID.randomUUID().toString())
            .build();

        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }

    private static KeyPair generateRsaKey() {
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            return keyPairGenerator.generateKeyPair();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate RSA key pair", ex);
        }
    }

    @Bean
    public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }
}
```

### 3.2 Custom UserDetailsService

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/config/UserDetailsServiceConfig.java`

**Implementation:**

```java
package org.example.user.config;

import org.example.user.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class UserDetailsServiceConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return username -> {
            // Note: This blocks, but Spring Security's UserDetailsService is synchronous
            var user = userRepository.findActiveByUsername(username).block();

            if (user == null) {
                throw new UsernameNotFoundException("User not found: " + username);
            }

            var authorities = user.permissions().stream()
                .map(p -> new SimpleGrantedAuthority("SCOPE_" + p.name().toLowerCase()))
                .toList();

            return User.builder()
                .username(user.username())
                .password(user.passwordHash())
                .authorities(authorities)
                .build();
        };
    }
}
```

---

## Phase 4: Dev Token Endpoint

### 4.1 Dev Token Controller

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/DevTokenController.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/dto/DevTokenRequest.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/dto/DevTokenResponse.java`

**Implementation:**

```java
// DevTokenController.java
package org.example.user.controller;

import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.example.user.controller.dto.DevTokenRequest;
import org.example.user.controller.dto.DevTokenResponse;
import org.example.user.controller.dto.FakeUserRequest;
import org.example.user.model.User;
import org.example.user.model.UserType;
import org.example.user.repository.UserRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Dev-only endpoints for generating tokens without OAuth flow.
 * These endpoints bypass authentication for rapid local development.
 *
 * NEVER AVAILABLE IN PRODUCTION - only active with "dev" or "docker" profile.
 */
@Profile({"dev", "docker", "default"})
@RestController
@RequestMapping("/dev")
public class DevTokenController {

    private final JwtEncoder jwtEncoder;
    private final UserRepository userRepository;

    public DevTokenController(JWKSource<SecurityContext> jwkSource, UserRepository userRepository) {
        this.jwtEncoder = new NimbusJwtEncoder(jwkSource);
        this.userRepository = userRepository;
    }

    /**
     * Generate a token for any user without password validation.
     * If user doesn't exist, creates a fake user on-the-fly.
     */
    @PostMapping("/token")
    public Mono<ResponseEntity<DevTokenResponse>> generateToken(@RequestBody DevTokenRequest request) {
        return userRepository.findByUsername(request.username())
            .switchIfEmpty(createFakeUser(request))
            .map(user -> {
                JwtClaimsSet claims = JwtClaimsSet.builder()
                    .issuer("http://localhost:8089")
                    .subject(user.id().toString())
                    .claim("username", user.username())
                    .claim("user_type", user.userType().name())
                    .claim("permissions", user.permissions().stream()
                        .map(Enum::name)
                        .toList())
                    .claim("scope", user.scopeString())
                    .claim("store_number", user.storeNumber())
                    .claim("email", user.email())
                    .audience(java.util.List.of("reactive-platform"))
                    .issuedAt(Instant.now())
                    .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                    .build();

                JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).build();
                String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

                return ResponseEntity.ok(new DevTokenResponse(
                    token,
                    "Bearer",
                    86400,
                    user.userType(),
                    user.permissions()
                ));
            });
    }

    /**
     * Create a fake user for testing.
     */
    @PostMapping("/users/fake")
    public Mono<ResponseEntity<User>> createFakeUser(@RequestBody FakeUserRequest request) {
        return createFakeUser(new DevTokenRequest(
            request.username(),
            request.userType(),
            request.storeNumber()
        )).map(ResponseEntity::ok);
    }

    /**
     * List all users (dev only).
     */
    @GetMapping("/users")
    public Flux<User> listUsers() {
        return userRepository.findAll();
    }

    private Mono<User> createFakeUser(DevTokenRequest request) {
        UserType userType = request.userType() != null ? request.userType() : UserType.CUSTOMER;
        Integer storeNumber = userType == UserType.EMPLOYEE
            ? (request.storeNumber() != null ? request.storeNumber() : 1234)
            : null;

        User user = new User(
            UUID.randomUUID(),
            request.username(),
            userType,
            userType.getDefaultPermissions(),
            storeNumber,
            request.username() + "@dev.local",
            "Dev " + request.username(),
            true,
            Instant.now(),
            Instant.now(),
            null
        );

        return userRepository.save(user, "$2a$10$fake.hash.not.used.in.dev.mode");
    }
}

// DevTokenRequest.java
package org.example.user.controller.dto;

import org.example.user.model.UserType;

public record DevTokenRequest(
    String username,
    UserType userType,
    Integer storeNumber
) {}

// DevTokenResponse.java
package org.example.user.controller.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.example.user.model.Permission;
import org.example.user.model.UserType;

import java.util.Set;

public record DevTokenResponse(
    @JsonProperty("access_token") String accessToken,
    @JsonProperty("token_type") String tokenType,
    @JsonProperty("expires_in") long expiresIn,
    @JsonProperty("user_type") UserType userType,
    Set<Permission> permissions
) {}

// FakeUserRequest.java
package org.example.user.controller.dto;

import org.example.user.model.UserType;

public record FakeUserRequest(
    String username,
    UserType userType,
    Integer storeNumber
) {}
```

---

## Phase 5: User Management Endpoints

### 5.1 User Controller

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/UserController.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/dto/CreateUserRequest.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/dto/UpdateUserRequest.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/controller/dto/UserResponse.java`

**Implementation:**

```java
// UserController.java
package org.example.user.controller;

import jakarta.validation.Valid;
import org.example.user.controller.dto.*;
import org.example.user.model.User;
import org.example.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<UserResponse>> getUser(@PathVariable UUID id) {
        return userService.findById(id)
            .map(UserResponse::from)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<ResponseEntity<UserResponse>> createUser(@RequestBody @Valid CreateUserRequest request) {
        return userService.createUser(request)
            .map(UserResponse::from)
            .map(user -> ResponseEntity.status(201).body(user));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<UserResponse>> updateUser(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateUserRequest request) {
        return userService.updateUser(id, request)
            .map(UserResponse::from)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/preferences")
    public Mono<ResponseEntity<UserPreferencesResponse>> getPreferences(@PathVariable UUID id) {
        return userService.getPreferences(id)
            .map(UserPreferencesResponse::from)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/preferences")
    public Mono<ResponseEntity<UserPreferencesResponse>> updatePreferences(
            @PathVariable UUID id,
            @RequestBody @Valid UpdatePreferencesRequest request) {
        return userService.updatePreferences(id, request)
            .map(UserPreferencesResponse::from)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
```

### 5.2 User Service

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/service/UserService.java`
- CREATE: `apps/user-service/src/main/java/org/example/user/service/UserServiceImpl.java`

---

## Phase 6: Docker & Infrastructure

### 6.1 Docker Configuration

**Files:**
- CREATE: `docker/Dockerfile.user-service`
- MODIFY: `docker/docker-compose.yml`
- MODIFY: `docker/postgres/init-databases.sql`

**Implementation:**

```dockerfile
# Dockerfile.user-service
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY apps/user-service/build/libs/user-service-*.jar app.jar

# Add OpenTelemetry Java agent
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.10.0/opentelemetry-javaagent.jar /app/otel-agent.jar

EXPOSE 8089

ENTRYPOINT ["java", "-javaagent:/app/otel-agent.jar", "-jar", "app.jar"]
```

**docker-compose.yml addition:**

```yaml
  user-service:
    build:
      context: ..
      dockerfile: docker/Dockerfile.user-service
    container_name: user-service
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_R2DBC_URL=r2dbc:postgresql://postgres:5432/userdb
      - SPRING_R2DBC_USERNAME=user_user
      - SPRING_R2DBC_PASSWORD=user_pass
      - SPRING_FLYWAY_URL=jdbc:postgresql://postgres:5432/userdb
      - SPRING_FLYWAY_USER=user_user
      - SPRING_FLYWAY_PASSWORD=user_pass
      - JWT_ISSUER=http://user-service:8089
      - OTEL_SERVICE_NAME=user-service
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317
      - OTEL_EXPORTER_OTLP_PROTOCOL=grpc
      - OTEL_TRACES_EXPORTER=otlp
      - OTEL_METRICS_EXPORTER=none
      - OTEL_LOGS_EXPORTER=none
    volumes:
      - app-logs:/app/logs
    ports:
      - "8089:8089"
    depends_on:
      postgres:
        condition: service_healthy
      tempo:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8089/actuator/health"]
      interval: 10s
      timeout: 5s
      start_period: 60s
      retries: 5
    networks:
      - observability
```

**init-databases.sql addition:**

```sql
-- User service database
CREATE DATABASE userdb;
CREATE USER user_user WITH PASSWORD 'user_pass';
GRANT ALL PRIVILEGES ON DATABASE userdb TO user_user;
\c userdb
GRANT ALL ON SCHEMA public TO user_user;
```

---

## Phase 7: Integration Tests

### 7.1 Test Configuration

**Files:**
- CREATE: `apps/user-service/src/test/java/org/example/user/DevTokenControllerTest.java`
- CREATE: `apps/user-service/src/test/java/org/example/user/OAuth2TokenEndpointTest.java`
- CREATE: `apps/user-service/src/test/java/org/example/user/UserControllerTest.java`

**Test Scenarios:**

1. **Dev Token Tests:**
   - `POST /dev/token` with username returns valid JWT
   - Token contains correct user_type and permissions claims
   - Non-existent user creates fake user on-the-fly
   - Employee tokens include store_number

2. **OAuth2 Token Tests:**
   - `client_credentials` grant returns token with scope
   - `password` grant authenticates seeded user
   - Invalid credentials return 401
   - Token includes custom claims (user_type, permissions)

3. **User Management Tests:**
   - Create user with valid request
   - Get user by ID
   - Update user preferences
   - Employee must have store_number

---

## Phase 8: Consuming Service Updates

### 8.1 Update Consuming Services

**Files:**
- MODIFY: `apps/product-service/src/main/resources/application.yml`
- MODIFY: `apps/cart-service/src/main/resources/application.yml`
- MODIFY: `apps/checkout-service/src/main/resources/application.yml`
- MODIFY: `apps/customer-service/src/main/resources/application.yml`

**Implementation:**

Consuming services only need minimal configuration to validate tokens from user-service:

```yaml
# For all consuming services
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${USER_SERVICE_URL:http://localhost:8089}
```

This replaces the complex multi-issuer configuration from ADR-005. Spring Security automatically:
- Fetches `/.well-known/openid-configuration` from user-service
- Retrieves JWK Set from the `jwks_uri`
- Validates token signatures and claims

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/user-service/build.gradle.kts` | Application build configuration |
| CREATE | `apps/user-service/src/main/resources/application.yml` | Application configuration |
| CREATE | `apps/user-service/src/main/resources/application-docker.yml` | Docker profile config |
| CREATE | `apps/user-service/src/main/resources/db/migration/V001__create_users_table.sql` | Users table schema |
| CREATE | `apps/user-service/src/main/resources/db/migration/V002__create_user_preferences.sql` | Preferences table |
| CREATE | `apps/user-service/src/main/resources/db/migration/V003__seed_dev_users.sql` | Dev user seeding |
| CREATE | `apps/user-service/src/main/java/org/example/user/UserServiceApplication.java` | Application entry |
| CREATE | `apps/user-service/src/main/java/org/example/user/config/AuthorizationServerConfig.java` | OAuth config |
| CREATE | `apps/user-service/src/main/java/org/example/user/config/JwtConfig.java` | JWT/JWK config |
| CREATE | `apps/user-service/src/main/java/org/example/user/config/UserDetailsServiceConfig.java` | UserDetails |
| CREATE | `apps/user-service/src/main/java/org/example/user/model/*.java` | Domain models |
| CREATE | `apps/user-service/src/main/java/org/example/user/repository/*.java` | Repository layer |
| CREATE | `apps/user-service/src/main/java/org/example/user/controller/DevTokenController.java` | Dev token endpoint |
| CREATE | `apps/user-service/src/main/java/org/example/user/controller/UserController.java` | User management |
| CREATE | `apps/user-service/src/main/java/org/example/user/controller/dto/*.java` | DTOs |
| CREATE | `apps/user-service/src/main/java/org/example/user/service/*.java` | Business logic |
| CREATE | `docker/Dockerfile.user-service` | Docker image |
| MODIFY | `settings.gradle.kts` | Add user-service module |
| MODIFY | `docker/docker-compose.yml` | Add user-service container |
| MODIFY | `docker/postgres/init-databases.sql` | Add userdb database |
| MODIFY | `CLAUDE.md` | Add user-service documentation |

### Frontend Files (Phase 9)

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/ecommerce-web/src/features/auth/config.ts` | Auth mode configuration |
| MODIFY | `apps/ecommerce-web/src/features/auth/context/AuthContext.tsx` | Dual-mode auth (dev + OAuth) |
| MODIFY | `apps/ecommerce-web/src/features/auth/components/LoginDialog.tsx` | Quick user selection UI |
| CREATE | `apps/ecommerce-web/src/pages/OAuthCallback.tsx` | OAuth callback handler |
| MODIFY | `apps/ecommerce-web/src/app/routes.tsx` | Add /callback route |
| MODIFY | `docker/nginx-frontend.conf` | Proxy user-service endpoints |
| CREATE | `apps/ecommerce-web/.env.docker` | Docker environment variables |
| MODIFY | `apps/ecommerce-web/.env.example` | Document env variables |

---

## Local Development Usage

### Quick Start

```bash
# 1. Start infrastructure
cd docker && docker compose up -d postgres

# 2. Run user-service locally
./gradlew :apps:user-service:bootRun

# 3. Get a dev token (no password needed!)
curl -X POST http://localhost:8089/dev/token \
  -H "Content-Type: application/json" \
  -d '{"username": "dev-employee", "userType": "EMPLOYEE", "storeNumber": 1234}'

# 4. Use token with other services
curl http://localhost:8080/products/SKU-001 \
  -H "Authorization: Bearer <token>"
```

### OAuth2 Flow (Standard)

```bash
# Password grant (dev testing)
curl -X POST http://localhost:8089/oauth2/token \
  -u "dev-client:dev-secret" \
  -d "grant_type=password&username=dev-employee&password=dev123"

# Client credentials (service accounts)
curl -X POST http://localhost:8089/oauth2/token \
  -u "kiosk-client:kiosk-secret" \
  -d "grant_type=client_credentials&scope=read"
```

### OIDC Discovery

```bash
# Get OpenID configuration
curl http://localhost:8089/.well-known/openid-configuration

# Get JWK Set (public keys for token verification)
curl http://localhost:8089/.well-known/jwks.json
```

---

## Phase 9: Frontend Integration

### 9.1 Auth Provider Configuration

The frontend needs to support two auth modes:
1. **Dev/Docker Mode**: Quick user selection (existing LoginDialog from 035)
2. **Production Mode**: Standard OAuth authorization_code flow

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/auth/context/AuthContext.tsx`
- MODIFY: `apps/ecommerce-web/src/features/auth/components/LoginDialog.tsx`
- CREATE: `apps/ecommerce-web/src/features/auth/config.ts`

### 9.2 Auth Configuration

**Implementation:**

```typescript
// apps/ecommerce-web/src/features/auth/config.ts

export interface AuthConfig {
  mode: 'dev' | 'oauth';
  authUrl: string;
  clientId: string;
  redirectUri: string;
}

// Detect mode from environment or URL
export function getAuthConfig(): AuthConfig {
  const isDev = import.meta.env.DEV ||
                import.meta.env.VITE_AUTH_MODE === 'dev' ||
                window.location.hostname === 'localhost';

  if (isDev) {
    return {
      mode: 'dev',
      // In Docker: use user-service /dev/token endpoint
      // Fallback to WireMock /fake-auth/token for backwards compatibility
      authUrl: import.meta.env.VITE_USER_SERVICE_URL || '/fake-auth',
      clientId: 'dev-client',
      redirectUri: window.location.origin + '/callback',
    };
  }

  return {
    mode: 'oauth',
    authUrl: import.meta.env.VITE_USER_SERVICE_URL || 'http://user-service:8089',
    clientId: 'ecommerce-web',
    redirectUri: window.location.origin + '/callback',
  };
}

// Test users for dev mode quick selection
export const DEV_TEST_USERS = [
  {
    username: 'admin',
    userType: 'EMPLOYEE',
    description: 'Full access to all services (Employee)',
    storeNumber: 1234,
    scopes: ['read', 'write', 'admin', 'customer_search'],
  },
  {
    username: 'customer',
    userType: 'CUSTOMER',
    description: 'Standard customer access',
    scopes: ['read', 'write'],
  },
  {
    username: 'readonly',
    userType: 'SERVICE_ACCOUNT',
    description: 'Read-only access (Kiosk)',
    scopes: ['read'],
  },
];
```

### 9.3 Updated AuthContext

**Implementation:**

```typescript
// apps/ecommerce-web/src/features/auth/context/AuthContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getAuthConfig, AuthConfig } from '../config';
import { logger } from '../../../shared/utils/logger';

interface User {
  username: string;
  userType: string;
  scopes: string[];
  storeNumber?: number;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  authConfig: AuthConfig;
  // Dev mode: quick login with username only
  loginDev: (username: string, userType?: string, storeNumber?: number) => Promise<void>;
  // OAuth mode: initiate authorization code flow
  loginOAuth: () => void;
  // Handle OAuth callback
  handleOAuthCallback: (code: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authConfig] = useState(() => getAuthConfig());
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem('authToken')
  );
  const [user, setUser] = useState<User | null>(() => {
    const savedToken = sessionStorage.getItem('authToken');
    if (savedToken) {
      return parseTokenClaims(savedToken);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Dev mode: POST to /dev/token or /fake-auth/token
  const loginDev = useCallback(async (
    username: string,
    userType?: string,
    storeNumber?: number
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${authConfig.authUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, userType, storeNumber }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const accessToken = data.access_token;
      const claims = parseTokenClaims(accessToken);

      sessionStorage.setItem('authToken', accessToken);
      setToken(accessToken);
      setUser(claims);

      logger.info('Dev login successful', { username });
    } catch (error) {
      logger.error('Dev login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authConfig]);

  // OAuth mode: redirect to authorization endpoint
  const loginOAuth = useCallback(() => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: authConfig.clientId,
      redirect_uri: authConfig.redirectUri,
      scope: 'openid profile read write',
      state: generateState(),
    });

    window.location.href = `${authConfig.authUrl}/oauth2/authorize?${params}`;
  }, [authConfig]);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${authConfig.authUrl}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: authConfig.redirectUri,
          client_id: authConfig.clientId,
        }),
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const data = await response.json();
      const accessToken = data.access_token;
      const claims = parseTokenClaims(accessToken);

      sessionStorage.setItem('authToken', accessToken);
      setToken(accessToken);
      setUser(claims);

      logger.info('OAuth login successful', { username: claims?.username });
    } catch (error) {
      logger.error('OAuth callback failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authConfig]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    logger.info('User logged out');
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!token,
      user,
      token,
      authConfig,
      loginDev,
      loginOAuth,
      handleOAuthCallback,
      logout,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function parseTokenClaims(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      username: payload.sub || payload.username,
      userType: payload.user_type || 'CUSTOMER',
      scopes: (payload.scope || '').split(' ').filter(Boolean),
      storeNumber: payload.store_number,
    };
  } catch {
    return null;
  }
}

function generateState(): string {
  return Math.random().toString(36).substring(2);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 9.4 Updated LoginDialog with Mode Switch

**Implementation:**

```typescript
// apps/ecommerce-web/src/features/auth/components/LoginDialog.tsx
import { useState } from 'react';
import { X, User, Shield, Eye } from 'lucide-react';
import { Button } from '@reactive-platform/shared-ui-components';
import { useAuth } from '../context/AuthContext';
import { DEV_TEST_USERS } from '../config';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  const { loginDev, loginOAuth, authConfig, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleDevLogin = async (testUser: typeof DEV_TEST_USERS[0]) => {
    setError(null);
    try {
      await loginDev(testUser.username, testUser.userType, testUser.storeNumber);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleOAuthLogin = () => {
    loginOAuth();
  };

  const isDevMode = authConfig.mode === 'dev';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isDevMode ? 'Login as Test User' : 'Login'}
          </h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isDevMode ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Select a test user to authenticate. This is for local/Docker testing only.
            </p>

            {error && (
              <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Quick User Selection Grid */}
            <div className="space-y-3">
              {DEV_TEST_USERS.map((testUser) => (
                <button
                  key={testUser.username}
                  onClick={() => handleDevLogin(testUser)}
                  disabled={isLoading}
                  className="w-full rounded-lg border p-4 text-left hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {testUser.userType === 'EMPLOYEE' && <Shield className="h-4 w-4 text-primary" />}
                      {testUser.userType === 'CUSTOMER' && <User className="h-4 w-4 text-blue-500" />}
                      {testUser.userType === 'SERVICE_ACCOUNT' && <Eye className="h-4 w-4 text-gray-500" />}
                      <span className="font-medium">{testUser.username}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {testUser.scopes.length} scopes
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {testUser.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {testUser.scopes.slice(0, 4).map((scope) => (
                      <span
                        key={scope}
                        className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        {scope}
                      </span>
                    ))}
                    {testUser.scopes.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{testUser.scopes.length - 4} more
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Click below to sign in with your account.
            </p>

            <Button onClick={handleOAuthLogin} className="w-full">
              Sign in with OAuth
            </Button>
          </>
        )}

        <div className="mt-4 pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
```

### 9.5 OAuth Callback Route

**Files:**
- CREATE: `apps/ecommerce-web/src/pages/OAuthCallback.tsx`
- MODIFY: `apps/ecommerce-web/src/app/routes.tsx`

**Implementation:**

```typescript
// apps/ecommerce-web/src/pages/OAuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      navigate('/', { replace: true });
      return;
    }

    if (code) {
      handleOAuthCallback(code)
        .then(() => navigate('/', { replace: true }))
        .catch(() => navigate('/', { replace: true }));
    }
  }, [searchParams, handleOAuthCallback, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p>Completing sign in...</p>
      </div>
    </div>
  );
}
```

### 9.6 Update Nginx Proxy

**Files:**
- MODIFY: `docker/nginx-frontend.conf`

**Implementation:**

Add proxy for user-service:

```nginx
# Proxy user-service dev endpoints
location /dev/ {
    proxy_pass http://user-service:8089/dev/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Proxy OAuth2 endpoints
location /oauth2/ {
    proxy_pass http://user-service:8089/oauth2/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Proxy OIDC discovery
location /.well-known/ {
    proxy_pass http://user-service:8089/.well-known/;
    proxy_set_header Host $host;
}

# Keep fake-auth for backwards compatibility / WireMock fallback
location /fake-auth/ {
    proxy_pass http://wiremock:8080/fake-auth/;
    proxy_set_header Host $host;
}
```

### 9.7 Environment Variables

**Files:**
- MODIFY: `apps/ecommerce-web/.env.example`
- MODIFY: `apps/ecommerce-web/.env.docker`

**Implementation:**

```bash
# .env.example
VITE_AUTH_MODE=dev                    # 'dev' or 'oauth'
VITE_USER_SERVICE_URL=/dev            # For Docker: proxied to user-service
# VITE_USER_SERVICE_URL=/fake-auth    # For WireMock fallback

# .env.docker
VITE_AUTH_MODE=dev
VITE_USER_SERVICE_URL=/dev
```

---

## Migration from 035_FAKE_AUTH_DOCKER

This plan supersedes 035_FAKE_AUTH_DOCKER. The transition path:

| 035 Component | 036 Replacement | Notes |
|---------------|-----------------|-------|
| WireMock `/fake-auth/token` | user-service `/dev/token` | Same quick-select UX |
| WireMock `/fake-auth/.well-known/jwks.json` | user-service `/.well-known/jwks.json` | Standard OIDC discovery |
| Pre-generated static tokens | Dynamically generated tokens | User-service signs with its RSA key |
| `tools/generate-fake-auth-tokens.mjs` | Not needed | user-service handles token generation |
| Frontend AuthContext | Enhanced AuthContext | Supports both dev and OAuth modes |
| Frontend LoginDialog | Enhanced LoginDialog | Same quick-select UI preserved |

**Backwards Compatibility:**
- Keep WireMock fake-auth mappings for E2E tests that don't need user-service
- Frontend falls back to `/fake-auth` if user-service unavailable
- Existing test tokens continue to work until WireMock mappings are removed

---

## Phase 10: Standards Compliance Remediation

**Date Audited:** 2025-12-07
**Compliance Score:** 62.5% (20/32 checks passed)
**Status:** NEEDS REMEDIATION

The backend-standards-verifier agent identified the following issues that must be addressed before production deployment.

### 10.1 Critical: Rename `model/` to `domain/`

**Standard:** `docs/standards/backend/architecture.md` (line 34: "Always `domain/`, never `model/`")

**Files to modify:**
- RENAME: `apps/user-service/src/main/java/org/example/user/model/` → `apps/user-service/src/main/java/org/example/user/domain/`
- UPDATE: All import statements referencing `org.example.user.model.*` → `org.example.user.domain.*`
- UPDATE: Test files with model imports

**Affected files:**
- `UserServiceApplication.java`
- `DevTokenController.java`
- `UserController.java`
- `UserService.java` / `UserServiceImpl.java`
- `UserRepository.java` / `UserRepositoryImpl.java`
- All test files

### 10.2 Critical: Implement Validation Layer

**Standard:** `docs/standards/backend/validation.md` (MANDATORY requirement)

**Current state:** Empty `validation/` package exists but contains no validators.

**Files to create:**
- CREATE: `apps/user-service/src/main/java/org/example/user/validation/UserRequestValidator.java`

**Implementation pattern (per validation.md lines 60-97):**

```java
package org.example.user.validation;

import org.example.platform.error.ValidationException;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class UserRequestValidator {

    public Mono<Void> validate(UUID id, HttpHeaders headers) {
        return Mono.defer(() -> {
            List<String> errors = new ArrayList<>();

            // Validate required headers
            if (headers.getFirst("x-userid") == null) {
                errors.add("x-userid header is required");
            }
            if (headers.getFirst("x-sessionid") == null) {
                errors.add("x-sessionid header is required");
            }

            if (!errors.isEmpty()) {
                return Mono.error(new ValidationException(errors));
            }
            return Mono.empty();
        });
    }

    public Mono<Void> validate(CreateUserRequest request, HttpHeaders headers) {
        return Mono.defer(() -> {
            List<String> errors = new ArrayList<>();

            // Validate headers
            if (headers.getFirst("x-userid") == null) {
                errors.add("x-userid header is required");
            }

            // Validate request body
            if (request.username() == null || request.username().isBlank()) {
                errors.add("username is required");
            }
            if (request.userType() == null) {
                errors.add("userType is required");
            }

            if (!errors.isEmpty()) {
                return Mono.error(new ValidationException(errors));
            }
            return Mono.empty();
        });
    }
}
```

**Files to modify:**
- MODIFY: `UserController.java` - Inject `UserRequestValidator`, call before service methods
- MODIFY: `DevTokenController.java` - Add header validation (optional for dev endpoints)

### 10.3 Critical: Fix DevTokenController Layer Violation

**Standard:** `docs/standards/backend/architecture.md` (line 80: "Controllers depend on services, never repositories directly")

**Current violation:** `DevTokenController.java:36` directly injects `UserRepository`

**Files to modify:**
- MODIFY: `apps/user-service/src/main/java/org/example/user/controller/DevTokenController.java`
- MODIFY: `apps/user-service/src/main/java/org/example/user/service/UserService.java`

**Changes:**
1. Add methods to `UserService`:
   - `findOrCreateFakeUser(String username, UserType userType, Integer storeNumber)`
   - `findAll()` (already exists via repository)
2. Remove `UserRepository` injection from `DevTokenController`
3. Only inject `JwtService` and `UserService` in controller

### 10.4 Major: Move Business Logic from Domain Models

**Standard:** `docs/standards/backend/models.md` (lines 32-42)

**Violations:**
- `User.java:21-23` - `canSearchCustomers()` method
- `User.java:26-31` - `scopeString()` method
- `UserType.java:6-19` - `getDefaultPermissions()` method

**Files to modify:**
- MODIFY: `apps/user-service/src/main/java/org/example/user/domain/User.java` - Remove business methods
- MODIFY: `apps/user-service/src/main/java/org/example/user/domain/UserType.java` - Remove `getDefaultPermissions()`
- MODIFY: `apps/user-service/src/main/java/org/example/user/service/UserService.java` - Add these methods
- CREATE: `apps/user-service/src/main/java/org/example/user/service/PermissionService.java` (optional)

**Refactored methods:**
```java
// UserService.java
public boolean canSearchCustomers(User user) {
    return user.userType() == UserType.EMPLOYEE
        && user.permissions().contains(Permission.CUSTOMER_SEARCH);
}

public String scopeString(User user) {
    return user.permissions().stream()
        .map(p -> p.name().toLowerCase())
        .reduce((a, b) -> a + " " + b)
        .orElse("");
}

public Set<Permission> getDefaultPermissions(UserType userType) {
    return switch (userType) {
        case SERVICE_ACCOUNT -> Set.of(Permission.READ);
        case CUSTOMER -> Set.of(Permission.READ, Permission.WRITE);
        case EMPLOYEE -> Set.of(Permission.READ, Permission.WRITE, Permission.ADMIN, Permission.CUSTOMER_SEARCH);
    };
}
```

### 10.5 Major: Add StructuredLogger

**Standard:** `docs/standards/backend/observability-logs.md` (lines 86-102)

**Current state:** No `StructuredLogger` usage found in services.

**Files to modify:**
- MODIFY: `apps/user-service/src/main/java/org/example/user/service/UserServiceImpl.java`
- MODIFY: `apps/user-service/src/main/java/org/example/user/service/JwtService.java`

**Implementation pattern:**
```java
@Service
public class UserServiceImpl implements UserService {
    private final StructuredLogger logger;
    private final UserRepository userRepository;

    public UserServiceImpl(StructuredLogger logger, UserRepository userRepository) {
        this.logger = logger;
        this.userRepository = userRepository;
    }

    @Override
    public Mono<User> createUser(CreateUserRequest request) {
        return Mono.deferContextual(ctx -> {
            logger.logMessage(ctx, "userservice",
                "Creating user", Map.of("username", request.username()));
            return userRepository.save(/* ... */);
        });
    }
}
```

### 10.6 Warning: Expand Test Coverage

**Current state:** Only 3 test files (controllers only)

**Files to create:**
- CREATE: `apps/user-service/src/test/java/org/example/user/service/UserServiceTest.java`
- CREATE: `apps/user-service/src/test/java/org/example/user/service/JwtServiceTest.java`
- CREATE: `apps/user-service/src/test/java/org/example/user/repository/UserRepositoryTest.java`
- CREATE: `apps/user-service/src/test/java/org/example/user/validation/UserRequestValidatorTest.java`

---

## Standards Compliance Summary

| Category | Status | Score | Notes |
|----------|--------|-------|-------|
| Package Structure | ❌ FAIL | 50% | Uses `model/` instead of `domain/` |
| Validation | ❌ FAIL | 0% | No validators implemented |
| Architecture | ⚠️ WARN | 75% | DevTokenController bypasses service layer |
| Models | ⚠️ WARN | 60% | Business logic in domain models |
| Observability | ❌ FAIL | 0% | No StructuredLogger |
| Error Handling | ✅ PASS | 50% | Uses platform-error |
| Testing | ⚠️ WARN | 50% | Missing service/repository tests |
| Platform Integration | ✅ PASS | 100% | Correctly uses platform libraries |

### Passed Checks
- ✅ Package naming follows `org.example.user.{subpackage}` convention
- ✅ Application properly scans platform library packages
- ✅ Uses platform-bom for dependency management
- ✅ Domain models use Java records (immutable)
- ✅ No MDC usage (reactive-safe)
- ✅ Proper Spring Boot reactive stack (WebFlux, R2DBC)
- ✅ Flyway migrations
- ✅ Test structure uses StepVerifier

---

## Checklist

- [x] Phase 1: Project setup, database schema, seed users
- [x] Phase 2: Domain models and repository layer
- [x] Phase 3: Spring Authorization Server configuration (custom JWT implementation)
- [x] Phase 4: Dev token endpoint (`/dev/token`)
- [x] Phase 5: User management endpoints
- [x] Phase 6: Docker configuration
  - [x] Dockerfile uses `eclipse-temurin:25-jre` (Java 25)
  - [x] Added `curl` for health checks
  - [x] Fixed `JwtService` NPE (proper JWKSelector with JWKMatcher)
- [x] Phase 7: Integration tests (12 tests passing)
- [x] Phase 8: Update consuming services to use `issuer-uri`
  - [x] discount-service OAuth2 resource server config added
  - [x] product-service OAuth2 client registration for Docker
- [x] Phase 9: Frontend integration (AuthContext, LoginDialog, OAuth callback)
  - [x] `auth/config.ts` - auth mode detection
  - [x] `AuthContext.tsx` - dual-mode support (loginDev + loginOAuth)
  - [x] `LoginDialog.tsx` - quick user selection
  - [x] `OAuthCallbackPage.tsx` - callback handler
  - [x] `routes.tsx` - /callback route
  - [x] `nginx-frontend.conf` - proxies for /dev/, /oauth2/, /.well-known/
- [x] All tests passing (frontend: 53 tests, backend: 12 tests)
- [ ] **Phase 10: Standards Compliance Remediation**
  - [ ] 10.1 Rename `model/` → `domain/` package
  - [ ] 10.2 Implement `UserRequestValidator` with header validation
  - [ ] 10.3 Fix DevTokenController to use UserService (not repository)
  - [ ] 10.4 Move business logic from domain models to services
  - [ ] 10.5 Add StructuredLogger to services
  - [ ] 10.6 Expand test coverage (service, repository, validator tests)
- [ ] Documentation updated (CLAUDE.md, README.md)
- [ ] Archive 035_FAKE_AUTH_DOCKER.md when complete

---

## Docker Notes

### First-time Setup
The PostgreSQL init script (`docker/postgres/init-databases.sql`) only runs on fresh volumes. If the database container was started before the init script was updated, manually create the database:

```bash
docker exec postgres psql -U postgres -c "CREATE DATABASE userdb;"
docker exec postgres psql -U postgres -c "CREATE USER user_user WITH ENCRYPTED PASSWORD 'user_pass';"
docker exec postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE userdb TO user_user;"
docker exec postgres psql -U postgres -d userdb -c "GRANT ALL ON SCHEMA public TO user_user;"
```

### Flyway Migrations
If Flyway doesn't run automatically, manually apply migrations:

```bash
cat apps/user-service/src/main/resources/db/migration/V001__create_users_table.sql | docker exec -i postgres psql -U postgres -d userdb
cat apps/user-service/src/main/resources/db/migration/V002__create_user_preferences.sql | docker exec -i postgres psql -U postgres -d userdb
cat apps/user-service/src/main/resources/db/migration/V003__seed_dev_users.sql | docker exec -i postgres psql -U postgres -d userdb
docker exec postgres psql -U postgres -d userdb -c "GRANT ALL ON TABLE users TO user_user; GRANT ALL ON TABLE user_preferences TO user_user;"
```

### Verified Endpoints
After Docker setup, verify:
- Health: `curl http://localhost:8089/actuator/health` → `{"status":"UP"}`
- Dev users: `curl http://localhost:3001/dev/users` → 3 seeded users
- Token generation: `curl -X POST -H "Content-Type: application/json" -d '{"username":"dev-employee"}' http://localhost:8089/dev/token`
