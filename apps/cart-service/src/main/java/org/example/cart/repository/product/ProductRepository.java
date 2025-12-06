package org.example.cart.repository.product;

import org.example.model.product.Product;
import org.example.platform.resilience.ReactiveResilience;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/** Repository for communicating with product-service. */
@Repository
public class ProductRepository {

  private static final String RESILIENCE_NAME = "product";

  private final WebClient webClient;
  private final ReactiveResilience reactiveResilience;

  public ProductRepository(
      WebClient.Builder webClientBuilder,
      @Value("${services.product.base-url:http://localhost:8080}") String baseUrl,
      ReactiveResilience reactiveResilience) {
    this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    this.reactiveResilience = reactiveResilience;
  }

  /**
   * Get a product by SKU.
   *
   * @param sku the product SKU
   * @param storeNumber the store number for context
   * @param orderNumber the order number for context
   * @param userId the user ID for context
   * @param sessionId the session ID for context
   * @return the product
   */
  public Mono<Product> getProduct(
      long sku, int storeNumber, String orderNumber, String userId, String sessionId) {
    Mono<Product> request =
        webClient
            .get()
            .uri("/products/{sku}", sku)
            .header("x-store-number", String.valueOf(storeNumber))
            .header("x-order-number", orderNumber)
            .header("x-userid", userId)
            .header("x-sessionid", sessionId)
            .retrieve()
            .bodyToMono(Product.class);

    return reactiveResilience.decorate(RESILIENCE_NAME, request);
  }
}
