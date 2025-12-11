import * as React from "react";
import { cn } from "@reactive-platform/shared-ui-components";
import { Badge } from "@reactive-platform/shared-ui-components";
import { Button } from "@reactive-platform/shared-ui-components";
import { Trash2, User, ShoppingCart } from "lucide-react";

export type TransactionStatus = "draft" | "in-progress" | "checkout" | "complete";

export interface CustomerSummary {
  id: string;
  name: string;
  loyaltyTier?: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  accountType?: "D2C" | "B2B";
}

export interface TransactionHeaderProps {
  transactionId: string;
  customer: CustomerSummary | null;
  itemCount: number;
  subtotal: number;
  status: TransactionStatus;
  onClearTransaction?: () => void;
  onViewCustomer?: () => void;
  className?: string;
}

const statusVariants: Record<TransactionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "outline" },
  "in-progress": { label: "In Progress", variant: "secondary" },
  checkout: { label: "Checkout", variant: "default" },
  complete: { label: "Complete", variant: "default" },
};

const loyaltyColors: Record<string, string> = {
  BRONZE: "bg-amber-700 text-white",
  SILVER: "bg-gray-400 text-black",
  GOLD: "bg-yellow-500 text-black",
  PLATINUM: "bg-slate-700 text-white",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function TransactionHeader({
  transactionId,
  customer,
  itemCount,
  subtotal,
  status,
  onClearTransaction,
  onViewCustomer,
  className,
}: TransactionHeaderProps) {
  const statusConfig = statusVariants[status];

  return (
    <div className={cn("flex items-center justify-between border-b bg-card p-4", className)}>
      {/* Left: Transaction ID and Status */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Transaction</p>
          <p className="font-mono text-sm font-medium">{transactionId}</p>
        </div>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </div>

      {/* Center: Customer Info */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewCustomer}
          className="flex items-center gap-2"
          disabled={!customer}
        >
          <User className="h-4 w-4" />
          {customer ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">{customer.name}</span>
              {customer.loyaltyTier && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-xs font-medium",
                    loyaltyColors[customer.loyaltyTier]
                  )}
                >
                  {customer.loyaltyTier}
                </span>
              )}
              {customer.accountType === "B2B" && (
                <Badge variant="outline" className="text-xs">
                  B2B
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">Guest</span>
          )}
        </Button>
      </div>

      {/* Right: Item count, Subtotal, Actions */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">{itemCount}</span>
            <span className="text-muted-foreground"> items</span>
          </span>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">Subtotal</p>
          <p className="text-lg font-semibold">{formatCurrency(subtotal)}</p>
        </div>

        {onClearTransaction && status !== "complete" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearTransaction}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Clear transaction</span>
          </Button>
        )}
      </div>
    </div>
  );
}
