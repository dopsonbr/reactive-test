package org.example.reactivetest.repository.price;

import org.example.reactivetest.logging.StructuredLogger;
import org.example.reactivetest.resilience.ReactiveResilience;
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

    public PriceRepository(
            WebClient priceWebClient,
            ReactiveResilience resilience,
            StructuredLogger structuredLogger) {
        this.priceWebClient = priceWebClient;
        this.resilience = resilience;
        this.structuredLogger = structuredLogger;
    }

    public Mono<PriceResponse> getPrice(long sku) {
        Mono<PriceResponse> call = priceWebClient.post()
            .uri("/price")
            .bodyValue(new PriceRequest(sku))
            .retrieve()
            .bodyToMono(PriceResponse.class);

        return resilience.decorate(RESILIENCE_NAME, call)
            .onErrorResume(t -> handleError(t));
    }

    private Mono<PriceResponse> handleError(Throwable t) {
        return Mono.deferContextual(ctx -> {
            String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
            structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);
            return Mono.just(FALLBACK);
        });
    }
}
