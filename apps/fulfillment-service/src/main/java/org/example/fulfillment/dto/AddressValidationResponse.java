package org.example.fulfillment.dto;

public record AddressValidationResponse(
    boolean valid, boolean deliverable, String normalizedAddress, String validationMessage) {}
