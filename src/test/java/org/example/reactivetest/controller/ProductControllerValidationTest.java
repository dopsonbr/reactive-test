package org.example.reactivetest.controller;

import org.example.reactivetest.error.ErrorResponse;
import org.example.reactivetest.service.ProductService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureWebTestClient
class ProductControllerValidationTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private ProductService productService;

    private static final String VALID_ORDER_NUMBER = "550e8400-e29b-41d4-a716-446655440000";
    private static final String VALID_SESSION_ID = "660e8400-e29b-41d4-a716-446655440000";
    private static final String VALID_USER_ID = "abc123";

    @Test
    void invalidSku_tooSmall_returns400() {
        webTestClient.get()
            .uri("/products/99999")
            .header("x-store-number", "100")
            .header("x-order-number", VALID_ORDER_NUMBER)
            .header("x-userid", VALID_USER_ID)
            .header("x-sessionid", VALID_SESSION_ID)
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isBadRequest()
            .expectBody(ErrorResponse.class)
            .value(response -> {
                assertThat(response.status()).isEqualTo(400);
                assertThat(response.error()).isEqualTo("Bad Request");
                assertThat(response.message()).isEqualTo("Request validation failed");
                assertThat(response.details()).containsKey("validationErrors");
                @SuppressWarnings("unchecked")
                List<Map<String, String>> errors = (List<Map<String, String>>) response.details().get("validationErrors");
                assertThat(errors).hasSize(1);
                assertThat(errors.get(0).get("field")).isEqualTo("sku");
            });
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "2001", "-1"})
    void invalidStoreNumber_returns400(String storeNumber) {
        webTestClient.get()
            .uri("/products/123456")
            .header("x-store-number", storeNumber)
            .header("x-order-number", VALID_ORDER_NUMBER)
            .header("x-userid", VALID_USER_ID)
            .header("x-sessionid", VALID_SESSION_ID)
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isBadRequest()
            .expectBody(ErrorResponse.class)
            .value(response -> {
                assertThat(response.status()).isEqualTo(400);
                @SuppressWarnings("unchecked")
                List<Map<String, String>> errors = (List<Map<String, String>>) response.details().get("validationErrors");
                assertThat(errors).hasSize(1);
                assertThat(errors.get(0).get("field")).isEqualTo("x-store-number");
            });
    }

    @Test
    void invalidOrderNumber_returns400() {
        webTestClient.get()
            .uri("/products/123456")
            .header("x-store-number", "100")
            .header("x-order-number", "not-a-uuid")
            .header("x-userid", VALID_USER_ID)
            .header("x-sessionid", VALID_SESSION_ID)
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isBadRequest()
            .expectBody(ErrorResponse.class)
            .value(response -> {
                assertThat(response.status()).isEqualTo(400);
                @SuppressWarnings("unchecked")
                List<Map<String, String>> errors = (List<Map<String, String>>) response.details().get("validationErrors");
                assertThat(errors).hasSize(1);
                assertThat(errors.get(0).get("field")).isEqualTo("x-order-number");
            });
    }

    @ParameterizedTest
    @ValueSource(strings = {"abc12", "abc1234", "abc12!"})
    void invalidUserId_returns400(String userId) {
        webTestClient.get()
            .uri("/products/123456")
            .header("x-store-number", "100")
            .header("x-order-number", VALID_ORDER_NUMBER)
            .header("x-userid", userId)
            .header("x-sessionid", VALID_SESSION_ID)
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isBadRequest()
            .expectBody(ErrorResponse.class)
            .value(response -> {
                assertThat(response.status()).isEqualTo(400);
                @SuppressWarnings("unchecked")
                List<Map<String, String>> errors = (List<Map<String, String>>) response.details().get("validationErrors");
                assertThat(errors).hasSize(1);
                assertThat(errors.get(0).get("field")).isEqualTo("x-userid");
            });
    }

    @Test
    void invalidSessionId_returns400() {
        webTestClient.get()
            .uri("/products/123456")
            .header("x-store-number", "100")
            .header("x-order-number", VALID_ORDER_NUMBER)
            .header("x-userid", VALID_USER_ID)
            .header("x-sessionid", "not-a-uuid")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isBadRequest()
            .expectBody(ErrorResponse.class)
            .value(response -> {
                assertThat(response.status()).isEqualTo(400);
                @SuppressWarnings("unchecked")
                List<Map<String, String>> errors = (List<Map<String, String>>) response.details().get("validationErrors");
                assertThat(errors).hasSize(1);
                assertThat(errors.get(0).get("field")).isEqualTo("x-sessionid");
            });
    }

    @Test
    void multipleInvalidFields_returnsAllErrors() {
        webTestClient.get()
            .uri("/products/99999")
            .header("x-store-number", "0")
            .header("x-order-number", "invalid")
            .header("x-userid", "bad")
            .header("x-sessionid", "invalid")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isBadRequest()
            .expectBody(ErrorResponse.class)
            .value(response -> {
                assertThat(response.status()).isEqualTo(400);
                @SuppressWarnings("unchecked")
                List<Map<String, String>> errors = (List<Map<String, String>>) response.details().get("validationErrors");
                assertThat(errors).hasSize(5);
                List<String> fields = errors.stream().map(e -> e.get("field")).toList();
                assertThat(fields).containsExactlyInAnyOrder(
                    "sku", "x-store-number", "x-order-number", "x-userid", "x-sessionid");
            });
    }

    @Test
    void validBoundaryValues_passesValidation() {
        // This test verifies validation passes - the productService is mocked
        // so we just verify no 400 error is returned
        webTestClient.get()
            .uri("/products/100000")
            .header("x-store-number", "1")
            .header("x-order-number", VALID_ORDER_NUMBER)
            .header("x-userid", VALID_USER_ID)
            .header("x-sessionid", VALID_SESSION_ID)
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().value(status -> assertThat(status).isNotEqualTo(400));
    }
}
