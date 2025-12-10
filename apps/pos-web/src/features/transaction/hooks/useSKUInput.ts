import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSKUInputOptions {
  onValidSKU: (sku: string) => void;
  onInvalidSKU?: (sku: string) => void;
  debounceMs?: number;
  minLength?: number;
}

interface UseSKUInputResult {
  value: string;
  setValue: (value: string) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isValidating: boolean;
  clear: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  focus: () => void;
}

// Barcode scanner detection: rapid character entry pattern
const BARCODE_THRESHOLD_MS = 50;
const BARCODE_MIN_LENGTH = 6;

export function useSKUInput(options: UseSKUInputOptions): UseSKUInputResult {
  const { onValidSKU, onInvalidSKU, debounceMs = 300, minLength = 3 } = options;

  const [value, setValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyTimeRef = useRef<number>(0);
  const rapidEntryRef = useRef<string>('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const clear = useCallback(() => {
    setValue('');
    rapidEntryRef.current = '';
  }, []);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const submitSKU = useCallback(
    (sku: string) => {
      const trimmedSKU = sku.trim().toUpperCase();
      if (trimmedSKU.length >= minLength) {
        setIsValidating(true);
        onValidSKU(trimmedSKU);
        setIsValidating(false);
        clear();
      } else if (trimmedSKU.length > 0 && onInvalidSKU) {
        onInvalidSKU(trimmedSKU);
      }
    },
    [minLength, onValidSKU, onInvalidSKU, clear]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const now = Date.now();

      // Detect barcode scanner input (rapid character entry)
      if (now - lastKeyTimeRef.current < BARCODE_THRESHOLD_MS) {
        rapidEntryRef.current += newValue.slice(-1);
      } else {
        rapidEntryRef.current = newValue.slice(-1);
      }
      lastKeyTimeRef.current = now;

      setValue(newValue);

      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Auto-submit if rapid entry detected (barcode scanner)
      if (rapidEntryRef.current.length >= BARCODE_MIN_LENGTH) {
        debounceTimerRef.current = setTimeout(() => {
          if (rapidEntryRef.current === newValue) {
            submitSKU(newValue);
          }
        }, 100);
      }
    },
    [submitSKU]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && value.trim()) {
        e.preventDefault();
        submitSKU(value);
      } else if (e.key === 'Escape') {
        clear();
      }
    },
    [value, submitSKU, clear]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    value,
    setValue,
    handleChange,
    handleKeyDown,
    isValidating,
    clear,
    inputRef,
    focus,
  };
}
