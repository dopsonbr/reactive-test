package org.example.model.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

/** Line item in an order. */
public record OrderLineItem(
    String productId,
    String sku,
    String name,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal discountAmount) {

  public static OrderLineItem create(
      String productId,
      String sku,
      String name,
      int quantity,
      BigDecimal unitPrice,
      BigDecimal discountAmount) {
    return new OrderLineItem(
        productId,
        sku,
        name,
        quantity,
        unitPrice,
        discountAmount != null ? discountAmount : BigDecimal.ZERO);
  }

  @JsonProperty
  public BigDecimal lineTotal() {
    BigDecimal gross = unitPrice.multiply(BigDecimal.valueOf(quantity));
    return gross.subtract(discountAmount != null ? discountAmount : BigDecimal.ZERO);
  }
}
