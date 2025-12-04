package org.example.cart.dto;

/**
 * Request to update a product quantity in the cart.
 *
 * @param quantity the new quantity
 */
public record UpdateProductRequest(int quantity) {}
