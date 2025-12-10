package org.example.cart.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.example.cart.AbstractIntegrationTest;
import org.example.cart.domain.Cart;
import org.example.cart.domain.CartTotals;
import org.example.cart.dto.CreateCartRequest;
import org.example.cart.service.CartService;
import org.example.cart.validation.CartRequestValidator;
import org.example.platform.test.SecurityTestUtils;
import org.example.platform.test.TestSecurityConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Security tests for CartController. Verifies OAuth2 authentication and authorization. */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {"app.security.enabled=true"})
@AutoConfigureWebTestClient
@Import(TestSecurityConfig.class)
class CartControllerSecurityTest extends AbstractIntegrationTest {

  private static final String VALID_CART_ID = "550e8400-e29b-41d4-a716-446655440000";
  private static final String ORDER_NUMBER = "660e8400-e29b-41d4-a716-446655440000";
  private static final String SESSION_ID = "770e8400-e29b-41d4-a716-446655440000";
  private static final String USER_ID = "user01";
  private static final int STORE_NUMBER = 100;

  @Autowired private WebTestClient webTestClient;

  @MockitoBean private CartService cartService;
  @MockitoBean private CartRequestValidator validator;

  private Cart testCart;

  @BeforeEach
  void setUp() {
    testCart =
        new Cart(
            VALID_CART_ID,
            STORE_NUMBER,
            "customer123",
            null,
            List.of(),
            List.of(),
            List.of(),
            new CartTotals(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO),
            Instant.now(),
            Instant.now());

    // Default validator behavior - pass validation
    when(validator.validateCreateCart(any(), anyInt(), anyString(), anyString(), anyString()))
        .thenReturn(Mono.empty());
    when(validator.validateGetCart(anyString(), anyInt(), anyString(), anyString(), anyString()))
        .thenReturn(Mono.empty());
    when(validator.validateFindCarts(anyInt(), anyInt(), anyString(), anyString(), anyString()))
        .thenReturn(Mono.empty());
  }

  // ==================== Authentication Tests ====================

  @Test
  void shouldReturn401WhenNoToken() {
    webTestClient
        .get()
        .uri("/carts/" + VALID_CART_ID)
        .header("x-store-number", String.valueOf(STORE_NUMBER))
        .header("x-order-number", ORDER_NUMBER)
        .header("x-userid", USER_ID)
        .header("x-sessionid", SESSION_ID)
        .exchange()
        .expectStatus()
        .isUnauthorized();
  }

  @Test
  void shouldReturn401WhenTokenExpired() {
    String expiredToken = SecurityTestUtils.expiredToken();

    webTestClient
        .get()
        .uri("/carts/" + VALID_CART_ID)
        .header("Authorization", SecurityTestUtils.bearerAuth(expiredToken))
        .header("x-store-number", String.valueOf(STORE_NUMBER))
        .header("x-order-number", ORDER_NUMBER)
        .header("x-userid", USER_ID)
        .header("x-sessionid", SESSION_ID)
        .exchange()
        .expectStatus()
        .isUnauthorized();
  }

  // ==================== Authorization Tests (Read Operations) ====================

  @Test
  void shouldReturn403WhenMissingScopeForRead() {
    String tokenWithWrongScope = SecurityTestUtils.validToken("other:read");

    webTestClient
        .get()
        .uri("/carts/" + VALID_CART_ID)
        .header("Authorization", SecurityTestUtils.bearerAuth(tokenWithWrongScope))
        .header("x-store-number", String.valueOf(STORE_NUMBER))
        .header("x-order-number", ORDER_NUMBER)
        .header("x-userid", USER_ID)
        .header("x-sessionid", SESSION_ID)
        .exchange()
        .expectStatus()
        .isForbidden();
  }

  @Test
  void shouldReturn200WithValidTokenForRead() {
    when(cartService.getCart(VALID_CART_ID)).thenReturn(Mono.just(testCart));

    String validToken = SecurityTestUtils.validToken("cart:read");

    webTestClient
        .get()
        .uri("/carts/" + VALID_CART_ID)
        .header("Authorization", SecurityTestUtils.bearerAuth(validToken))
        .header("x-store-number", String.valueOf(STORE_NUMBER))
        .header("x-order-number", ORDER_NUMBER)
        .header("x-userid", USER_ID)
        .header("x-sessionid", SESSION_ID)
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.id")
        .isEqualTo(VALID_CART_ID);
  }

