package org.example.checkout.validation;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.example.checkout.client.CartServiceClient.CartDetails;
import org.example.checkout.client.CartServiceClient.CartItem;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Validator for cart state at checkout time.
 *
 * <p>Validates that the cart is in a valid state for checkout.
 */
@Component
public class CartValidator {

  private static final int QUANTITY_MIN = 1;
  private static final int QUANTITY_MAX = 999;

  /**
   * Validate that a cart is ready for checkout.
   *
   * @param cart the cart to validate
   * @param storeNumber the expected store number
   * @return empty mono on success, error on validation failure
   */
  public Mono<Void> validateForCheckout(CartDetails cart, int storeNumber) {
    List<ValidationError> errors = new ArrayList<>();

    if (cart == null) {
      errors.add(new ValidationError("cart", "Cart not found"));
      return Mono.error(new ValidationException(errors));
    }

    // Validate cart belongs to store
    if (cart.storeNumber() != storeNumber) {
      errors.add(
          new ValidationError("cart.storeNumber", "Cart does not belong to the specified store"));
    }

    // Validate cart has items
    if (cart.items() == null || cart.items().isEmpty()) {
      errors.add(new ValidationError("cart.items", "Cart must have at least one item"));
    } else {
      validateCartItems(cart.items(), errors);
    }

    // Validate totals
    if (cart.totals() == null) {
      errors.add(new ValidationError("cart.totals", "Cart totals are missing"));
    } else {
      if (cart.totals().grandTotal() == null
          || cart.totals().grandTotal().compareTo(BigDecimal.ZERO) <= 0) {
        errors.add(new ValidationError("cart.totals.grandTotal", "Cart total must be greater than zero"));
      }
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  private void validateCartItems(List<CartItem> items, List<ValidationError> errors) {
    for (int i = 0; i < items.size(); i++) {
      CartItem item = items.get(i);
      String prefix = "cart.items[" + i + "]";

      // Validate quantity
      if (item.quantity() < QUANTITY_MIN || item.quantity() > QUANTITY_MAX) {
        errors.add(
            new ValidationError(
                prefix + ".quantity",
                "Quantity must be between " + QUANTITY_MIN + " and " + QUANTITY_MAX));
      }

      // Validate price
      if (item.unitPrice() == null || item.unitPrice().compareTo(BigDecimal.ZERO) <= 0) {
        errors.add(new ValidationError(prefix + ".unitPrice", "Unit price must be greater than zero"));
      }

      // Validate SKU
      if (item.sku() == null || item.sku() <= 0) {
        errors.add(new ValidationError(prefix + ".sku", "Valid SKU is required"));
      }
    }
  }
}
