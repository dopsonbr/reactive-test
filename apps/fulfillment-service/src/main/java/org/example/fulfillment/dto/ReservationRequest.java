package org.example.fulfillment.dto;

public record ReservationRequest(String planId, String cartId, int ttlMinutes) {}
