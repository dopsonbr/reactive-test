# 007: Gradle Multi-Module Refactoring

## Overview

Convert the monolithic reactive-test project into a Gradle multi-module build with shared platform libraries, enabling multiple applications (product-service, cart-service) to leverage common infrastructure for logging, resilience, caching, error handling, and security.

## Goals

1. **Modular Architecture**: Extract cross-cutting concerns into reusable shared libraries
2. **Platform BOM**: Centralized dependency version management extending Spring Boot BOM
3. **Convention Plugins**: Eliminate build script duplication via `buildSrc` plugins
4. **Multi-App Support**: product-service (existing) + cart-service (placeholder)
5. **Isolated Testing**: Chaos tests runnable per-service or across the full system
6. **Best Practices**: Follow Gradle, Java, and Spring Boot conventions

## Research Summary

Key resources consulted:
- [Gradle Version Catalogs](https://docs.gradle.org/current/userguide/version_catalogs.html)
- [Gradle Convention Plugins](https://docs.gradle.org/current/samples/sample_convention_plugins.html)
- [Gradle Platforms (BOM)](https://docs.gradle.org/current/userguide/platforms.html)
- [Spring Boot Gradle Plugin - Managing Dependencies](https://docs.spring.io/spring-boot/gradle-plugin/managing-dependencies.html)
- [Bootiful Builds Best Practices](https://erichaag.dev/posts/bootiful-builds-best-practices-spring-boot-gradle/)
- [Multi-Module Project With Spring Boot | Baeldung](https://www.baeldung.com/spring-boot-multiple-modules)

---

## Target Directory Structure

```
reactive-test/
├── gradle/
│   └── libs.versions.toml                    # Version catalog (plugins + non-BOM deps)
├── buildSrc/
│   ├── build.gradle.kts                      # Convention plugin dependencies
│   ├── settings.gradle.kts                   # Access parent version catalog
│   └── src/main/kotlin/
│       ├── platform.java-conventions.gradle.kts
│       ├── platform.library-conventions.gradle.kts
│       └── platform.application-conventions.gradle.kts
│
├── platform-bom/                             # Platform BOM (extends Spring Boot BOM)
│   └── build.gradle.kts
│
├── platform-logging/                         # Structured JSON logging library
│   ├── build.gradle.kts
│   └── src/main/java/org/example/platform/logging/
│       ├── StructuredLogger.java
│       ├── LogEntry.java
│       ├── RequestLogData.java
│       ├── ResponseLogData.java
│       ├── MessageLogData.java
│       ├── ErrorLogData.java
│       └── WebClientLoggingFilter.java
│
├── platform-resilience/                      # Resilience4j reactive wrappers
│   ├── build.gradle.kts
│   └── src/main/java/org/example/platform/resilience/
│       ├── ReactiveResilience.java
│       └── ResilienceProperties.java
│
├── platform-cache/                           # Non-blocking cache abstraction
│   ├── build.gradle.kts
│   └── src/main/java/org/example/platform/cache/
│       ├── ReactiveCacheService.java
│       ├── RedisCacheService.java
│       └── CacheKeyGenerator.java
│
├── platform-error/                           # Global error handling
│   ├── build.gradle.kts
│   └── src/main/java/org/example/platform/error/
│       ├── ErrorResponse.java
│       ├── GlobalErrorHandler.java
│       └── ValidationException.java
│
├── platform-webflux/                         # Common WebFlux utilities
│   ├── build.gradle.kts
│   └── src/main/java/org/example/platform/webflux/
│       ├── RequestMetadata.java
│       ├── ContextKeys.java
│       ├── WebClientFactory.java
│       └── ReactiveRequestValidator.java
│
├── platform-security/                        # Security (placeholder per 006)
│   ├── build.gradle.kts
│   └── src/main/java/org/example/platform/security/
│       └── package-info.java                 # Placeholder
│
├── platform-test/                            # Shared test utilities
│   ├── build.gradle.kts
│   └── src/main/java/org/example/platform/test/
│       ├── WireMockSupport.java
│       ├── RedisTestSupport.java
│       └── ReactorTestSupport.java
│
├── product-service/                          # Product aggregation service (current app)
│   ├── build.gradle.kts
│   └── src/
│       ├── main/java/org/example/product/
│       │   ├── ProductServiceApplication.java
│       │   ├── controller/ProductController.java
│       │   ├── service/ProductService.java
│       │   ├── repository/{merchandise,price,inventory}/
│       │   ├── domain/Product.java
│       │   └── config/ProductServiceConfig.java
│       ├── main/resources/
│       │   ├── application.yml
│       │   ├── application-docker.yml
│       │   └── logback-spring.xml
│       └── test/java/org/example/product/
│
├── cart-service/                             # Cart service (new placeholder)
│   ├── build.gradle.kts
│   └── src/
│       ├── main/java/org/example/cart/
│       │   ├── CartServiceApplication.java
│       │   ├── controller/CartController.java
│       │   ├── service/CartService.java
│       │   ├── domain/{Cart,CartItem}.java
│       │   └── config/CartServiceConfig.java
│       ├── main/resources/
│       │   ├── application.yml
│       │   ├── application-docker.yml
│       │   └── logback-spring.xml
│       └── test/java/org/example/cart/
│
├── docker/
│   ├── docker-compose.yml                    # Full system (all services + infra)
│   ├── docker-compose.product.yml            # Product service isolation
│   ├── docker-compose.cart.yml               # Cart service isolation
│   └── {prometheus,loki,tempo,promtail,grafana}/
│
├── e2e-test/
│   ├── k6/
│   │   ├── lib/                              # Shared test utilities
│   │   │   ├── config.js
│   │   │   ├── checks.js
│   │   │   └── scenarios.js
│   │   ├── product/                          # Product-specific tests
│   │   │   ├── load-test.js
│   │   │   ├── resilience-test.js
│   │   │   └── circuit-breaker-test.js
│   │   ├── cart/                             # Cart-specific tests
│   │   │   └── load-test.js
│   │   └── system/                           # Full system tests
│   │       └── integration-test.js
│   └── TEST_PLAN.md
│
├── settings.gradle.kts                       # Multi-module settings
├── build.gradle.kts                          # Root build (minimal)
├── CLAUDE.md                                 # Updated AI guidance
├── PACKAGES.md                               # Updated package index
└── README.md                                 # Updated project overview
```

---

## Phase 1: Build Infrastructure Setup

### Step 1.1: Create Version Catalog

**File:** `gradle/libs.versions.toml`

```toml
[versions]
# Spring Boot provides most versions via BOM - only declare non-BOM deps here
spring-boot = "3.5.0"
resilience4j = "2.2.0"
logstash-logback = "8.0"
opentelemetry = "1.44.1"
testcontainers = "1.20.4"
wiremock = "3.10.0"

[libraries]
# Resilience4j (not in Spring Boot BOM)
resilience4j-spring-boot3 = { module = "io.github.resilience4j:resilience4j-spring-boot3", version.ref = "resilience4j" }
resilience4j-reactor = { module = "io.github.resilience4j:resilience4j-reactor", version.ref = "resilience4j" }
resilience4j-micrometer = { module = "io.github.resilience4j:resilience4j-micrometer", version.ref = "resilience4j" }

# Logging
logstash-logback-encoder = { module = "net.logstash.logback:logstash-logback-encoder", version.ref = "logstash-logback" }

# OpenTelemetry (API only - agent provides impl)
opentelemetry-api = { module = "io.opentelemetry:opentelemetry-api", version.ref = "opentelemetry" }

# Testing
testcontainers-bom = { module = "org.testcontainers:testcontainers-bom", version.ref = "testcontainers" }
testcontainers-core = { module = "org.testcontainers:testcontainers" }
testcontainers-junit-jupiter = { module = "org.testcontainers:junit-jupiter" }
wiremock-standalone = { module = "org.wiremock:wiremock-standalone", version.ref = "wiremock" }

[bundles]
resilience4j = ["resilience4j-spring-boot3", "resilience4j-reactor", "resilience4j-micrometer"]
testcontainers = ["testcontainers-core", "testcontainers-junit-jupiter"]

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
spring-dependency-management = { id = "io.spring.dependency-management", version = "1.1.7" }
```

### Step 1.2: Create buildSrc Convention Plugins

**File:** `buildSrc/settings.gradle.kts`

```kotlin
// Enable access to root project's version catalog
dependencyResolutionManagement {
    versionCatalogs {
        create("libs") {
            from(files("../gradle/libs.versions.toml"))
        }
    }
}

rootProject.name = "buildSrc"
```

**File:** `buildSrc/build.gradle.kts`

```kotlin
plugins {
    `kotlin-dsl`
}

repositories {
    mavenCentral()
    gradlePluginPortal()
}

dependencies {
    // Make Spring Boot plugin available to convention plugins
    implementation("org.springframework.boot:spring-boot-gradle-plugin:3.5.0")
    implementation("io.spring.gradle:dependency-management-plugin:1.1.7")
}
```

**File:** `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts`

```kotlin
// Shared Java conventions for all modules
plugins {
    java
}

group = "org.example.platform"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
    options.compilerArgs.addAll(listOf("-Xlint:all", "-Werror"))
}

tasks.withType<Test> {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
    }
}
```

**File:** `buildSrc/src/main/kotlin/platform.library-conventions.gradle.kts`

```kotlin
// Conventions for shared library modules
plugins {
    id("platform.java-conventions")
    `java-library`
}

// Libraries don't produce executable JARs
tasks.named("jar") {
    enabled = true
}
```

**File:** `buildSrc/src/main/kotlin/platform.application-conventions.gradle.kts`

```kotlin
// Conventions for Spring Boot application modules
plugins {
    id("platform.java-conventions")
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

// Applications produce bootable JARs
springBoot {
    buildInfo()
}

tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    archiveClassifier.set("")
}

tasks.named<Jar>("jar") {
    enabled = false
}
```

### Step 1.3: Create Root Build Files

**File:** `settings.gradle.kts`

```kotlin
rootProject.name = "reactive-platform"

// Platform libraries
include("platform-bom")
include("platform-logging")
include("platform-resilience")
include("platform-cache")
include("platform-error")
include("platform-webflux")
include("platform-security")
include("platform-test")

// Applications
include("product-service")
include("cart-service")
```

**File:** `build.gradle.kts` (root)

```kotlin
// Root build - minimal, delegates to convention plugins

plugins {
    base
}

allprojects {
    group = "org.example.platform"
    version = "1.0.0-SNAPSHOT"
}

// Convenience tasks
tasks.register("buildAll") {
    dependsOn(subprojects.map { it.tasks.named("build") })
    description = "Build all modules"
    group = "build"
}

tasks.register("testAll") {
    dependsOn(subprojects.map { it.tasks.named("test") })
    description = "Run tests in all modules"
    group = "verification"
}
```

### Step 1.4: Create Platform BOM

**File:** `platform-bom/build.gradle.kts`

```kotlin
plugins {
    `java-platform`
}

javaPlatform {
    allowDependencies()
}

dependencies {
    // Import Spring Boot BOM as the foundation
    api(platform(org.springframework.boot.gradle.plugin.SpringBootPlugin.BOM_COORDINATES))

    // Import Testcontainers BOM
    api(platform(libs.testcontainers.bom))

    // Constrain non-BOM dependencies to specific versions
    constraints {
        api(libs.resilience4j.spring.boot3)
        api(libs.resilience4j.reactor)
        api(libs.resilience4j.micrometer)
        api(libs.logstash.logback.encoder)
        api(libs.opentelemetry.api)
        api(libs.wiremock.standalone)
    }
}
```

---

## Phase 2: Extract Platform Libraries

### Step 2.1: platform-logging

**Purpose:** Structured JSON logging with Reactor Context and OTEL trace correlation

**File:** `platform-logging/build.gradle.kts`

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":platform-bom")))

    // Core dependencies
    api("org.springframework.boot:spring-boot-starter-webflux")
    api("com.fasterxml.jackson.core:jackson-databind")
    api(libs.logstash.logback.encoder)
    api(libs.opentelemetry.api)

    // Optional: Micrometer context propagation
    implementation("io.micrometer:context-propagation")

    // Test dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
```

**Classes to extract (from `org.example.reactivetest.logging` → `org.example.platform.logging`):**
- `StructuredLogger.java` - Main entry point
- `LogEntry.java` - Root log envelope
- `RequestLogData.java` - Request log payload
- `ResponseLogData.java` - Response log payload
- `MessageLogData.java` - Simple message payload
- `ErrorLogData.java` - Error log payload

**Additional class (from `org.example.reactivetest.config`):**
- `WebClientLoggingFilter.java` - Outbound HTTP logging filter

**Changes required:**
1. Update package declarations to `org.example.platform.logging`
2. Make `StructuredLogger` configurable (injectable ObjectMapper)
3. Add `@AutoConfiguration` for Spring Boot autoconfiguration
4. Create `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`

### Step 2.2: platform-resilience

**Purpose:** Resilience4j reactive wrappers with standardized decorator ordering

**File:** `platform-resilience/build.gradle.kts`

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":platform-bom")))

    api("org.springframework.boot:spring-boot-starter-webflux")
    api("org.springframework.boot:spring-boot-starter-aop")
    api("org.springframework.boot:spring-boot-starter-actuator")
    api(libs.bundles.resilience4j)

    // Logging integration
    implementation(project(":platform-logging"))

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
```

**Classes to extract (from `org.example.reactivetest.resilience` → `org.example.platform.resilience`):**
- `ReactiveResilience.java` - Main wrapper

**New classes to create:**
- `ResilienceAutoConfiguration.java` - Spring Boot autoconfiguration
- `ResilienceProperties.java` - Configuration properties extension

### Step 2.3: platform-cache

**Purpose:** Non-blocking cache abstraction with Redis implementation

**File:** `platform-cache/build.gradle.kts`

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":platform-bom")))

    api("org.springframework.boot:spring-boot-starter-data-redis-reactive")
    api("com.fasterxml.jackson.core:jackson-databind")

    // Logging integration
    implementation(project(":platform-logging"))

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
    testImplementation(libs.testcontainers.core)
    testImplementation(libs.testcontainers.junit.jupiter)
}
```

**Classes to extract (from `org.example.reactivetest.cache` → `org.example.platform.cache`):**
- `ReactiveCacheService.java` - Interface
- `RedisCacheService.java` - Implementation
- `CacheKeyGenerator.java` - Key generation utility

**Classes to extract (from `org.example.reactivetest.config`):**
- `CacheProperties.java` → Generalize as `PlatformCacheProperties.java`
- `RedisConfig.java` → `RedisCacheAutoConfiguration.java`

### Step 2.4: platform-error

**Purpose:** Global exception handling with Resilience4j-aware mapping

**File:** `platform-error/build.gradle.kts`

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":platform-bom")))

    api("org.springframework.boot:spring-boot-starter-webflux")
    api(libs.resilience4j.reactor)
    api(libs.opentelemetry.api)

    // Logging integration
    implementation(project(":platform-logging"))

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
```

