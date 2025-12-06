import { Link } from '@tanstack/react-router';
import { Button, Card, CardContent, CardFooter, CardHeader } from '@reactive-platform/shared-ui-components';
import type { Cart } from '../types';

interface CartSummaryProps {
  cart: Cart;
}

export function CartSummary({ cart }: CartSummaryProps) {
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Order Summary</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span>${cart.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated Tax</span>
          <span>${cart.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-green-600">Free</span>
        </div>
        <hr />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span data-testid="cart-total">${cart.total.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full" size="lg" disabled={cart.items.length === 0}>
          Proceed to Checkout
        </Button>
        <Link to="/" className="w-full">
          <Button variant="outline" className="w-full">
            Continue Shopping
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
