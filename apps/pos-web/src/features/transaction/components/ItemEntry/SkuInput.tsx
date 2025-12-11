import { useEffect } from 'react';
import { Barcode, Loader2 } from 'lucide-react';
import { useSKUInput } from '../../hooks/useSKUInput';
import {
  Input,
  cn,
} from '@reactive-platform/shared-ui-components';

interface SkuInputProps {
  onSubmit: (sku: string) => void;
  onError?: (sku: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function SkuInput({
  onSubmit,
  onError,
  autoFocus = true,
  disabled = false,
  isLoading = false,
  className,
}: SkuInputProps) {
  const {
    value,
    handleChange,
    handleKeyDown,
    isValidating,
    inputRef,
    focus,
  } = useSKUInput({
    onValidSKU: onSubmit,
    onInvalidSKU: onError,
    minLength: 3,
  });

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus) {
      focus();
    }
  }, [autoFocus, focus]);

  // Focus on F2 key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [focus]);

  const showSpinner = isLoading || isValidating;

  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {showSpinner ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Barcode className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Scan or enter SKU..."
        disabled={disabled || showSpinner}
        className="pl-10 font-mono uppercase"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <kbd className="hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
          F2
        </kbd>
      </div>
    </div>
  );
}