**Classes to extract (from `org.example.reactivetest.error` → `org.example.platform.error`):**
- `ErrorResponse.java` - Structured error response
- `GlobalErrorHandler.java` - Abstract base or concrete handler
- `ValidationException.java` - Custom validation exception

**Changes required:**
1. Make `GlobalErrorHandler` extensible (applications can add custom handlers)
2. Add `@AutoConfiguration` for autoconfiguration

### Step 2.5: platform-webflux

**Purpose:** Common WebFlux utilities (context, validation, WebClient factory)

**File:** `platform-webflux/build.gradle.kts`

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":platform-bom")))

    api("org.springframework.boot:spring-boot-starter-webflux")

    // Logging integration for WebClient filter
    implementation(project(":platform-logging"))

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
```

**Classes to extract:**

From `org.example.reactivetest.context` → `org.example.platform.webflux.context`:
- `RequestMetadata.java` - Request metadata record (generalized)
- `ContextKeys.java` - Reactor Context key constants

From `org.example.reactivetest.config` → `org.example.platform.webflux`:
- `WebClientConfig.java` → `WebClientFactory.java` (factory pattern)

From `org.example.reactivetest.validation` → `org.example.platform.webflux.validation`:
- `RequestValidator.java` → `ReactiveRequestValidator.java` (interface + base class)

### Step 2.6: platform-security (Placeholder)

**Purpose:** Placeholder for OAuth2/JWT security (implement per 006_AUTHN_AUTHZ.md)

**File:** `platform-security/build.gradle.kts`

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":platform-bom")))

    // Placeholder dependencies - uncomment when implementing
    // api("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    // api("org.springframework.boot:spring-boot-starter-oauth2-client")

    api("org.springframework.boot:spring-boot-starter-webflux")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

**File:** `platform-security/src/main/java/org/example/platform/security/package-info.java`

```java
/**
 * Platform security module.
 *
 * <p>This module will provide:
 * <ul>
 *   <li>OAuth2 resource server configuration</li>
 *   <li>JWT token validation</li>
 *   <li>OAuth2 client credentials for outbound calls</li>
 *   <li>Security headers and CORS configuration</li>
 * </ul>
 *
 * <p>Implementation planned in 006_AUTHN_AUTHZ.md
 *
 * @see <a href="file:../006_AUTHN_AUTHZ.md">Authentication/Authorization Plan</a>
 */
