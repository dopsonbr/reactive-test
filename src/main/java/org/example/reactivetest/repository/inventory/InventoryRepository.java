package org.example.reactivetest.repository.inventory;

import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Repository
public class InventoryRepository {
    private final WebClient inventoryWebClient;

    public InventoryRepository(WebClient inventoryWebClient) {
        this.inventoryWebClient = inventoryWebClient;
    }

    public Mono<InventoryResponse> getAvailability(long sku) {
        return inventoryWebClient.post()
            .uri("/inventory")
            .bodyValue(new InventoryRequest(sku))
            .retrieve()
            .bodyToMono(InventoryResponse.class);
    }
}
