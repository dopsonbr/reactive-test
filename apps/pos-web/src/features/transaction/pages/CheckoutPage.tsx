import { ArrowLeft, ArrowRight, Truck, Store, MapPin } from 'lucide-react';
import { useTransaction } from '../context/TransactionContext';
import { CartTotals } from '../components/CartPanel';
import type { FulfillmentType, FulfillmentConfig } from '../types/transaction';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  RadioGroup,
  RadioGroupItem,
  Label,
  Badge,
} from '@reactive-platform/shared-ui-components';

const fulfillmentOptions: { type: FulfillmentType; label: string; icon: typeof Store; description: string; cost: number }[] = [
  {
    type: 'IMMEDIATE',
    label: 'Take Now',
    icon: Store,
    description: 'Customer takes items immediately',
    cost: 0,
  },
  {
    type: 'PICKUP',
    label: 'Store Pickup',
    icon: MapPin,
    description: 'Customer picks up later',
    cost: 0,
  },
  {
    type: 'DELIVERY',
    label: 'Delivery',
    icon: Truck,
    description: 'Ship to customer address',
    cost: 9.99,
  },
];

export function CheckoutPage() {
  const {
    transaction,
    setFulfillment,
    returnToCart,
    proceedToPayment,
    isLoading,
  } = useTransaction();

  if (!transaction) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No active transaction</p>
      </div>
    );
  }

  const handleFulfillmentChange = (type: FulfillmentType) => {
    const option = fulfillmentOptions.find((o) => o.type === type);
    if (option) {
      const config: FulfillmentConfig = {
        type,
        cost: option.cost,
      };
      setFulfillment(config);
    }
  };

  const canProceed = transaction.fulfillment !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            Transaction #{transaction.id.split('-')[1]}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          ${transaction.grandTotal.toFixed(2)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {transaction.items.map((item) => (
                <div key={item.lineId} className="flex justify-between text-sm">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>${item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <CartTotals
                subtotal={transaction.subtotal}
                discountTotal={transaction.discountTotal}
                taxTotal={transaction.taxTotal}
                fulfillmentTotal={transaction.fulfillmentTotal}
                grandTotal={transaction.grandTotal}
                pointsEarned={transaction.pointsEarned}
                compact
              />
            </div>
          </CardContent>
        </Card>

        {/* Fulfillment Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Fulfillment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={transaction.fulfillment?.type || ''}
              onValueChange={(value) => handleFulfillmentChange(value as FulfillmentType)}
            >
              <div className="space-y-3">
                {fulfillmentOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div key={option.type}>
                      <Label
                        htmlFor={option.type}
                        className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                      >
                        <RadioGroupItem value={option.type} id={option.type} />
                        <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {option.cost > 0 ? `$${option.cost.toFixed(2)}` : 'Free'}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Customer Info (if selected) */}
        {transaction.customer && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">
                    {transaction.customer.firstName} {transaction.customer.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.customer.email}
                  </p>
                </div>
                {transaction.customer.loyaltyTier && (
                  <Badge variant="secondary">
                    {transaction.customer.loyaltyTier} • {transaction.customer.loyaltyPoints} pts
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={returnToCart} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Button>

        <Button
          onClick={proceedToPayment}
          disabled={!canProceed || isLoading}
          className="gap-2"
        >
          Proceed to Payment
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