package org.example.platform.security;
```

### Step 2.7: platform-test

**Purpose:** Shared test utilities (Testcontainers, WireMock, Reactor test helpers)

**File:** `platform-test/build.gradle.kts`

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":platform-bom")))

    api("org.springframework.boot:spring-boot-starter-test")
    api("io.projectreactor:reactor-test")
    api(libs.testcontainers.core)
    api(libs.testcontainers.junit.jupiter)
    api(libs.wiremock.standalone)

    // Access to platform modules for test helpers
    implementation(project(":platform-logging"))
    implementation(project(":platform-cache"))
}
```

**New classes to create:**
- `WireMockSupport.java` - WireMock configuration helpers
- `RedisTestSupport.java` - Redis Testcontainer helpers
- `ReactorTestSupport.java` - StepVerifier utilities

---

## Phase 3: Migrate Applications

### Step 3.1: product-service (Existing App)

**File:** `product-service/build.gradle.kts`

```kotlin
plugins {
    id("platform.application-conventions")
}

dependencies {
    // Platform BOM for version management
    implementation(platform(project(":platform-bom")))

    // Platform libraries
    implementation(project(":platform-logging"))
    implementation(project(":platform-resilience"))
    implementation(project(":platform-cache"))
    implementation(project(":platform-error"))
    implementation(project(":platform-webflux"))
    implementation(project(":platform-security"))

    // Spring Boot starters (versions from BOM)
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")

    // Prometheus metrics
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    // Test dependencies
    testImplementation(project(":platform-test"))
}
```

