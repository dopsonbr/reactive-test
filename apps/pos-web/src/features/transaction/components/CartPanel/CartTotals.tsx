import { cn } from '@reactive-platform/shared-ui-components';

interface CartTotalsProps {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  fulfillmentTotal?: number;
  grandTotal: number;
  pointsEarned?: number;
  compact?: boolean;
}

export function CartTotals({
  subtotal,
  discountTotal,
  taxTotal,
  fulfillmentTotal = 0,
  grandTotal,
  pointsEarned = 0,
  compact = false,
}: CartTotalsProps) {
  const rows = [
    { label: 'Subtotal', value: subtotal, show: true },
    { label: 'Discounts', value: -discountTotal, show: discountTotal > 0, isDiscount: true },
    { label: 'Tax', value: taxTotal, show: true },
    { label: 'Fulfillment', value: fulfillmentTotal, show: fulfillmentTotal > 0 },
  ];

  return (
    <div className={cn('space-y-2', compact ? 'text-sm' : 'text-base')}>
      {rows
        .filter((row) => row.show)
        .map((row) => (
          <div key={row.label} className="flex justify-between">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={cn(row.isDiscount && 'text-green-600')}>
              {row.isDiscount ? '-' : ''}${Math.abs(row.value).toFixed(2)}
            </span>
          </div>
        ))}

      <div className="border-t pt-2 mt-2">
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>

        {pointsEarned > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>Points Earned</span>
            <span className="text-amber-600">+{pointsEarned} pts</span>
          </div>
        )}
      </div>
    </div>
  );
}
