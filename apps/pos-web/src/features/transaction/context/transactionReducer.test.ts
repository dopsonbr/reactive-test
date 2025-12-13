import { describe, it, expect } from 'vitest';
import {
  calculateLineTotal,
  calculateTotals,
  calculatePayments,
  calculatePoints,
} from './transactionReducer';
import type {
  LineItem,
  FulfillmentConfig,
  PaymentRecord,
  CustomerSummary,
} from '../types/transaction';

describe('transactionReducer calculators', () => {
  describe('calculateLineTotal', () => {
    it('calculates total for item without discount', () => {
      const item: LineItem = {
        lineId: 'line-1',
        sku: 'SKU-001',
        name: 'Test Product',
        quantity: 1,
        unitPrice: 29.99,
        originalPrice: 29.99,
        discountPerItem: 0,
        markdown: null,
        lineTotal: 0, // Will be calculated
      };

      expect(calculateLineTotal(item)).toBe(29.99);
    });

    it('calculates total with discount per item', () => {
      const item: LineItem = {
        lineId: 'line-1',
        sku: 'SKU-001',
        name: 'Test Product',
        quantity: 1,
        unitPrice: 29.99,
        originalPrice: 29.99,
        discountPerItem: 5.0,
        markdown: null,
        lineTotal: 0,
      };

      expect(calculateLineTotal(item)).toBe(24.99);
    });

    it('handles quantity greater than 1', () => {
      const item: LineItem = {
        lineId: 'line-1',
        sku: 'SKU-001',
        name: 'Test Product',
        quantity: 3,
        unitPrice: 10.0,
        originalPrice: 10.0,
        discountPerItem: 0,
        markdown: null,
        lineTotal: 0,
      };

      expect(calculateLineTotal(item)).toBe(30.0);
    });

    it('handles quantity and discount together', () => {
      const item: LineItem = {
        lineId: 'line-1',
        sku: 'SKU-001',
        name: 'Test Product',
        quantity: 2,
        unitPrice: 50.0,
        originalPrice: 50.0,
        discountPerItem: 10.0,
        markdown: null,
        lineTotal: 0,
      };

      // (50 - 10) * 2 = 80
      expect(calculateLineTotal(item)).toBe(80.0);
    });
  });

  describe('calculateTotals', () => {
    it('calculates subtotal from multiple items', () => {
      const items: LineItem[] = [
        {
          lineId: 'line-1',
          sku: 'SKU-001',
          name: 'Product A',
          quantity: 1,
          unitPrice: 20.0,
          originalPrice: 20.0,
          discountPerItem: 0,
          markdown: null,
          lineTotal: 20.0,
        },
        {
          lineId: 'line-2',
          sku: 'SKU-002',
          name: 'Product B',
          quantity: 2,
          unitPrice: 15.0,
          originalPrice: 15.0,
          discountPerItem: 0,
          markdown: null,
          lineTotal: 30.0,
        },
      ];

      const totals = calculateTotals(items, null);
      expect(totals.subtotal).toBe(50.0);
    });

    it('calculates discount total from item discounts', () => {
      const items: LineItem[] = [
        {
          lineId: 'line-1',
          sku: 'SKU-001',
          name: 'Product A',
          quantity: 2,
          unitPrice: 20.0,
          originalPrice: 20.0,
          discountPerItem: 5.0,
          markdown: null,
          lineTotal: 30.0, // (20-5) * 2
        },
        {
          lineId: 'line-2',
          sku: 'SKU-002',
          name: 'Product B',
          quantity: 1,
          unitPrice: 30.0,
          originalPrice: 30.0,
          discountPerItem: 10.0,
          markdown: null,
          lineTotal: 20.0, // (30-10) * 1
        },
      ];

      const totals = calculateTotals(items, null);
      // (5 * 2) + (10 * 1) = 20
      expect(totals.discountTotal).toBe(20.0);
    });

    it('applies 8% tax rate correctly', () => {
      const items: LineItem[] = [
        {
          lineId: 'line-1',
          sku: 'SKU-001',
          name: 'Product A',
          quantity: 1,
          unitPrice: 100.0,
          originalPrice: 100.0,
          discountPerItem: 0,
          markdown: null,
          lineTotal: 100.0,
        },
      ];

      const totals = calculateTotals(items, null);
      expect(totals.taxTotal).toBe(8.0); // 100 * 0.08
    });

    it('includes fulfillment cost when present', () => {
      const items: LineItem[] = [
        {
          lineId: 'line-1',
          sku: 'SKU-001',
          name: 'Product A',
          quantity: 1,
          unitPrice: 100.0,
          originalPrice: 100.0,
          discountPerItem: 0,
          markdown: null,
          lineTotal: 100.0,
        },
      ];

      const fulfillment: FulfillmentConfig = {
        type: 'DELIVERY',
        cost: 15.0,
      };

      const totals = calculateTotals(items, fulfillment);
      expect(totals.fulfillmentTotal).toBe(15.0);
    });

    it('handles empty items array', () => {
      const totals = calculateTotals([], null);
      expect(totals.subtotal).toBe(0);
      expect(totals.discountTotal).toBe(0);
      expect(totals.taxTotal).toBe(0);
      expect(totals.grandTotal).toBe(0);
    });

    it('calculates grand total as subtotal + tax + fulfillment', () => {
      const items: LineItem[] = [
        {
          lineId: 'line-1',
          sku: 'SKU-001',
          name: 'Product A',
          quantity: 1,
          unitPrice: 100.0,
          originalPrice: 100.0,
          discountPerItem: 0,
          markdown: null,
          lineTotal: 100.0,
        },
      ];

      const fulfillment: FulfillmentConfig = {
        type: 'DELIVERY',
        cost: 10.0,
      };

      const totals = calculateTotals(items, fulfillment);
      // grandTotal = 100 (subtotal) + 8 (tax) + 10 (fulfillment) = 118
      expect(totals.grandTotal).toBe(118.0);
    });
  });

  describe('calculatePayments', () => {
    it('sums multiple payment amounts', () => {
      const payments: PaymentRecord[] = [
        { id: 'pay-1', method: 'CARD', amount: 50.0, timestamp: new Date() },
        { id: 'pay-2', method: 'CASH', amount: 30.0, timestamp: new Date() },
      ];

      const result = calculatePayments(payments, 100.0);
      expect(result.amountPaid).toBe(80.0);
    });

    it('calculates amount due as grandTotal minus paid', () => {
      const payments: PaymentRecord[] = [
        { id: 'pay-1', method: 'CARD', amount: 60.0, timestamp: new Date() },
      ];

      const result = calculatePayments(payments, 100.0);
      expect(result.amountDue).toBe(40.0);
    });

    it('amount due never goes negative when overpaid', () => {
      const payments: PaymentRecord[] = [
        { id: 'pay-1', method: 'CASH', amount: 120.0, timestamp: new Date() },
      ];

      const result = calculatePayments(payments, 100.0);
      expect(result.amountDue).toBe(0);
    });

    it('handles empty payments array', () => {
      const result = calculatePayments([], 100.0);
      expect(result.amountPaid).toBe(0);
      expect(result.amountDue).toBe(100.0);
    });
  });

  describe('calculatePoints', () => {
    it('returns 0 when no customer', () => {
      expect(calculatePoints(100.0, null)).toBe(0);
    });

    it('applies loyalty multiplier to subtotal', () => {
      const customer: CustomerSummary = {
        id: 'cust-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        loyaltyTier: 'GOLD',
        loyaltyPoints: 500,
        loyaltyMultiplier: 2.0,
      };

      // 100 * 2.0 = 200 points
      expect(calculatePoints(100.0, customer)).toBe(200);
    });

    it('floors to whole number', () => {
      const customer: CustomerSummary = {
        id: 'cust-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        loyaltyTier: 'SILVER',
        loyaltyPoints: 250,
        loyaltyMultiplier: 1.5,
      };

      // 33.33 * 1.5 = 49.995, floored to 49
      expect(calculatePoints(33.33, customer)).toBe(49);
    });

    it('handles base multiplier of 1.0', () => {
      const customer: CustomerSummary = {
        id: 'cust-1',
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        loyaltyTier: 'BRONZE',
        loyaltyPoints: 100,
        loyaltyMultiplier: 1.0,
      };

      expect(calculatePoints(75.0, customer)).toBe(75);
    });
  });
});
