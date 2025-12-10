import { useMemo, useCallback } from 'react';
import type { MarkdownType, MarkdownInput, MarkdownPermissionTier } from '../types/markdown';
import { MARKDOWN_TIER_LIMITS } from '../types/markdown';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiresOverride: boolean;
}

interface UseMarkdownValidationOptions {
  tier: MarkdownPermissionTier;
  itemPrice: number;
}

export function useMarkdownValidation({ tier, itemPrice }: UseMarkdownValidationOptions) {
  const limits = useMemo(() => MARKDOWN_TIER_LIMITS[tier], [tier]);

  const validate = useCallback(
    (input: Partial<MarkdownInput>): ValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];
      let requiresOverride = false;

      // Check type
      if (!input.type) {
        errors.push('Markdown type is required');
      } else if (!limits.allowedTypes.includes(input.type)) {
        errors.push(`${input.type} is not allowed for your permission level`);
      }

      // Check value
      if (input.value === undefined || input.value === null) {
        errors.push('Value is required');
      } else if (input.value <= 0) {
        errors.push('Value must be greater than 0');
      } else if (input.type) {
        // Check limits
        const exceedsLimit = !isWithinLimit(input.type, input.value, itemPrice);
        if (exceedsLimit) {
          requiresOverride = true;
          warnings.push('Value exceeds your limit - manager override required');
        }

        // Type-specific validations
        if (input.type === 'PERCENTAGE' && input.value > 100) {
          errors.push('Percentage cannot exceed 100%');
        }
        if (input.type === 'OVERRIDE_PRICE' && input.value > itemPrice) {
          warnings.push('New price is higher than original price');
        }
      }

      // Check reason
      if (!input.reason) {
        errors.push('Reason is required');
      } else if (!limits.allowedReasons.includes(input.reason)) {
        errors.push(`${input.reason} is not allowed for your permission level`);
      }

      return {
        isValid: errors.length === 0 && !requiresOverride,
        errors,
        warnings,
        requiresOverride,
      };
    },
    [limits, itemPrice]
  );

  const isWithinLimit = useCallback(
    (type: MarkdownType, value: number, price: number): boolean => {
      switch (type) {
        case 'PERCENTAGE':
          return value <= limits.maxPercentage;
        case 'FIXED_AMOUNT':
          return value <= limits.maxFixedAmount;
        case 'OVERRIDE_PRICE':
          // For override, check if the discount percentage is within limits
          const discountPercent = ((price - value) / price) * 100;
          return discountPercent <= limits.maxPercentage && limits.canOverridePrice;
        default:
          return false;
      }
    },
    [limits]
  );

  const getMaxDiscount = useCallback(
    (type: MarkdownType): number => {
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
    },
    [limits, itemPrice]
  );

  const calculateDiscount = useCallback(
    (type: MarkdownType, value: number): { amount: number; percent: number } => {
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
        percent: (amount / itemPrice) * 100,
      };
    },
    [itemPrice]
  );

  return {
    validate,
    isWithinLimit,
    getMaxDiscount,
    calculateDiscount,
    limits,
  };
}
