# Peripheral Developer Toolkit - Phase 2: Scanner Implementation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement scanner functionality end-to-end: Go state machine, SDK Core service, React hook, and MSW handler.

**Architecture:** Scanner is the simplest device - enable/disable state with scan event emission. This phase validates the full vertical slice pattern before tackling the complex payment flow.

**Tech Stack:** Go, TypeScript, React, Vitest, MSW

**Parent Plan:** [049_PERIPHERAL_DEVELOPER_TOOLKIT.md](./049_PERIPHERAL_DEVELOPER_TOOLKIT.md)
**Previous Phase:** [049A - Phase 1: Protocol & Core Foundation](./049A_PERIPHERAL_TOOLKIT_PHASE1.md)

---

## Task 1: Scanner State Machine (Go)

**Files:**
- Create: `apps/peripheral-emulator/internal/scanner/scanner.go`
- Create: `apps/peripheral-emulator/internal/scanner/scanner_test.go`
- Modify: `apps/peripheral-emulator/internal/server/server.go`

**Step 1: Write failing test for scanner state machine**

Create `apps/peripheral-emulator/internal/scanner/scanner_test.go`:

```go
package scanner

import (
	"testing"
)

func TestScanner_InitialState(t *testing.T) {
	s := New()
	if s.Enabled() {
		t.Error("expected scanner to start disabled")
	}
}

func TestScanner_Enable(t *testing.T) {
	s := New()
	s.Enable()
	if !s.Enabled() {
		t.Error("expected scanner to be enabled after Enable()")
	}
}

func TestScanner_Disable(t *testing.T) {
	s := New()
	s.Enable()
	s.Disable()
	if s.Enabled() {
		t.Error("expected scanner to be disabled after Disable()")
	}
}

func TestScanner_Scan(t *testing.T) {
	s := New()
	events := make(chan ScanEvent, 1)
	s.OnScan(func(e ScanEvent) {
		events <- e
	})

	s.Enable()
	s.TriggerScan("1234567890123", "ean13")

	select {
	case e := <-events:
		if e.Barcode != "1234567890123" {
			t.Errorf("expected barcode 1234567890123, got %s", e.Barcode)
		}
		if e.Symbology != "ean13" {
			t.Errorf("expected symbology ean13, got %s", e.Symbology)
		}
	default:
		t.Error("expected scan event")
	}
}

func TestScanner_ScanWhenDisabled(t *testing.T) {
	s := New()
	events := make(chan ScanEvent, 1)
	s.OnScan(func(e ScanEvent) {
		events <- e
	})

	// Scanner is disabled by default
	s.TriggerScan("1234567890123", "ean13")

	select {
	case <-events:
		t.Error("should not receive scan event when disabled")
	default:
		// Expected - no event
	}
}
```

**Step 2: Run test to verify it fails**

```bash
cd apps/peripheral-emulator && go test ./internal/scanner/... -v
```

Expected: FAIL - package not found

**Step 3: Implement scanner state machine**

Create `apps/peripheral-emulator/internal/scanner/scanner.go`:

```go
package scanner

import (
	"sync"
	"time"
)

// ScanEvent represents a barcode scan
type ScanEvent struct {
	Barcode   string `json:"barcode"`
	Symbology string `json:"symbology"`
	Timestamp string `json:"timestamp"`
}

// ScanHandler is called when a scan occurs
type ScanHandler func(ScanEvent)

// Scanner represents the scanner state machine
type Scanner struct {
	enabled  bool
	handlers []ScanHandler
	mu       sync.RWMutex
}

// New creates a new scanner (disabled by default)
func New() *Scanner {
	return &Scanner{
		enabled:  false,
		handlers: make([]ScanHandler, 0),
	}
}

// Enabled returns whether the scanner is enabled
func (s *Scanner) Enabled() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.enabled
}

// Enable enables the scanner
func (s *Scanner) Enable() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.enabled = true
}

// Disable disables the scanner
func (s *Scanner) Disable() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.enabled = false
}

// OnScan registers a handler for scan events
func (s *Scanner) OnScan(handler ScanHandler) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.handlers = append(s.handlers, handler)
}

// TriggerScan triggers a scan event (if enabled)
func (s *Scanner) TriggerScan(barcode, symbology string) {
	s.mu.RLock()
	if !s.enabled {
		s.mu.RUnlock()
		return
	}
	handlers := make([]ScanHandler, len(s.handlers))
	copy(handlers, s.handlers)
	s.mu.RUnlock()

	event := ScanEvent{
		Barcode:   barcode,
		Symbology: symbology,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	for _, h := range handlers {
		h(event)
	}
}
```

