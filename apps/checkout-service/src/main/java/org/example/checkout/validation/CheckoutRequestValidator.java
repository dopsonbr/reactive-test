package org.example.checkout.validation;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.example.checkout.dto.CompleteCheckoutRequest;
import org.example.checkout.dto.InitiateCheckoutRequest;
import org.example.checkout.model.FulfillmentType;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Validator for checkout requests.
 *
 * <p>Collects ALL validation errors before returning, allowing clients to fix all issues in a
 * single iteration.
 */
@Component
public class CheckoutRequestValidator {

  private static final int STORE_NUMBER_MIN = 1;
  private static final int STORE_NUMBER_MAX = 2000;

  private static final Pattern UUID_PATTERN =
      Pattern.compile(
          "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
  private static final Pattern USER_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9]{6}$");

  /**
   * Validate initiate checkout request.
   *
   * @param request the request
   * @param storeNumber store number header
   * @param orderNumber order number header
   * @param userId user ID header
   * @param sessionId session ID header
   * @return empty mono on success, error on validation failure
   */
  public Mono<Void> validateInitiateCheckout(
      InitiateCheckoutRequest request,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    if (request == null) {
      errors.add(new ValidationError("body", "Request body is required"));
    } else {
      validateCartId(request.cartId(), errors);
      validateFulfillmentType(request.fulfillmentType(), errors);

      // WILL_CALL requires future fulfillment date
      if (request.fulfillmentType() == FulfillmentType.WILL_CALL) {
        if (request.fulfillmentDate() == null) {
          errors.add(
              new ValidationError("fulfillmentDate", "Fulfillment date is required for WILL_CALL"));
        } else if (request.fulfillmentDate().isBefore(Instant.now())) {
          errors.add(
              new ValidationError("fulfillmentDate", "Fulfillment date must be in the future"));
        }
      }

      // DELIVERY requires delivery address
      if (request.fulfillmentType() == FulfillmentType.DELIVERY) {
        if (request.deliveryAddress() == null) {
          errors.add(
              new ValidationError("deliveryAddress", "Delivery address is required for DELIVERY"));
        } else {
          validateDeliveryAddress(request.deliveryAddress(), errors);
        }
      }
    }

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /**
   * Validate complete checkout request.
   *
   * @param request the request
   * @param storeNumber store number header
   * @param orderNumber order number header
   * @param userId user ID header
   * @param sessionId session ID header
   * @return empty mono on success, error on validation failure
   */
  public Mono<Void> validateCompleteCheckout(
      CompleteCheckoutRequest request,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    if (request == null) {
      errors.add(new ValidationError("body", "Request body is required"));
    } else {
      if (request.checkoutSessionId() == null || request.checkoutSessionId().isBlank()) {
        errors.add(new ValidationError("checkoutSessionId", "Checkout session ID is required"));
      } else if (!UUID_PATTERN.matcher(request.checkoutSessionId()).matches()) {
        errors.add(
            new ValidationError("checkoutSessionId", "Checkout session ID must be a valid UUID"));
      }

      if (request.paymentMethod() == null || request.paymentMethod().isBlank()) {
        errors.add(new ValidationError("paymentMethod", "Payment method is required"));
      }

      // Payment details validation based on method
      if ("CARD".equalsIgnoreCase(request.paymentMethod())) {
        if (request.paymentDetails() == null) {
          errors.add(new ValidationError("paymentDetails", "Payment details required for CARD"));
        } else {
          if (request.paymentDetails().cardToken() == null
              || request.paymentDetails().cardToken().isBlank()) {
            errors.add(new ValidationError("paymentDetails.cardToken", "Card token is required"));
          }
        }
      }
    }

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /**
   * Validate get order request.
   *
   * @param orderId the order ID
   * @param storeNumber store number header
   * @param orderNumber order number header
   * @param userId user ID header
   * @param sessionId session ID header
   * @return empty mono on success, error on validation failure
   */
  public Mono<Void> validateGetOrder(
      String orderId, int storeNumber, String orderNumber, String userId, String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    if (orderId == null || orderId.isBlank()) {
      errors.add(new ValidationError("orderId", "Order ID is required"));
    } else if (!UUID_PATTERN.matcher(orderId).matches()) {
      errors.add(new ValidationError("orderId", "Order ID must be a valid UUID"));
    }

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /**
   * Validate list orders request.
   *
   * @param queryStoreNumber the store number to query
   * @param storeNumber store number header
   * @param orderNumber order number header
   * @param userId user ID header
   * @param sessionId session ID header
   * @return empty mono on success, error on validation failure
   */
  public Mono<Void> validateListOrders(
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

  // ==================== Validation Helpers ====================

  private void validateCartId(String cartId, List<ValidationError> errors) {
    if (cartId == null || cartId.isBlank()) {
      errors.add(new ValidationError("cartId", "Cart ID is required"));
    } else if (!UUID_PATTERN.matcher(cartId).matches()) {
      errors.add(new ValidationError("cartId", "Cart ID must be a valid UUID"));
    }
  }

  private void validateFulfillmentType(FulfillmentType type, List<ValidationError> errors) {
    if (type == null) {
      errors.add(new ValidationError("fulfillmentType", "Fulfillment type is required"));
    }
  }

  private void validateDeliveryAddress(
      org.example.checkout.model.DeliveryAddress address, List<ValidationError> errors) {
    if (address.street1() == null || address.street1().isBlank()) {
      errors.add(new ValidationError("deliveryAddress.street1", "Street address is required"));
    }
    if (address.city() == null || address.city().isBlank()) {
      errors.add(new ValidationError("deliveryAddress.city", "City is required"));
    }
    if (address.state() == null || address.state().isBlank()) {
      errors.add(new ValidationError("deliveryAddress.state", "State is required"));
    }
    if (address.postalCode() == null || address.postalCode().isBlank()) {
      errors.add(new ValidationError("deliveryAddress.postalCode", "Postal code is required"));
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
          new ValidationError("x-userid", "User ID must be exactly 6 alphanumeric characters"));
    }

    if (sessionId == null || !UUID_PATTERN.matcher(sessionId).matches()) {
      errors.add(new ValidationError("x-sessionid", "Session ID must be a valid UUID"));
    }
  }
}
