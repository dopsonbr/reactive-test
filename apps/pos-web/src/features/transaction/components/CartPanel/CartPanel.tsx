import { ShoppingCart, User, Pause, ArrowRight } from 'lucide-react';
import { LineItemCard } from './LineItemCard';
import { CartTotals } from './CartTotals';
import { useTransaction } from '../../context/TransactionContext';
import { useAuth, usePermission, Permission } from '../../../auth';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  ScrollArea,
} from '@reactive-platform/shared-ui-components';

interface CartPanelProps {
  onMarkdownClick?: (lineId: string) => void;
}

export function CartPanel({ onMarkdownClick }: CartPanelProps) {
  const {
    transaction,
    updateItemQuantity,
    removeItem,
    suspendTransaction,
    proceedToCheckout,
    isLoading,
  } = useTransaction();

  const canApplyMarkdown = usePermission(Permission.MARKDOWN_APPLY);
  const isActive = transaction?.status === 'ACTIVE';

  if (!transaction) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No active transaction</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const itemCount = transaction.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart
            {itemCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {itemCount} items
              </Badge>
            )}
          </CardTitle>

          {transaction.customer && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {transaction.customer.firstName} {transaction.customer.lastName}
              </span>
              {transaction.customer.loyaltyTier && (
                <Badge variant="outline" className="text-xs">
                  {transaction.customer.loyaltyTier}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      {/* Items List */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        {transaction.items.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Scan or search for items to add them to the cart</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full max-h-[400px] px-4">
            <div className="space-y-2 pb-4">
              {transaction.items.map((item) => (
                <LineItemCard
                  key={item.lineId}
                  item={item}
                  onQuantityChange={(qty) => updateItemQuantity(item.lineId, qty)}
                  onRemove={() => removeItem(item.lineId)}
                  onMarkdown={() => onMarkdownClick?.(item.lineId)}
                  canApplyMarkdown={canApplyMarkdown}
                  isEditable={isActive}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Totals */}
      {transaction.items.length > 0 && (
        <div className="border-t px-4 py-3">
          <CartTotals
            subtotal={transaction.subtotal}
            discountTotal={transaction.discountTotal}
            taxTotal={transaction.taxTotal}
            grandTotal={transaction.grandTotal}
            pointsEarned={transaction.pointsEarned}
            compact
          />
        </div>
      )}

      {/* Actions */}
      <CardFooter className="gap-2 border-t pt-4">
        <Button
          variant="outline"
          className="gap-2"
          onClick={suspendTransaction}
          disabled={isLoading || transaction.items.length === 0}
        >
          <Pause className="h-4 w-4" />
          Suspend
          <kbd className="hidden ml-1 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] sm:flex">
            F8
          </kbd>
        </Button>

        <Button
          className="flex-1 gap-2"
          onClick={proceedToCheckout}
          disabled={isLoading || transaction.items.length === 0}
        >
          Checkout
          <ArrowRight className="h-4 w-4" />
          <kbd className="hidden ml-1 h-5 select-none items-center gap-1 rounded border bg-primary-foreground/20 px-1.5 font-mono text-[10px] sm:flex">
            F9
          </kbd>
        </Button>
      </CardFooter>
    </Card>
  );
}
