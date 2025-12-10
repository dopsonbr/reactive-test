package org.example.product.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.example.platform.error.ErrorResponse;
import org.example.platform.test.SecurityTestUtils;
import org.example.platform.test.TestSecurityConfig;
import org.example.product.domain.SearchProduct;
import org.example.product.domain.SearchResponse;
import org.example.product.service.ProductSearchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@Import(TestSecurityConfig.class)
class ProductSearchControllerValidationTest {

  @Autowired private WebTestClient webTestClient;

  @MockitoBean private ProductSearchService productSearchService;

  private static final String VALID_ORDER_NUMBER = "550e8400-e29b-41d4-a716-446655440000";
  private static final String VALID_SESSION_ID = "660e8400-e29b-41d4-a716-446655440000";
  private static final String VALID_USER_ID = "abc123";
  private static final String VALID_TOKEN = SecurityTestUtils.validToken("product:read");

  @BeforeEach
  void setUp() {
    // Setup default mock responses
    SearchProduct product =
        new SearchProduct(
            123456L,
            "Laptop Computer",
            "High performance laptop for work and gaming",
            new BigDecimal("999.99"),
            new BigDecimal("1199.99"),
            50,
            "https://cdn.example.com/products/laptop.jpg",
            "Electronics",
            0.95);
    SearchResponse<SearchProduct> response =
        new SearchResponse<>(List.of(product), 1L, 1, 0, 20, "laptop", 45L);
    when(productSearchService.search(any())).thenReturn(Mono.just(response));
    when(productSearchService.getSuggestions(anyString(), anyInt()))
        .thenReturn(Mono.just(List.of("laptop", "laptop bag", "laptop stand")));
  }

  @Test
  void shouldReturnSearchResults() {
    webTestClient
        .get()
        .uri("/products/search?q=laptop")
        .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.total")
        .isEqualTo(1)
        .jsonPath("$.products[0].sku")
        .isEqualTo(123456)
        .jsonPath("$.products[0].name")
        .isEqualTo("Laptop Computer")
        .jsonPath("$.products[0].description")
        .isEqualTo("High performance laptop for work and gaming");
  }

  @Test
  void shouldReturnSuggestions() {
    webTestClient
        .get()
        .uri("/products/search/suggestions?prefix=lap")
        .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$[0]")
        .isEqualTo("laptop")
        .jsonPath("$[1]")
        .isEqualTo("laptop bag");
  }

  @Test
  void shouldAllowMissingQueryForBrowsing() {
    // The 'q' parameter has defaultValue="" so missing query will be treated as empty string
    // Empty queries are allowed for browsing all products (validator accepts empty query)
    webTestClient
        .get()
        .uri("/products/search")
        .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isOk();
  }

  @Test
  void shouldReturn400ForQueryTooShort() {
    webTestClient
        .get()
        .uri("/products/search?q=a")
        .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isBadRequest()
        .expectBody(ErrorResponse.class)
        .value(
            response -> {
              assertThat(response.status()).isEqualTo(400);
              @SuppressWarnings("unchecked")
              List<Map<String, String>> errors =
                  (List<Map<String, String>>) response.details().get("validationErrors");
              assertThat(errors).hasSize(1);
              assertThat(errors.get(0).get("field")).isEqualTo("q");
            });
  }

  @Test
  void shouldReturn400ForInvalidPriceRange() {
    webTestClient
        .get()
        .uri("/products/search?q=laptop&minPrice=500&maxPrice=100")
        .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isBadRequest()
        .expectBody(ErrorResponse.class)
        .value(
            response -> {
              assertThat(response.status()).isEqualTo(400);
              @SuppressWarnings("unchecked")
              List<Map<String, String>> errors =
                  (List<Map<String, String>>) response.details().get("validationErrors");
              assertThat(errors).hasSize(1);
              assertThat(errors.get(0).get("field")).isEqualTo("minPrice");
            });
  }

  @ParameterizedTest
  @ValueSource(strings = {"invalid", "1234", "123456", "12345-123"})
  void shouldReturn400ForInvalidZipCode(String zipCode) {
    webTestClient
        .get()
        .uri("/products/search?q=laptop&customerZipCode=" + zipCode)
        .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isBadRequest()
        .expectBody(ErrorResponse.class)
        .value(
            response -> {
              assertThat(response.status()).isEqualTo(400);
              @SuppressWarnings("unchecked")
              List<Map<String, String>> errors =
                  (List<Map<String, String>>) response.details().get("validationErrors");
              assertThat(errors).hasSize(1);
              assertThat(errors.get(0).get("field")).isEqualTo("customerZipCode");
            });
  }

  @Test
  void shouldReturn400ForInvalidSellingLocation() {
    webTestClient
        .get()
        .uri("/products/search?q=laptop&sellingLocation=INVALID_LOCATION")
        .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isBadRequest()
        .expectBody(ErrorResponse.class)
        .value(
            response -> {
              assertThat(response.status()).isEqualTo(400);
              @SuppressWarnings("unchecked")
              List<Map<String, String>> errors =
                  (List<Map<String, String>>) response.details().get("validationErrors");
              assertThat(errors).hasSize(1);
              assertThat(errors.get(0).get("field")).isEqualTo("sellingLocation");
            });
  }

  @Test
  void shouldReturn400ForInvalidSortField() {
    webTestClient
        .get()
        .uri("/products/search?q=laptop&sortBy=invalid_field")
        .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isBadRequest()
        .expectBody(ErrorResponse.class)
        .value(
            response -> {
              assertThat(response.status()).isEqualTo(400);
              @SuppressWarnings("unchecked")
              List<Map<String, String>> errors =
                  (List<Map<String, String>>) response.details().get("validationErrors");
              assertThat(errors).hasSize(1);
              assertThat(errors.get(0).get("field")).isEqualTo("sortBy");
            });
  }

  @Test
  void shouldAcceptValidLocationParameters() {
    webTestClient
        .get()
        .uri("/products/search?q=laptop&customerZipCode=12345&sellingLocation=ONLINE")
        .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isOk();
  }

  @Test
  void shouldAcceptAllSearchParameters() {
    webTestClient
        .get()
        .uri(
            "/products/search?q=laptop&minPrice=100&maxPrice=1000&minAvailability=5"
                + "&inStockOnly=true&category=Electronics&customerZipCode=12345-6789"
                + "&sellingLocation=1234&sortBy=price&sortDirection=ASC&page=0&size=10")
        .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isOk();
  }

  @Test
  void shouldReturn401WithoutToken() {
    webTestClient
        .get()
        .uri("/products/search?q=laptop")
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isUnauthorized();
  }

  @Test
  void shouldReturn403WithoutCorrectScope() {
    String tokenWithoutScope = SecurityTestUtils.validToken("other:scope");
    webTestClient
        .get()
        .uri("/products/search?q=laptop")
        .header("Authorization", SecurityTestUtils.bearerAuth(tokenWithoutScope))
        .header("x-store-number", "100")
        .header("x-order-number", VALID_ORDER_NUMBER)
        .header("x-userid", VALID_USER_ID)
        .header("x-sessionid", VALID_SESSION_ID)
        .accept(MediaType.APPLICATION_JSON)
        .exchange()
        .expectStatus()
        .isForbidden();
  }
}
