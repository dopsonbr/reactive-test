package org.example.model.discount;

/** Defines the scope of a discount - what part of the order it applies to. */
public enum DiscountScope {
  /** Applies to entire cart subtotal */
  CART,
  /** Applies to specific items */
  ITEM,
  /** Applies to shipping cost */
  SHIPPING
}
