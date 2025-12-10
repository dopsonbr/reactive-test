import { createContext, useContext } from 'react';

export type TransactionState = 'idle' | 'active' | 'checkout' | 'complete';

export interface KioskSessionState {
  // Store configuration
  storeNumber: number;
  kioskId: string;
  serviceAccountId: string;

  // Transaction state
  transactionState: TransactionState;
  transactionId: string | null;
  cartId: string | null;
  customerId: string | null;
  checkoutId: string | null;

  // Session metadata
  sessionStartTime: number | null;
  lastActivityTime: number;
}

export interface KioskSessionActions {
  startTransaction: () => void;
  linkCustomer: (customerId: string) => void;
  setCartId: (cartId: string) => void;
  setCheckoutId: (checkoutId: string) => void;
  completeTransaction: () => void;
  resetTransaction: () => void;
  updateActivity: () => void;
}

export type KioskSessionContextValue = KioskSessionState & KioskSessionActions;

export const KioskSessionContext = createContext<KioskSessionContextValue | null>(null);

export function useKioskSession() {
  const context = useContext(KioskSessionContext);
  if (!context) {
    throw new Error('useKioskSession must be used within KioskSessionProvider');
  }
  return context;
}
