import { useReducer, useCallback, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionContext, type TransactionContextValue } from './TransactionContext';
import { transactionReducer, initialTransaction } from './transactionReducer';
import { useAuth } from '../../auth';
import type {
  TransactionStatus,
  CustomerSummary,
  FulfillmentConfig,
  PaymentMethod,
  PaymentRecord,
  TransactionReceipt,
  MarkdownInfo,
  LineItem,
  Product,
} from '../types/transaction';

interface TransactionProviderProps {
  children: ReactNode;
}

// Generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Mock product lookup (would be API call in production)
async function lookupProduct(sku: string): Promise<Product | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock product data
  const mockProducts: Record<string, Product> = {
    'SKU-001': {
      sku: 'SKU-001',
      name: 'Premium Widget',
      description: 'High-quality widget for all your needs',
      price: 29.99,
      category: 'Widgets',
      inStock: true,
      availableQuantity: 50,
    },
    'SKU-002': {
      sku: 'SKU-002',
      name: 'Standard Gadget',
      description: 'Reliable everyday gadget',
      price: 19.99,
      salePrice: 14.99,
      category: 'Gadgets',
      inStock: true,
      availableQuantity: 100,
    },
    'SKU-003': {
      sku: 'SKU-003',
      name: 'Deluxe Accessory',
      description: 'Premium accessory with advanced features',
      price: 49.99,
      category: 'Accessories',
      inStock: true,
      availableQuantity: 25,
    },
  };

  return mockProducts[sku] ?? null;
}

