package org.example.platform.audit;

/** Entity type constants for audit events. */
public final class EntityType {

  public static final String CART = "CART";
  public static final String PRODUCT = "PRODUCT";
  public static final String ORDER = "ORDER";
  public static final String CUSTOMER = "CUSTOMER";
  public static final String PAYMENT = "PAYMENT";
  public static final String FULFILLMENT = "FULFILLMENT";
  public static final String INVENTORY = "INVENTORY";

  private EntityType() {
    // Prevent instantiation
  }
}
