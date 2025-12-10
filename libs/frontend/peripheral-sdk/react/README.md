# @reactive-platform/peripheral-react

React hooks and context for integrating with retail peripheral devices.

## Installation

```bash
pnpm add @reactive-platform/peripheral-react @reactive-platform/peripheral-core
```

## Quick Start

```tsx
import { PeripheralProvider, useScanner, usePayment } from '@reactive-platform/peripheral-react';

function App() {
  return (
    <PeripheralProvider endpoint="ws://localhost:9100/stomp">
      <CheckoutFlow />
    </PeripheralProvider>
  );
}

function CheckoutFlow() {
  const { enable, lastScan, enabled } = useScanner();
  const { collect, state } = usePayment();

  return (
    <div>
      <button onClick={enable} disabled={enabled}>
        Enable Scanner
      </button>

      {lastScan && <p>Scanned: {lastScan.barcode}</p>}

      <button onClick={() => collect({ amount: 1000, currency: 'USD' })}>
        Pay $10.00
      </button>

      <p>Payment state: {state}</p>
    </div>
  );
}
```

## Hooks

### usePeripherals

Access connection state and capabilities.

```typescript
const { connected, capabilities, client } = usePeripherals();
```

### useScanner

Control scanner and receive scan events.

```typescript
const { enable, disable, enabled, lastScan, available } = useScanner();
```

### usePayment

Collect payments and track state.

```typescript
const { collect, cancel, state, result, available, methods } = usePayment();
```

## Context Provider

Wrap your app with `PeripheralProvider`:

```tsx
<PeripheralProvider
  endpoint="ws://localhost:9100/stomp"
  options={{ debug: true }}
>
  <App />
</PeripheralProvider>
```

## Ladle Stories

View component stories:

```bash
pnpm nx ladle peripheral-react
```

## Testing

```bash
pnpm nx test peripheral-react
```

## See Also

- [Core Library](../core/README.md)
- [API Reference](../../../../docs/peripheral-sdk/api-reference.md)
- [Getting Started Guide](../../../../docs/peripheral-sdk/getting-started.md)
