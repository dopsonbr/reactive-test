# 049 - Peripheral Developer Toolkit

**Status:** Draft
**Created:** 2025-12-10
**Context:** Developer tooling for POS, Self-checkout, and Offline POS applications

## Overview

A set of tools enabling frontend teams to build retail applications without physical hardware. The toolkit provides emulators, SDKs, and documentation for peripheral integration.

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Peripheral Emulator** | Go binary with WebSocket server, state machines, web dashboard | `apps/peripheral-emulator/` |
| **SDK Core** | Framework-agnostic TypeScript library for WebSocket/STOMP connection | `libs/frontend/peripheral-sdk/core/` |
| **SDK React** | React hooks and context wrapping core | `libs/frontend/peripheral-sdk/react/` |
| **MSW Handlers** | Thin mock layer for component tests | `libs/frontend/peripheral-mocks/` |

### Device Scope (v1)

- **Scanner** - Barcode scan events (EAN-13, UPC-A, QR, PDF417)
- **Payment Terminal** - Full state machine (card present → PIN → auth → result)

Lights, cash, and ID scanner deferred to v2.

### Non-Goals (v1)

- Production hardware integration
- Real vendor SDK integration
- PCI compliance implementation

---

## Emulator Architecture

The Go emulator is a single binary with three responsibilities: WebSocket/STOMP server, device state machines, and control interface.

```
┌─────────────────────────────────────────────────────────────────┐
│                    peripheral-emulator (Go)                      │
├─────────────────────────────────────────────────────────────────┤
│  :9100 WebSocket/STOMP          │  :9101 HTTP Control + Dashboard │
│  ─────────────────────────      │  ──────────────────────────────│
│  • CONNECT/SUBSCRIBE/SEND       │  • GET /control/state           │
│  • /topic/capabilities          │  • POST /control/scanner/scan   │
│  • /topic/scanner/events        │  • POST /control/payment/insert │
│  • /topic/payment/events        │  • POST /control/payment/approve│
│  • /app/payment/collect         │  • Dashboard UI (embedded)      │
├─────────────────────────────────┴────────────────────────────────┤
│                        State Machines                            │
│  ┌─────────────┐    ┌────────────────────────────────────────┐  │
│  │   Scanner   │    │              Payment                    │  │
│  │ ─────────── │    │  idle → presented → reading → pin →    │  │
│  │ • enabled   │    │  authorizing → approved/declined       │  │
│  │ • disabled  │    │                                        │  │
│  └─────────────┘    └────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                    Configuration                                 │
│  • --port-ws=9100  --port-http=9101                             │
│  • --scanner-enabled=true  --payment-enabled=true               │
│  • --payment-auth-delay=2s  --payment-decline-rate=0.1          │
└──────────────────────────────────────────────────────────────────┘
```

### Dashboard Tabs

1. **Control Panel** - Toggle devices, trigger events, force state transitions
2. **Message Log** - Live view of all STOMP messages (both directions)
3. **Try It** - Embedded mini-checkout demo using the SDK

### Key Design Decisions

- Two ports: WebSocket for app traffic, HTTP for control (never mixed)
- State machines are deterministic unless randomness explicitly configured
- Dashboard is static assets embedded in Go binary (single file distribution)

---

## SDK Architecture

Two packages: a framework-agnostic core and React bindings that wrap it.

### Core Library (`@reactive-platform/peripheral-core`)

```typescript
// Connection management
class PeripheralClient {
  constructor(endpoint: string, options?: ClientOptions)
  connect(): Promise<void>
  disconnect(): void
  onCapabilities(handler: (caps: Capabilities) => void): Unsubscribe
  onConnectionChange(handler: (connected: boolean) => void): Unsubscribe
}

// Scanner API
interface ScannerService {
  enable(): Promise<void>
  disable(): Promise<void>
  onScan(handler: (scan: ScanEvent) => void): Unsubscribe
}

// Payment API
interface PaymentService {
  collect(request: PaymentRequest): Promise<PaymentResult>
  cancel(): Promise<void>
  onStateChange(handler: (state: PaymentState) => void): Unsubscribe
}

// Types
type PaymentState = 'idle' | 'card_presented' | 'reading_card' |
                    'pin_required' | 'pin_entry' | 'authorizing' |
                    'approved' | 'declined' | 'cancelled' | 'error'
```

