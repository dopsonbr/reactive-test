package org.example.checkout.dto;

import java.time.Instant;
import org.example.checkout.model.DeliveryAddress;
import org.example.checkout.model.FulfillmentType;

/**
 * Request to initiate checkout process.
 *
 * @param cartId the cart ID to checkout
 * @param fulfillmentType the type of fulfillment
 * @param fulfillmentDate required for WILL_CALL (future pickup date)
 * @param deliveryAddress required for DELIVERY type
 * @param instructions optional fulfillment instructions
 */
public record InitiateCheckoutRequest(
    String cartId,
    FulfillmentType fulfillmentType,
    Instant fulfillmentDate,
    DeliveryAddress deliveryAddress,
    String instructions) {}
