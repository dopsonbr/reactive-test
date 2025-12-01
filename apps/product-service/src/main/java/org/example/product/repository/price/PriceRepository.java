package org.example.product.repository.price;

import org.example.platform.cache.CacheKeyGenerator;
import org.example.platform.cache.ReactiveCacheService;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.resilience.ReactiveResilience;
import org.example.product.config.CacheProperties;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Repository
public class PriceRepository {
    private static final String RESILIENCE_NAME = "price";
    private static final String LOGGER_NAME = "pricerepository";
    private static final PriceResponse FALLBACK = new PriceResponse("0.00");

    private final WebClient priceWebClient;
    private final ReactiveResilience resilience;
    private final StructuredLogger structuredLogger;
    private final ReactiveCacheService cacheService;
    private final CacheProperties cacheProperties;

    public PriceRepository(
            WebClient priceWebClient,
            ReactiveResilience resilience,
            StructuredLogger structuredLogger,
            ReactiveCacheService cacheService,
            CacheProperties cacheProperties) {
        this.priceWebClient = priceWebClient;
        this.resilience = resilience;
        this.structuredLogger = structuredLogger;
        this.cacheService = cacheService;
        this.cacheProperties = cacheProperties;
    }

    public Mono<PriceResponse> getPrice(long sku) {
        String cacheKey = CacheKeyGenerator.priceKey(sku);

        // Cache-Aside Pattern: Check cache first
        return cacheService.get(cacheKey, PriceResponse.class)
            .switchIfEmpty(Mono.defer(() -> fetchAndCache(sku, cacheKey)));
    }

    private Mono<PriceResponse> fetchAndCache(long sku, String cacheKey) {
        Mono<PriceResponse> call = priceWebClient.post()
            .uri("/price")
            .bodyValue(new PriceRequest(sku))
            .retrieve()
            .bodyToMono(PriceResponse.class);

        return resilience.decorate(RESILIENCE_NAME, call)
            .flatMap(response -> cacheAndReturn(cacheKey, response))
            .onErrorResume(this::handleError);
    }

    private Mono<PriceResponse> cacheAndReturn(String cacheKey, PriceResponse response) {
        return cacheService.put(cacheKey, response, cacheProperties.getPrice().getTtl())
            .thenReturn(response);
    }

    private Mono<PriceResponse> handleError(Throwable t) {
        return Mono.deferContextual(ctx -> {
            String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
            structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);
            return Mono.just(FALLBACK);
        });
    }
}
