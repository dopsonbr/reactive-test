import { useProduct } from '../api/useProducts';
import { useAddToCart } from '../../cart/api/useCart';
import { Button, Card, CardContent } from '@reactive-platform/shared-ui-components';
import { ErrorCard } from '../../../shared/components/ErrorCard';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Link } from '@tanstack/react-router';

function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square bg-muted rounded-lg" />
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-12 bg-muted rounded w-full mt-8" />
        </div>
      </div>
    </div>
  );
}

interface ProductDetailProps {
  sku: string;
}

export function ProductDetail({ sku }: ProductDetailProps) {
  const { data: product, isLoading, isError, error, refetch } = useProduct(sku);
  const addToCart = useAddToCart();

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (isError || !product) {
    return <ErrorCard error={error} onRetry={() => refetch()} />;
  }

  const handleAddToCart = () => {
    addToCart.mutate({ sku: product.sku, quantity: 1 });
  };

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{product.category}</p>
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">${Number(product.price).toFixed(2)}</span>
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  ${Number(product.originalPrice).toFixed(2)}
                </span>
                <span className="rounded bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                  Save ${(Number(product.originalPrice) - Number(product.price)).toFixed(2)}
                </span>
              </>
            )}
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {product.inStock ? (
                      <span className="text-green-600">In Stock</span>
                    ) : (
                      <span className="text-destructive">Out of Stock</span>
                    )}
                  </p>
                  {product.inStock && (
                    <p className="text-sm text-muted-foreground">
                      {product.quantity} available
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock || addToCart.isPending}
            size="lg"
            className="w-full"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {!product.inStock
              ? 'Out of Stock'
              : addToCart.isPending
                ? 'Adding to Cart...'
                : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
