import { useState } from 'react';
import { Search, Package, Loader2 } from 'lucide-react';
import { useProductSearch } from '../../hooks/useProductLookup';
import type { Product } from '../../types/transaction';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Button,
  Badge,
  cn,
} from '@reactive-platform/shared-ui-components';

interface ProductSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelect: (product: Product, quantity: number) => void;
}

export function ProductSearch({
  open,
  onOpenChange,
  onProductSelect,
}: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState<Record<string, number>>({});

  const { data: products, isLoading } = useProductSearch(query);

  const handleSelect = (product: Product) => {
    const quantity = selectedQuantity[product.sku] || 1;
    onProductSelect(product, quantity);
    setQuery('');
    setSelectedQuantity({});
    onOpenChange(false);
  };

  const updateQuantity = (sku: string, delta: number) => {
    setSelectedQuantity((prev) => ({
      ...prev,
      [sku]: Math.max(1, (prev[sku] || 1) + delta),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Product Search</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by SKU, name, or description..."
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : products && products.length > 0 ? (
              <div className="divide-y">
                {products.map((product) => (
                  <ProductRow
                    key={product.sku}
                    product={product}
                    quantity={selectedQuantity[product.sku] || 1}
                    onQuantityChange={(delta) => updateQuantity(product.sku, delta)}
                    onSelect={() => handleSelect(product)}
                  />
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No products found for "{query}"
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Enter at least 2 characters to search
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProductRowProps {
  product: Product;
  quantity: number;
  onQuantityChange: (delta: number) => void;
  onSelect: () => void;
}

function ProductRow({
  product,
  quantity,
  onQuantityChange,
  onSelect,
}: ProductRowProps) {
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  return (
    <div className="flex items-center gap-4 p-3 hover:bg-muted/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
        <Package className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {product.sku}
          </span>
          {!product.inStock && (
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          )}
        </div>
        <div className="font-medium truncate">{product.name}</div>
        <div className="text-sm text-muted-foreground truncate">
          {product.category}
        </div>
      </div>

      <div className="text-right">
        {hasDiscount ? (
          <>
            <div className="font-medium text-green-600">
              ${product.salePrice?.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground line-through">
              ${product.price.toFixed(2)}
            </div>
          </>
        ) : (
          <div className="font-medium">${product.price.toFixed(2)}</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onQuantityChange(-1)}
          disabled={quantity <= 1}
        >
          -
        </Button>
        <span className="w-8 text-center font-mono">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onQuantityChange(1)}
        >
          +
        </Button>
      </div>

      <Button
        onClick={onSelect}
        disabled={!product.inStock}
        className="min-w-[80px]"
      >
        Add
      </Button>
    </div>
  );
}
