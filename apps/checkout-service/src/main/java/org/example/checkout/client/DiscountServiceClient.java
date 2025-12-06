package org.example.checkout.client;

import java.math.BigDecimal;
import java.util.List;
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
   * Validate and calculate final discounts at checkout time.
   *
   * @param request the discount calculation request
   * @return the validated discount response
   */
  public Mono<DiscountResponse> validateAndCalculateDiscounts(DiscountRequest request) {
    Mono<DiscountResponse> httpRequest =
        webClient
            .post()
            .uri("/discounts/checkout/validate")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(DiscountResponse.class);

    return reactiveResilience.decorate(RESILIENCE_NAME, httpRequest);
  }

  /** Request to validate discounts at checkout. */
  public record DiscountRequest(
      String customerId,
      String loyaltyTier,
      BigDecimal subtotal,
      List<DiscountRequestItem> items,
      List<String> discountCodes) {}

  /** Item in the discount request. */
  public record DiscountRequestItem(Long sku, int quantity, BigDecimal unitPrice) {}

  /** Response from discount validation. */
  public record DiscountResponse(
      boolean valid,
      List<ValidatedDiscount> appliedDiscounts,
      BigDecimal totalSavings,
      List<String> invalidCodes,
      List<String> messages) {}

  /** A validated discount. */
  public record ValidatedDiscount(
      String discountId,
      String code,
      String description,
      String type,
      BigDecimal amount,
      List<Long> applicableSkus) {}
}
