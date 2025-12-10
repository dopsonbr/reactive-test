import { useState, useEffect, useCallback } from 'react';
import { ScanEvent } from '@reactive-platform/peripheral-core';
import { usePeripherals } from '../context';

/**
 * Return type for useScanner hook
 */
export interface UseScannerReturn {
  /** Enable the scanner */
  enable: () => Promise<void>;
  /** Disable the scanner */
  disable: () => Promise<void>;
  /** Whether scanner is enabled */
  enabled: boolean;
  /** Most recent scan event */
  lastScan: ScanEvent | null;
  /** Whether scanner capability is available */
  available: boolean;
}

/**
 * Hook for scanner operations
 */
export function useScanner(): UseScannerReturn {
  const { scanner, capabilities } = usePeripherals();
  const [enabled, setEnabled] = useState(false);
  const [lastScan, setLastScan] = useState<ScanEvent | null>(null);

  // Subscribe to scan events
  useEffect(() => {
    if (!scanner) return;

    const unsubscribe = scanner.onScan((event) => {
      setLastScan(event);
    });

    return unsubscribe;
  }, [scanner]);

  // Sync enabled state
  useEffect(() => {
    if (scanner) {
      setEnabled(scanner.enabled);
    }
  }, [scanner]);

  const enable = useCallback(async () => {
    if (!scanner) return;
    await scanner.enable();
    setEnabled(true);
  }, [scanner]);

  const disable = useCallback(async () => {
    if (!scanner) return;
    await scanner.disable();
    setEnabled(false);
  }, [scanner]);

  return {
    enable,
    disable,
    enabled,
    lastScan,
    available: capabilities.scanner?.available ?? false,
  };
}
