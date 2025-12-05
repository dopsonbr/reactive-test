package org.example.discount.client;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Loyalty information from customer-service.
 *
 * @param tier the loyalty tier name
 * @param pointsBalance current points balance
 * @param benefits list of active benefits
 */
public record LoyaltyInfo(String tier, long pointsBalance, List<LoyaltyBenefit> benefits) {

    public Optional<LoyaltyBenefit> getBenefit(BenefitType type) {
        if (benefits == null) {
            return Optional.empty();
        }
        return benefits.stream().filter(b -> b.type() == type).findFirst();
    }

    public boolean hasBenefit(BenefitType type) {
        return getBenefit(type).isPresent();
    }

    public record LoyaltyBenefit(BenefitType type, BigDecimal value, String description) {}

    public enum BenefitType {
        PERCENTAGE_DISCOUNT,
        FREE_SHIPPING,
        POINTS_MULTIPLIER,
        EARLY_ACCESS,
        FREE_GIFT
    }
}
