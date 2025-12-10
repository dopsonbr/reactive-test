package org.example.product.validation;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class ProductRequestValidator {

  private static final long SKU_MIN = 100_000L;
  private static final long SKU_MAX = 999_999_999_999L;
  private static final int STORE_NUMBER_MIN = 1;
  private static final int STORE_NUMBER_MAX = 2000;

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

  public Mono<Void> validateProductRequest(
      long sku, int storeNumber, String orderNumber, String userId, String sessionId) {

    List<ValidationError> errors = new ArrayList<>();

    if (sku < SKU_MIN || sku > SKU_MAX) {
      errors.add(
          new ValidationError(
              "sku", "SKU must be between " + SKU_MIN + " and " + SKU_MAX + " (6-12 digits)"));
    }

    if (storeNumber < STORE_NUMBER_MIN || storeNumber > STORE_NUMBER_MAX) {
      errors.add(
          new ValidationError(
              "x-store-number",
              "Store number must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
    }

    // Order number is optional, but if provided must be a valid UUID
    if (orderNumber != null
        && !orderNumber.isEmpty()
        && !UUID_PATTERN.matcher(orderNumber).matches()) {
      errors.add(new ValidationError("x-order-number", "Order number must be a valid UUID"));
    }

    if (userId == null || !USER_ID_PATTERN.matcher(userId).matches()) {
      errors.add(
          new ValidationError(
              "x-userid",
              "User ID must be 1-50 alphanumeric characters (hyphens/underscores allowed)"));
    }

    // Session ID can be UUID or kiosk-style identifier
    if (sessionId == null
        || (!UUID_PATTERN.matcher(sessionId).matches()
            && !SESSION_ID_PATTERN.matcher(sessionId).matches())) {
      errors.add(
          new ValidationError(
              "x-sessionid",
              "Session ID must be a valid UUID or identifier (1-50 alphanumeric chars)"));
    }

    if (!errors.isEmpty()) {
      return Mono.error(new ValidationException(errors));
    }

    return Mono.empty();
  }
}