**Migration steps:**
1. Move application code from `src/main/java/org/example/reactivetest/` to `product-service/src/main/java/org/example/product/`
2. Update package declarations from `org.example.reactivetest` to `org.example.product`
3. Remove cross-cutting classes (now in platform libraries)
4. Update imports to reference platform library packages
5. Move resources (`application.yml`, `application-docker.yml`, `logback-spring.xml`)
6. Move tests, update package references

**Final product-service structure:**
```
product-service/src/main/java/org/example/product/
├── ProductServiceApplication.java
├── controller/
│   └── ProductController.java
├── service/
│   └── ProductService.java
├── repository/
│   ├── merchandise/
│   │   ├── MerchandiseRepository.java
│   │   └── MerchandiseResponse.java
│   ├── price/
│   │   ├── PriceRepository.java
│   │   ├── PriceRequest.java
│   │   └── PriceResponse.java
│   └── inventory/
│       ├── InventoryRepository.java
│       ├── InventoryRequest.java
│       └── InventoryResponse.java
├── domain/
│   └── Product.java
├── validation/
│   └── ProductRequestValidator.java  # Extends platform validator
└── config/
    └── ProductServiceConfig.java     # App-specific WebClient beans
```

### Step 3.2: cart-service (New Placeholder)

**File:** `cart-service/build.gradle.kts`

