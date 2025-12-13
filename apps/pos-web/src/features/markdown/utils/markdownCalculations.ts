import type { MarkdownType, MarkdownLimit } from '../types/markdown';
import { MARKDOWN_TIER_LIMITS } from '../types/markdown';
import type { MarkdownPermissionTier } from '../types/markdown';

/**
 * Check if a markdown value is within the allowed limits for a tier
 */
export function isWithinLimit(
  type: MarkdownType,
  value: number,
  itemPrice: number,
  limits: MarkdownLimit
): boolean {
  switch (type) {
    case 'PERCENTAGE':
      return value <= limits.maxPercentage;
    case 'FIXED_AMOUNT':
      return value <= limits.maxFixedAmount;
    case 'OVERRIDE_PRICE':
      // For override, check if the discount percentage is within limits
      const discountPercent = ((itemPrice - value) / itemPrice) * 100;
      return discountPercent <= limits.maxPercentage && limits.canOverridePrice;
    default:
      return false;
  }
}

/**
 * Calculate the discount amount and percentage for a given markdown
 */
export function calculateDiscount(
  type: MarkdownType,
  value: number,
  itemPrice: number
): { amount: number; percent: number } {
  let amount = 0;

  switch (type) {
    case 'PERCENTAGE':
      amount = itemPrice * (value / 100);
      break;
    case 'FIXED_AMOUNT':
      amount = Math.min(value, itemPrice);
      break;
    case 'OVERRIDE_PRICE':
      amount = Math.max(0, itemPrice - value);
      break;
  }

  return {
    amount,
    percent: itemPrice > 0 ? (amount / itemPrice) * 100 : 0,
  };
}

/**
 * Get the maximum discount allowed for a given type and tier
 */
export function getMaxDiscount(
  type: MarkdownType,
  itemPrice: number,
  limits: MarkdownLimit
): number {
  switch (type) {
    case 'PERCENTAGE':
      return limits.maxPercentage;
    case 'FIXED_AMOUNT':
      return limits.maxFixedAmount;
    case 'OVERRIDE_PRICE':
      // Calculate minimum price based on max percentage
      return itemPrice * (1 - limits.maxPercentage / 100);
    default:
      return 0;
  }
}

/**
 * Get the limits for a specific markdown permission tier
 */
export function getLimitsForTier(tier: MarkdownPermissionTier): MarkdownLimit {
  return MARKDOWN_TIER_LIMITS[tier];
}
