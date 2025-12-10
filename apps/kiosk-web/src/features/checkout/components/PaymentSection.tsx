import { useState } from 'react';
import { Button, Spinner, Alert, PriceDisplay } from '@reactive-platform/shared-ui/ui-components';

export interface PaymentDetails {
  method: 'card';
  // For MVP: Simulated payment, no actual card details needed
}

export interface PaymentSectionProps {
  total: number;
  onPayment: (details: PaymentDetails) => void;
  isProcessing: boolean;
  isCheckoutLoading?: boolean;
  error?: string;
}

export function PaymentSection({
  total,
  onPayment,
  isProcessing,
  isCheckoutLoading = false,
  error,
}: PaymentSectionProps) {
  const [isSimulating, setIsSimulating] = useState(false);

  const handlePayment = async () => {
    setIsSimulating(true);

    // Simulate card processing delay (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSimulating(false);
    onPayment({ method: 'card' });
  };

  const showSpinner = isProcessing || isSimulating;
  const isDisabled = showSpinner || isCheckoutLoading;

  return (
    <div className="sticky top-6 space-y-6 rounded-lg border bg-card p-6 shadow-lg">
      {/* Total Display */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Amount Due</p>
        <div className="rounded-lg bg-primary/5 p-4 text-center">
          <PriceDisplay
            price={total}
            className="text-4xl font-bold text-primary"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="error" title="Payment Failed">
          {error}
        </Alert>
      )}

      {/* Payment Instructions */}
      <div className="space-y-3 border-t pt-4">
        <p className="text-sm font-medium">Payment Instructions</p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>1. Tap the button below to begin</p>
          <p>2. Insert or tap your card when prompted</p>
          <p>3. Follow on-screen instructions</p>
        </div>
      </div>

      {/* Payment Button */}
      <Button
        onClick={handlePayment}
        disabled={isDisabled}
        size="lg"
        className="w-full text-lg"
      >
        {isCheckoutLoading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            Loading Checkout...
          </span>
        ) : showSpinner ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            Processing Payment...
          </span>
        ) : (
          'Pay with Card'
        )}
      </Button>

      {/* MVP Notice */}
      <p className="text-center text-xs text-muted-foreground">
        MVP: Payment is simulated for testing
      </p>
    </div>
  );
}
