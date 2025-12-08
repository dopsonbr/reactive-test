# 043 Urgent Fix: Services Startup Issues

## Status: COMPLETE

## Problem Summary

When running `powerstart`, multiple services fail with various errors preventing the application from reaching a working state.

---

## Completed Fixes

### 1. Product-Service: Catalog URL Missing (FIXED)

**Issue**: Circuit breaker OPEN for catalog service - URL defaulted to `localhost:8081` instead of `wiremock:8080`

**Fix**: Added to `apps/product-service/src/main/resources/application-docker.yml`:
```yaml
services:
  catalog:
    base-url: http://wiremock:8080
```

### 2. Cart-Service: 401/403 Auth Errors (FIXED)

**Issue**: `SecurityConfig.java` didn't have `@ConditionalOnProperty` annotation - security always activated even when disabled

**Fix**: Added annotation to `apps/cart-service/src/main/java/org/example/cart/config/SecurityConfig.java`:
```java
@ConditionalOnProperty(name = "app.security.enabled", havingValue = "true", matchIfMissing = true)
public class SecurityConfig {
```

### 3. Cart-Service: Flyway Migrations Not Running (FIXED)

**Issue**: Spring Boot 4.0's `DataSourceAutoConfiguration` has `@ConditionalOnMissingBean(ConnectionFactory.class)` - won't create JDBC DataSource when R2DBC is present. Flyway requires JDBC.

**Root Cause**:
- `flyway-core` was in dependencies but not `spring-boot-starter-flyway`
- `spring-boot-starter-jdbc` was only in `testImplementation`, not main

**Fix Applied**:
1. Updated `apps/cart-service/build.gradle.kts`:
```kotlin
implementation("org.springframework.boot:spring-boot-starter-flyway")
implementation("org.flywaydb:flyway-database-postgresql")
implementation("org.springframework.boot:spring-boot-starter-jdbc")
```

2. Created `apps/cart-service/src/main/java/org/example/cart/config/FlywayConfiguration.java`:
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

3. Updated `docker/docker-compose.yml` - added `SPRING_DATASOURCE_*` env vars for cart-service

**Verified Working**: Cart-service now runs Flyway migrations and creates/fetches carts successfully.

### 4. Apply Flyway Fix to Other R2DBC Services (FIXED)

The same Flyway issue affected checkout-service, customer-service, and user-service.

**Fixes Applied**:

1. **FlywayConfiguration.java** - Created for all three services:
   - `apps/checkout-service/src/main/java/org/example/checkout/config/FlywayConfiguration.java`
   - `apps/customer-service/src/main/java/org/example/customer/config/FlywayConfiguration.java`
   - `apps/user-service/src/main/java/org/example/user/config/FlywayConfiguration.java`

2. **docker-compose.yml** - Added `SPRING_DATASOURCE_*` env vars for all three services

3. **user-service special case** - Required additional Flyway configuration:
   - Added `baseline-on-migrate: true` and `baseline-version: 3` to `application.yml`
   - This was needed because the userdb already had tables from a previous manual setup

---

## Docker-Compose Environment Variables Pattern

For R2DBC services that need Flyway, add these env vars:
```yaml
environment:
  # R2DBC for runtime
  - SPRING_R2DBC_URL=r2dbc:postgresql://postgres:5432/{dbname}
  - SPRING_R2DBC_USERNAME={user}
  - SPRING_R2DBC_PASSWORD={pass}
  # JDBC DataSource for Flyway
  - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/{dbname}
  - SPRING_DATASOURCE_USERNAME={user}
  - SPRING_DATASOURCE_PASSWORD={pass}
  # Flyway config
  - SPRING_FLYWAY_URL=jdbc:postgresql://postgres:5432/{dbname}
  - SPRING_FLYWAY_USER={user}
  - SPRING_FLYWAY_PASSWORD={pass}
```

---

## Files Modified

| File | Change |
|------|--------|
| `apps/product-service/src/main/resources/application-docker.yml` | Added catalog service URL |
| `apps/cart-service/src/main/java/org/example/cart/config/SecurityConfig.java` | Added @ConditionalOnProperty |
| `apps/cart-service/build.gradle.kts` | Added spring-boot-starter-flyway + jdbc |
| `apps/cart-service/src/main/java/org/example/cart/config/FlywayConfiguration.java` | Created new |
| `apps/checkout-service/build.gradle.kts` | Added spring-boot-starter-flyway + jdbc |
| `apps/checkout-service/src/main/java/org/example/checkout/config/FlywayConfiguration.java` | Created new |
| `apps/customer-service/build.gradle.kts` | Added spring-boot-starter-flyway + jdbc |
| `apps/customer-service/src/main/java/org/example/customer/config/FlywayConfiguration.java` | Created new |
| `apps/user-service/build.gradle.kts` | Added spring-boot-starter-flyway + jdbc |
| `apps/user-service/src/main/java/org/example/user/config/FlywayConfiguration.java` | Created new |
| `apps/user-service/src/main/resources/application.yml` | Added baseline-on-migrate + baseline-version |
| `docker/docker-compose.yml` | Added SPRING_DATASOURCE_* for cart, checkout, customer, user services |

---

## Verification Results

All services verified healthy:
- product-service (8080): UP
- cart-service (8081): UP
- checkout-service (8087): UP
- customer-service (8083): UP
- user-service (8089): UP

---

## Key Lessons Learned

1. **Spring Boot 4.0 R2DBC/JDBC Conflict**: When using R2DBC, Spring Boot 4.0's `DataSourceAutoConfiguration` won't create a JDBC DataSource. For services that need both R2DBC (runtime) and JDBC (Flyway migrations), a manual `FlywayConfiguration` with `@FlywayDataSource` is required.

2. **Import Paths Changed**: Spring Boot 4.0 modularized packages:
   - `org.springframework.boot.flyway.autoconfigure.FlywayDataSource`
   - `org.springframework.boot.jdbc.autoconfigure.DataSourceProperties`

3. **Existing Database Baseline**: When adding Flyway to a service with an existing database, use `baseline-on-migrate: true` and set `baseline-version` to the highest migration version to skip already-applied migrations.
