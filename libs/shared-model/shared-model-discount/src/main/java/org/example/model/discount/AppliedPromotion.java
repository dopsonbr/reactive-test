package org.example.model.discount;

import java.math.BigDecimal;

/**
 * Details of a promotion that was applied to the cart.
 *
 * @param promotionId the promotion/discount identifier
 * @param source the source of the promotion (PROMO_CODE, AUTO_APPLY, LOYALTY, MARKDOWN)
 * @param description human-readable description
 * @param savingsAmount the amount saved from this promotion
 * @param scope the scope of the promotion
 */
public record AppliedPromotion(
    String promotionId,
    String source,
    String description,
    BigDecimal savingsAmount,
    DiscountScope scope) {}
