import { ScanEvent, BarcodeSymbology } from '@reactive-platform/peripheral-core';

/**
 * State for mock scanner
 */
export interface MockScannerState {
  enabled: boolean;
  scanQueue: ScanEvent[];
}

/**
 * Options for triggering a scan
 */
export interface TriggerScanOptions {
  barcode?: string;
  symbology?: BarcodeSymbology;
}

// Global mock state
let mockState: MockScannerState = {
  enabled: true,
  scanQueue: [],
};

// Event listeners
const scanListeners: Set<(event: ScanEvent) => void> = new Set();

/**
 * Trigger a mock scan event
 */
export function triggerScan(options: TriggerScanOptions = {}): ScanEvent {
  const event: ScanEvent = {
    barcode: options.barcode ?? '0012345678905',
    symbology: options.symbology ?? 'ean13',
    timestamp: new Date().toISOString(),
  };

  if (mockState.enabled) {
    scanListeners.forEach((listener) => listener(event));
  }

  return event;
}

/**
 * Enable mock scanner
 */
export function enableMockScanner(): void {
  mockState.enabled = true;
}

/**
 * Disable mock scanner
 */
export function disableMockScanner(): void {
  mockState.enabled = false;
}

/**
 * Register a scan event listener (for internal use)
 */
export function onMockScan(listener: (event: ScanEvent) => void): () => void {
  scanListeners.add(listener);
  return () => scanListeners.delete(listener);
}

/**
 * Reset mock scanner state
 */
export function resetMockScanner(): void {
  mockState = {
    enabled: true,
    scanQueue: [],
  };
  scanListeners.clear();
}

/**
 * Get current mock scanner state
 */
export function getMockScannerState(): MockScannerState {
  return { ...mockState };
}