```kotlin
plugins {
    id("platform.application-conventions")
}

dependencies {
    implementation(platform(project(":platform-bom")))

    // Platform libraries
    implementation(project(":platform-logging"))
    implementation(project(":platform-resilience"))
    implementation(project(":platform-cache"))
    implementation(project(":platform-error"))
    implementation(project(":platform-webflux"))
    implementation(project(":platform-security"))

    // Spring Boot starters
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")

    // Prometheus metrics
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    // Test dependencies
    testImplementation(project(":platform-test"))
}
```

**Cart service placeholder structure:**
```
cart-service/src/main/java/org/example/cart/
├── CartServiceApplication.java
├── controller/
│   └── CartController.java           # POST /carts, GET /carts/{id}, PUT /carts/{id}/items
├── service/
│   └── CartService.java              # Cart operations (in-memory for placeholder)
├── domain/
│   ├── Cart.java                     # { id, userId, items, createdAt, updatedAt }
│   └── CartItem.java                 # { sku, quantity, price }
└── config/
    └── CartServiceConfig.java        # App-specific configuration
```

**Placeholder endpoints:**
- `POST /carts` - Create new cart
- `GET /carts/{id}` - Get cart by ID
- `PUT /carts/{id}/items` - Add/update item in cart
- `DELETE /carts/{id}/items/{sku}` - Remove item from cart
- `GET /carts/{id}/summary` - Get cart summary with totals

---

## Phase 4: Docker Infrastructure

### Step 4.1: Update Docker Compose for Multi-Service

**File:** `docker/docker-compose.yml` (Full system)

