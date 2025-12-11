import { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { SkuInput } from './SkuInput';
import { ProductSearch } from './ProductSearch';
import { useTransaction } from '../../context/TransactionContext';
import type { Product } from '../../types/transaction';
import {
  Button,
  Alert,
  AlertDescription,
} from '@reactive-platform/shared-ui-components';

interface ItemEntryProps {
  onItemAdded?: () => void;
  autoFocus?: boolean;
}

export function ItemEntry({ onItemAdded, autoFocus = true }: ItemEntryProps) {
  const { addItem, addItemWithProduct, isLoading, error, clearError } = useTransaction();
  const [searchOpen, setSearchOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Clear local error after 3 seconds
  useEffect(() => {
    if (localError) {
      const timer = setTimeout(() => setLocalError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [localError]);

  // Handle F3 for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSKUSubmit = async (sku: string) => {
    clearError();
    setLocalError(null);

    try {
      await addItem(sku, 1);
      onItemAdded?.();
    } catch {
      setLocalError(`Failed to add item: ${sku}`);
    }
  };

  const handleSKUError = (sku: string) => {
    setLocalError(`Invalid SKU: ${sku} (minimum 3 characters)`);
  };

  const handleProductSelect = (product: Product, quantity: number) => {
    clearError();
    setLocalError(null);

    // Use addItemWithProduct to pass full product data (follows kiosk-web pattern)
    // This avoids a second API lookup that could return different data
    addItemWithProduct(product, quantity);
    onItemAdded?.();
  };

  const displayError = error || localError;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <SkuInput
          onSubmit={handleSKUSubmit}
          onError={handleSKUError}
          autoFocus={autoFocus}
          isLoading={isLoading}
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={() => setSearchOpen(true)}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            F3
          </kbd>
        </Button>
      </div>

      {displayError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <ProductSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onProductSelect={handleProductSelect}
      />
    </div>
  );
}
