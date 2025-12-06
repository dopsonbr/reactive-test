# 031_JAVA_25_UPGRADE

**Status: DRAFT**

---

## Overview

Upgrade the platform from Java 21 to Java 25 LTS (released September 2025). Java 25 brings performance improvements including compact object headers (20% memory reduction), virtual thread enhancements, and new language features. Spring Boot 4.0.0 (already in use) fully supports Java 25.

**Rationale:** Java 25 is the latest LTS release with support through 2030. Key benefits include:
- Compact object headers: 20% memory reduction, 10% faster processing
- Virtual threads no longer pin carrier threads in synchronized blocks
- Generational ZGC/Shenandoah for better GC performance
- Post-quantum cryptography readiness

## Goals

1. Update all Java version references from 21 to 25
2. Verify all dependencies are Java 25 compatible
3. Update Docker base images to eclipse-temurin:25-jre
4. Update CI/CD pipeline to use Java 25
5. Validate all services build, test, and run correctly
6. Update all documentation to reference Java 25

## References

**Sources:**
- [Oracle JDK 25 Migration Guide](https://docs.oracle.com/en/java/javase/25/migrate/significant-changes-jdk-25.html)
- [Java 25 Features - Baeldung](https://www.baeldung.com/java-25-features)
- [Spring Boot 4.0.0 Release](https://spring.io/blog/2025/11/20/spring-boot-4-0-0-available-now/)
- [OpenRewrite Java 25 Migration](https://docs.openrewrite.org/recipes/java/migrate/upgradetojava25)
- [JetBrains Java 25 LTS Guide](https://blog.jetbrains.com/idea/2025/09/java-25-lts-and-intellij-idea/)

---

## Architecture

### Version Update Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Java Version Updates                      │
├─────────────────────────────────────────────────────────────┤
│  buildSrc/platform.java-conventions.gradle.kts              │
│    └── JavaLanguageVersion.of(21) → of(25)                  │
├─────────────────────────────────────────────────────────────┤
│  docker/Dockerfile.*-service (8 files)                      │
│    └── eclipse-temurin:21-jre → eclipse-temurin:25-jre      │
├─────────────────────────────────────────────────────────────┤
│  .github/workflows/ci.yml                                   │
│    └── java-version: '21' → java-version: '25'              │
├─────────────────────────────────────────────────────────────┤
│  Documentation (CLAUDE.md, READMEs, etc.)                   │
│    └── All Java 21 references → Java 25                     │
└─────────────────────────────────────────────────────────────┘
```

### Breaking Changes to Address

| Change | Risk | Action Required |
|--------|------|-----------------|
| Graal JIT removal | None | Not used in this project |
| IO class changes | None | Not using compact source files |
| Dynamic agents | Low | Check for `-javaagent` flags |
| ZGC non-generational removal | None | Using default GC |

### Dependency Order

```
Phase 1: Gradle Toolchain
        │
        ▼
Phase 2: Docker Images
        │
        ▼
Phase 3: CI/CD Pipeline
        │
        ▼
Phase 4: Documentation
        │
        ▼
Phase 5: Validation (Comprehensive)
```

---

## Phase 1: Gradle Toolchain Update

**Prereqs:** None
**Blockers:** None

### 1.1 Update Java Conventions Plugin

**Files:**
- MODIFY: `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts`

**Implementation:**
```kotlin
// Change line 11
java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(25))  // Was 21
    }
}
```

### 1.2 Verify Gradle Compatibility

**Implementation:**
```bash
# Verify Gradle version supports Java 25
./gradlew --version

# Test compilation
./gradlew compileJava
```

**Note:** Gradle 8.14+ supports Java 25. Current version is 8.14.3 (compatible).

---

## Phase 2: Docker Image Updates

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Update All Service Dockerfiles

**Files:**
- MODIFY: `docker/Dockerfile.product-service`
- MODIFY: `docker/Dockerfile.cart-service`
- MODIFY: `docker/Dockerfile.checkout-service`
- MODIFY: `docker/Dockerfile.customer-service`
- MODIFY: `docker/Dockerfile.discount-service`
- MODIFY: `docker/Dockerfile.fulfillment-service`
- MODIFY: `docker/Dockerfile.audit-service`
- MODIFY: `docker/Dockerfile.order-service`

**Implementation:**
For each Dockerfile, change line 2:
```dockerfile
# Before
FROM eclipse-temurin:21-jre

# After
FROM eclipse-temurin:25-jre
```

### 2.2 Verify Docker Image Availability

**Implementation:**
```bash
# Verify eclipse-temurin:25-jre exists
docker pull eclipse-temurin:25-jre

# If not available, use alternative:
# FROM eclipse-temurin:25-jre-alpine (smaller)
# FROM amazoncorretto:25 (AWS alternative)
```

---

## Phase 3: CI/CD Pipeline Update

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Update GitHub Actions Workflow

**Files:**
- MODIFY: `.github/workflows/ci.yml`

**Implementation:**
```yaml
# Change java-version from '21' to '25'
- name: Set up JDK
  uses: actions/setup-java@v4
  with:
    distribution: 'temurin'
    java-version: '25'  # Was '21'
    cache: 'gradle'
```

### 3.2 Update Any Other CI Files

**Files:**
- REVIEW: `.github/workflows/*.yml` (check for any other Java version refs)

---

## Phase 4: Documentation Updates

**Prereqs:** Phase 3 complete
**Blockers:** None

### 4.1 Update CLAUDE.md / AGENTS.md

**Files:**
- MODIFY: `AGENTS.md` (CLAUDE.md is symlink)

**Implementation:**
Search and replace any Java 21 references with Java 25 if present.

### 4.2 Update Platform Library Documentation

**Files:**
- REVIEW: `libs/platform/README.md`
- REVIEW: `libs/platform/*/README.md`
- REVIEW: `apps/*/README.md`

### 4.3 Update Archived Plans (Optional)

**Note:** Archived plans are historical records. Update only if they contain setup instructions that users might follow.

---

## Phase 5: Comprehensive Validation

**Prereqs:** Phases 1-4 complete
**Blockers:** None

### 5.1 Clean Build Verification

**Implementation:**
```bash
# Clean all build artifacts
./gradlew clean
rm -rf ~/.gradle/caches/modules-2/files-2.1/

# Full build from scratch
./gradlew build

# Expected: BUILD SUCCESSFUL
```

### 5.2 Unit Test Verification

**Implementation:**
```bash
# Run all unit tests
./gradlew test

# Run tests for each service individually
./gradlew :apps:product-service:test
./gradlew :apps:cart-service:test
./gradlew :apps:customer-service:test
./gradlew :apps:discount-service:test
./gradlew :apps:fulfillment-service:test
./gradlew :apps:audit-service:test
./gradlew :apps:checkout-service:test
./gradlew :apps:order-service:test

# Run platform library tests
./gradlew :libs:platform:platform-logging:test
./gradlew :libs:platform:platform-cache:test
./gradlew :libs:platform:platform-resilience:test
./gradlew :libs:platform:platform-error:test
./gradlew :libs:platform:platform-security:test
./gradlew :libs:platform:platform-test:test

# Expected: All tests pass
```

### 5.3 Integration Test Verification

**Implementation:**
```bash
# Run integration tests (requires Docker for Testcontainers)
./gradlew integrationTest

# Or run with specific profiles
./gradlew :apps:product-service:integrationTest
./gradlew :apps:cart-service:integrationTest
./gradlew :apps:checkout-service:integrationTest
./gradlew :apps:order-service:integrationTest

# Expected: All integration tests pass
```

### 5.4 Docker Build Verification

**Implementation:**
```bash
# Build all bootJars
./gradlew bootJar

# Build Docker images
cd docker

# Build each service image
docker build -f Dockerfile.product-service -t product-service:java25 ..
docker build -f Dockerfile.cart-service -t cart-service:java25 ..
docker build -f Dockerfile.customer-service -t customer-service:java25 ..
docker build -f Dockerfile.discount-service -t discount-service:java25 ..
docker build -f Dockerfile.fulfillment-service -t fulfillment-service:java25 ..
docker build -f Dockerfile.audit-service -t audit-service:java25 ..
docker build -f Dockerfile.checkout-service -t checkout-service:java25 ..
docker build -f Dockerfile.order-service -t order-service:java25 ..

# Expected: All images build successfully
```

### 5.5 Runtime Verification

**Implementation:**
```bash
# Start full stack
cd docker && docker compose up -d

# Wait for services to be healthy
docker compose ps

# Verify each service health endpoint
curl http://localhost:8080/actuator/health  # product-service
curl http://localhost:8081/actuator/health  # cart-service
curl http://localhost:8083/actuator/health  # customer-service
curl http://localhost:8084/actuator/health  # discount-service
curl http://localhost:8085/actuator/health  # fulfillment-service
curl http://localhost:8086/actuator/health  # audit-service
curl http://localhost:8087/actuator/health  # checkout-service
curl http://localhost:8088/actuator/health  # order-service

# Expected: All return {"status":"UP"}
```

### 5.6 Java Version Verification

**Implementation:**
```bash
# Verify running Java version in containers
docker exec product-service java -version
# Expected: openjdk version "25" or "25.0.x"

# Verify via actuator (if env endpoint exposed)
curl http://localhost:8080/actuator/env | jq '.propertySources[] | select(.name | contains("systemProperties")) | .properties["java.version"]'
# Expected: "25" or "25.0.x"
```

### 5.7 Performance Baseline (Optional)

**Implementation:**
```bash
# Run k6 load test to establish baseline
cd docker
docker compose --profile test-product up k6-product

# Compare with previous Java 21 baseline if available
# Look for improvements in:
# - Response times (should be ~10% better)
# - Memory usage (should be ~20% lower with compact headers)
# - GC pause times (should be improved)
```

### 5.8 Dependency Compatibility Check

**Implementation:**
```bash
# Check for any deprecated API usage
./gradlew dependencies --configuration compileClasspath | grep -i "FAILED\|error"

# Run dependency updates check
./gradlew dependencyUpdates

# Key libraries to verify compatibility:
# - Lombok (check for Java 25 support)
# - MapStruct (if used)
# - Resilience4j (already compatible via Spring Boot 4.0)
# - R2DBC drivers
# - Testcontainers
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts` | Java toolchain 21→25 |
| MODIFY | `docker/Dockerfile.product-service` | Base image 21→25 |
| MODIFY | `docker/Dockerfile.cart-service` | Base image 21→25 |
| MODIFY | `docker/Dockerfile.checkout-service` | Base image 21→25 |
| MODIFY | `docker/Dockerfile.customer-service` | Base image 21→25 |
| MODIFY | `docker/Dockerfile.discount-service` | Base image 21→25 |
| MODIFY | `docker/Dockerfile.fulfillment-service` | Base image 21→25 |
| MODIFY | `docker/Dockerfile.audit-service` | Base image 21→25 |
| MODIFY | `docker/Dockerfile.order-service` | Base image 21→25 |
| MODIFY | `.github/workflows/ci.yml` | CI Java version 21→25 |
| MODIFY | `AGENTS.md` | Documentation updates |

---

## Rollback Plan

If issues are discovered after upgrade:

```bash
# Revert Gradle convention
# Change JavaLanguageVersion.of(25) back to of(21)

# Revert Docker images
# Change eclipse-temurin:25-jre back to eclipse-temurin:21-jre

# Revert CI
# Change java-version: '25' back to '21'

# Rebuild
./gradlew clean build
```

---

## Known Issues & Mitigations

| Issue | Mitigation |
|-------|------------|
| Lombok compatibility | Lombok 1.18.30+ supports Java 25; verify version in libs.versions.toml |
| Dynamic agent warnings | Add `-XX:+EnableDynamicAgentLoading` if needed for profilers |
| IDE support | Update IntelliJ IDEA to 2025.2+ for full Java 25 support |
| Gradle daemon | May need `./gradlew --stop` after upgrade to clear cached JVM |

---

## Checklist

- [ ] Phase 1: Gradle toolchain updated to Java 25
- [ ] Phase 2: All 8 Dockerfiles updated to eclipse-temurin:25-jre
- [ ] Phase 3: CI/CD pipeline updated to Java 25
- [ ] Phase 4: Documentation updated
- [ ] Phase 5.1: Clean build successful
- [ ] Phase 5.2: All unit tests pass
- [ ] Phase 5.3: All integration tests pass
- [ ] Phase 5.4: All Docker images build
- [ ] Phase 5.5: All services start and respond healthy
- [ ] Phase 5.6: Java 25 version confirmed in runtime
- [ ] Phase 5.7: Performance baseline established (optional)
- [ ] Phase 5.8: No dependency compatibility issues
