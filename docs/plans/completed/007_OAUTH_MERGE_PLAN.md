# 008: OAuth Feature Branch Merge Plan

## Overview

Merge `feature/oauth-security` into `main` after the multimodule refactoring. The OAuth implementation was built against the old monolith structure and must be migrated to the new multi-module architecture.

## Current State Analysis

### Main Branch Structure (Post-Refactor)
```
reactive-test/
├── apps/
│   ├── product-service/          # Spring Boot app (was src/main/java/org/example/reactivetest)
│   └── cart-service/             # New placeholder app
├── libs/platform/
│   ├── platform-bom/             # Version management
│   ├── platform-cache/           # Redis caching
│   ├── platform-error/           # Error handling
│   ├── platform-logging/         # Structured logging
│   ├── platform-resilience/      # Resilience4j wrappers
│   ├── platform-security/        # PLACEHOLDER - awaiting OAuth implementation
│   ├── platform-test/            # Test utilities
│   └── platform-webflux/         # WebFlux utilities
├── e2e-test/                     # Moved from perf-test/
│   ├── k6/                       # k6 test scripts
│   └── wiremock/mappings/        # Mock service mappings
├── ci/                           # CI scripts
└── buildSrc/                     # Gradle convention plugins
```

### Feature Branch OAuth Files (Old Structure)
```
src/main/java/org/example/reactivetest/security/
├── SecurityConfig.java           # Security filter chain
├── JwtAuthenticationConverter.java
├── JwtValidatorConfig.java
├── OAuth2ClientConfig.java
├── SecurityErrorHandler.java
├── SecurityProperties.java
├── README.md, CONTENTS.md, AGENTS.md

src/test/java/org/example/reactivetest/security/
├── JwtAuthenticationConverterTest.java
├── OAuth2ClientCacheTest.java
├── ProductControllerSecurityTest.java (in controller/)
├── TestJwtBuilder.java
├── TestSecurityConfig.java
├── SecurityTestUtils.java

src/test/java/org/example/reactivetest/integration/
├── OAuth2IntegrationTest.java

perf-test/k6/
├── oauth-chaos-test.js
├── oauth-chaos-test.md
├── oauth-circuit-breaker-test.js
├── oauth-circuit-breaker-test.md

perf-test/wiremock/mappings/
├── oauth/jwks.json
├── downstream-oauth/token.json
├── downstream-oauth/token-chaos.json
```

---

## Migration Mapping

### 1. Security Library Classes → platform-security

| Old Path | New Path |
|----------|----------|
| `src/main/java/org/example/reactivetest/security/JwtAuthenticationConverter.java` | `libs/platform/platform-security/src/main/java/org/example/platform/security/JwtAuthenticationConverter.java` |
| `src/main/java/org/example/reactivetest/security/JwtValidatorConfig.java` | `libs/platform/platform-security/src/main/java/org/example/platform/security/JwtValidatorConfig.java` |
| `src/main/java/org/example/reactivetest/security/SecurityErrorHandler.java` | `libs/platform/platform-security/src/main/java/org/example/platform/security/SecurityErrorHandler.java` |
| `src/main/java/org/example/reactivetest/security/SecurityProperties.java` | `libs/platform/platform-security/src/main/java/org/example/platform/security/SecurityProperties.java` |

