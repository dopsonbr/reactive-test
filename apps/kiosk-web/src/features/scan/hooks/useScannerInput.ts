import { useEffect, useRef, useCallback } from 'react';

export interface ScannerInputOptions {
  onScan: (barcode: string) => void;
  minLength?: number; // Default: 8
  maxLength?: number; // Default: 20
  timeout?: number; // Ms between keystrokes before reset (default: 50)
  enabled?: boolean; // Disable during modals
}

/**
 * Hook to capture barcode scanner input
 *
 * Barcode scanners send keystrokes rapidly ending with Enter.
 * This hook accumulates keystrokes and detects when input is coming from a scanner
 * (rapid keystrokes) vs human typing (slower).
 *
 * @param options - Configuration options for scanner input
 */
export function useScannerInput(options: ScannerInputOptions) {
  const {
    onScan,
    minLength = 8,
    maxLength = 20,
    timeout = 50,
    enabled = true,
  } = options;

  const bufferRef = useRef<string>('');
  const timestampRef = useRef<number>(0);
  const timeoutIdRef = useRef<number | null>(null);

  const resetBuffer = useCallback(() => {
    bufferRef.current = '';
    timestampRef.current = 0;
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const processScan = useCallback(
    (barcode: string) => {
      if (barcode.length >= minLength && barcode.length <= maxLength) {
        onScan(barcode);
      }
      resetBuffer();
    },
    [onScan, minLength, maxLength, resetBuffer]
  );

  useEffect(() => {
    if (!enabled) {
      resetBuffer();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - timestampRef.current;

      // If Enter key is pressed, process accumulated buffer
      if (event.key === 'Enter') {
        event.preventDefault();
        if (bufferRef.current.length > 0) {
          processScan(bufferRef.current);
        }
        return;
      }

      // Ignore non-alphanumeric keys
      if (event.key.length !== 1) {
        return;
      }

      // If too much time has passed, this is likely human typing - reset
      if (timeSinceLastKey > timeout && bufferRef.current.length > 0) {
        resetBuffer();
      }

      // Add character to buffer
      bufferRef.current += event.key;
      timestampRef.current = now;

      // Set timeout to auto-reset if no more keys come
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = window.setTimeout(() => {
        resetBuffer();
      }, timeout * 2);

      // Prevent default to avoid typing in page
      event.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      resetBuffer();
    };
  }, [enabled, timeout, processScan, resetBuffer]);

  return { resetBuffer };
}
