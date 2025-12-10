import { StompClient, Unsubscribe } from '../client';
import {
  PaymentState,
  PaymentRequest,
  PaymentResult,
  PaymentEvent,
  PaymentCommand,
} from '../types';

/**
 * Handler for payment state changes
 */
export type PaymentStateHandler = (state: PaymentState) => void;

/**
 * Service for payment operations
 */
export class PaymentService {
  private stomp: StompClient;
  private _state: PaymentState = 'idle';
  private subscription: Unsubscribe | null = null;
  private stateHandlers: Set<PaymentStateHandler> = new Set();
  private pendingResolve: ((result: PaymentResult) => void) | null = null;

  constructor(stomp: StompClient) {
    this.stomp = stomp;
  }

  /**
   * Current payment state
   */
  get state(): PaymentState {
    return this._state;
  }

  /**
   * Collect payment
   * @throws Error if payment collection is already in progress
   */
  async collect(request: PaymentRequest): Promise<PaymentResult> {
    // Prevent race condition - reject if already collecting
    if (this.pendingResolve !== null) {
      throw new Error('Payment collection already in progress');
    }

    // Ensure we're subscribed to events
    this.ensureSubscribed();

    // Reset state
    this._state = 'idle';

    // Create promise for result
    const resultPromise = new Promise<PaymentResult>((resolve) => {
      this.pendingResolve = resolve;
    });

    // Send collect command
    const command: PaymentCommand = {
      action: 'collect',
      request,
    };
    this.stomp.publish('/app/payment/collect', command);

    return resultPromise;
  }

  /**
   * Cancel current payment
   */
  async cancel(): Promise<void> {
    const command: PaymentCommand = { action: 'cancel' };
    this.stomp.publish('/app/payment/cancel', command);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(handler: PaymentStateHandler): Unsubscribe {
    this.stateHandlers.add(handler);
    this.ensureSubscribed();

    return () => {
      this.stateHandlers.delete(handler);
    };
  }

  /**
   * Clean up subscriptions
   */
  destroy(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.stateHandlers.clear();
    this.pendingResolve = null;
  }

  private settlePending(result: PaymentResult): void {
    if (!this.pendingResolve) return;

    this.pendingResolve(result);
    this.pendingResolve = null;
    this._state = 'idle';
  }

  private ensureSubscribed(): void {
    if (this.subscription) return;

    this.subscription = this.stomp.subscribe<PaymentEvent>(
      '/topic/payment/events',
      (event) => {
        this.handleEvent(event);
      }
    );
  }

  private handleEvent(event: PaymentEvent): void {
    if (event.type === 'state_change') {
      this._state = event.state;
      this.stateHandlers.forEach((h) => h(event.state));

      if (event.state === 'cancelled') {
        this.settlePending({ approved: false, error: 'cancelled' });
      }

      if (event.state === 'error') {
        const errorMessage =
          typeof event.data?.error === 'string'
            ? event.data.error
            : typeof event.data?.message === 'string'
              ? event.data.message
              : 'error';
        this.settlePending({ approved: false, error: errorMessage });
      }
    } else if (event.type === 'result') {
      this.settlePending(event.result);
      // Reset state after result
      this._state = 'idle';
    }
  }
}
