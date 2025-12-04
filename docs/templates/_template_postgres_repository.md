# Postgres Repository Template

This template defines the standard structure for reactive Postgres repositories using R2DBC.

## When to Use Postgres

Use Postgres for:
- **Transactional data** - Data that requires ACID guarantees
- **Relational data** - Data with complex relationships and joins
- **Persistent state** - Core business entities (carts, orders, users)
- **Queryable data** - Data that needs complex filtering, sorting, pagination

Do NOT use Postgres for:
- Ephemeral cache data (use Redis)
- High-frequency read-heavy data with simple access patterns (use Redis)
- Session data or short-lived state (use Redis)

## Dependencies

Add to `build.gradle.kts`:

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.postgresql:r2dbc-postgresql")

    // For JSON column support
    implementation("io.r2dbc:r2dbc-postgresql")

    // For Flyway migrations (optional but recommended)
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")  // JDBC driver for Flyway
}
```

## Configuration

`application.yml`:

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:cartdb}
    username: ${DB_USERNAME:cart_user}
    password: ${DB_PASSWORD:cart_pass}
    pool:
      initial-size: 5
      max-size: 20
      max-idle-time: 30m
  flyway:
    enabled: true
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:cartdb}
    user: ${DB_USERNAME:cart_user}
    password: ${DB_PASSWORD:cart_pass}
    locations: classpath:db/migration
```

## Database Schema

`src/main/resources/db/migration/V1__create_carts_table.sql`:

```sql
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY,
    store_number INTEGER NOT NULL,
    customer_id VARCHAR(255),
    products JSONB NOT NULL DEFAULT '[]',
    discounts JSONB NOT NULL DEFAULT '[]',
    fulfillments JSONB NOT NULL DEFAULT '[]',
    totals JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for finding carts by store
CREATE INDEX idx_carts_store_number ON carts(store_number);

-- Index for finding carts by customer
CREATE INDEX idx_carts_customer_id ON carts(customer_id);

-- Index for finding active/recent carts
CREATE INDEX idx_carts_updated_at ON carts(updated_at DESC);
```

## Entity Class

```java
package org.example.cart.repository;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Database entity for Cart.
 *
 * <p>This entity maps to the 'carts' table and uses JSONB columns
 * for nested collections to maintain flexibility while using Postgres.
 */
@Table("carts")
public record CartEntity(
        @Id UUID id,
        @Column("store_number") int storeNumber,
        @Column("customer_id") String customerId,
        @Column("products") String productsJson,      // JSONB stored as String
        @Column("discounts") String discountsJson,    // JSONB stored as String
        @Column("fulfillments") String fulfillmentsJson, // JSONB stored as String
        @Column("totals") String totalsJson,          // JSONB stored as String
        @Column("created_at") Instant createdAt,
        @Column("updated_at") Instant updatedAt
) {}
```

## Repository Interface

```java
package org.example.cart.repository;

import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

/**
 * Reactive repository for Cart entities.
 *
 * <p>Uses Spring Data R2DBC for non-blocking Postgres access.
 */
@Repository
public interface CartEntityRepository extends ReactiveCrudRepository<CartEntity, UUID> {

    /**
     * Find all carts for a specific store.
     */
    Flux<CartEntity> findByStoreNumber(int storeNumber);

    /**
     * Find all carts for a specific customer.
     */
    Flux<CartEntity> findByCustomerId(String customerId);

    /**
     * Find carts with custom query.
     */
    @Query("SELECT * FROM carts WHERE store_number = :storeNumber AND customer_id IS NOT NULL")
    Flux<CartEntity> findActiveCartsByStore(int storeNumber);
}
```

## Domain Repository Implementation

