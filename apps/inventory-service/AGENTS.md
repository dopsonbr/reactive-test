# Inventory Service Agent Guidelines

Stock management service with reactive PostgreSQL persistence for merchant portal inventory operations.

## Service Overview

Inventory service provides real-time stock availability data with two primary use cases:
1. **Service-to-service**: Product service queries inventory by SKU for aggregation
2. **Merchant portal**: UI queries for listing, low-stock alerts, and updates

Unlike product-service (read-heavy with caching), inventory-service is write-heavy and query-focused with direct database access.

## Key Files

| File | Purpose |
|------|---------|
| `InventoryController.java` | REST endpoints for CRUD operations |
| `InventoryService.java` | Business logic for inventory operations |
| `StockR2dbcRepository.java` | Spring Data R2DBC repository with custom queries |
| `StockEntity.java` | Database entity record for stock table |
| `UpdateInventoryRequest.java` | Validated DTO for PUT operations |
| `FlywayConfiguration.java` | Blocking JDBC DataSource for Flyway migrations |
| `application.yml` | R2DBC pool, Flyway, and security configuration |
| `V001__create_stock_table.sql` | Initial schema with indexes |

## Common Tasks

### Add a New Query Endpoint

1. **Add repository method** in `StockR2dbcRepository.java`:
   ```java
   public interface StockR2dbcRepository extends R2dbcRepository<StockEntity, Long> {
       // Spring Data generates query from method name
       Flux<StockEntity> findByUpdatedAtAfter(Instant timestamp);

       // Or use @Query for custom SQL
       @Query("SELECT * FROM stock WHERE available_quantity BETWEEN :min AND :max")
       Flux<StockEntity> findByQuantityRange(int min, int max);
   }
   ```

2. **Add service method** in `InventoryService.java`:
   ```java
   public Flux<StockEntity> getRecentlyUpdated(Instant since) {
       return repository.findByUpdatedAtAfter(since);
   }
   ```

3. **Add controller endpoint** in `InventoryController.java`:
   ```java
   @GetMapping("/recent")
   public Flux<StockEntity> getRecentlyUpdated(
       @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since) {
       return service.getRecentlyUpdated(since);
   }
   ```

### Add a New Database Migration

1. Create versioned migration in `src/main/resources/db/migration/`:
   ```sql
   -- V002__add_warehouse_location.sql
   ALTER TABLE stock ADD COLUMN warehouse_location VARCHAR(50);
   CREATE INDEX idx_stock_warehouse ON stock(warehouse_location);
   ```

2. Update `StockEntity.java`:
   ```java
   @Table("stock")
   public record StockEntity(
       @Id Long sku,
       @Column("available_quantity") int availableQuantity,
       @Column("updated_at") Instant updatedAt,
       @Column("warehouse_location") String warehouseLocation) {}
   ```

3. Migrations run automatically on application startup via Flyway

### Enable Security for Updates

1. Update `application.yml`:
   ```yaml
   app:
     security:
       enabled: true
   ```

2. Add security constraint in `InventoryController.java`:
   ```java
   @PutMapping("/{sku}")
   @PreAuthorize("hasAuthority('SCOPE_INVENTORY_SPECIALIST')")
   public Mono<StockEntity> updateInventory(
       @PathVariable Long sku,
       @Valid @RequestBody UpdateInventoryRequest request) {
       return service.updateInventory(sku, request);
   }
   ```

3. Platform-security auto-configures JWT validation when enabled

### Add Integration Test

1. Create test class with Testcontainers:
   ```java
   @SpringBootTest
   @Testcontainers
   class InventoryServiceIntegrationTest {

       @Container
       static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
           .withDatabaseName("testdb")
           .withUsername("test")
           .withPassword("test");

       @DynamicPropertySource
       static void configureProperties(DynamicPropertyRegistry registry) {
           registry.add("spring.r2dbc.url", () ->
               "r2dbc:postgresql://" + postgres.getHost() + ":" + postgres.getFirstMappedPort() + "/testdb");
           registry.add("spring.r2dbc.username", postgres::getUsername);
           registry.add("spring.r2dbc.password", postgres::getPassword);
           registry.add("spring.flyway.url", postgres::getJdbcUrl);
           registry.add("spring.flyway.user", postgres::getUsername);
           registry.add("spring.flyway.password", postgres::getPassword);
       }

       @Autowired
       private WebTestClient webTestClient;

       @Test
       void shouldGetInventoryBySku() {
           webTestClient.get()
               .uri("/inventory/12345")
               .exchange()
               .expectStatus().isOk()
               .expectBody()
               .jsonPath("$.availableQuantity").isNumber();
       }
   }
   ```

