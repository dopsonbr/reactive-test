import * as React from "react";
import { cn, Button, Badge } from "@reactive-platform/shared-ui-components";
import { Minus, Plus, Trash2, Tag } from "lucide-react";
import {
  formatCurrency,
  formatMarkdown,
  type MarkdownInfo,
} from "../../utils/formatting";

export type { MarkdownInfo };

export interface LineItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPerItem: number;
  markdown?: MarkdownInfo;
}

export interface LineItemRowProps {
  item: LineItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onMarkdown: () => void;
  canApplyMarkdown: boolean;
  isEditable?: boolean;
  className?: string;
}

export function LineItemRow({
  item,
  onQuantityChange,
  onRemove,
  onMarkdown,
  canApplyMarkdown,
  isEditable = true,
  className,
}: LineItemRowProps) {
  const lineTotal = item.quantity * (item.unitPrice - item.discountPerItem);
  const originalTotal = item.quantity * item.unitPrice;
  const hasSavings = item.discountPerItem > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-4 border-b py-3 px-2",
        className
      )}
    >
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{item.name}</p>
          {item.markdown && (
            <Badge variant="secondary" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {item.markdown.reason}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
          disabled={!isEditable || item.quantity <= 1}
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">Decrease quantity</span>
        </Button>
        <span className="w-10 text-center font-medium">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onQuantityChange(item.quantity + 1)}
          disabled={!isEditable}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Increase quantity</span>
        </Button>
      </div>

      {/* Unit Price */}
      <div className="w-24 text-right">
        <p className="text-sm">{formatCurrency(item.unitPrice)}</p>
        {item.markdown && (
          <p className="text-xs text-destructive">
            {formatMarkdown(item.markdown)}
          </p>
        )}
      </div>

      {/* Line Total */}
      <div className="w-28 text-right">
        {hasSavings ? (
          <>
            <p className="font-semibold">{formatCurrency(lineTotal)}</p>
            <p className="text-xs text-muted-foreground line-through">
              {formatCurrency(originalTotal)}
            </p>
          </>
        ) : (
          <p className="font-semibold">{formatCurrency(lineTotal)}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {canApplyMarkdown && isEditable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onMarkdown}
          >
            <Tag className="h-4 w-4" />
            <span className="sr-only">Apply markdown</span>
          </Button>
        )}
        {isEditable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove item</span>
          </Button>
        )}
      </div>
    </div>
  );
}