```yaml
services:
  # ===== Applications =====
  product-service:
    build:
      context: ..
      dockerfile: product-service/Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317
    depends_on:
      - redis
      - wiremock
    networks:
      - platform-network
    labels:
      - "service=product-service"

  cart-service:
    build:
      context: ..
      dockerfile: cart-service/Dockerfile
    ports:
      - "8081:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317
    depends_on:
      - redis
      - product-service
    networks:
      - platform-network
    labels:
      - "service=cart-service"

  # ===== Infrastructure =====
  wiremock:
    image: wiremock/wiremock:3.10.0
    ports:
      - "8082:8080"
    volumes:
      - ./wiremock:/home/wiremock
    networks:
      - platform-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - platform-network

  # ===== Observability (unchanged) =====
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - platform-network

  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - ./loki/loki-config.yml:/etc/loki/local-config.yaml
    networks:
      - platform-network

  tempo:
    image: grafana/tempo:latest
    ports:
      - "3200:3200"
      - "4317:4317"
    volumes:
      - ./tempo/tempo-config.yml:/etc/tempo/tempo.yaml
    networks:
      - platform-network

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - ./promtail/promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log
    networks:
      - platform-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
    networks:
      - platform-network

networks:
  platform-network:
    driver: bridge
```

**File:** `docker/docker-compose.product.yml` (Product service isolation)

```yaml
# Isolated product-service for targeted chaos testing
include:
  - docker-compose.yml

services:
  cart-service:
    profiles:
      - disabled  # Exclude cart-service

  # Override product-service ports if needed
  product-service:
    ports:
      - "8080:8080"
```

**File:** `docker/docker-compose.cart.yml` (Cart service isolation)

```yaml
# Isolated cart-service for targeted chaos testing
include:
  - docker-compose.yml

services:
  product-service:
    profiles:
      - disabled  # Exclude product-service

  cart-service:
    ports:
      - "8080:8080"  # Use standard port when isolated
```

### Step 4.2: Update Prometheus Configuration

**File:** `docker/prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'product-service'
    static_configs:
      - targets: ['product-service:8080']
    metrics_path: /actuator/prometheus

  - job_name: 'cart-service'
    static_configs:
      - targets: ['cart-service:8080']
    metrics_path: /actuator/prometheus
```

### Step 4.3: Create Dockerfiles for Applications

**File:** `product-service/Dockerfile`

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY build/libs/product-service-*.jar app.jar

# OpenTelemetry Java Agent
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.10.0/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar

EXPOSE 8080

ENTRYPOINT ["java", "-javaagent:/app/opentelemetry-javaagent.jar", "-jar", "app.jar"]
```

**File:** `cart-service/Dockerfile`

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY build/libs/cart-service-*.jar app.jar

# OpenTelemetry Java Agent
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.10.0/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar

EXPOSE 8080

ENTRYPOINT ["java", "-javaagent:/app/opentelemetry-javaagent.jar", "-jar", "app.jar"]
```

---

## Phase 5: End-to-End Tests

### Step 5.1: Restructure k6 Tests

**Directory structure:**
```
e2e-test/k6/
├── lib/
│   ├── config.js           # Shared configuration
│   ├── checks.js           # Common check functions
│   └── scenarios.js        # Reusable scenario definitions
├── product/
│   ├── load-test.js        # Product service load test
│   ├── resilience-test.js  # Product chaos testing
│   └── circuit-breaker-test.js
├── cart/
│   ├── load-test.js        # Cart service load test
│   └── resilience-test.js  # Cart chaos testing
└── system/
    └── integration-test.js # Full system integration test
```

**File:** `e2e-test/k6/lib/config.js`

```javascript
export const CONFIG = {
  product: {
    baseUrl: __ENV.PRODUCT_SERVICE_URL || 'http://localhost:8080',
    endpoints: {
      product: '/products'
    }
  },
  cart: {
    baseUrl: __ENV.CART_SERVICE_URL || 'http://localhost:8081',
    endpoints: {
      carts: '/carts'
    }
  },
  wiremock: {
    baseUrl: __ENV.WIREMOCK_URL || 'http://localhost:8082'
  }
};

export const THRESHOLDS = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99']
};
```

### Step 5.2: Update Docker Compose for Test Profiles

**Add to `docker/docker-compose.yml`:**

