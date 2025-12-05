package org.example.discount.controller.dto;

import java.math.BigDecimal;

/**
 * An item in the cart for pricing calculation.
 *
 * @param sku the product SKU
 * @param quantity the quantity
 * @param unitPrice the unit price
 */
public record CartItem(long sku, int quantity, BigDecimal unitPrice) {}
