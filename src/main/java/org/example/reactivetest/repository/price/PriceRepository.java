package org.example.reactivetest.repository.price;

import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Repository
public class PriceRepository {
    private final WebClient priceWebClient;

    public PriceRepository(WebClient priceWebClient) {
        this.priceWebClient = priceWebClient;
    }

    public Mono<PriceResponse> getPrice(long sku) {
        return priceWebClient.post()
            .uri("/price")
            .bodyValue(new PriceRequest(sku))
            .retrieve()
            .bodyToMono(PriceResponse.class);
    }
}