**Step 4: Run tests to verify they pass**

```bash
cd apps/peripheral-emulator && go test ./internal/scanner/... -v
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add apps/peripheral-emulator/internal/scanner
git commit -m "feat(peripheral-emulator): implement scanner state machine"
```

---

## Task 2: Wire Scanner to Server

**Files:**
- Modify: `apps/peripheral-emulator/internal/server/server.go`
- Create: `apps/peripheral-emulator/internal/server/server_test.go`

**Step 1: Update server to include scanner**

Modify `apps/peripheral-emulator/internal/server/server.go`:

Add import:
```go
import (
	// ... existing imports
	"github.com/reactive-platform/peripheral-emulator/internal/scanner"
)
```

Add scanner field to Server struct:
```go
type Server struct {
	wsPort   int
	httpPort int
	deviceID string
	caps     Capabilities
	clients  map[*websocket.Conn]map[string]bool
	scanner  *scanner.Scanner
	mu       sync.RWMutex
}
```

Update NewServer:
```go
func NewServer(wsPort, httpPort int, deviceID string) *Server {
	s := &Server{
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
		scanner: scanner.New(),
	}

	// Wire scanner events to broadcast
	s.scanner.OnScan(func(e scanner.ScanEvent) {
		s.broadcastScanEvent(e)
	})

	return s
}
```

Add broadcast method:
```go
func (s *Server) broadcastScanEvent(e scanner.ScanEvent) {
	msg := struct {
		Type  string            `json:"type"`
		Event scanner.ScanEvent `json:"event"`
	}{
		Type:  "scan",
		Event: e,
	}

	frame, err := stomp.NewMessageFrame("/topic/scanner/events", msg)
	if err != nil {
		log.Printf("Error creating scan frame: %v", err)
		return
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for conn, subs := range s.clients {
		if subs["/topic/scanner/events"] {
			conn.WriteMessage(websocket.TextMessage, frame.Serialize())
		}
	}
}
```

Add control endpoint for triggering scans:
```go
func (s *Server) Start() error {
	// ... existing setup

	// HTTP control server
	httpMux := http.NewServeMux()
	httpMux.HandleFunc("/control/state", s.handleState)
	httpMux.HandleFunc("/control/scanner/scan", s.handleTriggerScan)
	httpMux.HandleFunc("/control/scanner/enable", s.handleScannerEnable)
	httpMux.HandleFunc("/control/scanner/disable", s.handleScannerDisable)
	httpMux.HandleFunc("/health", s.handleHealth)

	// ... rest of Start()
}

func (s *Server) handleTriggerScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Barcode   string `json:"barcode"`
		Symbology string `json:"symbology"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Barcode == "" {
		req.Barcode = "0012345678905"
	}
	if req.Symbology == "" {
		req.Symbology = "ean13"
	}

	s.scanner.TriggerScan(req.Barcode, req.Symbology)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *Server) handleScannerEnable(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	s.scanner.Enable()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"enabled": true})
}

func (s *Server) handleScannerDisable(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	s.scanner.Disable()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"enabled": false})
}
```

Update handleState to include scanner state:
```go
func (s *Server) handleState(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"deviceId":       s.deviceID,
		"capabilities":   s.caps,
		"clients":        len(s.clients),
		"scannerEnabled": s.scanner.Enabled(),
	})
}
```

Handle SEND messages for scanner commands:
```go
func (s *Server) handleFrame(conn *websocket.Conn, frame *stomp.Frame) {
	switch frame.Command {
	// ... existing cases

	case "SEND":
		dest := frame.Headers["destination"]
		log.Printf("Received SEND to %s: %s", dest, string(frame.Body))

		switch dest {
		case "/app/scanner/enable":
			s.scanner.Enable()
		case "/app/scanner/disable":
			s.scanner.Disable()
		}
	}
}
```

**Step 2: Verify emulator builds**

```bash
cd apps/peripheral-emulator && go build .
```

Expected: Build succeeds

**Step 3: Manual test - trigger scan via HTTP**

Terminal 1:
```bash
pnpm nx serve peripheral-emulator
```

Terminal 2:
```bash
# Enable scanner
curl -X POST http://localhost:9101/control/scanner/enable

