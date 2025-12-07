# 043 Urgent Fix: Services Startup Issues

## Status: IN PROGRESS

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

---

## Remaining Work

### 4. Apply Flyway Fix to Other R2DBC Services (IN PROGRESS)

The same Flyway issue affects:
- **checkout-service** - build.gradle.kts updated, needs FlywayConfiguration
- **customer-service** - build.gradle.kts updated, needs FlywayConfiguration
- **user-service** - build.gradle.kts updated, needs FlywayConfiguration

#### For Each Service:

1. **build.gradle.kts** - Already done for all three:
```kotlin
implementation("org.springframework.boot:spring-boot-starter-flyway")
implementation("org.flywaydb:flyway-database-postgresql")
implementation("org.springframework.boot:spring-boot-starter-jdbc")
```

2. **Create FlywayConfiguration.java** - PENDING:
   - `apps/checkout-service/src/main/java/org/example/checkout/config/FlywayConfiguration.java`
   - `apps/customer-service/src/main/java/org/example/customer/config/FlywayConfiguration.java`
   - `apps/user-service/src/main/java/org/example/user/config/FlywayConfiguration.java`

3. **Update docker-compose.yml** - Add `SPRING_DATASOURCE_*` for each service

4. **Rebuild and test** each service

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
| `apps/customer-service/build.gradle.kts` | Added spring-boot-starter-flyway + jdbc |
| `apps/user-service/build.gradle.kts` | Added spring-boot-starter-flyway + jdbc |
| `docker/docker-compose.yml` | Added SPRING_DATASOURCE_* for cart-service |

---

## Verification Commands

```bash
# Test product-service
curl -s "http://localhost:8080/products/search?query=test" \
  -H "x-store-number: 1" -H "x-order-number: test-123" \
  -H "x-userid: TEST01" -H "x-sessionid: sess-123"

# Test cart-service (create)
curl -s -X POST http://localhost:8081/carts \
  -H "x-store-number: 1" -H "x-order-number: test-123" \
  -H "x-userid: TEST01" -H "x-sessionid: sess-123" \
  -H "Content-Type: application/json" \
  -d '{"storeNumber": 1, "customerId": "CUST001"}'

# Check service health
curl -s http://localhost:8080/actuator/health
curl -s http://localhost:8081/actuator/health
curl -s http://localhost:8087/actuator/health
curl -s http://localhost:8083/actuator/health
curl -s http://localhost:8089/actuator/health

# Check Flyway ran
docker logs cart-service 2>&1 | grep -i flyway
docker logs checkout-service 2>&1 | grep -i flyway
docker logs customer-service 2>&1 | grep -i flyway
docker logs user-service 2>&1 | grep -i flyway
```

---

## Next Steps

1. Create `FlywayConfiguration.java` for checkout-service, customer-service, user-service
2. Update docker-compose.yml with SPRING_DATASOURCE_* for those services
3. Rebuild all affected services: `./gradlew bootJar`
4. Rebuild Docker images: `docker compose build`
5. Restart services and verify Flyway runs
6. Test full application flow in browser
7. Commit all fixes
