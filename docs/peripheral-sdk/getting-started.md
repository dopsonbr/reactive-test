# Peripheral SDK Getting Started Guide

This guide walks you through setting up and using the Peripheral SDK for building POS, self-checkout, and kiosk applications.

## Prerequisites

- Node.js 18+
- pnpm package manager
- Go 1.22+ (for running the emulator)

## Quick Start

### 1. Start the Emulator

The emulator simulates hardware peripherals (scanner, payment terminal) for development.

```bash
# Build and run the emulator
pnpm nx serve peripheral-emulator
```

You'll see:
```
Starting Peripheral Emulator
  Device ID: emulator-001
  WebSocket: ws://localhost:9100/stomp
  Dashboard: http://localhost:9101
```

Open **http://localhost:9101** to access the dashboard.

### 2. Install the SDK

```bash
# Core library (required)
pnpm add @reactive-platform/peripheral-core

# React bindings (for React apps)
pnpm add @reactive-platform/peripheral-react

# Test mocks (for testing)
pnpm add -D @reactive-platform/peripheral-mocks
```

### 3. Connect to the Emulator

#### React Application

```tsx
// App.tsx
import { PeripheralProvider } from '@reactive-platform/peripheral-react';
import { CheckoutFlow } from './CheckoutFlow';

export function App() {
  return (
    <PeripheralProvider endpoint="ws://localhost:9100/stomp">
      <CheckoutFlow />
    </PeripheralProvider>
  );
}
```

#### Vanilla JavaScript

```javascript
import { PeripheralClient } from '@reactive-platform/peripheral-core';

const client = new PeripheralClient('ws://localhost:9100/stomp');
await client.connect();

console.log('Connected! Capabilities:', client.capabilities);
```

## Working with the Scanner

### React Hook

```tsx
import { useScanner } from '@reactive-platform/peripheral-react';

function ScannerPanel() {
  const { enable, disable, enabled, lastScan, available } = useScanner();

  if (!available) {
    return <p>Scanner not available</p>;
  }

  return (
    <div>
      <button onClick={enable} disabled={enabled}>Enable</button>
      <button onClick={disable} disabled={!enabled}>Disable</button>

      {lastScan && (
        <p>Last scan: {lastScan.barcode} ({lastScan.symbology})</p>
      )}
    </div>
  );
}
```

### Core Library

```javascript
// Enable scanner
await client.scanner.enable();

// Listen for scans
client.scanner.onScan((event) => {
  console.log('Scanned:', event.barcode, event.symbology);
});

// Disable when done
await client.scanner.disable();
```

### Testing with Dashboard

1. Open http://localhost:9101
2. Go to **Control Panel** tab
3. Click **Enable** under Scanner
4. Enter a barcode and click **Trigger Scan**
5. Your app should receive the scan event

## Working with Payments

### React Hook

```tsx
import { usePayment } from '@reactive-platform/peripheral-react';

function PaymentPanel({ amount }: { amount: number }) {
  const { collect, cancel, state, result, available } = usePayment();

  const handlePay = async () => {
    const result = await collect({
      amount,
      currency: 'USD',
    });

    if (result.approved) {
      console.log('Payment approved:', result.transactionId);
    } else {
      console.log('Payment declined:', result.declineReason);
    }
  };

  if (!available) {
    return <p>Payment terminal not available</p>;
  }

  return (
    <div>
      <p>State: {state}</p>
      <button onClick={handlePay} disabled={state !== 'idle'}>
        Pay ${(amount / 100).toFixed(2)}
      </button>
      {state !== 'idle' && (
        <button onClick={cancel}>Cancel</button>
      )}
    </div>
  );
}
```

### Handling Payment States

The payment flow goes through several states:

| State | Description | UI Recommendation |
|-------|-------------|-------------------|
| `idle` | Ready for payment | Show "Pay" button |
| `card_presented` | Card detected | Show "Card detected..." |
| `reading_card` | Reading card data | Show spinner |
| `pin_required` | PIN needed | Show "Enter PIN on terminal" |
| `pin_entry` | User entering PIN | Show "Entering PIN..." |
| `authorizing` | Waiting for auth | Show spinner |
| `approved` | Payment successful | Show success message |
| `declined` | Payment failed | Show error with retry |

```tsx
function PaymentStatus({ state }: { state: PaymentState }) {
  const messages: Record<PaymentState, string> = {
    idle: 'Ready to pay',
    card_presented: 'Card detected...',
    reading_card: 'Reading card...',
    pin_required: 'Enter PIN on terminal',
    pin_entry: 'Entering PIN...',
    authorizing: 'Authorizing...',
    approved: '✓ Payment approved!',
    declined: '✗ Payment declined',
    cancelled: 'Payment cancelled',
    error: 'An error occurred',
  };

  return <div className={`payment-status ${state}`}>{messages[state]}</div>;
}
```

### Testing with Dashboard

1. In your app, click "Pay" to start a payment
2. Open dashboard **Control Panel**
3. Click **Insert Card** (choose chip/contactless/swipe)
4. Watch the state transitions in your app
5. Click **Force Approve** or **Force Decline** to complete

## Testing with MSW Mocks

For component tests and Playwright e2e tests, use the mock utilities:

```typescript
import {
  triggerScan,
  forcePaymentApprove,
  forcePaymentDecline
} from '@reactive-platform/peripheral-mocks';

// In your test
test('adds scanned item to cart', async () => {
  render(<CheckoutFlow />);

  // Trigger a mock scan
  triggerScan({ barcode: '0012345678905', symbology: 'ean13' });

  // Verify item appears
  await screen.findByText('Organic Apples');
});

test('handles payment approval', async () => {
  render(<CheckoutFlow />);

  // Click pay button
  await userEvent.click(screen.getByRole('button', { name: /pay/i }));

  // Force approval
  forcePaymentApprove({ transactionId: 'test-txn-123' });

  // Verify success message
  await screen.findByText(/payment approved/i);
});

test('handles payment decline', async () => {
  render(<CheckoutFlow />);

  await userEvent.click(screen.getByRole('button', { name: /pay/i }));

  forcePaymentDecline({ reason: 'insufficient_funds' });

  await screen.findByText(/payment declined/i);
});
```

## Detecting Capabilities

Check what's available before showing features:

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
      {hasCard && <CardPaymentButton />}
      {hasCash && <CashPaymentButton />}
      {!hasCash && hasCard && (
        <p className="notice">Cash not available at this kiosk</p>
      )}
    </div>
  );
}
```

## Troubleshooting

### "Connection refused"

Make sure the emulator is running:
```bash
pnpm nx serve peripheral-emulator
```

### Scanner not receiving events

1. Check the dashboard - is scanner enabled?
2. Verify you're subscribed: `client.scanner.onScan(handler)`
3. Check browser console for STOMP errors

### Payment stuck in state

Use dashboard to force completion:
- **Force Approve** - Immediately approve
- **Force Decline** - Immediately decline

Or call `client.payment.cancel()` from your app.

## Next Steps

- Browse the [API Reference](./api-reference.md)
- View [Ladle Stories](http://localhost:61000) for component examples
- Check the [Dashboard](http://localhost:9101) for interactive testing