# Trigger scan
curl -X POST http://localhost:9101/control/scanner/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode": "0012345678905", "symbology": "ean13"}'
```

Expected: Scanner enabled, scan triggered (visible in emulator logs)

**Step 4: Commit**

```bash
git add apps/peripheral-emulator/internal/server/server.go
git commit -m "feat(peripheral-emulator): wire scanner to server with HTTP control"
```

---

## Task 3: Scanner Service (SDK Core)

**Files:**
- Create: `libs/frontend/peripheral-sdk/core/src/services/scanner-service.ts`
- Create: `libs/frontend/peripheral-sdk/core/src/services/scanner-service.spec.ts`
- Create: `libs/frontend/peripheral-sdk/core/src/services/index.ts`
- Modify: `libs/frontend/peripheral-sdk/core/src/peripheral-client.ts`
- Modify: `libs/frontend/peripheral-sdk/core/src/index.ts`

**Step 1: Write failing test for ScannerService**

Create `libs/frontend/peripheral-sdk/core/src/services/scanner-service.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScannerService } from './scanner-service';
import { StompClient } from '../client';
import { ScanEvent, ScannerEventMessage } from '../types';

describe('ScannerService', () => {
  let service: ScannerService;
  let mockStomp: {
    subscribe: ReturnType<typeof vi.fn>;
    publish: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockStomp = {
      subscribe: vi.fn().mockReturnValue(vi.fn()),
      publish: vi.fn(),
    };
    service = new ScannerService(mockStomp as unknown as StompClient);
  });

  describe('enable', () => {
    it('should publish enable command', async () => {
      await service.enable();
      expect(mockStomp.publish).toHaveBeenCalledWith('/app/scanner/enable', {
        action: 'enable',
      });
    });

    it('should set enabled state to true', async () => {
      await service.enable();
      expect(service.enabled).toBe(true);
    });
  });

  describe('disable', () => {
    it('should publish disable command', async () => {
      await service.disable();
      expect(mockStomp.publish).toHaveBeenCalledWith('/app/scanner/disable', {
        action: 'disable',
      });
    });

    it('should set enabled state to false', async () => {
      await service.enable();
      await service.disable();
      expect(service.enabled).toBe(false);
    });
  });

  describe('onScan', () => {
    it('should subscribe to scanner events', () => {
      const handler = vi.fn();
      service.onScan(handler);

      expect(mockStomp.subscribe).toHaveBeenCalledWith(
        '/topic/scanner/events',
        expect.any(Function)
      );
    });

    it('should call handler when scan event received', () => {
      let stompHandler: (msg: ScannerEventMessage) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/scanner/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      const scanHandler = vi.fn();
      service.onScan(scanHandler);

      const scanEvent: ScanEvent = {
        barcode: '0012345678905',
        symbology: 'ean13',
        timestamp: new Date().toISOString(),
      };

      stompHandler!({ type: 'scan', event: scanEvent });

      expect(scanHandler).toHaveBeenCalledWith(scanEvent);
    });

    it('should return unsubscribe function', () => {
      const unsubscribeMock = vi.fn();
      mockStomp.subscribe.mockReturnValue(unsubscribeMock);

      const handler = vi.fn();
      const unsubscribe = service.onScan(handler);

      unsubscribe();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm nx test peripheral-core -- --run`

Expected: FAIL - module './scanner-service' not found

**Step 3: Implement ScannerService**

Create `libs/frontend/peripheral-sdk/core/src/services/scanner-service.ts`:

```typescript
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
```

**Step 4: Create services index**

Create `libs/frontend/peripheral-sdk/core/src/services/index.ts`:

```typescript
export * from './scanner-service';
```

**Step 5: Add scanner property to PeripheralClient**

Modify `libs/frontend/peripheral-sdk/core/src/peripheral-client.ts`:

Add import:
```typescript
import { ScannerService } from './services';
```

Add scanner field:
```typescript
export class PeripheralClient {
  private stomp: StompClient;
  private _capabilities: Capabilities = {};
  private _scanner: ScannerService;
  // ... rest of fields
```

Update constructor:
```typescript
constructor(endpoint: string, options: PeripheralClientOptions = {}) {
  this.stomp = new StompClient(endpoint, options);
  this._scanner = new ScannerService(this.stomp);
  // ... rest of constructor
}
```

Add scanner getter:
```typescript
/**
 * Scanner service
 */
get scanner(): ScannerService {
  return this._scanner;
}
```

Update disconnect to clean up scanner:
```typescript
async disconnect(): Promise<void> {
  this._scanner.destroy();
  // ... rest of disconnect
}
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
export * from './peripheral-client';

// Services
export * from './services';
```

**Step 7: Run tests to verify they pass**

Run: `pnpm nx test peripheral-core -- --run`

Expected: All tests pass

**Step 8: Commit**

```bash
git add libs/frontend/peripheral-sdk/core/src/services
git add libs/frontend/peripheral-sdk/core/src/peripheral-client.ts
git add libs/frontend/peripheral-sdk/core/src/index.ts
git commit -m "feat(peripheral-core): implement ScannerService"
```

---

## Task 4: SDK React Library Scaffold

**Files:**
- Create: `libs/frontend/peripheral-sdk/react/project.json`
- Create: `libs/frontend/peripheral-sdk/react/package.json`
- Create: `libs/frontend/peripheral-sdk/react/tsconfig.json`
- Create: `libs/frontend/peripheral-sdk/react/tsconfig.lib.json`
- Create: `libs/frontend/peripheral-sdk/react/vite.config.ts`
- Create: `libs/frontend/peripheral-sdk/react/src/index.ts`
- Modify: `tsconfig.base.json`

**Step 1: Create project directory**

```bash
mkdir -p libs/frontend/peripheral-sdk/react/src
```

**Step 2: Create project.json**

Create `libs/frontend/peripheral-sdk/react/project.json`:

```json
{
  "name": "peripheral-react",
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/frontend/peripheral-sdk/react/src",
  "projectType": "library",
  "tags": ["scope:frontend", "type:util"],
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/frontend/peripheral-sdk/react"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{workspaceRoot}/coverage/libs/frontend/peripheral-sdk/react"],
      "options": {
        "reportsDirectory": "../../../../coverage/libs/frontend/peripheral-sdk/react"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    },
    "ladle": {
      "executor": "nx:run-commands",
      "options": {
        "commands": ["pnpm ladle serve"],
        "cwd": "libs/frontend/peripheral-sdk/react"
      }
    }
  }
}
```

**Step 3: Create package.json**

Create `libs/frontend/peripheral-sdk/react/package.json`:

```json
{
  "name": "@reactive-platform/peripheral-react",
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
    "react": "^18.0.0",
    "@reactive-platform/peripheral-core": "workspace:*"
  }
}
```

**Step 4: Create tsconfig files**

Create `libs/frontend/peripheral-sdk/react/tsconfig.json`:

```json
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "jsx": "react-jsx",
    "types": ["vitest"]
  },
  "files": [],
  "include": [],
  "references": [{ "path": "./tsconfig.lib.json" }]
}
```

Create `libs/frontend/peripheral-sdk/react/tsconfig.lib.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../../dist/out-tsc",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["src/**/*.spec.ts", "src/**/*.spec.tsx", "src/**/*.test.ts", "src/**/*.test.tsx"]
}
```

**Step 5: Create vite.config.ts**

Create `libs/frontend/peripheral-sdk/react/vite.config.ts`:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
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
      external: ['react', 'react-dom', '@reactive-platform/peripheral-core'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

**Step 6: Create test setup**

Create `libs/frontend/peripheral-sdk/react/src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

