import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Button,
  QuantitySelector,
  PriceDisplay,
  Badge,
  cn,
} from "@reactive-platform/shared-ui/ui-components";
import type { CartItem } from "../../types";

const rowVariants = cva(
  "flex items-center gap-4 p-4 border-b border-border",
  {
    variants: {
      size: {
        compact: "gap-2 p-2",
        default: "gap-4 p-4",
        large: "gap-6 p-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const imageVariants = cva(
  "rounded-md object-cover flex-shrink-0",
  {
    variants: {
      size: {
        compact: "w-16 h-16",
        default: "w-20 h-20",
        large: "w-24 h-24",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface CartItemRowProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof rowVariants> {
  item: CartItem;
  onUpdateQuantity: (sku: string, quantity: number) => void;
  onRemove: (sku: string) => void;
  showImage?: boolean;
}

const CartItemRow = React.forwardRef<HTMLDivElement, CartItemRowProps>(
  (
    {
      className,
      item,
      onUpdateQuantity,
      onRemove,
      showImage = true,
      size,
      ...props
    },
    ref
  ) => {
    const handleQuantityChange = (newQuantity: number) => {
      onUpdateQuantity(item.sku, newQuantity);
    };

    const handleRemove = () => {
      onRemove(item.sku);
    };

    const hasDiscount = item.appliedDiscounts && item.appliedDiscounts.length > 0;
    const priceSize = size === "compact" ? "sm" : size === "large" ? "lg" : "md";

    return (
      <div
        ref={ref}
        className={cn(rowVariants({ size }), className)}
        {...props}
      >
        {showImage && item.product.imageUrl && (
          <img
            src={item.product.imageUrl}
            alt={item.product.name}
            className={cn(imageVariants({ size }))}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-semibold truncate",
                  size === "compact" ? "text-sm" : size === "large" ? "text-lg" : "text-base"
                )}
              >
                {item.product.name}
              </h3>
              {item.product.description && size !== "compact" && (
                <p
                  className={cn(
                    "text-muted-foreground truncate",
                    size === "large" ? "text-sm" : "text-xs"
                  )}
                >
                  {item.product.description}
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size={size === "compact" ? "sm" : "default"}
              onClick={handleRemove}
              aria-label={`Remove ${item.product.name} from cart`}
              className={cn(size === "compact" && "h-8 w-8 p-0")}
            >
              <span aria-hidden="true">×</span>
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <QuantitySelector
                value={item.quantity}
                onChange={handleQuantityChange}
                min={1}
                max={item.product.stockLevel || 99}
                size={size === "compact" ? "sm" : size === "large" ? "lg" : "md"}
              />

              <div className="flex flex-col gap-1">
                <PriceDisplay
                  price={item.product.finalPrice}
                  originalPrice={
                    item.product.finalPrice < item.product.basePrice
                      ? item.product.basePrice
                      : undefined
                  }
                  size={priceSize}
                />
                {size !== "compact" && (
                  <span
                    className={cn(
                      "text-xs text-muted-foreground",
                      size === "large" && "text-sm"
                    )}
                  >
                    per item
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <PriceDisplay
                price={item.lineTotal}
                size={priceSize}
              />
              {hasDiscount && size !== "compact" && (
                <div className="flex flex-wrap gap-1 justify-end">
                  {item.appliedDiscounts!.map((discount, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={cn(size === "large" ? "text-sm" : "text-xs")}
                    >
                      {discount.type}: -${discount.amount.toFixed(2)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
CartItemRow.displayName = "CartItemRow";

export { CartItemRow };
