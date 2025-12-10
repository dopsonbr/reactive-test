import { useNavigate } from '@tanstack/react-router';
import { useKioskSession } from '../../session';
import { IdleScreen } from '../components/IdleScreen';
import { Button } from '@reactive-platform/shared-ui/ui-components';
import { ShoppingCart } from 'lucide-react';

export function StartPage() {
  const navigate = useNavigate();
  const { startTransaction, storeNumber } = useKioskSession();

  const handleStart = () => {
    startTransaction();
    navigate({ to: '/scan' });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-gradient-to-b from-background to-muted p-8">
      {/* Store branding */}
      <div className="mb-12 text-center">
        <h1 className="text-kiosk-2xl font-bold text-primary mb-2">
          Welcome to Store #{storeNumber}
        </h1>
        <p className="text-kiosk-lg text-muted-foreground">
          Self-Checkout Kiosk
        </p>
      </div>

      {/* Main CTA */}
      <div className="mb-16">
        <Button
          size="lg"
          onClick={handleStart}
          className="h-touch-lg px-16 text-kiosk-xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
        >
          <ShoppingCart className="w-8 h-8 mr-4" />
          Touch to Start
        </Button>
      </div>

      {/* Idle promotional content */}
      <IdleScreen />

      {/* Footer message */}
      <div className="mt-auto pt-12 text-center text-muted-foreground">
        <p className="text-kiosk-sm">
          Need assistance? Touch the Help button at any time
        </p>
      </div>
    </div>
  );
}
