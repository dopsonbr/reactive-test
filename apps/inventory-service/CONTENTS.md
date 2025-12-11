# Inventory Service Contents

## Main Source (src/main/java/org/example/inventory/)

| File | Description |
|------|-------------|
| `InventoryServiceApplication.java` | Spring Boot application entry point with platform package scanning |
| `controller/InventoryController.java` | REST endpoints for inventory CRUD and queries |
| `service/InventoryService.java` | Business logic for inventory operations and upsert pattern |
| `repository/StockEntity.java` | R2DBC entity record for stock table with @Id and @Column mappings |
| `repository/StockR2dbcRepository.java` | Spring Data R2DBC repository with custom query methods |
| `dto/InventoryResponse.java` | Response DTO for service-to-service calls (availableQuantity only) |
| `dto/UpdateInventoryRequest.java` | Validated request DTO for PUT operations with @NotNull and @Min |
| `config/FlywayConfiguration.java` | Blocking JDBC DataSource configuration for Flyway migrations |

## Resources (src/main/resources/)

| File | Description |
|------|-------------|
| `application.yml` | R2DBC pool, Flyway, security, actuator, and logging configuration |
| `application-docker.yml` | Docker profile overrides for postgres hostname and credentials |
| `db/migration/V001__create_stock_table.sql` | Initial schema with stock table and performance indexes |

## Build Configuration

| File | Description |
|------|-------------|
| `build.gradle.kts` | Dependencies for R2DBC, Flyway, platform libraries, and Testcontainers |

## Test Source (src/test/java/org/example/inventory/)

**Note:** Test files not yet implemented. Planned tests:
- `InventoryServiceApplicationTest.java` - Context load with Testcontainers PostgreSQL
- `InventoryServiceIntegrationTest.java` - Full integration with WebTestClient
- `StockR2dbcRepositoryTest.java` - Repository layer with @DataR2dbcTest
- `ArchitectureTest.java` - ArchUnit layered architecture enforcement

## Package Structure

```
org.example.inventory/
├── InventoryServiceApplication.java         (Entry point)
├── controller/
│   └── InventoryController.java            (REST layer)
├── service/
│   └── InventoryService.java               (Business logic)
├── repository/
│   ├── StockEntity.java                    (Database entity)
│   └── StockR2dbcRepository.java           (Data access)
├── dto/
│   ├── InventoryResponse.java              (Service response)
│   └── UpdateInventoryRequest.java         (Update request)
└── config/
    └── FlywayConfiguration.java            (Migration config)
```

## Key Dependencies

| Dependency | Purpose |
|------------|---------|
| platform-bom | Centralized dependency versions |
| platform-logging | Structured JSON logging with StructuredLogger |
| platform-error | GlobalErrorHandler for validation errors |
| platform-webflux | RequestMetadata and ContextKeys for context propagation |
| platform-security | OAuth2/JWT validation framework |
| spring-boot-starter-webflux | Reactive web framework with Netty |
| spring-boot-starter-data-r2dbc | Reactive database access with Spring Data |
| spring-boot-starter-flyway | Database schema migrations |
| r2dbc-postgresql | Reactive PostgreSQL driver |
| postgresql | Blocking JDBC driver for Flyway |
| spring-boot-starter-validation | Bean Validation with Hibernate Validator |
| micrometer-registry-prometheus | Prometheus metrics export |
| platform-test | Test utilities (planned) |
| testcontainers:postgresql | PostgreSQL integration tests (planned) |
| testcontainers:r2dbc | R2DBC Testcontainers support (planned) |

## Database Schema

### Tables

**stock**
- `sku` (BIGINT, PRIMARY KEY) - Product SKU identifier
- `available_quantity` (INT, NOT NULL, DEFAULT 0) - Current stock level
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Last update timestamp

### Indexes

- `idx_stock_available` - Supports low-stock queries by available_quantity
- `idx_stock_updated_at` - Supports recently-updated queries by timestamp

## Endpoints Summary

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/inventory/{sku}` | Get stock by SKU (service-to-service) |
| GET | `/inventory?page=N&size=M` | List all inventory (merchant portal) |
| GET | `/inventory/low-stock?threshold=N` | Get low stock alerts (merchant portal) |
| PUT | `/inventory/{sku}` | Update stock quantity (merchant portal, requires role) |
| GET | `/actuator/health` | Health check with database status |
| GET | `/actuator/metrics` | Micrometer metrics |
| GET | `/actuator/prometheus` | Prometheus scrape endpoint |

## Configuration Properties

### R2DBC Connection Pool

| Property | Default | Description |
|----------|---------|-------------|
| `spring.r2dbc.pool.initial-size` | 5 | Initial pool size |
| `spring.r2dbc.pool.max-size` | 20 | Maximum connections |
| `spring.r2dbc.pool.max-idle-time` | 30m | Idle connection timeout |

### Flyway

| Property | Default | Description |
|----------|---------|-------------|
| `spring.flyway.enabled` | true | Enable Flyway migrations |
| `spring.flyway.locations` | classpath:db/migration | Migration scripts location |

### Security

| Property | Default | Description |
|----------|---------|-------------|
| `app.security.enabled` | false | Enable OAuth2/JWT validation |

### Observability

| Property | Default | Description |
|----------|---------|-------------|
| `management.endpoints.web.exposure.include` | health,info,metrics,prometheus | Exposed actuator endpoints |
| `management.endpoint.health.show-details` | always | Show health details |
| `management.endpoint.health.probes.enabled` | true | Enable Kubernetes probes |

## Integration Points

### Upstream Services (Callers)

- **product-service**: Calls `GET /inventory/{sku}` for product aggregation
- **merchant-portal**: Calls all endpoints for inventory management UI

### Downstream Services

None - inventory-service is a leaf service with direct database access

## Reactive Flow

```
Request → InventoryController
              ↓
          InventoryService
              ↓
       StockR2dbcRepository
              ↓
         R2DBC Driver
              ↓
        PostgreSQL
```

All operations return `Mono<T>` (single result) or `Flux<T>` (stream of results) for non-blocking reactive execution.