```yaml
  # ===== Test Runners =====
  k6-product:
    image: grafana/k6:latest
    profiles:
      - test-product
    volumes:
      - ../e2e-test/k6:/scripts
    environment:
      - PRODUCT_SERVICE_URL=http://product-service:8080
      - WIREMOCK_URL=http://wiremock:8080
    command: run /scripts/product/load-test.js
    networks:
      - platform-network
    depends_on:
      - product-service

  k6-cart:
    image: grafana/k6:latest
    profiles:
      - test-cart
    volumes:
      - ../e2e-test/k6:/scripts
    environment:
      - CART_SERVICE_URL=http://cart-service:8080
    command: run /scripts/cart/load-test.js
    networks:
      - platform-network
    depends_on:
      - cart-service

  k6-system:
    image: grafana/k6:latest
    profiles:
      - test-system
    volumes:
      - ../e2e-test/k6:/scripts
    environment:
      - PRODUCT_SERVICE_URL=http://product-service:8080
      - CART_SERVICE_URL=http://cart-service:8080
    command: run /scripts/system/integration-test.js
    networks:
      - platform-network
    depends_on:
      - product-service
      - cart-service

  k6-product-chaos:
    image: grafana/k6:latest
    profiles:
      - chaos-product
    volumes:
      - ../e2e-test/k6:/scripts
    environment:
      - PRODUCT_SERVICE_URL=http://product-service:8080
      - WIREMOCK_URL=http://wiremock:8080
    command: run /scripts/product/resilience-test.js
    networks:
      - platform-network
    depends_on:
      - product-service
```

---

## Phase 6: Documentation Updates

### Step 6.1: Update CLAUDE.md

Update to reflect multi-module structure:

```markdown
## Build Commands

# Build all modules
./gradlew buildAll

# Build specific module
./gradlew :platform-logging:build
./gradlew :product-service:build
./gradlew :cart-service:build

# Run specific application
./gradlew :product-service:bootRun
./gradlew :cart-service:bootRun

# Run all tests
./gradlew testAll

# Run module tests
./gradlew :platform-logging:test
./gradlew :product-service:test
```

### Step 6.2: Update PACKAGES.md

Create new package index reflecting module structure.

### Step 6.3: Update README.md

Add multi-module build instructions and architecture overview.

---

## Implementation Order

### Batch 1: Build Infrastructure (Foundation)
1. Create `gradle/libs.versions.toml`
2. Create `buildSrc/` with convention plugins
3. Create `settings.gradle.kts` and root `build.gradle.kts`
4. Create `platform-bom/build.gradle.kts`
5. Verify build compiles: `./gradlew build`

### Batch 2: Platform Libraries (Extract Cross-Cutting Concerns)
6. Extract `platform-logging` (logging + WebClient filter)
7. Extract `platform-resilience` (Resilience4j wrapper)
8. Extract `platform-cache` (Redis caching)
9. Extract `platform-error` (error handling)
10. Extract `platform-webflux` (context, validation, WebClient factory)
11. Create `platform-security` placeholder
12. Create `platform-test` (test utilities)
13. Verify all libraries compile: `./gradlew buildAll`

### Batch 3: Product Service Migration
14. Create `product-service/` module structure
15. Move application code, update packages
16. Update imports to use platform libraries
17. Move and update tests
18. Verify product-service works: `./gradlew :product-service:test`

### Batch 4: Cart Service Creation
19. Create `cart-service/` module structure
20. Implement placeholder endpoints
21. Add basic tests
22. Verify cart-service works: `./gradlew :cart-service:test`

### Batch 5: Docker & Testing Infrastructure
23. Update `docker/docker-compose.yml` for multi-service
24. Create service-specific compose overrides
25. Create Dockerfiles for both services
26. Restructure k6 tests (rename `perf-test/` → `e2e-test/`)
27. Add test profiles to docker-compose

### Batch 6: Documentation & Cleanup
28. Update CLAUDE.md
29. Update PACKAGES.md
30. Update README.md
31. Create per-module documentation (README, CONTENTS, AGENTS)
32. Archive this plan

---

## Verification Checklist

### Build Verification
- [ ] `./gradlew buildAll` succeeds
- [ ] `./gradlew testAll` passes all tests
- [ ] No duplicate dependency declarations
- [ ] Version catalog properly resolves

### Application Verification
- [ ] `./gradlew :product-service:bootRun` starts successfully
- [ ] `./gradlew :cart-service:bootRun` starts successfully
- [ ] Product endpoint works: `GET /products/SKU123`
- [ ] Cart endpoints work: `POST /carts`, `GET /carts/{id}`

