package org.example.checkout.client;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.example.platform.resilience.ReactiveResilience;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/** Client for communicating with cart-service. */
@Component
public class CartServiceClient {

  private static final String RESILIENCE_NAME = "cart";

  private final WebClient webClient;
  private final ReactiveResilience reactiveResilience;

  public CartServiceClient(
      WebClient.Builder webClientBuilder,
      @Value("${services.cart.base-url:http://localhost:8082}") String baseUrl,
      ReactiveResilience reactiveResilience) {
    this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    this.reactiveResilience = reactiveResilience;
  }

  /**
   * Fetch cart by ID with full details.
   *
   * @param cartId the cart ID
   * @param storeNumber the store number for validation
   * @return the cart details
   */
  public Mono<CartDetails> getCart(String cartId, int storeNumber) {
    Mono<CartDetails> request =
        webClient
            .get()
            .uri("/carts/{cartId}", cartId)
            .header("x-store-number", String.valueOf(storeNumber))
            .retrieve()
            .bodyToMono(CartDetails.class);

    return reactiveResilience.decorate(RESILIENCE_NAME, request);
  }

  /**
   * Mark a cart as completed after successful checkout.
   *
   * @param cartId the cart ID
   * @param orderId the resulting order ID
   * @return completion signal
   */
  public Mono<Void> markCartCompleted(String cartId, String orderId) {
    Mono<Void> request =
        webClient
            .post()
            .uri("/carts/{cartId}/complete", cartId)
            .bodyValue(new CompleteCartRequest(orderId))
            .retrieve()
            .bodyToMono(Void.class);

    return reactiveResilience.decorate(RESILIENCE_NAME, request);
  }

  /** Cart details returned from cart-service. */
  public record CartDetails(
      String id,
      int storeNumber,
      String customerId,
      CartCustomer customer,
      List<CartItem> items,
      List<CartDiscount> discounts,
      CartTotals totals,
      Instant createdAt,
      Instant updatedAt) {}

  /** Cart customer info. */
  public record CartCustomer(
      String customerId,
      String firstName,
      String lastName,
      String email,
      String phone,
      String loyaltyTier) {}

  /** Cart item. */
  public record CartItem(
      String productId,
      Long sku,
      String name,
      int quantity,
      BigDecimal unitPrice,
      BigDecimal lineTotal) {}

  /** Cart discount. */
  public record CartDiscount(
      String discountId,
      String code,
      String type,
      BigDecimal originalValue,
      BigDecimal appliedSavings) {}

  /** Cart totals. */
  public record CartTotals(
      BigDecimal subtotal,
      BigDecimal discountTotal,
      BigDecimal taxTotal,
      BigDecimal fulfillmentCost,
      BigDecimal grandTotal) {}

  private record CompleteCartRequest(String orderId) {}
}
