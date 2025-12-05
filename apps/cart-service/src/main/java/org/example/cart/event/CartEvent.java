package org.example.cart.event;

import java.time.Instant;
import org.example.cart.model.Cart;

/** Event published when a cart is modified. Contains complete cart state for subscriber context. */
public record CartEvent(CartEventType eventType, String cartId, Cart cart, Instant timestamp) {
  public static CartEvent of(CartEventType type, Cart cart) {
    return new CartEvent(type, cart.id(), cart, Instant.now());
  }
}
