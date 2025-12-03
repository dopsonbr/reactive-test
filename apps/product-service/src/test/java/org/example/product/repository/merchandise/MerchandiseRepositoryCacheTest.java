package org.example.product.repository.merchandise;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import java.time.Duration;
import org.example.platform.cache.ReactiveCacheService;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.resilience.ReactiveResilience;
import org.example.product.config.CacheProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class MerchandiseRepositoryCacheTest {

    @Mock private WebClient webClient;

    @Mock private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;

    @Mock private WebClient.RequestHeadersSpec requestHeadersSpec;

    @Mock private WebClient.ResponseSpec responseSpec;

    @Mock private ReactiveResilience resilience;

    @Mock private StructuredLogger structuredLogger;

    @Mock private ReactiveCacheService cacheService;

    @Mock private CacheProperties cacheProperties;

    @Mock private CacheProperties.ServiceCache serviceCache;

    private MerchandiseRepository repository;

    @BeforeEach
    void setUp() {
        lenient().when(cacheProperties.getMerchandise()).thenReturn(serviceCache);
        lenient().when(serviceCache.getTtl()).thenReturn(Duration.ofMinutes(15));

        repository =
                new MerchandiseRepository(
                        webClient, resilience, structuredLogger, cacheService, cacheProperties);
    }

    @Test
    void getDescription_shouldReturnCachedValue_onCacheHit() {
        // Given
        long sku = 12345L;
        String cacheKey = "merchandise:sku:" + sku;
        MerchandiseResponse cachedResponse = new MerchandiseResponse("Cached Description");

        when(cacheService.get(eq(cacheKey), eq(MerchandiseResponse.class)))
                .thenReturn(Mono.just(cachedResponse));

        // When & Then
        StepVerifier.create(repository.getDescription(sku))
                .expectNext(cachedResponse)
                .verifyComplete();

        // Verify no HTTP call was made
        verify(webClient, never()).get();
    }

    @Test
    @SuppressWarnings("unchecked")
    void getDescription_shouldCallHttpAndCache_onCacheMiss() {
        // Given
        long sku = 12345L;
        String cacheKey = "merchandise:sku:" + sku;
        MerchandiseResponse httpResponse = new MerchandiseResponse("HTTP Description");

        // Cache miss
        when(cacheService.get(eq(cacheKey), eq(MerchandiseResponse.class)))
                .thenReturn(Mono.empty());

        // HTTP call setup
        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Object[].class)))
                .thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(MerchandiseResponse.class))
                .thenReturn(Mono.just(httpResponse));

        // Resilience decoration returns the same mono
        when(resilience.decorate(eq("merchandise"), any(Mono.class)))
                .thenAnswer(invocation -> invocation.getArgument(1));

        // Cache put succeeds
        when(cacheService.put(eq(cacheKey), eq(httpResponse), any(Duration.class)))
                .thenReturn(Mono.just(true));

        // When & Then
        StepVerifier.create(repository.getDescription(sku))
                .expectNext(httpResponse)
                .verifyComplete();

        // Verify cache was populated
        verify(cacheService).put(eq(cacheKey), eq(httpResponse), any(Duration.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void getDescription_shouldReturnFallback_onHttpError() {
        // Given
        long sku = 12345L;
        String cacheKey = "merchandise:sku:" + sku;

        // Cache miss
        when(cacheService.get(eq(cacheKey), eq(MerchandiseResponse.class)))
                .thenReturn(Mono.empty());

        // HTTP call setup
        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Object[].class)))
                .thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(MerchandiseResponse.class))
                .thenReturn(Mono.just(new MerchandiseResponse("test")));

        // Resilience decoration throws error
        when(resilience.decorate(eq("merchandise"), any(Mono.class)))
                .thenReturn(Mono.error(new RuntimeException("Service unavailable")));

        // Circuit breaker state
        when(resilience.getCircuitBreakerState("merchandise"))
                .thenReturn(CircuitBreaker.State.OPEN);

        // When & Then
        StepVerifier.create(repository.getDescription(sku))
                .expectNextMatches(
                        response -> response.description().equals("Description unavailable"))
                .verifyComplete();
    }

    @Test
    @SuppressWarnings("unchecked")
    void getDescription_shouldStillWork_whenRedisUnavailable() {
        // Given
        long sku = 12345L;
        String cacheKey = "merchandise:sku:" + sku;
        MerchandiseResponse httpResponse = new MerchandiseResponse("HTTP Response");

        // Redis is down - cache get returns empty (graceful degradation)
        when(cacheService.get(eq(cacheKey), eq(MerchandiseResponse.class)))
                .thenReturn(Mono.empty());

        // HTTP call setup
        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Object[].class)))
                .thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(MerchandiseResponse.class))
                .thenReturn(Mono.just(httpResponse));

        // Resilience decoration returns the same mono
        when(resilience.decorate(eq("merchandise"), any(Mono.class)))
                .thenAnswer(invocation -> invocation.getArgument(1));

        // Cache put fails (Redis down) but should not break the flow
        when(cacheService.put(eq(cacheKey), eq(httpResponse), any(Duration.class)))
                .thenReturn(Mono.just(false));

        // When & Then - should still return HTTP response
        StepVerifier.create(repository.getDescription(sku))
                .expectNext(httpResponse)
                .verifyComplete();
    }
}
