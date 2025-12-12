package org.example.model.order;

/** Delivery address for order fulfillment. */
public record DeliveryAddress(
    String street1,
    String street2,
    String city,
    String state,
    String postalCode,
    String country) {}
