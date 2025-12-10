# @reactive-platform/peripheral-mocks

Mock utilities for testing peripheral SDK integrations. Provides test helpers for scanner and payment operations without requiring the emulator.

## Installation

```bash
pnpm add -D @reactive-platform/peripheral-mocks
```

## Scanner Mocks

```typescript
import {
  triggerScan,
  enableMockScanner,
  disableMockScanner,
  onMockScan,
  resetMockScanner,
} from '@reactive-platform/peripheral-mocks';

test('adds scanned item to cart', async () => {
  render(<CheckoutFlow />);

  // Trigger a mock scan
  triggerScan({ barcode: '0012345678905', symbology: 'ean13' });

  // Verify item appears
  await screen.findByText('Organic Apples');
});

test('scanner respects enabled state', () => {
  disableMockScanner();

  const handler = vi.fn();
  onMockScan(handler);

  triggerScan({ barcode: '123', symbology: 'ean13' });

  expect(handler).not.toHaveBeenCalled();
});
```

## Payment Mocks

```typescript
import {
  forcePaymentApprove,
  forcePaymentDecline,
  setMockPaymentState,
  onMockPaymentStateChange,
  startMockPayment,
  resetMockPayment,
  configureMockPayment,
} from '@reactive-platform/peripheral-mocks';

test('handles payment approval', async () => {
  render(<CheckoutFlow />);

  await userEvent.click(screen.getByRole('button', { name: /pay/i }));

  // Force approval
  forcePaymentApprove({ transactionId: 'test-txn-123' });

  await screen.findByText(/payment approved/i);
});

test('handles payment decline', async () => {
  render(<CheckoutFlow />);

  await userEvent.click(screen.getByRole('button', { name: /pay/i }));

  forcePaymentDecline({ reason: 'insufficient_funds' });

  await screen.findByText(/payment declined/i);
});

test('auto-approval flow', async () => {
  configureMockPayment({ autoResolve: true, outcome: 'approved' });

  // Payment will auto-approve after configured delay
  startMockPayment();
});
```

## API

### Scanner Functions

| Function | Description |
|----------|-------------|
| `triggerScan(event)` | Emit a scan event |
| `enableMockScanner()` | Enable the mock scanner |
| `disableMockScanner()` | Disable the mock scanner |
| `onMockScan(handler)` | Subscribe to mock scan events |
| `getMockScannerState()` | Get current scanner state |
| `resetMockScanner()` | Reset to initial state |

### Payment Functions

| Function | Description |
|----------|-------------|
| `forcePaymentApprove(overrides?)` | Force payment approval |
| `forcePaymentDecline(options?)` | Force payment decline |
| `setMockPaymentState(state)` | Set intermediate state |
| `onMockPaymentStateChange(listener)` | Subscribe to state changes |
| `startMockPayment()` | Auto-resolve based on config |
| `configureMockPayment(config)` | Configure default behavior |
| `getMockPaymentState()` | Get current payment state |
| `resetMockPayment()` | Reset to initial state |

## Usage Notes

- Use these mocks for component tests and Playwright e2e tests
- For realistic flow testing, use the emulator instead
- Mocks do not simulate intermediate payment states by default
- Call `reset*` functions in `beforeEach` to ensure clean state

## Testing

```bash
pnpm nx test peripheral-mocks
```

## See Also

- [Emulator](../../../apps/peripheral-emulator/README.md) - For realistic testing
- [Getting Started Guide](../../../docs/peripheral-sdk/getting-started.md)
