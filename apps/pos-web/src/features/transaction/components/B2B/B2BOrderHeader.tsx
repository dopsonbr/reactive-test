import { Building2, User, CreditCard, FileText, TrendingUp } from 'lucide-react';
import type { Customer } from '../../../customer/types/customer';
import type { Transaction } from '../../types/transaction';
import {
  Card,
  CardContent,
  Badge,
  Progress,
} from '@reactive-platform/shared-ui-components';

interface B2BOrderHeaderProps {
  customer: Customer;
  transaction?: Transaction;
}

const TIER_COLORS: Record<string, string> = {
  STANDARD: 'bg-gray-500',
  PREFERRED: 'bg-blue-500',
  PREMIER: 'bg-purple-500',
  ENTERPRISE: 'bg-amber-500',
};

export function B2BOrderHeader({ customer }: B2BOrderHeaderProps) {
  const b2bInfo = customer.b2bInfo;

  if (!b2bInfo) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Mock current balance - would come from API
  const currentBalance = b2bInfo.creditLimit * 0.4;
  const availableCredit = b2bInfo.creditLimit - currentBalance;
  const utilizationPercent = (currentBalance / b2bInfo.creditLimit) * 100;

  const tierDiscount = {
    STANDARD: 0,
    PREFERRED: 5,
    PREMIER: 10,
    ENTERPRISE: 15,
  }[b2bInfo.accountTier];

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {/* Company Info */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{b2bInfo.companyName}</h3>
                <Badge className={TIER_COLORS[b2bInfo.accountTier]}>
                  {b2bInfo.accountTier}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Tax ID: {b2bInfo.taxId}
              </p>
              {b2bInfo.industry && (
                <p className="text-xs text-muted-foreground">{b2bInfo.industry}</p>
              )}
            </div>
          </div>

          {/* Tier Discount */}
          {tierDiscount > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-lg font-bold">{tierDiscount}% off</span>
              </div>
              <p className="text-xs text-muted-foreground">Account discount</p>
            </div>
          )}
        </div>

        {/* Credit and Contact Info */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200">
          {/* Credit Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>Credit Available</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{formatCurrency(availableCredit)}</span>
                <span className="text-muted-foreground">of {formatCurrency(b2bInfo.creditLimit)}</span>
              </div>
              <Progress value={100 - utilizationPercent} className="h-2" />
            </div>
          </div>

          {/* Payment Terms */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Payment Terms</span>
            </div>
            <p className="text-lg font-semibold">
              {b2bInfo.paymentTerms.replace('_', ' ')}
            </p>
          </div>

          {/* Sales Rep */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Sales Rep</span>
            </div>
            <p className="text-sm">
              {b2bInfo.salesRepName || 'Unassigned'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
