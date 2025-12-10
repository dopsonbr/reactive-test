import { ShoppingCart } from 'lucide-react';
import { Button } from '@reactive-platform/shared-ui/ui-components';

export interface EmptyCartScreenProps {
  onStartShopping: () => void;
  onCancelTransaction?: () => void;
}

/**
 * Full-screen empty cart state for kiosk
 * Shows when cart has no items
 */
export function EmptyCartScreen({
  onStartShopping,
  onCancelTransaction,
}: EmptyCartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] px-8 text-center">
      <div className="mb-8 rounded-full bg-muted p-12">
        <ShoppingCart className="h-24 w-24 text-muted-foreground" strokeWidth={1.5} />
      </div>

      <h2 className="mb-4 text-4xl font-bold">Your cart is empty</h2>
      <p className="mb-12 text-xl text-muted-foreground max-w-md">
        Scan items to add them to your cart and start shopping
      </p>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <Button
          size="xl"
          onClick={onStartShopping}
          className="h-20 text-2xl"
        >
          Start Scanning
        </Button>

        {onCancelTransaction && (
          <Button
            variant="outline"
            size="lg"
            onClick={onCancelTransaction}
            className="h-16 text-xl"
          >
            Cancel Transaction
          </Button>
        )}
      </div>
    </div>
  );
}
