package org.example.model.order;

import java.math.BigDecimal;

/** Discount applied to an order. */
public record AppliedDiscount(
    String discountId, String code, String description, String type, BigDecimal appliedAmount) {}
