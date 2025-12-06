package org.example.discount.validation;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.example.discount.controller.DiscountController.CalculateDiscountRequest;
import org.example.discount.controller.dto.ApplyMarkdownRequest;
import org.example.discount.controller.dto.PricingRequest;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Validator for discount service requests.
 *
 * <p>Collects ALL validation errors before returning, allowing clients to fix all issues in a
 * single iteration.
 */
@Component
public class DiscountRequestValidator {

  private static final int STORE_NUMBER_MIN = 1;
  private static final int STORE_NUMBER_MAX = 2000;

  private static final Pattern UUID_PATTERN =
      Pattern.compile(
          "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
  private static final Pattern USER_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9]{6}$");

  // ==================== Discount Validation ====================

  /** Validate discount code query. */
  public Mono<Void> validateDiscountCode(String code, int storeNumber) {
    List<ValidationError> errors = new ArrayList<>();

    if (code == null || code.isBlank()) {
      errors.add(new ValidationError("code", "Discount code is required"));
    }

    validateStoreNumberInternal(storeNumber, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate store number only (for endpoints that don't require a discount code). */
  public Mono<Void> validateStoreNumber(int storeNumber) {
    List<ValidationError> errors = new ArrayList<>();
    validateStoreNumberInternal(storeNumber, errors);
    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate calculate discount request. */
  public Mono<Void> validateCalculateDiscount(CalculateDiscountRequest request) {
    List<ValidationError> errors = new ArrayList<>();

    if (request == null) {
      errors.add(new ValidationError("body", "Request body is required"));
      return Mono.error(new ValidationException(errors));
    }

    if (request.code() == null || request.code().isBlank()) {
      errors.add(new ValidationError("code", "Discount code is required"));
    }

    if (request.subtotal() == null || request.subtotal().isBlank()) {
      errors.add(new ValidationError("subtotal", "Subtotal is required"));
    } else {
      try {
        BigDecimal subtotal = new BigDecimal(request.subtotal());
        if (subtotal.compareTo(BigDecimal.ZERO) < 0) {
          errors.add(new ValidationError("subtotal", "Subtotal must be non-negative"));
        }
      } catch (NumberFormatException e) {
        errors.add(new ValidationError("subtotal", "Subtotal must be a valid decimal number"));
      }
    }

    if (request.storeNumber() != null) {
      validateStoreNumberInternal(request.storeNumber(), errors);
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  // ==================== Pricing Validation ====================

  /** Validate pricing request. */
  public Mono<Void> validatePricingRequest(PricingRequest request) {
    List<ValidationError> errors = new ArrayList<>();

    if (request == null) {
      errors.add(new ValidationError("body", "Request body is required"));
      return Mono.error(new ValidationException(errors));
    }

    if (request.storeNumber() < STORE_NUMBER_MIN || request.storeNumber() > STORE_NUMBER_MAX) {
      errors.add(
          new ValidationError(
              "storeNumber",
              "Store number must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
    }

    if (request.items() == null || request.items().isEmpty()) {
      errors.add(new ValidationError("items", "At least one cart item is required"));
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  // ==================== Markdown Validation ====================

  /** Validate apply markdown request. */
  public Mono<Void> validateApplyMarkdown(ApplyMarkdownRequest request, String userId) {
    List<ValidationError> errors = new ArrayList<>();

    validateUserId(userId, errors);

    if (request == null) {
      errors.add(new ValidationError("body", "Request body is required"));
      return Mono.error(new ValidationException(errors));
    }

    validateStoreNumberInternal(request.storeNumber(), errors);

    if (request.value() == null || request.value().compareTo(BigDecimal.ZERO) <= 0) {
      errors.add(new ValidationError("value", "Markdown value must be positive"));
    }

    if (request.type() == null) {
      errors.add(new ValidationError("type", "Markdown type is required"));
    }

    if (request.reason() == null) {
      errors.add(new ValidationError("reason", "Markdown reason is required"));
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate markdown ID. */
  public Mono<Void> validateMarkdownId(String markdownId) {
    List<ValidationError> errors = new ArrayList<>();

    if (markdownId == null || markdownId.isBlank()) {
      errors.add(new ValidationError("id", "Markdown ID is required"));
    } else if (!isValidUuid(markdownId)) {
      errors.add(new ValidationError("id", "Markdown ID must be a valid UUID"));
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate void markdown request. */
  public Mono<Void> validateVoidMarkdown(String markdownId, String userId) {
    List<ValidationError> errors = new ArrayList<>();

    if (markdownId == null || markdownId.isBlank()) {
      errors.add(new ValidationError("id", "Markdown ID is required"));
    } else if (!isValidUuid(markdownId)) {
      errors.add(new ValidationError("id", "Markdown ID must be a valid UUID"));
    }

    validateUserId(userId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate cart ID for markdown lookup. */
  public Mono<Void> validateCartId(String cartId) {
    List<ValidationError> errors = new ArrayList<>();

    if (cartId == null || cartId.isBlank()) {
      errors.add(new ValidationError("cartId", "Cart ID is required"));
    } else if (!isValidUuid(cartId)) {
      errors.add(new ValidationError("cartId", "Cart ID must be a valid UUID"));
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  // ==================== Common Validation Helpers ====================

  private void validateStoreNumberInternal(int storeNumber, List<ValidationError> errors) {
    if (storeNumber < STORE_NUMBER_MIN || storeNumber > STORE_NUMBER_MAX) {
      errors.add(
          new ValidationError(
              "storeNumber",
              "Store number must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
    }
  }

  private void validateUserId(String userId, List<ValidationError> errors) {
    if (userId == null || userId.isBlank()) {
      errors.add(new ValidationError("x-userid", "User ID header is required"));
    } else if (!USER_ID_PATTERN.matcher(userId).matches()) {
      errors.add(new ValidationError("x-userid", "User ID must be 6 alphanumeric characters"));
    }
  }

  private boolean isValidUuid(String value) {
    return value != null && UUID_PATTERN.matcher(value).matches();
  }
}
