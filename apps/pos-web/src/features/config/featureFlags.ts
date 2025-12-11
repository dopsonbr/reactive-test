import { createContext, useContext } from 'react';

export interface POSFeatureFlags {
  // Markdown/Discount Features
  enableMarkdowns: boolean;
  enableManagerOverride: boolean;
  maxMarkdownWithoutOverride: number; // percentage

  // Fulfillment Features
  enableMultiFulfillment: boolean;
  enableWillCall: boolean;
  enableInstallation: boolean;
  enableDeliveryScheduling: boolean;

  // B2B Features
  enableB2BFeatures: boolean;
  enableNetTerms: boolean;
  enableBulkItemEntry: boolean;
  enableQuotes: boolean;
  enablePONumber: boolean;

  // Payment Features
  enableCardNotPresent: boolean;
  enableSplitPayment: boolean;
  enableWalletPayment: boolean;
  enableGiftCards: boolean;
  enableStoreCredit: boolean;

  // Order Management
  enableOrderLookup: boolean;
  enableReturns: boolean;
  enableExchanges: boolean;
  enableOrderModification: boolean;

  // Customer Features
  enableLoyalty: boolean;
  enableCustomerCreate: boolean;
  enableAdvancedCustomerSearch: boolean;

  // Audit & Compliance
  enableAuditTrail: boolean;
  requireReasonForVoid: boolean;
  requireSignatureForRefund: boolean;
}

// Default flags - all features enabled
export const DEFAULT_FEATURE_FLAGS: POSFeatureFlags = {
  enableMarkdowns: true,
  enableManagerOverride: true,
  maxMarkdownWithoutOverride: 15,

  enableMultiFulfillment: true,
  enableWillCall: true,
  enableInstallation: true,
  enableDeliveryScheduling: true,

  enableB2BFeatures: true,
  enableNetTerms: true,
  enableBulkItemEntry: true,
  enableQuotes: true,
  enablePONumber: true,

  enableCardNotPresent: true,
  enableSplitPayment: true,
  enableWalletPayment: true,
  enableGiftCards: true,
  enableStoreCredit: true,

  enableOrderLookup: true,
  enableReturns: true,
  enableExchanges: true,
  enableOrderModification: true,

  enableLoyalty: true,
  enableCustomerCreate: true,
  enableAdvancedCustomerSearch: true,

  enableAuditTrail: true,
  requireReasonForVoid: true,
  requireSignatureForRefund: false,
};

// Store-specific overrides
export interface StoreFeatureOverrides {
  storeNumber: number;
  flags: Partial<POSFeatureFlags>;
}

// Role-specific overrides
export interface RoleFeatureOverrides {
  role: string;
  flags: Partial<POSFeatureFlags>;
}

// Feature flag context
interface FeatureFlagContextValue {
  flags: POSFeatureFlags;
  isEnabled: (flag: keyof POSFeatureFlags) => boolean;
  getNumericFlag: (flag: keyof POSFeatureFlags) => number;
}

export const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(undefined);

export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    // Return default flags if no provider
    return {
      flags: DEFAULT_FEATURE_FLAGS,
      isEnabled: (flag) => {
        const value = DEFAULT_FEATURE_FLAGS[flag];
        return typeof value === 'boolean' ? value : false;
      },
      getNumericFlag: (flag) => {
        const value = DEFAULT_FEATURE_FLAGS[flag];
        return typeof value === 'number' ? value : 0;
      },
    };
  }
  return context;
}

// Merge flags with overrides
export function mergeFlags(
  base: POSFeatureFlags,
  storeOverrides?: Partial<POSFeatureFlags>,
  roleOverrides?: Partial<POSFeatureFlags>
): POSFeatureFlags {
  return {
    ...base,
    ...storeOverrides,
    ...roleOverrides,
  };
}

// Feature flag utilities
export function isFeatureEnabled(flags: POSFeatureFlags, flag: keyof POSFeatureFlags): boolean {
  const value = flags[flag];
  return typeof value === 'boolean' ? value : false;
}

export function getNumericFlag(flags: POSFeatureFlags, flag: keyof POSFeatureFlags): number {
  const value = flags[flag];
  return typeof value === 'number' ? value : 0;
}

// Predefined store configurations
export const STORE_CONFIGS: Record<string, Partial<POSFeatureFlags>> = {
  // Contact center stores have limited features
  CONTACT_CENTER: {
    enableMultiFulfillment: false,
    enableInstallation: false,
    enableGiftCards: false,
    enableStoreCredit: false,
  },
  // B2B-only stores
  B2B_STORE: {
    enableLoyalty: false,
    enableGiftCards: false,
    enableCardNotPresent: true,
    enableNetTerms: true,
  },
  // Kiosk mode
  KIOSK: {
    enableMarkdowns: false,
    enableManagerOverride: false,
    enableB2BFeatures: false,
    enableReturns: false,
    enableCustomerCreate: false,
  },
};

// Role configurations
export const ROLE_CONFIGS: Record<string, Partial<POSFeatureFlags>> = {
  ASSOCIATE: {
    maxMarkdownWithoutOverride: 15,
    enableOrderModification: false,
    enableQuotes: false,
  },
  SUPERVISOR: {
    maxMarkdownWithoutOverride: 25,
    enableOrderModification: true,
  },
  MANAGER: {
    maxMarkdownWithoutOverride: 50,
    enableOrderModification: true,
    enableQuotes: true,
  },
  ADMIN: {
    // Full access - no restrictions
  },
};
