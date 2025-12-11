# 050D: Inventory Service Implementation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the inventory-service backend that stores and serves product stock levels.

**Architecture:** Spring WebFlux reactive service with R2DBC PostgreSQL, following merchandise-service patterns.

**Tech Stack:** Java 25, Spring Boot 3.x, R2DBC PostgreSQL, Flyway, platform libraries

---

## Task 1: Register Module in Gradle

**Files:**
- Modify: `settings.gradle.kts`

**Step 1: Add the new module**

```kotlin
include("apps:inventory-service")
```

**Step 2: Commit**

```bash
git add settings.gradle.kts
git commit -m "chore: register inventory-service module"
```

---

## Task 2: Create build.gradle.kts

**Files:**
- Create: `apps/inventory-service/build.gradle.kts`

**Step 1: Create the build file**

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
git add apps/inventory-service/build.gradle.kts
git commit -m "feat(inventory-service): add build configuration"
```

---

## Task 3: Create Application Class

**Files:**
- Create: `apps/inventory-service/src/main/java/org/example/inventory/InventoryServiceApplication.java`

**Step 1: Create directory and file**

```bash
mkdir -p apps/inventory-service/src/main/java/org/example/inventory
```

```java
package org.example.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    scanBasePackages = {
      "org.example.inventory",
      "org.example.platform.logging",
      "org.example.platform.error",
      "org.example.platform.security"
    })
public class InventoryServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(InventoryServiceApplication.class, args);
  }
}
```

**Step 2: Commit**

```bash
git add apps/inventory-service/src/main/java/org/example/inventory/InventoryServiceApplication.java
git commit -m "feat(inventory-service): add application entry point"
```

---

## Task 4: Create Flyway Migration

**Files:**
- Create: `apps/inventory-service/src/main/resources/db/migration/V001__create_stock_table.sql`

**Step 1: Create directory and migration**

```bash
mkdir -p apps/inventory-service/src/main/resources/db/migration
```

```sql
-- V001__create_stock_table.sql
CREATE TABLE IF NOT EXISTS stock (
    sku BIGINT PRIMARY KEY,
    available_quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_available ON stock(available_quantity);
CREATE INDEX idx_stock_updated_at ON stock(updated_at);
```

**Step 2: Commit**

```bash
git add apps/inventory-service/src/main/resources/db/migration/V001__create_stock_table.sql
git commit -m "feat(inventory-service): add Flyway migration for stock table"
```

---

## Task 5: Create Configuration Files

**Files:**
- Create: `apps/inventory-service/src/main/resources/application.yml`
- Create: `apps/inventory-service/src/main/resources/application-docker.yml`

**Step 1: Create application.yml**

```yaml
spring:
  application:
    name: inventory-service

  r2dbc:
    url: r2dbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:inventorydb}
    username: ${DB_USERNAME:inventory_user}
    password: ${DB_PASSWORD:inventory_pass}
    pool:
      initial-size: 5
      max-size: 20
      max-idle-time: 30m

  flyway:
    enabled: true
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:inventorydb}
    user: ${DB_USERNAME:inventory_user}
    password: ${DB_PASSWORD:inventory_pass}
    locations: classpath:db/migration

  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:inventorydb}
    username: ${DB_USERNAME:inventory_user}
    password: ${DB_PASSWORD:inventory_pass}
    driver-class-name: org.postgresql.Driver

server:
  port: 8093

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
    org.example.inventory: DEBUG
```

**Step 2: Create application-docker.yml**

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://postgres:5432/inventorydb
    username: inventory_user
    password: inventory_pass

  flyway:
    url: jdbc:postgresql://postgres:5432/inventorydb
    user: inventory_user
    password: inventory_pass

  datasource:
    url: jdbc:postgresql://postgres:5432/inventorydb
    username: inventory_user
    password: inventory_pass

app:
  security:
    enabled: false

logging:
  level:
    org.example.inventory: INFO
```

**Step 3: Commit**

```bash
git add apps/inventory-service/src/main/resources/
git commit -m "feat(inventory-service): add application configuration"
```

---

## Task 6: Create FlywayConfiguration

**Files:**
- Create: `apps/inventory-service/src/main/java/org/example/inventory/config/FlywayConfiguration.java`

**Step 1: Create config directory and file**

```bash
mkdir -p apps/inventory-service/src/main/java/org/example/inventory/config
```

```java
package org.example.inventory.config;

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
git add apps/inventory-service/src/main/java/org/example/inventory/config/
git commit -m "feat(inventory-service): add Flyway configuration"
```

---

## Task 7: Create Entity, Repository, DTOs

**Files:**
- Create: `apps/inventory-service/src/main/java/org/example/inventory/repository/StockEntity.java`
- Create: `apps/inventory-service/src/main/java/org/example/inventory/repository/StockR2dbcRepository.java`
- Create: `apps/inventory-service/src/main/java/org/example/inventory/dto/InventoryResponse.java`
- Create: `apps/inventory-service/src/main/java/org/example/inventory/dto/UpdateInventoryRequest.java`

**Step 1: Create directories**

```bash
mkdir -p apps/inventory-service/src/main/java/org/example/inventory/repository
mkdir -p apps/inventory-service/src/main/java/org/example/inventory/dto
```

**Step 2: Create StockEntity.java**

```java
package org.example.inventory.repository;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("stock")
public record StockEntity(
    @Id Long sku,
    @Column("available_quantity") int availableQuantity,
    @Column("updated_at") Instant updatedAt) {}
```

**Step 3: Create StockR2dbcRepository.java**

