import { useState, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  Button,
  Input,
  cn,
} from '@reactive-platform/shared-ui-components';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export function QuantityInput({
  value,
  onChange,
  min = 0,
  max = 999,
  disabled = false,
  size = 'default',
  className,
}: QuantityInputProps) {
  const [localValue, setLocalValue] = useState(value.toString());

  const handleIncrement = useCallback(() => {
    const newValue = Math.min(value + 1, max);
    onChange(newValue);
    setLocalValue(newValue.toString());
  }, [value, max, onChange]);

  const handleDecrement = useCallback(() => {
    const newValue = Math.max(value - 1, min);
    onChange(newValue);
    setLocalValue(newValue.toString());
  }, [value, min, onChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setLocalValue(inputValue);

      const numValue = parseInt(inputValue, 10);
      if (!isNaN(numValue) && numValue >= min && numValue <= max) {
        onChange(numValue);
      }
    },
    [min, max, onChange]
  );

  const handleBlur = useCallback(() => {
    const numValue = parseInt(localValue, 10);
    if (isNaN(numValue) || numValue < min) {
      setLocalValue(min.toString());
      onChange(min);
    } else if (numValue > max) {
      setLocalValue(max.toString());
      onChange(max);
    } else {
      setLocalValue(numValue.toString());
      onChange(numValue);
    }
  }, [localValue, min, max, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      }
    },
    [handleIncrement, handleDecrement]
  );

  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const inputSize = size === 'sm' ? 'h-7 w-10 text-sm' : 'h-8 w-12';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={buttonSize}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3 w-3" />
        <span className="sr-only">Decrease quantity</span>
      </Button>

      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'text-center font-mono p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          inputSize
        )}
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        className={buttonSize}
        onClick={handleIncrement}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3 w-3" />
        <span className="sr-only">Increase quantity</span>
      </Button>
    </div>
  );
}
