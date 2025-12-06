package org.example.fulfillment.dto;

import java.time.Instant;

public record ReservationResponse(
    String reservationId, String planId, String status, Instant expiresAt) {}
