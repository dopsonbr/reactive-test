// Context
export { TransactionContext, useTransaction, useTransactionOptional } from './context/TransactionContext';
export type { TransactionContextValue } from './context/TransactionContext';
export { TransactionProvider } from './context/TransactionProvider';

// Types
export type {
  Transaction,
  TransactionStatus,
  LineItem,
  CustomerSummary,
  FulfillmentConfig,
  FulfillmentType,
  PaymentRecord,
  PaymentMethod,
  PaymentState,
  PaymentError,
  CardPaymentResult,
  TransactionReceipt,
  Product,
  MarkdownInfo,
  MarkdownType,
  MarkdownReason,
  LoyaltyTier,
  Address,
  TotalsSummary,
} from './types/transaction';

// Components
export { ItemEntry, SkuInput, ProductSearch } from './components/ItemEntry';
export { CartPanel, LineItemCard, QuantityInput, CartTotals } from './components/CartPanel';

// Pages
export { TransactionPage, CheckoutPage, PaymentPage, CompletePage } from './pages';

// Hooks
export { useSKUInput } from './hooks/useSKUInput';
export { useProductLookup, useProductSearch, usePrefetchProduct } from './hooks/useProductLookup';
