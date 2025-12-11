# Price Service Agent Guidelines

Simple CRUD service demonstrating R2DBC reactive database access with Flyway migrations.

## Service Overview

Price-service provides reactive PostgreSQL access for product pricing data. It serves two clients:
- **Product-service**: Service-to-service price lookups
- **Merchant portal**: Price management UI with pagination

## Key Files

| File | Purpose |
|------|---------|
| `PriceController.java` | REST endpoints for get, list, and update operations |
| `PriceService.java` | Business logic for price CRUD operations |
| `PriceR2dbcRepository.java` | Spring Data R2DBC repository with pagination |
| `PriceEntity.java` | Database entity mapped to `prices` table |
| `UpdatePriceRequest.java` | Request DTO with validation constraints |
| `PriceResponse.java` | Response DTO for service-to-service API |
| `FlywayConfiguration.java` | Manual JDBC DataSource setup for Flyway with R2DBC |
| `application.yml` | R2DBC, Flyway, and datasource configuration |
| `V001__create_prices_table.sql` | Initial schema migration |

## Common Tasks

### Add a New Field to Price

1. Create new Flyway migration:
   ```sql
   -- V002__add_discount_field.sql
   ALTER TABLE prices ADD COLUMN discount_percent DECIMAL(5,2);
   ```

2. Update `PriceEntity` record:
   ```java
   public record PriceEntity(
       @Id Long sku,
       BigDecimal price,
       BigDecimal originalPrice,
       String currency,
       BigDecimal discountPercent,  // New field
       Instant updatedAt
   ) {}
   ```

3. Update `UpdatePriceRequest` with validation:
   ```java
   public record UpdatePriceRequest(
       @NotNull BigDecimal price,
       BigDecimal originalPrice,
       String currency,
       @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal discountPercent
   ) {}
   ```

4. Update `PriceService.updateExisting()` and `createNew()` to handle new field

### Add a New Query Endpoint

1. Add query method in `PriceR2dbcRepository`:
   ```java
   @Query("SELECT * FROM prices WHERE currency = :currency")
   Flux<PriceEntity> findByCurrency(String currency);
   ```

2. Add service method in `PriceService`:
   ```java
   public Flux<PriceEntity> findByCurrency(String currency) {
       return repository.findByCurrency(currency);
   }
   ```

3. Add controller endpoint in `PriceController`:
   ```java
   @GetMapping("/currency/{currency}")
   public Flux<PriceEntity> getPricesByCurrency(@PathVariable String currency) {
       return service.findByCurrency(currency);
   }
   ```

### Debug Database Connection Issues

1. Enable R2DBC debug logging in `application.yml`:
   ```yaml
   logging:
     level:
       org.springframework.r2dbc: DEBUG
       io.r2dbc.postgresql.QUERY: DEBUG
       io.r2dbc.postgresql.PARAM: DEBUG
   ```

2. Check health endpoint:
   ```bash
   curl http://localhost:8092/actuator/health
   ```

3. Verify connection pool metrics:
   ```bash
   curl http://localhost:8092/actuator/metrics/r2dbc.pool.acquired
   curl http://localhost:8092/actuator/metrics/r2dbc.pool.idle
   ```

4. Test database connectivity manually:
   ```bash
   psql -h localhost -U price_user -d pricedb
   ```

### Add Index for Performance

1. Create Flyway migration:
   ```sql
   -- V003__add_currency_index.sql
   CREATE INDEX idx_prices_currency ON prices(currency);
   ```

2. Restart application to apply migration automatically

### Modify Pagination Defaults

Update `PriceController.listPrices()` query parameters:
```java
@GetMapping
public Flux<PriceEntity> listPrices(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "50") int size  // Changed from 20
) {
    return service.listPrices(page, size);
}
```

## Patterns in This Service

### R2DBC Reactive Database Access

```java
// Repository returns Flux/Mono
Flux<PriceEntity> findAllBy(Pageable pageable);
Mono<PriceEntity> findById(Long sku);
Mono<PriceEntity> save(PriceEntity entity);

// Service orchestrates reactive pipeline
public Mono<PriceEntity> setPrice(Long sku, UpdatePriceRequest request) {
    return repository.findById(sku)
        .flatMap(existing -> updateExisting(existing, request))
        .switchIfEmpty(createNew(sku, request));
}
```

### Flyway with R2DBC

Spring Boot 4.0 does not auto-create JDBC DataSource when R2DBC is present, so manual configuration is required:

```java
@Configuration
public class FlywayConfiguration {
    @Bean
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties flywayDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @FlywayDataSource
    public DataSource flywayDataSource(DataSourceProperties props) {
        return props.initializeDataSourceBuilder().build();
    }
}
```

### Update-or-Insert Pattern

```java
repository.findById(sku)
    .flatMap(existing -> updateExisting(existing, request))  // Update if found
    .switchIfEmpty(createNew(sku, request));                 // Insert if not found
```

### Pagination with Spring Data R2DBC

```java
// Repository
Flux<PriceEntity> findAllBy(Pageable pageable);

// Service
public Flux<PriceEntity> listPrices(int page, int size) {
    return repository.findAllBy(PageRequest.of(page, size));
}
```

### Request Validation

```java
public record UpdatePriceRequest(
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price must be non-negative")
    BigDecimal price,
    BigDecimal originalPrice,
    String currency
) {}

// Controller uses @Valid to trigger validation
@PutMapping("/{sku}")
public Mono<PriceEntity> setPrice(
    @PathVariable Long sku,
    @Valid @RequestBody UpdatePriceRequest request
) {
    return service.setPrice(sku, request);
}
```

## Anti-patterns to Avoid

