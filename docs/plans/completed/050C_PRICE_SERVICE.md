# 050C: Price Service Implementation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the price-service backend that stores and serves product pricing (current price, original price, currency).

**Architecture:** Spring WebFlux reactive service with R2DBC PostgreSQL, following merchandise-service patterns.

**Tech Stack:** Java 25, Spring Boot 3.x, R2DBC PostgreSQL, Flyway, platform libraries

---

## Task 1: Register Module in Gradle

**Files:**
- Modify: `settings.gradle.kts`

**Step 1: Add the new module**

```kotlin
include("apps:price-service")
```

**Step 2: Commit**

```bash
git add settings.gradle.kts
git commit -m "chore: register price-service module"
```

---

## Task 2: Create build.gradle.kts

**Files:**
- Create: `apps/price-service/build.gradle.kts`

**Step 1: Create the build file (identical to merchandise-service)**

```kotlin
plugins {
    id("platform.application-conventions")
}

dependencies {
    implementation(platform(project(":libs:backend:platform:platform-bom")))
    implementation(project(":libs:backend:platform:platform-logging"))
    implementation(project(":libs:backend:platform:platform-error"))
    implementation(project(":libs:backend:platform:platform-webflux"))
    implementation(project(":libs:backend:platform:platform-security"))

    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    implementation("org.postgresql:r2dbc-postgresql")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    runtimeOnly("org.postgresql:postgresql")

    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    testImplementation(project(":libs:backend:platform:platform-test"))
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:r2dbc")
}
```

**Step 2: Commit**

```bash
git add apps/price-service/build.gradle.kts
git commit -m "feat(price-service): add build configuration"
```

---

## Task 3: Create Application Class

**Files:**
- Create: `apps/price-service/src/main/java/org/example/price/PriceServiceApplication.java`

**Step 1: Create directory and file**

```bash
mkdir -p apps/price-service/src/main/java/org/example/price
```

```java
package org.example.price;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    scanBasePackages = {
      "org.example.price",
      "org.example.platform.logging",
      "org.example.platform.error",
      "org.example.platform.security"
    })
public class PriceServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(PriceServiceApplication.class, args);
  }
}
```

**Step 2: Commit**

```bash
git add apps/price-service/src/main/java/org/example/price/PriceServiceApplication.java
git commit -m "feat(price-service): add application entry point"
```

---

## Task 4: Create Flyway Migration

**Files:**
- Create: `apps/price-service/src/main/resources/db/migration/V001__create_prices_table.sql`

**Step 1: Create directory and migration**

```bash
mkdir -p apps/price-service/src/main/resources/db/migration
```

```sql
-- V001__create_prices_table.sql
CREATE TABLE IF NOT EXISTS prices (
    sku BIGINT PRIMARY KEY,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prices_updated_at ON prices(updated_at);
```

**Step 2: Commit**

```bash
git add apps/price-service/src/main/resources/db/migration/V001__create_prices_table.sql
git commit -m "feat(price-service): add Flyway migration for prices table"
```

---

## Task 5: Create Configuration Files

**Files:**
- Create: `apps/price-service/src/main/resources/application.yml`
- Create: `apps/price-service/src/main/resources/application-docker.yml`

**Step 1: Create application.yml**

```yaml
spring:
  application:
    name: price-service

  r2dbc:
    url: r2dbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:pricedb}
    username: ${DB_USERNAME:price_user}
    password: ${DB_PASSWORD:price_pass}
    pool:
      initial-size: 5
      max-size: 20
      max-idle-time: 30m

  flyway:
    enabled: true
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:pricedb}
    user: ${DB_USERNAME:price_user}
    password: ${DB_PASSWORD:price_pass}
    locations: classpath:db/migration

  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:pricedb}
    username: ${DB_USERNAME:price_user}
    password: ${DB_PASSWORD:price_pass}
    driver-class-name: org.postgresql.Driver

server:
  port: 8092

app:
  security:
    enabled: false

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always
      probes:
        enabled: true

logging:
  level:
    org.example.price: DEBUG
```

