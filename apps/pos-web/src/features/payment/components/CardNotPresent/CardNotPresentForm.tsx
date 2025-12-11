import { useState, useCallback } from 'react';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  Alert,
  AlertDescription,
} from '@reactive-platform/shared-ui-components';

interface CardNotPresentFormProps {
  amount: number;
  onSubmit: (payment: CardNotPresentPayment) => Promise<void>;
  onCancel: () => void;
}

export interface CardNotPresentPayment {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  billingZip: string;
  cardholderName: string;
  amount: number;
}

export function CardNotPresentForm({ amount, onSubmit, onCancel }: CardNotPresentFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const formatted = digits.match(/.{1,4}/g)?.join(' ') || '';
    return formatted.substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 2) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
    }
    return digits;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
    if (errors.cardNumber) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.cardNumber;
        return next;
      });
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiry(formatExpiry(e.target.value));
    if (errors.expiry) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.expiry;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanCardNumber || cleanCardNumber.length < 15) {
      newErrors.cardNumber = 'Valid card number required';
    }

    const [month, year] = expiry.split('/');
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
      newErrors.expiry = 'Valid expiry date required (MM/YY)';
    }

    if (!cvv || cvv.length < 3) {
      newErrors.cvv = 'Valid CVV required';
    }

    if (!billingZip || !/^\d{5}(-\d{4})?$/.test(billingZip)) {
      newErrors.billingZip = 'Valid ZIP code required';
    }

    if (!cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name required';
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

      const [month, year] = expiry.split('/');

      try {
        await onSubmit({
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryMonth: month,
          expiryYear: `20${year}`,
          cvv,
          billingZip,
          cardholderName,
          amount,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [cardNumber, expiry, cvv, billingZip, cardholderName, amount, onSubmit]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Card Not Present Payment
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Amount */}
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              className={errors.cardNumber ? 'border-destructive' : ''}
              disabled={isProcessing}
              autoComplete="cc-number"
            />
            {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber}</p>}
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiration</Label>
              <Input
                id="expiry"
                value={expiry}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                maxLength={5}
                className={errors.expiry ? 'border-destructive' : ''}
                disabled={isProcessing}
                autoComplete="cc-exp"
              />
              {errors.expiry && <p className="text-xs text-destructive">{errors.expiry}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                placeholder="123"
                maxLength={4}
                className={errors.cvv ? 'border-destructive' : ''}
                disabled={isProcessing}
                autoComplete="cc-csc"
              />
              {errors.cvv && <p className="text-xs text-destructive">{errors.cvv}</p>}
            </div>
          </div>

          {/* Billing ZIP */}
          <div className="space-y-2">
            <Label htmlFor="billingZip">Billing ZIP</Label>
            <Input
              id="billingZip"
              value={billingZip}
              onChange={(e) => setBillingZip(e.target.value)}
              placeholder="12345"
              maxLength={10}
              className={errors.billingZip ? 'border-destructive' : ''}
              disabled={isProcessing}
              autoComplete="billing postal-code"
            />
            {errors.billingZip && <p className="text-xs text-destructive">{errors.billingZip}</p>}
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="John Smith"
              className={errors.cardholderName ? 'border-destructive' : ''}
              disabled={isProcessing}
              autoComplete="cc-name"
            />
            {errors.cardholderName && <p className="text-xs text-destructive">{errors.cardholderName}</p>}
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Payment is secured with PCI-compliant tokenization</span>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Process ${formatCurrency(amount)}`
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
