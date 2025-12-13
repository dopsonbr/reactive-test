package org.example.order.validation;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import org.example.model.order.OrderStatus;
import org.example.order.dto.OrderSearchRequest;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Validates order request parameters. */
@Component
public class OrderRequestValidator {

  private static final int STORE_NUMBER_MIN = 1;
  private static final int STORE_NUMBER_MAX = 2000;
  private static final Pattern UUID_PATTERN =
      Pattern.compile(
          "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

  /** Validate order ID (UUID format). */
  public Mono<Void> validateOrderId(String orderId) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(orderId, "orderId", errors);
    return toMono(errors);
  }

  /** Validate order ID (UUID). */
  public Mono<Void> validateOrderId(UUID orderId) {
    if (orderId == null) {
      return Mono.error(
          new ValidationException(List.of(new ValidationError("orderId", "Required"))));
    }
    return Mono.empty();
  }

  /** Validate order number. */
  public Mono<Void> validateOrderNumber(String orderNumber) {
    List<ValidationError> errors = new ArrayList<>();
    if (orderNumber == null || orderNumber.isBlank()) {
      errors.add(new ValidationError("orderNumber", "Required"));
    }
    return toMono(errors);
  }

  /** Validate store number. */
  public Mono<Void> validateStoreNumber(int storeNumber) {
    List<ValidationError> errors = new ArrayList<>();
    validateStoreNumber(storeNumber, "storeNumber", errors);
    return toMono(errors);
  }

  /** Validate customer ID. */
  public Mono<Void> validateCustomerId(String customerId) {
    List<ValidationError> errors = new ArrayList<>();
    if (customerId == null || customerId.isBlank()) {
      errors.add(new ValidationError("customerId", "Required"));
    }
    return toMono(errors);
  }

  /** Validate order search request. */
  public Mono<Void> validateSearchRequest(OrderSearchRequest request) {
    List<ValidationError> errors = new ArrayList<>();

    if (request.storeNumber() != null) {
      validateStoreNumber(request.storeNumber(), "storeNumber", errors);
    }

    if (request.status() != null && !request.status().isBlank()) {
      try {
        OrderStatus.valueOf(request.status().toUpperCase());
      } catch (IllegalArgumentException e) {
        errors.add(new ValidationError("status", "Invalid status value"));
      }
    }

    if (request.startDate() != null
        && request.endDate() != null
        && request.startDate().isAfter(request.endDate())) {
      errors.add(new ValidationError("dateRange", "Start date must be before end date"));
    }

    if (request.size() != null && (request.size() < 1 || request.size() > 100)) {
      errors.add(new ValidationError("size", "Must be between 1 and 100"));
    }

    if (request.page() != null && request.page() < 0) {
      errors.add(new ValidationError("page", "Must be non-negative"));
    }

    return toMono(errors);
  }

  /** Validate status for update. */
  public Mono<Void> validateStatus(String status) {
    List<ValidationError> errors = new ArrayList<>();
    if (status == null || status.isBlank()) {
      errors.add(new ValidationError("status", "Required"));
    } else {
      try {
        OrderStatus.valueOf(status.toUpperCase());
      } catch (IllegalArgumentException e) {
        errors.add(new ValidationError("status", "Invalid status value"));
      }
    }
    return toMono(errors);
  }

  // ==================== Helper Methods ====================

  private void validateUuid(String value, String field, List<ValidationError> errors) {
    if (value == null || value.isBlank()) {
      errors.add(new ValidationError(field, "Required"));
    } else if (!UUID_PATTERN.matcher(value).matches()) {
      errors.add(new ValidationError(field, "Must be a valid UUID"));
    }
  }

  private void validateStoreNumber(int value, String field, List<ValidationError> errors) {
    if (value < STORE_NUMBER_MIN || value > STORE_NUMBER_MAX) {
      errors.add(
          new ValidationError(
              field, "Must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
    }
  }

  private Mono<Void> toMono(List<ValidationError> errors) {
    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }
}
