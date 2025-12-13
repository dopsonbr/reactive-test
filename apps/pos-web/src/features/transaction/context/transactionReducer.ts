import type {
  Transaction,
  TransactionStatus,
  LineItem,
  CustomerSummary,
  FulfillmentConfig,
  PaymentMethod,
  PaymentRecord,
  TotalsSummary,
  MarkdownInfo,
} from '../types/transaction';

// Action Types
export type TransactionAction =
  | { type: 'START_TRANSACTION'; payload: { id: string; storeNumber: number; employeeId: string; employeeName: string } }
  | { type: 'ADD_ITEM'; payload: LineItem }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { lineId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { lineId: string } }
  | { type: 'APPLY_MARKDOWN'; payload: { lineId: string; markdown: MarkdownInfo } }
  | { type: 'REMOVE_MARKDOWN'; payload: { lineId: string } }
  | { type: 'SET_CUSTOMER'; payload: CustomerSummary }
  | { type: 'CLEAR_CUSTOMER' }
  | { type: 'SET_STATUS'; payload: TransactionStatus }
  | { type: 'SET_FULFILLMENT'; payload: FulfillmentConfig }
  | { type: 'CLEAR_FULFILLMENT' }
  | { type: 'ADD_PAYMENT'; payload: PaymentRecord }
  | { type: 'REMOVE_PAYMENT'; payload: { paymentId: string } }
  | { type: 'COMPLETE_TRANSACTION' }
  | { type: 'VOID_TRANSACTION'; payload: { reason: string } }
  | { type: 'SUSPEND_TRANSACTION' }
  | { type: 'RESUME_TRANSACTION'; payload: Transaction }
  | { type: 'RESET' };

// Initial State
export const initialTransaction: Transaction = {
  id: '',
  storeNumber: 0,
  employeeId: '',
  employeeName: '',
  status: 'IDLE',
  items: [],
  subtotal: 0,
  discountTotal: 0,
  taxTotal: 0,
  fulfillmentTotal: 0,
  grandTotal: 0,
  customer: null,
  loyaltyApplied: false,
  pointsEarned: 0,
  fulfillment: null,
  payments: [],
  amountPaid: 0,
  amountDue: 0,
  startedAt: new Date(),
  completedAt: null,
  voidedAt: null,
  voidReason: null,
};

// Helper: Calculate line item total
export function calculateLineTotal(item: LineItem): number {
  const effectivePrice = item.unitPrice - item.discountPerItem;
  return effectivePrice * item.quantity;
}

// Helper: Calculate totals
export function calculateTotals(items: LineItem[], fulfillment: FulfillmentConfig | null): TotalsSummary {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountTotal = items.reduce(
    (sum, item) => sum + item.discountPerItem * item.quantity,
    0
  );
  // Example: 8% tax rate (would come from store config in production)
  const TAX_RATE = 0.08;
  const taxTotal = subtotal * TAX_RATE;
  const fulfillmentTotal = fulfillment?.cost ?? 0;
  const grandTotal = subtotal + taxTotal + fulfillmentTotal;

  return { subtotal, discountTotal, taxTotal, fulfillmentTotal, grandTotal };
}

// Helper: Calculate payment amounts
export function calculatePayments(payments: PaymentRecord[], grandTotal: number) {
  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const amountDue = Math.max(0, grandTotal - amountPaid);
  return { amountPaid, amountDue };
}

// Helper: Calculate loyalty points
export function calculatePoints(subtotal: number, customer: CustomerSummary | null): number {
  if (!customer) return 0;
  // Base: 1 point per dollar, multiplied by loyalty tier multiplier
  return Math.floor(subtotal * customer.loyaltyMultiplier);
}

