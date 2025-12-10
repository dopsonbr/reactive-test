import * as React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  PriceDisplay,
  Badge,
  Spinner,
  Alert,
  cn,
} from "@reactive-platform/shared-ui/ui-components";
import type { Product } from "../../types";

export interface ScannedItemDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  product: Product | null;
  isLoading?: boolean;
  error?: string;
  onAddToCart: () => void;
  onCancel: () => void;
}

const ScannedItemDisplay = React.forwardRef<HTMLDivElement, ScannedItemDisplayProps>(
  (
    {
      className,
      product,
      isLoading = false,
      error,
      onAddToCart,
      onCancel,
      ...props
    },
    ref
  ) => {
    if (isLoading) {
      return (
        <Card
          ref={ref}
          className={cn("w-full max-w-md mx-auto", className)}
          {...props}
        >
          <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <p className="text-muted-foreground">Scanning item...</p>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card
          ref={ref}
          className={cn("w-full max-w-md mx-auto", className)}
          {...props}
        >
          <CardContent className="py-8">
            <Alert variant="destructive">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={onCancel} variant="outline" className="w-full">
              Try Again
            </Button>
          </CardFooter>
        </Card>
      );
    }

    if (!product) {
      return (
        <Card
          ref={ref}
          className={cn("w-full max-w-md mx-auto", className)}
          {...props}
        >
          <CardContent className="py-12 flex flex-col items-center justify-center">
            <p className="text-muted-foreground text-center">
              Scan an item to add it to your cart
            </p>
          </CardContent>
        </Card>
      );
    }

    // Support both API field names: finalPrice/basePrice (commerce-ui) and price/originalPrice (commerce-hooks)
    const currentPrice = product.finalPrice ?? (product as { price?: number }).price ?? 0;
    const originalPrice = product.basePrice ?? (product as { originalPrice?: number }).originalPrice;
    const stockLevel = product.stockLevel ?? (product as { stockQuantity?: number }).stockQuantity;
    const hasDiscount = originalPrice !== undefined && currentPrice < originalPrice;

    return (
      <Card
        ref={ref}
        className={cn("w-full max-w-md mx-auto", className)}
        {...props}
      >
        {product.imageUrl && (
          <div className="w-full h-64 overflow-hidden rounded-t-lg">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-2xl">{product.name}</CardTitle>
            {!product.inStock && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
            {product.inStock && stockLevel && stockLevel < 5 && (
              <Badge variant="secondary">Low Stock</Badge>
            )}
          </div>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <PriceDisplay
            price={currentPrice}
            originalPrice={hasDiscount ? originalPrice : undefined}
            size="xl"
          />

          {product.category && (
            <Badge variant="outline">{product.category}</Badge>
          )}

          {hasDiscount && originalPrice !== undefined && (
            <Alert>
              <p className="font-semibold text-green-600">
                Save ${(originalPrice - currentPrice).toFixed(2)}!
              </p>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            onClick={onAddToCart}
            disabled={!product.inStock}
            className="flex-1"
            size="lg"
          >
            {product.inStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </CardFooter>
      </Card>
    );
  }
);
ScannedItemDisplay.displayName = "ScannedItemDisplay";

export { ScannedItemDisplay };
