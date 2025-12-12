package org.example.model.order;

/** Snapshot of customer data at time of order. */
public record CustomerSnapshot(
    String customerId,
    String firstName,
    String lastName,
    String email,
    String phone,
    String loyaltyTier) {}
