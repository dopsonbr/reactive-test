import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@reactive-platform/shared-ui/ui-components';
import { useKioskSession } from '../../session';
import { useScannerInput } from '../hooks/useScannerInput';
import { useProductScan } from '../hooks/useProductScan';
import { ScanFeedback } from '../components/ScanFeedback';
import { ManualSkuDialog } from '../components/ManualSkuDialog';
import { CartMiniPreview } from '../components/CartMiniPreview';

/**
 * Main scanning page for the kiosk
 *
 * Features:
 * - Automatic barcode scanner input
 * - Manual SKU entry dialog
 * - Visual scan feedback
 * - Cart preview with running total
 * - Navigation to cart review
 */
export function ScanPage() {
  const navigate = useNavigate();
  const { updateActivity } = useKioskSession();
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);

  const { scanAndAdd, isLoading, error, lastScannedProduct } =
    useProductScan();

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
    enabled: !isManualDialogOpen, // Disable during manual entry
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          variant="outline"
          size="kiosk"
          onClick={handleOpenManualDialog}
          className="w-full"
        >
          Enter SKU Manually
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
    </div>
  );
}