### React Bindings (`@reactive-platform/peripheral-react`)

```typescript
// Provider
<PeripheralProvider endpoint="ws://localhost:9100/stomp">
  <App />
</PeripheralProvider>

// Hooks
const { capabilities, connected } = usePeripherals()
const { enable, disable, lastScan, enabled } = useScanner()
const { collect, cancel, state, result } = usePayment()
```

### Offline POS Usage (Vanilla ESM)

```javascript
import { PeripheralClient } from '@reactive-platform/peripheral-core'

const client = new PeripheralClient('ws://localhost:9100/stomp')
await client.connect()

client.scanner.onScan((event) => {
  console.log('Scanned:', event.barcode)
})
```

---

## MSW Handlers

Thin mock layer for fast component tests. Not a full emulator - just happy-path responses.

### Package (`@reactive-platform/peripheral-mocks`)

```typescript
// Setup for tests
import { setupPeripheralMocks } from '@reactive-platform/peripheral-mocks'

// In test setup or MSW worker
const handlers = setupPeripheralMocks({
  scanner: { enabled: true },
  payment: { enabled: true, defaultOutcome: 'approved' }
})
```

### What MSW Handles

| Scenario | Behavior |
|----------|----------|
| Connect | Immediate CONNECTED frame |
| Subscribe /topic/capabilities | Returns configured capabilities |
| Scanner enabled | Emits scan event when `triggerScan()` called |
| Payment collect | Returns approved/declined after short delay (no intermediate states) |

### What MSW Does NOT Handle

- Payment state machine transitions (no `card_presented`, `pin_required`, etc.)
- Realistic timing/delays
- Device disconnection scenarios
- Error injection

### Test Helpers

```typescript
import { triggerScan, forcePaymentDecline } from '@reactive-platform/peripheral-mocks'

test('adds scanned item to cart', async () => {
  render(<CheckoutFlow />)

  triggerScan({ barcode: '0012345678905', symbology: 'ean13' })

  await screen.findByText('Product added')
})

test('shows error on payment decline', async () => {
  forcePaymentDecline({ reason: 'insufficient_funds' })

  // ... test error UI
})
```

### Usage Guidance

> **Use MSW for:** Component tests, Playwright e2e with mocked APIs
> **Use Emulator for:** Integration testing, flow development, realistic scenarios

---

## Documentation

Three documentation artifacts: API reference, integration guide, and interactive examples.

### API Reference (`docs/peripheral-sdk/api-reference.md`)

Auto-generated where possible:
- TypeScript types exported from SDK (TSDoc → Markdown)
- STOMP destinations table with message schemas
- Capability JSON structure
- Payment state machine diagram

### Integration Guide (`docs/peripheral-sdk/getting-started.md`)

Step-by-step walkthrough (~15 minute read):

1. **Install the emulator** - Download binary or `pnpm nx serve peripheral-emulator`
2. **Start the emulator** - `./peripheral-emulator` (shows dashboard URL)
3. **Install SDK** - `pnpm add @reactive-platform/peripheral-core @reactive-platform/peripheral-react`
4. **Add the provider** - Wrap app with `<PeripheralProvider>`
5. **Detect capabilities** - Use `usePeripherals()` hook
6. **Handle scanner** - Subscribe to scan events, display product
7. **Collect payment** - Full flow with state handling
8. **Test with MSW** - Set up mocks for component tests

### Interactive Examples

