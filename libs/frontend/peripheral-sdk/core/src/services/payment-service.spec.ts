import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from './payment-service';
import { StompClient } from '../client';
import {
  PaymentState,
  PaymentEvent,
  PaymentStateEvent,
  PaymentResultEvent,
  PaymentRequest,
} from '../types';

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('PaymentService', () => {
  let service: PaymentService;
  let mockStomp: {
    subscribe: ReturnType<typeof vi.fn>;
    publish: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockStomp = {
      subscribe: vi.fn().mockReturnValue(vi.fn()),
      publish: vi.fn(),
    };
    service = new PaymentService(mockStomp as unknown as StompClient);
  });

  describe('collect', () => {
    it('should publish collect command and return promise', async () => {
      const request: PaymentRequest = {
        amount: 4750,
        currency: 'USD',
      };

      // Simulate approval after publish
      let stompHandler: (msg: PaymentEvent) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/payment/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      const resultPromise = service.collect(request);

      // Trigger the subscription first
      await flushMicrotasks();

      // Simulate approval
      const resultEvent: PaymentResultEvent = {
        type: 'result',
        result: {
          approved: true,
          transactionId: 'txn-123',
          method: 'chip',
          cardBrand: 'visa',
          last4: '4242',
          authCode: 'ABC123',
        },
      };
      stompHandler!(resultEvent);

      const result = await resultPromise;

      expect(mockStomp.publish).toHaveBeenCalledWith('/app/payment/collect', {
        action: 'collect',
        request,
      });
      expect(result.approved).toBe(true);
      expect(result.transactionId).toBe('txn-123');
    });

    it('should reject on decline', async () => {
      let stompHandler: (msg: PaymentEvent) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/payment/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      const resultPromise = service.collect({
        amount: 4750,
        currency: 'USD',
      });

      await flushMicrotasks();

      const resultEvent: PaymentResultEvent = {
        type: 'result',
        result: {
          approved: false,
          declineReason: 'insufficient_funds',
        },
      };
      stompHandler!(resultEvent);

      const result = await resultPromise;
      expect(result.approved).toBe(false);
      expect(result.declineReason).toBe('insufficient_funds');
    });

    it('should settle promise on cancellation and allow new collection', async () => {
      let stompHandler: (msg: PaymentEvent) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/payment/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      const firstPromise = service.collect({
        amount: 5000,
        currency: 'USD',
      });

      await flushMicrotasks();

      const cancelEvent: PaymentStateEvent = {
        type: 'state_change',
        state: 'cancelled',
      };
      stompHandler!(cancelEvent);

      const cancelledResult = await firstPromise;
      expect(cancelledResult.approved).toBe(false);
      expect(cancelledResult.error).toBe('cancelled');

      const secondPromise = service.collect({
        amount: 2500,
        currency: 'USD',
      });
      await flushMicrotasks();

      const approvalEvent: PaymentResultEvent = {
        type: 'result',
        result: {
          approved: true,
          transactionId: 'txn-002',
        },
      };
      stompHandler!(approvalEvent);

      const approvedResult = await secondPromise;
      expect(approvedResult.approved).toBe(true);
      expect(approvedResult.transactionId).toBe('txn-002');
    });

    it('should settle promise on error state', async () => {
      let stompHandler: (msg: PaymentEvent) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/payment/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      const resultPromise = service.collect({
        amount: 3000,
        currency: 'USD',
      });
      await flushMicrotasks();

      const errorEvent: PaymentStateEvent = {
        type: 'state_change',
        state: 'error',
        data: { error: 'terminal_disconnected' },
      };
      stompHandler!(errorEvent);

      const result = await resultPromise;
      expect(result.approved).toBe(false);
      expect(result.error).toBe('terminal_disconnected');
    });
  });

  describe('cancel', () => {
    it('should publish cancel command', async () => {
      await service.cancel();

      expect(mockStomp.publish).toHaveBeenCalledWith('/app/payment/cancel', {
        action: 'cancel',
      });
    });
  });

  describe('onStateChange', () => {
    it('should call handler on state changes', () => {
      let stompHandler: (msg: PaymentEvent) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/payment/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      const stateHandler = vi.fn();
      service.onStateChange(stateHandler);

      const stateEvent: PaymentStateEvent = {
        type: 'state_change',
        state: 'card_presented',
      };
      stompHandler!(stateEvent);

      expect(stateHandler).toHaveBeenCalledWith('card_presented');
    });
  });

  describe('state', () => {
    it('should track current state', () => {
      let stompHandler: (msg: PaymentEvent) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/payment/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      // Initialize subscription
      service.onStateChange(vi.fn());

      expect(service.state).toBe('idle');

      const stateEvent: PaymentStateEvent = {
        type: 'state_change',
        state: 'authorizing',
      };
      stompHandler!(stateEvent);

      expect(service.state).toBe('authorizing');
    });
  });
});
