package org.example.order.model;

import java.math.BigDecimal;

/** Represents a discount applied during checkout. */
public record AppliedDiscount(
    String discountId,
    String discountCode,
    String description,
    String discountType,
    BigDecimal amount) {}