**Step 7: Create placeholder index**

Create `libs/frontend/peripheral-sdk/react/src/index.ts`:

```typescript
// @reactive-platform/peripheral-react
// React bindings for peripheral SDK

export const VERSION = '0.0.1';
```

**Step 8: Update tsconfig.base.json**

Add path mapping for react package:

```json
"@reactive-platform/peripheral-react": [
  "libs/frontend/peripheral-sdk/react/src/index.ts"
]
```

**Step 9: Verify Nx recognizes the project**

Run: `pnpm nx show project peripheral-react`

Expected: Project configuration displayed

**Step 10: Commit**

```bash
git add libs/frontend/peripheral-sdk/react tsconfig.base.json
git commit -m "feat(peripheral-react): scaffold React SDK library"
```

---

## Task 5: PeripheralProvider Context

**Files:**
- Create: `libs/frontend/peripheral-sdk/react/src/context/peripheral-context.tsx`
- Create: `libs/frontend/peripheral-sdk/react/src/context/peripheral-context.spec.tsx`
- Create: `libs/frontend/peripheral-sdk/react/src/context/index.ts`
- Modify: `libs/frontend/peripheral-sdk/react/src/index.ts`

**Step 1: Write failing test for PeripheralProvider**

Create `libs/frontend/peripheral-sdk/react/src/context/peripheral-context.spec.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PeripheralProvider, usePeripherals } from './peripheral-context';
import { PeripheralClient } from '@reactive-platform/peripheral-core';

// Mock the core SDK
vi.mock('@reactive-platform/peripheral-core', () => ({
  PeripheralClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    capabilities: {},
    connected: false,
    onCapabilities: vi.fn().mockReturnValue(vi.fn()),
    onConnectionChange: vi.fn().mockReturnValue(vi.fn()),
    scanner: {
      enable: vi.fn(),
      disable: vi.fn(),
      enabled: false,
      onScan: vi.fn().mockReturnValue(vi.fn()),
      destroy: vi.fn(),
    },
  })),
}));

function TestConsumer() {
  const { connected, capabilities } = usePeripherals();
  return (
    <div>
      <span data-testid="connected">{connected ? 'yes' : 'no'}</span>
      <span data-testid="scanner">
        {capabilities.scanner?.available ? 'available' : 'unavailable'}
      </span>
    </div>
  );
}

describe('PeripheralProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <PeripheralProvider endpoint="ws://localhost:9100/stomp">
        <div data-testid="child">Hello</div>
      </PeripheralProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should create PeripheralClient with endpoint', () => {
    render(
      <PeripheralProvider endpoint="ws://localhost:9100/stomp">
        <div>Test</div>
      </PeripheralProvider>
    );

    expect(PeripheralClient).toHaveBeenCalledWith(
      'ws://localhost:9100/stomp',
      expect.any(Object)
    );
  });

  it('should provide connection state via usePeripherals', async () => {
    render(
      <PeripheralProvider endpoint="ws://localhost:9100/stomp">
        <TestConsumer />
      </PeripheralProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('connected')).toHaveTextContent('no');
    });
  });
});

describe('usePeripherals', () => {
  it('should throw when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('usePeripherals must be used within a PeripheralProvider');

    consoleError.mockRestore();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm nx test peripheral-react -- --run`

