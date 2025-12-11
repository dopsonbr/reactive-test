import { useNavigate } from '@tanstack/react-router';
import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
  type CartScope,
} from '@reactive-platform/commerce-hooks';
import { CartSummary } from '@reactive-platform/commerce-ui';
import {
  Button,
  Spinner,
  Alert,
} from '@reactive-platform/shared-ui/ui-components';
import { useKioskSession } from '../../session';
import { KioskCartItem } from '../components/KioskCartItem';
import { EmptyCartScreen } from '../components/EmptyCartScreen';

/**
 * Cart review page for kiosk
 * Shows cart items with quantity controls and summary
 */
export function CartPage() {
  const navigate = useNavigate();
  const session = useKioskSession();

  // Build cart scope from session
  // x-order-number is required by cart-service (UUID format)
  const orderNumber = session.transactionId || '';
  const cartScope: CartScope = {
    cartId: session.cartId || '',
    headers: {
      'x-store-number': session.storeNumber.toString(),
      'x-sessionid': orderNumber,
      'x-userid': session.serviceAccountId,
      'x-order-number': orderNumber,
    },
  };

  // Fetch cart data
  const {
    data: cart,
    isLoading,
    error,
  } = useCart(cartScope, {
    enabled: Boolean(session.cartId),
  });

  // Mutations
  const updateCartItem = useUpdateCartItem(cartScope);
  const removeFromCart = useRemoveFromCart(cartScope);

  const handleUpdateQuantity = (sku: string, quantity: number) => {
    updateCartItem.mutate({ sku, quantity });
  };

  const handleRemoveItem = (sku: string) => {
    removeFromCart.mutate(sku);
  };

  const handleContinueShopping = () => {
    navigate({ to: '/scan' });
  };

  const handleContinueToLoyalty = () => {
    navigate({ to: '/loyalty' });
  };

  const handleCancelTransaction = () => {
    session.resetTransaction();
    navigate({ to: '/' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px]">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-xl text-muted-foreground">Loading cart...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] px-8">
        <Alert variant="destructive" className="max-w-2xl">
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold mb-2">Error Loading Cart</h2>
            <p className="text-lg mb-6">
              {error instanceof Error ? error.message : 'Failed to load cart'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={handleCancelTransaction}
              >
                Cancel Transaction
              </Button>
              <Button
                size="lg"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // Empty cart state
  if (!cart || cart.products.length === 0) {
    return (
      <EmptyCartScreen
        onStartShopping={handleContinueShopping}
        onCancelTransaction={handleCancelTransaction}
      />
    );
  }

  // Calculate item count from products
  const itemCount = cart.products.reduce((sum, p) => sum + p.quantity, 0);

  // Cart with items
  return (
    <div className="flex h-full gap-8 p-8">
      {/* Left side: Scrollable cart items */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Review Your Cart</h1>
          <p className="text-xl text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
          </p>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-lg bg-card">
          {cart.products.map((item) => (
            <KioskCartItem
              key={item.sku}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
              isUpdating={
                updateCartItem.isPending ||
                removeFromCart.isPending
              }
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            size="xl"
            onClick={handleContinueShopping}
            className="flex-1 h-16 text-xl"
          >
            Continue Scanning
          </Button>
        </div>
      </div>

      {/* Right side: Cart summary */}
      <div className="w-[400px] flex-shrink-0">
        <CartSummary
          subtotal={cart.totals.subtotal}
          tax={cart.totals.taxTotal}
          total={cart.totals.grandTotal}
          showCheckoutButton
          onCheckout={handleContinueToLoyalty}
          checkoutLabel="Continue to Loyalty"
          className="sticky top-0"
        />
      </div>
    </div>
  );
}
