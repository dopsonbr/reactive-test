# 013_SPRING_BOOT_4_MIGRATION

**Status: DRAFT**

---

## Overview

Upgrade the reactive-platform from Spring Boot 3.5.8 to Spring Boot 4.0. This migration includes updating dependency versions, renaming deprecated starters, migrating to Jackson 3, and ensuring all tests pass with the new framework baseline (Spring Framework 7.x, Jakarta EE 11).

**Migration Guide:** https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide

## Goals

1. Upgrade Spring Boot from 3.5.8 to 4.0.x
2. Rename deprecated OAuth2 starters to new names
3. Migrate Jackson imports from `com.fasterxml.jackson` to `tools.jackson`
4. Update any deprecated configuration properties
5. Ensure all 26 modules build and tests pass
6. Update documentation to reflect new versions

## Architecture

No architectural changes required. This is a dependency version upgrade.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Version Updates                            │
├─────────────────────────────────────────────────────────────────┤
│  gradle/libs.versions.toml     ──►  spring-boot = "4.0.x"      │
│  buildSrc/build.gradle.kts     ──►  spring-boot-gradle-plugin  │
├─────────────────────────────────────────────────────────────────┤
│                    Starter Renames                              │
├─────────────────────────────────────────────────────────────────┤
│  spring-boot-starter-oauth2-*  ──►  spring-boot-starter-       │
│                                     security-oauth2-*           │
├─────────────────────────────────────────────────────────────────┤
│                    Jackson Migration                            │
├─────────────────────────────────────────────────────────────────┤
│  com.fasterxml.jackson.*       ──►  tools.jackson.*            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Pre-Migration Validation

### 1.1 Verify Current State

**Validation Steps:**
```bash
# Ensure clean build on current version
./gradlew clean buildAll

# Run all tests
./gradlew testAll

# Document current test count for comparison
./gradlew testAll --info | grep -E "tests.*passed"
```

### 1.2 Check Dependency Compatibility

**Research Required:**
- Verify Resilience4j 2.2.0 supports Spring Boot 4.0 / Spring Framework 7.x
- Check Testcontainers 1.20.4 compatibility
- Verify WireMock 3.10.0 compatibility
- Check logstash-logback-encoder 8.0 compatibility

**Action:** If any dependency is incompatible, update to compatible version in Phase 2.

---

## Phase 2: Version Updates

### 2.1 Update Gradle Version Catalog

**Files:**
- MODIFY: `gradle/libs.versions.toml`

**Implementation:**
```toml
[versions]
spring-boot = "4.0.0"
spring-dependency-management = "1.1.7"  # Verify compatibility or update
```

### 2.2 Update buildSrc Plugin Versions

**Files:**
- MODIFY: `buildSrc/build.gradle.kts`

**Implementation:**
```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-gradle-plugin:4.0.0")
    implementation("io.spring.gradle:dependency-management-plugin:1.1.7")  // Verify or update
}
```

### 2.3 Validation

```bash
# Verify Gradle can resolve new versions
./gradlew dependencies --configuration compileClasspath
```

---

## Phase 3: Starter Renames

### 3.1 Rename OAuth2 Starters

Spring Boot 4.0 renames OAuth2 starters:
- `spring-boot-starter-oauth2-resource-server` → `spring-boot-starter-security-oauth2-resource-server`
- `spring-boot-starter-oauth2-client` → `spring-boot-starter-security-oauth2-client`

**Files:**
- MODIFY: `libs/platform/platform-security/build.gradle.kts`
- MODIFY: `libs/platform/platform-test/build.gradle.kts`

**platform-security/build.gradle.kts:**
```kotlin
dependencies {
    api("org.springframework.boot:spring-boot-starter-security-oauth2-resource-server")
    api("org.springframework.boot:spring-boot-starter-security-oauth2-client")
}
```

**platform-test/build.gradle.kts:**
```kotlin
dependencies {
    api("org.springframework.boot:spring-boot-starter-security-oauth2-resource-server")
}
```

### 3.2 Add Security Test Starter (If Required)

Spring Boot 4.0 modularizes test infrastructure. If tests use `@WithMockUser`, add:

**Files:**
- MODIFY: `libs/platform/platform-test/build.gradle.kts` (if needed)

**Implementation:**
```kotlin
// Add if @WithMockUser or similar annotations are used
api("org.springframework.boot:spring-boot-starter-security-test")
```

### 3.3 Validation

```bash
# Verify starter resolution
./gradlew :libs:platform:platform-security:dependencies
./gradlew :libs:platform:platform-test:dependencies
```

