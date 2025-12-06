package org.example.cart.event;

/** Types of cart events published to subscriptions. */
public enum CartEventType {
  CART_CREATED,
  CART_DELETED,
  PRODUCT_ADDED,
  PRODUCT_UPDATED,
  PRODUCT_REMOVED,
  DISCOUNT_APPLIED,
  DISCOUNT_REMOVED,
  FULFILLMENT_ADDED,
  FULFILLMENT_UPDATED,
  FULFILLMENT_REMOVED,
  CUSTOMER_SET,
  CUSTOMER_REMOVED
}
