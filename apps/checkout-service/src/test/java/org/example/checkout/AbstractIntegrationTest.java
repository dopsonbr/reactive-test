package org.example.checkout;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for integration tests that require PostgreSQL and Redis. Configures Testcontainers
 * with shared instances for R2DBC, Flyway, and Redis.
 */
@Testcontainers
public abstract class AbstractIntegrationTest {

  @Container
  static PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>("postgres:15-alpine")
          .withDatabaseName("checkoutdb")
          .withUsername("checkout_user")
          .withPassword("checkout_pass");

  @Container
  @SuppressWarnings("resource")
  static GenericContainer<?> redis =
      new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

  @DynamicPropertySource
  static void configureProperties(DynamicPropertyRegistry registry) {
    // R2DBC configuration (fully reactive)
    registry.add(
        "spring.r2dbc.url",
        () ->
            String.format(
                "r2dbc:postgresql://%s:%d/%s",
                postgres.getHost(), postgres.getFirstMappedPort(), postgres.getDatabaseName()));
    registry.add("spring.r2dbc.username", postgres::getUsername);
    registry.add("spring.r2dbc.password", postgres::getPassword);

    // Redis configuration
    registry.add("spring.data.redis.host", redis::getHost);
    registry.add("spring.data.redis.port", redis::getFirstMappedPort);

    // Disable JDBC-based Flyway (we use reactive ConnectionFactoryInitializer instead)
    registry.add("spring.flyway.enabled", () -> "false");
  }
}
