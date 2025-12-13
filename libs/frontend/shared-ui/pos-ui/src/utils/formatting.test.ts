import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatMarkdown,
  calculateLineItemTotal,
  type MarkdownInfo,
} from './formatting';

describe('formatting utils', () => {
  describe('formatCurrency', () => {
    it('formats positive amounts with $ and decimal places', () => {
      expect(formatCurrency(29.99)).toBe('$29.99');
    });

    it('formats zero as $0.00', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('handles decimal precision', () => {
      expect(formatCurrency(10.5)).toBe('$10.50');
      expect(formatCurrency(10)).toBe('$10.00');
    });

    it('formats large amounts with commas', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('handles negative amounts', () => {
      expect(formatCurrency(-25.5)).toBe('-$25.50');
    });

    it('rounds to nearest cent', () => {
      expect(formatCurrency(10.999)).toBe('$11.00');
      expect(formatCurrency(10.994)).toBe('$10.99');
    });
  });

  describe('formatMarkdown', () => {
    it('formats PERCENTAGE as "-X%"', () => {
      const markdown: MarkdownInfo = {
        type: 'PERCENTAGE',
        value: 15,
        reason: 'PRICE_MATCH',
      };
      expect(formatMarkdown(markdown)).toBe('-15%');
    });

    it('formats FIXED_AMOUNT as "-$X.XX"', () => {
      const markdown: MarkdownInfo = {
        type: 'FIXED_AMOUNT',
        value: 10.5,
        reason: 'DAMAGED_ITEM',
      };
      expect(formatMarkdown(markdown)).toBe('-$10.50');
    });

    it('formats OVERRIDE_PRICE as "Override: $X.XX"', () => {
      const markdown: MarkdownInfo = {
        type: 'OVERRIDE_PRICE',
        value: 49.99,
        reason: 'MANAGER_DISCRETION',
      };
      expect(formatMarkdown(markdown)).toBe('Override: $49.99');
    });

    it('handles whole number percentages', () => {
      const markdown: MarkdownInfo = {
        type: 'PERCENTAGE',
        value: 20,
        reason: 'BUNDLE_DEAL',
      };
      expect(formatMarkdown(markdown)).toBe('-20%');
    });

    it('handles decimal percentages', () => {
      const markdown: MarkdownInfo = {
        type: 'PERCENTAGE',
        value: 12.5,
        reason: 'CUSTOMER_SERVICE',
      };
      expect(formatMarkdown(markdown)).toBe('-12.5%');
    });
  });

  describe('calculateLineItemTotal', () => {
    it('calculates total without discount', () => {
      expect(calculateLineItemTotal(1, 29.99, 0)).toBe(29.99);
    });

    it('calculates total with discount', () => {
      expect(calculateLineItemTotal(1, 29.99, 5)).toBe(24.99);
    });

    it('multiplies by quantity', () => {
      expect(calculateLineItemTotal(3, 10, 0)).toBe(30);
    });

    it('applies discount per item across quantity', () => {
      // 2 items at $50 each with $10 discount per item
      // (50 - 10) * 2 = 80
      expect(calculateLineItemTotal(2, 50, 10)).toBe(80);
    });

    it('handles zero quantity', () => {
      expect(calculateLineItemTotal(0, 50, 0)).toBe(0);
    });
  });
});