```java
package org.example.cart.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import org.example.cart.model.Cart;
import org.example.cart.model.CartTotals;
import org.example.model.customer.CartCustomer;
import org.example.model.discount.AppliedDiscount;
import org.example.model.fulfillment.Fulfillment;
import org.example.model.product.CartProduct;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Postgres implementation of CartRepository.
 *
 * <p>Converts between domain Cart objects and CartEntity database records,
 * handling JSON serialization for nested collections.
 */
@Repository
public class PostgresCartRepository implements CartRepository {

    private final CartEntityRepository entityRepository;
    private final ObjectMapper objectMapper;

    public PostgresCartRepository(CartEntityRepository entityRepository, ObjectMapper objectMapper) {
        this.entityRepository = entityRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Cart> findById(String cartId) {
        return entityRepository.findById(UUID.fromString(cartId))
                .flatMap(this::toDomain);
    }

    @Override
    public Flux<Cart> findByStoreNumber(int storeNumber) {
        return entityRepository.findByStoreNumber(storeNumber)
                .flatMap(this::toDomain);
    }

    @Override
    public Flux<Cart> findByCustomerId(String customerId) {
        return entityRepository.findByCustomerId(customerId)
                .flatMap(this::toDomain);
    }

    @Override
    public Mono<Cart> save(Cart cart) {
        return toEntity(cart)
                .flatMap(entityRepository::save)
                .flatMap(this::toDomain);
    }

    @Override
    public Mono<Void> deleteById(String cartId) {
        return entityRepository.deleteById(UUID.fromString(cartId));
    }

    @Override
    public Mono<Boolean> exists(String cartId) {
        return entityRepository.existsById(UUID.fromString(cartId));
    }

    // ==================== Mapping Methods ====================

    private Mono<Cart> toDomain(CartEntity entity) {
        return Mono.fromCallable(() -> {
            List<CartProduct> products = deserialize(entity.productsJson(),
                    new TypeReference<List<CartProduct>>() {});
            List<AppliedDiscount> discounts = deserialize(entity.discountsJson(),
                    new TypeReference<List<AppliedDiscount>>() {});
            List<Fulfillment> fulfillments = deserialize(entity.fulfillmentsJson(),
                    new TypeReference<List<Fulfillment>>() {});
            CartTotals totals = deserialize(entity.totalsJson(),
                    new TypeReference<CartTotals>() {});

            // Reconstruct customer if customerId exists
            CartCustomer customer = entity.customerId() != null
                    ? new CartCustomer(entity.customerId(), null, null)
                    : null;

            return new Cart(
                    entity.id().toString(),
                    entity.storeNumber(),
                    entity.customerId(),
                    customer,
                    products,
                    discounts,
                    fulfillments,
                    totals != null ? totals : CartTotals.empty(),
                    entity.createdAt(),
                    entity.updatedAt()
            );
        });
    }

    private Mono<CartEntity> toEntity(Cart cart) {
        return Mono.fromCallable(() -> new CartEntity(
                UUID.fromString(cart.id()),
                cart.storeNumber(),
                cart.customerId(),
                serialize(cart.products()),
                serialize(cart.discounts()),
                serialize(cart.fulfillments()),
                serialize(cart.totals()),
                cart.createdAt(),
                cart.updatedAt()
        ));
    }

    private <T> T deserialize(String json, TypeReference<T> typeRef) throws JsonProcessingException {
        if (json == null || json.isBlank()) {
            return null;
        }
        return objectMapper.readValue(json, typeRef);
    }

    private String serialize(Object obj) throws JsonProcessingException {
        return objectMapper.writeValueAsString(obj);
    }
}
```

## Configuration Class

```java
package org.example.cart.config;

import io.r2dbc.postgresql.PostgresqlConnectionConfiguration;
import io.r2dbc.postgresql.PostgresqlConnectionFactory;
import io.r2dbc.postgresql.codec.Json;
import io.r2dbc.spi.ConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.r2dbc.config.AbstractR2dbcConfiguration;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;

@Configuration
@EnableR2dbcRepositories(basePackages = "org.example.cart.repository")
public class DatabaseConfig extends AbstractR2dbcConfiguration {

    @Value("${spring.r2dbc.url}")
    private String url;

    @Value("${spring.r2dbc.username}")
    private String username;

    @Value("${spring.r2dbc.password}")
    private String password;

    @Override
    public ConnectionFactory connectionFactory() {
        // R2DBC URL parsing handled by Spring Boot auto-configuration
        return super.connectionFactory();
    }
}
```

## Testing

```java
package org.example.cart.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.r2dbc.DataR2dbcTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.test.StepVerifier;

@DataR2dbcTest
@Testcontainers
class PostgresCartRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.r2dbc.url", () ->
                String.format("r2dbc:postgresql://%s:%d/%s",
                        postgres.getHost(),
                        postgres.getFirstMappedPort(),
                        postgres.getDatabaseName()));
        registry.add("spring.r2dbc.username", postgres::getUsername);
        registry.add("spring.r2dbc.password", postgres::getPassword);
        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
    }

    @Autowired
    private PostgresCartRepository repository;

    @Test
    void shouldSaveAndFindCart() {
        Cart cart = Cart.create("test-id", 100, null);

        StepVerifier.create(repository.save(cart))
                .expectNextMatches(saved -> saved.id().equals(cart.id()))
                .verifyComplete();

        StepVerifier.create(repository.findById("test-id"))
                .expectNextMatches(found -> found.storeNumber() == 100)
                .verifyComplete();
    }
}
```

## Anti-Patterns

### Blocking in Reactive Pipeline

```java
// DON'T - blocking call in reactive chain
public Mono<Cart> save(Cart cart) {
    CartEntity entity = toEntity(cart);  // This might block!
    return entityRepository.save(entity).map(this::toDomain);
}

// DO - use Mono.fromCallable for potentially blocking operations
public Mono<Cart> save(Cart cart) {
    return Mono.fromCallable(() -> toEntity(cart))
            .flatMap(entityRepository::save)
            .flatMap(this::toDomain);
}
```

### Missing Error Handling

```java
// DON'T - exceptions propagate poorly
private Cart toDomain(CartEntity entity) {
    return objectMapper.readValue(entity.json(), Cart.class);  // Throws!
}

// DO - wrap in Mono for proper error propagation
private Mono<Cart> toDomain(CartEntity entity) {
    return Mono.fromCallable(() ->
        objectMapper.readValue(entity.json(), Cart.class)
    ).onErrorMap(JsonProcessingException.class,
        e -> new RuntimeException("Failed to deserialize cart", e));
}
```

## Checklist

Before using this template, verify:

- [ ] Added R2DBC and PostgreSQL dependencies to build.gradle.kts
- [ ] Created Flyway migration scripts for schema
- [ ] Added database configuration to application.yml
- [ ] Created entity class with proper column mappings
- [ ] Created repository interface extending ReactiveCrudRepository
- [ ] Created domain repository with JSON serialization
- [ ] Added Testcontainers for integration tests
