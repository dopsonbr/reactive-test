import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@reactive-platform/shared-ui/ui-components';
import type { Product } from '@reactive-platform/commerce-hooks';
import { useKioskSession } from '../../session';
import { useScannerInput } from '../hooks/useScannerInput';
import { useProductScan } from '../hooks/useProductScan';
import { ScanFeedback } from '../components/ScanFeedback';
import { ManualSkuDialog } from '../components/ManualSkuDialog';
import { ProductSearchDialog } from '../components/ProductSearchDialog';
import { CartMiniPreview } from '../components/CartMiniPreview';

/**
 * Main scanning page for the kiosk
 *
 * Features:
 * - Automatic barcode scanner input
 * - Manual SKU entry dialog
 * - Product search dialog for items without barcodes
 * - Visual scan feedback
 * - Cart preview with running total
 * - Navigation to cart review
 */
export function ScanPage() {
  const navigate = useNavigate();
  const { cartId, storeNumber, kioskId, transactionId, updateActivity } = useKioskSession();
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Build cart scope for commerce hooks
  // x-userid = kiosk service account (identifies the machine)
  // x-sessionid = kiosk ID (identifies the kiosk)
  // x-order-number = transaction ID (unique per transaction, UUID format)
  const cartScope = useMemo(() => {
    const orderNumber = transactionId || crypto.randomUUID();
    return {
      cartId: cartId || '',
      headers: {
        'x-store-number': String(storeNumber),
        'x-userid': kioskId,
        'x-sessionid': orderNumber,
        'x-order-number': orderNumber,
      },
    };
  }, [cartId, storeNumber, kioskId, transactionId]);

  const { scanAndAdd, isLoading, error, lastScannedProduct } =
    useProductScan(cartScope);

  // Handle barcode scanner input
  const handleScan = useCallback(
    async (barcode: string) => {
      updateActivity();
      try {
        await scanAndAdd(barcode);
      } catch (err) {
        // Error is handled by useProductScan
        console.error('Scan error:', err);
      }
    },
    [scanAndAdd, updateActivity]
  );

  // Setup scanner input hook
  useScannerInput({
    onScan: handleScan,
    enabled: !isManualDialogOpen && !isSearchDialogOpen, // Disable during manual entry or search
  });

  // Handle manual SKU submission
  const handleManualSubmit = useCallback(
    async (sku: string) => {
      updateActivity();
      try {
        await scanAndAdd(sku);
      } catch (err) {
        // Error is handled by useProductScan
        console.error('Manual SKU error:', err);
      }
    },
    [scanAndAdd, updateActivity]
  );

  const handleOpenManualDialog = () => {
    updateActivity();
    setIsManualDialogOpen(true);
  };

  const handleCloseManualDialog = () => {
    updateActivity();
    setIsManualDialogOpen(false);
  };

  const handleOpenSearchDialog = () => {
    updateActivity();
    setIsSearchDialogOpen(true);
  };

  const handleCloseSearchDialog = () => {
    updateActivity();
    setIsSearchDialogOpen(false);
  };

  const handleProductSelect = useCallback(
    async (product: Product) => {
      updateActivity();
      try {
        await scanAndAdd(product.sku);
      } catch (err) {
        // Error is handled by useProductScan
        console.error('Product selection error:', err);
      }
    },
    [scanAndAdd, updateActivity]
  );

  const handleReviewCart = () => {
    updateActivity();
    navigate({ to: '/cart' });
  };

  return (
    <div className="container mx-auto px-6 py-8 h-full flex flex-col gap-6">
      {/* Main scanning area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan feedback - takes 2/3 of space on large screens */}
        <div className="lg:col-span-2 flex items-center justify-center">
          <div className="w-full max-w-3xl">
            <ScanFeedback
              isLoading={isLoading}
              lastScanned={lastScannedProduct}
              error={error}
            />
          </div>
        </div>

        {/* Cart preview - takes 1/3 of space on large screens */}
        <div className="lg:col-span-1">
          <CartMiniPreview />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          size="kiosk"
          onClick={handleOpenManualDialog}
          className="w-full"
        >
          Enter SKU Manually
        </Button>

        <Button
          variant="outline"
          size="kiosk"
          onClick={handleOpenSearchDialog}
          className="w-full"
        >
          Search Products
        </Button>

        <Button
          variant="primary"
          size="kiosk"
          onClick={handleReviewCart}
          className="w-full"
        >
          Review Cart
        </Button>
      </div>

      {/* Manual SKU entry dialog */}
      <ManualSkuDialog
        isOpen={isManualDialogOpen}
        onClose={handleCloseManualDialog}
        onSubmit={handleManualSubmit}
      />

      {/* Product search dialog */}
      <ProductSearchDialog
        isOpen={isSearchDialogOpen}
        onClose={handleCloseSearchDialog}
        onSelectProduct={handleProductSelect}
        headers={cartScope.headers}
      />
    </div>
  );
}
