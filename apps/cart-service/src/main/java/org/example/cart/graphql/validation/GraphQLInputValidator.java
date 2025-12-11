package org.example.cart.graphql.validation;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.example.cart.graphql.input.AddFulfillmentInput;
import org.example.cart.graphql.input.AddProductInput;
import org.example.cart.graphql.input.ApplyDiscountInput;
import org.example.cart.graphql.input.CreateCartInput;
import org.example.cart.graphql.input.SetCustomerInput;
import org.example.cart.graphql.input.UpdateFulfillmentInput;
import org.example.cart.graphql.input.UpdateProductInput;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.example.platform.webflux.context.RequestMetadata;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Validates GraphQL inputs using the same rules as REST validation. Collects all errors before
 * returning (not fail-fast).
 */
@Component
public class GraphQLInputValidator {

  private static final int STORE_NUMBER_MIN = 1;
  private static final int STORE_NUMBER_MAX = 2000;
  private static final int QUANTITY_MIN = 1;
  private static final int QUANTITY_MAX = 999;
  private static final long SKU_MIN = 100_000L;
  private static final long SKU_MAX = 999_999_999_999L;
  private static final Pattern UUID_PATTERN =
      Pattern.compile(
          "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
  // User ID: 6 alphanumeric chars (human users) OR 1-50 alphanumeric with hyphens (service
  // accounts)
  private static final Pattern USER_ID_PATTERN =
      Pattern.compile("^[a-zA-Z0-9][a-zA-Z0-9_-]{0,49}$");
  // Session ID: UUID OR kiosk-style identifier (e.g., KIOSK-001)
  private static final Pattern SESSION_ID_PATTERN =
      Pattern.compile("^[a-zA-Z0-9][a-zA-Z0-9_-]{0,49}$");
  private static final Pattern EMAIL_PATTERN =
      Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

  // ─────────────────────────────────────────────────────────────────
  // Request Metadata Validation (Headers)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Validates request metadata extracted from HTTP headers.
   *
   * <p>This method validates all required headers for GraphQL operations, matching the REST
   * validation behavior. Errors are aggregated and returned together.
   *
   * @param metadata the RequestMetadata populated by GraphQlContextInterceptor
   * @return Mono.empty() if valid, Mono.error(ValidationException) with all errors if invalid
   */
  public Mono<Void> validateMetadata(RequestMetadata metadata) {
    List<ValidationError> errors = new ArrayList<>();

    // x-store-number: required, 1-2000
    if (metadata.storeNumber() < STORE_NUMBER_MIN || metadata.storeNumber() > STORE_NUMBER_MAX) {
      errors.add(
          new ValidationError(
              "x-store-number",
              "Must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
    }

    // x-order-number: required, UUID format
    if (metadata.orderNumber() == null
        || metadata.orderNumber().isBlank()
        || !UUID_PATTERN.matcher(metadata.orderNumber()).matches()) {
      errors.add(new ValidationError("x-order-number", "Must be a valid UUID"));
    }

    // x-userid: required, 1-50 alphanumeric characters (hyphens/underscores allowed)
    if (metadata.userId() == null
        || metadata.userId().isBlank()
        || !USER_ID_PATTERN.matcher(metadata.userId()).matches()) {
      errors.add(
          new ValidationError(
              "x-userid", "Must be 1-50 alphanumeric characters (hyphens/underscores allowed)"));
    }

    // x-sessionid: required, UUID or kiosk-style identifier
    if (metadata.sessionId() == null
        || metadata.sessionId().isBlank()
        || (!UUID_PATTERN.matcher(metadata.sessionId()).matches()
            && !SESSION_ID_PATTERN.matcher(metadata.sessionId()).matches())) {
      errors.add(
          new ValidationError(
              "x-sessionid", "Must be a valid UUID or identifier (1-50 alphanumeric chars)"));
    }

    return toMono(errors);
  }

  // ─────────────────────────────────────────────────────────────────
  // Cart Operations
  // ─────────────────────────────────────────────────────────────────

  public Mono<Void> validateCreateCart(CreateCartInput input) {
    List<ValidationError> errors = new ArrayList<>();
    validateStoreNumber(input.storeNumber(), "storeNumber", errors);
    // customerId is optional
    return toMono(errors);
  }

  public Mono<Void> validateCartId(String cartId) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(cartId, "cartId", errors);
    return toMono(errors);
  }

  public Mono<Void> validateStoreNumber(int storeNumber) {
    List<ValidationError> errors = new ArrayList<>();
    validateStoreNumber(storeNumber, "storeNumber", errors);
    return toMono(errors);
  }

  public Mono<Void> validateCustomerId(String customerId) {
    List<ValidationError> errors = new ArrayList<>();
    validateNotBlank(customerId, "customerId", errors);
    return toMono(errors);
  }

  // ─────────────────────────────────────────────────────────────────
  // Product Operations
  // ─────────────────────────────────────────────────────────────────

  public Mono<Void> validateAddProduct(String cartId, AddProductInput input) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(cartId, "cartId", errors);
    validateSku(input.sku(), "input.sku", errors);
    validateQuantity(input.quantity(), "input.quantity", errors);
    return toMono(errors);
  }

  public Mono<Void> validateUpdateProduct(String cartId, String sku, UpdateProductInput input) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(cartId, "cartId", errors);
    validateSkuString(sku, "sku", errors);
    validateQuantity(input.quantity(), "input.quantity", errors);
    return toMono(errors);
  }

