import type { Product } from '@reactive-platform/commerce-hooks';
import { ScannedItemDisplay } from '@reactive-platform/commerce-ui';
import { Spinner } from '@reactive-platform/shared-ui/ui-components';

export interface ScanFeedbackProps {
  isLoading: boolean;
  lastScanned: Product | null;
  error: Error | null;
}

/**
 * Visual feedback component for scanning operations
 *
 * Shows different states:
 * - Idle: Waiting for scan
 * - Loading: Processing scan
 * - Success: Display scanned product
 * - Error: Show error message
 */
export function ScanFeedback({
  isLoading,
  lastScanned,
  error,
}: ScanFeedbackProps) {
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center kiosk-scan-feedback bg-error-light rounded-lg p-8">
        <div className="text-error text-6xl mb-4">⚠️</div>
        <h2 className="text-error text-3xl font-bold mb-2">Scan Error</h2>
        <p className="text-error-dark text-xl text-center">
          {error.message || 'Unable to scan item'}
        </p>
        <p className="text-secondary text-lg mt-4">Please try again</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center kiosk-scan-feedback bg-primary-light rounded-lg p-8">
        <Spinner size="lg" className="mb-4" />
        <p className="text-primary text-2xl font-medium">Scanning...</p>
      </div>
    );
  }

  // Success state - show last scanned product
  if (lastScanned) {
    return (
      <div className="kiosk-scan-feedback bg-success-light rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-success text-5xl">✓</div>
          <h2 className="text-success text-3xl font-bold">Item Added</h2>
        </div>
        <ScannedItemDisplay product={lastScanned} showPrice />
      </div>
    );
  }

  // Idle state - waiting for scan
  return (
    <div className="flex flex-col items-center justify-center kiosk-scan-feedback bg-background-secondary rounded-lg p-8">
      <div className="text-secondary text-6xl mb-4">📦</div>
      <h2 className="text-foreground text-3xl font-bold mb-2">
        Scan Your Items
      </h2>
      <p className="text-secondary text-xl text-center">
        Use the scanner or enter SKU manually
      </p>
    </div>
  );
}
