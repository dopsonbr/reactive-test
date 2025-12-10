import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Permission, type MarkdownPermissionTier } from '../types/roles';

/**
 * Hook to check a single permission
 */
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Hook to check multiple permissions (all must be present)
 */
export function usePermissions(permissions: Permission[]): boolean {
  const { hasPermission } = useAuth();
  return useMemo(
    () => permissions.every((p) => hasPermission(p)),
    [permissions, hasPermission]
  );
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  const { hasPermission } = useAuth();
  return useMemo(
    () => permissions.some((p) => hasPermission(p)),
    [permissions, hasPermission]
  );
}

/**
 * Hook to get markdown tier and check if user can apply a markdown at a given tier
 */
export function useMarkdownPermission(): {
  tier: MarkdownPermissionTier | null;
  canApplyMarkdown: boolean;
  canOverrideMarkdown: boolean;
  canApplyTier: (requiredTier: MarkdownPermissionTier) => boolean;
} {
  const { markdownTier, hasPermission } = useAuth();

  const tierOrder: MarkdownPermissionTier[] = ['ASSOCIATE', 'SUPERVISOR', 'MANAGER', 'ADMIN'];

  const canApplyTier = (requiredTier: MarkdownPermissionTier): boolean => {
    if (!markdownTier) return false;
    return tierOrder.indexOf(markdownTier) >= tierOrder.indexOf(requiredTier);
  };

  return {
    tier: markdownTier,
    canApplyMarkdown: hasPermission(Permission.MARKDOWN_APPLY),
    canOverrideMarkdown: hasPermission(Permission.MARKDOWN_OVERRIDE),
    canApplyTier,
  };
}

/**
 * Hook to check transaction-related permissions
 */
export function useTransactionPermissions(): {
  canCreate: boolean;
  canVoid: boolean;
} {
  const { hasPermission } = useAuth();

  return {
    canCreate: hasPermission(Permission.TRANSACTION_CREATE),
    canVoid: hasPermission(Permission.TRANSACTION_VOID),
  };
}

/**
 * Hook to check customer-related permissions
 */
export function useCustomerPermissions(): {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSearchAdvanced: boolean;
} {
  const { hasPermission } = useAuth();

  return {
    canView: hasPermission(Permission.CUSTOMER_VIEW),
    canCreate: hasPermission(Permission.CUSTOMER_CREATE),
    canEdit: hasPermission(Permission.CUSTOMER_EDIT),
    canDelete: hasPermission(Permission.CUSTOMER_DELETE),
    canSearchAdvanced: hasPermission(Permission.CUSTOMER_SEARCH_ADVANCED),
  };
}

/**
 * Hook to check order-related permissions
 */
export function useOrderPermissions(): {
  canView: boolean;
  canEdit: boolean;
  canCancel: boolean;
  canRefund: boolean;
} {
  const { hasPermission } = useAuth();

  return {
    canView: hasPermission(Permission.ORDER_VIEW),
    canEdit: hasPermission(Permission.ORDER_EDIT),
    canCancel: hasPermission(Permission.ORDER_CANCEL),
    canRefund: hasPermission(Permission.ORDER_REFUND),
  };
}

/**
 * Hook to check B2B-related permissions
 */
export function useB2BPermissions(): {
  canUseNetTerms: boolean;
  canManageAccounts: boolean;
} {
  const { hasPermission } = useAuth();

  return {
    canUseNetTerms: hasPermission(Permission.B2B_NET_TERMS),
    canManageAccounts: hasPermission(Permission.B2B_ACCOUNT_MANAGE),
  };
}
