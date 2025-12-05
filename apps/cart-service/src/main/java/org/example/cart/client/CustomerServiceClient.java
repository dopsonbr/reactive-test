package org.example.cart.client;

import org.example.model.customer.CartCustomer;
import org.example.platform.resilience.ReactiveResilience;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

/** Client for communicating with customer-service. */
@Component
public class CustomerServiceClient {

  private static final String RESILIENCE_NAME = "customer";

  private final WebClient webClient;
  private final ReactiveResilience reactiveResilience;

  public CustomerServiceClient(
      WebClient.Builder webClientBuilder,
      @Value("${services.customer.base-url:http://localhost:8083}") String baseUrl,
      ReactiveResilience reactiveResilience) {
    this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    this.reactiveResilience = reactiveResilience;
  }

  /**
   * Get a customer by ID.
   *
   * @param customerId the customer ID
   * @return the customer
   */
  public Mono<CartCustomer> getCustomer(String customerId) {
    Mono<CartCustomer> request =
        webClient
            .get()
            .uri("/customers/{customerId}", customerId)
            .retrieve()
            .bodyToMono(CartCustomer.class);

    return reactiveResilience.decorate(RESILIENCE_NAME, request);
  }

  /**
   * Validate that a customer exists.
   *
   * @param customerId the customer ID
   * @return true if the customer exists, empty if not found
   */
  public Mono<Boolean> validateCustomer(String customerId) {
    Mono<Boolean> request =
        webClient
            .get()
            .uri("/customers/{customerId}/validate", customerId)
            .retrieve()
            .toBodilessEntity()
            .map(response -> true)
            .onErrorResume(
                WebClientResponseException.class,
                e -> {
                  if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                    return Mono.just(false);
                  }
                  return Mono.error(e);
                });

    return reactiveResilience.decorate(RESILIENCE_NAME, request);
  }
}
