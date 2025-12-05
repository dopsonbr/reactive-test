package org.example.model.discount;

import java.util.List;

/**
 * Summary of loyalty benefits applied to the order.
 *
 * @param loyaltyTier the customer's loyalty tier name
 * @param pointsEarned points earned from this order
 * @param pointsBalance current points balance
 * @param pointsToNextTier points needed to reach next tier
 * @param appliedBenefits list of benefit descriptions applied
 */
public record LoyaltySummary(
        String loyaltyTier,
        long pointsEarned,
        long pointsBalance,
        long pointsToNextTier,
        List<String> appliedBenefits) {}
