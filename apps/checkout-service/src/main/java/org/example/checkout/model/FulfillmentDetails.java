package org.example.checkout.model;

import java.time.Instant;

/** Details about order fulfillment. */
public record FulfillmentDetails(
    FulfillmentType type,
    Instant scheduledDate,
    DeliveryAddress deliveryAddress,
    String pickupLocation,
    String instructions) {}
