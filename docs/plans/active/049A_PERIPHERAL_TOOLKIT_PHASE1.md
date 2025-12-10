# Peripheral Developer Toolkit - Phase 1: Protocol & Core Foundation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish the message protocol contract and build the foundational SDK core with WebSocket/STOMP connection management.

**Architecture:** TypeScript types define the contract. SDK Core provides framework-agnostic connection management using STOMP over WebSocket. Go emulator skeleton validates the protocol works end-to-end.

**Tech Stack:** TypeScript, Vitest, STOMP.js, Go, gorilla/websocket

**Parent Plan:** [049_PERIPHERAL_DEVELOPER_TOOLKIT.md](./049_PERIPHERAL_DEVELOPER_TOOLKIT.md)

---

## Task 1: Create SDK Core Library Scaffold

**Files:**
- Create: `libs/frontend/peripheral-sdk/core/project.json`
- Create: `libs/frontend/peripheral-sdk/core/package.json`
- Create: `libs/frontend/peripheral-sdk/core/tsconfig.json`
- Create: `libs/frontend/peripheral-sdk/core/tsconfig.lib.json`
- Create: `libs/frontend/peripheral-sdk/core/vite.config.ts`
- Create: `libs/frontend/peripheral-sdk/core/src/index.ts`

**Step 1: Create project directory structure**

```bash
mkdir -p libs/frontend/peripheral-sdk/core/src
```

**Step 2: Create project.json for Nx**

Create `libs/frontend/peripheral-sdk/core/project.json`:

```json
{
  "name": "peripheral-core",
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/frontend/peripheral-sdk/core/src",
  "projectType": "library",
  "tags": ["scope:frontend", "type:util"],
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/frontend/peripheral-sdk/core"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{workspaceRoot}/coverage/libs/frontend/peripheral-sdk/core"],
      "options": {
        "reportsDirectory": "../../../../coverage/libs/frontend/peripheral-sdk/core"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    }
  }
}
```

**Step 3: Create package.json**

Create `libs/frontend/peripheral-sdk/core/package.json`:

```json
{
  "name": "@reactive-platform/peripheral-core",
  "version": "0.0.1",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    }
  },
  "peerDependencies": {
    "@stomp/stompjs": "^7.0.0"
  }
}
```

**Step 4: Create tsconfig files**

Create `libs/frontend/peripheral-sdk/core/tsconfig.json`:

```json
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "types": ["vitest"]
  },
  "files": [],
  "include": [],
  "references": [
    { "path": "./tsconfig.lib.json" }
  ]
}
```

Create `libs/frontend/peripheral-sdk/core/tsconfig.lib.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../../dist/out-tsc",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts", "src/**/*.test.ts"]
}
```

**Step 5: Create vite.config.ts**

Create `libs/frontend/peripheral-sdk/core/vite.config.ts`:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: resolve(__dirname, 'tsconfig.lib.json'),
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@stomp/stompjs'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
```

**Step 6: Create placeholder index.ts**

Create `libs/frontend/peripheral-sdk/core/src/index.ts`:

```typescript
// @reactive-platform/peripheral-core
// Framework-agnostic peripheral SDK

export const VERSION = '0.0.1';
```

**Step 7: Update tsconfig.base.json path mapping**

Modify `tsconfig.base.json` to add path mapping:

```json
"@reactive-platform/peripheral-core": [
  "libs/frontend/peripheral-sdk/core/src/index.ts"
]
```

**Step 8: Verify Nx recognizes the project**

Run: `pnpm nx show project peripheral-core`

Expected: Project configuration displayed without errors

**Step 9: Commit**

```bash
git add libs/frontend/peripheral-sdk/core tsconfig.base.json
git commit -m "feat(peripheral-core): scaffold SDK core library"
```

---

## Task 2: Define Message Schema Types

**Files:**
- Create: `libs/frontend/peripheral-sdk/core/src/types/capabilities.ts`
- Create: `libs/frontend/peripheral-sdk/core/src/types/scanner.ts`
- Create: `libs/frontend/peripheral-sdk/core/src/types/payment.ts`
- Create: `libs/frontend/peripheral-sdk/core/src/types/index.ts`
- Modify: `libs/frontend/peripheral-sdk/core/src/index.ts`

**Step 1: Create capabilities types**

Create `libs/frontend/peripheral-sdk/core/src/types/capabilities.ts`:

```typescript
/**
 * Scanner capability information
 */
