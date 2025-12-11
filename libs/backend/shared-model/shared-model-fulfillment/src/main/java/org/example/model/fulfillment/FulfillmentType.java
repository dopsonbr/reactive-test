package org.example.model.fulfillment;

/**
 * Types of fulfillment options available. This is a placeholder for a complex model with B2B/B2C
 * omnichannel fulfillment options.
 */
public enum FulfillmentType {
  /** Home delivery */
  DELIVERY,
  /** Store pickup (same day or scheduled) */
  PICKUP,
  /** Hold for customer with scheduled pickup window */
  WILL_CALL,
  /** Professional installation service */
  INSTALLATION
}
