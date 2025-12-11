# 050B: Merchandise Service Implementation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the merchandise-service backend that stores and serves product metadata (name, description, imageUrl, category, suggested retail price).

**Architecture:** Spring WebFlux reactive service with R2DBC PostgreSQL, Flyway migrations, following existing service patterns.

**Tech Stack:** Java 25, Spring Boot 3.x, R2DBC PostgreSQL, Flyway, platform libraries

---

## Task 1: Register Module in Gradle

**Files:**
- Modify: `settings.gradle.kts`

**Step 1: Add the new module**

Find the apps section and add:

```kotlin
include("apps:merchandise-service")
```

**Step 2: Verify registration**

Run: `grep "merchandise-service" settings.gradle.kts`
Expected: `include("apps:merchandise-service")`

**Step 3: Commit**

```bash
git add settings.gradle.kts
git commit -m "chore: register merchandise-service module"
```

---

## Task 2: Create build.gradle.kts

**Files:**
- Create: `apps/merchandise-service/build.gradle.kts`

**Step 1: Create the build file**

```kotlin
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
    implementation(project(":libs:backend:platform:platform-security"))

    // Spring Boot starters
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // PostgreSQL (R2DBC for runtime, JDBC for Flyway)
    implementation("org.postgresql:r2dbc-postgresql")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    runtimeOnly("org.postgresql:postgresql")

    // Flyway
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // Prometheus metrics
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    // Test dependencies
    testImplementation(project(":libs:backend:platform:platform-test"))
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:r2dbc")
}
```

**Step 2: Verify file created**

Run: `head -20 apps/merchandise-service/build.gradle.kts`
Expected: Shows plugins and dependencies

**Step 3: Commit**

```bash
git add apps/merchandise-service/build.gradle.kts
git commit -m "feat(merchandise-service): add build configuration"
```

---

## Task 3: Create Application Class

**Files:**
- Create: `apps/merchandise-service/src/main/java/org/example/merchandise/MerchandiseServiceApplication.java`

**Step 1: Create directory structure**

Run: `mkdir -p apps/merchandise-service/src/main/java/org/example/merchandise`

**Step 2: Create the application class**

```java
package org.example.merchandise;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    scanBasePackages = {
      "org.example.merchandise",
      "org.example.platform.logging",
      "org.example.platform.error",
      "org.example.platform.security"
    })
public class MerchandiseServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(MerchandiseServiceApplication.class, args);
  }
}
```

**Step 3: Verify file created**

Run: `cat apps/merchandise-service/src/main/java/org/example/merchandise/MerchandiseServiceApplication.java`
Expected: Shows the application class

**Step 4: Commit**

```bash
git add apps/merchandise-service/src/main/java/org/example/merchandise/MerchandiseServiceApplication.java
git commit -m "feat(merchandise-service): add application entry point"
```

---

## Task 4: Create Flyway Migration

**Files:**
- Create: `apps/merchandise-service/src/main/resources/db/migration/V001__create_products_table.sql`

**Step 1: Create directory structure**

Run: `mkdir -p apps/merchandise-service/src/main/resources/db/migration`

**Step 2: Create the migration**

```sql
-- V001__create_products_table.sql
CREATE TABLE IF NOT EXISTS products (
    sku BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(512),
    category VARCHAR(100),
    suggested_retail_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

**Step 3: Verify migration**

Run: `cat apps/merchandise-service/src/main/resources/db/migration/V001__create_products_table.sql`
Expected: Shows CREATE TABLE statement

**Step 4: Commit**

```bash
git add apps/merchandise-service/src/main/resources/db/migration/V001__create_products_table.sql
git commit -m "feat(merchandise-service): add Flyway migration for products table"
```

---

## Task 5: Create Application Configuration

**Files:**
- Create: `apps/merchandise-service/src/main/resources/application.yml`

**Step 1: Create the configuration**

```yaml
spring:
  application:
    name: merchandise-service

  r2dbc:
    url: r2dbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:merchandisedb}
    username: ${DB_USERNAME:merchandise_user}
    password: ${DB_PASSWORD:merchandise_pass}
    pool:
      initial-size: 5
      max-size: 20
      max-idle-time: 30m

  flyway:
    enabled: true
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:merchandisedb}
    user: ${DB_USERNAME:merchandise_user}
    password: ${DB_PASSWORD:merchandise_pass}
    locations: classpath:db/migration

  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:merchandisedb}
    username: ${DB_USERNAME:merchandise_user}
    password: ${DB_PASSWORD:merchandise_pass}
    driver-class-name: org.postgresql.Driver

