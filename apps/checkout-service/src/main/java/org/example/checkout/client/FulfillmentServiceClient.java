package org.example.checkout.client;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.checkout.model.DeliveryAddress;
import org.example.checkout.model.FulfillmentType;
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
   * Create an inventory reservation for checkout.
   *
   * @param request the reservation request
   * @return the reservation response
   */
  public Mono<ReservationResponse> createReservation(ReservationRequest request) {
    Mono<ReservationResponse> httpRequest =
        webClient
            .post()
            .uri("/fulfillments/reserve")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(ReservationResponse.class);

    return reactiveResilience.decorate(RESILIENCE_NAME, httpRequest);
  }

  /**
   * Cancel a reservation (e.g., if payment fails).
   *
   * @param reservationId the reservation ID
   * @return completion signal
   */
  public Mono<Void> cancelReservation(UUID reservationId) {
    Mono<Void> request =
        webClient
            .delete()
            .uri("/fulfillments/reservations/{id}", reservationId)
            .retrieve()
            .bodyToMono(Void.class);

    return reactiveResilience.decorate(RESILIENCE_NAME, request);
  }

  /**
   * Calculate fulfillment cost.
   *
   * @param type the fulfillment type
   * @param items the items for fulfillment
   * @param deliveryAddress the delivery address (for DELIVERY type)
   * @return the calculated cost
   */
  public Mono<BigDecimal> calculateFulfillmentCost(
      FulfillmentType type, List<FulfillmentItem> items, DeliveryAddress deliveryAddress) {
    Mono<BigDecimal> request =
        webClient
            .post()
            .uri("/fulfillments/calculate-cost")
            .bodyValue(new FulfillmentCostRequest(type, items, deliveryAddress))
            .retrieve()
            .bodyToMono(FulfillmentCostResponse.class)
            .map(response -> new BigDecimal(response.cost()));

    return reactiveResilience.decorate(RESILIENCE_NAME, request);
  }

  /** Reservation request. */
  public record ReservationRequest(
      int storeNumber,
      FulfillmentType type,
      Instant fulfillmentDate,
      List<FulfillmentItem> items,
      DeliveryAddress deliveryAddress,
      String instructions) {}

  /** Item for fulfillment. */
  public record FulfillmentItem(Long sku, int quantity) {}

  /** Reservation response. */
  public record ReservationResponse(
      UUID reservationId,
      String status,
      Instant expiresAt,
      BigDecimal fulfillmentCost,
      List<ReservedItem> reservedItems,
      List<UnavailableItem> unavailableItems) {}

  /** Reserved item in response. */
  public record ReservedItem(Long sku, int quantity, String location) {}

  /** Unavailable item in response. */
  public record UnavailableItem(Long sku, int requestedQuantity, int availableQuantity) {}

  private record FulfillmentCostRequest(
      FulfillmentType type, List<FulfillmentItem> items, DeliveryAddress deliveryAddress) {}

  private record FulfillmentCostResponse(String cost) {}
}
