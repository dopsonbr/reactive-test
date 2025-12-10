# Peripheral SDK API Reference

## Core Library (`@reactive-platform/peripheral-core`)

### PeripheralClient

Main entry point for connecting to the peripheral bridge.

```typescript
import { PeripheralClient } from '@reactive-platform/peripheral-core';

const client = new PeripheralClient(endpoint, options?);
```

#### Constructor

| Parameter | Type | Description |
|-----------|------|-------------|
| `endpoint` | `string` | WebSocket URL (e.g., `ws://localhost:9100/stomp`) |
| `options` | `PeripheralClientOptions` | Optional configuration |

#### Options

```typescript
interface PeripheralClientOptions {
  reconnectDelay?: number;    // Default: 5000ms
  heartbeatIncoming?: number; // Default: 10000ms
  heartbeatOutgoing?: number; // Default: 10000ms
  debug?: boolean;            // Default: false
  autoReconnect?: boolean;    // Default: true
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `capabilities` | `Capabilities` | Current device capabilities |
| `connected` | `boolean` | Connection status |
| `scanner` | `ScannerService` | Scanner operations |
| `payment` | `PaymentService` | Payment operations |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `Promise<void>` | Connect to the bridge |
| `disconnect()` | `Promise<void>` | Disconnect from the bridge |
| `onCapabilities(handler)` | `Unsubscribe` | Subscribe to capability changes |
| `onConnectionChange(handler)` | `Unsubscribe` | Subscribe to connection changes |

---

### ScannerService

Scanner operations via `client.scanner`.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `enabled` | `boolean` | Whether scanner is enabled |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `enable()` | `Promise<void>` | Enable the scanner |
| `disable()` | `Promise<void>` | Disable the scanner |
| `onScan(handler)` | `Unsubscribe` | Subscribe to scan events |

#### ScanEvent

```typescript
interface ScanEvent {
  barcode: string;
  symbology: BarcodeSymbology;
  timestamp: string;
}

type BarcodeSymbology =
  | 'ean13' | 'ean8' | 'upc-a' | 'upc-e'
  | 'qr' | 'pdf417' | 'code128' | 'code39' | 'datamatrix';
```

---

### PaymentService

Payment operations via `client.payment`.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `state` | `PaymentState` | Current payment state |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `collect(request)` | `Promise<PaymentResult>` | Start payment collection |
| `cancel()` | `Promise<void>` | Cancel current payment |
| `onStateChange(handler)` | `Unsubscribe` | Subscribe to state changes |

#### PaymentRequest

```typescript
interface PaymentRequest {
  amount: number;        // Amount in cents
  currency: string;      // e.g., 'USD'
  allowCashback?: boolean;
  timeout?: number;      // Milliseconds
}
```

#### PaymentResult

```typescript
interface PaymentResult {
  approved: boolean;
  transactionId?: string;
  method?: 'chip' | 'contactless' | 'swipe';
  cardBrand?: string;
  last4?: string;
  authCode?: string;
  declineReason?: string;
  error?: string;
}
```

#### PaymentState

```typescript
type PaymentState =
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
```

---

## React Library (`@reactive-platform/peripheral-react`)

### PeripheralProvider

Context provider for React applications.

```tsx
import { PeripheralProvider } from '@reactive-platform/peripheral-react';

<PeripheralProvider endpoint="ws://localhost:9100/stomp">
  <App />
</PeripheralProvider>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `endpoint` | `string` | WebSocket URL |
| `options` | `PeripheralClientOptions` | Optional configuration |
| `children` | `ReactNode` | Child components |

---

### usePeripherals

Hook for accessing peripheral state.

```typescript
const { connected, capabilities, scanner, client } = usePeripherals();
```

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `connected` | `boolean` | Connection status |
| `capabilities` | `Capabilities` | Device capabilities |
| `scanner` | `ScannerService | null` | Scanner service |
| `client` | `PeripheralClient | null` | Underlying client |

---

### useScanner

Hook for scanner operations.

```typescript
const { enable, disable, enabled, lastScan, available } = useScanner();
```

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `enable` | `() => Promise<void>` | Enable scanner |
| `disable` | `() => Promise<void>` | Disable scanner |
| `enabled` | `boolean` | Whether enabled |
| `lastScan` | `ScanEvent | null` | Most recent scan |
| `available` | `boolean` | Capability available |

---

### usePayment

Hook for payment operations.

```typescript
const { collect, cancel, state, result, available, methods } = usePayment();
```

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `collect` | `(request: PaymentRequest) => Promise<PaymentResult>` | Start payment |
| `cancel` | `() => Promise<void>` | Cancel payment |
| `state` | `PaymentState` | Current state |
| `result` | `PaymentResult | null` | Last result |
| `available` | `boolean` | Capability available |
| `methods` | `string[]` | Available payment methods |

---

## STOMP Protocol Reference

### Destinations

| Destination | Direction | Purpose |
|-------------|-----------|---------|
| `/topic/capabilities` | Bridge → Client | Capability updates |
| `/topic/scanner/events` | Bridge → Client | Scan events |
| `/topic/payment/events` | Bridge → Client | Payment state/result events |
| `/app/scanner/enable` | Client → Bridge | Enable scanner |
| `/app/scanner/disable` | Client → Bridge | Disable scanner |
| `/app/payment/collect` | Client → Bridge | Start payment |
| `/app/payment/cancel` | Client → Bridge | Cancel payment |

### Message Formats

#### Capabilities Message

```json
{
  "type": "capabilities",
  "timestamp": "2025-12-10T10:30:00Z",
  "deviceId": "emulator-001",
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
    }
  }
}
```

#### Scan Event Message

```json
{
  "type": "scan",
  "event": {
    "barcode": "0012345678905",
    "symbology": "ean13",
    "timestamp": "2025-12-10T10:31:00Z"
  }
}
```

#### Payment State Event

```json
{
  "type": "state_change",
  "state": "authorizing"
}
```

#### Payment Result Event

```json
{
  "type": "result",
  "result": {
    "approved": true,
    "transactionId": "txn-123456",
    "method": "chip",
    "cardBrand": "visa",
    "last4": "4242",
    "authCode": "ABC123"
  }
}
```
