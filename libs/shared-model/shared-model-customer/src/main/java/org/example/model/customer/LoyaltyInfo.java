package org.example.model.customer;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Customer loyalty program information.
 *
 * @param loyaltyId unique identifier for the loyalty membership
 * @param tier the customer's current loyalty tier
 * @param pointsBalance current available points
 * @param lifetimePoints total points earned over lifetime
 * @param activeBenefits list of currently active benefits
 * @param enrollmentDate date the customer enrolled in the loyalty program
 * @param tierExpirationDate date the current tier expires
 * @param tierAchievedDate date the current tier was achieved
 */
public record LoyaltyInfo(
        String loyaltyId,
        LoyaltyTier tier,
        long pointsBalance,
        long lifetimePoints,
        List<LoyaltyBenefit> activeBenefits,
        LocalDate enrollmentDate,
        LocalDate tierExpirationDate,
        LocalDate tierAchievedDate) {

    /**
     * Check if the customer has a specific active benefit.
     *
     * @param type the benefit type to check
     * @return true if the customer has an active benefit of the specified type
     */
    public boolean hasBenefit(BenefitType type) {
        return activeBenefits != null
                && activeBenefits.stream().anyMatch(b -> b.type() == type && b.isActive());
    }

    /**
     * Get a specific active benefit by type.
     *
     * @param type the benefit type to retrieve
     * @return the benefit if found and active, empty otherwise
     */
    public Optional<LoyaltyBenefit> getBenefit(BenefitType type) {
        if (activeBenefits == null) {
            return Optional.empty();
        }
        return activeBenefits.stream().filter(b -> b.type() == type && b.isActive()).findFirst();
    }

    /**
     * Check if the customer's tier is expiring within the given threshold.
     *
     * @param daysThreshold number of days to check
     * @return true if the tier expires within the threshold
     */
    public boolean isTierExpiringSoon(int daysThreshold) {
        return tierExpirationDate != null
                && tierExpirationDate.isBefore(LocalDate.now().plusDays(daysThreshold));
    }
}
