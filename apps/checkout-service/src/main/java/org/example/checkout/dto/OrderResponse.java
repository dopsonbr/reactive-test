package org.example.checkout.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.model.order.AppliedDiscount;
import org.example.model.order.CustomerSnapshot;
import org.example.model.order.FulfillmentDetails;
import org.example.model.order.FulfillmentType;
import org.example.model.order.Order;
import org.example.model.order.OrderLineItem;
import org.example.model.order.OrderStatus;
import org.example.model.order.PaymentStatus;

/**
 * Response representing a completed order.
 *
 * @param orderId the order ID
 * @param orderNumber the order number
 * @param storeNumber the store number
 * @param customerId the customer ID
 * @param status the order status
 * @param fulfillmentType fulfillment type
 * @param fulfillmentDate fulfillment date (for WILL_CALL)
 * @param customer customer snapshot
 * @param lineItems order line items
 * @param appliedDiscounts discounts applied
 * @param fulfillment fulfillment details
 * @param subtotal items subtotal
 * @param discountTotal total discounts
 * @param taxTotal taxes
 * @param fulfillmentCost fulfillment cost
 * @param grandTotal total paid
 * @param paymentStatus payment status
 * @param paymentMethod payment method used
 * @param paymentReference payment reference
 * @param createdAt when order was created
 */
public record OrderResponse(
    UUID orderId,
    String orderNumber,
    int storeNumber,
    String customerId,
    OrderStatus status,
    FulfillmentType fulfillmentType,
    Instant fulfillmentDate,
    CustomerSnapshot customer,
    List<OrderLineItem> lineItems,
    List<AppliedDiscount> appliedDiscounts,
    FulfillmentDetails fulfillment,
    BigDecimal subtotal,
    BigDecimal discountTotal,
    BigDecimal taxTotal,
    BigDecimal fulfillmentCost,
    BigDecimal grandTotal,
    PaymentStatus paymentStatus,
    String paymentMethod,
    String paymentReference,
    Instant createdAt) {

  public static OrderResponse fromOrder(Order order) {
    return new OrderResponse(
        order.id(),
        order.orderNumber(),
        order.storeNumber(),
        order.customerId(),
        order.status(),
        order.fulfillmentType(),
        order.fulfillmentDate(),
        order.customerSnapshot(),
        order.lineItems(),
        order.appliedDiscounts(),
        order.fulfillmentDetails(),
        order.subtotal(),
        order.discountTotal(),
        order.taxTotal(),
        order.fulfillmentCost(),
        order.grandTotal(),
        order.paymentStatus(),
        order.paymentMethod(),
        order.paymentReference(),
        order.createdAt());
  }
}
