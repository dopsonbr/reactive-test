package org.example.product.controller;

import org.example.platform.test.SecurityTestUtils;
import org.example.platform.test.TestSecurityConfig;
import org.example.product.domain.Product;
import org.example.product.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@Import(TestSecurityConfig.class)
class ProductControllerSecurityTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private ProductService productService;

    @Test
    void shouldReturn401WhenNoToken() {
        webTestClient.get()
            .uri("/products/12345")
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    void shouldReturn401WhenTokenExpired() {
        String expiredToken = SecurityTestUtils.expiredToken();

        webTestClient.get()
            .uri("/products/12345")
            .header("Authorization", SecurityTestUtils.bearerAuth(expiredToken))
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    void shouldReturn403WhenMissingScope() {
        String tokenWithWrongScope = SecurityTestUtils.validToken("other:read");

        webTestClient.get()
            .uri("/products/12345")
            .header("Authorization", SecurityTestUtils.bearerAuth(tokenWithWrongScope))
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isForbidden();
    }

    @Test
    void shouldReturn200WithValidToken() {
        Product product = new Product(123456L, "Test Product", "19.99", 10);
        when(productService.getProduct(anyLong())).thenReturn(Mono.just(product));

        String validToken = SecurityTestUtils.validToken("product:read");

        webTestClient.get()
            .uri("/products/123456")
            .header("Authorization", SecurityTestUtils.bearerAuth(validToken))
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.sku").isEqualTo(123456);
    }

    @Test
    void shouldReturn200WithMultipleValidScopes() {
        Product product = new Product(123456L, "Test Product", "19.99", 10);
        when(productService.getProduct(anyLong())).thenReturn(Mono.just(product));

        String validToken = SecurityTestUtils.validToken("product:read", "product:write");

        webTestClient.get()
            .uri("/products/123456")
            .header("Authorization", SecurityTestUtils.bearerAuth(validToken))
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    void shouldAllowHealthEndpointWithoutAuth() {
        // Health endpoint should be accessible without auth
        // Status may be 200 (UP) or 503 (DOWN) depending on dependencies like Redis
        webTestClient.get()
            .uri("/actuator/health")
            .exchange()
            .expectStatus().value(status ->
                org.assertj.core.api.Assertions.assertThat(status)
                    .isIn(200, 503));
    }

    @Test
    void shouldAllowPrometheusEndpointWithoutAuth() {
        // Prometheus endpoint should be accessible without auth
        // Status may be 200 or 500 depending on metrics registry initialization
        // Key is it should NOT be 401/403 (blocked by security)
        webTestClient.get()
            .uri("/actuator/prometheus")
            .exchange()
            .expectStatus().value(status ->
                org.assertj.core.api.Assertions.assertThat(status)
                    .isNotIn(401, 403));
    }

    @Test
    void shouldAllowInfoEndpointWithoutAuth() {
        webTestClient.get()
            .uri("/actuator/info")
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    void shouldReturn401ForOtherActuatorEndpointsWithoutAuth() {
        webTestClient.get()
            .uri("/actuator/metrics")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    void shouldReturn403WhenNoScopes() {
        String noScopesToken = SecurityTestUtils.noScopesToken();

        webTestClient.get()
            .uri("/products/12345")
            .header("Authorization", SecurityTestUtils.bearerAuth(noScopesToken))
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isForbidden();
    }
}
