import { useState } from 'react';
import { CreditCard, Check, Plus, Loader2 } from 'lucide-react';
import type { Customer } from '../../../customer/types/customer';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  RadioGroup,
  RadioGroupItem,
  Badge,
  cn,
} from '@reactive-platform/shared-ui-components';

export interface WalletCard {
  id: string;
  brand: string;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  cardholderName: string;
}

interface WalletPaymentFormProps {
  customer: Customer;
  amount: number;
  savedCards: WalletCard[];
  onSelectCard: (card: WalletCard) => Promise<void>;
  onAddNewCard: () => void;
  onCancel: () => void;
}

const CARD_BRAND_ICONS: Record<string, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
  discover: 'DISC',
};

export function WalletPaymentForm({
  customer,
  amount,
  savedCards,
  onSelectCard,
  onAddNewCard,
  onCancel,
}: WalletPaymentFormProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>(
    savedCards.find((c) => c.isDefault)?.id || savedCards[0]?.id || ''
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const handleSubmit = async () => {
    const selectedCard = savedCards.find((c) => c.id === selectedCardId);
    if (!selectedCard) return;

    setIsProcessing(true);
    try {
      await onSelectCard(selectedCard);
    } finally {
      setIsProcessing(false);
    }
  };

  const isExpired = (card: WalletCard): boolean => {
    const now = new Date();
    const expiry = new Date(card.expiryYear, card.expiryMonth - 1);
    return expiry < now;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pay with Saved Card
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-medium">{customer.firstName} {customer.lastName}</p>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        </div>

        {/* Amount */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">Amount to charge</p>
          <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
        </div>

        {/* Saved Cards */}
        {savedCards.length > 0 ? (
          <RadioGroup value={selectedCardId} onValueChange={setSelectedCardId}>
            <div className="space-y-2">
              {savedCards.map((card) => {
                const expired = isExpired(card);
                return (
                  <label
                    key={card.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedCardId === card.id && !expired
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent/50',
                      expired && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <RadioGroupItem value={card.id} disabled={expired} />
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {CARD_BRAND_ICONS[card.brand.toLowerCase()] || card.brand}
                      </span>
                      <span className="font-mono">****{card.lastFour}</span>
                    </div>
                    <div className="flex-1 text-right">
                      <span className="text-sm text-muted-foreground">
                        {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                      </span>
                      {card.isDefault && (
                        <Badge variant="secondary" className="ml-2">Default</Badge>
                      )}
                      {expired && (
                        <Badge variant="destructive" className="ml-2">Expired</Badge>
                      )}
                    </div>
                    {selectedCardId === card.id && !expired && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </label>
                );
              })}
            </div>
          </RadioGroup>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No saved cards on file</p>
          </div>
        )}

        {/* Add New Card */}
        <Button variant="outline" className="w-full" onClick={onAddNewCard}>
          <Plus className="mr-2 h-4 w-4" />
          Use Different Card
        </Button>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedCardId || isProcessing || savedCards.length === 0}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${formatCurrency(amount)}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
