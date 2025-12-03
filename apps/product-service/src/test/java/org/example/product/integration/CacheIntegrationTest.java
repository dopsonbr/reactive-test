package org.example.product.integration;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.example.platform.cache.ReactiveCacheService;
import org.example.platform.test.RedisTestSupport;
import org.example.platform.test.WireMockSupport;
import org.example.product.repository.inventory.InventoryRepository;
import org.example.product.repository.inventory.InventoryResponse;
import org.example.product.repository.merchandise.MerchandiseRepository;
import org.example.product.repository.merchandise.MerchandiseResponse;
import org.example.product.repository.price.PriceRepository;
import org.example.product.repository.price.PriceResponse;
import org.example.platform.test.TestSecurityConfig;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.test.StepVerifier;

import java.time.Duration;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Redis caching behavior.
 *
 * Tests the two caching patterns:
 * 1. Cache-Aside (Merchandise & Price): Check cache first, call HTTP on miss
 * 2. Fallback-Only (Inventory): Always call HTTP first, use cache only on errors
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Testcontainers
@Import(TestSecurityConfig.class)
class CacheIntegrationTest {

    @Container
    static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

    // Initialize WireMock at class load time so port is available for @DynamicPropertySource
    private static final WireMockServer wireMockServer = WireMockSupport.createServer();

    @Autowired
    private MerchandiseRepository merchandiseRepository;

    @Autowired
    private PriceRepository priceRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ReactiveCacheService cacheService;

