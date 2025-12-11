// Audit Types

export type AuditAction =
  // Transaction Actions
  | 'TRANSACTION_STARTED'
  | 'TRANSACTION_COMPLETED'
  | 'TRANSACTION_VOIDED'
  | 'TRANSACTION_SUSPENDED'
  | 'TRANSACTION_RESUMED'

  // Item Actions
  | 'ITEM_ADDED'
  | 'ITEM_REMOVED'
  | 'ITEM_QUANTITY_CHANGED'

  // Markdown Actions
  | 'MARKDOWN_APPLIED'
  | 'MARKDOWN_REMOVED'
  | 'MARKDOWN_OVERRIDE_REQUESTED'
  | 'MARKDOWN_OVERRIDE_APPROVED'
  | 'MARKDOWN_OVERRIDE_DENIED'

  // Payment Actions
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_CAPTURED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_VOIDED'
  | 'PAYMENT_REFUNDED'

  // Customer Actions
  | 'CUSTOMER_ATTACHED'
  | 'CUSTOMER_DETACHED'
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'

  // Order Actions
  | 'ORDER_LOOKUP'
  | 'ORDER_MODIFIED'
  | 'ORDER_CANCELLED'
  | 'RETURN_INITIATED'
  | 'RETURN_COMPLETED'
  | 'REFUND_ISSUED'

  // Security Actions
  | 'LOGIN'
  | 'LOGOUT'
  | 'OVERRIDE_USED'
  | 'PERMISSION_DENIED'

  // Register Actions
  | 'REGISTER_OPENED'
  | 'REGISTER_CLOSED'
  | 'CASH_DRAWER_OPENED'
  | 'NO_SALE';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  severity: AuditSeverity;

  // Actor information
  userId: string;
  userName: string;
  userRole: string;

  // Context
  storeNumber: number;
  registerId: string;
  sessionId: string;

  // Related entities
  transactionId?: string;
  customerId?: string;
  orderId?: string;

  // Action details
  description: string;
  details: Record<string, unknown>;

  // For overrides
  authorizedBy?: string;
  authorizerName?: string;
}

export interface AuditSearchParams {
  startDate?: Date;
  endDate?: Date;
  action?: AuditAction;
  severity?: AuditSeverity;
  userId?: string;
  storeNumber?: number;
  transactionId?: string;
  customerId?: string;
  page: number;
  size: number;
}

export interface AuditSearchResult {
  entries: AuditEntry[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Action configuration
export const AUDIT_ACTION_CONFIG: Record<AuditAction, { label: string; severity: AuditSeverity }> = {
  // Transaction
  TRANSACTION_STARTED: { label: 'Transaction Started', severity: 'INFO' },
  TRANSACTION_COMPLETED: { label: 'Transaction Completed', severity: 'INFO' },
  TRANSACTION_VOIDED: { label: 'Transaction Voided', severity: 'WARNING' },
  TRANSACTION_SUSPENDED: { label: 'Transaction Suspended', severity: 'INFO' },
  TRANSACTION_RESUMED: { label: 'Transaction Resumed', severity: 'INFO' },

  // Items
  ITEM_ADDED: { label: 'Item Added', severity: 'INFO' },
  ITEM_REMOVED: { label: 'Item Removed', severity: 'INFO' },
  ITEM_QUANTITY_CHANGED: { label: 'Quantity Changed', severity: 'INFO' },

  // Markdown
  MARKDOWN_APPLIED: { label: 'Markdown Applied', severity: 'INFO' },
  MARKDOWN_REMOVED: { label: 'Markdown Removed', severity: 'INFO' },
  MARKDOWN_OVERRIDE_REQUESTED: { label: 'Override Requested', severity: 'WARNING' },
  MARKDOWN_OVERRIDE_APPROVED: { label: 'Override Approved', severity: 'WARNING' },
  MARKDOWN_OVERRIDE_DENIED: { label: 'Override Denied', severity: 'WARNING' },

  // Payment
  PAYMENT_INITIATED: { label: 'Payment Started', severity: 'INFO' },
  PAYMENT_CAPTURED: { label: 'Payment Captured', severity: 'INFO' },
  PAYMENT_FAILED: { label: 'Payment Failed', severity: 'WARNING' },
  PAYMENT_VOIDED: { label: 'Payment Voided', severity: 'WARNING' },
  PAYMENT_REFUNDED: { label: 'Payment Refunded', severity: 'WARNING' },

  // Customer
  CUSTOMER_ATTACHED: { label: 'Customer Attached', severity: 'INFO' },
  CUSTOMER_DETACHED: { label: 'Customer Detached', severity: 'INFO' },
  CUSTOMER_CREATED: { label: 'Customer Created', severity: 'INFO' },
  CUSTOMER_UPDATED: { label: 'Customer Updated', severity: 'INFO' },

  // Order
  ORDER_LOOKUP: { label: 'Order Lookup', severity: 'INFO' },
  ORDER_MODIFIED: { label: 'Order Modified', severity: 'WARNING' },
  ORDER_CANCELLED: { label: 'Order Cancelled', severity: 'WARNING' },
  RETURN_INITIATED: { label: 'Return Started', severity: 'INFO' },
  RETURN_COMPLETED: { label: 'Return Completed', severity: 'INFO' },
  REFUND_ISSUED: { label: 'Refund Issued', severity: 'WARNING' },

  // Security
  LOGIN: { label: 'User Login', severity: 'INFO' },
  LOGOUT: { label: 'User Logout', severity: 'INFO' },
  OVERRIDE_USED: { label: 'Override Used', severity: 'WARNING' },
  PERMISSION_DENIED: { label: 'Permission Denied', severity: 'WARNING' },

  // Register
  REGISTER_OPENED: { label: 'Register Opened', severity: 'INFO' },
  REGISTER_CLOSED: { label: 'Register Closed', severity: 'INFO' },
  CASH_DRAWER_OPENED: { label: 'Cash Drawer Opened', severity: 'INFO' },
  NO_SALE: { label: 'No Sale', severity: 'WARNING' },
};

export const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  INFO: 'bg-blue-500',
  WARNING: 'bg-amber-500',
  CRITICAL: 'bg-red-500',
};
