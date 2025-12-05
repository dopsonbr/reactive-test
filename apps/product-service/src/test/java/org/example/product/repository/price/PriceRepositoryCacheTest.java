package org.example.product.repository.price;

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
class PriceRepositoryCacheTest {

  @Mock private WebClient webClient;

  @Mock private WebClient.RequestBodyUriSpec requestBodyUriSpec;

  @Mock private WebClient.RequestBodySpec requestBodySpec;

  @Mock private WebClient.RequestHeadersSpec requestHeadersSpec;

  @Mock private WebClient.ResponseSpec responseSpec;

  @Mock private ReactiveResilience resilience;

  @Mock private StructuredLogger structuredLogger;

  @Mock private ReactiveCacheService cacheService;

  @Mock private CacheProperties cacheProperties;

  @Mock private CacheProperties.ServiceCache serviceCache;

  private PriceRepository repository;

  @BeforeEach
  void setUp() {
    lenient().when(cacheProperties.getPrice()).thenReturn(serviceCache);
    lenient().when(serviceCache.getTtl()).thenReturn(Duration.ofMinutes(2));

    repository =
        new PriceRepository(webClient, resilience, structuredLogger, cacheService, cacheProperties);
  }

  @Test
  void getPrice_shouldReturnCachedValue_onCacheHit() {
    // Given
    long sku = 12345L;
    String cacheKey = "price:sku:" + sku;
    PriceResponse cachedResponse = new PriceResponse("99.99");

    when(cacheService.get(eq(cacheKey), eq(PriceResponse.class)))
        .thenReturn(Mono.just(cachedResponse));

    // When & Then
    StepVerifier.create(repository.getPrice(sku)).expectNext(cachedResponse).verifyComplete();

    // Verify no HTTP call was made
    verify(webClient, never()).post();
  }

  @Test
  @SuppressWarnings("unchecked")
  void getPrice_shouldCallHttpAndCache_onCacheMiss() {
    // Given
    long sku = 12345L;
    String cacheKey = "price:sku:" + sku;
    PriceResponse httpResponse = new PriceResponse("149.99");

    // Cache miss
    when(cacheService.get(eq(cacheKey), eq(PriceResponse.class))).thenReturn(Mono.empty());

    // HTTP call setup
    when(webClient.post()).thenReturn(requestBodyUriSpec);
    when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
    when(requestBodySpec.bodyValue(any(PriceRequest.class))).thenReturn(requestHeadersSpec);
    when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    when(responseSpec.bodyToMono(PriceResponse.class)).thenReturn(Mono.just(httpResponse));

    // Resilience decoration returns the same mono
    when(resilience.decorate(eq("price"), any(Mono.class)))
        .thenAnswer(invocation -> invocation.getArgument(1));

    // Cache put succeeds
    when(cacheService.put(eq(cacheKey), eq(httpResponse), any(Duration.class)))
        .thenReturn(Mono.just(true));

    // When & Then
    StepVerifier.create(repository.getPrice(sku)).expectNext(httpResponse).verifyComplete();

    // Verify cache was populated
    verify(cacheService).put(eq(cacheKey), eq(httpResponse), any(Duration.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  void getPrice_shouldReturnFallback_onHttpError() {
    // Given
    long sku = 12345L;
    String cacheKey = "price:sku:" + sku;

    // Cache miss
    when(cacheService.get(eq(cacheKey), eq(PriceResponse.class))).thenReturn(Mono.empty());

    // HTTP call setup
    when(webClient.post()).thenReturn(requestBodyUriSpec);
    when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
    when(requestBodySpec.bodyValue(any(PriceRequest.class))).thenReturn(requestHeadersSpec);
    when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    when(responseSpec.bodyToMono(PriceResponse.class))
        .thenReturn(Mono.just(new PriceResponse("test")));

    // Resilience decoration throws error
    when(resilience.decorate(eq("price"), any(Mono.class)))
        .thenReturn(Mono.error(new RuntimeException("Service unavailable")));

    // Circuit breaker state
    when(resilience.getCircuitBreakerState("price")).thenReturn(CircuitBreaker.State.OPEN);

    // When & Then - should return fallback "0.00"
    StepVerifier.create(repository.getPrice(sku))
        .expectNextMatches(response -> response.price().equals("0.00"))
        .verifyComplete();
  }

  @Test
  @SuppressWarnings("unchecked")
  void getPrice_shouldStillWork_whenRedisUnavailable() {
    // Given
    long sku = 12345L;
    String cacheKey = "price:sku:" + sku;
    PriceResponse httpResponse = new PriceResponse("199.99");

    // Redis is down - cache get returns empty (graceful degradation)
    when(cacheService.get(eq(cacheKey), eq(PriceResponse.class))).thenReturn(Mono.empty());

    // HTTP call setup
    when(webClient.post()).thenReturn(requestBodyUriSpec);
    when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
    when(requestBodySpec.bodyValue(any(PriceRequest.class))).thenReturn(requestHeadersSpec);
    when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    when(responseSpec.bodyToMono(PriceResponse.class)).thenReturn(Mono.just(httpResponse));

    // Resilience decoration returns the same mono
    when(resilience.decorate(eq("price"), any(Mono.class)))
        .thenAnswer(invocation -> invocation.getArgument(1));

    // Cache put fails (Redis down) but should not break the flow
    when(cacheService.put(eq(cacheKey), eq(httpResponse), any(Duration.class)))
        .thenReturn(Mono.just(false));

    // When & Then - should still return HTTP response
    StepVerifier.create(repository.getPrice(sku)).expectNext(httpResponse).verifyComplete();
  }
}
