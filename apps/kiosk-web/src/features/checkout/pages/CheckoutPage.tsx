import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useInitiateCheckout,
  useCompleteCheckout,
} from '@reactive-platform/commerce-hooks';
import { Alert } from '@reactive-platform/shared-ui/ui-components';
import { useKioskSession } from '../../session';
import { CheckoutOrderSummary } from '../components/CheckoutOrderSummary';
import { AppliedDiscounts } from '../components/AppliedDiscounts';
import { PaymentSection, type PaymentDetails } from '../components/PaymentSection';
import { logger } from '../../../shared/utils/logger';

export function CheckoutPage() {
  const { cartId, customerId, setCheckoutId, completeTransaction } = useKioskSession();
  const navigate = useNavigate();
  const [isPaymentError, setIsPaymentError] = useState(false);

  const initiate = useInitiateCheckout();
  const complete = useCompleteCheckout();

  // Auto-initiate checkout on page load
  useEffect(() => {
    if (!cartId) {
      logger.warn('No cart ID found, redirecting to start');
      navigate({ to: '/' });
      return;
    }

    logger.info('Initiating checkout', { cartId, customerId });

    initiate.mutate(
      {
        cartId,
        customerId: customerId || undefined,
        fulfillmentType: 'IMMEDIATE',
      },
      {
        onSuccess: (summary) => {
          logger.info('Checkout initiated', { checkoutId: summary.checkoutId });
          setCheckoutId(summary.checkoutId);
        },
        onError: (error) => {
          logger.error('Failed to initiate checkout', { error });
        },
      }
    );
  }, [cartId, customerId, initiate, navigate, setCheckoutId]);

  const handlePayment = (details: PaymentDetails) => {
    if (!initiate.data?.checkoutId) {
      logger.error('No checkout ID available for payment');
      setIsPaymentError(true);
      return;
    }

    logger.info('Processing payment', {
      checkoutId: initiate.data.checkoutId,
      method: details.method,
    });

    complete.mutate(
      {
        checkoutId: initiate.data.checkoutId,
        paymentMethod: details.method,
      },
      {
        onSuccess: (order) => {
          logger.info('Payment successful', { orderId: order.orderId });
          completeTransaction();
          navigate({
            to: '/confirm',
            state: { orderId: order.orderId },
          });
        },
        onError: (error) => {
          logger.error('Payment failed', { error });
          setIsPaymentError(true);
        },
      }
    );
  };

  const summary = initiate.data;
  const isLoading = initiate.isPending;
  const hasError = initiate.isError || isPaymentError;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="mt-1 text-muted-foreground">
          Review your order and complete payment
        </p>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert variant="error" title="Checkout Error">
          {isPaymentError
            ? 'Payment processing failed. Please try again or ask for assistance.'
            : 'Unable to load checkout. Please try again or ask for assistance.'}
        </Alert>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Order Summary & Discounts */}
        <div className="space-y-6 lg:col-span-2">
          <CheckoutOrderSummary summary={summary} isLoading={isLoading} />

          {summary?.appliedDiscounts && (
            <AppliedDiscounts discounts={summary.appliedDiscounts} />
          )}
        </div>

        {/* Right Column: Payment */}
        <div className="lg:col-span-1">
          <PaymentSection
            total={summary?.finalTotal || 0}
            onPayment={handlePayment}
            isProcessing={complete.isPending}
            error={isPaymentError ? 'Payment processing failed' : undefined}
          />
        </div>
      </div>
    </div>
  );
}