**Step 2: Create application-docker.yml**

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://postgres:5432/pricedb
    username: price_user
    password: price_pass

  flyway:
    url: jdbc:postgresql://postgres:5432/pricedb
    user: price_user
    password: price_pass

  datasource:
    url: jdbc:postgresql://postgres:5432/pricedb
    username: price_user
    password: price_pass

app:
  security:
    enabled: false

logging:
  level:
    org.example.price: INFO
```

**Step 3: Commit**

```bash
git add apps/price-service/src/main/resources/
git commit -m "feat(price-service): add application configuration"
```

---

## Task 6: Create FlywayConfiguration

**Files:**
- Create: `apps/price-service/src/main/java/org/example/price/config/FlywayConfiguration.java`

**Step 1: Create config directory and file**

```bash
mkdir -p apps/price-service/src/main/java/org/example/price/config
```

```java
package org.example.price.config;

import javax.sql.DataSource;
import org.springframework.boot.autoconfigure.flyway.FlywayDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfiguration {

  @Bean
  @ConfigurationProperties("spring.datasource")
  public DataSourceProperties flywayDataSourceProperties() {
    return new DataSourceProperties();
  }

  @Bean
  @FlywayDataSource
  public DataSource flywayDataSource(DataSourceProperties flywayDataSourceProperties) {
    return flywayDataSourceProperties.initializeDataSourceBuilder().build();
  }
}
```

**Step 2: Commit**

```bash
git add apps/price-service/src/main/java/org/example/price/config/
git commit -m "feat(price-service): add Flyway configuration"
```

---

## Task 7: Create Entity, Repository, DTOs

**Files:**
- Create: `apps/price-service/src/main/java/org/example/price/repository/PriceEntity.java`
- Create: `apps/price-service/src/main/java/org/example/price/repository/PriceR2dbcRepository.java`
- Create: `apps/price-service/src/main/java/org/example/price/dto/PriceResponse.java`
- Create: `apps/price-service/src/main/java/org/example/price/dto/UpdatePriceRequest.java`

**Step 1: Create directories**

```bash
mkdir -p apps/price-service/src/main/java/org/example/price/repository
mkdir -p apps/price-service/src/main/java/org/example/price/dto
```

**Step 2: Create PriceEntity.java**

```java
package org.example.price.repository;

import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("prices")
public record PriceEntity(
    @Id Long sku,
    BigDecimal price,
    @Column("original_price") BigDecimal originalPrice,
    String currency,
    @Column("updated_at") Instant updatedAt) {}
```

**Step 3: Create PriceR2dbcRepository.java**

```java
package org.example.price.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface PriceR2dbcRepository extends R2dbcRepository<PriceEntity, Long> {

  Flux<PriceEntity> findAllBy(Pageable pageable);
}
```

**Step 4: Create PriceResponse.java (matches product-service contract)**

```java
package org.example.price.dto;

import java.math.BigDecimal;

public record PriceResponse(
    BigDecimal price,
    BigDecimal originalPrice,
    String currency) {}
```

**Step 5: Create UpdatePriceRequest.java**

```java
package org.example.price.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdatePriceRequest(
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price must be non-negative")
    BigDecimal price,

    BigDecimal originalPrice,

    String currency) {}
```

**Step 6: Commit**

```bash
git add apps/price-service/src/main/java/org/example/price/repository/
git add apps/price-service/src/main/java/org/example/price/dto/
git commit -m "feat(price-service): add entity, repository, and DTOs"
```

---

## Task 8: Create Service Layer

**Files:**
- Create: `apps/price-service/src/main/java/org/example/price/service/PriceService.java`

**Step 1: Create service directory and file**

```bash
mkdir -p apps/price-service/src/main/java/org/example/price/service
```

```java
package org.example.price.service;

