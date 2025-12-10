import * as React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  cn,
} from "@reactive-platform/shared-ui/ui-components";
import type { AppliedDiscount } from "../../types";

export interface CartSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  subtotal: number;
  tax: number;
  total: number;
  discounts?: AppliedDiscount[];
  showCheckoutButton?: boolean;
  onCheckout?: () => void;
  checkoutLabel?: string;
}

const CartSummary = React.forwardRef<HTMLDivElement, CartSummaryProps>(
  (
    {
      className,
      subtotal,
      tax,
      total,
      discounts = [],
      showCheckoutButton = true,
      onCheckout,
      checkoutLabel = "Checkout",
      ...props
    },
    ref
  ) => {
    const totalDiscountAmount = discounts.reduce(
      (sum, discount) => sum + discount.amount,
      0
    );

    const formatPrice = (amount: number): string => {
      return `$${amount.toFixed(2)}`;
    };

    return (
      <Card ref={ref} className={cn("w-full", className)} {...props}>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex justify-between text-base">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>

          {discounts.length > 0 && (
            <div className="space-y-2 border-t pt-2">
              <div className="text-sm font-medium text-muted-foreground">Discounts</div>
              {discounts.map((discount, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {discount.type}
                    </Badge>
                    <span className="text-muted-foreground">{discount.description}</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    -{formatPrice(discount.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span className="text-muted-foreground">Total Savings</span>
                <span className="text-green-600">
                  -{formatPrice(totalDiscountAmount)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between text-base border-t pt-2">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-semibold">{formatPrice(tax)}</span>
          </div>

          <div className="flex justify-between text-xl font-bold border-t pt-3">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </CardContent>

        {showCheckoutButton && onCheckout && (
          <CardFooter>
            <Button
              onClick={onCheckout}
              className="w-full"
              size="lg"
            >
              {checkoutLabel}
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }
);
CartSummary.displayName = "CartSummary";

export { CartSummary };
