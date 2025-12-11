package org.example.model.discount;

import java.math.BigDecimal;
import java.util.Set;

/**
 * Represents the markdown limits for a specific user based on their permission tier.
 *
 * @param tier the permission tier
 * @param allowedTypes the markdown types this tier can use
 * @param allowedReasons the markdown reasons this tier can use
 * @param maxPercentage maximum percentage discount (as decimal, e.g., 0.15 for 15%)
 * @param maxFixedAmount maximum fixed dollar amount discount
 * @param canOverridePrice whether this tier can set a specific price
 */
public record MarkdownLimit(
    MarkdownPermissionTier tier,
    Set<MarkdownType> allowedTypes,
    Set<MarkdownReason> allowedReasons,
    BigDecimal maxPercentage,
    BigDecimal maxFixedAmount,
    boolean canOverridePrice) {

  /**
   * Create a MarkdownLimit from a permission tier.
   *
   * @param tier the permission tier
   * @return MarkdownLimit with limits from the tier
   */
  public static MarkdownLimit fromTier(MarkdownPermissionTier tier) {
    Set<MarkdownType> types =
        tier.canOverridePrice()
            ? Set.of(MarkdownType.values())
            : Set.of(MarkdownType.PERCENTAGE, MarkdownType.FIXED_AMOUNT);

    return new MarkdownLimit(
        tier,
        types,
        tier.getAllowedReasons(),
        tier.getMaxPercentage(),
        tier.getMaxFixedAmount(),
        tier.canOverridePrice());
  }
}
