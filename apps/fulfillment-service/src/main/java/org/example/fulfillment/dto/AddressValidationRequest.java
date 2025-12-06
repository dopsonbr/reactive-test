package org.example.fulfillment.dto;

public record AddressValidationRequest(
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String zipCode,
    String country) {}