---

## Phase 4: Jackson 3 Migration

### 4.1 Assess Jackson Usage

**Files using `com.fasterxml.jackson` (14 total):**
- `libs/platform/platform-audit/src/main/java/org/example/platform/audit/RedisStreamAuditPublisher.java`
- `libs/platform/platform-audit/src/main/java/org/example/platform/audit/AuditAutoConfiguration.java`
- `libs/platform/platform-logging/src/main/java/org/example/platform/logging/StructuredLogger.java`
- `libs/platform/platform-logging/src/test/java/org/example/platform/logging/WebClientLoggingFilterTest.java`
- `libs/platform/platform-cache/src/main/java/org/example/platform/cache/RedisCacheService.java`
- `libs/platform/platform-cache/src/main/java/org/example/platform/cache/RedisCacheAutoConfiguration.java`
- `libs/platform/platform-cache/src/test/java/org/example/platform/cache/RedisCacheServiceTest.java`
- `libs/platform/platform-security/src/main/java/org/example/platform/security/SecurityErrorHandler.java`
- `apps/audit-service/src/main/java/org/example/audit/domain/AuditRecord.java`
- `apps/audit-service/src/main/java/org/example/audit/repository/R2dbcAuditRepository.java`
- `apps/audit-service/src/main/java/org/example/audit/consumer/AuditEventConsumer.java`
- `apps/audit-service/src/main/java/org/example/audit/consumer/DeadLetterHandler.java`
- `apps/audit-service/src/test/java/org/example/audit/domain/AuditRecordTest.java`
- `apps/cart-service/src/main/java/org/example/cart/repository/PostgresCartRepository.java`

### 4.2 Migration Strategy Options

**Option A: Use Jackson 2 Compatibility (Recommended for initial migration)**

Set property in all application.yml files:
```yaml
spring:
  jackson:
    use-jackson2-defaults: true
```

Or add `spring-boot-jackson2` module temporarily.

**Option B: Full Jackson 3 Migration**

Update all imports from `com.fasterxml.jackson` to `tools.jackson`:
```java
// Before
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

// After
import tools.jackson.databind.ObjectMapper;
import tools.jackson.core.JacksonException;  // JsonProcessingException renamed
```

**Recommendation:** Start with Option A for faster migration, then migrate to Option B in a follow-up task.

### 4.3 Update Configuration Properties

Jackson property namespace changes:
```yaml
# Before (Spring Boot 3.x)
spring:
  jackson:
    read:
      accept-single-value-as-array: true

# After (Spring Boot 4.0)
spring:
  jackson:
    json:
      read:
        accept-single-value-as-array: true
```

**Files to check:**
- `apps/product-service/src/main/resources/application.yml`
- `apps/cart-service/src/main/resources/application.yml`
- `apps/audit-service/src/main/resources/application.yml`
- `apps/customer-service/src/main/resources/application.yml`
- `apps/discount-service/src/main/resources/application.yml`
- `apps/fulfillment-service/src/main/resources/application.yml`

### 4.4 Validation

```bash
# Build libraries with Jackson changes
./gradlew :libs:platform:platform-logging:build
./gradlew :libs:platform:platform-cache:build
./gradlew :libs:platform:platform-audit:build

# Run tests
./gradlew :libs:platform:platform-logging:test
./gradlew :libs:platform:platform-cache:test
```

---

## Phase 5: Configuration Property Updates

### 5.1 Check for Deprecated Properties

Review application.yml files for these renamed properties:

| Old Property | New Property |
|--------------|--------------|
| `spring.jackson.read.*` | `spring.jackson.json.read.*` |
| `spring.data.mongodb.*` (non-Spring Data) | `spring.mongodb.*` |
| `management.health.mongo.*` | `management.health.mongodb.*` |
| `spring.session.redis.*` | `spring.session.data.redis.*` |
| `spring.kafka.retry.topic.backoff.random` | `spring.kafka.retry.topic.backoff.jitter` |

### 5.2 DevTools Configuration

DevTools live reload is disabled by default in 4.0. If needed:
```yaml
spring:
  devtools:
    livereload:
      enabled: true
```

### 5.3 Liveness/Readiness Probes

Now enabled by default. If this causes issues, disable:
```yaml
management:
  endpoint:
    health:
      probes:
        enabled: false
```

---

## Phase 6: Testing Updates

### 6.1 Verify Test Annotations

