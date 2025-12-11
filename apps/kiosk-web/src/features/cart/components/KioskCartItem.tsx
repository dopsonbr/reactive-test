import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { CartProduct } from '@reactive-platform/commerce-hooks';
import {
  Button,
  QuantitySelector,
  PriceDisplay,
  Alert,
  cn,
} from '@reactive-platform/shared-ui/ui-components';

export interface KioskCartItemProps {
  item: CartProduct;
  onUpdateQuantity: (sku: string, quantity: number) => void;
  onRemove: (sku: string) => void;
  isUpdating?: boolean;
}

/**
 * Large touch-friendly cart item for kiosk display
 * Optimized for 1080p kiosk screens with large touch targets
 */
export function KioskCartItem({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating = false,
}: KioskCartItemProps) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleQuantityChange = (newQuantity: number) => {
    onUpdateQuantity(String(item.sku), newQuantity);
  };

  const handleRemoveClick = () => {
    setShowRemoveConfirm(true);
  };

  const handleConfirmRemove = () => {
    onRemove(String(item.sku));
    setShowRemoveConfirm(false);
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirm(false);
  };

  return (
    <div className="border-b border-border last:border-b-0">
      <div className={cn(
        "flex items-center gap-6 p-6",
        isUpdating && "opacity-50 pointer-events-none"
      )}>
        {/* Product Image */}
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
          />
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-semibold mb-2 truncate">
            {item.name}
          </h3>
          <div className="flex items-center gap-4">
            <PriceDisplay
              price={item.unitPrice}
              size="lg"
              className="text-xl"
            />
            <span className="text-lg text-muted-foreground">
              per item
            </span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-6">
          <QuantitySelector
            value={item.quantity}
            onChange={handleQuantityChange}
            min={1}
            max={99}
            size="lg"
            disabled={isUpdating}
          />

          {/* Line Total */}
          <div className="min-w-[120px] text-right">
            <div className="text-sm text-muted-foreground mb-1">Total</div>
            <PriceDisplay
              price={item.lineTotal}
              size="xl"
              className="text-2xl font-bold"
            />
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={handleRemoveClick}
            disabled={isUpdating}
            className="h-16 w-16 p-0"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-8 w-8" />
          </Button>
        </div>
      </div>

      {/* Remove Confirmation */}
      {showRemoveConfirm && (
        <div className="px-6 pb-6">
          <Alert variant="destructive" className="p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg font-medium">
                Remove {item.name} from cart?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCancelRemove}
                  className="h-12 px-6"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleConfirmRemove}
                  className="h-12 px-6"
                >
                  Remove
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
}
