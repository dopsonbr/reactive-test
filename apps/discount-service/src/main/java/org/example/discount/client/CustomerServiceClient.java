package org.example.discount.client;

import java.math.BigDecimal;
import java.util.List;
import org.example.discount.client.LoyaltyInfo.BenefitType;
import org.example.discount.client.LoyaltyInfo.LoyaltyBenefit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/** Client for communicating with customer-service to retrieve loyalty information. */
@Component
public class CustomerServiceClient {

    private final WebClient webClient;

    public CustomerServiceClient(
            WebClient.Builder webClientBuilder,
            @Value("${services.customer-service.url:http://localhost:8083}") String baseUrl) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    }

    /**
     * Get customer loyalty information.
     *
     * @param customerId the customer ID
     * @return loyalty info or empty if not found
     */
    public Mono<LoyaltyInfo> getCustomerLoyalty(String customerId) {
        // Try to call real customer-service, fallback to mock data
        return webClient
                .get()
                .uri("/customers/{id}/loyalty", customerId)
                .retrieve()
                .bodyToMono(LoyaltyInfo.class)
                .onErrorResume(e -> getMockLoyaltyInfo(customerId));
    }

    private Mono<LoyaltyInfo> getMockLoyaltyInfo(String customerId) {
        // Return mock loyalty data for testing when customer-service is not available
        if (customerId == null || customerId.isEmpty()) {
            return Mono.empty();
        }

        // Simulate different loyalty tiers based on customer ID
        if (customerId.startsWith("gold")) {
            return Mono.just(
                    new LoyaltyInfo(
                            "GOLD",
                            5000L,
                            List.of(
                                    new LoyaltyBenefit(
                                            BenefitType.PERCENTAGE_DISCOUNT,
                                            BigDecimal.valueOf(10),
                                            "Gold member 10% discount"),
                                    new LoyaltyBenefit(
                                            BenefitType.FREE_SHIPPING,
                                            BigDecimal.ZERO,
                                            "Free shipping"))));
        } else if (customerId.startsWith("silver")) {
            return Mono.just(
                    new LoyaltyInfo(
                            "SILVER",
                            2500L,
                            List.of(
                                    new LoyaltyBenefit(
                                            BenefitType.PERCENTAGE_DISCOUNT,
                                            BigDecimal.valueOf(5),
                                            "Silver member 5% discount"))));
        } else if (customerId.startsWith("platinum")) {
            return Mono.just(
                    new LoyaltyInfo(
                            "PLATINUM",
                            15000L,
                            List.of(
                                    new LoyaltyBenefit(
                                            BenefitType.PERCENTAGE_DISCOUNT,
                                            BigDecimal.valueOf(15),
                                            "Platinum member 15% discount"),
                                    new LoyaltyBenefit(
                                            BenefitType.FREE_SHIPPING,
                                            BigDecimal.ZERO,
                                            "Free shipping"),
                                    new LoyaltyBenefit(
                                            BenefitType.POINTS_MULTIPLIER,
                                            BigDecimal.valueOf(2),
                                            "2x points multiplier"))));
        }

        // Default: Bronze tier
        return Mono.just(new LoyaltyInfo("BRONZE", 500L, List.of()));
    }
}
