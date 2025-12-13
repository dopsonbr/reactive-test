import { describe, it, expect } from 'vitest';
import {
  isWithinLimit,
  calculateDiscount,
  getMaxDiscount,
  getLimitsForTier,
} from './markdownCalculations';
import { MARKDOWN_TIER_LIMITS } from '../types/markdown';

describe('markdownCalculations', () => {
  describe('isWithinLimit', () => {
    const associateLimits = MARKDOWN_TIER_LIMITS.ASSOCIATE;
    const managerLimits = MARKDOWN_TIER_LIMITS.MANAGER;

    describe('PERCENTAGE type', () => {
      it('returns true when percentage is within limit', () => {
        // ASSOCIATE max is 15%
        expect(isWithinLimit('PERCENTAGE', 10, 100, associateLimits)).toBe(true);
        expect(isWithinLimit('PERCENTAGE', 15, 100, associateLimits)).toBe(true);
      });

      it('returns false when percentage exceeds limit', () => {
        expect(isWithinLimit('PERCENTAGE', 16, 100, associateLimits)).toBe(false);
        expect(isWithinLimit('PERCENTAGE', 50, 100, associateLimits)).toBe(false);
      });
    });

    describe('FIXED_AMOUNT type', () => {
      it('returns true when fixed amount is within limit', () => {
        // ASSOCIATE max is $50
        expect(isWithinLimit('FIXED_AMOUNT', 25, 100, associateLimits)).toBe(true);
        expect(isWithinLimit('FIXED_AMOUNT', 50, 100, associateLimits)).toBe(true);
      });

      it('returns false when fixed amount exceeds limit', () => {
        expect(isWithinLimit('FIXED_AMOUNT', 51, 100, associateLimits)).toBe(false);
        expect(isWithinLimit('FIXED_AMOUNT', 100, 100, associateLimits)).toBe(false);
      });
    });

    describe('OVERRIDE_PRICE type', () => {
      it('returns false for ASSOCIATE (canOverridePrice is false)', () => {
        // Even if discount is small, ASSOCIATE can't override price
        expect(isWithinLimit('OVERRIDE_PRICE', 90, 100, associateLimits)).toBe(false);
      });

      it('returns true for MANAGER when discount percent is within limit', () => {
        // MANAGER max is 50%, canOverridePrice is true
        // Setting price to $60 on $100 item = 40% discount, within limit
        expect(isWithinLimit('OVERRIDE_PRICE', 60, 100, managerLimits)).toBe(true);
      });

      it('returns false for MANAGER when discount percent exceeds limit', () => {
        // Setting price to $40 on $100 item = 60% discount, exceeds 50% limit
        expect(isWithinLimit('OVERRIDE_PRICE', 40, 100, managerLimits)).toBe(false);
      });
    });
  });

  describe('calculateDiscount', () => {
    describe('PERCENTAGE type', () => {
      it('calculates amount from percentage of price', () => {
        const result = calculateDiscount('PERCENTAGE', 25, 100);
        expect(result.amount).toBe(25);
        expect(result.percent).toBe(25);
      });

      it('handles decimal percentages', () => {
        const result = calculateDiscount('PERCENTAGE', 12.5, 80);
        expect(result.amount).toBe(10);
        expect(result.percent).toBe(12.5);
      });
    });

    describe('FIXED_AMOUNT type', () => {
      it('uses the fixed amount as discount', () => {
        const result = calculateDiscount('FIXED_AMOUNT', 15, 100);
        expect(result.amount).toBe(15);
        expect(result.percent).toBe(15);
      });

      it('caps discount at item price', () => {
        const result = calculateDiscount('FIXED_AMOUNT', 150, 100);
        expect(result.amount).toBe(100);
        expect(result.percent).toBe(100);
      });
    });

    describe('OVERRIDE_PRICE type', () => {
      it('calculates difference from original price', () => {
        // Setting price to $70 on $100 item = $30 discount
        const result = calculateDiscount('OVERRIDE_PRICE', 70, 100);
        expect(result.amount).toBe(30);
        expect(result.percent).toBe(30);
      });

      it('handles override price higher than original (no discount)', () => {
        // Setting price to $120 on $100 item - shouldn't be negative
        const result = calculateDiscount('OVERRIDE_PRICE', 120, 100);
        expect(result.amount).toBe(0);
        expect(result.percent).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('handles zero item price', () => {
        const result = calculateDiscount('PERCENTAGE', 10, 0);
        expect(result.amount).toBe(0);
        expect(result.percent).toBe(0);
      });
    });
  });

  describe('getMaxDiscount', () => {
    const associateLimits = MARKDOWN_TIER_LIMITS.ASSOCIATE;
    const managerLimits = MARKDOWN_TIER_LIMITS.MANAGER;

    it('returns maxPercentage for PERCENTAGE type', () => {
      expect(getMaxDiscount('PERCENTAGE', 100, associateLimits)).toBe(15);
      expect(getMaxDiscount('PERCENTAGE', 100, managerLimits)).toBe(50);
    });

    it('returns maxFixedAmount for FIXED_AMOUNT type', () => {
      expect(getMaxDiscount('FIXED_AMOUNT', 100, associateLimits)).toBe(50);
      expect(getMaxDiscount('FIXED_AMOUNT', 100, managerLimits)).toBe(500);
    });

    it('calculates minimum price for OVERRIDE_PRICE type', () => {
      // For MANAGER with 50% max, minimum price on $100 item is $50
      const minPrice = getMaxDiscount('OVERRIDE_PRICE', 100, managerLimits);
      expect(minPrice).toBe(50);
    });

    it('scales minimum price with item price for OVERRIDE_PRICE', () => {
      // For MANAGER with 50% max, minimum price on $200 item is $100
      const minPrice = getMaxDiscount('OVERRIDE_PRICE', 200, managerLimits);
      expect(minPrice).toBe(100);
    });
  });

  describe('getLimitsForTier', () => {
    it('returns correct limits for ASSOCIATE tier', () => {
      const limits = getLimitsForTier('ASSOCIATE');
      expect(limits.maxPercentage).toBe(15);
      expect(limits.maxFixedAmount).toBe(50);
      expect(limits.canOverridePrice).toBe(false);
    });

    it('returns correct limits for SUPERVISOR tier', () => {
      const limits = getLimitsForTier('SUPERVISOR');
      expect(limits.maxPercentage).toBe(25);
      expect(limits.maxFixedAmount).toBe(100);
      expect(limits.canOverridePrice).toBe(false);
    });

    it('returns correct limits for MANAGER tier', () => {
      const limits = getLimitsForTier('MANAGER');
      expect(limits.maxPercentage).toBe(50);
      expect(limits.maxFixedAmount).toBe(500);
      expect(limits.canOverridePrice).toBe(true);
    });

    it('returns correct limits for ADMIN tier', () => {
      const limits = getLimitsForTier('ADMIN');
      expect(limits.maxPercentage).toBe(100);
      expect(limits.maxFixedAmount).toBe(10000);
      expect(limits.canOverridePrice).toBe(true);
    });
  });
});
