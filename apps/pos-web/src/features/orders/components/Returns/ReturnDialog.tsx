import { useState, useCallback, useMemo } from 'react';
import { RotateCcw, Package, AlertCircle, Loader2 } from 'lucide-react';
import type { Order, ReturnRequest, ReturnReason, RefundMethod, ReturnItem } from '../../types/order';
import { RETURN_REASON_LABELS } from '../../types/order';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Checkbox,
  Input,
  Label,
  Textarea,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  cn,
} from '@reactive-platform/shared-ui-components';

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onReturn: (request: ReturnRequest) => Promise<void>;
}

interface ReturnItemState {
  lineItemId: string;
  name: string;
  maxQuantity: number;
  selected: boolean;
  quantity: number;
  reason?: ReturnReason;
}

export function ReturnDialog({ open, onOpenChange, order, onReturn }: ReturnDialogProps) {
  const [items, setItems] = useState<ReturnItemState[]>(() =>
    order.items
      .filter((item) => item.returnableQuantity > 0)
      .map((item) => ({
        lineItemId: item.id,
        name: item.name,
        maxQuantity: item.returnableQuantity,
        selected: false,
        quantity: item.returnableQuantity,
      }))
  );
  const [globalReason, setGlobalReason] = useState<ReturnReason | ''>('');
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('ORIGINAL_PAYMENT');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItems = items.filter((i) => i.selected);
  const hasSelection = selectedItems.length > 0;

  const refundAmount = useMemo(() => {
    return selectedItems.reduce((total, item) => {
      const orderItem = order.items.find((i) => i.id === item.lineItemId);
      if (!orderItem) return total;
      const unitPrice = orderItem.lineTotal / orderItem.quantity;
      return total + unitPrice * item.quantity;
    }, 0);
  }, [selectedItems, order.items]);

  const toggleItem = useCallback((lineItemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.lineItemId === lineItemId ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  const updateQuantity = useCallback((lineItemId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.lineItemId === lineItemId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity)) }
          : item
      )
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!hasSelection || !globalReason) return;

    setIsProcessing(true);
    setError(null);

    const returnItems: ReturnItem[] = selectedItems.map((item) => ({
      lineItemId: item.lineItemId,
      quantity: item.quantity,
      reason: item.reason || globalReason,
    }));

    try {
      await onReturn({
        orderId: order.id,
        items: returnItems,
        reason: globalReason,
        refundMethod,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process return');
    } finally {
      setIsProcessing(false);
    }
  }, [hasSelection, globalReason, selectedItems, order.id, refundMethod, notes, onReturn, onOpenChange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Process Return
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Info */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-mono text-sm">{order.orderNumber}</p>
            <p className="text-sm text-muted-foreground">
              {order.customerName} - {formatCurrency(order.grandTotal)}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Item Selection */}
          <div className="space-y-3">
            <Label>Select Items to Return</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items eligible for return
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.lineItemId}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      item.selected ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                    )}
                  >
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => toggleItem(item.lineItemId)}
                    />
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Max: {item.maxQuantity}
                      </p>
                    </div>
                    {item.selected && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Qty:</Label>
                        <Input
                          type="number"
                          min={1}
                          max={item.maxQuantity}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.lineItemId, parseInt(e.target.value) || 1)}
                          className="h-8 w-16"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Return Reason */}
          <div className="space-y-2">
            <Label>Return Reason</Label>
            <Select value={globalReason} onValueChange={(v) => setGlobalReason(v as ReturnReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RETURN_REASON_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refund Method */}
          <div className="space-y-3">
            <Label>Refund Method</Label>
            <RadioGroup value={refundMethod} onValueChange={(v) => setRefundMethod(v as RefundMethod)}>
              <div className="space-y-2">
                <label className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  refundMethod === 'ORIGINAL_PAYMENT' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                )}>
                  <RadioGroupItem value="ORIGINAL_PAYMENT" />
                  <div>
                    <p className="font-medium">Original Payment Method</p>
                    <p className="text-xs text-muted-foreground">
                      Refund to the card/payment used for purchase
                    </p>
                  </div>
                </label>

                <label className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  refundMethod === 'STORE_CREDIT' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                )}>
                  <RadioGroupItem value="STORE_CREDIT" />
                  <div>
                    <p className="font-medium">Store Credit</p>
                    <p className="text-xs text-muted-foreground">
                      Issue as store credit for future purchases
                    </p>
                  </div>
                </label>

                <label className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  refundMethod === 'EXCHANGE' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                )}>
                  <RadioGroupItem value="EXCHANGE" />
                  <div>
                    <p className="font-medium">Exchange</p>
                    <p className="text-xs text-muted-foreground">
                      Exchange for different item(s)
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this return..."
              rows={2}
            />
          </div>

          {/* Refund Summary */}
          {hasSelection && (
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium mb-2">Refund Summary</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </span>
                <span className="font-bold text-lg">{formatCurrency(refundAmount)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasSelection || !globalReason || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Process Return'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
