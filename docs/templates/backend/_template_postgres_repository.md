# Postgres Repository Template

This template defines the standard structure for reactive Postgres repositories using R2DBC.

Replace `{Entity}`, `{entity}`, `{entities}`, and `{domain}` with your domain-specific names (e.g., `Cart`/`cart`/`carts`/`cart`, `Order`/`order`/`orders`/`order`).

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
    url: r2dbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:{entity}db}
    username: ${DB_USERNAME:{entity}_user}
    password: ${DB_PASSWORD:{entity}_pass}
    pool:
      initial-size: 5
      max-size: 20
      max-idle-time: 30m
  flyway:
    enabled: true
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:{entity}db}
    user: ${DB_USERNAME:{entity}_user}
    password: ${DB_PASSWORD:{entity}_pass}
    locations: classpath:db/migration
```

## Database Schema

`src/main/resources/db/migration/V1__create_{entities}_table.sql`:

```sql
CREATE TABLE IF NOT EXISTS {entities} (
    id UUID PRIMARY KEY,
    store_number INTEGER NOT NULL,
    -- Add domain-specific columns here
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    data JSONB NOT NULL DEFAULT '{}',       -- For nested/flexible data
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for finding {entities} by store
CREATE INDEX idx_{entities}_store_number ON {entities}(store_number);

-- Index for finding {entities} by status
CREATE INDEX idx_{entities}_status ON {entities}(status);

-- Index for finding recent {entities}
CREATE INDEX idx_{entities}_updated_at ON {entities}(updated_at DESC);
```

## Entity Class

```java
package org.example.{domain}.repository;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Database entity for {Entity}.
 *
 * <p>This entity maps to the '{entities}' table and uses JSONB columns
 * for nested collections to maintain flexibility while using Postgres.
 */
@Table("{entities}")
public record {Entity}Entity(
        @Id UUID id,
        @Column("store_number") int storeNumber,
        @Column("status") String status,
        @Column("data") String dataJson,          // JSONB stored as String
        @Column("created_at") Instant createdAt,
        @Column("updated_at") Instant updatedAt
) {}
```

## Repository Interface

```java
package org.example.{domain}.repository;

import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

/**
 * Reactive repository for {Entity} entities.
 *
 * <p>Uses Spring Data R2DBC for non-blocking Postgres access.
 */
@Repository
public interface {Entity}EntityRepository extends ReactiveCrudRepository<{Entity}Entity, UUID> {

    /**
     * Find all {entities} for a specific store.
     */
    Flux<{Entity}Entity> findByStoreNumber(int storeNumber);

    /**
     * Find all {entities} by status.
     */
    Flux<{Entity}Entity> findByStatus(String status);

    /**
     * Find {entities} with custom query.
     */
    @Query("SELECT * FROM {entities} WHERE store_number = :storeNumber AND status = 'ACTIVE'")
    Flux<{Entity}Entity> findActiveByStore(int storeNumber);
}
```

## Domain Repository Interface

```java
package org.example.{domain}.repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Domain repository interface for {Entity}.
 *
 * <p>Defines operations in terms of domain objects, not database entities.
 */
public interface {Entity}Repository {

    Mono<{Entity}> findById(String id);

    Flux<{Entity}> findByStoreNumber(int storeNumber);

    Mono<{Entity}> save({Entity} {entity});

    Mono<Void> deleteById(String id);

    Mono<Boolean> exists(String id);
}
```

## Domain Repository Implementation

```java
package org.example.{domain}.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.UUID;
import org.example.{domain}.model.{Entity};
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Postgres implementation of {Entity}Repository.
 *
 * <p>Converts between domain {Entity} objects and {Entity}Entity database records,
 * handling JSON serialization for nested collections.
 */
@Repository
public class Postgres{Entity}Repository implements {Entity}Repository {

    private final {Entity}EntityRepository entityRepository;
    private final ObjectMapper objectMapper;

    public Postgres{Entity}Repository({Entity}EntityRepository entityRepository, ObjectMapper objectMapper) {
        this.entityRepository = entityRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<{Entity}> findById(String id) {
        return entityRepository.findById(UUID.fromString(id))
                .flatMap(this::toDomain);
    }

    @Override
    public Flux<{Entity}> findByStoreNumber(int storeNumber) {
        return entityRepository.findByStoreNumber(storeNumber)
                .flatMap(this::toDomain);
    }

    @Override
    public Mono<{Entity}> save({Entity} {entity}) {
        return toEntity({entity})
                .flatMap(entityRepository::save)
                .flatMap(this::toDomain);
    }

    @Override
    public Mono<Void> deleteById(String id) {
        return entityRepository.deleteById(UUID.fromString(id));
    }

    @Override
    public Mono<Boolean> exists(String id) {
        return entityRepository.existsById(UUID.fromString(id));
    }

    // ==================== Mapping Methods ====================

    private Mono<{Entity}> toDomain({Entity}Entity entity) {
        return Mono.fromCallable(() -> {
            // Deserialize JSONB columns
            {Entity}Data data = deserialize(entity.dataJson(),
                    new TypeReference<{Entity}Data>() {});

            return new {Entity}(
                    entity.id().toString(),
                    entity.storeNumber(),
                    entity.status(),
                    data,
                    entity.createdAt(),
                    entity.updatedAt()
            );
        });
    }

    private Mono<{Entity}Entity> toEntity({Entity} {entity}) {
        return Mono.fromCallable(() -> new {Entity}Entity(
                UUID.fromString({entity}.id()),
                {entity}.storeNumber(),
                {entity}.status(),
                serialize({entity}.data()),
                {entity}.createdAt(),
                Instant.now()  // Update timestamp on save
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
package org.example.{domain}.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.r2dbc.config.AbstractR2dbcConfiguration;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;

@Configuration
@EnableR2dbcRepositories(basePackages = "org.example.{domain}.repository")
public class DatabaseConfig extends AbstractR2dbcConfiguration {

    @Override
    public ConnectionFactory connectionFactory() {
        // R2DBC URL parsing handled by Spring Boot auto-configuration
        return super.connectionFactory();
    }
}
```

## Testing

```java
package org.example.{domain}.repository;

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
class Postgres{Entity}RepositoryTest {

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
    private Postgres{Entity}Repository repository;

    @Test
    void shouldSaveAndFind() {
        {Entity} {entity} = {Entity}.create("test-id", 100);

        StepVerifier.create(repository.save({entity}))
                .expectNextMatches(saved -> saved.id().equals({entity}.id()))
                .verifyComplete();

        StepVerifier.create(repository.findById("test-id"))
                .expectNextMatches(found -> found.storeNumber() == 100)
                .verifyComplete();
    }

    @Test
    void shouldFindByStoreNumber() {
        {Entity} {entity}1 = {Entity}.create("id-1", 100);
        {Entity} {entity}2 = {Entity}.create("id-2", 100);
        {Entity} {entity}3 = {Entity}.create("id-3", 200);

        repository.save({entity}1).block();
        repository.save({entity}2).block();
        repository.save({entity}3).block();

        StepVerifier.create(repository.findByStoreNumber(100))
                .expectNextCount(2)
                .verifyComplete();
    }

    @Test
    void shouldDeleteById() {
        {Entity} {entity} = {Entity}.create("delete-id", 100);
        repository.save({entity}).block();

        StepVerifier.create(repository.deleteById("delete-id"))
                .verifyComplete();

        StepVerifier.create(repository.exists("delete-id"))
                .expectNext(false)
                .verifyComplete();
    }
}
```

## Optimistic Locking (Optional)

For concurrent update scenarios, add version-based optimistic locking:

```java
@Table("{entities}")
public record {Entity}Entity(
        @Id UUID id,
        @Version Long version,  // Add version field
        @Column("store_number") int storeNumber,
        // ... other fields
) {}
```

```sql
-- Add version column to migration
ALTER TABLE {entities} ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
```

## Pagination

```java
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Query;

@Repository
public interface {Entity}EntityRepository extends ReactiveCrudRepository<{Entity}Entity, UUID> {

    /**
     * Find {entities} with pagination.
     */
    Flux<{Entity}Entity> findByStoreNumber(int storeNumber, Pageable pageable);

    /**
     * Count {entities} by store for pagination metadata.
     */
    Mono<Long> countByStoreNumber(int storeNumber);
}
```

## Anti-Patterns

### Blocking in Reactive Pipeline

```java
// DON'T - blocking call in reactive chain
public Mono<{Entity}> save({Entity} {entity}) {
    {Entity}Entity dbEntity = toEntity({entity});  // This might block!
    return entityRepository.save(dbEntity).map(this::toDomain);
}

// DO - use Mono.fromCallable for potentially blocking operations
public Mono<{Entity}> save({Entity} {entity}) {
    return Mono.fromCallable(() -> toEntity({entity}))
            .flatMap(entityRepository::save)
            .flatMap(this::toDomain);
}
```

### Missing Error Handling

```java
// DON'T - exceptions propagate poorly
private {Entity} toDomain({Entity}Entity entity) {
    return objectMapper.readValue(entity.json(), {Entity}.class);  // Throws!
}

// DO - wrap in Mono for proper error propagation
private Mono<{Entity}> toDomain({Entity}Entity entity) {
    return Mono.fromCallable(() ->
        objectMapper.readValue(entity.json(), {Entity}.class)
    ).onErrorMap(JsonProcessingException.class,
        e -> new RuntimeException("Failed to deserialize {entity}", e));
}
```

### N+1 Query Problem

```java
// DON'T - N+1 queries when fetching related data
public Flux<{Entity}WithDetails> findAllWithDetails() {
    return repository.findAll()
            .flatMap({entity} ->
                detailsRepository.findBy{Entity}Id({entity}.id())
                        .map(details -> new {Entity}WithDetails({entity}, details)));
}

// DO - use join query or batch fetch
@Query("""
    SELECT e.*, d.* FROM {entities} e
    LEFT JOIN {entity}_details d ON e.id = d.{entity}_id
    WHERE e.store_number = :storeNumber
    """)
Flux<{Entity}WithDetailsProjection> findAllWithDetailsByStore(int storeNumber);
```

### UUID String Conversion

```java
// DON'T - repeated UUID parsing without validation
public Mono<{Entity}> findById(String id) {
    return entityRepository.findById(UUID.fromString(id));  // Throws on invalid UUID!
}

// DO - validate and handle gracefully
public Mono<{Entity}> findById(String id) {
    return Mono.fromCallable(() -> UUID.fromString(id))
            .onErrorMap(IllegalArgumentException.class,
                e -> new InvalidIdException("Invalid {entity} ID: " + id))
            .flatMap(entityRepository::findById)
            .flatMap(this::toDomain);
}
```

## Checklist

Before using this template, verify:

- [ ] Added R2DBC and PostgreSQL dependencies to build.gradle.kts
- [ ] Created Flyway migration scripts for schema
- [ ] Added database configuration to application.yml
- [ ] Created entity class with proper column mappings
- [ ] Created repository interface extending ReactiveCrudRepository
- [ ] Created domain repository interface (abstracts persistence details)
- [ ] Created domain repository implementation with JSON serialization
- [ ] Added proper error handling in mapping methods
- [ ] Added Testcontainers for integration tests

## Related Templates

- `_template_redis_cache.md` - For caching frequently accessed data
- `_template_redis_pubsub.md` - For real-time notifications after mutations
