import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Button } from "./button";

const quantitySelectorVariants = cva(
  "inline-flex items-center gap-2",
  {
    variants: {
      size: {
        sm: "gap-1",
        md: "gap-2",
        lg: "gap-3",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const valueVariants = cva(
  "font-mono font-semibold text-center min-w-[3ch] tabular-nums",
  {
    variants: {
      size: {
        sm: "text-sm min-w-[2.5ch]",
        md: "text-base min-w-[3ch]",
        lg: "text-lg min-w-[4ch]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface QuantitySelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof quantitySelectorVariants> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const QuantitySelector = React.forwardRef<HTMLDivElement, QuantitySelectorProps>(
  ({ className, value, onChange, min = 0, max = 99, size, disabled = false, ...props }, ref) => {
    const handleDecrement = () => {
      if (value > min) {
        onChange(value - 1);
      }
    };

    const handleIncrement = () => {
      if (value < max) {
        onChange(value + 1);
      }
    };

    const isAtMin = value <= min;
    const isAtMax = value >= max;

    return (
      <div
        ref={ref}
        className={cn(quantitySelectorVariants({ size, className }))}
        role="group"
        aria-label="Quantity selector"
        {...props}
      >
        <Button
          type="button"
          variant="outline"
          size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
          onClick={handleDecrement}
          disabled={disabled || isAtMin}
          aria-label="Decrease quantity"
          className={cn(
            size === "sm" && "h-8 w-8 p-0",
            size === "md" && "h-10 w-10 p-0",
            size === "lg" && "h-12 w-12 p-0"
          )}
        >
          <span aria-hidden="true">−</span>
        </Button>

        <span
          className={cn(valueVariants({ size }))}
          role="status"
          aria-live="polite"
          aria-label={`Quantity: ${value}`}
        >
          {value}
        </span>

        <Button
          type="button"
          variant="outline"
          size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
          onClick={handleIncrement}
          disabled={disabled || isAtMax}
          aria-label="Increase quantity"
          className={cn(
            size === "sm" && "h-8 w-8 p-0",
            size === "md" && "h-10 w-10 p-0",
            size === "lg" && "h-12 w-12 p-0"
          )}
        >
          <span aria-hidden="true">+</span>
        </Button>
      </div>
    );
  }
);
QuantitySelector.displayName = "QuantitySelector";

export { QuantitySelector };
