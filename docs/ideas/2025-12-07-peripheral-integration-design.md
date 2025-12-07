# Peripheral Integration Design

**Date:** 2025-12-07
**Status:** Draft
**Context:** Self-checkout kiosks and associate POS terminals

## Overview

A strategy for integrating hardware peripherals (scan guns, payment terminals, cash recyclers, lane lights) into the browser-based PWA application. The design emphasizes:

- **Vendor-agnostic abstraction** - Capabilities, not devices
- **Progressive enhancement** - Graceful degradation when devices unavailable
- **Security isolation** - PCI-sensitive devices behind separate bridge processes
- **Community standards** - STOMP protocol with JSON payloads

## Target Devices

| Device | Purpose | Criticality |
|--------|---------|-------------|
| Scan Gun | Barcode/QR scanning | Degraded (manual entry fallback) |
| Payment Terminal | EMV chip, contactless (NFC), swipe | Blocking |
| Cash Recycler | Bill accept/dispense | Blocking for cash flow |
| Coin Dispenser | Coin accept/dispense | Blocking for cash flow |
| Lane Lights (RGB) | Status indication, branding | Best-effort |
| ID Scanner | Age verification (future) | Blocking when required |

## Architecture

### Three-Tier Bridge Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser (PWA)                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Peripheral Service Layer                  │  │
│  │     (React hooks/context, capability detection)        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │ WebSocket (ws://localhost:9100)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      Unified Bridge                          │
│   - Single connection point for all peripherals              │
│   - Capability advertisement on connect                      │
│   - Message routing to specialized bridges                   │
│   - Non-sensitive devices handled directly                   │
└──────────────────────────────────────────────────────────────┘
        │              │              │                │
        │ direct       │ direct       │ IPC            │ IPC
        ▼              ▼              ▼                ▼
┌─────────────┐ ┌─────────────┐ ┌───────────────┐ ┌───────────────┐
│ Scan Gun    │ │ Lane Lights │ │Payment Bridge │ │Sensitive Data │
│             │ │   (RGB)     │ │(isolated)     │ │Bridge         │
│ - USB HID   │ │             │ │               │ │(isolated)     │
│ - Serial    │ │ - Serial    │ │ - PCI boundary│ │               │
│ - Keyboard  │ │ - USB       │ │ - P2PE pass-  │ │ - PII boundary│
│   wedge     │ │ - Network   │ │   through     │ │ - ID verify   │
│   fallback  │ │             │ │               │ │ - Future      │
└─────────────┘ └─────────────┘ └───────────────┘ └───────────────┘
                                       │                │
                          ┌────────────┴────┐           │
                          ▼                 ▼           ▼
                   ┌────────────┐    ┌───────────┐ ┌──────────┐
                   │ P2PE Card  │    │   Cash    │ │    ID    │
                   │ Terminal   │    │ Recycler  │ │ Scanner  │
                   │            │    │           │ │          │
                   │ - EMV chip │    │ - Bill    │ │ - PDF417 │
                   │ - NFC tap  │    │   accept/ │ │ - Image  │
                   │ - Swipe    │    │   dispense│ │   capture│
                   └────────────┘    │ - Coin    │ └──────────┘
                                     │   accept/ │
                                     │   dispense│
                                     └───────────┘
```

**Key principle:** The client knows nothing about this topology. It connects to one WebSocket and requests capabilities. The unified bridge handles routing internally.

### Security Boundaries

- **Payment Bridge** runs as isolated process; unified bridge never sees cardholder data
- **P2PE hardware encryption** ensures card data is encrypted at the device
- **No application in PCI scope** - bridge sends "collect payment $X", receives "approved/declined"
- **Sensitive Data Bridge** for future PII handling (driver's license, ID verification)

## Capability Model

The frontend asks "can I do X?" not "is device Y connected?" This abstraction enables progressive enhancement and vendor independence.

### Capability Advertisement

On WebSocket connect, the bridge immediately sends current capabilities:

```json
{
  "type": "capabilities",
  "timestamp": "2025-12-07T10:30:00Z",
  "deviceId": "kiosk-042",
  "capabilities": {
    "scanner": {
      "available": true,
      "mode": "bridge",
      "symbologies": ["ean13", "upc-a", "qr", "pdf417"]
    },
    "payment": {
      "available": true,
      "methods": ["chip", "contactless", "swipe"],
      "cashback": true
    },
    "cash": {
      "available": true,
      "acceptsBills": [1, 5, 10, 20, 50, 100],
      "acceptsCoins": [0.01, 0.05, 0.10, 0.25, 0.50, 1.00],
      "dispensesChange": true,
      "billCapacity": { "current": 847, "max": 1000 },
      "coinLevels": { "0.25": 120, "0.10": 85, "0.05": 200 }
    },
    "lights": {
      "available": true,
      "type": "rgb",
      "zones": ["pole", "base"]
    },
    "idVerification": {
      "available": false
    }
  }
}
```

Capabilities update dynamically as devices connect/disconnect or state changes.

## Message Protocol (STOMP + JSON)

Using STOMP over WebSocket with JSON payloads. Provides pub/sub semantics, community conventions, and Spring `spring-messaging` support.

### Connection Flow

```
Client                                    Bridge
   |                                         |
   |  CONNECT                                |
   |  accept-version:1.2                     |
   |  host:localhost                         |
   | ─────────────────────────────────────►  |
   |                                         |
   |  CONNECTED                              |
   |  version:1.2                            |
   |  heart-beat:10000,10000                 |
   |  ◄─────────────────────────────────────  |
   |                                         |
   |  SUBSCRIBE                              |
   |  id:sub-0                               |
   |  destination:/topic/capabilities        |
   | ─────────────────────────────────────►  |
   |                                         |
   |  MESSAGE (capabilities payload)         |
   |  destination:/topic/capabilities        |
   |  content-type:application/json          |
   |  ◄─────────────────────────────────────  |
```

### Destinations

| Destination | Direction | Purpose |
|-------------|-----------|---------|
| `/topic/capabilities` | Bridge → Client | Capability updates, subscribe on connect |
| `/topic/scanner/events` | Bridge → Client | Barcode scan events |
| `/topic/payment/events` | Bridge → Client | Card inserted, PIN progress, result |
| `/topic/cash/events` | Bridge → Client | Bill/coin inserted, change dispensed, jams |
| `/topic/lights/status` | Bridge → Client | Light state confirmations |
| `/app/scanner/{action}` | Client → Bridge | Enable, disable scanner |
| `/app/payment/{action}` | Client → Bridge | Collect, void, refund |
| `/app/cash/{action}` | Client → Bridge | Start accepting, dispense change |
| `/app/lights/{action}` | Client → Bridge | Set color, flash, off |

### Example Command

```
SEND
destination:/app/payment/collect
content-type:application/json
receipt:msg-123

{"amount":4750,"currency":"USD","allowCashback":true,"timeout":60000}
```

### Example Event

```
MESSAGE
destination:/topic/payment/events
content-type:application/json
message-id:evt-456

{"event":"approved","transactionId":"txn-789","method":"contactless","cardBrand":"visa","last4":"4242","authCode":"ABC123"}
```

## Frontend Integration (React)

Context provider manages connection; hooks expose capabilities and actions.

### Provider Setup

```tsx
<PeripheralProvider endpoint="ws://localhost:9100/peripherals">
  <App />
</PeripheralProvider>
```

### Core Hooks

```typescript
const { capabilities, connected } = usePeripherals();
const { scan, lastScan, enabled } = useScanner();
const { collectPayment, status, lastResult } = usePayment();
const { startAccepting, dispenseChange, inserted, jam } = useCash();
const { setColor, flash, off } = useLights();
```

### Progressive Enhancement Pattern

```tsx
function PaymentOptions() {
  const { capabilities } = usePeripherals();

  const hasCard = capabilities.payment?.available;
  const hasCash = capabilities.cash?.available;

  if (!hasCard && !hasCash) {
    return <DirectToAttendedRegister />;
  }

  return (
    <div>
      {hasCard && <Button onClick={() => collectPayment(total)}>Pay with Card</Button>}
      {hasCash && <Button onClick={() => startAccepting(total)}>Pay with Cash</Button>}
      {!hasCash && hasCard && <p>Cash not available at this kiosk</p>}
    </div>
  );
}
```

## Error Handling

| Category | Examples | Behavior |
|----------|----------|----------|
| **Blocking** | Payment failed, cash jam during dispense | Stop flow, show clear error, require intervention |
| **Degraded** | Scanner disconnected, lights offline | Continue with fallback, show subtle indicator |
| **Transient** | WebSocket reconnecting, device busy | Auto-retry with backoff, show temporary status |

## Testing Strategy

| Level | Approach |
|-------|----------|
| **Frontend development** | Mock bridge with canned capabilities/responses |
| **Integration tests** | Real bridge with simulated devices |
| **Hardware-in-the-loop** | Actual devices for deployment validation |

MSW can intercept WebSocket connections for frontend unit/e2e tests.

---

## Implementation Notes

### Mock Hardware Devices

Before integrating with real hardware, create mock device implementations for each peripheral type:

1. **Mock Scanner** - Generates barcode scan events on timer or keyboard trigger
2. **Mock Payment Terminal** - Simulates card insert → PIN entry → approval flow with configurable delays and outcomes (approved, declined, timeout)
3. **Mock Cash Recycler** - Simulates bill/coin insertion events, tracks running total, simulates change dispensing
4. **Mock Coin Dispenser** - Simulates coin dispensing with realistic timing
5. **Mock Lane Lights** - Logs color/flash commands, can render visual indicator in dev tools
6. **Mock ID Scanner** - Returns canned driver's license data for age verification testing

Mock devices should:
- Be configurable for happy path and error scenarios (jams, timeouts, declines)
- Support deterministic behavior for automated tests
- Provide visual feedback during development (browser console, debug panel)
- Be toggleable per-device to test mixed availability scenarios

These mocks enable frontend development without physical hardware and provide the foundation for integration tests.