export interface ScannerCapability {
  /** Whether scanner is available */
  available: boolean;
  /** Connection mode */
  mode?: 'bridge' | 'keyboard_wedge';
  /** Supported barcode symbologies */
  symbologies?: string[];
}

/**
 * Payment terminal capability information
 */
export interface PaymentCapability {
  /** Whether payment terminal is available */
  available: boolean;
  /** Supported payment methods */
  methods?: ('chip' | 'contactless' | 'swipe')[];
  /** Whether cashback is supported */
  cashback?: boolean;
}

/**
 * All device capabilities advertised by the bridge
 */
export interface Capabilities {
  scanner?: ScannerCapability;
  payment?: PaymentCapability;
}

/**
 * Capabilities message from bridge
 */
export interface CapabilitiesMessage {
  type: 'capabilities';
  timestamp: string;
  deviceId: string;
  capabilities: Capabilities;
}
```

**Step 2: Create scanner types**

Create `libs/frontend/peripheral-sdk/core/src/types/scanner.ts`:

```typescript
/**
 * Barcode symbology types
 */
export type BarcodeSymbology =
  | 'ean13'
  | 'ean8'
  | 'upc-a'
  | 'upc-e'
  | 'qr'
  | 'pdf417'
  | 'code128'
  | 'code39'
  | 'datamatrix';

/**
 * Event emitted when a barcode is scanned
 */
export interface ScanEvent {
  /** The scanned barcode data */
  barcode: string;
  /** The symbology of the barcode */
  symbology: BarcodeSymbology;
  /** Timestamp of the scan */
  timestamp: string;
}

/**
 * Scanner event message from bridge
 */
export interface ScannerEventMessage {
  type: 'scan';
  event: ScanEvent;
}

/**
 * Scanner command to enable/disable
 */
export interface ScannerCommand {
  action: 'enable' | 'disable';
}
```

**Step 3: Create payment types**

Create `libs/frontend/peripheral-sdk/core/src/types/payment.ts`:

```typescript
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
```

**Step 4: Create types index**

Create `libs/frontend/peripheral-sdk/core/src/types/index.ts`:

```typescript
export * from './capabilities';
export * from './scanner';
export * from './payment';
```

**Step 5: Update main index to export types**

Modify `libs/frontend/peripheral-sdk/core/src/index.ts`:

```typescript
// @reactive-platform/peripheral-core
// Framework-agnostic peripheral SDK

export const VERSION = '0.0.1';

// Types
export * from './types';
```

**Step 6: Verify build**

Run: `pnpm nx build peripheral-core`

Expected: Build succeeds with type definitions

**Step 7: Commit**

```bash
git add libs/frontend/peripheral-sdk/core/src/types
git add libs/frontend/peripheral-sdk/core/src/index.ts
git commit -m "feat(peripheral-core): define message schema types"
```

---

## Task 3: Implement STOMP Client Wrapper

**Files:**
- Create: `libs/frontend/peripheral-sdk/core/src/client/stomp-client.ts`
- Create: `libs/frontend/peripheral-sdk/core/src/client/stomp-client.spec.ts`
- Create: `libs/frontend/peripheral-sdk/core/src/client/index.ts`
- Modify: `libs/frontend/peripheral-sdk/core/src/index.ts`

**Step 1: Install STOMP dependency**

Run: `pnpm add @stomp/stompjs -w`

**Step 2: Write failing test for StompClient connection**

Create `libs/frontend/peripheral-sdk/core/src/client/stomp-client.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StompClient, StompClientOptions } from './stomp-client';

// Mock @stomp/stompjs
vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn().mockImplementation(() => ({
    activate: vi.fn(),
    deactivate: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    publish: vi.fn(),
    connected: false,
    onConnect: null,
    onDisconnect: null,
    onStompError: null,
  })),
}));

