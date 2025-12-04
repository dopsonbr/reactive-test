package org.example.model.product;

/**
 * Core product representation.
 *
 * @param sku the stock keeping unit identifier
 * @param description the product description
 * @param price the product price as a string (supports decimal precision)
 * @param availableQuantity the quantity available in inventory
 */
public record Product(long sku, String description, String price, int availableQuantity) {}
