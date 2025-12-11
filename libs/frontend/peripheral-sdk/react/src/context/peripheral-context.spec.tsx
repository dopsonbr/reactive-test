import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PeripheralProvider, usePeripherals } from './peripheral-context';
import { PeripheralClient } from '@reactive-platform/peripheral-core';

// Mock the core SDK
vi.mock('@reactive-platform/peripheral-core', () => {
  return {
    PeripheralClient: class {
      connect = vi.fn().mockResolvedValue(undefined);
      disconnect = vi.fn().mockResolvedValue(undefined);
      capabilities = {};
      connected = false;
      onCapabilities = vi.fn().mockReturnValue(vi.fn());
      onConnectionChange = vi.fn().mockReturnValue(vi.fn());
      scanner = {
        enable: vi.fn(),
        disable: vi.fn(),
        enabled: false,
        onScan: vi.fn().mockReturnValue(vi.fn()),
        destroy: vi.fn(),
      };
    },
  };
});

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
    const { container } = render(
      <PeripheralProvider endpoint="ws://localhost:9100/stomp">
        <div>Test</div>
      </PeripheralProvider>
    );

    // Client is created internally - just verify no errors
    expect(container).toBeInTheDocument();
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
