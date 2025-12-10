# @reactive-platform/peripheral-core

Framework-agnostic TypeScript library for connecting to retail peripheral devices via WebSocket/STOMP.

## Installation

```bash
pnpm add @reactive-platform/peripheral-core
```

## Quick Start

```typescript
import { PeripheralClient } from '@reactive-platform/peripheral-core';

const client = new PeripheralClient('ws://localhost:9100/stomp');
await client.connect();

// Check capabilities
console.log('Capabilities:', client.capabilities);

// Listen for scanner events
client.scanner.onScan((event) => {
  console.log('Scanned:', event.barcode, event.symbology);
});

// Collect payment
const result = await client.payment.collect({
  amount: 4750,
  currency: 'USD',
});

if (result.approved) {
  console.log('Payment approved:', result.transactionId);
}
```

## API

### PeripheralClient

Main entry point for connecting to the peripheral bridge.

| Method | Description |
|--------|-------------|
| `connect()` | Connect to the WebSocket server |
| `disconnect()` | Disconnect from the server |
| `onCapabilities(handler)` | Subscribe to capability changes |
| `onConnectionChange(handler)` | Subscribe to connection state |

### ScannerService

Available via `client.scanner`.

| Method | Description |
|--------|-------------|
| `enable()` | Enable the scanner |
| `disable()` | Disable the scanner |
| `onScan(handler)` | Subscribe to scan events |

### PaymentService

Available via `client.payment`.

| Method | Description |
|--------|-------------|
| `collect(request)` | Start payment collection |
| `cancel()` | Cancel current payment |
| `onStateChange(handler)` | Subscribe to state changes |
| `state` | Current payment state |

## Types

All types are exported from the package:

```typescript
import type {
  Capabilities,
  ScanEvent,
  BarcodeSymbology,
  PaymentRequest,
  PaymentResult,
  PaymentState,
} from '@reactive-platform/peripheral-core';
```

## Testing

```bash
pnpm nx test peripheral-core
```

## See Also

- [API Reference](../../../../docs/peripheral-sdk/api-reference.md)
- [Getting Started Guide](../../../../docs/peripheral-sdk/getting-started.md)