### Docker Verification
- [ ] `docker compose up -d` starts full system
- [ ] `docker compose -f docker-compose.product.yml up -d` isolates product
- [ ] `docker compose -f docker-compose.cart.yml up -d` isolates cart
- [ ] Services can communicate within network

### Observability Verification
- [ ] Both services export Prometheus metrics
- [ ] Logs appear in Loki (via promtail)
- [ ] Traces appear in Tempo
- [ ] Grafana dashboards show both services

### Test Verification
- [ ] `docker compose --profile test-product up k6-product` runs product tests
- [ ] `docker compose --profile test-cart up k6-cart` runs cart tests
- [ ] `docker compose --profile test-system up k6-system` runs integration tests
- [ ] `docker compose --profile chaos-product up k6-product-chaos` runs chaos tests

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Circular dependencies between platform modules | Build failure | Careful module design; logging at bottom, others layer on top |
| Breaking existing tests during migration | Delayed delivery | Migrate incrementally; run tests after each step |
| Configuration drift between services | Inconsistent behavior | Share config via platform modules; service-specific overrides only |
| Increased build time | Developer friction | Use Gradle build cache; parallel builds |
| Complexity for new developers | Onboarding difficulty | Clear documentation; architecture diagrams |

---

## Future Considerations

1. **Gradle Composite Builds**: If the project grows, consider composite builds for faster development
2. **Shared Wiremock Stubs**: Create a `platform-wiremock` module with reusable stubs
3. **API Gateway**: Add a gateway service (Spring Cloud Gateway) for routing
4. **Service Discovery**: Add Consul/Eureka if services need dynamic discovery
5. **Event-Driven**: Add Kafka/RabbitMQ for async communication between services

---

## Appendix A: Package Migration Map

| Current Package | Target Module | Target Package |
|-----------------|---------------|----------------|
| `o.e.reactivetest.logging.*` | platform-logging | `o.e.platform.logging.*` |
| `o.e.reactivetest.resilience.*` | platform-resilience | `o.e.platform.resilience.*` |
| `o.e.reactivetest.cache.*` | platform-cache | `o.e.platform.cache.*` |
| `o.e.reactivetest.error.*` | platform-error | `o.e.platform.error.*` |
| `o.e.reactivetest.context.*` | platform-webflux | `o.e.platform.webflux.context.*` |
| `o.e.reactivetest.validation.*` | platform-webflux | `o.e.platform.webflux.validation.*` |
| `o.e.reactivetest.config.WebClient*` | platform-webflux | `o.e.platform.webflux.*` |
| `o.e.reactivetest.config.Redis*` | platform-cache | `o.e.platform.cache.*` |
| `o.e.reactivetest.config.Cache*` | platform-cache | `o.e.platform.cache.*` |
| `o.e.reactivetest.controller.*` | product-service | `o.e.product.controller.*` |
| `o.e.reactivetest.service.*` | product-service | `o.e.product.service.*` |
| `o.e.reactivetest.repository.*` | product-service | `o.e.product.repository.*` |
| `o.e.reactivetest.domain.*` | product-service | `o.e.product.domain.*` |

---

## Appendix B: Dependency Graph

```
                    ┌─────────────────┐
                    │  platform-bom   │
                    │  (versions)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│platform-logging│   │platform-error │   │platform-cache │
│               │   │               │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        │                   │                   │
        │     ┌─────────────┴─────────────┐     │
        │     │                           │     │
        ▼     ▼                           ▼     ▼
┌─────────────────────┐           ┌─────────────────────┐
│ platform-resilience │           │  platform-webflux   │
│ (uses logging)      │           │  (uses logging)     │
└──────────┬──────────┘           └──────────┬──────────┘
           │                                 │
           │     ┌───────────────────────────┤
           │     │                           │
           ▼     ▼                           ▼
    ┌─────────────────┐              ┌───────────────────┐
    │platform-security│              │  platform-test    │
    │   (placeholder) │              │(test utilities)   │
    └────────┬────────┘              └───────────────────┘
             │
             │
    ┌────────┴────────┬───────────────────────────┐
    │                 │                           │
    ▼                 ▼                           ▼
┌─────────────┐   ┌─────────────┐        ┌───────────────┐
│product-service│   │ cart-service │        │ (future apps) │
└─────────────┘   └─────────────┘        └───────────────┘
```