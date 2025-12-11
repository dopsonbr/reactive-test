import { PaymentResult, PaymentState } from '@reactive-platform/peripheral-core';

/**
 * Mock payment configuration
 */
export interface MockPaymentConfig {
  /** Default outcome */
  defaultOutcome?: 'approved' | 'declined';
  /** Decline reason when declined */
  declineReason?: string;
  /** Delay before result (ms) */
  resultDelay?: number;
}

// Global mock state
let mockConfig: MockPaymentConfig = {
  defaultOutcome: 'approved',
  resultDelay: 100,
};

let pendingResolve: ((result: PaymentResult) => void) | null = null;
let currentState: PaymentState = 'idle';
const stateListeners: Set<(state: PaymentState) => void> = new Set();

/**
 * Configure mock payment behavior
 */
export function configureMockPayment(config: MockPaymentConfig): void {
  mockConfig = { ...mockConfig, ...config };
}

/**
 * Force payment approval
 */
export function forcePaymentApprove(
  overrides: Partial<PaymentResult> = {}
): PaymentResult {
  const result: PaymentResult = {
    approved: true,
    transactionId: `mock-txn-${Date.now()}`,
    method: 'chip',
    cardBrand: 'visa',
    last4: '4242',
    authCode: `MOCK${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    ...overrides,
  };

  setMockPaymentState('approved');

  if (pendingResolve) {
    pendingResolve(result);
    pendingResolve = null;
  }

  setTimeout(() => setMockPaymentState('idle'), 100);

  return result;
}

/**
 * Force payment decline
 */
export function forcePaymentDecline(
  options: { reason?: string } = {}
): PaymentResult {
  const result: PaymentResult = {
    approved: false,
    declineReason: options.reason ?? mockConfig.declineReason ?? 'declined_by_test',
  };

  setMockPaymentState('declined');

  if (pendingResolve) {
    pendingResolve(result);
    pendingResolve = null;
  }

  setTimeout(() => setMockPaymentState('idle'), 100);

  return result;
}

/**
 * Set mock payment state (for testing intermediate states)
 */
export function setMockPaymentState(state: PaymentState): void {
  currentState = state;
  stateListeners.forEach((listener) => listener(state));
}

/**
 * Get current mock payment state
 */
export function getMockPaymentState(): PaymentState {
  return currentState;
}

/**
 * Register state change listener
 */
export function onMockPaymentStateChange(
  listener: (state: PaymentState) => void
): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

/**
 * Simulate starting a payment (for internal use)
 */
export function startMockPayment(): Promise<PaymentResult> {
  return new Promise((resolve) => {
    pendingResolve = resolve;

    // Auto-resolve based on config if no manual intervention
    setTimeout(() => {
      if (pendingResolve) {
        if (mockConfig.defaultOutcome === 'declined') {
          forcePaymentDecline();
        } else {
          forcePaymentApprove();
        }
      }
    }, mockConfig.resultDelay ?? 100);
  });
}

/**
 * Reset mock payment state
 */
export function resetMockPayment(): void {
  mockConfig = {
    defaultOutcome: 'approved',
    resultDelay: 100,
  };
  pendingResolve = null;
  currentState = 'idle';
  stateListeners.clear();
}