  public Mono<Void> validateProductAccess(String cartId, String sku) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(cartId, "cartId", errors);
    validateSkuString(sku, "sku", errors);
    return toMono(errors);
  }

  // ─────────────────────────────────────────────────────────────────
  // Discount Operations
  // ─────────────────────────────────────────────────────────────────

  public Mono<Void> validateApplyDiscount(String cartId, ApplyDiscountInput input) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(cartId, "cartId", errors);
    validateNotBlank(input.code(), "input.code", errors);
    return toMono(errors);
  }

  public Mono<Void> validateDiscountAccess(String cartId, String discountId) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(cartId, "cartId", errors);
    validateUuid(discountId, "discountId", errors);
    return toMono(errors);
  }

  // ─────────────────────────────────────────────────────────────────
  // Fulfillment Operations
  // ─────────────────────────────────────────────────────────────────

  public Mono<Void> validateAddFulfillment(String cartId, AddFulfillmentInput input) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(cartId, "cartId", errors);
    if (input.type() == null) {
      errors.add(new ValidationError("input.type", "Required"));
    }
    validateSkuList(input.skus(), "input.skus", errors);
    return toMono(errors);
  }

  public Mono<Void> validateUpdateFulfillment(
      String cartId, String fulfillmentId, UpdateFulfillmentInput input) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(cartId, "cartId", errors);
    validateUuid(fulfillmentId, "fulfillmentId", errors);
    if (input.type() == null) {
      errors.add(new ValidationError("input.type", "Required"));
    }
    validateSkuList(input.skus(), "input.skus", errors);
    return toMono(errors);
  }

  public Mono<Void> validateFulfillmentAccess(String cartId, String fulfillmentId) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(cartId, "cartId", errors);
    validateUuid(fulfillmentId, "fulfillmentId", errors);
    return toMono(errors);
  }

  // ─────────────────────────────────────────────────────────────────
  // Customer Operations
  // ─────────────────────────────────────────────────────────────────

  public Mono<Void> validateSetCustomer(String cartId, SetCustomerInput input) {
    List<ValidationError> errors = new ArrayList<>();
    validateUuid(cartId, "cartId", errors);
    validateNotBlank(input.customerId(), "input.customerId", errors);
    validateNotBlank(input.name(), "input.name", errors);
    validateEmail(input.email(), "input.email", errors);
    return toMono(errors);
  }

  // ─────────────────────────────────────────────────────────────────
  // Validation Helpers
  // ─────────────────────────────────────────────────────────────────

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

  private void validateSku(String value, String field, List<ValidationError> errors) {
    if (value == null || value.isBlank()) {
      errors.add(new ValidationError(field, "Required"));
      return;
    }
    try {
      long sku = Long.parseLong(value);
      if (sku < SKU_MIN || sku > SKU_MAX) {
        errors.add(new ValidationError(field, "Must be between " + SKU_MIN + " and " + SKU_MAX));
      }
    } catch (NumberFormatException e) {
      errors.add(new ValidationError(field, "Must be a valid number"));
    }
  }

  private void validateSkuString(String value, String field, List<ValidationError> errors) {
    validateSku(value, field, errors);
  }

  private void validateSkuList(List<String> skus, String field, List<ValidationError> errors) {
    if (skus == null || skus.isEmpty()) {
      errors.add(new ValidationError(field, "At least one SKU required"));
      return;
    }
    for (int i = 0; i < skus.size(); i++) {
      validateSku(skus.get(i), field + "[" + i + "]", errors);
    }
  }

  private void validateQuantity(int value, String field, List<ValidationError> errors) {
    if (value < QUANTITY_MIN || value > QUANTITY_MAX) {
      errors.add(
          new ValidationError(field, "Must be between " + QUANTITY_MIN + " and " + QUANTITY_MAX));
    }
  }

  private void validateNotBlank(String value, String field, List<ValidationError> errors) {
    if (value == null || value.isBlank()) {
      errors.add(new ValidationError(field, "Required"));
    }
  }

  private void validateEmail(String value, String field, List<ValidationError> errors) {
    if (value == null || value.isBlank()) {
      errors.add(new ValidationError(field, "Required"));
    } else if (!EMAIL_PATTERN.matcher(value).matches()) {
      errors.add(new ValidationError(field, "Must be a valid email address"));
    }
  }

  private Mono<Void> toMono(List<ValidationError> errors) {
    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }
}
