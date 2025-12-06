package org.example.order.model;

import java.math.BigDecimal;

/**
 * Represents a line item in an order. Contains denormalized product information captured at
 * checkout time.
 */
public record OrderLineItem(
    String productId,
    String sku,
    String name,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal,
    BigDecimal discountAmount) {}
