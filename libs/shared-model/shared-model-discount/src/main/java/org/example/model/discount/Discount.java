package org.example.model.discount;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Discount definition that can be applied to a cart.
 *
 * @param discountId the unique discount identifier
 * @param code the discount/promo code
 * @param type the type of discount
 * @param value the discount value (percentage or fixed amount)
 * @param description human-readable description of the discount
 * @param expiresAt when the discount expires
 */
public record Discount(
    String discountId,
    String code,
    DiscountType type,
    BigDecimal value,
    String description,
    Instant expiresAt) {}
