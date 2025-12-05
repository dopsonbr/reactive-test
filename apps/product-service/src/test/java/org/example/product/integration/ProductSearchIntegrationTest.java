package org.example.product.integration;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.containing;
import static com.github.tomakehurst.wiremock.client.WireMock.matchingJsonPath;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathMatching;
import static org.assertj.core.api.Assertions.assertThat;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.example.platform.test.RedisTestSupport;
import org.example.platform.test.SecurityTestUtils;
import org.example.platform.test.TestSecurityConfig;
import org.example.platform.test.WireMockSupport;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@Testcontainers
@Import(TestSecurityConfig.class)
class ProductSearchIntegrationTest {

    @Container static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

    private static final WireMockServer wireMockServer = WireMockSupport.createServer();

    @Autowired private WebTestClient webTestClient;

    @Autowired private ReactiveRedisTemplate<String, Object> redisTemplate;

    private static final String VALID_ORDER_NUMBER = "550e8400-e29b-41d4-a716-446655440000";
    private static final String VALID_SESSION_ID = "660e8400-e29b-41d4-a716-446655440000";
    private static final String VALID_USER_ID = "abc123";
    private static final String VALID_TOKEN = SecurityTestUtils.validToken("product:read");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> RedisTestSupport.getRedisPort(redis));

        // Use shorter TTLs for testing
        registry.add("cache.search.search-ttl", () -> "10s");
        registry.add("cache.search.suggestions-ttl", () -> "10s");

        // Configure services to use WireMock
        String baseUrl = "http://localhost:" + wireMockServer.port();
        registry.add("services.catalog.base-url", () -> baseUrl);
        registry.add("services.merchandise.base-url", () -> baseUrl);
        registry.add("services.price.base-url", () -> baseUrl);
        registry.add("services.inventory.base-url", () -> baseUrl);

        // Disable resilience4j features for cleaner testing
        registry.add(
                "resilience4j.circuitbreaker.configs.default.minimum-number-of-calls", () -> "100");
        registry.add("resilience4j.retry.configs.default.max-attempts", () -> "1");
        registry.add("resilience4j.timelimiter.configs.default.timeout-duration", () -> "5s");
    }

    @BeforeAll
    static void startWireMock() {
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
        setupCatalogMocks();
    }

    @AfterEach
    void clearCache() {
        redisTemplate.execute(connection -> connection.serverCommands().flushAll()).blockFirst();
    }

    @Test
    void shouldSearchProductsSuccessfully() {
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
                .jsonPath("$.totalItems")
                .isEqualTo(3)
                .jsonPath("$.query")
                .isEqualTo("laptop")
                .jsonPath("$.items[0].sku")
                .isEqualTo(123456)
                .jsonPath("$.items[0].description")
                .isEqualTo("Laptop Computer");
    }

    @Test
    void shouldReturnEmptyResultsForNoMatches() {
        webTestClient
                .get()
                .uri("/products/search?q=nonexistent")
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
                .jsonPath("$.totalItems")
                .isEqualTo(0)
                .jsonPath("$.items")
                .isEmpty();
    }

    @Test
    void shouldPassPriceRangeToCatalogService() {
        webTestClient
                .get()
                .uri("/products/search?q=laptop&minPrice=50&maxPrice=100")
                .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
                .header("x-store-number", "100")
                .header("x-order-number", VALID_ORDER_NUMBER)
                .header("x-userid", VALID_USER_ID)
                .header("x-sessionid", VALID_SESSION_ID)
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus()
                .isOk();

        wireMockServer.verify(
                postRequestedFor(urlPathEqualTo("/catalog/search"))
                        .withRequestBody(matchingJsonPath("$.minPrice", containing("50")))
                        .withRequestBody(matchingJsonPath("$.maxPrice", containing("100"))));
    }

    @Test
    void shouldPassLocationParametersToCatalogService() {
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

        wireMockServer.verify(
                postRequestedFor(urlPathEqualTo("/catalog/search"))
                        .withRequestBody(matchingJsonPath("$.customerZipCode", containing("12345")))
                        .withRequestBody(matchingJsonPath("$.sellingLocation", containing("ONLINE"))));
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
                .isEqualTo("laptop bag")
                .jsonPath("$.length()")
                .isEqualTo(4);
    }

    @Test
    void shouldCacheSearchResults() {
        // First call - should hit catalog service
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
                .isOk();

        // Second call - should use cached result
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
                .isOk();

        // Verify catalog service was only called once
        wireMockServer.verify(1, postRequestedFor(urlPathEqualTo("/catalog/search")));
    }

    @Test
    void shouldHandlePaginationParameters() {
        webTestClient
                .get()
                .uri("/products/search?q=laptop&page=2&size=10")
                .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
                .header("x-store-number", "100")
                .header("x-order-number", VALID_ORDER_NUMBER)
                .header("x-userid", VALID_USER_ID)
                .header("x-sessionid", VALID_SESSION_ID)
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus()
                .isOk();

        wireMockServer.verify(
                postRequestedFor(urlPathEqualTo("/catalog/search"))
                        .withRequestBody(matchingJsonPath("$.page", containing("2")))
                        .withRequestBody(matchingJsonPath("$.size", containing("10"))));
    }

    @Test
    void shouldHandleSortParameters() {
        webTestClient
                .get()
                .uri("/products/search?q=laptop&sortBy=price&sortDirection=ASC")
                .header("Authorization", SecurityTestUtils.bearerAuth(VALID_TOKEN))
                .header("x-store-number", "100")
                .header("x-order-number", VALID_ORDER_NUMBER)
                .header("x-userid", VALID_USER_ID)
                .header("x-sessionid", VALID_SESSION_ID)
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus()
                .isOk();

        wireMockServer.verify(
                postRequestedFor(urlPathEqualTo("/catalog/search"))
                        .withRequestBody(matchingJsonPath("$.sortBy", containing("price")))
                        .withRequestBody(matchingJsonPath("$.sortDirection", containing("ASC"))));
    }

    private void setupCatalogMocks() {
        // Default search response
        wireMockServer.stubFor(
                post(urlPathEqualTo("/catalog/search"))
                        .willReturn(
                                aResponse()
                                        .withStatus(200)
                                        .withHeader("Content-Type", "application/json")
                                        .withBody(
                                                """
                        {
                            "products": [
                                {"sku": 123456, "description": "Laptop Computer", "price": 999.99, "availableQuantity": 50, "category": "Electronics", "relevanceScore": 0.95},
                                {"sku": 234567, "description": "Laptop Bag", "price": 49.99, "availableQuantity": 200, "category": "Accessories", "relevanceScore": 0.85},
                                {"sku": 345678, "description": "Laptop Stand", "price": 79.99, "availableQuantity": 75, "category": "Accessories", "relevanceScore": 0.80}
                            ],
                            "totalCount": 3,
                            "totalPages": 1,
                            "page": 0,
                            "size": 20,
                            "query": "laptop",
                            "searchTimeMs": 45
                        }
                        """)));

        // No results response
        wireMockServer.stubFor(
                post(urlPathEqualTo("/catalog/search"))
                        .withRequestBody(matchingJsonPath("$.query", containing("nonexistent")))
                        .willReturn(
                                aResponse()
                                        .withStatus(200)
                                        .withHeader("Content-Type", "application/json")
                                        .withBody(
                                                """
                        {
                            "products": [],
                            "totalCount": 0,
                            "totalPages": 0,
                            "page": 0,
                            "size": 20,
                            "query": "nonexistent",
                            "searchTimeMs": 12
                        }
                        """)));

        // Suggestions response
        wireMockServer.stubFor(
                WireMock.get(urlPathMatching("/catalog/suggestions.*"))
                        .willReturn(
                                aResponse()
                                        .withStatus(200)
                                        .withHeader("Content-Type", "application/json")
                                        .withBody(
                                                """
                        {"suggestions": ["laptop", "laptop bag", "laptop stand", "laptop charger"]}
                        """)));
    }
}
