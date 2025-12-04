package org.example.cart.dto;

/**
 * Request to set/update customer on a cart.
 *
 * @param customerId the customer ID
 * @param name the customer name
 * @param email the customer email
 */
public record SetCustomerRequest(String customerId, String name, String email) {}
