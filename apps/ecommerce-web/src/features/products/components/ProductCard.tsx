import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardFooter, Button } from '@reactive-platform/shared-ui-components';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (sku: string) => void;
  isAddingToCart?: boolean;
}

export function ProductCard({ product, onAddToCart, isAddingToCart }: ProductCardProps) {
  return (
    <Card data-testid={`product-card-${product.sku}`} className="overflow-hidden">
      <Link to="/products/$sku" params={{ sku: product.sku }}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-48 w-full object-cover transition-transform hover:scale-105"
        />
      </Link>
      <CardContent className="p-4">
        <Link
          to="/products/$sku"
          params={{ sku: product.sku }}
          className="hover:underline"
        >
          <h3 className="font-semibold line-clamp-2">{product.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {product.description}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => onAddToCart(product.sku)}
          disabled={!product.inStock || isAddingToCart}
          className="w-full"
        >
          {!product.inStock
            ? 'Out of Stock'
            : isAddingToCart
              ? 'Adding...'
              : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}