server:
  port: 8091

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
    org.example.merchandise: DEBUG
    org.springframework.r2dbc: DEBUG
```

**Step 2: Verify configuration**

Run: `grep "port:" apps/merchandise-service/src/main/resources/application.yml`
Expected: `port: 8091`

**Step 3: Commit**

```bash
git add apps/merchandise-service/src/main/resources/application.yml
git commit -m "feat(merchandise-service): add application configuration"
```

---

## Task 6: Create Docker Profile Configuration

**Files:**
- Create: `apps/merchandise-service/src/main/resources/application-docker.yml`

**Step 1: Create the Docker profile config**

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://postgres:5432/merchandisedb
    username: merchandise_user
    password: merchandise_pass

  flyway:
    url: jdbc:postgresql://postgres:5432/merchandisedb
    user: merchandise_user
    password: merchandise_pass

  datasource:
    url: jdbc:postgresql://postgres:5432/merchandisedb
    username: merchandise_user
    password: merchandise_pass

app:
  security:
    enabled: false

logging:
  level:
    org.example.merchandise: INFO
    org.springframework.r2dbc: WARN
```

**Step 2: Verify file**

Run: `cat apps/merchandise-service/src/main/resources/application-docker.yml`
Expected: Shows docker-specific configuration

**Step 3: Commit**

```bash
git add apps/merchandise-service/src/main/resources/application-docker.yml
git commit -m "feat(merchandise-service): add Docker profile configuration"
```

---

## Task 7: Create Flyway Configuration Class

**Files:**
- Create: `apps/merchandise-service/src/main/java/org/example/merchandise/config/FlywayConfiguration.java`

**Step 1: Create config directory**

Run: `mkdir -p apps/merchandise-service/src/main/java/org/example/merchandise/config`

**Step 2: Create the configuration class**

```java
package org.example.merchandise.config;

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
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

**Step 3: Verify file**

Run: `cat apps/merchandise-service/src/main/java/org/example/merchandise/config/FlywayConfiguration.java`
Expected: Shows the configuration class

**Step 4: Commit**

```bash
git add apps/merchandise-service/src/main/java/org/example/merchandise/config/FlywayConfiguration.java
git commit -m "feat(merchandise-service): add Flyway configuration for R2DBC"
```

---

## Task 8: Create Product Entity

**Files:**
- Create: `apps/merchandise-service/src/main/java/org/example/merchandise/repository/ProductEntity.java`

**Step 1: Create repository directory**

Run: `mkdir -p apps/merchandise-service/src/main/java/org/example/merchandise/repository`

**Step 2: Create the entity**

```java
package org.example.merchandise.repository;

import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("products")
public record ProductEntity(
    @Id Long sku,
    String name,
    String description,
    @Column("image_url") String imageUrl,
    String category,
    @Column("suggested_retail_price") BigDecimal suggestedRetailPrice,
    String currency,
    @Column("created_at") Instant createdAt,
    @Column("updated_at") Instant updatedAt) {}
```

**Step 3: Verify file**

Run: `cat apps/merchandise-service/src/main/java/org/example/merchandise/repository/ProductEntity.java`
Expected: Shows the entity record

**Step 4: Commit**

```bash
git add apps/merchandise-service/src/main/java/org/example/merchandise/repository/ProductEntity.java
git commit -m "feat(merchandise-service): add ProductEntity for R2DBC"
```

---

## Task 9: Create R2DBC Repository Interface

**Files:**
- Create: `apps/merchandise-service/src/main/java/org/example/merchandise/repository/ProductR2dbcRepository.java`

**Step 1: Create the repository interface**

```java
package org.example.merchandise.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface ProductR2dbcRepository extends R2dbcRepository<ProductEntity, Long> {

  Flux<ProductEntity> findAllBy(Pageable pageable);

  Flux<ProductEntity> findByCategory(String category, Pageable pageable);
}
```

**Step 2: Verify file**

Run: `cat apps/merchandise-service/src/main/java/org/example/merchandise/repository/ProductR2dbcRepository.java`
Expected: Shows the repository interface

**Step 3: Commit**

```bash
git add apps/merchandise-service/src/main/java/org/example/merchandise/repository/ProductR2dbcRepository.java
git commit -m "feat(merchandise-service): add R2DBC repository interface"
```

---

## Task 10: Create DTOs

**Files:**
- Create: `apps/merchandise-service/src/main/java/org/example/merchandise/dto/MerchandiseResponse.java`
- Create: `apps/merchandise-service/src/main/java/org/example/merchandise/dto/CreateProductRequest.java`
- Create: `apps/merchandise-service/src/main/java/org/example/merchandise/dto/UpdateProductRequest.java`

**Step 1: Create dto directory**

Run: `mkdir -p apps/merchandise-service/src/main/java/org/example/merchandise/dto`

**Step 2: Create MerchandiseResponse (matches product-service contract)**

```java
package org.example.merchandise.dto;

