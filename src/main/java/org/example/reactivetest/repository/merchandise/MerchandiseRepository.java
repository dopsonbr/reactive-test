package org.example.reactivetest.repository.merchandise;

import org.example.reactivetest.logging.StructuredLogger;
import org.example.reactivetest.resilience.ReactiveResilience;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Repository
public class MerchandiseRepository {
    private static final String RESILIENCE_NAME = "merchandise";
    private static final String LOGGER_NAME = "merchandiserepository";
    private static final MerchandiseResponse FALLBACK = new MerchandiseResponse("Description unavailable");

    private final WebClient merchandiseWebClient;
    private final ReactiveResilience resilience;
    private final StructuredLogger structuredLogger;

    public MerchandiseRepository(
            WebClient merchandiseWebClient,
            ReactiveResilience resilience,
            StructuredLogger structuredLogger) {
        this.merchandiseWebClient = merchandiseWebClient;
        this.resilience = resilience;
        this.structuredLogger = structuredLogger;
    }

    public Mono<MerchandiseResponse> getDescription(long sku) {
        Mono<MerchandiseResponse> call = merchandiseWebClient.get()
            .uri("/merchandise/{sku}", sku)
            .retrieve()
            .bodyToMono(MerchandiseResponse.class);

        return resilience.decorate(RESILIENCE_NAME, call)
            .onErrorResume(t -> handleError(t));
    }

    private Mono<MerchandiseResponse> handleError(Throwable t) {
        return Mono.deferContextual(ctx -> {
            String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
            structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);
            return Mono.just(FALLBACK);
        });
    }
}
