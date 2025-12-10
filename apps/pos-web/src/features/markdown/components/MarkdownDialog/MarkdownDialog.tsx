import { useState, useCallback, useMemo } from 'react';
import { AlertTriangle, Percent, DollarSign, Tag } from 'lucide-react';
import { useMarkdownPermissions } from '../../context/MarkdownPermissionContext';
import type { MarkdownType, MarkdownReason, MarkdownInput } from '../../types/markdown';
import {
  MARKDOWN_TYPE_LABELS,
  MARKDOWN_REASON_LABELS,
  MARKDOWN_REASON_MIN_TIER,
} from '../../types/markdown';
import type { LineItem } from '../../../transaction/types/transaction';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
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
  Badge,
  cn,
} from '@reactive-platform/shared-ui-components';

interface MarkdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LineItem | null; // null for cart-level markdown
  onApply: (markdown: MarkdownInput) => Promise<void>;
  onRequestOverride?: () => void;
}

export function MarkdownDialog({
  open,
  onOpenChange,
  item,
  onApply,
  onRequestOverride,
}: MarkdownDialogProps) {
  const {
    tier,
    limits,
    canApplyMarkdownType,
    canUseReason,
    isWithinLimit,
    getMaxPercentage,
    getMaxFixedAmount,
    canOverridePrice,
  } = useMarkdownPermissions();

  const [type, setType] = useState<MarkdownType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState<MarkdownReason | ''>('');
  const [notes, setNotes] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const itemPrice = item?.unitPrice || 0;
  const itemName = item?.name || 'Cart Total';

  // Calculate discount preview
  const preview = useMemo(() => {
    const numValue = parseFloat(value) || 0;
    if (numValue <= 0) return null;

    let discountAmount = 0;
    let finalPrice = itemPrice;

    switch (type) {
      case 'PERCENTAGE':
        discountAmount = itemPrice * (numValue / 100);
        finalPrice = itemPrice - discountAmount;
        break;
      case 'FIXED_AMOUNT':
        discountAmount = Math.min(numValue, itemPrice);
        finalPrice = itemPrice - discountAmount;
        break;
      case 'OVERRIDE_PRICE':
        discountAmount = itemPrice - numValue;
        finalPrice = numValue;
        break;
    }

    return {
      original: itemPrice,
      discountAmount: Math.max(0, discountAmount),
      finalPrice: Math.max(0, finalPrice),
      discountPercent: (discountAmount / itemPrice) * 100,
    };
  }, [type, value, itemPrice]);

  // Check if current value exceeds limits
  const exceedsLimit = useMemo(() => {
    const numValue = parseFloat(value) || 0;
    return numValue > 0 && !isWithinLimit(type, numValue, itemPrice);
  }, [type, value, itemPrice, isWithinLimit]);

  const isValid = useMemo(() => {
    const numValue = parseFloat(value) || 0;
    return (
      numValue > 0 &&
      reason !== '' &&
      canApplyMarkdownType(type) &&
      canUseReason(reason as MarkdownReason) &&
      !exceedsLimit
    );
  }, [type, value, reason, canApplyMarkdownType, canUseReason, exceedsLimit]);

  const handleApply = useCallback(async () => {
    if (!isValid || !reason) return;

    setIsApplying(true);
    try {
      await onApply({
        lineId: item?.lineId,
        type,
        value: parseFloat(value),
        reason: reason as MarkdownReason,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsApplying(false);
    }
  }, [isValid, item, type, value, reason, notes, onApply, onOpenChange]);

  const handleRequestOverride = useCallback(() => {
    if (onRequestOverride) {
      onRequestOverride();
    }
  }, [onRequestOverride]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get available reasons based on tier
  const availableReasons = useMemo(() => {
    const tierOrder: Record<string, number> = {
      ASSOCIATE: 0,
      SUPERVISOR: 1,
      MANAGER: 2,
      ADMIN: 3,
    };
    const currentTierLevel = tierOrder[tier];

    return Object.entries(MARKDOWN_REASON_MIN_TIER)
      .filter(([, minTier]) => tierOrder[minTier] <= currentTierLevel)
      .map(([reasonKey]) => reasonKey as MarkdownReason);
  }, [tier]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply Markdown</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Item Info */}
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="font-medium">{itemName}</p>
            <p className="text-lg font-bold">{formatCurrency(itemPrice)}</p>
          </div>

          {/* Markdown Type */}
          <div className="space-y-3">
            <Label>Markdown Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as MarkdownType)}>
              <div className="space-y-2">
                <Label
                  htmlFor="percentage"
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    type === 'PERCENTAGE' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50',
                    !canApplyMarkdownType('PERCENTAGE') && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <RadioGroupItem
                    value="PERCENTAGE"
                    id="percentage"
                    disabled={!canApplyMarkdownType('PERCENTAGE')}
                  />
                  <Percent className="h-4 w-4" />
                  <span>{MARKDOWN_TYPE_LABELS.PERCENTAGE}</span>
                  <Badge variant="outline" className="ml-auto">
                    max {getMaxPercentage()}%
                  </Badge>
                </Label>

                <Label
                  htmlFor="fixed"
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    type === 'FIXED_AMOUNT' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50',
                    !canApplyMarkdownType('FIXED_AMOUNT') && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <RadioGroupItem
                    value="FIXED_AMOUNT"
                    id="fixed"
                    disabled={!canApplyMarkdownType('FIXED_AMOUNT')}
                  />
                  <DollarSign className="h-4 w-4" />
                  <span>{MARKDOWN_TYPE_LABELS.FIXED_AMOUNT}</span>
                  <Badge variant="outline" className="ml-auto">
                    max {formatCurrency(getMaxFixedAmount())}
                  </Badge>
                </Label>

                <Label
                  htmlFor="override"
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    type === 'OVERRIDE_PRICE' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50',
                    !canOverridePrice() && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <RadioGroupItem
                    value="OVERRIDE_PRICE"
                    id="override"
                    disabled={!canOverridePrice()}
                  />
                  <Tag className="h-4 w-4" />
                  <span>{MARKDOWN_TYPE_LABELS.OVERRIDE_PRICE}</span>
                  {!canOverridePrice() && (
                    <Badge variant="secondary" className="ml-auto">
                      🔒 Manager
                    </Badge>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Value Input */}
          <div className="space-y-2">
            <Label htmlFor="value">
              {type === 'PERCENTAGE' ? 'Percentage' : type === 'OVERRIDE_PRICE' ? 'New Price' : 'Amount'}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {type === 'PERCENTAGE' ? '' : '$'}
              </span>
              <Input
                id="value"
                type="number"
                step={type === 'PERCENTAGE' ? '1' : '0.01'}
                min="0"
                max={type === 'PERCENTAGE' ? '100' : undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={cn(
                  type === 'PERCENTAGE' ? '' : 'pl-7',
                  exceedsLimit && 'border-destructive'
                )}
                placeholder={type === 'PERCENTAGE' ? '15' : '0.00'}
              />
              {type === 'PERCENTAGE' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              )}
            </div>
            {exceedsLimit && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Exceeds your {type === 'PERCENTAGE' ? `${getMaxPercentage()}%` : formatCurrency(getMaxFixedAmount())} limit
                </span>
                {onRequestOverride && (
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={handleRequestOverride}>
                    Request Override
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as MarkdownReason)}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {availableReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {MARKDOWN_REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          {/* Preview */}
          {preview && preview.discountAmount > 0 && (
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium mb-2">Preview</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original:</span>
                  <span>{formatCurrency(preview.original)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>
                    -{formatCurrency(preview.discountAmount)} ({preview.discountPercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t">
                  <span>New Price:</span>
                  <span>{formatCurrency(preview.finalPrice)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!isValid || isApplying}>
            {isApplying ? 'Applying...' : 'Apply Markdown'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
