// Transaction Status State Machine
export type TransactionStatus =
  | 'IDLE'
  | 'ACTIVE'
  | 'CHECKOUT'
  | 'PAYMENT'
  | 'COMPLETE'
  | 'SUSPENDED'
  | 'VOID';

// Markdown Types
export type MarkdownType = 'PERCENT' | 'FIXED' | 'NEW_PRICE';
export type MarkdownReason =
  | 'DAMAGED'
  | 'OPEN_BOX'
  | 'PRICE_MATCH'
  | 'MANAGER_DISCRETION'
  | 'LOYALTY_REWARD'
  | 'PROMOTIONAL';

export interface MarkdownInfo {
  markdownId: string;
  type: MarkdownType;
  value: number;
  reason: MarkdownReason;
  employeeId: string;
  approvedBy: string | null;
}

// Line Items
export interface LineItem {
  lineId: string;
  sku: string;
  name: string;
  description?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discountPerItem: number;
  markdown: MarkdownInfo | null;
  lineTotal: number;
}

// Customer
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface CustomerSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  loyaltyTier: LoyaltyTier | null;
  loyaltyPoints: number;
  loyaltyMultiplier: number;
}

// Fulfillment
export type FulfillmentType = 'IMMEDIATE' | 'PICKUP' | 'DELIVERY' | 'WILL_CALL' | 'INSTALLATION';

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface FulfillmentConfig {
  type: FulfillmentType;
  scheduledDate?: Date;
  timeSlot?: string;
  address?: Address;
  instructions?: string;
  cost: number;
}

// Payments
export type PaymentMethod = 'CARD' | 'CASH' | 'GIFT_CARD' | 'STORE_CREDIT' | 'CHECK' | 'NET_TERMS';

export interface PaymentRecord {
  id: string;
  method: PaymentMethod;
  amount: number;
  timestamp: Date;
  // Card-specific
  cardBrand?: string;
  lastFour?: string;
  authorizationCode?: string;
  // Cash-specific
  tendered?: number;
  change?: number;
  // Gift card-specific
  giftCardNumber?: string;
}

// Transaction
export interface Transaction {
  id: string;
  storeNumber: number;
  employeeId: string;
  employeeName: string;
  status: TransactionStatus;

  // Cart
  items: LineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  fulfillmentTotal: number;
  grandTotal: number;

  // Customer (optional)
  customer: CustomerSummary | null;
  loyaltyApplied: boolean;
  pointsEarned: number;

  // Fulfillment
  fulfillment: FulfillmentConfig | null;

  // Payment
  payments: PaymentRecord[];
  amountPaid: number;
  amountDue: number;

  // Timestamps
  startedAt: Date;
  completedAt: Date | null;
  voidedAt: Date | null;
  voidReason: string | null;
}

// Totals calculation helper
export interface TotalsSummary {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  fulfillmentTotal: number;
  grandTotal: number;
}

// Transaction receipt for printing/email
export interface TransactionReceipt extends Transaction {
  receiptNumber: string;
  storeAddress: Address;
  storeName: string;
  storePhone: string;
  returnPolicy: string;
  barcodeData: string;
}

// Product from product service
export interface Product {
  sku: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  salePrice?: number;
  category: string;
  inStock: boolean;
  availableQuantity: number;
}

// Payment processing results
export interface CardPaymentResult {
  success: boolean;
  authorizationCode?: string;
  cardBrand?: string;
  lastFour?: string;
  isDebit?: boolean;
  errorMessage?: string;
  declineReason?: string;
}

export type PaymentState =
  | 'IDLE'
  | 'WAITING'
  | 'READING'
  | 'PROCESSING'
  | 'APPROVED'
  | 'DECLINED'
  | 'ERROR';

export interface PaymentError {
  code: string;
  message: string;
  recoverable: boolean;
}