public record MerchandiseResponse(
    String name,
    String description,
    String imageUrl,
    String category) {}
```

**Step 3: Create CreateProductRequest**

```java
package org.example.merchandise.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreateProductRequest(
    @NotNull(message = "SKU is required")
    @Positive(message = "SKU must be positive")
    Long sku,

    @NotBlank(message = "Name is required")
    String name,

    String description,

    String imageUrl,

    String category,

    @NotNull(message = "Suggested retail price is required")
    @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
    BigDecimal suggestedRetailPrice,

    String currency) {}
```

**Step 4: Create UpdateProductRequest**

```java
package org.example.merchandise.dto;

import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;

public record UpdateProductRequest(
    String name,
    String description,
    String imageUrl,
    String category,
    @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
    BigDecimal suggestedRetailPrice,
    String currency) {}
```

**Step 5: Verify files**

Run: `ls -la apps/merchandise-service/src/main/java/org/example/merchandise/dto/`
Expected: Three .java files

**Step 6: Commit**

```bash
git add apps/merchandise-service/src/main/java/org/example/merchandise/dto/
git commit -m "feat(merchandise-service): add request/response DTOs"
```

---

## Task 11: Create Service Layer

**Files:**
- Create: `apps/merchandise-service/src/main/java/org/example/merchandise/service/MerchandiseService.java`

**Step 1: Create service directory**

Run: `mkdir -p apps/merchandise-service/src/main/java/org/example/merchandise/service`

**Step 2: Create the service**

```java
package org.example.merchandise.service;

import java.time.Instant;
import org.example.merchandise.dto.CreateProductRequest;
import org.example.merchandise.dto.MerchandiseResponse;
import org.example.merchandise.dto.UpdateProductRequest;
import org.example.merchandise.repository.ProductEntity;
import org.example.merchandise.repository.ProductR2dbcRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class MerchandiseService {

  private final ProductR2dbcRepository repository;

  public MerchandiseService(ProductR2dbcRepository repository) {
    this.repository = repository;
  }

  public Mono<MerchandiseResponse> getProduct(Long sku) {
    return repository.findById(sku).map(this::toResponse);
  }

  public Flux<ProductEntity> listProducts(int page, int size) {
    return repository.findAllBy(PageRequest.of(page, size));
  }

  public Mono<ProductEntity> createProduct(CreateProductRequest request) {
    Instant now = Instant.now();
    ProductEntity entity =
        new ProductEntity(
            request.sku(),
            request.name(),
            request.description(),
            request.imageUrl(),
            request.category(),
            request.suggestedRetailPrice(),
            request.currency() != null ? request.currency() : "USD",
            now,
            now);
    return repository.save(entity);
  }

  public Mono<ProductEntity> updateProduct(Long sku, UpdateProductRequest request) {
    return repository
        .findById(sku)
        .flatMap(
            existing -> {
              ProductEntity updated =
                  new ProductEntity(
                      existing.sku(),
                      request.name() != null ? request.name() : existing.name(),
                      request.description() != null ? request.description() : existing.description(),
                      request.imageUrl() != null ? request.imageUrl() : existing.imageUrl(),
                      request.category() != null ? request.category() : existing.category(),
                      request.suggestedRetailPrice() != null
                          ? request.suggestedRetailPrice()
                          : existing.suggestedRetailPrice(),
                      request.currency() != null ? request.currency() : existing.currency(),
                      existing.createdAt(),
                      Instant.now());
              return repository.save(updated);
            });
  }

  public Mono<Void> deleteProduct(Long sku) {
    return repository.deleteById(sku);
  }

  private MerchandiseResponse toResponse(ProductEntity entity) {
    return new MerchandiseResponse(
        entity.name(), entity.description(), entity.imageUrl(), entity.category());
  }
}
```

**Step 3: Verify file**

Run: `wc -l apps/merchandise-service/src/main/java/org/example/merchandise/service/MerchandiseService.java`
Expected: ~80 lines

**Step 4: Commit**

```bash
git add apps/merchandise-service/src/main/java/org/example/merchandise/service/MerchandiseService.java
git commit -m "feat(merchandise-service): add service layer"
```

---

## Task 12: Create Controller

**Files:**
- Create: `apps/merchandise-service/src/main/java/org/example/merchandise/controller/MerchandiseController.java`

**Step 1: Create controller directory**

Run: `mkdir -p apps/merchandise-service/src/main/java/org/example/merchandise/controller`

**Step 2: Create the controller**

```java
package org.example.merchandise.controller;

