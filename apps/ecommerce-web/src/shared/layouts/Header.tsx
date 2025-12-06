import { Link } from '@tanstack/react-router';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@reactive-platform/shared-ui-components';
import { useCart } from '../../features/cart/api/useCart';

export function Header() {
  const { data: cart } = useCart();
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold">
          Reactive Store
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Products
          </Link>

          <Link to="/cart" data-testid="cart-link">
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span
                  data-testid="cart-count"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                >
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
