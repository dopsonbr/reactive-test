package org.example.model.discount;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Complete pricing result for a cart including all discounts and savings.
 *
 * @param cartId the cart identifier
 * @param originalSubtotal the subtotal before any discounts
 * @param finalSubtotal the subtotal after discounts
 * @param totalSavings the total amount saved
 * @param shippingCost the shipping cost before discounts
 * @param shippingDiscount the discount applied to shipping
 * @param items itemized pricing breakdown
 * @param appliedPromotions list of promotions applied
 * @param loyaltySummary loyalty benefits summary (may be null)
 * @param calculatedAt when the pricing was calculated
 */
public record PricingResult(
        String cartId,
        BigDecimal originalSubtotal,
        BigDecimal finalSubtotal,
        BigDecimal totalSavings,
        BigDecimal shippingCost,
        BigDecimal shippingDiscount,
        List<ItemPricing> items,
        List<AppliedPromotion> appliedPromotions,
        LoyaltySummary loyaltySummary,
        Instant calculatedAt) {

    public BigDecimal getTotal() {
        return finalSubtotal.add(shippingCost).subtract(shippingDiscount);
    }
}
