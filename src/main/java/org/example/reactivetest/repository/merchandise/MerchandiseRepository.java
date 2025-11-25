package org.example.reactivetest.repository.merchandise;

import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Repository
public class MerchandiseRepository {
    private final WebClient merchandiseWebClient;

    public MerchandiseRepository(WebClient merchandiseWebClient) {
        this.merchandiseWebClient = merchandiseWebClient;
    }

    public Mono<MerchandiseResponse> getDescription(long sku) {
        return merchandiseWebClient.get()
            .uri("/merchandise/{sku}", sku)
            .retrieve()
            .bodyToMono(MerchandiseResponse.class);
    }
}
