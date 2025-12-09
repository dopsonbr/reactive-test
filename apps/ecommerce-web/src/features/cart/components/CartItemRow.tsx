import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Input } from '@reactive-platform/shared-ui-components';
import type { CartItem } from '../types';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  isUpdating?: boolean;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating,
}: CartItemRowProps) {
  const handleQuantityChange = (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity >= 1) {
      onUpdateQuantity(newQuantity);
    }
  };

  return (
    <Card className="p-4" data-testid={`cart-item-${item.sku}`}>
      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex justify-between">
            <div>
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
            </div>
            <p className="font-medium">${parseFloat(item.lineTotal).toFixed(2)}</p>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(-1)}
                disabled={item.quantity <= 1 || isUpdating}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (value >= 1) {
                    onUpdateQuantity(value);
                  }
                }}
                className="h-8 w-16 text-center"
                data-testid="item-quantity"
                disabled={isUpdating}
                aria-label={`Quantity for ${item.name}`}
              />

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(1)}
                disabled={isUpdating}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={isUpdating}
              className="text-destructive hover:text-destructive"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
