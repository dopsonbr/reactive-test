package org.example.checkout.model;

/** Denormalized customer information captured at checkout time. */
public record CustomerSnapshot(
    String customerId,
    String firstName,
    String lastName,
    String email,
    String phone,
    String loyaltyTier) {}