### Debug Database Connection Issues

1. Check R2DBC connection:
   ```bash
   curl http://localhost:8093/actuator/health
   ```
   Look for `db` component status

2. Enable connection pool logging:
   ```yaml
   logging:
     level:
       io.r2dbc.pool: DEBUG
       io.r2dbc.postgresql: DEBUG
   ```

3. Verify Flyway migrations ran:
   ```bash
   psql -U inventory_user -d inventorydb -c "SELECT * FROM flyway_schema_history;"
   ```

4. Check connection pool metrics:
   ```bash
   curl http://localhost:8093/actuator/prometheus | grep r2dbc_pool
   ```

## Patterns Used

### R2DBC Repository Pattern

```java
// Spring Data method query
Flux<StockEntity> findByAvailableQuantityLessThan(int threshold);

// Pagination support
Flux<StockEntity> findAllBy(Pageable pageable);

// Save with Mono return
Mono<StockEntity> save(StockEntity entity);
```

### Upsert Pattern

```java
public Mono<StockEntity> updateInventory(Long sku, UpdateInventoryRequest request) {
    return repository.findById(sku)
        .flatMap(existing -> updateExisting(existing, request))
        .switchIfEmpty(createNew(sku, request));  // Insert if not found
}
```

### Entity Record Pattern

```java
@Table("stock")
public record StockEntity(
    @Id Long sku,  // @Id marks primary key
    @Column("available_quantity") int availableQuantity,  // Maps to snake_case
    @Column("updated_at") Instant updatedAt) {}
```

### Validation Pattern

```java
public record UpdateInventoryRequest(
    @NotNull(message = "Available quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    Integer availableQuantity) {}
```

Controller uses `@Valid` to trigger validation:
```java
public Mono<StockEntity> updateInventory(
    @PathVariable Long sku,
    @Valid @RequestBody UpdateInventoryRequest request) {
    // Validation happens before method executes
}
```

## Anti-patterns to Avoid

- **Blocking JDBC in reactive code** - Use R2DBC only; JDBC is for Flyway migrations
- **Missing updated_at timestamp** - Always update timestamp on changes
- **Negative quantities without validation** - Use `@Min(0)` constraint
- **Skipping Flyway migrations** - Never modify schema directly, always use versioned migrations
- **Hardcoded database credentials** - Use environment variables in production
- **Missing indexes** - Index columns used in WHERE clauses (quantity, updatedAt)
- **Ignoring connection pool limits** - Configure pool size based on expected concurrency

## Test Files (To Be Implemented)

| File | Purpose |
|------|---------|
| `InventoryServiceApplicationTest.java` | Context load test with Testcontainers |
| `InventoryServiceIntegrationTest.java` | Full integration with PostgreSQL + WebTestClient |
| `StockR2dbcRepositoryTest.java` | Repository layer tests with @DataR2dbcTest |
| `ArchitectureTest.java` | ArchUnit layered architecture enforcement |

## Configuration Files

| File | Purpose |
|------|---------|
| `application.yml` | R2DBC pool, Flyway, security, actuator configuration |
| `application-docker.yml` | Docker-specific overrides (postgres hostname) |
| `build.gradle.kts` | Dependencies (R2DBC, Flyway, platform libraries) |
| `V001__create_stock_table.sql` | Initial schema with indexes |

## Monitoring & Operations

### Key Metrics to Watch

| Metric | Threshold | Action |
|--------|-----------|--------|
| `r2dbc_pool_acquired_connections` | Near max-size (20) | Increase pool size |
| `r2dbc_pool_pending_connections` | > 0 | Pool exhaustion - scale up |
| `http_server_requests_seconds{uri="/inventory"}` | > 200ms | Check query performance |

### Database Maintenance

```bash
# Reindex for performance
psql -U inventory_user -d inventorydb -c "REINDEX TABLE stock;"

# Vacuum for cleanup
psql -U inventory_user -d inventorydb -c "VACUUM ANALYZE stock;"

# Check table size
psql -U inventory_user -d inventorydb -c "SELECT pg_size_pretty(pg_total_relation_size('stock'));"
```

## Security Checklist (For Production)

- [ ] Enable OAuth2 security: `app.security.enabled=true`
- [ ] Add `@PreAuthorize` to PUT endpoint for INVENTORY_SPECIALIST role
- [ ] Use secrets management for DB credentials (AWS Secrets Manager, Vault)
- [ ] Enable SSL for PostgreSQL connections
- [ ] Restrict actuator endpoints with Spring Security
- [ ] Add rate limiting for public endpoints
- [ ] Enable CORS only for trusted merchant portal domains
