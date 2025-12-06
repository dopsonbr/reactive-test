package org.example.fulfillment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FulfillmentPlanResponse(
    String planId,
    String status,
    BigDecimal estimatedCost,
    LocalDate estimatedDeliveryDate,
    List<FulfillmentLineItem> lineItems) {
  public record FulfillmentLineItem(Long sku, String fulfillmentMethod, String sourceLocation) {}
}
