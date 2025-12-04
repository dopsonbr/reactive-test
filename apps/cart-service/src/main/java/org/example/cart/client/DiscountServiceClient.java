package org.example.cart.client;

import java.math.BigDecimal;
import java.util.List;
import org.example.model.discount.AppliedDiscount;
import org.example.model.discount.Discount;
import org.example.platform.resilience.ReactiveResilience;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/** Client for communicating with discount-service. */
@Component
public class DiscountServiceClient {

    private static final String RESILIENCE_NAME = "discount";

    private final WebClient webClient;
    private final ReactiveResilience reactiveResilience;

    public DiscountServiceClient(
            WebClient.Builder webClientBuilder,
            @Value("${services.discount.base-url:http://localhost:8084}") String baseUrl,
            ReactiveResilience reactiveResilience) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
        this.reactiveResilience = reactiveResilience;
    }

    /**
     * Validate a discount code.
     *
     * @param code the discount code
     * @return the discount if valid
     */
    public Mono<Discount> validateDiscount(String code) {
        Mono<Discount> request =
                webClient
                        .get()
                        .uri(
                                uriBuilder ->
                                        uriBuilder
                                                .path("/discounts/validate")
                                                .queryParam("code", code)
                                                .build())
                        .retrieve()
                        .bodyToMono(Discount.class);

        return reactiveResilience.decorate(RESILIENCE_NAME, request);
    }

    /**
     * Calculate discount for a cart.
     *
     * @param code the discount code
     * @param subtotal the cart subtotal
     * @param skus the SKUs in the cart
     * @return the applied discount with calculated savings
     */
    public Mono<AppliedDiscount> calculateDiscount(
            String code, BigDecimal subtotal, List<Long> skus) {
        Mono<AppliedDiscount> request =
                webClient
                        .post()
                        .uri("/discounts/calculate")
                        .bodyValue(new CalculateDiscountRequest(code, subtotal.toString(), skus))
                        .retrieve()
                        .bodyToMono(AppliedDiscount.class);

        return reactiveResilience.decorate(RESILIENCE_NAME, request);
    }

    private record CalculateDiscountRequest(String code, String subtotal, List<Long> skus) {}
}
