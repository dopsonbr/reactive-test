import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  PriceDisplay,
  QuantitySelector,
  Badge,
  Button,
  Spinner,
  cn,
} from "@reactive-platform/shared-ui/ui-components";
import type { Product } from "../../types";

const cardVariants = cva("", {
  variants: {
    size: {
      compact: "w-full max-w-[200px]",
      default: "w-full max-w-[280px]",
      large: "w-full max-w-[360px]",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const imageVariants = cva("w-full object-cover rounded-t-lg", {
  variants: {
    size: {
      compact: "h-32",
      default: "h-48",
      large: "h-64",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface ProductCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  product: Product;
  onAddToCart?: (sku: string, quantity: number) => void;
  onNavigate?: (sku: string) => void;
  showQuantitySelector?: boolean;
  isLoading?: boolean;
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      className,
      product,
      onAddToCart,
      onNavigate,
      showQuantitySelector = false,
      size,
      isLoading = false,
      ...props
    },
    ref
  ) => {
    const [quantity, setQuantity] = React.useState(1);

    const handleAddToCart = () => {
      if (onAddToCart && product.inStock) {
        onAddToCart(product.sku, quantity);
      }
    };

    const handleCardClick = () => {
      if (onNavigate) {
        onNavigate(product.sku);
      }
    };

    const hasDiscount = product.finalPrice < product.basePrice;
    const priceSize = size === "compact" ? "sm" : size === "large" ? "lg" : "md";

    if (isLoading) {
      return (
        <Card
          ref={ref}
          className={cn(cardVariants({ size }), "flex items-center justify-center", className)}
          {...props}
        >
          <CardContent className="py-12">
            <Spinner size={size === "compact" ? "sm" : size === "large" ? "lg" : "md"} />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        ref={ref}
        className={cn(cardVariants({ size }), "overflow-hidden", className)}
        {...props}
      >
        {product.imageUrl && (
          <div
            className="cursor-pointer"
            onClick={handleCardClick}
            role={onNavigate ? "button" : undefined}
            tabIndex={onNavigate ? 0 : undefined}
            onKeyDown={(e) => {
              if (onNavigate && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleCardClick();
              }
            }}
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className={cn(imageVariants({ size }))}
            />
          </div>
        )}

        <CardHeader className={cn(size === "compact" && "p-3")}>
          <div className="flex items-start justify-between gap-2">
            <CardTitle
              className={cn(
                "cursor-pointer hover:underline",
                size === "compact" ? "text-sm" : size === "large" ? "text-xl" : "text-base"
              )}
              onClick={handleCardClick}
              role={onNavigate ? "button" : undefined}
              tabIndex={onNavigate ? 0 : undefined}
              onKeyDown={(e) => {
                if (onNavigate && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleCardClick();
                }
              }}
            >
              {product.name}
            </CardTitle>
            {!product.inStock && (
              <Badge variant="destructive" className={cn(size === "compact" && "text-xs")}>
                Out of Stock
              </Badge>
            )}
          </div>

          {product.description && size !== "compact" && (
            <p
              className={cn(
                "text-muted-foreground line-clamp-2",
                size === "large" ? "text-base" : "text-sm"
              )}
            >
              {product.description}
            </p>
          )}
        </CardHeader>

        <CardContent className={cn(size === "compact" && "p-3 pt-0")}>
          <PriceDisplay
            price={product.finalPrice}
            originalPrice={hasDiscount ? product.basePrice : undefined}
            size={priceSize}
          />

          {product.category && size !== "compact" && (
            <Badge variant="outline" className="mt-2">
              {product.category}
            </Badge>
          )}
        </CardContent>

        <CardFooter className={cn("flex flex-col gap-2", size === "compact" && "p-3 pt-0")}>
          {showQuantitySelector && product.inStock && (
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={product.stockLevel || 99}
              size={size === "compact" ? "sm" : size === "large" ? "lg" : "md"}
            />
          )}

          {onAddToCart && (
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock || isLoading}
              className="w-full"
              size={size === "compact" ? "sm" : size === "large" ? "lg" : "default"}
            >
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }
);
ProductCard.displayName = "ProductCard";

export { ProductCard };