**Update `libs/platform/platform-security/build.gradle.kts`:**
```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))

    // OAuth2 Resource Server (JWT validation)
    api("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    // OAuth2 Client (client credentials flow)
    api("org.springframework.boot:spring-boot-starter-oauth2-client")

    api("org.springframework.boot:spring-boot-starter-webflux")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

### 2. Application-Specific Config → product-service

| Old Path | New Path |
|----------|----------|
| `src/main/java/org/example/reactivetest/security/SecurityConfig.java` | `apps/product-service/src/main/java/org/example/product/security/SecurityConfig.java` |
| `src/main/java/org/example/reactivetest/security/OAuth2ClientConfig.java` | `apps/product-service/src/main/java/org/example/product/security/OAuth2ClientConfig.java` |
| `src/main/java/org/example/reactivetest/config/WebClientConfig.java` | `apps/product-service/src/main/java/org/example/product/config/WebClientConfig.java` (update existing) |

### 3. Application Config Files

| Old Path | New Path |
|----------|----------|
| `src/main/resources/application.yml` (security section) | `apps/product-service/src/main/resources/application.yml` |
| `src/main/resources/application-docker.yml` (security section) | `apps/product-service/src/main/resources/application-docker.yml` |
| `src/main/resources/application-test.yml` | `apps/product-service/src/main/resources/application-test.yml` |
| `src/test/resources/application.yml` | `apps/product-service/src/test/resources/application.yml` |

### 4. Test Files → product-service

| Old Path | New Path |
|----------|----------|
| `src/test/java/.../security/JwtAuthenticationConverterTest.java` | `apps/product-service/src/test/java/org/example/product/security/JwtAuthenticationConverterTest.java` |
| `src/test/java/.../security/OAuth2ClientCacheTest.java` | `apps/product-service/src/test/java/org/example/product/security/OAuth2ClientCacheTest.java` |
| `src/test/java/.../security/TestJwtBuilder.java` | `libs/platform/platform-test/src/main/java/org/example/platform/test/TestJwtBuilder.java` |
| `src/test/java/.../security/TestSecurityConfig.java` | `apps/product-service/src/test/java/org/example/product/security/TestSecurityConfig.java` |
| `src/test/java/.../security/SecurityTestUtils.java` | `libs/platform/platform-test/src/main/java/org/example/platform/test/SecurityTestUtils.java` |
| `src/test/java/.../controller/ProductControllerSecurityTest.java` | `apps/product-service/src/test/java/org/example/product/controller/ProductControllerSecurityTest.java` |
| `src/test/java/.../integration/OAuth2IntegrationTest.java` | `apps/product-service/src/test/java/org/example/product/integration/OAuth2IntegrationTest.java` |

### 5. E2E Tests → e2e-test

| Old Path | New Path |
|----------|----------|
| `perf-test/k6/oauth-chaos-test.js` | `e2e-test/k6/oauth-chaos-test.js` |
| `perf-test/k6/oauth-chaos-test.md` | `e2e-test/k6/oauth-chaos-test.md` |
| `perf-test/k6/oauth-circuit-breaker-test.js` | `e2e-test/k6/oauth-circuit-breaker-test.js` |
| `perf-test/k6/oauth-circuit-breaker-test.md` | `e2e-test/k6/oauth-circuit-breaker-test.md` |

### 6. WireMock Mappings → e2e-test

| Old Path | New Path |
|----------|----------|
| `perf-test/wiremock/mappings/oauth/jwks.json` | `e2e-test/wiremock/mappings/oauth/jwks.json` |
| `perf-test/wiremock/mappings/downstream-oauth/token.json` | `e2e-test/wiremock/mappings/downstream-oauth/token.json` |
| `perf-test/wiremock/mappings/downstream-oauth/token-chaos.json` | `e2e-test/wiremock/mappings/downstream-oauth/token-chaos.json` |

---

## Package Name Updates

All security classes must update package declarations:

| Old Package | New Package |
|-------------|-------------|
| `org.example.reactivetest.security` | `org.example.platform.security` (library classes) |
| `org.example.reactivetest.security` | `org.example.product.security` (app-specific classes) |
| `org.example.reactivetest.controller` | `org.example.product.controller` |
| `org.example.reactivetest.config` | `org.example.product.config` |

---

## Docker Compose Updates

Add OAuth k6 test services to `docker/docker-compose.yml`:

```yaml
  # === OAuth Chaos Testing ===
  k6-oauth-chaos:
    image: grafana/k6:0.55.0
    container_name: k6-oauth-chaos
    volumes:
      - ../e2e-test/k6:/scripts:ro
      - ../e2e-test/data:/data:ro
      - k6-output:/output
    environment:
      - K6_OUT=experimental-prometheus-rw
      - K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write
      - K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true
      - BASE_URL=http://product-service:8080
      - WIREMOCK_URL=http://wiremock:8080
    command: run /scripts/oauth-chaos-test.js
    depends_on:
      product-service:
        condition: service_healthy
      prometheus:
        condition: service_healthy
      wiremock:
        condition: service_healthy
    profiles:
      - oauth-chaos
    networks:
      - observability

  k6-oauth-circuit-breaker:
    image: grafana/k6:0.55.0
    container_name: k6-oauth-circuit-breaker
    volumes:
      - ../e2e-test/k6:/scripts:ro
      - ../e2e-test/data:/data:ro
      - k6-output:/output
    environment:
      - K6_OUT=experimental-prometheus-rw
      - K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write
      - K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true
      - BASE_URL=http://product-service:8080
      - WIREMOCK_URL=http://wiremock:8080
    command: run /scripts/oauth-circuit-breaker-test.js
    depends_on:
      product-service:
        condition: service_healthy
      prometheus:
        condition: service_healthy
      wiremock:
        condition: service_healthy
    profiles:
      - oauth-chaos
    networks:
      - observability