import java.time.Instant;
import org.example.price.dto.PriceResponse;
import org.example.price.dto.UpdatePriceRequest;
import org.example.price.repository.PriceEntity;
import org.example.price.repository.PriceR2dbcRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class PriceService {

  private final PriceR2dbcRepository repository;

  public PriceService(PriceR2dbcRepository repository) {
    this.repository = repository;
  }

  public Mono<PriceResponse> getPrice(Long sku) {
    return repository.findById(sku).map(this::toResponse);
  }

  public Flux<PriceEntity> listPrices(int page, int size) {
    return repository.findAllBy(PageRequest.of(page, size));
  }

  public Mono<PriceEntity> setPrice(Long sku, UpdatePriceRequest request) {
    return repository
        .findById(sku)
        .flatMap(existing -> updateExisting(existing, request))
        .switchIfEmpty(createNew(sku, request));
  }

  private Mono<PriceEntity> updateExisting(PriceEntity existing, UpdatePriceRequest request) {
    PriceEntity updated =
        new PriceEntity(
            existing.sku(),
            request.price(),
            request.originalPrice(),
            request.currency() != null ? request.currency() : existing.currency(),
            Instant.now());
    return repository.save(updated);
  }

  private Mono<PriceEntity> createNew(Long sku, UpdatePriceRequest request) {
    PriceEntity entity =
        new PriceEntity(
            sku,
            request.price(),
            request.originalPrice(),
            request.currency() != null ? request.currency() : "USD",
            Instant.now());
    return repository.save(entity);
  }

  private PriceResponse toResponse(PriceEntity entity) {
    return new PriceResponse(entity.price(), entity.originalPrice(), entity.currency());
  }
}
```

**Step 2: Commit**

```bash
git add apps/price-service/src/main/java/org/example/price/service/
git commit -m "feat(price-service): add service layer"
```

---

## Task 9: Create Controller

**Files:**
- Create: `apps/price-service/src/main/java/org/example/price/controller/PriceController.java`

**Step 1: Create controller directory and file**

```bash
mkdir -p apps/price-service/src/main/java/org/example/price/controller
```

```java
package org.example.price.controller;

import jakarta.validation.Valid;
import org.example.price.dto.PriceResponse;
import org.example.price.dto.UpdatePriceRequest;
import org.example.price.repository.PriceEntity;
import org.example.price.service.PriceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/price")
public class PriceController {

  private final PriceService service;

  public PriceController(PriceService service) {
    this.service = service;
  }

  /**
   * Get price by SKU - used by product-service (service-to-service).
   */
  @GetMapping("/{sku}")
  public Mono<ResponseEntity<PriceResponse>> getPrice(@PathVariable Long sku) {
    return service
        .getPrice(sku)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  /**
   * List all prices - used by merchant portal.
   */
  @GetMapping
  public Flux<PriceEntity> listPrices(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return service.listPrices(page, size);
  }

  /**
   * Set/update price - used by merchant portal (requires PRICING_SPECIALIST role).
   */
  @PutMapping("/{sku}")
  public Mono<PriceEntity> setPrice(
      @PathVariable Long sku,
      @Valid @RequestBody UpdatePriceRequest request) {
    return service.setPrice(sku, request);
  }
}
```

**Step 2: Commit**

```bash
git add apps/price-service/src/main/java/org/example/price/controller/
git commit -m "feat(price-service): add REST controller"
```

---

## Task 10: Verify Build

**Step 1: Run Gradle build**

Run: `./gradlew :apps:price-service:build -x test`
Expected: BUILD SUCCESSFUL

**Step 2: Commit if needed**

---

## Summary

| Task | Files | Purpose |
|------|-------|---------|
| 1 | `settings.gradle.kts` | Register module |
| 2 | `build.gradle.kts` | Dependencies |
| 3 | `PriceServiceApplication.java` | Entry point |
| 4 | `V001__create_prices_table.sql` | Database schema |
| 5 | `application.yml`, `application-docker.yml` | Configuration |
| 6 | `FlywayConfiguration.java` | R2DBC + Flyway |
| 7 | Entity, Repository, DTOs | Data layer |
| 8 | `PriceService.java` | Business logic |
| 9 | `PriceController.java` | REST endpoints |
| 10 | - | Build verification |
