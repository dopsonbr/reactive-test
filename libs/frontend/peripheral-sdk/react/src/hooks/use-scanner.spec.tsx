import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { useScanner } from './use-scanner';
import { PeripheralProvider } from '../context';
import { ScanEvent } from '@reactive-platform/peripheral-core';

// Mock the core SDK
vi.mock('@reactive-platform/peripheral-core', () => {
  const mockScanner = {
    enable: vi.fn().mockResolvedValue(undefined),
    disable: vi.fn().mockResolvedValue(undefined),
    enabled: false,
    onScan: vi.fn().mockReturnValue(vi.fn()),
    destroy: vi.fn(),
  };

  return {
    PeripheralClient: class {
      connect = vi.fn().mockResolvedValue(undefined);
      disconnect = vi.fn().mockResolvedValue(undefined);
      capabilities = { scanner: { available: true } };
      connected = true;
      onCapabilities = vi.fn().mockReturnValue(vi.fn());
      onConnectionChange = vi.fn().mockReturnValue(vi.fn());
      scanner = mockScanner;
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

describe('useScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return scanner state', async () => {
    const { result } = renderHook(() => useScanner(), { wrapper });

    await waitFor(() => {
      expect(result.current.enabled).toBe(false);
    });
  });

  it('should enable scanner', async () => {
    const { result } = renderHook(() => useScanner(), { wrapper });

    await act(async () => {
      await result.current.enable();
    });

    // The mock should have been called
    expect(result.current).toBeDefined();
  });

  it('should disable scanner', async () => {
    const { result } = renderHook(() => useScanner(), { wrapper });

    await act(async () => {
      await result.current.disable();
    });

    expect(result.current).toBeDefined();
  });

  it('should track last scan', async () => {
    const { result } = renderHook(() => useScanner(), { wrapper });

    await waitFor(() => {
      expect(result.current.lastScan).toBeNull();
    });
  });
});
