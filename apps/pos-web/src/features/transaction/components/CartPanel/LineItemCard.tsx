import { Tag, Trash2, MoreHorizontal } from 'lucide-react';
import { QuantityInput } from './QuantityInput';
import type { LineItem } from '../../types/transaction';
import {
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  cn,
} from '@reactive-platform/shared-ui-components';

interface LineItemCardProps {
  item: LineItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onMarkdown?: () => void;
  canApplyMarkdown?: boolean;
  isEditable?: boolean;
}

export function LineItemCard({
  item,
  onQuantityChange,
  onRemove,
  onMarkdown,
  canApplyMarkdown = false,
  isEditable = true,
}: LineItemCardProps) {
  const hasMarkdown = item.markdown !== null;
  const hasDiscount = item.discountPerItem > 0;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Product Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {item.sku}
          </span>
          {hasMarkdown && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Tag className="h-3 w-3" />
                    {item.markdown?.reason}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {item.markdown?.type === 'PERCENT'
                      ? `${item.markdown.value}% off`
                      : item.markdown?.type === 'FIXED'
                        ? `$${item.markdown.value} off`
                        : `New price: $${item.markdown?.value}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Applied by: {item.markdown?.employeeId}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="font-medium truncate">{item.name}</div>

        {/* Price Details */}
        <div className="flex items-center gap-2 text-sm">
          {hasDiscount ? (
            <>
              <span className="text-muted-foreground line-through">
                ${item.originalPrice.toFixed(2)}
              </span>
              <span className="text-green-600 font-medium">
                ${item.unitPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span>${item.unitPrice.toFixed(2)}</span>
          )}
          <span className="text-muted-foreground">each</span>
        </div>
      </div>

      {/* Quantity */}
      <div className="flex flex-col items-end gap-2">
        {isEditable ? (
          <QuantityInput
            value={item.quantity}
            onChange={onQuantityChange}
            min={0}
            size="sm"
          />
        ) : (
          <span className="px-3 py-1 text-sm font-medium bg-muted rounded">
            x{item.quantity}
          </span>
        )}
      </div>

      {/* Line Total */}
      <div className="text-right min-w-[80px]">
        <div className={cn('font-semibold', hasDiscount && 'text-green-600')}>
          ${item.lineTotal.toFixed(2)}
        </div>
        {hasDiscount && item.quantity > 1 && (
          <div className="text-xs text-muted-foreground">
            -${(item.discountPerItem * item.quantity).toFixed(2)}
          </div>
        )}
      </div>

      {/* Actions */}
      {isEditable && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Item actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canApplyMarkdown && onMarkdown && (
              <>
                <DropdownMenuItem onClick={onMarkdown}>
                  <Tag className="mr-2 h-4 w-4" />
                  {hasMarkdown ? 'Edit Markdown' : 'Apply Markdown'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={onRemove}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