  @Test
  void shouldReturn200WithMultipleValidScopes() {
    when(cartService.getCart(VALID_CART_ID)).thenReturn(Mono.just(testCart));

    String validToken = SecurityTestUtils.validToken("cart:read", "cart:write");

    webTestClient
        .get()
        .uri("/carts/" + VALID_CART_ID)
        .header("Authorization", SecurityTestUtils.bearerAuth(validToken))
        .header("x-store-number", String.valueOf(STORE_NUMBER))
        .header("x-order-number", ORDER_NUMBER)
        .header("x-userid", USER_ID)
        .header("x-sessionid", SESSION_ID)
        .exchange()
        .expectStatus()
        .isOk();
  }

  @Test
  void shouldReturn403WhenNoScopes() {
    String noScopesToken = SecurityTestUtils.noScopesToken();

    webTestClient
        .get()
        .uri("/carts/" + VALID_CART_ID)
        .header("Authorization", SecurityTestUtils.bearerAuth(noScopesToken))
        .header("x-store-number", String.valueOf(STORE_NUMBER))
        .header("x-order-number", ORDER_NUMBER)
        .header("x-userid", USER_ID)
        .header("x-sessionid", SESSION_ID)
        .exchange()
        .expectStatus()
        .isForbidden();
  }

  // ==================== Authorization Tests (Write Operations) ====================

  @Test
  void shouldReturn403WhenMissingScopeForWrite() {
    String tokenWithReadOnly = SecurityTestUtils.validToken("cart:read");

    webTestClient
        .post()
        .uri("/carts")
        .header("Authorization", SecurityTestUtils.bearerAuth(tokenWithReadOnly))
        .header("x-store-number", String.valueOf(STORE_NUMBER))
        .header("x-order-number", ORDER_NUMBER)
        .header("x-userid", USER_ID)
        .header("x-sessionid", SESSION_ID)
        .bodyValue(new CreateCartRequest(STORE_NUMBER, null))
        .exchange()
        .expectStatus()
        .isForbidden();
  }

  @Test
  void shouldReturn201WithValidTokenForWrite() {
    when(cartService.createCart(anyInt(), any())).thenReturn(Mono.just(testCart));

    String validToken = SecurityTestUtils.validToken("cart:write");

    webTestClient
        .post()
        .uri("/carts")
        .header("Authorization", SecurityTestUtils.bearerAuth(validToken))
        .header("x-store-number", String.valueOf(STORE_NUMBER))
        .header("x-order-number", ORDER_NUMBER)
        .header("x-userid", USER_ID)
        .header("x-sessionid", SESSION_ID)
        .bodyValue(new CreateCartRequest(STORE_NUMBER, null))
        .exchange()
        .expectStatus()
        .isCreated();
  }

  @Test
  void shouldReturn403ForDeleteWithReadScope() {
    String tokenWithReadOnly = SecurityTestUtils.validToken("cart:read");

    webTestClient
        .delete()
        .uri("/carts/" + VALID_CART_ID)
        .header("Authorization", SecurityTestUtils.bearerAuth(tokenWithReadOnly))
        .header("x-store-number", String.valueOf(STORE_NUMBER))
        .header("x-order-number", ORDER_NUMBER)
        .header("x-userid", USER_ID)
        .header("x-sessionid", SESSION_ID)
        .exchange()
        .expectStatus()
        .isForbidden();
  }

  // ==================== Find Carts Tests ====================

  @Test
  void shouldReturn200ForFindCartsByStoreWithReadScope() {
    when(cartService.findByStoreNumber(STORE_NUMBER)).thenReturn(Flux.just(testCart));

    String validToken = SecurityTestUtils.validToken("cart:read");

    webTestClient
        .get()
        .uri(
            uriBuilder -> uriBuilder.path("/carts").queryParam("storeNumber", STORE_NUMBER).build())
        .header("Authorization", SecurityTestUtils.bearerAuth(validToken))
        .header("x-store-number", String.valueOf(STORE_NUMBER))
        .header("x-order-number", ORDER_NUMBER)
        .header("x-userid", USER_ID)
        .header("x-sessionid", SESSION_ID)
        .exchange()
        .expectStatus()
        .isOk();
  }

  // ==================== Actuator Endpoint Tests ====================

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
