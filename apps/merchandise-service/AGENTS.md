# Merchandise Service Agent Guidelines

Product catalog management service with PostgreSQL persistence and dual-use API design.

## Service Overview

Provides CRUD operations for product catalog data with two API contracts:
- Minimal response (`MerchandiseResponse`) for service-to-service integration
- Full entity (`ProductEntity`) for merchant portal operations

## Key Files

| File | Purpose |
|------|---------|
| `MerchandiseController.java` | REST endpoints with validation, dual response types |
| `MerchandiseService.java` | Business logic layer with entity transformations |
| `ProductR2dbcRepository.java` | R2DBC repository interface with pagination |
| `ProductEntity.java` | Database entity with all product fields |
| `MerchandiseResponse.java` | Minimal DTO for product-service integration |
| `CreateProductRequest.java` | Product creation with validation constraints |
| `UpdateProductRequest.java` | Partial update support (all fields optional) |
| `FlywayConfiguration.java` | JDBC DataSource for Flyway migrations with R2DBC |
| `V001__create_products_table.sql` | Initial schema with indexes |
| `application.yml` | Database connection pool and Flyway configuration |

## Common Tasks

### Add a New Field to Products

1. Add column to migration:
   ```sql
   -- Create new migration file: V002__add_field.sql
   ALTER TABLE products ADD COLUMN new_field VARCHAR(100);
   ```

2. Update `ProductEntity.java`:
   ```java
   @Table("products")
   public record ProductEntity(
       @Id Long sku,
       String name,
       // ... existing fields
       String newField  // Add new field
   ) {}
   ```

3. Update DTOs as needed:
   - Add to `CreateProductRequest` if required on creation
   - Add to `UpdateProductRequest` if updatable
   - Add to `MerchandiseResponse` only if needed by product-service

4. Update `MerchandiseService` to handle the new field in create/update methods

### Add Filtering to List Endpoint

1. Add query method to `ProductR2dbcRepository.java`:
   ```java
   Flux<ProductEntity> findByCategory(String category, Pageable pageable);
   ```

2. Add service method in `MerchandiseService.java`:
   ```java
   public Flux<ProductEntity> listProductsByCategory(String category, int page, int size) {
       return repository.findByCategory(category, PageRequest.of(page, size));
   }
   ```

3. Add controller endpoint in `MerchandiseController.java`:
   ```java
   @GetMapping("/by-category/{category}")
   public Flux<ProductEntity> listByCategory(
       @PathVariable String category,
       @RequestParam(defaultValue = "0") int page,
       @RequestParam(defaultValue = "20") int size) {
       return service.listProductsByCategory(category, page, size);
   }
   ```

### Modify Database Schema

1. Create new migration file with incrementing version:
   - Format: `V{NNN}__{description}.sql`
   - Example: `V002__add_brand_field.sql`

2. Never modify existing migrations (Flyway checksums will fail)

3. Test locally:
   ```bash
   # Drop and recreate database
   docker exec -it postgres psql -U merchandise_user -d postgres \
     -c "DROP DATABASE merchandisedb; CREATE DATABASE merchandisedb;"

   # Restart service to run migrations
   ./gradlew :apps:merchandise-service:bootRun
   ```

### Debug R2DBC Connection Issues

1. Enable R2DBC logging:
   ```yaml
   logging:
     level:
       org.springframework.r2dbc: DEBUG
       io.r2dbc.postgresql.QUERY: DEBUG
       io.r2dbc.postgresql.PARAM: DEBUG
   ```

2. Check connection pool metrics:
   ```http
   GET /actuator/metrics/r2dbc.pool.acquired
   GET /actuator/metrics/r2dbc.pool.idle
   ```

3. Verify database connectivity:
   ```http
   GET /actuator/health
   ```
   Look for `db` section with connection status

## Patterns in This Service

### Dual API Contract

Controller returns different types based on endpoint:
```java
// Service-to-service: Minimal response
@GetMapping("/{sku}")
public Mono<ResponseEntity<MerchandiseResponse>> getProduct(@PathVariable Long sku) {
    return service.getProduct(sku)  // Returns MerchandiseResponse
        .map(ResponseEntity::ok);
}

// Merchant portal: Full entity
@GetMapping
public Flux<ProductEntity> listProducts(...) {
    return service.listProducts(page, size);  // Returns ProductEntity
}
```

