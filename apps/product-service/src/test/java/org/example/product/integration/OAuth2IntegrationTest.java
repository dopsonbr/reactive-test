package org.example.product.integration;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.example.platform.test.TestJwtBuilder;
import org.example.platform.test.TestSecurityConfig;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Integration tests for OAuth2 security flow. Tests inbound JWT validation and verifies the full
 * request/response cycle.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@Testcontainers
@Import(TestSecurityConfig.class)
class OAuth2IntegrationTest {

  private static final int REDIS_PORT = 6379;

  @Container
  static GenericContainer<?> redis =
      new GenericContainer<>("redis:7.4-alpine").withExposedPorts(REDIS_PORT);

  private static WireMockServer wireMockServer;

  @Autowired private WebTestClient webTestClient;

  @DynamicPropertySource
  static void configureProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.data.redis.host", redis::getHost);
    registry.add("spring.data.redis.port", () -> redis.getMappedPort(REDIS_PORT));

    // WireMock URL set after server starts
    registry.add(
        "services.merchandise.base-url", () -> "http://localhost:" + wireMockServer.port());
    registry.add("services.price.base-url", () -> "http://localhost:" + wireMockServer.port());
    registry.add("services.inventory.base-url", () -> "http://localhost:" + wireMockServer.port());

    // Disable resilience4j for cleaner testing
    registry.add(
        "resilience4j.circuitbreaker.configs.default.minimum-number-of-calls", () -> "100");
    registry.add("resilience4j.retry.configs.default.max-attempts", () -> "1");
    registry.add("resilience4j.timelimiter.configs.default.timeout-duration", () -> "5s");
  }

  @BeforeAll
  static void startWireMock() {
    wireMockServer = new WireMockServer(wireMockConfig().dynamicPort());
    wireMockServer.start();
    WireMock.configureFor("localhost", wireMockServer.port());
  }

  @AfterAll
  static void stopWireMock() {
    wireMockServer.stop();
  }

  @BeforeEach
  void setUp() {
    wireMockServer.resetAll();
    setupDownstreamServiceMocks();
  }

  @Test
  @DisplayName("should authenticate and return product with valid JWT")
  void shouldAuthenticateAndReturnProduct() {
    String validToken = TestJwtBuilder.builder().scope("product:read").build();

    webTestClient
        .get()
        .uri("/products/123456") // SKU must be 6+ digits (>=100000)
        .header("Authorization", "Bearer " + validToken)
        .header("x-store-number", "100")
        .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
        .header("x-userid", "user01")
        .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.sku")
        .isEqualTo(123456)
        .jsonPath("$.description")
        .isEqualTo("Test Product Description")
        .jsonPath("$.price")
        .isEqualTo("29.99")
        .jsonPath("$.availableQuantity")
        .isEqualTo(50);
  }

  @Test
  @DisplayName("should reject request without JWT token")
  void shouldRejectRequestWithoutToken() {
    webTestClient
        .get()
        .uri("/products/123456") // SKU must be 6+ digits (>=100000)
        .header("x-store-number", "100")
        .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
        .header("x-userid", "user01")
        .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
        .exchange()
        .expectStatus()
        .isUnauthorized();
  }

  @Test
  @DisplayName("should reject request with expired JWT token")
  void shouldRejectExpiredToken() {
    String expiredToken = TestJwtBuilder.builder().scope("product:read").expired().build();

    webTestClient
        .get()
        .uri("/products/123456") // SKU must be 6+ digits (>=100000)
        .header("Authorization", "Bearer " + expiredToken)
        .header("x-store-number", "100")
        .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
        .header("x-userid", "user01")
        .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
        .exchange()
        .expectStatus()
        .isUnauthorized();
  }

  @Test
  @DisplayName("should reject request with wrong scope")
  void shouldRejectWrongScope() {
    String wrongScopeToken = TestJwtBuilder.builder().scope("other:read").build();

    webTestClient
        .get()
        .uri("/products/123456") // SKU must be 6+ digits (>=100000)
        .header("Authorization", "Bearer " + wrongScopeToken)
        .header("x-store-number", "100")
        .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
        .header("x-userid", "user01")
        .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
        .exchange()
        .expectStatus()
        .isForbidden();
  }

  @Test
  @DisplayName("should handle multiple valid scopes")
  void shouldHandleMultipleScopes() {
    String multiScopeToken =
        TestJwtBuilder.builder().scopes("product:read", "product:write", "admin").build();

    webTestClient
        .get()
        .uri("/products/123456") // SKU must be 6+ digits (>=100000)
        .header("Authorization", "Bearer " + multiScopeToken)
        .header("x-store-number", "100")
        .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
        .header("x-userid", "user01")
        .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
        .exchange()
        .expectStatus()
        .isOk();
  }

  @Test
  @DisplayName("should call downstream services on authenticated request")
  void shouldCallDownstreamServicesOnAuthenticatedRequest() {
    String validToken = TestJwtBuilder.builder().scope("product:read").build();

    webTestClient
        .get()
        .uri("/products/999999") // SKU must be 6+ digits (>=100000)
        .header("Authorization", "Bearer " + validToken)
        .header("x-store-number", "100")
        .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
        .header("x-userid", "user01")
        .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
        .exchange()
        .expectStatus()
        .isOk();

    // Verify downstream services were called
    wireMockServer.verify(getRequestedFor(urlPathMatching("/merchandise/.*")));
    wireMockServer.verify(getRequestedFor(urlPathMatching("/price/.*")));
    wireMockServer.verify(getRequestedFor(urlPathMatching("/inventory/.*")));
  }

  @Test
  @DisplayName("should allow health endpoint without authentication")
  void shouldAllowHealthEndpointWithoutAuth() {
    webTestClient
        .get()
        .uri("/actuator/health")
        .exchange()
        .expectStatus()
        .value(
            status -> {
              // Health endpoint may return 200 (UP) or 503 (DOWN) depending on Redis
              // Key is it should NOT return 401/403
              org.assertj.core.api.Assertions.assertThat(status).isNotIn(401, 403);
            });
  }

  @Test
  @DisplayName("should allow prometheus endpoint without authentication")
  void shouldAllowPrometheusEndpointWithoutAuth() {
    webTestClient
        .get()
        .uri("/actuator/prometheus")
        .exchange()
        .expectStatus()
        .value(
            status -> {
              // Should NOT return 401/403
              org.assertj.core.api.Assertions.assertThat(status).isNotIn(401, 403);
            });
  }

  @Test
  @DisplayName("should allow actuator endpoints without authentication")
  void shouldAllowActuatorEndpointsWithoutAuth() {
    // Actuator endpoints are permitted without auth - exposure config controls what's available
    webTestClient.get().uri("/actuator/metrics").exchange().expectStatus().isOk();
  }

  @Test
  @DisplayName("should authenticate actuator endpoints with valid token")
  void shouldAuthenticateActuatorEndpointsWithValidToken() {
    String validToken = TestJwtBuilder.builder().scope("product:read").build();

    webTestClient
        .get()
        .uri("/actuator/metrics")
        .header("Authorization", "Bearer " + validToken)
        .exchange()
        .expectStatus()
        .isOk();
  }

  private void setupDownstreamServiceMocks() {
    wireMockServer.stubFor(
        get(urlPathMatching("/merchandise/.*"))
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody("{\"description\": \"Test Product" + " Description\"}")));

    wireMockServer.stubFor(
        get(urlPathMatching("/price/.*"))
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody("{\"price\": \"29.99\"}")));

    wireMockServer.stubFor(
        get(urlPathMatching("/inventory/.*"))
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody("{\"availableQuantity\": 50}")));
  }
}