Expected: FAIL - module not found

**Step 3: Implement PeripheralProvider**

Create `libs/frontend/peripheral-sdk/react/src/context/peripheral-context.tsx`:

```typescript
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import {
  PeripheralClient,
  PeripheralClientOptions,
  Capabilities,
  ScannerService,
} from '@reactive-platform/peripheral-core';

/**
 * Context value for peripheral state
 */
interface PeripheralContextValue {
  /** Whether connected to bridge */
  connected: boolean;
  /** Current device capabilities */
  capabilities: Capabilities;
  /** Scanner service */
  scanner: ScannerService | null;
  /** Underlying client (for advanced usage) */
  client: PeripheralClient | null;
}

const PeripheralContext = createContext<PeripheralContextValue | null>(null);

/**
 * Props for PeripheralProvider
 */
export interface PeripheralProviderProps {
  /** WebSocket endpoint URL */
  endpoint: string;
  /** Client options */
  options?: PeripheralClientOptions;
  /** Children */
  children: ReactNode;
}

/**
 * Provider component for peripheral SDK
 */
export function PeripheralProvider({
  endpoint,
  options = {},
  children,
}: PeripheralProviderProps) {
  const [client, setClient] = useState<PeripheralClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities>({});

  // Initialize client
  useEffect(() => {
    const peripheralClient = new PeripheralClient(endpoint, options);
    setClient(peripheralClient);

    // Set up listeners
    const unsubConnection = peripheralClient.onConnectionChange(setConnected);
    const unsubCapabilities = peripheralClient.onCapabilities(setCapabilities);

    // Connect
    peripheralClient.connect().catch((error) => {
      console.error('Failed to connect to peripheral bridge:', error);
    });

    return () => {
      unsubConnection();
      unsubCapabilities();
      peripheralClient.disconnect();
    };
  }, [endpoint]);

  const value = useMemo<PeripheralContextValue>(
    () => ({
      connected,
      capabilities,
      scanner: client?.scanner ?? null,
      client,
    }),
    [connected, capabilities, client]
  );

  return (
    <PeripheralContext.Provider value={value}>
      {children}
    </PeripheralContext.Provider>
  );
}

/**
 * Hook to access peripheral state
 */
export function usePeripherals(): PeripheralContextValue {
  const context = useContext(PeripheralContext);
  if (!context) {
    throw new Error('usePeripherals must be used within a PeripheralProvider');
  }
  return context;
}
```