### Partial Updates with Records

Service layer handles null-coalescing for optional update fields:
```java
public Mono<ProductEntity> updateProduct(Long sku, UpdateProductRequest request) {
    return repository.findById(sku)
        .flatMap(existing -> {
            ProductEntity updated = new ProductEntity(
                existing.sku(),
                request.name() != null ? request.name() : existing.name(),
                // ... null-coalesce all optional fields
                existing.createdAt(),
                Instant.now()  // Always update timestamp
            );
            return repository.save(updated);
        });
}
```

### Flyway with R2DBC

Spring Boot 4.0 does not create JDBC DataSource when R2DBC ConnectionFactory exists. Manual configuration required:
```java
@Configuration
public class FlywayConfiguration {
    @Bean
    @FlywayDataSource
    public DataSource flywayDataSource(DataSourceProperties props) {
        return props.initializeDataSourceBuilder().build();
    }
}
```

### Pagination with R2DBC

Repository uses Spring Data R2DBC pagination support:
```java
// Repository
Flux<ProductEntity> findAllBy(Pageable pageable);

// Service
public Flux<ProductEntity> listProducts(int page, int size) {
    return repository.findAllBy(PageRequest.of(page, size));
}
```

### Validation with Jakarta

Request records use Jakarta Bean Validation annotations:
```java
public record CreateProductRequest(
    @NotNull(message = "SKU is required")
    @Positive(message = "SKU must be positive")
    Long sku,

    @NotBlank(message = "Name is required")
    String name,

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
    BigDecimal suggestedRetailPrice
) {}
```

Controller enables validation with `@Valid`:
```java
@PostMapping
public Mono<ProductEntity> createProduct(@Valid @RequestBody CreateProductRequest request) {
    return service.createProduct(request);
}
```

## Anti-patterns to Avoid

- Modifying existing Flyway migrations (use new migrations)
- Using JDBC/blocking calls in service layer (use R2DBC)
- Returning full ProductEntity from service-to-service endpoints (breaks contract with product-service)
- Hardcoding database credentials (use environment variables)
- Skipping validation on mutation endpoints
- Using `block()` or `subscribe()` in controller (return Mono/Flux directly)
- Creating database indexes without analyzing query patterns first
- Omitting timestamps on entity updates

## Testing Guidance

### Testcontainers Setup

Use Testcontainers for PostgreSQL integration tests:
```java
@SpringBootTest
@Testcontainers
class MerchandiseServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void registerPgProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.r2dbc.url", () ->
            "r2dbc:postgresql://" + postgres.getHost() + ":" + postgres.getFirstMappedPort() + "/test");
        registry.add("spring.r2dbc.username", postgres::getUsername);
        registry.add("spring.r2dbc.password", postgres::getPassword);

        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
    }
}
```

### Testing Pagination

Verify page boundaries and size limits:
```java
@Test
void testPagination() {
    // Given: 25 products
    Flux.range(1, 25)
        .flatMap(i -> service.createProduct(createRequest(i)))
        .blockLast();

    // When: Request page 1, size 10
    List<ProductEntity> page1 = service.listProducts(1, 10)
        .collectList().block();

    // Then: Returns 10 products (offset 10)
    assertThat(page1).hasSize(10);
    assertThat(page1.get(0).sku()).isEqualTo(11L);
}
```

### Testing Partial Updates

Verify null fields are not overwritten:
```java
@Test
void testPartialUpdate() {
    // Given: Product with all fields
    ProductEntity original = createFullProduct();

    // When: Update only name
    UpdateProductRequest request = new UpdateProductRequest(
        "New Name", null, null, null, null, null
    );
    ProductEntity updated = service.updateProduct(original.sku(), request)
        .block();

    // Then: Only name changed
    assertThat(updated.name()).isEqualTo("New Name");
    assertThat(updated.description()).isEqualTo(original.description());
    assertThat(updated.suggestedRetailPrice()).isEqualTo(original.suggestedRetailPrice());
}
```

## Configuration Files

| File | Purpose |
|------|---------|
| `application.yml` | R2DBC connection pool, Flyway config, logging levels |
| `application-docker.yml` | Docker-specific overrides (postgres hostname, log levels) |
| `build.gradle.kts` | Dependencies (R2DBC, PostgreSQL, Flyway, Testcontainers) |
| `db/migration/V001__create_products_table.sql` | Initial schema |
