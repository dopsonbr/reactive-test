import { useKioskSession } from '../context/KioskSessionContext';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';
import { Button } from '@reactive-platform/shared-ui/ui-components';

export function TimeoutWarningDialog() {
  const { updateActivity } = useKioskSession();
  const { showWarning, timeRemaining, dismissWarning } = useInactivityTimeout();

  if (!showWarning) {
    return null;
  }

  const handleContinue = () => {
    updateActivity();
    dismissWarning();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timeout-warning-title"
    >
      <div className="bg-card rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
        <h2
          id="timeout-warning-title"
          className="text-kiosk-xl font-bold text-destructive mb-4"
        >
          Are you still there?
        </h2>
        <p className="text-kiosk-base mb-6">
          Your session will expire in{' '}
          <span className="font-bold text-destructive">{timeRemaining} seconds</span>{' '}
          due to inactivity.
        </p>
        <Button
          size="lg"
          onClick={handleContinue}
          className="w-full h-touch-lg text-kiosk-lg"
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
