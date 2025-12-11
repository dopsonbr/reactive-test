import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AuditEntry, AuditAction, AuditSearchParams, AuditSearchResult } from '../types/audit';
import { AUDIT_ACTION_CONFIG } from '../types/audit';

// Mock data for development
const mockAuditEntries: AuditEntry[] = [
  {
    id: 'audit-001',
    timestamp: new Date(),
    action: 'MARKDOWN_OVERRIDE_APPROVED',
    severity: 'WARNING',
    userId: 'emp-002',
    userName: 'Mike Manager',
    userRole: 'MANAGER',
    storeNumber: 1234,
    registerId: 'REG-001',
    sessionId: 'sess-001',
    transactionId: 'txn-001',
    description: 'Approved 30% markdown override',
    details: {
      originalValue: 15,
      requestedValue: 30,
      itemSku: 'WIDGET-001',
      itemName: 'Widget Pro',
      requestedBy: 'John Associate',
    },
    authorizedBy: 'emp-002',
    authorizerName: 'Mike Manager',
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 3600000),
    action: 'PAYMENT_REFUNDED',
    severity: 'WARNING',
    userId: 'emp-001',
    userName: 'John Associate',
    userRole: 'ASSOCIATE',
    storeNumber: 1234,
    registerId: 'REG-001',
    sessionId: 'sess-001',
    orderId: 'order-001',
    description: 'Refund issued for damaged item',
    details: {
      refundAmount: 149.99,
      refundMethod: 'ORIGINAL_PAYMENT',
      reason: 'DAMAGED',
    },
  },
];

// Mock API calls
async function searchAuditLog(params: AuditSearchParams): Promise<AuditSearchResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filtered = [...mockAuditEntries];

  if (params.action) {
    filtered = filtered.filter((e) => e.action === params.action);
  }
  if (params.severity) {
    filtered = filtered.filter((e) => e.severity === params.severity);
  }
  if (params.userId) {
    filtered = filtered.filter((e) => e.userId === params.userId);
  }
  if (params.storeNumber) {
    filtered = filtered.filter((e) => e.storeNumber === params.storeNumber);
  }
  if (params.transactionId) {
    filtered = filtered.filter((e) => e.transactionId === params.transactionId);
  }

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / params.size);
  const start = params.page * params.size;
  const entries = filtered.slice(start, start + params.size);

  return {
    entries,
    totalCount,
    totalPages,
    currentPage: params.page,
  };
}

async function logAuditEntry(
  entry: Omit<AuditEntry, 'id' | 'timestamp'>
): Promise<AuditEntry> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const newEntry: AuditEntry = {
    ...entry,
    id: `audit-${Date.now()}`,
    timestamp: new Date(),
  };

  // In production, this would POST to the audit service
  console.log('Audit entry logged:', newEntry);

  return newEntry;
}

export function useAuditSearch(params: AuditSearchParams) {
  return useQuery({
    queryKey: ['audit', 'search', params],
    queryFn: () => searchAuditLog(params),
  });
}

export function useLogAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logAuditEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

// Convenience hook for logging common actions
export function useAuditLogger() {
  const { mutateAsync: logEntry } = useLogAudit();

  // Get current context from auth/session
  const getContext = useCallback(() => {
    // In production, this would come from auth context
    return {
      userId: 'current-user',
      userName: 'Current User',
      userRole: 'ASSOCIATE',
      storeNumber: 1234,
      registerId: 'REG-001',
      sessionId: 'current-session',
    };
  }, []);

  const log = useCallback(
    async (
      action: AuditAction,
      description: string,
      details: Record<string, unknown> = {},
      options: {
        transactionId?: string;
        customerId?: string;
        orderId?: string;
        authorizedBy?: string;
        authorizerName?: string;
      } = {}
    ) => {
      const context = getContext();
      const config = AUDIT_ACTION_CONFIG[action];

      await logEntry({
        action,
        severity: config.severity,
        description,
        details,
        ...context,
        ...options,
      });
    },
    [logEntry, getContext]
  );

  // Pre-built logging functions for common actions
  const logMarkdownApplied = useCallback(
    (transactionId: string, itemName: string, markdownType: string, value: number) => {
      return log(
        'MARKDOWN_APPLIED',
        `Applied ${value}${markdownType === 'PERCENTAGE' ? '%' : ''} markdown to ${itemName}`,
        { itemName, markdownType, value },
        { transactionId }
      );
    },
    [log]
  );

  const logMarkdownOverride = useCallback(
    (
      transactionId: string,
      approved: boolean,
      requestedValue: number,
      authorizedBy?: string,
      authorizerName?: string
    ) => {
      return log(
        approved ? 'MARKDOWN_OVERRIDE_APPROVED' : 'MARKDOWN_OVERRIDE_DENIED',
        `Markdown override ${approved ? 'approved' : 'denied'} for ${requestedValue}%`,
        { requestedValue, approved },
        { transactionId, authorizedBy, authorizerName }
      );
    },
    [log]
  );

  const logPaymentCaptured = useCallback(
    (transactionId: string, method: string, amount: number) => {
      return log(
        'PAYMENT_CAPTURED',
        `${method} payment captured for $${amount.toFixed(2)}`,
        { method, amount },
        { transactionId }
      );
    },
    [log]
  );

  const logRefundIssued = useCallback(
    (orderId: string, amount: number, reason: string) => {
      return log(
        'REFUND_ISSUED',
        `Refund of $${amount.toFixed(2)} issued`,
        { amount, reason },
        { orderId }
      );
    },
    [log]
  );

  const logTransactionVoided = useCallback(
    (transactionId: string, reason: string) => {
      return log(
        'TRANSACTION_VOIDED',
        `Transaction voided: ${reason}`,
        { reason },
        { transactionId }
      );
    },
    [log]
  );

  return {
    log,
    logMarkdownApplied,
    logMarkdownOverride,
    logPaymentCaptured,
    logRefundIssued,
    logTransactionVoided,
  };
}
