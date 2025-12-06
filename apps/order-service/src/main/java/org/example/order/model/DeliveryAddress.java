package org.example.order.model;

/** Delivery address for orders. */
public record DeliveryAddress(
    String street1, String street2, String city, String state, String postalCode, String country) {}
