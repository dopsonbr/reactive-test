package org.example.order.model;

/** Order lifecycle status values. */
public enum OrderStatus {
  CREATED,
  CONFIRMED,
  PROCESSING,
  SHIPPED,
  DELIVERED,
  CANCELLED,
  REFUNDED
}