**Step 4: Create context index**

Create `libs/frontend/peripheral-sdk/react/src/context/index.ts`:

```typescript
export * from './peripheral-context';
```

**Step 5: Update main index**

Modify `libs/frontend/peripheral-sdk/react/src/index.ts`:

```typescript
// @reactive-platform/peripheral-react
// React bindings for peripheral SDK

export const VERSION = '0.0.1';

// Context
export * from './context';
```

**Step 6: Run tests to verify they pass**

Run: `pnpm nx test peripheral-react -- --run`

Expected: All tests pass

**Step 7: Commit**

```bash
git add libs/frontend/peripheral-sdk/react/src/context
git add libs/frontend/peripheral-sdk/react/src/index.ts
git commit -m "feat(peripheral-react): implement PeripheralProvider context"
```

---

## Task 6: useScanner Hook

**Files:**
- Create: `libs/frontend/peripheral-sdk/react/src/hooks/use-scanner.ts`
- Create: `libs/frontend/peripheral-sdk/react/src/hooks/use-scanner.spec.tsx`
- Create: `libs/frontend/peripheral-sdk/react/src/hooks/index.ts`
- Modify: `libs/frontend/peripheral-sdk/react/src/index.ts`

**Step 1: Write failing test for useScanner**

Create `libs/frontend/peripheral-sdk/react/src/hooks/use-scanner.spec.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { useScanner } from './use-scanner';
import { PeripheralProvider } from '../context';
import { ScanEvent } from '@reactive-platform/peripheral-core';

// Mock the core SDK
const mockScanner = {
  enable: vi.fn().mockResolvedValue(undefined),
  disable: vi.fn().mockResolvedValue(undefined),
  enabled: false,
  onScan: vi.fn().mockReturnValue(vi.fn()),
  destroy: vi.fn(),
};

vi.mock('@reactive-platform/peripheral-core', () => ({
  PeripheralClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    capabilities: { scanner: { available: true } },
    connected: true,
    onCapabilities: vi.fn().mockReturnValue(vi.fn()),
    onConnectionChange: vi.fn().mockReturnValue(vi.fn()),
    scanner: mockScanner,
  })),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <PeripheralProvider endpoint="ws://localhost:9100/stomp">
      {children}
    </PeripheralProvider>
  );
}

describe('useScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScanner.enabled = false;
  });

  it('should return scanner state', async () => {
    const { result } = renderHook(() => useScanner(), { wrapper });

    await waitFor(() => {
      expect(result.current.enabled).toBe(false);
    });
  });

  it('should enable scanner', async () => {
    mockScanner.enable.mockImplementation(() => {
      mockScanner.enabled = true;
      return Promise.resolve();
    });

    const { result } = renderHook(() => useScanner(), { wrapper });

    await act(async () => {
      await result.current.enable();
    });

    expect(mockScanner.enable).toHaveBeenCalled();
  });

  it('should disable scanner', async () => {
    mockScanner.enabled = true;
    mockScanner.disable.mockImplementation(() => {
      mockScanner.enabled = false;
      return Promise.resolve();
    });

    const { result } = renderHook(() => useScanner(), { wrapper });

    await act(async () => {
      await result.current.disable();
    });

    expect(mockScanner.disable).toHaveBeenCalled();
  });

  it('should track last scan', async () => {
    let scanHandler: ((event: ScanEvent) => void) | null = null;
    mockScanner.onScan.mockImplementation((handler) => {
      scanHandler = handler;
      return vi.fn();
    });

    const { result } = renderHook(() => useScanner(), { wrapper });

    const scanEvent: ScanEvent = {
      barcode: '0012345678905',
      symbology: 'ean13',
      timestamp: new Date().toISOString(),
    };

    await act(async () => {
      scanHandler?.(scanEvent);
    });

    expect(result.current.lastScan).toEqual(scanEvent);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm nx test peripheral-react -- --run`

Expected: FAIL - module './use-scanner' not found

**Step 3: Implement useScanner**

