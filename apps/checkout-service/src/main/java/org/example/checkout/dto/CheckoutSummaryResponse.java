package org.example.checkout.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.model.order.AppliedDiscount;
import org.example.model.order.CustomerSnapshot;
import org.example.model.order.FulfillmentDetails;
import org.example.model.order.OrderLineItem;

/**
 * Response from initiate checkout containing summary for payment.
 *
 * @param checkoutSessionId temporary ID for this checkout session
 * @param cartId the cart being checked out
 * @param orderNumber the assigned order number
 * @param storeNumber the store number
 * @param customer customer information snapshot
 * @param lineItems order line items
 * @param appliedDiscounts discounts applied
 * @param fulfillment fulfillment details
 * @param reservationId inventory reservation ID
 * @param subtotal items subtotal
 * @param discountTotal total discounts
 * @param taxTotal taxes
 * @param fulfillmentCost fulfillment cost
 * @param grandTotal total to pay
 * @param expiresAt when this checkout session expires
 */
public record CheckoutSummaryResponse(
    String checkoutSessionId,
    String cartId,
    String orderNumber,
    int storeNumber,
    CustomerSnapshot customer,
    List<OrderLineItem> lineItems,
    List<AppliedDiscount> appliedDiscounts,
    FulfillmentDetails fulfillment,
    UUID reservationId,
    BigDecimal subtotal,
    BigDecimal discountTotal,
    BigDecimal taxTotal,
    BigDecimal fulfillmentCost,
    BigDecimal grandTotal,
    Instant expiresAt) {}
