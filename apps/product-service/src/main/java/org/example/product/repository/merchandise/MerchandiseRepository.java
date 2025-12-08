package org.example.product.repository.merchandise;

import org.example.platform.cache.CacheKeyGenerator;
import org.example.platform.cache.ReactiveCacheService;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.resilience.ReactiveResilience;
import org.example.product.config.CacheProperties;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Repository
public class MerchandiseRepository {
  private static final String RESILIENCE_NAME = "merchandise";
  private static final String LOGGER_NAME = "merchandiserepository";
  private static final MerchandiseResponse FALLBACK =
      new MerchandiseResponse(
          "Unknown Product",
          "Description unavailable",
          "https://via.placeholder.com/300x300?text=No+Image",
          "Unknown");

  private final WebClient merchandiseWebClient;
  private final ReactiveResilience resilience;
  private final StructuredLogger structuredLogger;
  private final ReactiveCacheService cacheService;
  private final CacheProperties cacheProperties;

  public MerchandiseRepository(
      WebClient merchandiseWebClient,
      ReactiveResilience resilience,
      StructuredLogger structuredLogger,
      ReactiveCacheService cacheService,
      CacheProperties cacheProperties) {
    this.merchandiseWebClient = merchandiseWebClient;
    this.resilience = resilience;
    this.structuredLogger = structuredLogger;
    this.cacheService = cacheService;
    this.cacheProperties = cacheProperties;
  }

  public Mono<MerchandiseResponse> getMerchandise(long sku) {
    String cacheKey = CacheKeyGenerator.merchandiseKey(sku);

    // Cache-Aside Pattern: Check cache first
    return cacheService
        .get(cacheKey, MerchandiseResponse.class)
        .switchIfEmpty(Mono.defer(() -> fetchAndCache(sku, cacheKey)));
  }

  private Mono<MerchandiseResponse> fetchAndCache(long sku, String cacheKey) {
    Mono<MerchandiseResponse> call =
        merchandiseWebClient
            .get()
            .uri("/merchandise/{sku}", sku)
            .retrieve()
            .bodyToMono(MerchandiseResponse.class);

    return resilience
        .decorate(RESILIENCE_NAME, call)
        .flatMap(response -> cacheAndReturn(cacheKey, response))
        .onErrorResume(this::handleError);
  }

  private Mono<MerchandiseResponse> cacheAndReturn(String cacheKey, MerchandiseResponse response) {
    return cacheService
        .put(cacheKey, response, cacheProperties.getMerchandise().getTtl())
        .thenReturn(response);
  }

  private Mono<MerchandiseResponse> handleError(Throwable t) {
    return Mono.deferContextual(
        ctx -> {
          String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
          structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);
          return Mono.just(FALLBACK);
        });
  }
}
