import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from 'react';
import {
  PeripheralClient,
  PeripheralClientOptions,
  Capabilities,
  ScannerService,
} from '@reactive-platform/peripheral-core';

/**
 * Context value for peripheral state
 */
interface PeripheralContextValue {
  /** Whether connected to bridge */
  connected: boolean;
  /** Current device capabilities */
  capabilities: Capabilities;
  /** Scanner service */
  scanner: ScannerService | null;
  /** Underlying client (for advanced usage) */
  client: PeripheralClient | null;
}

const PeripheralContext = createContext<PeripheralContextValue | null>(null);

/**
 * Props for PeripheralProvider
 */
export interface PeripheralProviderProps {
  /** WebSocket endpoint URL */
  endpoint: string;
  /** Client options */
  options?: PeripheralClientOptions;
  /** Children */
  children: ReactNode;
}

/**
 * Provider component for peripheral SDK
 */
export function PeripheralProvider({
  endpoint,
  options = {},
  children,
}: PeripheralProviderProps) {
  const [client, setClient] = useState<PeripheralClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities>({});

  // Initialize client
  useEffect(() => {
    const peripheralClient = new PeripheralClient(endpoint, options);
    setClient(peripheralClient);

    // Set up listeners
    const unsubConnection = peripheralClient.onConnectionChange(setConnected);
    const unsubCapabilities = peripheralClient.onCapabilities(setCapabilities);

    // Connect
    peripheralClient.connect().catch((error) => {
      console.error('Failed to connect to peripheral bridge:', error);
    });

    return () => {
      unsubConnection();
      unsubCapabilities();
      peripheralClient.disconnect();
    };
  }, [endpoint]);

  const value = useMemo<PeripheralContextValue>(
    () => ({
      connected,
      capabilities,
      scanner: client?.scanner ?? null,
      client,
    }),
    [connected, capabilities, client]
  );

  return (
    <PeripheralContext.Provider value={value}>
      {children}
    </PeripheralContext.Provider>
  );
}

/**
 * Hook to access peripheral state
 */
export function usePeripherals(): PeripheralContextValue {
  const context = useContext(PeripheralContext);
  if (!context) {
    throw new Error('usePeripherals must be used within a PeripheralProvider');
  }
  return context;
}
