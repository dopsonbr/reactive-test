package org.example.model.order;

/** Type of order fulfillment. */
public enum FulfillmentType {
  /** Delivery - items shipped to customer address. */
  DELIVERY,

  /** Pickup - customer picks up at store (general). */
  PICKUP,

  /** Will-call - customer picks up at a future scheduled date/time. */
  WILL_CALL,

  /** Immediate - customer takes items now (in-store self-checkout). */
  IMMEDIATE
}
