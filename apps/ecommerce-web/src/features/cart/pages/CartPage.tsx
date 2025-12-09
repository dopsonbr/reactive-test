import { useCart, useUpdateCartItem, useRemoveFromCart } from '../api/useCart';
import { CartItemRow } from '../components/CartItemRow';
import { CartSummary } from '../components/CartSummary';
import { EmptyCart } from '../components/EmptyCart';
import { CartSkeleton } from '../components/CartSkeleton';
import { ErrorCard } from '../../../shared/components/ErrorCard';

export function CartPage() {
  const { data: cart, isLoading, isError, error, refetch } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();

  if (isLoading) {
    return <CartSkeleton />;
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorCard error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!cart || cart.products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-4">
          {cart.products.map((item) => (
            <CartItemRow
              key={item.sku}
              item={item}
              onUpdateQuantity={(quantity) =>
                updateItem.mutate({ sku: item.sku, quantity })
              }
              onRemove={() => removeItem.mutate(item.sku)}
              isUpdating={
                (updateItem.isPending && updateItem.variables?.sku === item.sku) ||
                (removeItem.isPending && removeItem.variables === item.sku)
              }
            />
          ))}
        </div>
        <aside className="w-full lg:w-80 shrink-0">
          <CartSummary cart={cart} />
        </aside>
      </div>
    </div>
  );
}
