import { useCart } from '@reactive-platform/commerce-hooks';
import { formatCurrency } from '@reactive-platform/shared-ui/ui-components';

/**
 * Compact cart preview for the scan page
 *
 * Shows:
 * - Item count
 * - Running total
 * - Last 2-3 items added (thumbnails)
 */
export function CartMiniPreview() {
  const { data: cart, isLoading } = useCart();

  if (isLoading) {
    return (
      <div className="bg-background-secondary rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-background-tertiary rounded mb-2" />
          <div className="h-6 bg-background-tertiary rounded" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-background-secondary rounded-lg p-6 text-center">
        <p className="text-secondary text-xl">Your cart is empty</p>
        <p className="text-secondary text-sm mt-2">
          Start scanning items to add them
        </p>
      </div>
    );
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.subtotal ?? 0;

  // Get last 3 items (most recently added)
  const recentItems = cart.items.slice(-3).reverse();

  return (
    <div className="bg-background-secondary rounded-lg p-6">
      {/* Header with count and total */}
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <p className="text-secondary text-lg">Cart</p>
          <p className="text-foreground text-2xl font-bold">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-secondary text-lg">Total</p>
          <p className="text-primary text-3xl font-bold">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      {/* Recent items preview */}
      {recentItems.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-secondary text-sm mb-3">Recently added:</p>
          <div className="space-y-2">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-background rounded p-2"
              >
                {/* Thumbnail placeholder - in real implementation would show product image */}
                <div className="w-12 h-12 bg-background-tertiary rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📦</span>
                </div>

                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate text-sm">
                    {item.name}
                  </p>
                  <p className="text-secondary text-xs">
                    Qty: {item.quantity}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="text-foreground font-medium text-sm">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
