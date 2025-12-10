import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  forcePaymentApprove,
  forcePaymentDecline,
  setMockPaymentState,
  getMockPaymentState,
  onMockPaymentStateChange,
  configureMockPayment,
  startMockPayment,
  resetMockPayment,
} from './payment';

describe('Mock Payment', () => {
  beforeEach(() => {
    resetMockPayment();
  });

  describe('forcePaymentApprove', () => {
    it('should return approved result', () => {
      const result = forcePaymentApprove();

      expect(result.approved).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.cardBrand).toBe('visa');
    });

    it('should accept overrides', () => {
      const result = forcePaymentApprove({ cardBrand: 'mastercard' });

      expect(result.cardBrand).toBe('mastercard');
    });

    it('should update state to approved', () => {
      forcePaymentApprove();

      expect(getMockPaymentState()).toBe('approved');
    });
  });

  describe('forcePaymentDecline', () => {
    it('should return declined result', () => {
      const result = forcePaymentDecline({ reason: 'insufficient_funds' });

      expect(result.approved).toBe(false);
      expect(result.declineReason).toBe('insufficient_funds');
    });

    it('should update state to declined', () => {
      forcePaymentDecline();

      expect(getMockPaymentState()).toBe('declined');
    });
  });

  describe('state management', () => {
    it('should track state changes', () => {
      setMockPaymentState('authorizing');

      expect(getMockPaymentState()).toBe('authorizing');
    });

    it('should notify state listeners', () => {
      const listener = vi.fn();
      onMockPaymentStateChange(listener);

      setMockPaymentState('pin_required');

      expect(listener).toHaveBeenCalledWith('pin_required');
    });

    it('should unsubscribe listener', () => {
      const listener = vi.fn();
      const unsubscribe = onMockPaymentStateChange(listener);

      unsubscribe();
      setMockPaymentState('authorizing');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('startMockPayment', () => {
    it('should auto-approve with default config', async () => {
      const result = await startMockPayment();

      expect(result.approved).toBe(true);
    });

    it('should auto-decline when configured', async () => {
      configureMockPayment({ defaultOutcome: 'declined' });

      const result = await startMockPayment();

      expect(result.approved).toBe(false);
    });
  });
});