### Do Not Modify Existing Migrations

Flyway checksums migration files. Changing an already-applied migration will cause startup failure.

**Wrong:**
```sql
-- V001__create_prices_table.sql (modifying existing file)
ALTER TABLE prices ADD COLUMN new_field VARCHAR(50);
```

**Correct:**
```sql
-- V002__add_new_field.sql (new migration file)
ALTER TABLE prices ADD COLUMN new_field VARCHAR(50);
```

### Do Not Use Blocking JDBC with R2DBC

R2DBC is non-blocking. Mixing JDBC calls will block reactive threads.

**Wrong:**
```java
// Blocking JDBC call in reactive chain
return Mono.fromCallable(() -> jdbcTemplate.queryForObject(...));
```

**Correct:**
```java
// Use R2DBC repository
return repository.findById(sku);
```

### Do Not Forget Pagination Limits

Unbounded queries can exhaust memory.

**Wrong:**
```java
public Flux<PriceEntity> getAllPrices() {
    return repository.findAll();  // Returns all rows
}
```

**Correct:**
```java
public Flux<PriceEntity> listPrices(int page, int size) {
    return repository.findAllBy(PageRequest.of(page, size));
}
```

### Do Not Skip Validation

Always validate input to prevent invalid database state.

**Wrong:**
```java
@PutMapping("/{sku}")
public Mono<PriceEntity> setPrice(
    @PathVariable Long sku,
    @RequestBody UpdatePriceRequest request  // Missing @Valid
) {
    return service.setPrice(sku, request);
}
```

**Correct:**
```java
@PutMapping("/{sku}")
public Mono<PriceEntity> setPrice(
    @PathVariable Long sku,
    @Valid @RequestBody UpdatePriceRequest request  // @Valid triggers validation
) {
    return service.setPrice(sku, request);
}
```

### Do Not Return 404 for Empty Lists

Pagination should return empty array, not 404.

**Wrong:**
```java
return repository.findAllBy(pageable)
    .switchIfEmpty(Mono.error(new NotFoundException()));  // Wrong for lists
```

**Correct:**
```java
return repository.findAllBy(pageable);  // Empty Flux is valid
```

## Testing Guidance

### Integration Testing with Testcontainers

```java
@SpringBootTest
@Testcontainers
class PriceServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("pricedb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.r2dbc.url", () ->
            "r2dbc:postgresql://" + postgres.getHost() + ":" + postgres.getFirstMappedPort() + "/pricedb");
        registry.add("spring.r2dbc.username", postgres::getUsername);
        registry.add("spring.r2dbc.password", postgres::getPassword);

        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
    }

    @Test
    void shouldSaveAndRetrievePrice() {
        // Test implementation
    }
}
```

### Unit Testing Service Layer

```java
@ExtendWith(MockitoExtension.class)
class PriceServiceTest {

    @Mock
    private PriceR2dbcRepository repository;

    @InjectMocks
    private PriceService service;

    @Test
    void shouldReturnPriceWhenFound() {
        PriceEntity entity = new PriceEntity(
            123456L,
            new BigDecimal("29.99"),
            new BigDecimal("39.99"),
            "USD",
            Instant.now()
        );

        when(repository.findById(123456L)).thenReturn(Mono.just(entity));

        StepVerifier.create(service.getPrice(123456L))
            .assertNext(response -> {
                assertThat(response.price()).isEqualByComparingTo("29.99");
                assertThat(response.currency()).isEqualTo("USD");
            })
            .verifyComplete();
    }
}
```

### Testing Reactive Endpoints

```java
@WebFluxTest(PriceController.class)
class PriceControllerTest {

    @Autowired
    private WebTestClient webClient;

    @MockBean
    private PriceService service;

    @Test
    void shouldReturn404WhenPriceNotFound() {
        when(service.getPrice(999L)).thenReturn(Mono.empty());

        webClient.get()
            .uri("/price/999")
            .exchange()
            .expectStatus().isNotFound();
    }
}
```

## Configuration Files

| File | Purpose |
|------|---------|
| `application.yml` | Local development configuration |
| `application-docker.yml` | Docker Compose overrides |
| `build.gradle.kts` | Dependencies and build configuration |

## Dependencies

### Platform Libraries

- `platform-logging` - Structured JSON logging
- `platform-error` - Global error handling and ValidationException
- `platform-webflux` - RequestMetadata and ContextKeys
- `platform-security` - OAuth2/JWT security (currently disabled)

### External Dependencies

- `spring-boot-starter-webflux` - Reactive web framework
- `spring-boot-starter-data-r2dbc` - Reactive database access
- `spring-boot-starter-validation` - Jakarta Bean Validation
- `spring-boot-starter-flyway` - Database migrations
- `r2dbc-postgresql` - R2DBC driver for PostgreSQL
- `postgresql` - JDBC driver for Flyway

## Security Considerations

### Current State

Security is disabled in development (`app.security.enabled: false`). All endpoints are publicly accessible.

### Future Production Setup

When enabling security:

1. Set `app.security.enabled: true`
2. Configure JWT issuer in `application.yml`:
   ```yaml
   spring:
     security:
       oauth2:
         resourceserver:
           jwt:
             issuer-uri: http://user-service/oauth
   ```
3. Add `@PreAuthorize("hasRole('PRICING_SPECIALIST')")` to `PUT /price/{sku}` endpoint
4. Public endpoints: `GET /price/{sku}`, `GET /price` (read-only)
5. Protected endpoint: `PUT /price/{sku}` (requires role)

## Port Configuration

- **Local**: 8092
- **Docker**: 8092
- **No conflicts** with other services (see root CLAUDE.md for port registry)
