import { useState } from 'react';
import { Plus, CreditCard, Gift, Banknote, Building2, Check, X, Loader2, AlertCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Alert,
  AlertDescription,
  cn,
} from '@reactive-platform/shared-ui-components';

type PaymentType = 'CARD' | 'CASH' | 'GIFT_CARD' | 'STORE_CREDIT' | 'NET_TERMS';

interface PaymentEntry {
  id: string;
  method: PaymentType;
  amount: number;
  status: 'pending' | 'captured' | 'failed';
  details?: {
    cardBrand?: string;
    lastFour?: string;
    giftCardNumber?: string;
    authCode?: string;
  };
  error?: string;
}

interface SplitPaymentPanelProps {
  totalAmount: number;
  payments: PaymentEntry[];
  availableMethods: PaymentType[];
  onAddPayment: (method: PaymentType, amount: number) => Promise<void>;
  onRemovePayment: (paymentId: string) => void;
  onComplete: () => void;
  isProcessing?: boolean;
}

const METHOD_LABELS: Record<PaymentType, string> = {
  CARD: 'Credit/Debit Card',
  CASH: 'Cash',
  GIFT_CARD: 'Gift Card',
  STORE_CREDIT: 'Store Credit',
  NET_TERMS: 'Net Terms',
};

const METHOD_ICONS: Record<PaymentType, React.ReactNode> = {
  CARD: <CreditCard className="h-4 w-4" />,
  CASH: <Banknote className="h-4 w-4" />,
  GIFT_CARD: <Gift className="h-4 w-4" />,
  STORE_CREDIT: <CreditCard className="h-4 w-4" />,
  NET_TERMS: <Building2 className="h-4 w-4" />,
};

export function SplitPaymentPanel({
  totalAmount,
  payments,
  availableMethods,
  onAddPayment,
  onRemovePayment,
  onComplete,
  isProcessing = false,
}: SplitPaymentPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentType | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const paidAmount = payments
    .filter((p) => p.status === 'captured')
    .reduce((sum, p) => sum + p.amount, 0);

  const remainingAmount = totalAmount - paidAmount;
  const isFullyPaid = remainingAmount <= 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleAddPayment = async () => {
    if (!selectedMethod) return;

    const amount = customAmount ? parseFloat(customAmount) : remainingAmount;
    if (isNaN(amount) || amount <= 0) return;

    setIsAdding(true);
    try {
      await onAddPayment(selectedMethod, Math.min(amount, remainingAmount));
      setShowAddDialog(false);
      setSelectedMethod(null);
      setCustomAmount('');
    } finally {
      setIsAdding(false);
    }
  };

  const getStatusBadge = (status: PaymentEntry['status']) => {
    switch (status) {
      case 'captured':
        return (
          <Badge className="bg-green-500">
            <Check className="h-3 w-3 mr-1" />
            Captured
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Split Payment</span>
          <span className="text-lg font-normal">
            Total: {formatCurrency(totalAmount)}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${Math.min((paidAmount / totalAmount) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid: {formatCurrency(paidAmount)}</span>
            <span className={cn('font-medium', remainingAmount > 0 ? 'text-amber-600' : 'text-green-600')}>
              {remainingAmount > 0 ? `Remaining: ${formatCurrency(remainingAmount)}` : 'Fully Paid'}
            </span>
          </div>
        </div>

        {/* Payment List */}
        {payments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Applied Payments</h4>
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    payment.status === 'failed' && 'border-destructive bg-destructive/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {METHOD_ICONS[payment.method]}
                    <div>
                      <p className="font-medium">{METHOD_LABELS[payment.method]}</p>
                      {payment.details?.lastFour && (
                        <p className="text-xs text-muted-foreground">
                          {payment.details.cardBrand} ****{payment.details.lastFour}
                        </p>
                      )}
                      {payment.details?.giftCardNumber && (
                        <p className="text-xs text-muted-foreground">
                          Card: ****{payment.details.giftCardNumber.slice(-4)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    {getStatusBadge(payment.status)}
                    {payment.status !== 'captured' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onRemovePayment(payment.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remaining Amount Display */}
        {remainingAmount > 0 && payments.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {formatCurrency(remainingAmount)} remaining to complete this order.
            </AlertDescription>
          </Alert>
        )}

        {/* Add Payment Button */}
        {!isFullyPaid && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAddDialog(true)}
            disabled={isProcessing}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="ghost" disabled={isProcessing}>
          Cancel All
        </Button>
        <Button onClick={onComplete} disabled={!isFullyPaid || isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Complete Order'
          )}
        </Button>
      </CardFooter>

      {/* Add Payment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Remaining: {formatCurrency(remainingAmount)}
            </p>

            {/* Method Selection */}
            <div className="grid grid-cols-2 gap-2">
              {availableMethods.map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border transition-colors',
                    selectedMethod === method
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent/50'
                  )}
                >
                  {METHOD_ICONS[method]}
                  <span className="text-sm">{METHOD_LABELS[method]}</span>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            {selectedMethod && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Amount (leave empty for remaining balance)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={formatCurrency(remainingAmount)}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPayment} disabled={!selectedMethod || isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Payment'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
