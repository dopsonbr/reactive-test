import type { AppliedDiscount } from '@reactive-platform/commerce-hooks';
import { Badge, PriceDisplay } from '@reactive-platform/shared-ui/ui-components';

export interface AppliedDiscountsProps {
  discounts: AppliedDiscount[] | undefined;
}

const discountTypeIcons: Record<string, string> = {
  LOYALTY: '⭐',
  PROMO: '🎟️',
  MARKDOWN: '🏷️',
};

const discountTypeLabels: Record<string, string> = {
  LOYALTY: 'Loyalty',
  PROMO: 'Promo Code',
  MARKDOWN: 'Markdown',
};

export function AppliedDiscounts({ discounts }: AppliedDiscountsProps) {
  if (!discounts || discounts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Applied Discounts</h3>

      <div className="space-y-3">
        {discounts.map((discount) => (
          <div
            key={discount.discountId}
            className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/5 p-4"
          >
            <span className="text-2xl" role="img" aria-label={discount.type}>
              {discountTypeIcons[discount.type] || '💰'}
            </span>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{discount.description}</p>
                <Badge variant="success" size="sm">
                  {discountTypeLabels[discount.type] || discount.type}
                </Badge>
              </div>

              {discount.code && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Code: <span className="font-mono">{discount.code}</span>
                </p>
              )}
            </div>

            <div className="text-right">
              <PriceDisplay
                price={-discount.appliedSavings}
                className="font-semibold text-success"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-success/10 p-4 text-center">
        <p className="text-sm font-medium text-success">
          Total Savings:{' '}
          <PriceDisplay
            price={-discounts.reduce((sum, d) => sum + d.appliedSavings, 0)}
            className="text-lg font-bold"
          />
        </p>
      </div>
    </div>
  );
}
