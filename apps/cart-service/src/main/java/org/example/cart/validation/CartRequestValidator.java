package org.example.cart.validation;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.example.cart.dto.AddFulfillmentRequest;
import org.example.cart.dto.AddProductRequest;
import org.example.cart.dto.ApplyDiscountRequest;
import org.example.cart.dto.CreateCartRequest;
import org.example.cart.dto.UpdateFulfillmentRequest;
import org.example.cart.dto.UpdateProductRequest;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Validator for cart requests.
 *
 * <p>Collects ALL validation errors before returning, allowing clients to fix all issues in a
 * single iteration.
 */
@Component
public class CartRequestValidator {

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

  // ==================== Cart Lifecycle Validation ====================

  /** Validate create cart request. */
  public Mono<Void> validateCreateCart(
      CreateCartRequest request,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    if (request == null) {
      errors.add(new ValidationError("body", "Request body is required"));
    } else {
      if (request.storeNumber() < STORE_NUMBER_MIN || request.storeNumber() > STORE_NUMBER_MAX) {
        errors.add(
            new ValidationError(
                "storeNumber",
                "Store number must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
      }
    }

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate get cart request. */
  public Mono<Void> validateGetCart(
      String cartId, int storeNumber, String orderNumber, String userId, String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCartId(cartId, errors);
    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate find carts request. */
  public Mono<Void> validateFindCarts(
      int queryStoreNumber, int storeNumber, String orderNumber, String userId, String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    if (queryStoreNumber < STORE_NUMBER_MIN || queryStoreNumber > STORE_NUMBER_MAX) {
      errors.add(
          new ValidationError(
              "storeNumber",
              "Store number must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
    }

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate find carts by customer ID request. */
  public Mono<Void> validateFindCartsByCustomerId(
      String customerId, int storeNumber, String orderNumber, String userId, String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    if (customerId == null || customerId.isBlank()) {
      errors.add(new ValidationError("customerId", "Customer ID is required"));
    }

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  // ==================== Product Validation ====================

  /** Validate add product request. */
  public Mono<Void> validateAddProduct(
      String cartId,
      AddProductRequest request,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCartId(cartId, errors);

    if (request == null) {
      errors.add(new ValidationError("body", "Request body is required"));
    } else {
      validateSku(request.sku(), errors);
      validateQuantity(request.quantity(), errors);
    }

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate update product request. */
  public Mono<Void> validateUpdateProduct(
      String cartId,
      long sku,
      UpdateProductRequest request,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCartId(cartId, errors);
    validateSku(sku, errors);

    if (request == null) {
      errors.add(new ValidationError("body", "Request body is required"));
    } else {
      validateQuantity(request.quantity(), errors);
    }

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate get/remove product request. */
  public Mono<Void> validateProductAccess(
      String cartId,
      long sku,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCartId(cartId, errors);
    validateSku(sku, errors);
    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  // ==================== Discount Validation ====================

  /** Validate apply discount request. */
  public Mono<Void> validateApplyDiscount(
      String cartId,
      ApplyDiscountRequest request,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCartId(cartId, errors);

    if (request == null) {
      errors.add(new ValidationError("body", "Request body is required"));
    } else if (request.code() == null || request.code().isBlank()) {
      errors.add(new ValidationError("code", "Discount code is required"));
    }

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate discount access request. */
  public Mono<Void> validateDiscountAccess(
      String cartId,
      String discountId,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCartId(cartId, errors);
    validateDiscountId(discountId, errors);
    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  // ==================== Fulfillment Validation ====================

  /** Validate add fulfillment request. */
  public Mono<Void> validateAddFulfillment(
      String cartId,
      AddFulfillmentRequest request,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCartId(cartId, errors);

    if (request == null) {
      errors.add(new ValidationError("body", "Request body is required"));
    } else {
      if (request.type() == null) {
        errors.add(new ValidationError("type", "Fulfillment type is required"));
      }
      if (request.skus() == null || request.skus().isEmpty()) {
        errors.add(new ValidationError("skus", "At least one SKU is required"));
      } else {
        for (int i = 0; i < request.skus().size(); i++) {
          if (request.skus().get(i) < SKU_MIN || request.skus().get(i) > SKU_MAX) {
            errors.add(
                new ValidationError(
                    "skus[" + i + "]", "SKU must be between " + SKU_MIN + " and " + SKU_MAX));
          }
        }
      }
    }

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate update fulfillment request. */
  public Mono<Void> validateUpdateFulfillment(
      String cartId,
      String fulfillmentId,
      UpdateFulfillmentRequest request,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCartId(cartId, errors);
    validateFulfillmentId(fulfillmentId, errors);

    if (request == null) {
      errors.add(new ValidationError("body", "Request body is required"));
    } else {
      if (request.type() == null) {
        errors.add(new ValidationError("type", "Fulfillment type is required"));
      }
      if (request.skus() == null || request.skus().isEmpty()) {
        errors.add(new ValidationError("skus", "At least one SKU is required"));
      }
    }

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate fulfillment access request. */
  public Mono<Void> validateFulfillmentAccess(
      String cartId,
      String fulfillmentId,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCartId(cartId, errors);
    validateFulfillmentId(fulfillmentId, errors);
    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  // ==================== Common Validation Helpers ====================

  private void validateCartId(String cartId, List<ValidationError> errors) {
    if (cartId == null || cartId.isBlank()) {
      errors.add(new ValidationError("cartId", "Cart ID is required"));
    } else if (!UUID_PATTERN.matcher(cartId).matches()) {
      errors.add(new ValidationError("cartId", "Cart ID must be a valid UUID"));
    }
  }

  private void validateSku(long sku, List<ValidationError> errors) {
    if (sku < SKU_MIN || sku > SKU_MAX) {
      errors.add(new ValidationError("sku", "SKU must be between " + SKU_MIN + " and " + SKU_MAX));
    }
  }

  private void validateQuantity(int quantity, List<ValidationError> errors) {
    if (quantity < QUANTITY_MIN || quantity > QUANTITY_MAX) {
      errors.add(
          new ValidationError(
              "quantity", "Quantity must be between " + QUANTITY_MIN + " and " + QUANTITY_MAX));
    }
  }

  private void validateDiscountId(String discountId, List<ValidationError> errors) {
    if (discountId == null || discountId.isBlank()) {
      errors.add(new ValidationError("discountId", "Discount ID is required"));
    }
  }

  private void validateFulfillmentId(String fulfillmentId, List<ValidationError> errors) {
    if (fulfillmentId == null || fulfillmentId.isBlank()) {
      errors.add(new ValidationError("fulfillmentId", "Fulfillment ID is required"));
    } else if (!UUID_PATTERN.matcher(fulfillmentId).matches()) {
      errors.add(new ValidationError("fulfillmentId", "Fulfillment ID must be a valid UUID"));
    }
  }

  private void validateCommonHeaders(
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId,
      List<ValidationError> errors) {

    if (storeNumber < STORE_NUMBER_MIN || storeNumber > STORE_NUMBER_MAX) {
      errors.add(
          new ValidationError(
              "x-store-number",
              "Store number must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
    }

    if (orderNumber == null || !UUID_PATTERN.matcher(orderNumber).matches()) {
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
  }
}
