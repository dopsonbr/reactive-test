import { Link } from '@tanstack/react-router';
import { ShoppingCart } from 'lucide-react';
import { Button, Card, CardContent } from '@reactive-platform/shared-ui-components';

export function EmptyCart() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="text-muted-foreground mt-1">
            Looks like you haven't added anything to your cart yet.
          </p>
        </div>
        <Link to="/">
          <Button>Start Shopping</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
