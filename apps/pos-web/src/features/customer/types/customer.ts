// Customer Types

export type CustomerType = 'CONSUMER' | 'BUSINESS';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type AccountTier = 'STANDARD' | 'PREFERRED' | 'PREMIER' | 'ENTERPRISE';
export type PaymentTerms = 'NET_30' | 'NET_60' | 'NET_90' | 'CUSTOM';

export type AddressType = 'SHIPPING' | 'BILLING' | 'BOTH';

export interface Address {
  id: string;
  type: AddressType;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

export interface AddressInput {
  type: AddressType;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

export interface CommunicationPreferences {
  emailPromotions: boolean;
  smsAlerts: boolean;
  directMail: boolean;
}

export interface B2BInfo {
  companyName: string;
  taxId: string;
  industry?: string;
  website?: string;
  accountTier: AccountTier;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  parentCustomerId?: string;
  salesRepId?: string;
  salesRepName?: string;
}

export interface B2BInfoInput {
  companyInfo: {
    companyName: string;
    taxId: string;
    industry?: string;
    website?: string;
  };
  accountTier: AccountTier;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  parentCustomerId?: string;
  salesRepId?: string;
}

export interface LoyaltyInfo {
  tier: LoyaltyTier;
  currentPoints: number;
  lifetimePoints: number;
  multiplier: number;
  tierExpiration?: Date;
  enrollmentDate: Date;
}

export interface Customer {
  id: string;
  type: CustomerType;
  status: CustomerStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addresses: Address[];
  communicationPreferences: CommunicationPreferences;
  loyalty?: LoyaltyInfo;
  b2bInfo?: B2BInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerInput {
  type: CustomerType;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addresses: AddressInput[];
  communicationPreferences: CommunicationPreferences;
  b2bInfo?: B2BInfoInput;
}

export interface CustomerSuggestion {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  type: CustomerType;
  loyaltyTier?: LoyaltyTier;
  accountTier?: AccountTier;
}

export interface CustomerSearchParams {
  q?: string;
  email?: string;
  phone?: string;
  type?: CustomerType;
  loyaltyTier?: LoyaltyTier;
  accountTier?: AccountTier;
  status?: CustomerStatus;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

export interface CustomerSearchResult {
  customers: Customer[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
  lifetimePoints: number;
  currentPoints: number;
}

export interface LoyaltyDetails {
  tier: LoyaltyTier;
  currentPoints: number;
  lifetimePoints: number;
  pointsToNextTier: number;
  nextTier: LoyaltyTier | null;
  multiplier: number;
  tierExpiration: Date | null;
  pointsHistory: PointsTransaction[];
}

export interface PointsTransaction {
  id: string;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  points: number;
  balance: number;
  description: string;
  orderId?: string;
  date: Date;
}

export interface CreditUtilization {
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  utilizationPercent: number;
  lastPaymentDate: Date | null;
  nextPaymentDue: Date | null;
}

export interface CustomerActivity {
  id: string;
  type: ActivityType;
  description: string;
  metadata: Record<string, unknown>;
  userId: string;
  timestamp: Date;
}

export type ActivityType =
  | 'ORDER_PLACED'
  | 'ORDER_CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_COMPLETED'
  | 'PROFILE_UPDATED'
  | 'ADDRESS_ADDED'
  | 'ADDRESS_UPDATED'
  | 'LOYALTY_ENROLLED'
  | 'POINTS_EARNED'
  | 'POINTS_REDEEMED'
  | 'SUPPORT_TICKET'
  | 'NOTE_ADDED';

export interface CustomerNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  isPinned: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: Date;
  storeNumber: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

// Loyalty tier configuration
export const LOYALTY_TIERS: Record<LoyaltyTier, { pointsRequired: number; multiplier: number; benefits: string[] }> = {
  BRONZE: {
    pointsRequired: 0,
    multiplier: 1,
    benefits: ['Base earn rate'],
  },
  SILVER: {
    pointsRequired: 1000,
    multiplier: 1.25,
    benefits: ['1.25x earn rate', 'Early sale access'],
  },
  GOLD: {
    pointsRequired: 2500,
    multiplier: 1.5,
    benefits: ['1.5x earn rate', 'Free shipping', 'Birthday bonus'],
  },
  PLATINUM: {
    pointsRequired: 5000,
    multiplier: 2,
    benefits: ['2x earn rate', 'Exclusive events', 'Dedicated support'],
  },
};

// Account tier configuration
export const ACCOUNT_TIERS: Record<AccountTier, { creditLimit: number; discount: number; terms: PaymentTerms[] }> = {
  STANDARD: {
    creditLimit: 10000,
    discount: 0,
    terms: ['NET_30'],
  },
  PREFERRED: {
    creditLimit: 50000,
    discount: 5,
    terms: ['NET_30', 'NET_60'],
  },
  PREMIER: {
    creditLimit: 200000,
    discount: 10,
    terms: ['NET_30', 'NET_60', 'NET_90'],
  },
  ENTERPRISE: {
    creditLimit: 1000000,
    discount: 15,
    terms: ['NET_30', 'NET_60', 'NET_90', 'CUSTOM'],
  },
};