import jakarta.validation.Valid;
import org.example.merchandise.dto.CreateProductRequest;
import org.example.merchandise.dto.MerchandiseResponse;
import org.example.merchandise.dto.UpdateProductRequest;
import org.example.merchandise.repository.ProductEntity;
import org.example.merchandise.service.MerchandiseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/merchandise")
public class MerchandiseController {

  private final MerchandiseService service;

  public MerchandiseController(MerchandiseService service) {
    this.service = service;
  }

  /**
   * Get product by SKU - used by product-service (service-to-service).
   * Returns the contract expected by product-service's MerchandiseRepository.
   */
  @GetMapping("/{sku}")
  public Mono<ResponseEntity<MerchandiseResponse>> getProduct(@PathVariable Long sku) {
    return service
        .getProduct(sku)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  /**
   * List all products - used by merchant portal.
   */
  @GetMapping
  public Flux<ProductEntity> listProducts(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return service.listProducts(page, size);
  }

  /**
   * Create product - used by merchant portal (requires MERCHANT role).
   */
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Mono<ProductEntity> createProduct(@Valid @RequestBody CreateProductRequest request) {
    return service.createProduct(request);
  }

  /**
   * Update product - used by merchant portal (requires MERCHANT role).
   */
  @PutMapping("/{sku}")
  public Mono<ResponseEntity<ProductEntity>> updateProduct(
      @PathVariable Long sku,
      @Valid @RequestBody UpdateProductRequest request) {
    return service
        .updateProduct(sku, request)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  /**
   * Delete product - used by merchant portal (requires MERCHANT role).
   */
  @DeleteMapping("/{sku}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public Mono<Void> deleteProduct(@PathVariable Long sku) {
    return service.deleteProduct(sku);
  }
}
```

**Step 3: Verify file**

Run: `grep -c "@.*Mapping" apps/merchandise-service/src/main/java/org/example/merchandise/controller/MerchandiseController.java`
Expected: 5 (one for each endpoint)

**Step 4: Commit**

```bash
git add apps/merchandise-service/src/main/java/org/example/merchandise/controller/MerchandiseController.java
git commit -m "feat(merchandise-service): add REST controller"
```

---

## Task 13: Verify Build

**Step 1: Run Gradle build**

Run: `./gradlew :apps:merchandise-service:build -x test`
Expected: BUILD SUCCESSFUL

**Step 2: If build fails, check for errors**

Run: `./gradlew :apps:merchandise-service:compileJava --stacktrace`
Expected: Compilation succeeds

**Step 3: Commit any fixes if needed**

---

## Summary

| Task | Files | Purpose |
|------|-------|---------|
| 1 | `settings.gradle.kts` | Register module |
| 2 | `build.gradle.kts` | Dependencies |
| 3 | `MerchandiseServiceApplication.java` | Entry point |
| 4 | `V001__create_products_table.sql` | Database schema |
| 5 | `application.yml` | Configuration |
| 6 | `application-docker.yml` | Docker profile |
| 7 | `FlywayConfiguration.java` | R2DBC + Flyway |
| 8 | `ProductEntity.java` | Database entity |
| 9 | `ProductR2dbcRepository.java` | Data access |
| 10 | DTOs | Request/Response |
| 11 | `MerchandiseService.java` | Business logic |
| 12 | `MerchandiseController.java` | REST endpoints |
| 13 | - | Build verification |
