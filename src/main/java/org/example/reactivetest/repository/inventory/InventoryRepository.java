package org.example.reactivetest.repository.inventory;

import org.example.reactivetest.logging.StructuredLogger;
import org.example.reactivetest.resilience.ReactiveResilience;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Repository
public class InventoryRepository {
    private static final String RESILIENCE_NAME = "inventory";
    private static final String LOGGER_NAME = "inventoryrepository";
    private static final InventoryResponse FALLBACK = new InventoryResponse(0);

    private final WebClient inventoryWebClient;
    private final ReactiveResilience resilience;
    private final StructuredLogger structuredLogger;

    public InventoryRepository(
            WebClient inventoryWebClient,
            ReactiveResilience resilience,
            StructuredLogger structuredLogger) {
        this.inventoryWebClient = inventoryWebClient;
        this.resilience = resilience;
        this.structuredLogger = structuredLogger;
    }

    public Mono<InventoryResponse> getAvailability(long sku) {
        Mono<InventoryResponse> call = inventoryWebClient.post()
            .uri("/inventory")
            .bodyValue(new InventoryRequest(sku))
            .retrieve()
            .bodyToMono(InventoryResponse.class);

        return resilience.decorate(RESILIENCE_NAME, call)
            .onErrorResume(t -> handleError(t));
    }

    private Mono<InventoryResponse> handleError(Throwable t) {
        return Mono.deferContextual(ctx -> {
            String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
            structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);
            return Mono.just(FALLBACK);
        });
    }
}
