package org.example.cart.dto;

/**
 * Request to add a product to the cart.
 *
 * @param sku the product SKU
 * @param quantity the quantity to add
 */
public record AddProductRequest(long sku, int quantity) {}
