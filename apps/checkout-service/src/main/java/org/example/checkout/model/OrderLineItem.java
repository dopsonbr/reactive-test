package org.example.checkout.model;

import java.math.BigDecimal;

/**
 * Represents a line item in an order. Contains denormalized product information captured at
 * checkout time.
 */
public record OrderLineItem(
    String productId,
    String sku,
    String name,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal,
    BigDecimal discountAmount) {

  public static OrderLineItem create(
      String productId,
      String sku,
      String name,
      int quantity,
      BigDecimal unitPrice,
      BigDecimal discountAmount) {
    BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity)).subtract(discountAmount);
    return new OrderLineItem(productId, sku, name, quantity, unitPrice, lineTotal, discountAmount);
  }
}
