package org.example.platform.audit;

/** Common audit event type constants. */
public final class AuditEventType {

  // Cart events
  public static final String CART_CREATED = "CART_CREATED";
  public static final String CART_DELETED = "CART_DELETED";
  public static final String CART_VIEWED = "CART_VIEWED";
  public static final String PRODUCT_ADDED = "PRODUCT_ADDED";
  public static final String PRODUCT_UPDATED = "PRODUCT_UPDATED";
  public static final String PRODUCT_REMOVED = "PRODUCT_REMOVED";
  public static final String CUSTOMER_SET = "CUSTOMER_SET";
  public static final String CUSTOMER_REMOVED = "CUSTOMER_REMOVED";
  public static final String DISCOUNT_APPLIED = "DISCOUNT_APPLIED";
  public static final String DISCOUNT_REMOVED = "DISCOUNT_REMOVED";
  public static final String FULFILLMENT_ADDED = "FULFILLMENT_ADDED";
  public static final String FULFILLMENT_UPDATED = "FULFILLMENT_UPDATED";
  public static final String FULFILLMENT_REMOVED = "FULFILLMENT_REMOVED";

  // Product events
  public static final String PRODUCT_VIEWED = "PRODUCT_VIEWED";
  public static final String PRODUCT_SEARCHED = "PRODUCT_SEARCHED";

  // Order events (future)
  public static final String ORDER_CREATED = "ORDER_CREATED";
  public static final String ORDER_UPDATED = "ORDER_UPDATED";
  public static final String ORDER_CANCELLED = "ORDER_CANCELLED";
  public static final String ORDER_COMPLETED = "ORDER_COMPLETED";

  // Payment events (future)
  public static final String PAYMENT_INITIATED = "PAYMENT_INITIATED";
  public static final String PAYMENT_COMPLETED = "PAYMENT_COMPLETED";
  public static final String PAYMENT_FAILED = "PAYMENT_FAILED";
  public static final String PAYMENT_REFUNDED = "PAYMENT_REFUNDED";

  private AuditEventType() {
    // Prevent instantiation
  }
}