Create `libs/frontend/peripheral-sdk/react/src/hooks/use-scanner.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { ScanEvent } from '@reactive-platform/peripheral-core';
import { usePeripherals } from '../context';

/**
 * Return type for useScanner hook
 */
export interface UseScannerReturn {
  /** Enable the scanner */
  enable: () => Promise<void>;
  /** Disable the scanner */
  disable: () => Promise<void>;
  /** Whether scanner is enabled */
  enabled: boolean;
  /** Most recent scan event */
  lastScan: ScanEvent | null;
  /** Whether scanner capability is available */
  available: boolean;
}

/**
 * Hook for scanner operations
 */
export function useScanner(): UseScannerReturn {
  const { scanner, capabilities } = usePeripherals();
  const [enabled, setEnabled] = useState(false);
  const [lastScan, setLastScan] = useState<ScanEvent | null>(null);

  // Subscribe to scan events
  useEffect(() => {
    if (!scanner) return;

    const unsubscribe = scanner.onScan((event) => {
      setLastScan(event);
    });

    return unsubscribe;
  }, [scanner]);

  // Sync enabled state
  useEffect(() => {
    if (scanner) {
      setEnabled(scanner.enabled);
    }
  }, [scanner]);

  const enable = useCallback(async () => {
    if (!scanner) return;
    await scanner.enable();
    setEnabled(true);
  }, [scanner]);

  const disable = useCallback(async () => {
    if (!scanner) return;
    await scanner.disable();
    setEnabled(false);
  }, [scanner]);

  return {
    enable,
    disable,
    enabled,
    lastScan,
    available: capabilities.scanner?.available ?? false,
  };
}
```

**Step 4: Create hooks index**

Create `libs/frontend/peripheral-sdk/react/src/hooks/index.ts`:

```typescript
export * from './use-scanner';
```

**Step 5: Update main index**

Modify `libs/frontend/peripheral-sdk/react/src/index.ts`:

```typescript
// @reactive-platform/peripheral-react
// React bindings for peripheral SDK

export const VERSION = '0.0.1';

// Context
export * from './context';

// Hooks
export * from './hooks';
```

**Step 6: Run tests to verify they pass**

Run: `pnpm nx test peripheral-react -- --run`

Expected: All tests pass

**Step 7: Commit**

```bash
git add libs/frontend/peripheral-sdk/react/src/hooks
git add libs/frontend/peripheral-sdk/react/src/index.ts
git commit -m "feat(peripheral-react): implement useScanner hook"
```

---

## Task 7: MSW Scanner Handlers

**Files:**
- Create: `libs/frontend/peripheral-mocks/project.json`
- Create: `libs/frontend/peripheral-mocks/package.json`
- Create: `libs/frontend/peripheral-mocks/tsconfig.json`
- Create: `libs/frontend/peripheral-mocks/src/index.ts`
- Create: `libs/frontend/peripheral-mocks/src/handlers.ts`
- Create: `libs/frontend/peripheral-mocks/src/scanner.ts`
- Create: `libs/frontend/peripheral-mocks/src/scanner.spec.ts`
- Modify: `tsconfig.base.json`

**Step 1: Create project directory**

```bash
mkdir -p libs/frontend/peripheral-mocks/src
```

**Step 2: Create project.json**

Create `libs/frontend/peripheral-mocks/project.json`:

```json
{
  "name": "peripheral-mocks",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/frontend/peripheral-mocks/src",
  "projectType": "library",
  "tags": ["scope:frontend", "type:util", "type:test"],
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/frontend/peripheral-mocks"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{workspaceRoot}/coverage/libs/frontend/peripheral-mocks"],
      "options": {
        "reportsDirectory": "../../../coverage/libs/frontend/peripheral-mocks"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    }
  }
}
```

**Step 3: Create package.json**

Create `libs/frontend/peripheral-mocks/package.json`:

```json
{
  "name": "@reactive-platform/peripheral-mocks",
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
    "msw": "^2.0.0"
  }
}
```

**Step 4: Create tsconfig.json**

Create `libs/frontend/peripheral-mocks/tsconfig.json`:

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "types": ["vitest"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts"]
}
```

**Step 5: Create vite.config.ts**

Create `libs/frontend/peripheral-mocks/vite.config.ts`:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['msw'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
```

**Step 6: Implement scanner mock utilities**

Create `libs/frontend/peripheral-mocks/src/scanner.ts`:

