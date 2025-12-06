import { useProducts } from '../api/useProducts';
import { useAddToCart } from '../../cart/api/useCart';
import { ProductCard } from './ProductCard';
import { ProductListSkeleton } from './ProductListSkeleton';
import { ErrorCard } from '../../../shared/components/ErrorCard';
import { EmptyState } from '../../../shared/components/EmptyState';

interface ProductListProps {
  category?: string;
  query?: string;
}

export function ProductList({ category, query }: ProductListProps) {
  const { data, isLoading, isError, error, refetch } = useProducts({ category, query });
  const addToCart = useAddToCart();

  if (isLoading) {
    return <ProductListSkeleton />;
  }

  if (isError) {
    return <ErrorCard error={error} onRetry={() => refetch()} />;
  }

  if (!data?.products?.length) {
    return (
      <EmptyState
        message={query || category ? 'No products match your search' : 'No products found'}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.products.map((product) => (
        <ProductCard
          key={product.sku}
          product={product}
          onAddToCart={(sku) => addToCart.mutate({ sku, quantity: 1 })}
          isAddingToCart={addToCart.isPending && addToCart.variables?.sku === product.sku}
        />
      ))}
    </div>
  );
}
