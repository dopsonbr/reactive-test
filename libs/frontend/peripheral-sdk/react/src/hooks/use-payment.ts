import { useState, useEffect, useCallback } from 'react';
import {
  PaymentState,
  PaymentRequest,
  PaymentResult,
} from '@reactive-platform/peripheral-core';
import { usePeripherals } from '../context';

/**
 * Return type for usePayment hook
 */
export interface UsePaymentReturn {
  /** Collect payment */
  collect: (request: PaymentRequest) => Promise<PaymentResult>;
  /** Cancel current payment */
  cancel: () => Promise<void>;
  /** Current payment state */
  state: PaymentState;
  /** Most recent payment result */
  result: PaymentResult | null;
  /** Whether payment capability is available */
  available: boolean;
  /** Available payment methods */
  methods: string[];
}

/**
 * Hook for payment operations
 */
export function usePayment(): UsePaymentReturn {
  const { client, capabilities } = usePeripherals();
  const [state, setState] = useState<PaymentState>('idle');
  const [result, setResult] = useState<PaymentResult | null>(null);

  // Subscribe to state changes
  useEffect(() => {
    const payment = client?.payment;
    if (!payment) return;

    const unsubscribe = payment.onStateChange((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [client]);

  const collect = useCallback(
    async (request: PaymentRequest): Promise<PaymentResult> => {
      const payment = client?.payment;
      if (!payment) {
        throw new Error('Payment service not available');
      }

      const paymentResult = await payment.collect(request);
      setResult(paymentResult);
      return paymentResult;
    },
    [client]
  );

  const cancel = useCallback(async () => {
    const payment = client?.payment;
    if (!payment) return;
    await payment.cancel();
  }, [client]);

  return {
    collect,
    cancel,
    state,
    result,
    available: capabilities.payment?.available ?? false,
    methods: capabilities.payment?.methods ?? [],
  };
}
