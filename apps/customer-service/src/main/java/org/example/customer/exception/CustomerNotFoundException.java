package org.example.customer.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Exception thrown when a customer is not found. */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class CustomerNotFoundException extends RuntimeException {

  public CustomerNotFoundException(String customerId) {
    super("Customer not found: " + customerId);
  }
}
