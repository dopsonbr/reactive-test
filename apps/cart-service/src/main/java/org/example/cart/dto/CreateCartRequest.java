package org.example.cart.dto;

/**
 * Request to create a new cart.
 *
 * @param storeNumber the store context (required)
 * @param customerId the customer ID (optional - creates anonymous cart if null)
 */
public record CreateCartRequest(int storeNumber, String customerId) {}
