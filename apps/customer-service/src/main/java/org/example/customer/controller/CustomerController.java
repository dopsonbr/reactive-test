package org.example.customer.controller;

import org.example.model.customer.CartCustomer;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

/**
 * Minimal placeholder controller for customer-service. Complex B2B/B2C omnichannel customer model
 * to be designed in a future feature plan.
 */
@RestController
@RequestMapping("/customers")
public class CustomerController {

  /**
   * Get customer by ID (stubbed).
   *
   * @param customerId the customer ID
   * @return the customer (stubbed data)
   */
  @GetMapping("/{customerId}")
  public Mono<CartCustomer> getCustomer(@PathVariable String customerId) {
    // Return stubbed customer data
    return Mono.just(
        new CartCustomer(
            customerId, "Test Customer " + customerId, "customer" + customerId + "@example.com"));
  }

  /**
   * Validate customer exists.
   *
   * @param customerId the customer ID
   * @return 200 if customer exists, 404 otherwise
   */
  @GetMapping("/{customerId}/validate")
  public Mono<Void> validateCustomer(@PathVariable String customerId) {
    // Stubbed validation: accept any non-empty customerId except "INVALID"
    if ("INVALID".equals(customerId)) {
      return Mono.error(
          new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found: " + customerId));
    }
    return Mono.empty();
  }
}
