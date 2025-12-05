package org.example.cart;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for integration tests that require PostgreSQL. Configures Testcontainers with a shared
 * PostgreSQL instance for R2DBC and Flyway.
 */
@Testcontainers
public abstract class AbstractIntegrationTest {

  @Container
  static PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>("postgres:15-alpine")
          .withDatabaseName("cartdb")
          .withUsername("cart_user")
          .withPassword("cart_pass");

  @DynamicPropertySource
  static void configureProperties(DynamicPropertyRegistry registry) {
    // R2DBC configuration
    registry.add(
        "spring.r2dbc.url",
        () ->
            String.format(
                "r2dbc:postgresql://%s:%d/%s",
                postgres.getHost(), postgres.getFirstMappedPort(), postgres.getDatabaseName()));
    registry.add("spring.r2dbc.username", postgres::getUsername);
    registry.add("spring.r2dbc.password", postgres::getPassword);

    // Flyway configuration (uses JDBC)
    registry.add("spring.flyway.url", postgres::getJdbcUrl);
    registry.add("spring.flyway.user", postgres::getUsername);
    registry.add("spring.flyway.password", postgres::getPassword);
  }
}