Spring Boot 4.0 requires explicit auto-configuration for test clients:
- `@AutoConfigureMockMvc` - for MockMvc
- `@AutoConfigureWebTestClient` - for WebTestClient
- `@AutoConfigureRestTestClient` - for RestTestClient

**Current State:** Tests already use `@AutoConfigureWebTestClient` explicitly. No changes needed.

### 6.2 PropertyMapping Relocation

If tests use `@PropertyMapping`, update imports:
```java
// Before
import org.springframework.boot.test.autoconfigure.properties.PropertyMapping;

// After
import org.springframework.boot.test.context.PropertyMapping;
```

### 6.3 Run Full Test Suite

```bash
./gradlew testAll
```

---

## Phase 7: Documentation Updates

### 7.1 Update CLAUDE.md

**Files:**
- MODIFY: `CLAUDE.md`

Update any version references if present.

### 7.2 Update README Files

**Files to check:**
- `README.md` (root)
- `libs/platform/*/README.md`
- `apps/*/README.md`

Update Spring Boot version references.

### 7.3 Update Docker Compose

**Files:**
- MODIFY: `docker/docker-compose.yml` (if version labels exist)

---

## Phase 8: Final Validation

### 8.1 Full Build

```bash
./gradlew clean buildAll
```

### 8.2 Full Test Suite

```bash
./gradlew testAll
```

### 8.3 Integration Tests

```bash
# Build bootable JARs
./gradlew bootJar

# Start Docker stack
cd docker && docker compose up -d

# Run load tests
docker compose --profile test-product up k6-product

# Run resilience tests
docker compose --profile chaos-product up k6-product-resilience
```

### 8.4 Verify Application Startup

```bash
# Start each service and verify health endpoint
./gradlew :apps:product-service:bootRun &
curl -f http://localhost:8080/actuator/health
# Kill and repeat for other services
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `gradle/libs.versions.toml` | Update spring-boot version to 4.0.x |
| MODIFY | `buildSrc/build.gradle.kts` | Update spring-boot-gradle-plugin version |
| MODIFY | `libs/platform/platform-security/build.gradle.kts` | Rename OAuth2 starters |
| MODIFY | `libs/platform/platform-test/build.gradle.kts` | Rename OAuth2 starter, add security-test |
| MODIFY | `apps/*/src/main/resources/application.yml` | Add Jackson 2 compat flag (6 files) |
| MODIFY | `CLAUDE.md` | Update version references |

**Jackson 3 Migration (14 files - deferred or immediate):**
| MODIFY | `libs/platform/platform-audit/src/main/java/.../RedisStreamAuditPublisher.java` |
| MODIFY | `libs/platform/platform-audit/src/main/java/.../AuditAutoConfiguration.java` |
| MODIFY | `libs/platform/platform-logging/src/main/java/.../StructuredLogger.java` |
| MODIFY | `libs/platform/platform-cache/src/main/java/.../RedisCacheService.java` |
| MODIFY | `libs/platform/platform-cache/src/main/java/.../RedisCacheAutoConfiguration.java` |
| MODIFY | `libs/platform/platform-security/src/main/java/.../SecurityErrorHandler.java` |
| MODIFY | `apps/audit-service/src/main/java/.../AuditRecord.java` |
| MODIFY | `apps/audit-service/src/main/java/.../R2dbcAuditRepository.java` |
| MODIFY | `apps/audit-service/src/main/java/.../AuditEventConsumer.java` |
| MODIFY | `apps/audit-service/src/main/java/.../DeadLetterHandler.java` |
| MODIFY | `apps/cart-service/src/main/java/.../PostgresCartRepository.java` |

---

## Rollback Plan

If migration fails:
1. Revert `gradle/libs.versions.toml` to `spring-boot = "3.5.8"`
2. Revert `buildSrc/build.gradle.kts` plugin version
3. Revert starter renames in build.gradle.kts files
4. Remove Jackson compatibility flags from application.yml
5. Run `./gradlew clean buildAll testAll` to verify rollback

---

## Checklist

- [ ] Phase 1: Pre-migration validation complete (clean build, all tests pass)
- [ ] Phase 2: Version updates applied
- [ ] Phase 3: OAuth2 starters renamed
- [ ] Phase 4: Jackson migration strategy implemented
- [ ] Phase 5: Configuration properties updated
- [ ] Phase 6: Tests passing
- [ ] Phase 7: Documentation updated
- [ ] Phase 8: Final validation complete
  - [ ] Full build passes
  - [ ] All tests pass
  - [ ] Docker integration tests pass
  - [ ] Services start and respond to health checks
