package org.example.model.customer;

/**
 * Minimal placeholder for customer attached to cart. This is a placeholder for a complex model with
 * B2B, B2C, and omnichannel use cases. Will be expanded in a future feature plan.
 *
 * @param customerId the unique customer identifier
 * @param name the customer's name
 * @param email the customer's email address
 */
public record CartCustomer(String customerId, String name, String email) {}