    @Autowired
    private ReactiveRedisTemplate<String, Object> redisTemplate;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> RedisTestSupport.getRedisPort(redis));

        // Use shorter TTLs for testing
        registry.add("cache.merchandise.ttl", () -> "10s");
        registry.add("cache.price.ttl", () -> "10s");
        registry.add("cache.inventory.ttl", () -> "10s");

        // Configure services to use WireMock (port set in @BeforeAll)
        registry.add("services.merchandise.base-url", () -> "http://localhost:" + wireMockServer.port());
        registry.add("services.price.base-url", () -> "http://localhost:" + wireMockServer.port());
        registry.add("services.inventory.base-url", () -> "http://localhost:" + wireMockServer.port());

        // Disable resilience4j features for cleaner testing
        registry.add("resilience4j.circuitbreaker.configs.default.minimum-number-of-calls", () -> "100");
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
    }

    @AfterEach
    void clearCache() {
        // Clear all keys from Redis after each test
        redisTemplate.execute(connection -> connection.serverCommands().flushAll())
            .blockFirst();
    }

    @Nested
    @DisplayName("Merchandise Repository - Cache-Aside Pattern")
    class MerchandiseCacheTests {

        private static final long SKU = 12345L;
        private static final String CACHE_KEY = "merchandise:sku:" + SKU;

        @Test
        @DisplayName("should return HTTP response and cache it on cache miss")
        void shouldCacheOnMiss() {
            // Given: HTTP returns a response
            stubMerchandiseSuccess(SKU, "Test Product Description");

            // When: First call (cache miss)
            StepVerifier.create(merchandiseRepository.getDescription(SKU))
                .assertNext(response -> {
                    assertThat(response.description()).isEqualTo("Test Product Description");
                })
                .verifyComplete();

            // Then: Value should be cached
            StepVerifier.create(cacheService.get(CACHE_KEY, MerchandiseResponse.class))
                .assertNext(cached -> {
                    assertThat(cached.description()).isEqualTo("Test Product Description");
                })
                .verifyComplete();

            // Verify HTTP was called
            wireMockServer.verify(1, WireMock.getRequestedFor(urlEqualTo("/merchandise/" + SKU)));
        }

        @Test
        @DisplayName("should return cached value without calling HTTP on cache hit")
        void shouldReturnCachedValue() {
            // Given: Value is pre-cached
            MerchandiseResponse cachedResponse = new MerchandiseResponse("Cached Description");
            cacheService.put(CACHE_KEY, cachedResponse, Duration.ofMinutes(5)).block();

            // When: Call repository
            StepVerifier.create(merchandiseRepository.getDescription(SKU))
                .assertNext(response -> {
                    assertThat(response.description()).isEqualTo("Cached Description");
                })
                .verifyComplete();

            // Then: HTTP should NOT be called
            wireMockServer.verify(0, WireMock.getRequestedFor(urlEqualTo("/merchandise/" + SKU)));
        }

        @Test
        @DisplayName("should return fallback on HTTP error after cache miss")
        void shouldReturnFallbackOnError() {
            // Given: HTTP returns 500 error
            stubMerchandiseError(SKU, 500);

            // When: Call repository (no cache)
            StepVerifier.create(merchandiseRepository.getDescription(SKU))
                .assertNext(response -> {
                    assertThat(response.description()).isEqualTo("Description unavailable");
                })
                .verifyComplete();
        }

        private void stubMerchandiseSuccess(long sku, String description) {
            wireMockServer.stubFor(get(urlEqualTo("/merchandise/" + sku))
                .willReturn(aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody("{\"description\":\"" + description + "\"}")));
        }

        private void stubMerchandiseError(long sku, int status) {
            wireMockServer.stubFor(get(urlEqualTo("/merchandise/" + sku))
                .willReturn(aResponse()
                    .withStatus(status)));
        }
    }

    @Nested
    @DisplayName("Price Repository - Cache-Aside Pattern")
    class PriceCacheTests {

        private static final long SKU = 67890L;
        private static final String CACHE_KEY = "price:sku:" + SKU;

        @Test
        @DisplayName("should return HTTP response and cache it on cache miss")
        void shouldCacheOnMiss() {
            // Given: HTTP returns a response
            stubPriceSuccess(SKU, "99.99");

            // When: First call (cache miss)
            StepVerifier.create(priceRepository.getPrice(SKU))
                .assertNext(response -> {
                    assertThat(response.price()).isEqualTo("99.99");
                })
                .verifyComplete();

            // Then: Value should be cached
            StepVerifier.create(cacheService.get(CACHE_KEY, PriceResponse.class))
                .assertNext(cached -> {
                    assertThat(cached.price()).isEqualTo("99.99");
                })
                .verifyComplete();

            // Verify HTTP was called
            wireMockServer.verify(1, WireMock.postRequestedFor(urlPathEqualTo("/price")));
        }

        @Test
        @DisplayName("should return cached value without calling HTTP on cache hit")
        void shouldReturnCachedValue() {
            // Given: Value is pre-cached
            PriceResponse cachedResponse = new PriceResponse("149.99");
            cacheService.put(CACHE_KEY, cachedResponse, Duration.ofMinutes(5)).block();

            // When: Call repository
            StepVerifier.create(priceRepository.getPrice(SKU))
                .assertNext(response -> {
                    assertThat(response.price()).isEqualTo("149.99");
                })
                .verifyComplete();

            // Then: HTTP should NOT be called
            wireMockServer.verify(0, WireMock.postRequestedFor(urlPathEqualTo("/price")));
        }

        @Test
        @DisplayName("should return fallback on HTTP error after cache miss")
        void shouldReturnFallbackOnError() {
            // Given: HTTP returns 500 error
            stubPriceError(500);

            // When: Call repository (no cache)
            StepVerifier.create(priceRepository.getPrice(SKU))
                .assertNext(response -> {
                    assertThat(response.price()).isEqualTo("0.00");
                })
                .verifyComplete();
        }

        private void stubPriceSuccess(long sku, String price) {
            wireMockServer.stubFor(post(urlPathEqualTo("/price"))
                .willReturn(aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody("{\"price\":\"" + price + "\"}")));
        }

        private void stubPriceError(int status) {
            wireMockServer.stubFor(post(urlPathEqualTo("/price"))
                .willReturn(aResponse()
                    .withStatus(status)));
        }
    }

    @Nested
    @DisplayName("Inventory Repository - Fallback-Only Pattern")
    class InventoryCacheTests {

        private static final long SKU = 11111L;
        private static final String CACHE_KEY = "inventory:sku:" + SKU;

        @Test
        @DisplayName("should always call HTTP first even when cache has data")
        void shouldAlwaysCallHttpFirst() {
            // Given: Value is pre-cached AND HTTP is configured
            InventoryResponse cachedResponse = new InventoryResponse(10);
            cacheService.put(CACHE_KEY, cachedResponse, Duration.ofMinutes(5)).block();
            stubInventorySuccess(SKU, 50);

            // When: Call repository
            StepVerifier.create(inventoryRepository.getAvailability(SKU))
                .assertNext(response -> {
                    // Should return HTTP response, not cached value
                    assertThat(response.availableQuantity()).isEqualTo(50);
                })
                .verifyComplete();

            // Then: HTTP WAS called (fallback-only pattern)
            wireMockServer.verify(1, WireMock.postRequestedFor(urlPathEqualTo("/inventory")));
        }

        @Test
        @DisplayName("should update cache on successful HTTP response")
        void shouldUpdateCacheOnSuccess() {
            // Given: HTTP returns a response
            stubInventorySuccess(SKU, 100);

            // When: Call repository
            StepVerifier.create(inventoryRepository.getAvailability(SKU))
                .assertNext(response -> {
                    assertThat(response.availableQuantity()).isEqualTo(100);
                })
                .verifyComplete();

            // Then: Cache should be updated with fresh value
            StepVerifier.create(cacheService.get(CACHE_KEY, InventoryResponse.class))
                .assertNext(cached -> {
                    assertThat(cached.availableQuantity()).isEqualTo(100);
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("should return cached value on HTTP error when cache has data")
        void shouldReturnCachedValueOnHttpError() {
            // Given: Value is pre-cached
            InventoryResponse cachedResponse = new InventoryResponse(25);
            cacheService.put(CACHE_KEY, cachedResponse, Duration.ofMinutes(5)).block();

            // And: HTTP returns error
            stubInventoryError(500);

            // When: Call repository
            StepVerifier.create(inventoryRepository.getAvailability(SKU))
                .assertNext(response -> {
                    // Should return cached value as fallback
                    assertThat(response.availableQuantity()).isEqualTo(25);
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("should return -1 (backordered) on HTTP error with no cache")
        void shouldReturnBackorderedOnErrorWithNoCache() {
            // Given: No cached value AND HTTP returns error
            stubInventoryError(500);

            // When: Call repository
            StepVerifier.create(inventoryRepository.getAvailability(SKU))
                .assertNext(response -> {
                    // Should return -1 for backordered
                    assertThat(response.availableQuantity()).isEqualTo(-1);
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("should return -1 (backordered) on timeout with no cache")
        void shouldReturnBackorderedOnTimeoutWithNoCache() {
            // Given: HTTP times out (delay longer than timeout)
            stubInventoryTimeout(10000);

            // When: Call repository
            StepVerifier.create(inventoryRepository.getAvailability(SKU))
                .assertNext(response -> {
                    assertThat(response.availableQuantity()).isEqualTo(-1);
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("should return cached value on 503 error")
        void shouldReturnCachedValueOn503Error() {
            // Given: Value is pre-cached
            InventoryResponse cachedResponse = new InventoryResponse(75);
            cacheService.put(CACHE_KEY, cachedResponse, Duration.ofMinutes(5)).block();

            // And: HTTP returns 503
            stubInventoryError(503);

            // When: Call repository
            StepVerifier.create(inventoryRepository.getAvailability(SKU))
                .assertNext(response -> {
                    // Should return cached value as fallback
                    assertThat(response.availableQuantity()).isEqualTo(75);
                })
                .verifyComplete();
        }

        private void stubInventorySuccess(long sku, int quantity) {
            wireMockServer.stubFor(post(urlPathEqualTo("/inventory"))
                .willReturn(aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody("{\"availableQuantity\":" + quantity + "}")));
        }

        private void stubInventoryError(int status) {
            wireMockServer.stubFor(post(urlPathEqualTo("/inventory"))
                .willReturn(aResponse()
                    .withStatus(status)));
        }

        private void stubInventoryTimeout(int delayMs) {
            wireMockServer.stubFor(post(urlPathEqualTo("/inventory"))
                .willReturn(aResponse()
                    .withStatus(200)
                    .withFixedDelay(delayMs)));
        }
    }

    @Nested
    @DisplayName("RedisCacheService Integration")
    class RedisCacheServiceTests {

        @Test
        @DisplayName("should store and retrieve values with correct serialization")
        void shouldStoreAndRetrieveValues() {
            // Given
            String key = "test:integration:key";
            MerchandiseResponse value = new MerchandiseResponse("Integration Test Value");

            // When: Put value
            StepVerifier.create(cacheService.put(key, value, Duration.ofMinutes(1)))
                .expectNext(true)
                .verifyComplete();

            // Then: Get value
            StepVerifier.create(cacheService.get(key, MerchandiseResponse.class))
                .assertNext(retrieved -> {
                    assertThat(retrieved.description()).isEqualTo("Integration Test Value");
                })
                .verifyComplete();
        }

        @Test
        @DisplayName("should return empty on cache miss")
        void shouldReturnEmptyOnMiss() {
            // When/Then
            StepVerifier.create(cacheService.get("nonexistent:key", MerchandiseResponse.class))
                .verifyComplete();
        }

        @Test
        @DisplayName("should delete keys successfully")
        void shouldDeleteKeys() {
            // Given: Key exists
            String key = "test:delete:key";
            cacheService.put(key, new MerchandiseResponse("To Delete"), Duration.ofMinutes(1)).block();

            // When: Delete key
            StepVerifier.create(cacheService.delete(key))
                .expectNext(true)
                .verifyComplete();

            // Then: Key no longer exists
            StepVerifier.create(cacheService.get(key, MerchandiseResponse.class))
                .verifyComplete();
        }

        @Test
        @DisplayName("should handle complex record types")
        void shouldHandleComplexTypes() {
            // Given
            String key = "test:inventory:key";
            InventoryResponse value = new InventoryResponse(42);

            // When
            StepVerifier.create(cacheService.put(key, value, Duration.ofMinutes(1)))
                .expectNext(true)
                .verifyComplete();

            // Then
            StepVerifier.create(cacheService.get(key, InventoryResponse.class))
                .assertNext(retrieved -> {
                    assertThat(retrieved.availableQuantity()).isEqualTo(42);
                })
                .verifyComplete();
        }
    }
}
