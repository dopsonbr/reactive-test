package org.example.model.order;

/** Status of an order in the system. */
public enum OrderStatus {
  CREATED,
  PAID,
  PROCESSING,
  SHIPPED,
  DELIVERED,
  CANCELLED,
  REFUNDED
}
