import { StompClient, StompClientOptions, Unsubscribe } from './client';
import { Capabilities, CapabilitiesMessage } from './types';
import { ScannerService } from './services';

/**
 * Options for PeripheralClient
 */
export interface PeripheralClientOptions extends StompClientOptions {
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
}

/**
 * Handler for capabilities changes
 */
export type CapabilitiesHandler = (capabilities: Capabilities) => void;

/**
 * Handler for connection state changes
 */
export type ConnectionHandler = (connected: boolean) => void;

/**
 * High-level client for peripheral communication
 */
export class PeripheralClient {
  private stomp: StompClient;
  private _capabilities: Capabilities = {};
  private capabilitiesHandlers: Set<CapabilitiesHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private subscriptions: Unsubscribe[] = [];
  private _scanner: ScannerService;

  constructor(endpoint: string, options: PeripheralClientOptions = {}) {
    this.stomp = new StompClient(endpoint, options);
    this._scanner = new ScannerService(this.stomp);

    // Wire up connection change notifications
    this.stomp.onConnectionChange((connected) => {
      this.connectionHandlers.forEach((handler) => handler(connected));
    });
  }

  /**
   * Current capabilities
   */
  get capabilities(): Capabilities {
    return this._capabilities;
  }

  /**
   * Whether client is connected
   */
  get connected(): boolean {
    return this.stomp.connected;
  }

  /**
   * Connect to the peripheral bridge
   */
  async connect(): Promise<void> {
    await this.stomp.connect();

    // Subscribe to capabilities
    const unsubCaps = this.stomp.subscribe<CapabilitiesMessage>(
      '/topic/capabilities',
      (message) => {
        this._capabilities = message.capabilities;
        this.capabilitiesHandlers.forEach((handler) =>
          handler(message.capabilities)
        );
      }
    );
    this.subscriptions.push(unsubCaps);
  }

  /**
   * Disconnect from the peripheral bridge
   */
  async disconnect(): Promise<void> {
    // Clean up scanner
    this._scanner.destroy();

    // Clean up subscriptions
    this.subscriptions.forEach((unsub) => unsub());
    this.subscriptions = [];

    await this.stomp.disconnect();
  }

  /**
   * Register handler for capabilities changes
   */
  onCapabilities(handler: CapabilitiesHandler): Unsubscribe {
    this.capabilitiesHandlers.add(handler);
    return () => {
      this.capabilitiesHandlers.delete(handler);
    };
  }

  /**
   * Register handler for connection state changes
   */
  onConnectionChange(handler: ConnectionHandler): Unsubscribe {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  /**
   * Scanner service
   */
  get scanner(): ScannerService {
    return this._scanner;
  }

  /**
   * Get the underlying STOMP client for advanced usage
   */
  get stompClient(): StompClient {
    return this.stomp;
  }
}
