import { ReactNode, useCallback, useEffect, useState } from 'react';
import { KioskSessionContext, KioskSessionState, TransactionState } from './KioskSessionContext';
import { logger } from '../../../shared/utils/logger';

interface KioskSessionProviderProps {
  children: ReactNode;
  storeNumber?: number;
  kioskId?: string;
  serviceAccountId?: string;
}

const SESSION_STORAGE_KEY = 'kiosk-session';

function getInitialState(
  storeNumber: number,
  kioskId: string,
  serviceAccountId: string
): KioskSessionState {
  // Try to restore from sessionStorage
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Validate store config matches
      if (
        parsed.storeNumber === storeNumber &&
        parsed.kioskId === kioskId &&
        parsed.serviceAccountId === serviceAccountId
      ) {
        return parsed;
      }
    } catch (error) {
      logger.warn('Failed to restore session from storage', { error });
    }
  }

  // Return default idle state
  return {
    storeNumber,
    kioskId,
    serviceAccountId,
    transactionState: 'idle',
    transactionId: null,
    cartId: null,
    customerId: null,
    checkoutId: null,
    sessionStartTime: null,
    lastActivityTime: Date.now(),
  };
}

export function KioskSessionProvider({
  children,
  storeNumber = Number(import.meta.env.VITE_STORE_NUMBER) || 1,
  kioskId = import.meta.env.VITE_KIOSK_ID || 'KIOSK-001',
  serviceAccountId = import.meta.env.VITE_SERVICE_ACCOUNT_ID || 'kiosk-service',
}: KioskSessionProviderProps) {
  const [state, setState] = useState<KioskSessionState>(() =>
    getInitialState(storeNumber, kioskId, serviceAccountId)
  );

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const startTransaction = useCallback(() => {
    const transactionId = crypto.randomUUID();
    const now = Date.now();

    setState((prev) => ({
      ...prev,
      transactionState: 'active',
      transactionId,
      sessionStartTime: now,
      lastActivityTime: now,
    }));

    logger.info('Transaction started', { transactionId, kioskId, storeNumber });
  }, [kioskId, storeNumber]);

  const linkCustomer = useCallback((customerId: string) => {
    setState((prev) => ({
      ...prev,
      customerId,
      lastActivityTime: Date.now(),
    }));

    logger.info('Customer linked to transaction', { customerId });
  }, []);

  const setCartId = useCallback((cartId: string) => {
    setState((prev) => ({
      ...prev,
      cartId,
      lastActivityTime: Date.now(),
    }));

    logger.info('Cart linked to transaction', { cartId });
  }, []);

  const setCheckoutId = useCallback((checkoutId: string) => {
    setState((prev) => ({
      ...prev,
      checkoutId,
      transactionState: 'checkout',
      lastActivityTime: Date.now(),
    }));

    logger.info('Checkout initiated', { checkoutId });
  }, []);

  const completeTransaction = useCallback(() => {
    logger.info('Transaction completed', { transactionId: state.transactionId });

    setState((prev) => ({
      ...prev,
      transactionState: 'complete',
      lastActivityTime: Date.now(),
    }));

    // Auto-reset after showing confirmation
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        transactionState: 'idle',
        transactionId: null,
        cartId: null,
        customerId: null,
        checkoutId: null,
        sessionStartTime: null,
        lastActivityTime: Date.now(),
      }));
      logger.info('Transaction reset to idle');
    }, 5000);
  }, [state.transactionId]);

  const resetTransaction = useCallback(() => {
    logger.info('Transaction reset', { transactionId: state.transactionId });

    setState((prev) => ({
      ...prev,
      transactionState: 'idle',
      transactionId: null,
      cartId: null,
      customerId: null,
      checkoutId: null,
      sessionStartTime: null,
      lastActivityTime: Date.now(),
    }));
  }, [state.transactionId]);

  const updateActivity = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastActivityTime: Date.now(),
    }));
  }, []);

  const value = {
    ...state,
    startTransaction,
    linkCustomer,
    setCartId,
    setCheckoutId,
    completeTransaction,
    resetTransaction,
    updateActivity,
  };

  return (
    <KioskSessionContext.Provider value={value}>
      {children}
    </KioskSessionContext.Provider>
  );
}
