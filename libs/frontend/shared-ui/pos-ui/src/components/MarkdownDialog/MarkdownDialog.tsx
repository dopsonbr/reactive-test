import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@reactive-platform/shared-ui-components";

export type MarkdownType = "PERCENTAGE" | "FIXED_AMOUNT" | "OVERRIDE_PRICE";
export type MarkdownReason =
  | "PRICE_MATCH"
  | "DAMAGED_ITEM"
  | "CUSTOMER_SATISFACTION"
  | "EMPLOYEE_DISCOUNT"
  | "CLEARANCE"
  | "MANAGER_DISCRETION";

export type MarkdownPermissionTier = "ASSOCIATE" | "SUPERVISOR" | "MANAGER" | "ADMIN";

export interface MarkdownLimit {
  maxPercentage: number;
  maxFixedAmount: number;
  allowPriceOverride: boolean;
  allowedReasons: MarkdownReason[];
}

export interface LineItem {
  sku: string;
  name: string;
  unitPrice: number;
}

export interface MarkdownInput {
  type: MarkdownType;
  value: number;
  reason: MarkdownReason;
  notes?: string;
}

export interface MarkdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LineItem | null; // null for cart-level
  userPermissionTier: MarkdownPermissionTier;
  onApply: (markdown: MarkdownInput) => void;
}

const TIER_LIMITS: Record<MarkdownPermissionTier, MarkdownLimit> = {
  ASSOCIATE: {
    maxPercentage: 15,
    maxFixedAmount: 50,
    allowPriceOverride: false,
    allowedReasons: ["PRICE_MATCH", "DAMAGED_ITEM"],
  },
  SUPERVISOR: {
    maxPercentage: 25,
    maxFixedAmount: 100,
    allowPriceOverride: false,
    allowedReasons: ["PRICE_MATCH", "DAMAGED_ITEM", "CUSTOMER_SATISFACTION"],
  },
  MANAGER: {
    maxPercentage: 50,
    maxFixedAmount: 500,
    allowPriceOverride: false,
    allowedReasons: [
      "PRICE_MATCH",
      "DAMAGED_ITEM",
      "CUSTOMER_SATISFACTION",
      "EMPLOYEE_DISCOUNT",
      "CLEARANCE",
    ],
  },
  ADMIN: {
    maxPercentage: 100,
    maxFixedAmount: 999999,
    allowPriceOverride: true,
    allowedReasons: [
      "PRICE_MATCH",
      "DAMAGED_ITEM",
      "CUSTOMER_SATISFACTION",
      "EMPLOYEE_DISCOUNT",
      "CLEARANCE",
      "MANAGER_DISCRETION",
    ],
  },
};

const REASON_LABELS: Record<MarkdownReason, string> = {
  PRICE_MATCH: "Price Match",
  DAMAGED_ITEM: "Damaged Item",
  CUSTOMER_SATISFACTION: "Customer Satisfaction",
  EMPLOYEE_DISCOUNT: "Employee Discount",
  CLEARANCE: "Clearance",
  MANAGER_DISCRETION: "Manager Discretion",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function MarkdownDialog({
  open,
  onOpenChange,
  item,
  userPermissionTier,
  onApply,
}: MarkdownDialogProps) {
  const [markdownType, setMarkdownType] = React.useState<MarkdownType>("PERCENTAGE");
  const [value, setValue] = React.useState("");
  const [reason, setReason] = React.useState<MarkdownReason | "">("");
  const [notes, setNotes] = React.useState("");

  const limits = TIER_LIMITS[userPermissionTier];
  const originalPrice = item?.unitPrice ?? 0;

  // Calculate preview price
  const previewPrice = React.useMemo(() => {
    const numValue = parseFloat(value) || 0;
    if (markdownType === "PERCENTAGE") {
      return originalPrice * (1 - numValue / 100);
    } else if (markdownType === "FIXED_AMOUNT") {
      return originalPrice - numValue;
    } else {
      return numValue;
    }
  }, [markdownType, value, originalPrice]);

  // Validation
  const validationError = React.useMemo(() => {
    const numValue = parseFloat(value) || 0;
    if (numValue <= 0) return "Value must be greater than 0";

    if (markdownType === "PERCENTAGE") {
      if (numValue > limits.maxPercentage) {
        return `Max ${limits.maxPercentage}% for your role`;
      }
    } else if (markdownType === "FIXED_AMOUNT") {
      if (numValue > limits.maxFixedAmount) {
        return `Max ${formatCurrency(limits.maxFixedAmount)} for your role`;
      }
    } else if (markdownType === "OVERRIDE_PRICE") {
      if (!limits.allowPriceOverride) {
        return "Price override requires manager approval";
      }
    }

    if (!reason) return "Please select a reason";
    return null;
  }, [markdownType, value, reason, limits]);

  const handleApply = () => {
    if (validationError || !reason) return;

    onApply({
      type: markdownType,
      value: parseFloat(value),
      reason,
      notes: notes || undefined,
    });

    // Reset form
    setMarkdownType("PERCENTAGE");
    setValue("");
    setReason("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apply Markdown</DialogTitle>
          <DialogDescription>
            {item ? (
              <>
                Applying markdown to <strong>{item.name}</strong> (SKU: {item.sku})
              </>
            ) : (
              "Applying markdown to entire cart"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Markdown Type */}
          <div className="space-y-2">
            <Label>Markdown Type</Label>
            <RadioGroup
              value={markdownType}
              onValueChange={(v) => setMarkdownType(v as MarkdownType)}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PERCENTAGE" id="percentage" />
                <Label htmlFor="percentage" className="font-normal">
                  Percentage off
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FIXED_AMOUNT" id="fixed" />
                <Label htmlFor="fixed" className="font-normal">
                  Fixed amount off
                </Label>
              </div>
              {limits.allowPriceOverride && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="OVERRIDE_PRICE" id="override" />
                  <Label htmlFor="override" className="font-normal">
                    Override price
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Value Input */}
          <div className="space-y-2">
            <Label htmlFor="value">
              {markdownType === "PERCENTAGE"
                ? "Percentage"
                : markdownType === "FIXED_AMOUNT"
                  ? "Amount"
                  : "New Price"}
            </Label>
            <div className="relative">
              {markdownType !== "PERCENTAGE" && (
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              )}
              <Input
                id="value"
                type="number"
                min="0"
                step={markdownType === "PERCENTAGE" ? "1" : "0.01"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={markdownType !== "PERCENTAGE" ? "pl-7" : ""}
                placeholder={markdownType === "PERCENTAGE" ? "e.g., 15" : "e.g., 10.00"}
              />
              {markdownType === "PERCENTAGE" && (
                <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {markdownType === "PERCENTAGE"
                ? `Max: ${limits.maxPercentage}%`
                : `Max: ${formatCurrency(limits.maxFixedAmount)}`}
            </p>
          </div>

          {/* Reason Select */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as MarkdownReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {limits.allowedReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {REASON_LABELS[r]}
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
              placeholder="Additional notes about this markdown..."
              rows={2}
            />
          </div>

          {/* Preview */}
          {item && value && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium">Preview</p>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-muted-foreground line-through">
                  {formatCurrency(originalPrice)}
                </span>
                <span className="text-lg font-semibold">
                  {formatCurrency(Math.max(0, previewPrice))}
                </span>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!!validationError || !value}>
            Apply Markdown
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
