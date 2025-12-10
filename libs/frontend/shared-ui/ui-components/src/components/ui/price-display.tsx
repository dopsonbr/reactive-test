import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const priceVariants = cva(
  "font-semibold tabular-nums",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-xl",
        xl: "text-3xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const originalPriceVariants = cva(
  "line-through text-muted-foreground tabular-nums",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
        xl: "text-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface PriceDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof priceVariants> {
  price: number;
  originalPrice?: number;
  currency?: string;
  showCents?: boolean;
}

const PriceDisplay = React.forwardRef<HTMLDivElement, PriceDisplayProps>(
  (
    {
      className,
      price,
      originalPrice,
      currency = "USD",
      showCents = true,
      size,
      ...props
    },
    ref
  ) => {
    const formatPrice = (amount: number): string => {
      if (showCents) {
        return amount.toFixed(2);
      }
      return Math.floor(amount).toString();
    };

    const getCurrencySymbol = (curr: string): string => {
      const symbols: Record<string, string> = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        JPY: "¥",
        CAD: "CA$",
        AUD: "A$",
      };
      return symbols[curr] || curr;
    };

    const currencySymbol = getCurrencySymbol(currency);
    const hasDiscount = originalPrice !== undefined && originalPrice > price;

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-baseline gap-2", className)}
        {...props}
      >
        {hasDiscount && (
          <span
            className={cn(originalPriceVariants({ size }))}
            aria-label={`Original price: ${currencySymbol}${formatPrice(originalPrice)}`}
          >
            {currencySymbol}
            {formatPrice(originalPrice)}
          </span>
        )}
        <span
          className={cn(priceVariants({ size }), hasDiscount && "text-destructive")}
          aria-label={`${hasDiscount ? "Sale price" : "Price"}: ${currencySymbol}${formatPrice(price)}`}
        >
          {currencySymbol}
          {formatPrice(price)}
        </span>
      </div>
    );
  }
);
PriceDisplay.displayName = "PriceDisplay";

export { PriceDisplay };