describe('StompClient', () => {
  let client: StompClient;
  const endpoint = 'ws://localhost:9100/stomp';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  describe('constructor', () => {
    it('should create client with endpoint', () => {
      client = new StompClient(endpoint);
      expect(client).toBeDefined();
    });

    it('should create client with options', () => {
      const options: StompClientOptions = {
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      };
      client = new StompClient(endpoint, options);
      expect(client).toBeDefined();
    });
  });

  describe('connect', () => {
    it('should call activate on stomp client', async () => {
      const { Client } = await import('@stomp/stompjs');
      client = new StompClient(endpoint);

      // Get the mock instance
      const mockInstance = vi.mocked(Client).mock.results[0].value;

      // Simulate connection by triggering onConnect
      setTimeout(() => {
        mockInstance.connected = true;
        mockInstance.onConnect?.({} as any);
      }, 0);

      await client.connect();

      expect(mockInstance.activate).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should call deactivate on stomp client', async () => {
      const { Client } = await import('@stomp/stompjs');
      client = new StompClient(endpoint);

      const mockInstance = vi.mocked(Client).mock.results[0].value;

      await client.disconnect();

      expect(mockInstance.deactivate).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should subscribe to destination and return unsubscribe function', async () => {
      const { Client } = await import('@stomp/stompjs');
      client = new StompClient(endpoint);

      const mockInstance = vi.mocked(Client).mock.results[0].value;
      const handler = vi.fn();

      const unsubscribe = client.subscribe('/topic/test', handler);

      expect(mockInstance.subscribe).toHaveBeenCalledWith(
        '/topic/test',
        expect.any(Function)
      );
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('publish', () => {
    it('should publish message to destination', () => {
      const { Client } = vi.mocked(await import('@stomp/stompjs'));
      client = new StompClient(endpoint);

      const mockInstance = Client.mock.results[0].value;
      const body = { test: 'data' };

      client.publish('/app/test', body);

      expect(mockInstance.publish).toHaveBeenCalledWith({
        destination: '/app/test',
        body: JSON.stringify(body),
      });
    });
  });
});
```

**Step 3: Run test to verify it fails**

Run: `pnpm nx test peripheral-core -- --run`

Expected: FAIL - module './stomp-client' not found

**Step 4: Implement StompClient**

Create `libs/frontend/peripheral-sdk/core/src/client/stomp-client.ts`:

```typescript
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

  constructor(endpoint: string, options: StompClientOptions = {}) {
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
```

**Step 5: Create client index**

Create `libs/frontend/peripheral-sdk/core/src/client/index.ts`:

```typescript
export * from './stomp-client';
```

**Step 6: Update main index**

Modify `libs/frontend/peripheral-sdk/core/src/index.ts`:

```typescript
// @reactive-platform/peripheral-core
// Framework-agnostic peripheral SDK

export const VERSION = '0.0.1';

// Types
export * from './types';

// Client
export * from './client';
```

**Step 7: Run tests to verify they pass**

Run: `pnpm nx test peripheral-core -- --run`

Expected: All tests pass

**Step 8: Commit**

```bash
git add libs/frontend/peripheral-sdk/core/src/client
git add libs/frontend/peripheral-sdk/core/src/index.ts
git commit -m "feat(peripheral-core): implement STOMP client wrapper"
```

---

## Task 4: Implement PeripheralClient (High-Level API)

**Files:**
- Create: `libs/frontend/peripheral-sdk/core/src/peripheral-client.ts`
- Create: `libs/frontend/peripheral-sdk/core/src/peripheral-client.spec.ts`
- Modify: `libs/frontend/peripheral-sdk/core/src/index.ts`

**Step 1: Write failing test for PeripheralClient**

Create `libs/frontend/peripheral-sdk/core/src/peripheral-client.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PeripheralClient, PeripheralClientOptions } from './peripheral-client';
import { Capabilities, CapabilitiesMessage } from './types';

// Mock the stomp client
vi.mock('./client/stomp-client', () => ({
  StompClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue(vi.fn()),
    publish: vi.fn(),
    connected: false,
    onConnectionChange: vi.fn().mockReturnValue(vi.fn()),
  })),
}));

describe('PeripheralClient', () => {
  let client: PeripheralClient;
  const endpoint = 'ws://localhost:9100/stomp';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  describe('constructor', () => {
    it('should create client with endpoint', () => {
      client = new PeripheralClient(endpoint);
      expect(client).toBeDefined();
    });
  });

  describe('connect', () => {
    it('should connect and subscribe to capabilities', async () => {
      const { StompClient } = await import('./client/stomp-client');
      client = new PeripheralClient(endpoint);

      const mockStomp = vi.mocked(StompClient).mock.results[0].value;

      await client.connect();

      expect(mockStomp.connect).toHaveBeenCalled();
      expect(mockStomp.subscribe).toHaveBeenCalledWith(
        '/topic/capabilities',
        expect.any(Function)
      );
    });
  });

  describe('capabilities', () => {
    it('should return empty capabilities before receiving message', () => {
      client = new PeripheralClient(endpoint);
      expect(client.capabilities).toEqual({});
    });

    it('should notify handler when capabilities received', async () => {
      const { StompClient } = await import('./client/stomp-client');
      client = new PeripheralClient(endpoint);

      const mockStomp = vi.mocked(StompClient).mock.results[0].value;
      let capabilitiesHandler: (msg: CapabilitiesMessage) => void;

      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/capabilities') {
          capabilitiesHandler = handler;
        }
        return vi.fn();
      });

      const handler = vi.fn();
      client.onCapabilities(handler);

      await client.connect();

      // Simulate capabilities message
      const capsMessage: CapabilitiesMessage = {
        type: 'capabilities',
        timestamp: new Date().toISOString(),
        deviceId: 'test-device',
        capabilities: {
          scanner: { available: true },
          payment: { available: true, methods: ['chip', 'contactless'] },
        },
      };
      capabilitiesHandler!(capsMessage);

      expect(handler).toHaveBeenCalledWith(capsMessage.capabilities);
      expect(client.capabilities).toEqual(capsMessage.capabilities);
    });
  });

  describe('onConnectionChange', () => {
    it('should notify handler on connection state changes', async () => {
      const { StompClient } = await import('./client/stomp-client');
      client = new PeripheralClient(endpoint);

      const mockStomp = vi.mocked(StompClient).mock.results[0].value;

      const handler = vi.fn();
      client.onConnectionChange(handler);

      expect(mockStomp.onConnectionChange).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm nx test peripheral-core -- --run`

Expected: FAIL - module './peripheral-client' not found

**Step 3: Implement PeripheralClient**

Create `libs/frontend/peripheral-sdk/core/src/peripheral-client.ts`:

```typescript
import { StompClient, StompClientOptions, Unsubscribe } from './client';
import { Capabilities, CapabilitiesMessage } from './types';

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

  constructor(endpoint: string, options: PeripheralClientOptions = {}) {
    this.stomp = new StompClient(endpoint, options);

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
   * Get the underlying STOMP client for advanced usage
   */
  get stompClient(): StompClient {
    return this.stomp;
  }
}
```

**Step 4: Update main index**

Modify `libs/frontend/peripheral-sdk/core/src/index.ts`:

```typescript
// @reactive-platform/peripheral-core
// Framework-agnostic peripheral SDK

export const VERSION = '0.0.1';

// Types
export * from './types';

// Client
export * from './client';
export * from './peripheral-client';
```

**Step 5: Run tests to verify they pass**

Run: `pnpm nx test peripheral-core -- --run`

Expected: All tests pass

**Step 6: Commit**

```bash
git add libs/frontend/peripheral-sdk/core/src/peripheral-client.ts
git add libs/frontend/peripheral-sdk/core/src/peripheral-client.spec.ts
git add libs/frontend/peripheral-sdk/core/src/index.ts
git commit -m "feat(peripheral-core): implement PeripheralClient high-level API"
```

---

## Task 5: Create Go Emulator Skeleton

**Files:**
- Create: `apps/peripheral-emulator/go.mod`
- Create: `apps/peripheral-emulator/main.go`
- Create: `apps/peripheral-emulator/internal/server/server.go`
- Create: `apps/peripheral-emulator/internal/stomp/handler.go`
- Create: `apps/peripheral-emulator/project.json`

**Step 1: Create project directory**

```bash
mkdir -p apps/peripheral-emulator/internal/{server,stomp}
```

**Step 2: Initialize Go module**

Create `apps/peripheral-emulator/go.mod`:

```go
module github.com/reactive-platform/peripheral-emulator

go 1.22

require (
	github.com/gorilla/websocket v1.5.1
)

require golang.org/x/net v0.17.0 // indirect
```

**Step 3: Create STOMP handler**

Create `apps/peripheral-emulator/internal/stomp/handler.go`:

```go
package stomp

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// Frame represents a STOMP frame
type Frame struct {
	Command string
	Headers map[string]string
	Body    []byte
}

// ParseFrame parses a STOMP frame from bytes
func ParseFrame(data []byte) (*Frame, error) {
	str := string(data)
	lines := strings.Split(str, "\n")

	if len(lines) < 1 {
		return nil, fmt.Errorf("invalid frame: no command")
	}

	frame := &Frame{
		Command: strings.TrimSpace(lines[0]),
		Headers: make(map[string]string),
	}

	bodyStart := 1
	for i := 1; i < len(lines); i++ {
		line := strings.TrimSpace(lines[i])
		if line == "" {
			bodyStart = i + 1
			break
		}
		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 {
			frame.Headers[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
		}
	}

	if bodyStart < len(lines) {
		body := strings.Join(lines[bodyStart:], "\n")
		// Remove null terminator if present
		body = strings.TrimSuffix(body, "\x00")
		frame.Body = []byte(body)
	}

	return frame, nil
}

// Serialize serializes a STOMP frame to bytes
func (f *Frame) Serialize() []byte {
	var sb strings.Builder
	sb.WriteString(f.Command)
	sb.WriteString("\n")

	for k, v := range f.Headers {
		sb.WriteString(k)
		sb.WriteString(":")
		sb.WriteString(v)
		sb.WriteString("\n")
	}

	sb.WriteString("\n")

	if len(f.Body) > 0 {
		sb.Write(f.Body)
	}

	sb.WriteString("\x00")

	return []byte(sb.String())
}

// NewConnectedFrame creates a CONNECTED response frame
func NewConnectedFrame() *Frame {
	return &Frame{
		Command: "CONNECTED",
		Headers: map[string]string{
			"version":    "1.2",
			"heart-beat": "10000,10000",
		},
	}
}

// NewMessageFrame creates a MESSAGE frame
func NewMessageFrame(destination string, body interface{}) (*Frame, error) {
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	return &Frame{
		Command: "MESSAGE",
		Headers: map[string]string{
			"destination":  destination,
			"content-type": "application/json",
			"message-id":   fmt.Sprintf("msg-%d", time.Now().UnixNano()),
		},
		Body: bodyBytes,
	}, nil
}
```

**Step 4: Create WebSocket server**

Create `apps/peripheral-emulator/internal/server/server.go`:

```go
package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/reactive-platform/peripheral-emulator/internal/stomp"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// Capabilities represents device capabilities
type Capabilities struct {
	Scanner *ScannerCapability `json:"scanner,omitempty"`
	Payment *PaymentCapability `json:"payment,omitempty"`
}

// ScannerCapability represents scanner capabilities
type ScannerCapability struct {
	Available   bool     `json:"available"`
	Mode        string   `json:"mode,omitempty"`
	Symbologies []string `json:"symbologies,omitempty"`
}

// PaymentCapability represents payment capabilities
type PaymentCapability struct {
	Available bool     `json:"available"`
	Methods   []string `json:"methods,omitempty"`
	Cashback  bool     `json:"cashback,omitempty"`
}

// CapabilitiesMessage is sent to clients on connect
type CapabilitiesMessage struct {
	Type         string       `json:"type"`
	Timestamp    string       `json:"timestamp"`
	DeviceID     string       `json:"deviceId"`
	Capabilities Capabilities `json:"capabilities"`
}

// Server represents the emulator server
type Server struct {
	wsPort   int
	httpPort int
	deviceID string
	caps     Capabilities
	clients  map[*websocket.Conn]map[string]bool // conn -> subscribed destinations
	mu       sync.RWMutex
}

// NewServer creates a new emulator server
func NewServer(wsPort, httpPort int, deviceID string) *Server {
	return &Server{
		wsPort:   wsPort,
		httpPort: httpPort,
		deviceID: deviceID,
		caps: Capabilities{
			Scanner: &ScannerCapability{
				Available:   true,
				Mode:        "bridge",
				Symbologies: []string{"ean13", "upc-a", "qr", "pdf417"},
			},
			Payment: &PaymentCapability{
				Available: true,
				Methods:   []string{"chip", "contactless", "swipe"},
				Cashback:  true,
			},
		},
		clients: make(map[*websocket.Conn]map[string]bool),
	}
}

// Start starts the server
func (s *Server) Start() error {
	// WebSocket server
	wsMux := http.NewServeMux()
	wsMux.HandleFunc("/stomp", s.handleWebSocket)

	go func() {
		addr := fmt.Sprintf(":%d", s.wsPort)
		log.Printf("WebSocket server starting on %s", addr)
		if err := http.ListenAndServe(addr, wsMux); err != nil {
			log.Fatalf("WebSocket server error: %v", err)
		}
	}()

	// HTTP control server
	httpMux := http.NewServeMux()
	httpMux.HandleFunc("/control/state", s.handleState)
	httpMux.HandleFunc("/health", s.handleHealth)

	addr := fmt.Sprintf(":%d", s.httpPort)
	log.Printf("HTTP control server starting on %s", addr)
	return http.ListenAndServe(addr, httpMux)
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	s.mu.Lock()
	s.clients[conn] = make(map[string]bool)
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.clients, conn)
		s.mu.Unlock()
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Read error: %v", err)
			break
		}

		frame, err := stomp.ParseFrame(message)
		if err != nil {
			log.Printf("Frame parse error: %v", err)
			continue
		}

		s.handleFrame(conn, frame)
	}
}

func (s *Server) handleFrame(conn *websocket.Conn, frame *stomp.Frame) {
	switch frame.Command {
	case "CONNECT":
		// Send CONNECTED
		response := stomp.NewConnectedFrame()
		conn.WriteMessage(websocket.TextMessage, response.Serialize())

	case "SUBSCRIBE":
		dest := frame.Headers["destination"]
		s.mu.Lock()
		s.clients[conn][dest] = true
		s.mu.Unlock()

		// If subscribing to capabilities, send current caps
		if dest == "/topic/capabilities" {
			s.sendCapabilities(conn)
		}

	case "UNSUBSCRIBE":
		dest := frame.Headers["destination"]
		s.mu.Lock()
		delete(s.clients[conn], dest)
		s.mu.Unlock()

	case "SEND":
		dest := frame.Headers["destination"]
		log.Printf("Received SEND to %s: %s", dest, string(frame.Body))
		// Handle app messages (future: scanner enable, payment collect, etc.)

	case "DISCONNECT":
		log.Printf("Client disconnected")
	}
}

func (s *Server) sendCapabilities(conn *websocket.Conn) {
	msg := CapabilitiesMessage{
		Type:         "capabilities",
		Timestamp:    time.Now().UTC().Format(time.RFC3339),
		DeviceID:     s.deviceID,
		Capabilities: s.caps,
	}

	frame, err := stomp.NewMessageFrame("/topic/capabilities", msg)
	if err != nil {
		log.Printf("Error creating capabilities frame: %v", err)
		return
	}

	conn.WriteMessage(websocket.TextMessage, frame.Serialize())
}

func (s *Server) handleState(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"deviceId":     s.deviceID,
		"capabilities": s.caps,
		"clients":      len(s.clients),
	})
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}
```

**Step 5: Create main entry point**

Create `apps/peripheral-emulator/main.go`:

```go
package main

