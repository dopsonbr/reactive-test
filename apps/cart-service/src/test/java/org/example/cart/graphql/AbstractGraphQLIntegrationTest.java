package org.example.cart.graphql;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import org.example.cart.client.CustomerServiceClient;
import org.example.cart.client.DiscountServiceClient;
import org.example.cart.client.FulfillmentServiceClient;
import org.example.cart.client.ProductServiceClient;
import org.example.model.customer.CartCustomer;
import org.example.model.discount.AppliedDiscount;
import org.example.model.discount.Discount;
import org.example.model.discount.DiscountType;
import org.example.model.fulfillment.FulfillmentType;
import org.example.model.product.Product;
import org.example.platform.test.TestSecurityConfig;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Lazy;
import org.springframework.graphql.test.tester.HttpGraphQlTester;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;

/**
 * Base class for GraphQL integration tests. Configures PostgreSQL, Redis, and Flyway for full
 * integration testing.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import({AbstractGraphQLIntegrationTest.GraphQlTesterConfiguration.class, TestSecurityConfig.class})
public abstract class AbstractGraphQLIntegrationTest {

  // Manually managed containers (not using @Container annotation)
  static PostgreSQLContainer<?> postgres;
  static GenericContainer<?> redis;
  static boolean containersStarted = false;

  // Mock external service clients to avoid actual HTTP calls in tests
  @MockitoBean protected CustomerServiceClient customerServiceClient;
  @MockitoBean protected ProductServiceClient productServiceClient;
  @MockitoBean protected DiscountServiceClient discountServiceClient;
  @MockitoBean protected FulfillmentServiceClient fulfillmentServiceClient;

  static {
    // Initialize and start containers in static block to ensure they're ready before Spring context
    postgres =
        new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("cartdb")
            .withUsername("cart_user")
            .withPassword("cart_pass");

    redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine")).withExposedPorts(6379);

    // Start containers
    postgres.start();
    redis.start();

    // Run Flyway migrations after PostgreSQL is started
    Flyway flyway =
        Flyway.configure()
            .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
            .locations("classpath:db/migration")
            .load();
    flyway.migrate();

    containersStarted = true;
  }

  @Autowired protected HttpGraphQlTester graphQlTester;
  @Autowired protected WebTestClient webTestClient;

  @BeforeEach
  void setupMocks() {
    // Configure default mock responses
    when(customerServiceClient.validateCustomer(any())).thenReturn(Mono.just(true));
    when(customerServiceClient.getCustomer(any()))
        .thenAnswer(
            invocation -> {
              String customerId = invocation.getArgument(0);
              return Mono.just(new CartCustomer(customerId, "Test Customer", "test@example.com"));
            });
    when(productServiceClient.getProduct(anyLong(), anyInt(), any(), any(), any()))
        .thenAnswer(
            invocation -> {
              long sku = invocation.getArgument(0);
              return Mono.just(new Product(sku, "Test Product", "9.99", 100));
            });
    when(discountServiceClient.validateDiscount(any()))
        .thenAnswer(
            invocation -> {
              String code = invocation.getArgument(0);
              return Mono.just(
                  new Discount(
                      "disc-001",
                      code,
                      DiscountType.PERCENTAGE,
                      BigDecimal.valueOf(10),
                      "10% off test discount",
                      null));
            });
    when(discountServiceClient.calculateDiscount(any(), any(), any()))
        .thenAnswer(
            invocation -> {
              String code = invocation.getArgument(0);
              return Mono.just(
                  new AppliedDiscount(
                      "disc-001",
                      code,
                      DiscountType.PERCENTAGE,
                      BigDecimal.valueOf(10),
                      BigDecimal.valueOf(1.00),
                      List.of()));
            });
    when(fulfillmentServiceClient.calculateFulfillmentCost(any(FulfillmentType.class), any()))
        .thenReturn(Mono.just(BigDecimal.valueOf(5.99)));
  }

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

    // Disable Flyway auto-run - we run it manually in static initializer
    registry.add("spring.flyway.enabled", () -> false);

    // Redis configuration for pub/sub
    registry.add("spring.data.redis.host", redis::getHost);
    registry.add("spring.data.redis.port", redis::getFirstMappedPort);

    // Disable audit for tests
    registry.add("audit.enabled", () -> false);

    // Disable security for tests (method-level still works with @WithMockUser)
    registry.add("app.security.enabled", () -> false);
  }

  @TestConfiguration
  static class GraphQlTesterConfiguration {
    @Bean
    @Lazy
    HttpGraphQlTester httpGraphQlTester(@Value("${local.server.port}") int port) {
      WebTestClient graphQlClient =
          WebTestClient.bindToServer().baseUrl("http://localhost:" + port + "/graphql").build();
      return HttpGraphQlTester.create(graphQlClient);
    }

    @Bean
    @Lazy
    WebTestClient webTestClient(@Value("${local.server.port}") int port) {
      return WebTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }
  }
}