```

---

## CI Scripts

### Create `ci/e2e-oauth-chaos-test.sh`:
```bash
#!/usr/bin/env bash
# Run k6 OAuth chaos test against product-service
# Usage: ./ci/e2e-oauth-chaos-test.sh [--ci]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

source "$SCRIPT_DIR/_ensure-docker-stack.sh"

CI_MODE=false
[[ "${1:-}" == "--ci" ]] && CI_MODE=true

ensure_docker_stack "$CI_MODE"

cd "$ROOT_DIR/docker"

echo "==> Running k6 OAuth chaos test..."
docker compose --profile oauth-chaos run --rm k6-oauth-chaos

echo "==> OAuth chaos test completed!"
```

### Create `ci/e2e-oauth-circuit-breaker-test.sh`:
```bash
#!/usr/bin/env bash
# Run k6 OAuth circuit breaker test against product-service
# Usage: ./ci/e2e-oauth-circuit-breaker-test.sh [--ci]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

source "$SCRIPT_DIR/_ensure-docker-stack.sh"

CI_MODE=false
[[ "${1:-}" == "--ci" ]] && CI_MODE=true

ensure_docker_stack "$CI_MODE"

cd "$ROOT_DIR/docker"

echo "==> Running k6 OAuth circuit breaker test..."
docker compose --profile oauth-chaos run --rm k6-oauth-circuit-breaker

echo "==> OAuth circuit breaker test completed!"
```

---

## Execution Steps

### Step 1: Prepare Working Branch
```bash
git checkout feature/oauth-security
git fetch origin
git rebase origin/main
# Resolve conflicts using this plan
```

### Step 2: Migrate Platform Security Library
1. Create directory: `libs/platform/platform-security/src/main/java/org/example/platform/security/`
2. Move reusable classes with package updates
3. Update `platform-security/build.gradle.kts`
4. Delete `package-info.java` placeholder

### Step 3: Migrate Product Service Security
1. Create directory: `apps/product-service/src/main/java/org/example/product/security/`
2. Move app-specific classes with package updates
3. Update imports in ProductController, WebClientConfig

### Step 4: Migrate Test Files
1. Move unit tests to appropriate locations
2. Move shared test utilities to platform-test
3. Update all imports

### Step 5: Migrate E2E Tests
1. Move k6 scripts to `e2e-test/k6/`
2. Move WireMock mappings to `e2e-test/wiremock/mappings/`
3. Update docker-compose.yml with new services
4. Create CI scripts

### Step 6: Update Configuration
1. Merge application.yml security config into product-service
2. Add application-test.yml to product-service

### Step 7: Validate
```bash
./ci/verify.sh                          # Build + unit tests
./ci/e2e-load-test.sh                   # Basic load test
./ci/e2e-oauth-chaos-test.sh            # OAuth chaos test
./ci/e2e-oauth-circuit-breaker-test.sh  # Circuit breaker test
```

---

## Expected Conflicts

1. **build.gradle** - Deleted in main (use build.gradle.kts)
2. **docker/docker-compose.yml** - Significant restructure
3. **src/main/resources/application.yml** - Moved to apps/product-service
4. **src/main/resources/application-docker.yml** - Moved to apps/product-service
5. **perf-test/*** - Moved to e2e-test/
6. **src/main/** - Entire tree moved to apps/product-service

---

## Validation Checklist

- [ ] `./gradlew build` passes
- [ ] `./gradlew test` passes
- [ ] `./ci/verify.sh` passes
- [ ] `./ci/docker-up.sh` starts all services
- [ ] `./ci/e2e-load-test.sh` passes
- [ ] `./ci/e2e-oauth-chaos-test.sh` passes
- [ ] JWT validation works (401 for invalid/missing token)
- [ ] @PreAuthorize scope checks work
- [ ] Client credentials flow acquires tokens
- [ ] Archive this plan after merge