// Reducer
export function transactionReducer(
  state: Transaction,
  action: TransactionAction
): Transaction {
  switch (action.type) {
    case 'START_TRANSACTION': {
      return {
        ...initialTransaction,
        id: action.payload.id,
        storeNumber: action.payload.storeNumber,
        employeeId: action.payload.employeeId,
        employeeName: action.payload.employeeName,
        status: 'ACTIVE',
        startedAt: new Date(),
      };
    }

    case 'ADD_ITEM': {
      // Check if item already exists
      const existingIndex = state.items.findIndex(
        (item) => item.sku === action.payload.sku && !item.markdown
      );

      let newItems: LineItem[];
      if (existingIndex >= 0) {
        // Update existing item quantity
        newItems = state.items.map((item, index) => {
          if (index === existingIndex) {
            const newQuantity = item.quantity + action.payload.quantity;
            return {
              ...item,
              quantity: newQuantity,
              lineTotal: calculateLineTotal({ ...item, quantity: newQuantity }),
            };
          }
          return item;
        });
      } else {
        // Add new item
        const newItem = {
          ...action.payload,
          lineTotal: calculateLineTotal(action.payload),
        };
        newItems = [...state.items, newItem];
      }

      const totals = calculateTotals(newItems, state.fulfillment);
      const pointsEarned = calculatePoints(totals.subtotal, state.customer);

      return {
        ...state,
        items: newItems,
        ...totals,
        pointsEarned,
        amountDue: totals.grandTotal - state.amountPaid,
      };
    }

    case 'UPDATE_ITEM_QUANTITY': {
      const { lineId, quantity } = action.payload;
      const newItems = state.items
        .map((item) => {
          if (item.lineId === lineId) {
            return {
              ...item,
              quantity,
              lineTotal: calculateLineTotal({ ...item, quantity }),
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);

      const totals = calculateTotals(newItems, state.fulfillment);
      const pointsEarned = calculatePoints(totals.subtotal, state.customer);

      return {
        ...state,
        items: newItems,
        ...totals,
        pointsEarned,
        amountDue: totals.grandTotal - state.amountPaid,
      };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(
        (item) => item.lineId !== action.payload.lineId
      );
      const totals = calculateTotals(newItems, state.fulfillment);
      const pointsEarned = calculatePoints(totals.subtotal, state.customer);

      return {
        ...state,
        items: newItems,
        ...totals,
        pointsEarned,
        amountDue: totals.grandTotal - state.amountPaid,
      };
    }

    case 'APPLY_MARKDOWN': {
      const { lineId, markdown } = action.payload;
      const newItems = state.items.map((item) => {
        if (item.lineId === lineId) {
          let discountPerItem = 0;
          switch (markdown.type) {
            case 'PERCENT':
              discountPerItem = item.originalPrice * (markdown.value / 100);
              break;
            case 'FIXED':
              discountPerItem = markdown.value;
              break;
            case 'NEW_PRICE':
              discountPerItem = item.originalPrice - markdown.value;
              break;
          }
          const newItem = {
            ...item,
            markdown,
            discountPerItem,
            unitPrice: item.originalPrice - discountPerItem,
          };
          return {
            ...newItem,
            lineTotal: calculateLineTotal(newItem),
          };
        }
        return item;
      });

      const totals = calculateTotals(newItems, state.fulfillment);
      const pointsEarned = calculatePoints(totals.subtotal, state.customer);

      return {
        ...state,
        items: newItems,
        ...totals,
        pointsEarned,
        amountDue: totals.grandTotal - state.amountPaid,
      };
    }

    case 'REMOVE_MARKDOWN': {
      const newItems = state.items.map((item) => {
        if (item.lineId === action.payload.lineId) {
          const newItem = {
            ...item,
            markdown: null,
            discountPerItem: 0,
            unitPrice: item.originalPrice,
          };
          return {
            ...newItem,
            lineTotal: calculateLineTotal(newItem),
          };
        }
        return item;
      });

      const totals = calculateTotals(newItems, state.fulfillment);
      const pointsEarned = calculatePoints(totals.subtotal, state.customer);

      return {
        ...state,
        items: newItems,
        ...totals,
        pointsEarned,
        amountDue: totals.grandTotal - state.amountPaid,
      };
    }

    case 'SET_CUSTOMER': {
      const pointsEarned = calculatePoints(state.subtotal, action.payload);
      return {
        ...state,
        customer: action.payload,
        loyaltyApplied: true,
        pointsEarned,
      };
    }

    case 'CLEAR_CUSTOMER': {
      return {
        ...state,
        customer: null,
        loyaltyApplied: false,
        pointsEarned: 0,
      };
    }

    case 'SET_STATUS': {
      return {
        ...state,
        status: action.payload,
      };
    }

    case 'SET_FULFILLMENT': {
      const totals = calculateTotals(state.items, action.payload);
      return {
        ...state,
        fulfillment: action.payload,
        ...totals,
        amountDue: totals.grandTotal - state.amountPaid,
      };
    }

    case 'CLEAR_FULFILLMENT': {
      const totals = calculateTotals(state.items, null);
      return {
        ...state,
        fulfillment: null,
        ...totals,
        amountDue: totals.grandTotal - state.amountPaid,
      };
    }

    case 'ADD_PAYMENT': {
      const newPayments = [...state.payments, action.payload];
      const { amountPaid, amountDue } = calculatePayments(
        newPayments,
        state.grandTotal
      );
      return {
        ...state,
        payments: newPayments,
        amountPaid,
        amountDue,
      };
    }

    case 'REMOVE_PAYMENT': {
      const newPayments = state.payments.filter(
        (p) => p.id !== action.payload.paymentId
      );
      const { amountPaid, amountDue } = calculatePayments(
        newPayments,
        state.grandTotal
      );
      return {
        ...state,
        payments: newPayments,
        amountPaid,
        amountDue,
      };
    }

    case 'COMPLETE_TRANSACTION': {
      return {
        ...state,
        status: 'COMPLETE',
        completedAt: new Date(),
      };
    }

    case 'VOID_TRANSACTION': {
      return {
        ...state,
        status: 'VOID',
        voidedAt: new Date(),
        voidReason: action.payload.reason,
      };
    }

    case 'SUSPEND_TRANSACTION': {
      return {
        ...state,
        status: 'SUSPENDED',
      };
    }

    case 'RESUME_TRANSACTION': {
      return {
        ...action.payload,
        status: 'ACTIVE',
      };
    }

    case 'RESET': {
      return initialTransaction;
    }

    default:
      return state;
  }
}
