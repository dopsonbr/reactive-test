import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

/**
 * Options for StompClient configuration
 */
export interface StompClientOptions {
  /** Delay before reconnection attempts (ms) */
  reconnectDelay?: number;
  /** Heartbeat interval for incoming messages (ms) */
  heartbeatIncoming?: number;
  /** Heartbeat interval for outgoing messages (ms) */
  heartbeatOutgoing?: number;
  /** Debug logging */
  debug?: boolean;
  /** Connection timeout (ms), default 30000 */
  connectionTimeout?: number;
}

/**
 * Function to unsubscribe from a destination
 */
export type Unsubscribe = () => void;

/**
 * Handler for STOMP messages
 */
export type MessageHandler<T = unknown> = (body: T) => void;

/**
 * Low-level STOMP client wrapper
 */
export class StompClient {
  private client: Client;
  private connectionPromise: Promise<void> | null = null;
  private connectionResolve: (() => void) | null = null;
  private connectionReject: ((error: Error) => void) | null = null;
  private connectionTimeout: number;

  constructor(endpoint: string, options: StompClientOptions = {}) {
    this.connectionTimeout = options.connectionTimeout ?? 30000;
    this.client = new Client({
      brokerURL: endpoint,
      reconnectDelay: options.reconnectDelay ?? 5000,
      heartbeatIncoming: options.heartbeatIncoming ?? 10000,
      heartbeatOutgoing: options.heartbeatOutgoing ?? 10000,
      debug: options.debug ? (str) => console.log('[STOMP]', str) : undefined,
    });

    this.client.onConnect = () => {
      this.connectionResolve?.();
      this.connectionResolve = null;
      this.connectionReject = null;
    };

    this.client.onStompError = (frame) => {
      const error = new Error(frame.headers['message'] || 'STOMP error');
      this.connectionReject?.(error);
      this.connectionReject = null;
      this.connectionResolve = null;
    };
  }

  /**
   * Connect to the STOMP broker
   */
  async connect(): Promise<void> {
    if (this.client.connected) {
      return;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.connectionResolve = resolve;
      this.connectionReject = reject;

      // Add timeout protection
      const timeout = setTimeout(() => {
        const error = new Error('Connection timeout');
        this.connectionReject?.(error);
        this.connectionReject = null;
        this.connectionResolve = null;
      }, this.connectionTimeout);

      // Store original resolve to clear timeout
      const originalResolve = this.connectionResolve;
      this.connectionResolve = () => {
        clearTimeout(timeout);
        originalResolve?.();
      };

      // Store original reject to clear timeout
      const originalReject = this.connectionReject;
      this.connectionReject = (error: Error) => {
        clearTimeout(timeout);
        originalReject?.(error);
      };
    });

    this.client.activate();

    return this.connectionPromise;
  }

  /**
   * Disconnect from the STOMP broker
   */
  async disconnect(): Promise<void> {
    await this.client.deactivate();
  }

  /**
   * Check if client is connected
   */
  get connected(): boolean {
    return this.client.connected;
  }

  /**
   * Subscribe to a destination
   */
  subscribe<T = unknown>(
    destination: string,
    handler: MessageHandler<T>
  ): Unsubscribe {
    const subscription: StompSubscription = this.client.subscribe(
      destination,
      (message: IMessage) => {
        try {
          const body = JSON.parse(message.body) as T;
          handler(body);
        } catch (e) {
          console.error('Failed to parse STOMP message:', e);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  /**
   * Publish a message to a destination
   */
  publish<T = unknown>(destination: string, body: T): void {
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  /**
   * Set handler for connection state changes
   */
  onConnectionChange(handler: (connected: boolean) => void): Unsubscribe {
    const originalOnConnect = this.client.onConnect;
    const originalOnDisconnect = this.client.onDisconnect;

    this.client.onConnect = (frame) => {
      originalOnConnect?.(frame);
      handler(true);
    };

    this.client.onDisconnect = (frame) => {
      originalOnDisconnect?.(frame);
      handler(false);
    };

    return () => {
      this.client.onConnect = originalOnConnect;
      this.client.onDisconnect = originalOnDisconnect;
    };
  }
}
