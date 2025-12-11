/**
 * Payment terminal states
 */
export type PaymentState =
  | 'idle'
  | 'card_presented'
  | 'reading_card'
  | 'pin_required'
  | 'pin_entry'
  | 'authorizing'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'error';

/**
 * Payment methods
 */
export type PaymentMethod = 'chip' | 'contactless' | 'swipe';

/**
 * Request to collect payment
 */
export interface PaymentRequest {
  /** Amount in cents */
  amount: number;
  /** Currency code (e.g., 'USD') */
  currency: string;
  /** Whether to allow cashback */
  allowCashback?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Payment result after completion
 */
export interface PaymentResult {
  /** Whether payment was approved */
  approved: boolean;
  /** Transaction ID if approved */
  transactionId?: string;
  /** Payment method used */
  method?: PaymentMethod;
  /** Card brand (visa, mastercard, etc.) */
  cardBrand?: string;
  /** Last 4 digits of card */
  last4?: string;
  /** Authorization code */
  authCode?: string;
  /** Decline reason if declined */
  declineReason?: string;
  /** Error message if error state */
  error?: string;
}

/**
 * Payment state change event from bridge
 */
export interface PaymentStateEvent {
  type: 'state_change';
  state: PaymentState;
  /** Additional data depending on state */
  data?: Record<string, unknown>;
}

/**
 * Payment result event from bridge
 */
export interface PaymentResultEvent {
  type: 'result';
  result: PaymentResult;
}

/**
 * Union of all payment events
 */
export type PaymentEvent = PaymentStateEvent | PaymentResultEvent;

/**
 * Payment command message
 */
export interface PaymentCommand {
  action: 'collect' | 'cancel';
  request?: PaymentRequest;
}
