package org.example.order.service;

import java.time.Instant;
import org.example.model.order.FulfillmentDetails;
import org.example.model.order.Order;
import org.example.model.order.OrderStatus;

/**
 * Utility class for creating mutated Order instances.
 *
 * <p>Since shared-model-order uses immutable records, these helper methods provide service-local
 * mutation patterns for creating new Order instances with updated fields.
 */
public final class OrderMutations {

  private OrderMutations() {}

  /** Creates a new order with updated status. */
  public static Order withStatus(Order order, OrderStatus newStatus) {
    return Order.builder()
        .id(order.id())
        .storeNumber(order.storeNumber())
        .orderNumber(order.orderNumber())
        .customerId(order.customerId())
        .fulfillmentType(order.fulfillmentType())
        .fulfillmentDate(order.fulfillmentDate())
        .reservationId(order.reservationId())
        .subtotal(order.subtotal())
        .discountTotal(order.discountTotal())
        .taxTotal(order.taxTotal())
        .fulfillmentCost(order.fulfillmentCost())
        .grandTotal(order.grandTotal())
        .paymentStatus(order.paymentStatus())
        .paymentMethod(order.paymentMethod())
        .paymentReference(order.paymentReference())
        .status(newStatus)
        .lineItems(order.lineItems())
        .appliedDiscounts(order.appliedDiscounts())
        .customerSnapshot(order.customerSnapshot())
        .fulfillmentDetails(order.fulfillmentDetails())
        .createdAt(order.createdAt())
        .updatedAt(Instant.now())
        .createdBy(order.createdBy())
        .sessionId(order.sessionId())
        .build();
  }

  /** Creates a new order with updated fulfillment details. */
  public static Order withFulfillmentDetails(Order order, FulfillmentDetails newDetails) {
    return Order.builder()
        .id(order.id())
        .storeNumber(order.storeNumber())
        .orderNumber(order.orderNumber())
        .customerId(order.customerId())
        .fulfillmentType(order.fulfillmentType())
        .fulfillmentDate(order.fulfillmentDate())
        .reservationId(order.reservationId())
        .subtotal(order.subtotal())
        .discountTotal(order.discountTotal())
        .taxTotal(order.taxTotal())
        .fulfillmentCost(order.fulfillmentCost())
        .grandTotal(order.grandTotal())
        .paymentStatus(order.paymentStatus())
        .paymentMethod(order.paymentMethod())
        .paymentReference(order.paymentReference())
        .status(order.status())
        .lineItems(order.lineItems())
        .appliedDiscounts(order.appliedDiscounts())
        .customerSnapshot(order.customerSnapshot())
        .fulfillmentDetails(newDetails)
        .createdAt(order.createdAt())
        .updatedAt(Instant.now())
        .createdBy(order.createdBy())
        .sessionId(order.sessionId())
        .build();
  }
}
