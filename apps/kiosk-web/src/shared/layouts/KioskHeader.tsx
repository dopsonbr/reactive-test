import { ShoppingCart, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useKioskSession } from '../../features/session';
import { Button } from '@reactive-platform/shared-ui/ui-components';

export function KioskHeader() {
  const navigate = useNavigate();
  const { storeNumber, transactionState, cartId, resetTransaction } = useKioskSession();

  const handleCancel = () => {
    if (confirm('Cancel your transaction and return to the start screen?')) {
      resetTransaction();
      navigate({ to: '/' });
    }
  };

  const showCancelButton = transactionState === 'active' || transactionState === 'checkout';

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="h-20 px-6 flex items-center justify-between">
        {/* Store branding */}
        <div className="flex items-center gap-4">
          <h1 className="text-kiosk-xl font-bold">Store #{storeNumber}</h1>
          <span className="text-kiosk-sm opacity-80">Self-Checkout</span>
        </div>

        {/* Transaction info and actions */}
        <div className="flex items-center gap-6">
          {cartId && (
            <button
              onClick={() => navigate({ to: '/cart' })}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="text-kiosk-base font-medium">View Cart</span>
            </button>
          )}

          {showCancelButton && (
            <Button
              variant="destructive"
              size="lg"
              onClick={handleCancel}
              className="h-14 gap-2"
            >
              <X className="w-5 h-5" />
              <span className="text-kiosk-base">Cancel</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