import (
	"flag"
	"log"

	"github.com/reactive-platform/peripheral-emulator/internal/server"
)

func main() {
	wsPort := flag.Int("port-ws", 9100, "WebSocket server port")
	httpPort := flag.Int("port-http", 9101, "HTTP control server port")
	deviceID := flag.String("device-id", "emulator-001", "Device ID for capabilities")

	flag.Parse()

	log.Printf("Starting Peripheral Emulator")
	log.Printf("  Device ID: %s", *deviceID)
	log.Printf("  WebSocket: ws://localhost:%d/stomp", *wsPort)
	log.Printf("  HTTP Control: http://localhost:%d", *httpPort)

	srv := server.NewServer(*wsPort, *httpPort, *deviceID)
	if err := srv.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
```

**Step 6: Create Nx project.json**

Create `apps/peripheral-emulator/project.json`:

```json
{
  "name": "peripheral-emulator",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/peripheral-emulator",
  "projectType": "application",
  "tags": ["scope:tools", "type:app", "lang:go"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "cd apps/peripheral-emulator && go build -o ../../dist/apps/peripheral-emulator/peripheral-emulator"
        ],
        "parallel": false
      },
      "outputs": ["{workspaceRoot}/dist/apps/peripheral-emulator"]
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "commands": ["cd apps/peripheral-emulator && go run ."],
        "parallel": false
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "commands": ["cd apps/peripheral-emulator && go test ./..."],
        "parallel": false
      }
    }
  }
}
```

**Step 7: Download Go dependencies**

```bash
cd apps/peripheral-emulator && go mod tidy && cd ../..
```

**Step 8: Verify emulator builds and runs**

Run: `pnpm nx build peripheral-emulator`

Expected: Build succeeds, binary created

Run: `pnpm nx serve peripheral-emulator` (in background, then Ctrl+C)

Expected: Server starts, logs show ports

**Step 9: Commit**

```bash
git add apps/peripheral-emulator
git commit -m "feat(peripheral-emulator): create Go emulator skeleton with STOMP support"
```

---

## Task 6: Integration Test - SDK Core to Emulator

**Files:**
- Create: `libs/frontend/peripheral-sdk/core/src/integration.spec.ts`

**Step 1: Write integration test**

Create `libs/frontend/peripheral-sdk/core/src/integration.spec.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PeripheralClient } from './peripheral-client';
import { spawn, ChildProcess } from 'child_process';
import { setTimeout } from 'timers/promises';