**Emulator Dashboard "Try It" Tab:**
- Mini checkout flow: scan item → view cart → pay → receipt
- Shows SDK code snippets alongside working UI
- "View Source" button for each step

**Ladle Stories (`libs/frontend/peripheral-sdk/react/src/*.stories.tsx`):**

| Story | What it demonstrates |
|-------|---------------------|
| `CapabilityDisplay` | Shows current capabilities, reacts to changes |
| `ScannerListener` | Displays scans as they arrive |
| `PaymentFlow` | Full payment UI with all state transitions |
| `PaymentStates` | Individual state visualizations |

---

## Testing Strategy

How each component is tested, and how consumers test against them.

### Emulator Testing (Go)

```
apps/peripheral-emulator/
├── internal/
│   ├── scanner/scanner_test.go      # Unit tests for state machine
│   ├── payment/payment_test.go      # Unit tests for payment flow
│   └── stomp/stomp_test.go          # Protocol handling tests
└── e2e/
    └── emulator_test.go             # Full WebSocket integration tests
```

- State machines tested in isolation with deterministic inputs
- E2E tests connect via WebSocket, verify message sequences
- Dashboard tested manually (embedded static assets)

### SDK Core Testing (TypeScript)

```
libs/frontend/peripheral-sdk/core/
└── src/
    ├── client.spec.ts               # Connection lifecycle
    ├── scanner.spec.ts              # Scanner service
    └── payment.spec.ts              # Payment service + state handling
```

- Mock WebSocket (no real server needed)
- Tests verify correct STOMP frames sent/received
- Payment tests cover all state transitions

### SDK React Testing

```
libs/frontend/peripheral-sdk/react/
└── src/
    ├── hooks/useScanner.spec.tsx    # Hook behavior
    ├── hooks/usePayment.spec.tsx    # State updates, re-renders
    └── provider.spec.tsx            # Context setup, reconnection
```

- Uses `@testing-library/react`
- Mocks the core library (not WebSocket)
- Ladle stories double as visual tests

### Consumer App Testing

| Test Type | Tool | Backend |
|-----------|------|---------|
| Component tests | Vitest | MSW handlers |
| E2E (mocked) | Playwright | MSW handlers |
| E2E (realistic) | Playwright | Running emulator |

---

## Implementation Phases

Dependencies determine the build order.

### Phase 1: Protocol & Core Foundation

1. **Define message schemas** - TypeScript types for all STOMP messages (capabilities, scan events, payment states). This is the contract both sides implement against.

2. **SDK Core** - WebSocket/STOMP connection, capability parsing, basic pub/sub. Testable with mock WebSocket.

3. **Emulator skeleton** - Go binary with WebSocket server, STOMP protocol handling, capability advertisement. No state machines yet - just connects and sends capabilities.

### Phase 2: Scanner (Simplest Device)

4. **Scanner state machine (Go)** - Enable/disable, emit scan events via control API

5. **Scanner service (SDK Core)** - Subscribe to events, expose clean API

6. **Scanner hook (SDK React)** - `useScanner()` with enable/disable/lastScan

7. **MSW scanner handler** - `triggerScan()` test helper

### Phase 3: Payment (Complex Device)

8. **Payment state machine (Go)** - All transitions, configurable delays/outcomes

9. **Payment service (SDK Core)** - `collect()` promise, state change subscriptions

10. **Payment hook (SDK React)** - `usePayment()` with full state exposure

11. **MSW payment handler** - Simple approved/declined (no intermediate states)

### Phase 4: Developer Experience

12. **Emulator dashboard** - Control panel + message log + Try It demo

13. **Ladle stories** - Component demonstrations

14. **Documentation** - API reference + integration guide

---

## Related Documents

- [Peripheral Integration Design](../../ideas/2025-12-07-peripheral-integration-design.md) - Original architecture vision
- [ADR-0012: Offline POS Technology Stack](../../adrs/0012-offline-pos-technology-stack.md) - Go decision for Offline POS
