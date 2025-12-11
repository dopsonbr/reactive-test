export enum UserRole {
  ASSOCIATE = 'ASSOCIATE',
  SUPERVISOR = 'SUPERVISOR',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  CONTACT_CENTER = 'CONTACT_CENTER',
  B2B_SALES = 'B2B_SALES',
}

export enum Permission {
  // Transaction
  TRANSACTION_CREATE = 'transaction:create',
  TRANSACTION_VOID = 'transaction:void',

  // Customer
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_EDIT = 'customer:edit',
  CUSTOMER_DELETE = 'customer:delete',
  CUSTOMER_SEARCH_ADVANCED = 'customer:search:advanced',

  // Markdown
  MARKDOWN_APPLY = 'markdown:apply',
  MARKDOWN_OVERRIDE = 'markdown:override',

  // Orders
  ORDER_VIEW = 'order:view',
  ORDER_EDIT = 'order:edit',
  ORDER_CANCEL = 'order:cancel',
  ORDER_REFUND = 'order:refund',

  // B2B
  B2B_VIEW = 'b2b:view',
  B2B_NET_TERMS = 'b2b:net_terms',
  B2B_ACCOUNT_MANAGE = 'b2b:account:manage',

  // Admin
  ADMIN_REPORTS = 'admin:reports',
  ADMIN_SETTINGS = 'admin:settings',
}

export type MarkdownPermissionTier = 'ASSOCIATE' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN';

// Base permissions for each role
const BASE_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ASSOCIATE]: [
    Permission.TRANSACTION_CREATE,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_SEARCH_ADVANCED,
    Permission.MARKDOWN_APPLY,
    Permission.ORDER_VIEW,
  ],
  [UserRole.SUPERVISOR]: [
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_VOID,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_EDIT,
    Permission.CUSTOMER_SEARCH_ADVANCED,
    Permission.MARKDOWN_APPLY,
    Permission.ORDER_VIEW,
    Permission.ORDER_EDIT,
  ],
  [UserRole.MANAGER]: [
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_VOID,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_EDIT,
    Permission.CUSTOMER_DELETE,
    Permission.CUSTOMER_SEARCH_ADVANCED,
    Permission.MARKDOWN_APPLY,
    Permission.MARKDOWN_OVERRIDE,
    Permission.ORDER_VIEW,
    Permission.ORDER_EDIT,
    Permission.ORDER_CANCEL,
    Permission.ORDER_REFUND,
    Permission.B2B_VIEW,
    Permission.ADMIN_REPORTS,
  ],
  [UserRole.ADMIN]: Object.values(Permission), // All permissions
  [UserRole.CONTACT_CENTER]: [
    Permission.TRANSACTION_CREATE,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_EDIT,
    Permission.CUSTOMER_SEARCH_ADVANCED,
    Permission.ORDER_VIEW,
    Permission.ORDER_EDIT,
  ],
  [UserRole.B2B_SALES]: [
    Permission.TRANSACTION_CREATE,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_EDIT,
    Permission.CUSTOMER_SEARCH_ADVANCED,
    Permission.B2B_VIEW,
    Permission.B2B_NET_TERMS,
    Permission.B2B_ACCOUNT_MANAGE,
    Permission.ORDER_VIEW,
    Permission.ORDER_EDIT,
  ],
};

export const ROLE_PERMISSIONS = BASE_ROLE_PERMISSIONS;

export const ROLE_MARKDOWN_TIER: Record<UserRole, MarkdownPermissionTier> = {
  [UserRole.ASSOCIATE]: 'ASSOCIATE',
  [UserRole.SUPERVISOR]: 'SUPERVISOR',
  [UserRole.MANAGER]: 'MANAGER',
  [UserRole.ADMIN]: 'ADMIN',
  [UserRole.CONTACT_CENTER]: 'ASSOCIATE',
  [UserRole.B2B_SALES]: 'ASSOCIATE',
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getMarkdownTier(role: UserRole): MarkdownPermissionTier {
  return ROLE_MARKDOWN_TIER[role];
}
