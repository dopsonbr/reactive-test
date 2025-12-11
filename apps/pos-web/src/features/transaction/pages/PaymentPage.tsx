import { useState } from 'react';
import { ArrowLeft, CreditCard, Banknote, Gift, CheckCircle, Loader2 } from 'lucide-react';
import { useTransaction } from '../context/TransactionContext';
import type { PaymentMethod } from '../types/transaction';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  cn,
} from '@reactive-platform/shared-ui-components';

const paymentMethods: { method: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { method: 'CARD', label: 'Card', icon: CreditCard },
  { method: 'CASH', label: 'Cash', icon: Banknote },
  { method: 'GIFT_CARD', label: 'Gift Card', icon: Gift },
];

export function PaymentPage() {
  const {
    transaction,
    returnToCart,
    addPayment,
    completeTransaction,
    isLoading,
  } = useTransaction();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [cashTendered, setCashTendered] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  if (!transaction) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No active transaction</p>
      </div>
    );
  }

  const amountDue = transaction.amountDue;
  const isFullyPaid = amountDue <= 0;

  const handleCardPayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate card processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await addPayment('CARD', amountDue, {
        cardBrand: 'Visa',
        lastFour: '4242',
        authorizationCode: 'AUTH' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      });

      setPaymentComplete(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashPayment = async () => {
    const tendered = parseFloat(cashTendered);
    if (isNaN(tendered) || tendered < amountDue) return;

    await addPayment('CASH', amountDue, {
      tendered,
      change: tendered - amountDue,
    });

    setPaymentComplete(true);
  };

  const handleComplete = async () => {
    await completeTransaction();
  };

  if (paymentComplete || isFullyPaid) {
    const cashPayment = transaction.payments.find((p) => p.method === 'CASH');

    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Payment Complete</h1>
          <p className="text-muted-foreground">
            Total: ${transaction.grandTotal.toFixed(2)}
          </p>

          {cashPayment?.change && cashPayment.change > 0 && (
            <div className="p-4 rounded-lg bg-amber-100 text-amber-800">
              <p className="font-medium">Change Due</p>
              <p className="text-2xl font-bold">${cashPayment.change.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button className="w-full" onClick={handleComplete} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              'Complete Transaction'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment</h1>
          <p className="text-muted-foreground">
            Transaction #{transaction.id.split('-')[1]}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Due: ${amountDue.toFixed(2)}
        </Badge>
      </div>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {paymentMethods.map((pm) => {
              const Icon = pm.icon;
              const isSelected = selectedMethod === pm.method;

              return (
                <button
                  key={pm.method}
                  onClick={() => setSelectedMethod(pm.method)}
                  className={cn(
                    'p-6 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-8 w-8" />
                  <span className="font-medium">{pm.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      {selectedMethod && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedMethod === 'CARD' && 'Card Payment'}
              {selectedMethod === 'CASH' && 'Cash Payment'}
              {selectedMethod === 'GIFT_CARD' && 'Gift Card Payment'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMethod === 'CARD' && (
              <div className="space-y-4">
                <div className="p-8 text-center rounded-lg border border-dashed">
                  {isProcessing ? (
                    <div className="space-y-4">
                      <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                      <p className="text-lg font-medium">Processing payment...</p>
                      <p className="text-sm text-muted-foreground">
                        Please wait while we process your card
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-lg font-medium">Insert, swipe, or tap card</p>
                      <p className="text-sm text-muted-foreground">
                        Amount: ${amountDue.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleCardPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Simulate Card Payment'}
                </Button>
              </div>
            )}

            {selectedMethod === 'CASH' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cashTendered">Amount Tendered</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="cashTendered"
                      type="number"
                      step="0.01"
                      min={amountDue}
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="pl-7 text-lg"
                      placeholder={amountDue.toFixed(2)}
                    />
                  </div>
                </div>

                {/* Quick tender buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[20, 50, 100].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setCashTendered(amount.toString())}
                      disabled={amount < amountDue}
                    >
                      ${amount}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setCashTendered(amountDue.toFixed(2))}
                  >
                    Exact
                  </Button>
                </div>

                {cashTendered && parseFloat(cashTendered) >= amountDue && (
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex justify-between">
                      <span>Change Due:</span>
                      <span className="font-bold">
                        ${(parseFloat(cashTendered) - amountDue).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleCashPayment}
                  disabled={
                    !cashTendered || parseFloat(cashTendered) < amountDue
                  }
                >
                  Complete Cash Payment
                </Button>
              </div>
            )}

            {selectedMethod === 'GIFT_CARD' && (
              <div className="p-8 text-center text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Gift card payment coming in future release</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Back Button */}
      <div className="flex justify-start pt-4 border-t">
        <Button variant="outline" onClick={returnToCart} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
    </div>
  );
}
