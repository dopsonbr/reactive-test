import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '../../auth';
import type {
  MarkdownType,
  MarkdownReason,
  MarkdownLimit,
  MarkdownRequest,
  OverrideResult,
  ManagerCredentials,
  MarkdownPermissionTier,
} from '../types/markdown';
import { MARKDOWN_TIER_LIMITS } from '../types/markdown';

interface MarkdownPermissionContextValue {
  tier: MarkdownPermissionTier;
  limits: MarkdownLimit;

  canApplyMarkdownType: (type: MarkdownType) => boolean;
  canUseReason: (reason: MarkdownReason) => boolean;
  isWithinLimit: (type: MarkdownType, value: number, itemPrice: number) => boolean;

  getMaxPercentage: () => number;
  getMaxFixedAmount: () => number;
  canOverridePrice: () => boolean;

  requestOverride: (markdown: MarkdownRequest) => void;
  authorizeOverride: (credentials: ManagerCredentials) => Promise<OverrideResult>;
  cancelOverride: () => void;

  pendingOverride: MarkdownRequest | null;
  elevatedLimits: MarkdownLimit | null;
  clearElevation: () => void;
}

const MarkdownPermissionContext = createContext<MarkdownPermissionContextValue | undefined>(undefined);

interface MarkdownPermissionProviderProps {
  children: ReactNode;
}

export function MarkdownPermissionProvider({ children }: MarkdownPermissionProviderProps) {
  const { user } = useAuth();
  const [pendingOverride, setPendingOverride] = useState<MarkdownRequest | null>(null);
  const [elevatedLimits, setElevatedLimits] = useState<MarkdownLimit | null>(null);

  // Get tier from user's role (using the markdown tier from roles.ts)
  const tier = useMemo<MarkdownPermissionTier>(() => {
    if (!user) return 'ASSOCIATE';

    switch (user.role) {
      case 'ADMIN':
        return 'ADMIN';
      case 'MANAGER':
        return 'MANAGER';
      case 'SUPERVISOR':
        return 'SUPERVISOR';
      default:
        return 'ASSOCIATE';
    }
  }, [user]);

  // Get the current effective limits (elevated if override approved)
  const limits = useMemo(() => {
    return elevatedLimits || MARKDOWN_TIER_LIMITS[tier];
  }, [tier, elevatedLimits]);

  const canApplyMarkdownType = useCallback(
    (type: MarkdownType) => {
      return limits.allowedTypes.includes(type);
    },
    [limits]
  );

  const canUseReason = useCallback(
    (reason: MarkdownReason) => {
      return limits.allowedReasons.includes(reason);
    },
    [limits]
  );

  const isWithinLimit = useCallback(
    (type: MarkdownType, value: number, itemPrice: number) => {
      switch (type) {
        case 'PERCENTAGE':
          return value <= limits.maxPercentage;
        case 'FIXED_AMOUNT':
          return value <= limits.maxFixedAmount;
        case 'OVERRIDE_PRICE':
          // For override price, check if the discount percentage is within limits
          const discountPercent = ((itemPrice - value) / itemPrice) * 100;
          return limits.canOverridePrice && discountPercent <= limits.maxPercentage;
        default:
          return false;
      }
    },
    [limits]
  );

  const getMaxPercentage = useCallback(() => limits.maxPercentage, [limits]);
  const getMaxFixedAmount = useCallback(() => limits.maxFixedAmount, [limits]);
  const canOverridePrice = useCallback(() => limits.canOverridePrice, [limits]);

  const requestOverride = useCallback((markdown: MarkdownRequest) => {
    setPendingOverride(markdown);
  }, []);

  const authorizeOverride = useCallback(
    async (credentials: ManagerCredentials): Promise<OverrideResult> => {
      // Simulate API call to verify manager credentials
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock manager validation (in real app, this would call backend)
      if (credentials.managerId.length >= 4 && credentials.pin.length >= 4) {
        const managerLimits = MARKDOWN_TIER_LIMITS['MANAGER'];
        setElevatedLimits(managerLimits);
        setPendingOverride(null);
        return {
          success: true,
          approvedBy: credentials.managerId,
          approverName: 'Manager Override',
          newLimit: managerLimits,
        };
      }

      return {
        success: false,
        error: 'Invalid manager credentials',
      };
    },
    []
  );

  const cancelOverride = useCallback(() => {
    setPendingOverride(null);
  }, []);

  const clearElevation = useCallback(() => {
    setElevatedLimits(null);
  }, []);

  const value: MarkdownPermissionContextValue = {
    tier,
    limits,
    canApplyMarkdownType,
    canUseReason,
    isWithinLimit,
    getMaxPercentage,
    getMaxFixedAmount,
    canOverridePrice,
    requestOverride,
    authorizeOverride,
    cancelOverride,
    pendingOverride,
    elevatedLimits,
    clearElevation,
  };

  return (
    <MarkdownPermissionContext.Provider value={value}>
      {children}
    </MarkdownPermissionContext.Provider>
  );
}

export function useMarkdownPermissions() {
  const context = useContext(MarkdownPermissionContext);
  if (context === undefined) {
    throw new Error('useMarkdownPermissions must be used within a MarkdownPermissionProvider');
  }
  return context;
}
