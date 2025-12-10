package org.example.model.discount;

import java.math.BigDecimal;
import java.util.Set;

/**
 * Permission tiers for employee markdown authorization. Each tier defines the maximum discount
 * allowed and the valid reasons that can be used.
 */
public enum MarkdownPermissionTier {
  /** Store associate - limited markdown authority */
  ASSOCIATE(
      new BigDecimal("0.15"), // 15% max
      new BigDecimal("50.00"), // $50 max
      false, // Cannot override price
      Set.of(MarkdownReason.PRICE_MATCH, MarkdownReason.DAMAGED_ITEM)),

  /** Supervisor - moderate markdown authority */
  SUPERVISOR(
      new BigDecimal("0.25"), // 25% max
      new BigDecimal("100.00"), // $100 max
      false, // Cannot override price
      Set.of(
          MarkdownReason.PRICE_MATCH,
          MarkdownReason.DAMAGED_ITEM,
          MarkdownReason.CUSTOMER_SERVICE,
          MarkdownReason.BUNDLE_DEAL)),

  /** Manager - elevated markdown authority */
  MANAGER(
      new BigDecimal("0.50"), // 50% max
      new BigDecimal("500.00"), // $500 max
      false, // Cannot override price
      Set.of(
          MarkdownReason.PRICE_MATCH,
          MarkdownReason.DAMAGED_ITEM,
          MarkdownReason.CUSTOMER_SERVICE,
          MarkdownReason.BUNDLE_DEAL,
          MarkdownReason.MANAGER_DISCRETION,
          MarkdownReason.LOYALTY_EXCEPTION)),

  /** Admin - unlimited markdown authority */
  ADMIN(
      BigDecimal.ONE, // 100% max
      new BigDecimal("999999.99"), // Effectively unlimited
      true, // Can override price
      Set.of(MarkdownReason.values()));

  private final BigDecimal maxPercentage;
  private final BigDecimal maxFixedAmount;
  private final boolean canOverridePrice;
  private final Set<MarkdownReason> allowedReasons;

  MarkdownPermissionTier(
      BigDecimal maxPercentage,
      BigDecimal maxFixedAmount,
      boolean canOverridePrice,
      Set<MarkdownReason> allowedReasons) {
    this.maxPercentage = maxPercentage;
    this.maxFixedAmount = maxFixedAmount;
    this.canOverridePrice = canOverridePrice;
    this.allowedReasons = allowedReasons;
  }

  public BigDecimal getMaxPercentage() {
    return maxPercentage;
  }

  public BigDecimal getMaxFixedAmount() {
    return maxFixedAmount;
  }

  public boolean canOverridePrice() {
    return canOverridePrice;
  }

  public Set<MarkdownReason> getAllowedReasons() {
    return allowedReasons;
  }

  /**
   * Check if this tier can authorize a markdown of the given type and reason.
   *
   * @param type the markdown type
   * @param reason the markdown reason
   * @return true if this tier can authorize the markdown
   */
  public boolean canAuthorize(MarkdownType type, MarkdownReason reason) {
    if (type == MarkdownType.OVERRIDE_PRICE && !canOverridePrice) {
      return false;
    }
    return allowedReasons.contains(reason);
  }

  /**
   * Check if the value is within this tier's limits.
   *
   * @param type the markdown type
   * @param value the markdown value (percentage as decimal or dollar amount)
   * @return true if within limits
   */
  public boolean isWithinLimit(MarkdownType type, BigDecimal value) {
    return switch (type) {
      case PERCENTAGE -> value.compareTo(maxPercentage) <= 0;
      case FIXED_AMOUNT -> value.compareTo(maxFixedAmount) <= 0;
      case OVERRIDE_PRICE -> canOverridePrice;
    };
  }
}
