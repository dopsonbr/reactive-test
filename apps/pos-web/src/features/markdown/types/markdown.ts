export type MarkdownType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'OVERRIDE_PRICE';

export type MarkdownReason =
  | 'PRICE_MATCH'
  | 'DAMAGED_ITEM'
  | 'CUSTOMER_SERVICE'
  | 'BUNDLE_DEAL'
  | 'MANAGER_DISCRETION'
  | 'LOYALTY_EXCEPTION'
  | 'OVERRIDE';

export type MarkdownPermissionTier = 'ASSOCIATE' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN';

export interface MarkdownLimit {
  tier: MarkdownPermissionTier;
  allowedTypes: MarkdownType[];
  allowedReasons: MarkdownReason[];
  maxPercentage: number;
  maxFixedAmount: number;
  canOverridePrice: boolean;
}

export interface MarkdownInput {
  lineId?: string; // Item markdown (undefined for cart-level)
  type: MarkdownType;
  value: number;
  reason: MarkdownReason;
  notes?: string;
}

export interface MarkdownRequest {
  input: MarkdownInput;
  itemPrice: number;
  itemName: string;
}

export interface MarkdownInfo {
  id: string;
  type: MarkdownType;
  value: number;
  reason: MarkdownReason;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  appliedBy: string;
  appliedByName: string;
  appliedAt: Date;
  authorizedBy?: string;
  authorizedByName?: string;
  notes?: string;
}

export interface ManagerCredentials {
  managerId: string;
  pin: string;
}

export interface OverrideResult {
  success: boolean;
  approvedBy?: string;
  approverName?: string;
  newLimit?: MarkdownLimit;
  error?: string;
}

export interface MarkdownResult {
  success: boolean;
  markdown?: MarkdownInfo;
  error?: string;
}

// Permission tier limits configuration
export const MARKDOWN_TIER_LIMITS: Record<MarkdownPermissionTier, MarkdownLimit> = {
  ASSOCIATE: {
    tier: 'ASSOCIATE',
    allowedTypes: ['PERCENTAGE', 'FIXED_AMOUNT'],
    allowedReasons: ['PRICE_MATCH', 'DAMAGED_ITEM'],
    maxPercentage: 15,
    maxFixedAmount: 50,
    canOverridePrice: false,
  },
  SUPERVISOR: {
    tier: 'SUPERVISOR',
    allowedTypes: ['PERCENTAGE', 'FIXED_AMOUNT'],
    allowedReasons: ['PRICE_MATCH', 'DAMAGED_ITEM', 'CUSTOMER_SERVICE', 'BUNDLE_DEAL'],
    maxPercentage: 25,
    maxFixedAmount: 100,
    canOverridePrice: false,
  },
  MANAGER: {
    tier: 'MANAGER',
    allowedTypes: ['PERCENTAGE', 'FIXED_AMOUNT', 'OVERRIDE_PRICE'],
    allowedReasons: [
      'PRICE_MATCH',
      'DAMAGED_ITEM',
      'CUSTOMER_SERVICE',
      'BUNDLE_DEAL',
      'MANAGER_DISCRETION',
      'LOYALTY_EXCEPTION',
    ],
    maxPercentage: 50,
    maxFixedAmount: 500,
    canOverridePrice: true,
  },
  ADMIN: {
    tier: 'ADMIN',
    allowedTypes: ['PERCENTAGE', 'FIXED_AMOUNT', 'OVERRIDE_PRICE'],
    allowedReasons: [
      'PRICE_MATCH',
      'DAMAGED_ITEM',
      'CUSTOMER_SERVICE',
      'BUNDLE_DEAL',
      'MANAGER_DISCRETION',
      'LOYALTY_EXCEPTION',
      'OVERRIDE',
    ],
    maxPercentage: 100,
    maxFixedAmount: 10000,
    canOverridePrice: true,
  },
};

// Reason display labels
export const MARKDOWN_REASON_LABELS: Record<MarkdownReason, string> = {
  PRICE_MATCH: 'Price Match',
  DAMAGED_ITEM: 'Damaged Item',
  CUSTOMER_SERVICE: 'Customer Service',
  BUNDLE_DEAL: 'Bundle Deal',
  MANAGER_DISCRETION: 'Manager Discretion',
  LOYALTY_EXCEPTION: 'Loyalty Exception',
  OVERRIDE: 'Admin Override',
};

// Reason minimum tier
export const MARKDOWN_REASON_MIN_TIER: Record<MarkdownReason, MarkdownPermissionTier> = {
  PRICE_MATCH: 'ASSOCIATE',
  DAMAGED_ITEM: 'ASSOCIATE',
  CUSTOMER_SERVICE: 'SUPERVISOR',
  BUNDLE_DEAL: 'SUPERVISOR',
  MANAGER_DISCRETION: 'MANAGER',
  LOYALTY_EXCEPTION: 'MANAGER',
  OVERRIDE: 'ADMIN',
};

// Type display labels
export const MARKDOWN_TYPE_LABELS: Record<MarkdownType, string> = {
  PERCENTAGE: 'Percentage Off',
  FIXED_AMOUNT: 'Fixed Amount Off',
  OVERRIDE_PRICE: 'Set Price',
};
