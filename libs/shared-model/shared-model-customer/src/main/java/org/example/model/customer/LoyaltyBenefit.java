package org.example.model.customer;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A loyalty benefit available to a customer.
 *
 * @param benefitId unique identifier for the benefit
 * @param type the type of benefit
 * @param description human-readable description
 * @param value the benefit value (discount %, points multiplier, or threshold)
 * @param validFrom start date of benefit validity
 * @param validUntil end date of benefit validity
 * @param usageLimit maximum number of uses (null for unlimited)
 * @param usageCount current number of times used
 */
public record LoyaltyBenefit(
        String benefitId,
        BenefitType type,
        String description,
        BigDecimal value,
        LocalDate validFrom,
        LocalDate validUntil,
        Integer usageLimit,
        Integer usageCount) {

    /**
     * Check if this benefit is currently active.
     *
     * @return true if the benefit is within its validity period and has remaining uses
     */
    public boolean isActive() {
        LocalDate today = LocalDate.now();
        boolean withinDateRange =
                (validFrom == null || !today.isBefore(validFrom))
                        && (validUntil == null || !today.isAfter(validUntil));
        boolean hasRemainingUses =
                usageLimit == null || usageCount == null || usageCount < usageLimit;
        return withinDateRange && hasRemainingUses;
    }
}
