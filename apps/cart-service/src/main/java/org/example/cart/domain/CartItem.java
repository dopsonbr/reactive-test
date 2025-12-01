package org.example.cart.domain;

import java.math.BigDecimal;

/**
 * Represents an item in a shopping cart.
 */
public record CartItem(
    String sku,
    int quantity,
    BigDecimal price
) {
    /**
     * Calculate the total price for this item (quantity * price).
     */
    public BigDecimal total() {
        return price.multiply(BigDecimal.valueOf(quantity));
    }
}
