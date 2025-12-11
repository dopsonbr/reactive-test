import { createContext, useContext } from 'react';
import type {
  Transaction,
  TransactionStatus,
  LineItem,
  CustomerSummary,
  FulfillmentConfig,
  PaymentRecord,
  PaymentMethod,
  TransactionReceipt,
  MarkdownInfo,
  Product,
} from '../types/transaction';

export interface TransactionContextValue {
  // Current transaction state
  transaction: Transaction | null;
  status: TransactionStatus;
  isActive: boolean;

  // Transaction lifecycle
  startTransaction: () => Promise<void>;
  suspendTransaction: () => Promise<void>;
  resumeTransaction: (transactionId: string) => Promise<void>;
  voidTransaction: (reason: string) => Promise<void>;

  // Item operations
  addItem: (sku: string, quantity?: number) => Promise<void>;
  addItemWithProduct: (product: Product, quantity?: number) => void;
  updateItemQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  applyItemMarkdown: (lineId: string, markdown: Omit<MarkdownInfo, 'markdownId'>) => Promise<void>;
  removeItemMarkdown: (lineId: string) => void;

  // Customer operations
  setCustomer: (customer: CustomerSummary) => void;
  clearCustomer: () => void;

  // Checkout flow
  proceedToCheckout: () => void;
  returnToCart: () => void;
  setFulfillment: (config: FulfillmentConfig) => void;
  clearFulfillment: () => void;

  // Payment flow
  proceedToPayment: () => void;
  addPayment: (method: PaymentMethod, amount: number, details?: Partial<PaymentRecord>) => Promise<void>;
  removePayment: (paymentId: string) => void;
  completeTransaction: () => Promise<TransactionReceipt>;

  // Loading and error states
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const TransactionContext = createContext<TransactionContextValue | undefined>(undefined);

export function useTransaction(): TransactionContextValue {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
}

// Export for conditional usage where hook might not be inside provider
export function useTransactionOptional(): TransactionContextValue | null {
  const context = useContext(TransactionContext);
  return context ?? null;
}
