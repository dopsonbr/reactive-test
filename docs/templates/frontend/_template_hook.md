# Custom Hook Template

## Usage

For extracting reusable logic from components.

## Structure

```typescript
// hooks/use{HookName}.ts
import { useState, useCallback, useEffect } from 'react';

interface Use{HookName}Options {
  initialValue?: string;
  onSuccess?: (result: Result) => void;
  onError?: (error: Error) => void;
}

interface Use{HookName}Return {
  value: string;
  isLoading: boolean;
  error: Error | null;
  execute: (input: Input) => Promise<void>;
  reset: () => void;
}

export function use{HookName}(
  options: Use{HookName}Options = {}
): Use{HookName}Return {
  const { initialValue = '', onSuccess, onError } = options;

  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (input: Input) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await doSomething(input);
        setValue(result);
        onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
  }, [initialValue]);

  return { value, isLoading, error, execute, reset };
}
```

## Hook with Cleanup

```typescript
// hooks/useEventListener.ts
import { useEffect, useRef } from 'react';

export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement | null = window
) {
  const savedHandler = useRef(handler);

  // Update ref when handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const eventListener = (event: WindowEventMap[K]) => {
      savedHandler.current(event);
    };

    element.addEventListener(eventName, eventListener as EventListener);

    // Cleanup on unmount
    return () => {
      element.removeEventListener(eventName, eventListener as EventListener);
    };
  }, [eventName, element]);
}
```

## Hook with Debounce

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

## Rules

1. **Return object with named properties** (not tuple) for clarity
2. **Include cleanup** in useEffect hooks to prevent memory leaks
3. **Memoize callbacks** with useCallback to prevent unnecessary re-renders
4. **Accept options object** for configurability
5. **Use refs for mutable values** that shouldn't trigger re-renders
6. **Handle errors gracefully** and expose error state

## Co-located Files

```
hooks/
├── use{HookName}.ts
└── use{HookName}.test.ts  # Required
```

## Testing Pattern

```typescript
// use{HookName}.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { use{HookName} } from './use{HookName}';

describe('use{HookName}', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() =>
      use{HookName}({ initialValue: 'test' })
    );

    expect(result.current.value).toBe('test');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles execute correctly', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      use{HookName}({ onSuccess })
    );

    await act(async () => {
      await result.current.execute({ input: 'data' });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('handles errors', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      use{HookName}({ onError })
    );

    await act(async () => {
      await result.current.execute({ input: 'invalid' });
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(onError).toHaveBeenCalled();
  });

  it('resets state', () => {
    const { result } = renderHook(() =>
      use{HookName}({ initialValue: 'initial' })
    );

    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toBe('initial');
    expect(result.current.error).toBeNull();
  });
});
```
