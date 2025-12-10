import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useOrder } from '@reactive-platform/commerce-hooks';
import { Button, Spinner, Alert } from '@reactive-platform/shared-ui/ui-components';
import { useKioskSession } from '../../session';
import { ReceiptOptions } from '../components/ReceiptOptions';
import { logger } from '../../../shared/utils/logger';

const AUTO_RESET_DELAY = 30000; // 30 seconds

export function ConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetTransaction } = useKioskSession();
  const [timeRemaining, setTimeRemaining] = useState(AUTO_RESET_DELAY / 1000);

  // Extract orderId from location state
  const orderId = (location.state as { orderId?: string })?.orderId;

  const { data: order, isLoading, isError } = useOrder(orderId || '');

  // Auto-reset timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDone = () => {
    logger.info('Completing transaction and returning to start');
    resetTransaction();
    navigate({ to: '/' });
  };

  // Redirect if no order ID
  useEffect(() => {
    if (!orderId) {
      logger.warn('No order ID found, redirecting to start');
      navigate({ to: '/' });
    }
  }, [orderId, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <Alert variant="error" title="Unable to Load Order">
          Could not retrieve order details. Please see a store associate for assistance.
        </Alert>
        <Button onClick={handleDone} size="lg" className="w-full">
          Return to Start
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/10">
            <span className="text-6xl">✓</span>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-success">Payment Successful!</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Thank you for your purchase
        </p>
      </div>

      {/* Order Number */}
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">Order Number</p>
        <p className="mt-2 text-3xl font-bold tracking-wide">{order.orderId}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {new Date(order.orderDate).toLocaleString()}
        </p>
      </div>

      {/* Receipt Options */}
      <ReceiptOptions orderId={order.orderId} />

      {/* Done Button */}
      <div className="space-y-4 border-t pt-6">
        <Button onClick={handleDone} size="lg" className="w-full text-lg">
          Done - Start New Transaction
        </Button>

        {/* Auto-reset countdown */}
        <p className="text-center text-sm text-muted-foreground">
          Returning to start screen in {timeRemaining} seconds
        </p>
      </div>
    </div>
  );
}
