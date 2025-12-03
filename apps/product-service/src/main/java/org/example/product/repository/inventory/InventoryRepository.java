package org.example.product.repository.inventory;

import org.example.platform.cache.CacheKeyGenerator;
import org.example.platform.cache.ReactiveCacheService;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.resilience.ReactiveResilience;
import org.example.product.config.CacheProperties;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Repository
public class InventoryRepository {
    private static final String RESILIENCE_NAME = "inventory";
    private static final String LOGGER_NAME = "inventoryrepository";

    // -1 indicates backordered status (cache miss after error)
    private static final InventoryResponse BACKORDERED_FALLBACK = new InventoryResponse(-1);

    private final WebClient inventoryWebClient;
    private final ReactiveResilience resilience;
    private final StructuredLogger structuredLogger;
    private final ReactiveCacheService cacheService;
    private final CacheProperties cacheProperties;

    public InventoryRepository(
            WebClient inventoryWebClient,
            ReactiveResilience resilience,
            StructuredLogger structuredLogger,
            ReactiveCacheService cacheService,
            CacheProperties cacheProperties) {
        this.inventoryWebClient = inventoryWebClient;
        this.resilience = resilience;
        this.structuredLogger = structuredLogger;
        this.cacheService = cacheService;
        this.cacheProperties = cacheProperties;
    }

    public Mono<InventoryResponse> getAvailability(long sku) {
        String cacheKey = CacheKeyGenerator.inventoryKey(sku);

        // Fallback-Only Pattern: Always call HTTP first (resilience includes retry)
        // Use cache only on errors after retry exhaustion
        Mono<InventoryResponse> call =
                inventoryWebClient
                        .post()
                        .uri("/inventory")
                        .bodyValue(new InventoryRequest(sku))
                        .retrieve()
                        .bodyToMono(InventoryResponse.class);

        return resilience
                .decorate(RESILIENCE_NAME, call)
                .flatMap(response -> cacheAndReturn(cacheKey, response))
                .onErrorResume(t -> handleErrorWithCacheFallback(t, sku, cacheKey));
    }

    private Mono<InventoryResponse> cacheAndReturn(String cacheKey, InventoryResponse response) {
        // Update cache with fresh data on successful response
        return cacheService
                .put(cacheKey, response, cacheProperties.getInventory().getTtl())
                .thenReturn(response);
    }

    private Mono<InventoryResponse> handleErrorWithCacheFallback(
            Throwable t, long sku, String cacheKey) {
        return Mono.deferContextual(
                ctx -> {
                    String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
                    structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);

                    // After retry exhaustion, try cache for ALL error types
                    return cacheService
                            .get(cacheKey, InventoryResponse.class)
                            .doOnNext(
                                    cached ->
                                            structuredLogger.logMessage(
                                                    ctx,
                                                    LOGGER_NAME,
                                                    "Using cached inventory fallback for sku: "
                                                            + sku))
                            .switchIfEmpty(
                                    Mono.defer(
                                            () -> {
                                                // Cache miss after error = backordered (-1)
                                                structuredLogger.logMessage(
                                                        ctx,
                                                        LOGGER_NAME,
                                                        "No cached inventory available, marking as"
                                                                + " backordered for sku: "
                                                                + sku);
                                                return Mono.just(BACKORDERED_FALLBACK);
                                            }));
                });
    }
}
