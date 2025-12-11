import { useState, useCallback, useMemo } from 'react';
import { FileText, Building2, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import type { Customer } from '../../../customer/types/customer';
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  RadioGroup,
  RadioGroupItem,
  Progress,
  Alert,
  AlertDescription,
  cn,
} from '@reactive-platform/shared-ui-components';

type PaymentTerms = 'NET_30' | 'NET_60' | 'NET_90';

interface NetTermsFormProps {
  customer: Customer;
  amount: number;
  availableTerms: PaymentTerms[];
  onSubmit: (payment: NetTermsPayment) => Promise<void>;
  onCancel: () => void;
}

export interface NetTermsPayment {
  terms: PaymentTerms;
  purchaseOrderNumber: string;
  approvedBy: string;
  notes?: string;
  amount: number;
}

const TERMS_LABELS: Record<PaymentTerms, string> = {
  NET_30: 'Net 30',
  NET_60: 'Net 60',
  NET_90: 'Net 90',
};

export function NetTermsForm({
  customer,
  amount,
  availableTerms,
  onSubmit,
  onCancel,
}: NetTermsFormProps) {
  const [selectedTerms, setSelectedTerms] = useState<PaymentTerms>(availableTerms[0]);
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const b2bInfo = customer.b2bInfo;
  const creditLimit = b2bInfo?.creditLimit ?? 0;
  // In a real app, we'd fetch the current balance. Mock it here.
  const currentBalance = creditLimit * 0.1; // Assume 10% utilization
  const availableCredit = creditLimit - currentBalance;
  const utilizationPercent = (currentBalance / creditLimit) * 100;

  const hasEnoughCredit = amount <= availableCredit;
  const afterOrderCredit = availableCredit - amount;
  const afterOrderPercent = ((currentBalance + amount) / creditLimit) * 100;

  const getDueDate = (terms: PaymentTerms): Date => {
    const date = new Date();
    switch (terms) {
      case 'NET_30':
        date.setDate(date.getDate() + 30);
        break;
      case 'NET_60':
        date.setDate(date.getDate() + 60);
        break;
      case 'NET_90':
        date.setDate(date.getDate() + 90);
        break;
    }
    return date;
  };

  const termsWithDueDates = useMemo(() => {
    return availableTerms.map((terms) => ({
      terms,
      label: TERMS_LABELS[terms],
      dueDate: getDueDate(terms),
    }));
  }, [availableTerms]);

  const requiresPO = customer.b2bInfo?.accountTier === 'ENTERPRISE';

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (requiresPO && !purchaseOrderNumber.trim()) {
      newErrors.purchaseOrderNumber = 'PO number is required for Enterprise accounts';
    }

    if (!hasEnoughCredit) {
      newErrors.credit = 'Insufficient credit limit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      setIsProcessing(true);
      setError(null);

      try {
        await onSubmit({
          terms: selectedTerms,
          purchaseOrderNumber: purchaseOrderNumber.trim(),
          approvedBy: 'current-user', // Would come from auth
          notes: notes.trim() || undefined,
          amount,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create invoice');
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedTerms, purchaseOrderNumber, notes, amount, onSubmit]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoice on Net Terms
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Customer Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{b2bInfo?.companyName || `${customer.firstName} ${customer.lastName}`}</p>
              <p className="text-sm text-muted-foreground">
                Account Tier: {b2bInfo?.accountTier || 'STANDARD'}
              </p>
            </div>
          </div>

          {/* Credit Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Credit Status</span>
              <span className="font-medium">
                {formatCurrency(availableCredit)} of {formatCurrency(creditLimit)}
              </span>
            </div>
            <Progress value={utilizationPercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {utilizationPercent.toFixed(0)}% utilized
            </p>
          </div>

          {/* Order Impact */}
          <div className="p-3 rounded-lg border space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Order Amount:</span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">After Order:</span>
              <span className={cn(afterOrderCredit < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                {formatCurrency(afterOrderCredit)} available ({afterOrderPercent.toFixed(0)}%)
              </span>
            </div>
          </div>

          {!hasEnoughCredit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This order exceeds the available credit limit. The order cannot be placed on net terms.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Payment Terms Selection */}
          <div className="space-y-3">
            <Label>Payment Terms</Label>
            <RadioGroup value={selectedTerms} onValueChange={(v) => setSelectedTerms(v as PaymentTerms)}>
              <div className="space-y-2">
                {termsWithDueDates.map(({ terms, label, dueDate }) => (
                  <label
                    key={terms}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedTerms === terms ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={terms} />
                      <span>{label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Due: {dueDate.toLocaleDateString()}
                    </span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* PO Number */}
          <div className="space-y-2">
            <Label htmlFor="poNumber">
              Purchase Order #{requiresPO && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="poNumber"
              value={purchaseOrderNumber}
              onChange={(e) => setPurchaseOrderNumber(e.target.value)}
              placeholder="Enter PO number"
              className={errors.purchaseOrderNumber ? 'border-destructive' : ''}
              disabled={isProcessing}
            />
            {errors.purchaseOrderNumber && (
              <p className="text-xs text-destructive">{errors.purchaseOrderNumber}</p>
            )}
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for this order..."
              rows={2}
              disabled={isProcessing}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button type="submit" disabled={isProcessing || !hasEnoughCredit}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Invoice...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Create Invoice
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
