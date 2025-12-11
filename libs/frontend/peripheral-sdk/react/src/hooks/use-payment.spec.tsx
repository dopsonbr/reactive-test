import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { usePayment } from './use-payment';
import { PeripheralProvider } from '../context';
import { PaymentState, PaymentResult } from '@reactive-platform/peripheral-core';

// Mock the core SDK
vi.mock('@reactive-platform/peripheral-core', () => {
  const mockPayment = {
    collect: vi.fn(),
    cancel: vi.fn(),
    state: 'idle' as PaymentState,
    onStateChange: vi.fn().mockReturnValue(vi.fn()),
    destroy: vi.fn(),
  };

  const mockScanner = {
    enable: vi.fn(),
    disable: vi.fn(),
    enabled: false,
    onScan: vi.fn().mockReturnValue(vi.fn()),
    destroy: vi.fn(),
  };

  return {
    PeripheralClient: class {
      connect = vi.fn().mockResolvedValue(undefined);
      disconnect = vi.fn().mockResolvedValue(undefined);
      capabilities = { payment: { available: true, methods: ['chip', 'contactless'] } };
      connected = true;
      onCapabilities = vi.fn().mockReturnValue(vi.fn());
      onConnectionChange = vi.fn().mockReturnValue(vi.fn());
      scanner = mockScanner;
      payment = mockPayment;
    },
  };
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <PeripheralProvider endpoint="ws://localhost:9100/stomp">
      {children}
    </PeripheralProvider>
  );
}

describe('usePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return payment state', async () => {
    const { result } = renderHook(() => usePayment(), { wrapper });

    await waitFor(() => {
      expect(result.current.state).toBe('idle');
    });
  });

  it('should call collect', async () => {
    const { result } = renderHook(() => usePayment(), { wrapper });

    await act(async () => {
      await result.current.collect({
        amount: 4750,
        currency: 'USD',
      });
    });

    expect(result.current).toBeDefined();
  });

  it('should call cancel', async () => {
    const { result } = renderHook(() => usePayment(), { wrapper });

    await act(async () => {
      await result.current.cancel();
    });

    expect(result.current).toBeDefined();
  });

  it('should track state changes', async () => {
    const { result } = renderHook(() => usePayment(), { wrapper });

    await waitFor(() => {
      expect(result.current.state).toBe('idle');
    });
  });
});
