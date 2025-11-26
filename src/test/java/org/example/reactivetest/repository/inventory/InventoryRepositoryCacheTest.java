package org.example.reactivetest.repository.inventory;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import org.example.reactivetest.cache.ReactiveCacheService;
import org.example.reactivetest.config.CacheProperties;
import org.example.reactivetest.logging.StructuredLogger;
import org.example.reactivetest.resilience.ReactiveResilience;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryRepositoryCacheTest {

    @Mock
    private WebClient webClient;

    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private WebClient.RequestBodySpec requestBodySpec;

    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    @Mock
    private ReactiveResilience resilience;

    @Mock
    private StructuredLogger structuredLogger;

    @Mock
    private ReactiveCacheService cacheService;

    @Mock
    private CacheProperties cacheProperties;

    @Mock
    private CacheProperties.ServiceCache serviceCache;

    private InventoryRepository repository;

    @BeforeEach
    void setUp() {
        lenient().when(cacheProperties.getInventory()).thenReturn(serviceCache);
        lenient().when(serviceCache.getTtl()).thenReturn(Duration.ofSeconds(30));

        repository = new InventoryRepository(
            webClient,
            resilience,
            structuredLogger,
            cacheService,
            cacheProperties
        );
    }

    @Test
    @SuppressWarnings("unchecked")
    void getAvailability_shouldAlwaysCallHttpFirst_evenWithCachedData() {
        // Given
        long sku = 12345L;
        String cacheKey = "inventory:sku:" + sku;
        InventoryResponse httpResponse = new InventoryResponse(50);

        // HTTP call setup - this should ALWAYS be called (fallback-only pattern)
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any(InventoryRequest.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(InventoryResponse.class)).thenReturn(Mono.just(httpResponse));

        // Resilience decoration returns the same mono
        when(resilience.decorate(eq("inventory"), any(Mono.class)))
            .thenAnswer(invocation -> invocation.getArgument(1));

        // Cache put succeeds
        when(cacheService.put(eq(cacheKey), eq(httpResponse), any(Duration.class)))
            .thenReturn(Mono.just(true));

        // When & Then
        StepVerifier.create(repository.getAvailability(sku))
            .expectNext(httpResponse)
            .verifyComplete();

        // Verify HTTP call was made
        verify(webClient).post();

        // Verify cache was updated with fresh data
        verify(cacheService).put(eq(cacheKey), eq(httpResponse), any(Duration.class));

        // Verify cache GET was NOT called (fallback-only pattern)
        verify(cacheService, never()).get(anyString(), any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getAvailability_shouldReturnCachedValue_onHttpError() {
        // Given
        long sku = 12345L;
        String cacheKey = "inventory:sku:" + sku;
        InventoryResponse cachedResponse = new InventoryResponse(25);

        // HTTP call setup
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any(InventoryRequest.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(InventoryResponse.class)).thenReturn(Mono.just(new InventoryResponse(0)));

        // Resilience decoration throws error (after retries)
        when(resilience.decorate(eq("inventory"), any(Mono.class)))
            .thenReturn(Mono.error(new RuntimeException("Service unavailable")));

        // Circuit breaker state
        when(resilience.getCircuitBreakerState("inventory"))
            .thenReturn(CircuitBreaker.State.OPEN);

        // Cache has stale data
        when(cacheService.get(eq(cacheKey), eq(InventoryResponse.class)))
            .thenReturn(Mono.just(cachedResponse));

        // When & Then - should return cached value
        StepVerifier.create(repository.getAvailability(sku))
            .expectNext(cachedResponse)
            .verifyComplete();

        // Verify cache was queried as fallback
        verify(cacheService).get(eq(cacheKey), eq(InventoryResponse.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void getAvailability_shouldReturnBackordered_onHttpErrorAndCacheMiss() {
        // Given
        long sku = 12345L;
        String cacheKey = "inventory:sku:" + sku;

        // HTTP call setup
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any(InventoryRequest.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(InventoryResponse.class)).thenReturn(Mono.just(new InventoryResponse(0)));

        // Resilience decoration throws error (after retries)
        when(resilience.decorate(eq("inventory"), any(Mono.class)))
            .thenReturn(Mono.error(new RuntimeException("Service unavailable")));

        // Circuit breaker state
        when(resilience.getCircuitBreakerState("inventory"))
            .thenReturn(CircuitBreaker.State.OPEN);

        // Cache miss - no stale data available
        when(cacheService.get(eq(cacheKey), eq(InventoryResponse.class)))
            .thenReturn(Mono.empty());

        // When & Then - should return backordered (-1)
        StepVerifier.create(repository.getAvailability(sku))
            .expectNextMatches(response -> response.availableQuantity() == -1)
            .verifyComplete();
    }

    @Test
    @SuppressWarnings("unchecked")
    void getAvailability_shouldUpdateCache_onSuccessfulResponse() {
        // Given
        long sku = 12345L;
        String cacheKey = "inventory:sku:" + sku;
        InventoryResponse httpResponse = new InventoryResponse(100);

        // HTTP call setup
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any(InventoryRequest.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(InventoryResponse.class)).thenReturn(Mono.just(httpResponse));

        // Resilience decoration returns the same mono
        when(resilience.decorate(eq("inventory"), any(Mono.class)))
            .thenAnswer(invocation -> invocation.getArgument(1));

        // Cache put succeeds
        when(cacheService.put(eq(cacheKey), eq(httpResponse), any(Duration.class)))
            .thenReturn(Mono.just(true));

        // When & Then
        StepVerifier.create(repository.getAvailability(sku))
            .expectNext(httpResponse)
            .verifyComplete();

        // Verify cache was updated with fresh inventory data
        verify(cacheService).put(eq(cacheKey), eq(httpResponse), eq(Duration.ofSeconds(30)));
    }

    @Test
    @SuppressWarnings("unchecked")
    void getAvailability_shouldStillWork_whenRedisUnavailable() {
        // Given
        long sku = 12345L;
        String cacheKey = "inventory:sku:" + sku;
        InventoryResponse httpResponse = new InventoryResponse(75);

        // HTTP call setup
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any(InventoryRequest.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(InventoryResponse.class)).thenReturn(Mono.just(httpResponse));

        // Resilience decoration returns the same mono
        when(resilience.decorate(eq("inventory"), any(Mono.class)))
            .thenAnswer(invocation -> invocation.getArgument(1));

        // Cache put fails (Redis down) but should not break the flow
        when(cacheService.put(eq(cacheKey), eq(httpResponse), any(Duration.class)))
            .thenReturn(Mono.just(false));

        // When & Then - should still return HTTP response
        StepVerifier.create(repository.getAvailability(sku))
            .expectNext(httpResponse)
            .verifyComplete();
    }

    @Test
    @SuppressWarnings("unchecked")
    void getAvailability_shouldReturnBackordered_whenBothHttpAndRedisFail() {
        // Given
        long sku = 12345L;
        String cacheKey = "inventory:sku:" + sku;

        // HTTP call setup
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any(InventoryRequest.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(InventoryResponse.class)).thenReturn(Mono.just(new InventoryResponse(0)));

        // Resilience decoration throws error
        when(resilience.decorate(eq("inventory"), any(Mono.class)))
            .thenReturn(Mono.error(new RuntimeException("Service unavailable")));

        // Circuit breaker state
        when(resilience.getCircuitBreakerState("inventory"))
            .thenReturn(CircuitBreaker.State.OPEN);

        // Redis is also down - returns empty
        when(cacheService.get(eq(cacheKey), eq(InventoryResponse.class)))
            .thenReturn(Mono.empty());

        // When & Then - should return backordered (-1) as last resort
        StepVerifier.create(repository.getAvailability(sku))
            .expectNextMatches(response -> response.availableQuantity() == -1)
            .verifyComplete();
    }
}
