package org.example.checkout.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.checkout.AbstractIntegrationTest;
import org.example.checkout.dto.CheckoutSummaryResponse;
import org.example.checkout.dto.CompleteCheckoutRequest;
import org.example.checkout.dto.InitiateCheckoutRequest;
import org.example.checkout.dto.OrderResponse;
import org.example.checkout.service.CheckoutService;
import org.example.checkout.validation.CheckoutRequestValidator;
import org.example.model.order.FulfillmentType;
import org.example.model.order.OrderStatus;
import org.example.model.order.PaymentStatus;
import org.example.platform.test.SecurityTestUtils;
import org.example.platform.test.TestSecurityConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

/** Security tests for CheckoutController. Verifies OAuth2 authentication and authorization. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestSecurityConfig.class)
@org.springframework.test.context.TestPropertySource(properties = "app.security.enabled=true")
class CheckoutControllerSecurityTest extends AbstractIntegrationTest {

  private static final String VALID_CART_ID = "550e8400-e29b-41d4-a716-446655440000";
  private static final String CHECKOUT_SESSION_ID = "770e8400-e29b-41d4-a716-446655440000";
  private static final String TEST_ORDER_ID = "660e8400-e29b-41d4-a716-446655440000";
  private static final String ORDER_NUMBER = "880e8400-e29b-41d4-a716-446655440000";
  private static final String SESSION_ID = "990e8400-e29b-41d4-a716-446655440000";
  private static final String USER_ID = "user01";
  private static final int STORE_NUMBER = 100;

  @LocalServerPort private int port;

  private WebTestClient webTestClient;

  @MockitoBean private CheckoutService checkoutService;
  @MockitoBean private CheckoutRequestValidator validator;

  @MockitoBean
  private org.example.checkout.repository.CheckoutTransactionRepository transactionRepository;

  @MockitoBean private org.example.checkout.event.OrderCompletedEventPublisher eventPublisher;
  @MockitoBean private org.example.platform.events.CloudEventPublisher cloudEventPublisher;

  private CheckoutSummaryResponse testCheckoutSummary;
  private OrderResponse testOrderResponse;

  @BeforeEach
  void setUp() {
    webTestClient = WebTestClient.bindToServer().baseUrl("http://localhost:" + port).build();

    testCheckoutSummary =
        new CheckoutSummaryResponse(
            CHECKOUT_SESSION_ID,
            VALID_CART_ID,
            "ORD-123",
            STORE_NUMBER,
            null,
            List.of(),
            List.of(),
            null,
            UUID.randomUUID(),
            new BigDecimal("100.00"),
            BigDecimal.ZERO,
            new BigDecimal("8.00"),
            BigDecimal.ZERO,
            new BigDecimal("108.00"),
            Instant.now().plusSeconds(900));

    testOrderResponse =
        new OrderResponse(
            UUID.fromString(TEST_ORDER_ID),
            "ORD-123",
            STORE_NUMBER,
            "customer-1",
            OrderStatus.PAID,
            FulfillmentType.IMMEDIATE,
            null,
            null,
            List.of(),
            List.of(),
            null,
            new BigDecimal("100.00"),
            BigDecimal.ZERO,
            new BigDecimal("8.00"),
            BigDecimal.ZERO,
            new BigDecimal("108.00"),
            PaymentStatus.COMPLETED,
            "CASH",
            "PAY-123",
            Instant.now());

    // Default validator behavior - pass validation
    when(validator.validateInitiateCheckout(any(), anyInt(), anyString(), anyString(), anyString()))
        .thenReturn(Mono.empty());
    when(validator.validateCompleteCheckout(any(), anyInt(), anyString(), anyString(), anyString()))
        .thenReturn(Mono.empty());
  }

  @Nested
  class AuthenticationTests {

    @Test
    void shouldReturn401ForInitiateWithoutToken() {
      webTestClient
          .post()
          .uri("/checkout/initiate")
          .header("x-store-number", String.valueOf(STORE_NUMBER))
          .header("x-order-number", ORDER_NUMBER)
          .header("x-userid", USER_ID)
          .header("x-sessionid", SESSION_ID)
          .bodyValue(
              new InitiateCheckoutRequest(
                  VALID_CART_ID, FulfillmentType.IMMEDIATE, null, null, null))
          .exchange()
          .expectStatus()
          .isUnauthorized();
    }

    @Test
    void shouldReturn401ForCompleteWithoutToken() {
      webTestClient
          .post()
          .uri("/checkout/complete")
          .header("x-store-number", String.valueOf(STORE_NUMBER))
          .header("x-order-number", ORDER_NUMBER)
          .header("x-userid", USER_ID)
          .header("x-sessionid", SESSION_ID)
          .header("Content-Type", "application/json")
          .bodyValue(new CompleteCheckoutRequest(CHECKOUT_SESSION_ID, "CASH", null))
          .exchange()
          .expectStatus()
          .isUnauthorized();
    }

    @Test
    void shouldReturn401WhenTokenExpired() {
      String expiredToken = SecurityTestUtils.expiredToken();

      webTestClient
          .post()
          .uri("/checkout/initiate")
          .header("Authorization", SecurityTestUtils.bearerAuth(expiredToken))
          .header("x-store-number", String.valueOf(STORE_NUMBER))
          .header("x-order-number", ORDER_NUMBER)
          .header("x-userid", USER_ID)
          .header("x-sessionid", SESSION_ID)
          .header("Content-Type", "application/json")
          .bodyValue(
              new InitiateCheckoutRequest(
                  VALID_CART_ID, FulfillmentType.IMMEDIATE, null, null, null))
          .exchange()
          .expectStatus()
          .isUnauthorized();
    }
  }

  // NOTE: ReadAuthorizationTests for order endpoints have been removed.
  // Order query operations are now handled by order-service, which consumes
  // OrderCompleted events published by checkout-service.

  @Nested
  class WriteAuthorizationTests {

    @Test
    void shouldReturn403WhenMissingScopeForInitiate() {
      String tokenWithReadOnly = SecurityTestUtils.validToken("checkout:read");

      webTestClient
          .post()
          .uri("/checkout/initiate")
          .header("Authorization", SecurityTestUtils.bearerAuth(tokenWithReadOnly))
          .header("x-store-number", String.valueOf(STORE_NUMBER))
          .header("x-order-number", ORDER_NUMBER)
          .header("x-userid", USER_ID)
          .header("x-sessionid", SESSION_ID)
          .header("Content-Type", "application/json")
          .bodyValue(
              new InitiateCheckoutRequest(
                  VALID_CART_ID, FulfillmentType.IMMEDIATE, null, null, null))
          .exchange()
          .expectStatus()
          .isForbidden();
    }

    @Test
    void shouldReturn200ForInitiateWithValidScope() {
      when(checkoutService.initiateCheckout(any(), anyInt()))
          .thenReturn(Mono.just(testCheckoutSummary));

      String validToken = SecurityTestUtils.validToken("checkout:write");

      webTestClient
          .post()
          .uri("/checkout/initiate")
          .header("Authorization", SecurityTestUtils.bearerAuth(validToken))
          .header("x-store-number", String.valueOf(STORE_NUMBER))
          .header("x-order-number", ORDER_NUMBER)
          .header("x-userid", USER_ID)
          .header("x-sessionid", SESSION_ID)
          .header("Content-Type", "application/json")
          .bodyValue(
              new InitiateCheckoutRequest(
                  VALID_CART_ID, FulfillmentType.IMMEDIATE, null, null, null))
          .exchange()
          .expectStatus()
          .isOk()
          .expectBody()
          .jsonPath("$.checkoutSessionId")
          .isEqualTo(CHECKOUT_SESSION_ID);
    }

    @Test
    void shouldReturn403WhenMissingScopeForComplete() {
      String tokenWithReadOnly = SecurityTestUtils.validToken("checkout:read");

      webTestClient
          .post()
          .uri("/checkout/complete")
          .header("Authorization", SecurityTestUtils.bearerAuth(tokenWithReadOnly))
          .header("x-store-number", String.valueOf(STORE_NUMBER))
          .header("x-order-number", ORDER_NUMBER)
          .header("x-userid", USER_ID)
          .header("x-sessionid", SESSION_ID)
          .header("Content-Type", "application/json")
          .bodyValue(new CompleteCheckoutRequest(CHECKOUT_SESSION_ID, "CASH", null))
          .exchange()
          .expectStatus()
          .isForbidden();
    }

    @Test
    void shouldReturn201ForCompleteWithValidScope() {
      when(checkoutService.completeCheckout(any(), anyInt()))
          .thenReturn(Mono.just(testOrderResponse));

      String validToken = SecurityTestUtils.validToken("checkout:write");

      webTestClient
          .post()
          .uri("/checkout/complete")
          .header("Authorization", SecurityTestUtils.bearerAuth(validToken))
          .header("x-store-number", String.valueOf(STORE_NUMBER))
          .header("x-order-number", ORDER_NUMBER)
          .header("x-userid", USER_ID)
          .header("x-sessionid", SESSION_ID)
          .header("Content-Type", "application/json")
          .bodyValue(new CompleteCheckoutRequest(CHECKOUT_SESSION_ID, "CASH", null))
          .exchange()
          .expectStatus()
          .isCreated()
          .expectBody()
          .jsonPath("$.orderId")
          .isEqualTo(TEST_ORDER_ID);
    }

    @Test
    void shouldReturn200WithMultipleValidScopes() {
      when(checkoutService.initiateCheckout(any(), anyInt()))
          .thenReturn(Mono.just(testCheckoutSummary));

      String validToken = SecurityTestUtils.validToken("checkout:read", "checkout:write");

      webTestClient
          .post()
          .uri("/checkout/initiate")
          .header("Authorization", SecurityTestUtils.bearerAuth(validToken))
          .header("x-store-number", String.valueOf(STORE_NUMBER))
          .header("x-order-number", ORDER_NUMBER)
          .header("x-userid", USER_ID)
          .header("x-sessionid", SESSION_ID)
          .header("Content-Type", "application/json")
          .bodyValue(
              new InitiateCheckoutRequest(
                  VALID_CART_ID, FulfillmentType.IMMEDIATE, null, null, null))
          .exchange()
          .expectStatus()
          .isOk();
    }
  }

  @Nested
  class NoScopeTests {

    @Test
    void shouldReturn403WhenNoScopesForInitiate() {
      String noScopesToken = SecurityTestUtils.noScopesToken();

      webTestClient
          .post()
          .uri("/checkout/initiate")
          .header("Authorization", SecurityTestUtils.bearerAuth(noScopesToken))
          .header("x-store-number", String.valueOf(STORE_NUMBER))
          .header("x-order-number", ORDER_NUMBER)
          .header("x-userid", USER_ID)
          .header("x-sessionid", SESSION_ID)
          .header("Content-Type", "application/json")
          .bodyValue(
              new InitiateCheckoutRequest(
                  VALID_CART_ID, FulfillmentType.IMMEDIATE, null, null, null))
          .exchange()
          .expectStatus()
          .isForbidden();
    }
  }

  @Nested
  class ActuatorEndpointTests {

    @Test
    void shouldAllowHealthEndpointWithoutAuth() {
      webTestClient
          .get()
          .uri("/actuator/health")
          .exchange()
          .expectStatus()
          .value(status -> org.assertj.core.api.Assertions.assertThat(status).isIn(200, 503));
    }

    @Test
    void shouldAllowPrometheusEndpointWithoutAuth() {
      webTestClient
          .get()
          .uri("/actuator/prometheus")
          .exchange()
          .expectStatus()
          .value(status -> org.assertj.core.api.Assertions.assertThat(status).isNotIn(401, 403));
    }

    @Test
    void shouldAllowInfoEndpointWithoutAuth() {
      webTestClient.get().uri("/actuator/info").exchange().expectStatus().isOk();
    }
  }
}
