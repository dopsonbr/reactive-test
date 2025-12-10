import { useState, useMemo } from 'react';
import { useProducts } from '@reactive-platform/commerce-hooks';
import type { Product } from '@reactive-platform/commerce-hooks';
import { Button } from '@reactive-platform/shared-ui/ui-components';
import { Search, ShoppingCart } from 'lucide-react';

export interface ProductSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  headers?: Record<string, string>;
}

/**
 * Full-screen dialog for searching and selecting products
 *
 * Features:
 * - Text search input with live filtering
 * - Product grid with images, names, and prices
 * - Touch-friendly large product cards
 * - Add to cart action
 */
export function ProductSearchDialog({
  isOpen,
  onClose,
  onSelectProduct,
  headers,
}: ProductSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products with search query
  const { data: searchResult, isLoading, error } = useProducts({
    params: { query: searchQuery, limit: 50 },
    headers,
    enabled: isOpen,
  });

  // Get products array from result
  const products = useMemo(() => {
    return searchResult?.products || [];
  }, [searchResult]);

  if (!isOpen) {
    return null;
  }

  const handleProductSelect = (product: Product) => {
    if (product.inStock) {
      onSelectProduct(product);
      setSearchQuery('');
      onClose();
    }
  };

  const handleCancel = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-background w-full h-full max-w-6xl max-h-screen p-8 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-4xl font-bold text-foreground mb-2">
            Search Products
          </h2>
          <p className="text-secondary text-xl">
            Search for produce, bulk items, or any product without a barcode
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, description, or SKU..."
              className="w-full pl-14 pr-4 py-6 text-2xl rounded-lg border-2 border-border bg-background-secondary text-foreground placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto mb-6">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-2xl text-secondary">Loading products...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-2xl text-destructive">
                Error loading products. Please try again.
              </p>
            </div>
          )}

          {!isLoading && !error && products.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-2xl text-secondary">
                {searchQuery
                  ? 'No products found. Try a different search term.'
                  : 'Start typing to search for products.'}
              </p>
            </div>
          )}

          {!isLoading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <button
                  key={product.sku}
                  onClick={() => handleProductSelect(product)}
                  disabled={!product.inStock}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${
                      product.inStock
                        ? 'border-border bg-background-secondary hover:border-primary hover:shadow-lg active:scale-95'
                        : 'border-border bg-background-secondary/50 opacity-60 cursor-not-allowed'
                    }
                  `}
                >
                  {/* Product Image */}
                  <div className="mb-3 aspect-square rounded-lg bg-background-tertiary flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingCart className="h-12 w-12 text-secondary" />
                    )}
                  </div>

                  {/* Product Name */}
                  <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Product Category */}
                  <p className="text-sm text-secondary mb-2">
                    {product.category}
                  </p>

                  {/* Product Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-secondary line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  {!product.inStock && (
                    <p className="mt-2 text-sm font-semibold text-destructive">
                      Out of Stock
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="kiosk"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