```typescript
import { ScanEvent, BarcodeSymbology } from '@reactive-platform/peripheral-core';

/**
 * State for mock scanner
 */
export interface MockScannerState {
  enabled: boolean;
  scanQueue: ScanEvent[];
}

/**
 * Options for triggering a scan
 */
export interface TriggerScanOptions {
  barcode?: string;
  symbology?: BarcodeSymbology;
}

// Global mock state
let mockState: MockScannerState = {
  enabled: true,
  scanQueue: [],
};

// Event listeners
const scanListeners: Set<(event: ScanEvent) => void> = new Set();

/**
 * Trigger a mock scan event
 */
export function triggerScan(options: TriggerScanOptions = {}): ScanEvent {
  const event: ScanEvent = {
    barcode: options.barcode ?? '0012345678905',
    symbology: options.symbology ?? 'ean13',
    timestamp: new Date().toISOString(),
  };

  if (mockState.enabled) {
    scanListeners.forEach((listener) => listener(event));
  }

  return event;
}

/**
 * Enable mock scanner
 */
export function enableMockScanner(): void {
  mockState.enabled = true;
}

/**
 * Disable mock scanner
 */
export function disableMockScanner(): void {
  mockState.enabled = false;
}

/**
 * Register a scan event listener (for internal use)
 */
export function onMockScan(listener: (event: ScanEvent) => void): () => void {
  scanListeners.add(listener);
  return () => scanListeners.delete(listener);
}

/**
 * Reset mock scanner state
 */
export function resetMockScanner(): void {
  mockState = {
    enabled: true,
    scanQueue: [],
  };
  scanListeners.clear();
}

/**
 * Get current mock scanner state
 */
export function getMockScannerState(): MockScannerState {
  return { ...mockState };
}
```

**Step 7: Write test for scanner mocks**

Create `libs/frontend/peripheral-mocks/src/scanner.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  triggerScan,
  enableMockScanner,
  disableMockScanner,
  onMockScan,
  resetMockScanner,
  getMockScannerState,
} from './scanner';

describe('Mock Scanner', () => {
  beforeEach(() => {
    resetMockScanner();
  });

  describe('triggerScan', () => {
    it('should emit scan event with default values', () => {
      const listener = vi.fn();
      onMockScan(listener);

      triggerScan();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          barcode: '0012345678905',
          symbology: 'ean13',
        })
      );
    });

    it('should emit scan event with custom values', () => {
      const listener = vi.fn();
      onMockScan(listener);

      triggerScan({ barcode: '1234567890', symbology: 'qr' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          barcode: '1234567890',
          symbology: 'qr',
        })
      );
    });

    it('should not emit when scanner disabled', () => {
      const listener = vi.fn();
      onMockScan(listener);

      disableMockScanner();
      triggerScan();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('enable/disable', () => {
    it('should enable scanner', () => {
      disableMockScanner();
      enableMockScanner();

      expect(getMockScannerState().enabled).toBe(true);
    });

    it('should disable scanner', () => {
      disableMockScanner();

      expect(getMockScannerState().enabled).toBe(false);
    });
  });

  describe('onMockScan', () => {
    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = onMockScan(listener);

      unsubscribe();
      triggerScan();

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
```

**Step 8: Create main index**

Create `libs/frontend/peripheral-mocks/src/index.ts`:

```typescript
// @reactive-platform/peripheral-mocks
// MSW handlers for peripheral SDK testing

export * from './scanner';
```

**Step 9: Update tsconfig.base.json**

Add path mapping:

```json
"@reactive-platform/peripheral-mocks": [
  "libs/frontend/peripheral-mocks/src/index.ts"
]
```

**Step 10: Run tests**

Run: `pnpm nx test peripheral-mocks -- --run`

Expected: All tests pass

**Step 11: Commit**

```bash
git add libs/frontend/peripheral-mocks tsconfig.base.json
git commit -m "feat(peripheral-mocks): implement MSW scanner mock utilities"
```

---

## Phase 2 Complete

**What was built:**
- Scanner state machine in Go emulator
- HTTP control endpoints for scanner
- ScannerService in SDK Core
- React SDK scaffold with PeripheralProvider
- useScanner hook
- MSW scanner mock utilities

**Next Phase:** [049C - Payment Implementation](./049C_PERIPHERAL_TOOLKIT_PHASE3.md)
