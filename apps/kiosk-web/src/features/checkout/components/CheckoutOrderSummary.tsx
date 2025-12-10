import type { CheckoutSummary } from '@reactive-platform/commerce-hooks';
import { PriceDisplay, Spinner } from '@reactive-platform/shared-ui/ui-components';

export interface CheckoutOrderSummaryProps {
  summary: CheckoutSummary | undefined;
  isLoading: boolean;
}

export function CheckoutOrderSummary({ summary, isLoading }: CheckoutOrderSummaryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-lg border border-error bg-error/10 p-6">
        <p className="text-center text-error">Unable to load checkout summary</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Order Summary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {summary.items.length} {summary.items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Items */}
      <div className="space-y-4">
        {summary.items.map((item) => (
          <div
            key={item.lineItemId}
            className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4"
          >
            <div className="flex-1">
              <p className="font-medium">{item.productName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Qty: {item.quantity} × <PriceDisplay price={item.unitPrice} />
              </p>
            </div>
            <div className="text-right">
              <PriceDisplay price={item.lineTotal} className="font-semibold" />
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <PriceDisplay price={summary.subtotal} />
        </div>

        {summary.totalDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discounts</span>
            <PriceDisplay price={-summary.totalDiscount} className="text-success" />
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <PriceDisplay price={summary.tax} />
        </div>

        <div className="flex justify-between border-t pt-4 text-2xl font-bold">
          <span>Total</span>
          <PriceDisplay price={summary.finalTotal} />
        </div>
      </div>
    </div>
  );
}
