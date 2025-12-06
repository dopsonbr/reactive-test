package org.example.order.model;

/** Fulfillment type for order delivery. */
public enum FulfillmentType {
  /** Immediate in-store pickup - customer takes items now. */
  IMMEDIATE,

  /** Will-call - customer picks up at a future date/time. */
  WILL_CALL,

  /** Delivery - items shipped to customer address. */
  DELIVERY
}