/**
 * Integration tests that require the emulator to be running.
 * These tests are skipped in CI unless INTEGRATION_TESTS=true
 */
describe.skipIf(!process.env.INTEGRATION_TESTS)('PeripheralClient Integration', () => {
  let emulator: ChildProcess;
  let client: PeripheralClient;

  beforeAll(async () => {
    // Start emulator
    emulator = spawn('go', ['run', '.'], {
      cwd: 'apps/peripheral-emulator',
      stdio: 'pipe',
    });

    // Wait for emulator to start
    await setTimeout(2000);
  });

  afterAll(async () => {
    if (client) {
      await client.disconnect();
    }
    if (emulator) {
      emulator.kill();
    }
  });

  it('should connect to emulator and receive capabilities', async () => {
    client = new PeripheralClient('ws://localhost:9100/stomp');

    const capsPromise = new Promise<void>((resolve) => {
      client.onCapabilities((caps) => {
        expect(caps.scanner?.available).toBe(true);
        expect(caps.payment?.available).toBe(true);
        resolve();
      });
    });

    await client.connect();
    await capsPromise;
  });
});
```

**Step 2: Run integration test (requires emulator)**

First terminal: `pnpm nx serve peripheral-emulator`

Second terminal: `INTEGRATION_TESTS=true pnpm nx test peripheral-core -- --run`

Expected: Integration test passes

**Step 3: Commit**

```bash
git add libs/frontend/peripheral-sdk/core/src/integration.spec.ts
git commit -m "test(peripheral-core): add integration test for emulator connection"
```

---

## Phase 1 Complete

**What was built:**
- SDK Core library scaffold with Nx configuration
- Message schema types (capabilities, scanner, payment)
- STOMP client wrapper for WebSocket communication
- PeripheralClient high-level API
- Go emulator skeleton with STOMP protocol support
- Integration test proving end-to-end connectivity

**Next Phase:** [049B - Scanner Implementation](./049B_PERIPHERAL_TOOLKIT_PHASE2.md)
