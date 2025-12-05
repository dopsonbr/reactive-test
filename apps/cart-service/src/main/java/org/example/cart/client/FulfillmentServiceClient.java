package org.example.cart.client;

import java.math.BigDecimal;
import java.util.List;
import org.example.model.fulfillment.FulfillmentType;
import org.example.platform.resilience.ReactiveResilience;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/** Client for communicating with fulfillment-service. */
@Component
public class FulfillmentServiceClient {

  private static final String RESILIENCE_NAME = "fulfillment";

  private final WebClient webClient;
  private final ReactiveResilience reactiveResilience;

  public FulfillmentServiceClient(
      WebClient.Builder webClientBuilder,
      @Value("${services.fulfillment.base-url:http://localhost:8085}") String baseUrl,
      ReactiveResilience reactiveResilience) {
    this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    this.reactiveResilience = reactiveResilience;
  }

  /**
   * Calculate fulfillment cost.
   *
   * @param type the fulfillment type
   * @param skus the SKUs for this fulfillment
   * @return the calculated cost
   */
  public Mono<BigDecimal> calculateFulfillmentCost(FulfillmentType type, List<Long> skus) {
    Mono<BigDecimal> request =
        webClient
            .post()
            .uri("/fulfillments/calculate")
            .bodyValue(new FulfillmentCostRequest(type, skus))
            .retrieve()
            .bodyToMono(FulfillmentCostResponse.class)
            .map(response -> new BigDecimal(response.cost()));

    return reactiveResilience.decorate(RESILIENCE_NAME, request);
  }

  private record FulfillmentCostRequest(FulfillmentType type, List<Long> skus) {}

  private record FulfillmentCostResponse(String cost) {}
}
