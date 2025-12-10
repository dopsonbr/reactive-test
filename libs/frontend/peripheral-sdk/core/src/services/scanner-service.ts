import { StompClient, Unsubscribe } from '../client';
import { ScanEvent, ScannerEventMessage, ScannerCommand } from '../types';

/**
 * Handler for scan events
 */
export type ScanHandler = (event: ScanEvent) => void;

/**
 * Service for scanner operations
 */
export class ScannerService {
  private stomp: StompClient;
  private _enabled = false;
  private subscription: Unsubscribe | null = null;
  private handlers: Set<ScanHandler> = new Set();

  constructor(stomp: StompClient) {
    this.stomp = stomp;
  }

  /**
   * Whether scanner is enabled
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Enable the scanner
   */
  async enable(): Promise<void> {
    const command: ScannerCommand = { action: 'enable' };
    this.stomp.publish('/app/scanner/enable', command);
    this._enabled = true;
  }

  /**
   * Disable the scanner
   */
  async disable(): Promise<void> {
    const command: ScannerCommand = { action: 'disable' };
    this.stomp.publish('/app/scanner/disable', command);
    this._enabled = false;
  }

  /**
   * Subscribe to scan events
   */
  onScan(handler: ScanHandler): Unsubscribe {
    this.handlers.add(handler);

    // Subscribe to STOMP topic if not already subscribed
    if (!this.subscription) {
      this.subscription = this.stomp.subscribe<ScannerEventMessage>(
        '/topic/scanner/events',
        (message) => {
          if (message.type === 'scan') {
            this.handlers.forEach((h) => h(message.event));
          }
        }
      );
    }

    return () => {
      this.handlers.delete(handler);
      // Unsubscribe from STOMP if no more handlers
      if (this.handlers.size === 0 && this.subscription) {
        this.subscription();
        this.subscription = null;
      }
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
    this.handlers.clear();
  }
}
