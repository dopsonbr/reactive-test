package org.example.cart.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Represents a shopping cart. */
public record Cart(
        String id, String userId, List<CartItem> items, Instant createdAt, Instant updatedAt) {
    /** Calculate the total price of all items in the cart. */
    public BigDecimal total() {
        return items.stream().map(CartItem::total).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Get the total number of items in the cart. */
    public int itemCount() {
        return items.stream().mapToInt(CartItem::quantity).sum();
    }
}