export function TransactionProvider({ children }: TransactionProviderProps) {
  const [state, dispatch] = useReducer(transactionReducer, initialTransaction);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, storeNumber } = useAuth();

  const clearError = useCallback(() => setError(null), []);

  // Transaction lifecycle
  const startTransaction = useCallback(async () => {
    if (!user || !storeNumber) {
      setError('Must be logged in to start transaction');
      return;
    }

    setIsLoading(true);
    try {
      const transactionId = generateId('TXN');
      dispatch({
        type: 'START_TRANSACTION',
        payload: {
          id: transactionId,
          storeNumber,
          employeeId: user.employeeId,
          employeeName: user.name,
        },
      });
      navigate('/transaction');
    } finally {
      setIsLoading(false);
    }
  }, [user, storeNumber, navigate]);

  const suspendTransaction = useCallback(async () => {
    dispatch({ type: 'SUSPEND_TRANSACTION' });
    // In production, would save to backend for later retrieval
    navigate('/');
  }, [navigate]);

  const resumeTransaction = useCallback(async (transactionId: string) => {
    setIsLoading(true);
    try {
      // In production, would fetch from backend
      // For now, just simulate
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Would dispatch RESUME_TRANSACTION with fetched data
      navigate('/transaction');
    } catch {
      setError('Failed to resume transaction');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const voidTransaction = useCallback(async (reason: string) => {
    dispatch({ type: 'VOID_TRANSACTION', payload: { reason } });
    navigate('/');
  }, [navigate]);

  // Item operations
  const addItem = useCallback(async (sku: string, quantity: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const product = await lookupProduct(sku);
      if (!product) {
        setError(`Product not found: ${sku}`);
        return;
      }

      if (!product.inStock) {
        setError(`Product out of stock: ${product.name}`);
        return;
      }

      const lineItem: LineItem = {
        lineId: generateId('LINE'),
        sku: product.sku,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        quantity,
        unitPrice: product.salePrice ?? product.price,
        originalPrice: product.price,
        discountPerItem: product.salePrice ? product.price - product.salePrice : 0,
        markdown: null,
        lineTotal: (product.salePrice ?? product.price) * quantity,
      };

      dispatch({ type: 'ADD_ITEM', payload: lineItem });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateItemQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity < 0) return;
    dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { lineId, quantity } });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { lineId } });
  }, []);

  const applyItemMarkdown = useCallback(
    async (lineId: string, markdown: Omit<MarkdownInfo, 'markdownId'>) => {
      const fullMarkdown: MarkdownInfo = {
        ...markdown,
        markdownId: generateId('MD'),
      };
      dispatch({ type: 'APPLY_MARKDOWN', payload: { lineId, markdown: fullMarkdown } });
    },
    []
  );

  const removeItemMarkdown = useCallback((lineId: string) => {
    dispatch({ type: 'REMOVE_MARKDOWN', payload: { lineId } });
  }, []);

  // Customer operations
  const setCustomer = useCallback((customer: CustomerSummary) => {
    dispatch({ type: 'SET_CUSTOMER', payload: customer });
  }, []);

  const clearCustomer = useCallback(() => {
    dispatch({ type: 'CLEAR_CUSTOMER' });
  }, []);

  // Checkout flow
  const proceedToCheckout = useCallback(() => {
    if (state.items.length === 0) {
      setError('Cart is empty');
      return;
    }
    dispatch({ type: 'SET_STATUS', payload: 'CHECKOUT' });
    navigate('/transaction/checkout');
  }, [state.items.length, navigate]);

  const returnToCart = useCallback(() => {
    dispatch({ type: 'SET_STATUS', payload: 'ACTIVE' });
    navigate('/transaction');
  }, [navigate]);

  const setFulfillment = useCallback((config: FulfillmentConfig) => {
    dispatch({ type: 'SET_FULFILLMENT', payload: config });
  }, []);

  const clearFulfillment = useCallback(() => {
    dispatch({ type: 'CLEAR_FULFILLMENT' });
  }, []);

  // Payment flow
  const proceedToPayment = useCallback(() => {
    if (!state.fulfillment) {
      setError('Please select fulfillment method');
      return;
    }
    dispatch({ type: 'SET_STATUS', payload: 'PAYMENT' });
    navigate('/transaction/payment');
  }, [state.fulfillment, navigate]);

  const addPayment = useCallback(
    async (method: PaymentMethod, amount: number, details?: Partial<PaymentRecord>) => {
      const payment: PaymentRecord = {
        id: generateId('PAY'),
        method,
        amount,
        timestamp: new Date(),
        ...details,
      };
      dispatch({ type: 'ADD_PAYMENT', payload: payment });
    },
    []
  );

  const removePayment = useCallback((paymentId: string) => {
    dispatch({ type: 'REMOVE_PAYMENT', payload: { paymentId } });
  }, []);

  const completeTransaction = useCallback(async (): Promise<TransactionReceipt> => {
    setIsLoading(true);
    try {
      // In production, would submit to backend
      await new Promise((resolve) => setTimeout(resolve, 500));

      dispatch({ type: 'COMPLETE_TRANSACTION' });

      // Build receipt
      const receipt: TransactionReceipt = {
        ...state,
        status: 'COMPLETE',
        completedAt: new Date(),
        receiptNumber: `R${Date.now()}`,
        storeName: `Store #${state.storeNumber}`,
        storeAddress: {
          street1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          zip: '12345',
          country: 'USA',
        },
        storePhone: '(555) 123-4567',
        returnPolicy: 'Returns accepted within 30 days with receipt.',
        barcodeData: state.id,
      };

      navigate('/transaction/complete');
      return receipt;
    } finally {
      setIsLoading(false);
    }
  }, [state, navigate]);

  const value: TransactionContextValue = useMemo(
    () => ({
      transaction: state.id ? state : null,
      status: state.status,
      isActive: state.status === 'ACTIVE',
      startTransaction,
      suspendTransaction,
      resumeTransaction,
      voidTransaction,
      addItem,
      updateItemQuantity,
      removeItem,
      applyItemMarkdown,
      removeItemMarkdown,
      setCustomer,
      clearCustomer,
      proceedToCheckout,
      returnToCart,
      setFulfillment,
      clearFulfillment,
      proceedToPayment,
      addPayment,
      removePayment,
      completeTransaction,
      isLoading,
      error,
      clearError,
    }),
    [
      state,
      startTransaction,
      suspendTransaction,
      resumeTransaction,
      voidTransaction,
      addItem,
      updateItemQuantity,
      removeItem,
      applyItemMarkdown,
      removeItemMarkdown,
      setCustomer,
      clearCustomer,
      proceedToCheckout,
      returnToCart,
      setFulfillment,
      clearFulfillment,
      proceedToPayment,
      addPayment,
      removePayment,
      completeTransaction,
      isLoading,
      error,
      clearError,
    ]
  );

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}