```java
package org.example.inventory.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface StockR2dbcRepository extends R2dbcRepository<StockEntity, Long> {

  Flux<StockEntity> findAllBy(Pageable pageable);

  Flux<StockEntity> findByAvailableQuantityLessThan(int threshold);
}
```

**Step 4: Create InventoryResponse.java (matches product-service contract)**

```java
package org.example.inventory.dto;

public record InventoryResponse(int availableQuantity) {}
```

**Step 5: Create UpdateInventoryRequest.java**

```java
package org.example.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateInventoryRequest(
    @NotNull(message = "Available quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    Integer availableQuantity) {}
```

**Step 6: Commit**

```bash
git add apps/inventory-service/src/main/java/org/example/inventory/repository/
git add apps/inventory-service/src/main/java/org/example/inventory/dto/
git commit -m "feat(inventory-service): add entity, repository, and DTOs"
```

---

## Task 8: Create Service Layer

**Files:**
- Create: `apps/inventory-service/src/main/java/org/example/inventory/service/InventoryService.java`

**Step 1: Create service directory and file**

```bash
mkdir -p apps/inventory-service/src/main/java/org/example/inventory/service
```

```java
package org.example.inventory.service;

import java.time.Instant;
import org.example.inventory.dto.InventoryResponse;
import org.example.inventory.dto.UpdateInventoryRequest;
import org.example.inventory.repository.StockEntity;
import org.example.inventory.repository.StockR2dbcRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class InventoryService {

  private final StockR2dbcRepository repository;

  public InventoryService(StockR2dbcRepository repository) {
    this.repository = repository;
  }

  public Mono<InventoryResponse> getInventory(Long sku) {
    return repository.findById(sku).map(this::toResponse);
  }

  public Flux<StockEntity> listInventory(int page, int size) {
    return repository.findAllBy(PageRequest.of(page, size));
  }

  public Flux<StockEntity> getLowStock(int threshold) {
    return repository.findByAvailableQuantityLessThan(threshold);
  }

  public Mono<StockEntity> updateInventory(Long sku, UpdateInventoryRequest request) {
    return repository
        .findById(sku)
        .flatMap(existing -> updateExisting(existing, request))
        .switchIfEmpty(createNew(sku, request));
  }

  private Mono<StockEntity> updateExisting(StockEntity existing, UpdateInventoryRequest request) {
    StockEntity updated =
        new StockEntity(existing.sku(), request.availableQuantity(), Instant.now());
    return repository.save(updated);
  }

  private Mono<StockEntity> createNew(Long sku, UpdateInventoryRequest request) {
    StockEntity entity = new StockEntity(sku, request.availableQuantity(), Instant.now());
    return repository.save(entity);
  }

  private InventoryResponse toResponse(StockEntity entity) {
    return new InventoryResponse(entity.availableQuantity());
  }
}
```

**Step 2: Commit**

```bash
git add apps/inventory-service/src/main/java/org/example/inventory/service/
git commit -m "feat(inventory-service): add service layer"
```

---

## Task 9: Create Controller

**Files:**
- Create: `apps/inventory-service/src/main/java/org/example/inventory/controller/InventoryController.java`

**Step 1: Create controller directory and file**

```bash
mkdir -p apps/inventory-service/src/main/java/org/example/inventory/controller
```

```java
package org.example.inventory.controller;

import jakarta.validation.Valid;
import org.example.inventory.dto.InventoryResponse;
import org.example.inventory.dto.UpdateInventoryRequest;
import org.example.inventory.repository.StockEntity;
import org.example.inventory.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

  private final InventoryService service;

  public InventoryController(InventoryService service) {
    this.service = service;
  }

  /**
   * Get inventory by SKU - used by product-service (service-to-service).
   */
  @GetMapping("/{sku}")
  public Mono<ResponseEntity<InventoryResponse>> getInventory(@PathVariable Long sku) {
    return service
        .getInventory(sku)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  /**
   * List all inventory - used by merchant portal.
   */
  @GetMapping
  public Flux<StockEntity> listInventory(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return service.listInventory(page, size);
  }

  /**
   * Get low stock items - used by merchant portal for alerts.
   */
  @GetMapping("/low-stock")
  public Flux<StockEntity> getLowStock(@RequestParam(defaultValue = "10") int threshold) {
    return service.getLowStock(threshold);
  }

  /**
   * Update inventory - used by merchant portal (requires INVENTORY_SPECIALIST role).
   */
  @PutMapping("/{sku}")
  public Mono<StockEntity> updateInventory(
      @PathVariable Long sku,
      @Valid @RequestBody UpdateInventoryRequest request) {
    return service.updateInventory(sku, request);
  }
}
```

**Step 2: Commit**

```bash
git add apps/inventory-service/src/main/java/org/example/inventory/controller/
git commit -m "feat(inventory-service): add REST controller"
```

---

## Task 10: Verify Build

**Step 1: Run Gradle build**

Run: `./gradlew :apps:inventory-service:build -x test`
Expected: BUILD SUCCESSFUL

---

## Summary

| Task | Files | Purpose |
|------|-------|---------|
| 1 | `settings.gradle.kts` | Register module |
| 2 | `build.gradle.kts` | Dependencies |
| 3 | `InventoryServiceApplication.java` | Entry point |
| 4 | `V001__create_stock_table.sql` | Database schema |
| 5 | `application.yml`, `application-docker.yml` | Configuration |
| 6 | `FlywayConfiguration.java` | R2DBC + Flyway |
| 7 | Entity, Repository, DTOs | Data layer |
| 8 | `InventoryService.java` | Business logic |
| 9 | `InventoryController.java` | REST endpoints |
| 10 | - | Build verification |
