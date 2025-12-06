package org.example.order.graphql;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.example.order.graphql.input.OrderSearchInput;
import org.example.order.graphql.input.UpdateFulfillmentInput;
import org.example.order.model.OrderStatus;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Validates GraphQL inputs. Collects all errors before returning (not fail-fast). */
@Component
public class GraphQLInputValidator {

  private static final int STORE_NUMBER_MIN = 1;
  private static final int STORE_NUMBER_MAX = 2000;
  private static final Pattern UUID_PATTERN =
      Pattern.compile(
          "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

  /** Validate order ID. */
  public Mono<Void> validateOrderId(String id) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(id, "id", errors);
    return toMono(errors);
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

  /** Validate pagination parameters for orders query. */
  public Mono<Void> validatePagination(Integer limit, Integer offset) {
    List<ValidationError> errors = new ArrayList<>();

    if (limit != null && (limit < 1 || limit > 100)) {
      errors.add(new ValidationError("limit", "Must be between 1 and 100"));
    }

    if (offset != null && offset < 0) {
      errors.add(new ValidationError("offset", "Must be non-negative"));
    }

    return toMono(errors);
  }

  /** Validate order search input. */
  public Mono<Void> validateOrderSearch(OrderSearchInput input) {
    List<ValidationError> errors = new ArrayList<>();
    validateStoreNumber(input.storeNumber(), "storeNumber", errors);

    if (input.limit() != null && (input.limit() < 1 || input.limit() > 100)) {
      errors.add(new ValidationError("limit", "Must be between 1 and 100"));
    }

    if (input.offset() != null && input.offset() < 0) {
      errors.add(new ValidationError("offset", "Must be non-negative"));
    }

    return toMono(errors);
  }

  /** Validate update status input. */
  public Mono<Void> validateUpdateStatus(String id, OrderStatus status) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(id, "id", errors);

    if (status == null) {
      errors.add(new ValidationError("status", "Required"));
    }

    return toMono(errors);
  }

  /** Validate update fulfillment input. */
  public Mono<Void> validateUpdateFulfillment(String id, UpdateFulfillmentInput input) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(id, "id", errors);

    // At least one field should be provided
    if (input == null
        || (input.fulfillmentDate() == null
            && input.trackingNumber() == null
            && input.carrier() == null
            && input.instructions() == null)) {
      errors.add(new ValidationError("input", "At least one field must be provided"));
    }

    return toMono(errors);
  }

  /** Validate cancel order. */
  public Mono<Void> validateCancelOrder(String id, String reason) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(id, "id", errors);

    if (reason == null || reason.isBlank()) {
      errors.add(new ValidationError("reason", "Required"));
    }

    return toMono(errors);
  }

  /** Validate add note. */
  public Mono<Void> validateAddNote(String id, String note) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(id, "id", errors);

    if (note == null || note.isBlank()) {
      errors.add(new ValidationError("note", "Required"));
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
