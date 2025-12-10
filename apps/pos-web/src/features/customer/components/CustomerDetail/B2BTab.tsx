import { Building2, CreditCard, Calendar, User, ExternalLink, DollarSign } from 'lucide-react';
import type { Customer, CreditUtilization } from '../../types/customer';
import { ACCOUNT_TIERS } from '../../types/customer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
} from '@reactive-platform/shared-ui-components';

interface B2BTabProps {
  customer: Customer;
  creditUtilization: CreditUtilization | null;
  childAccounts?: Customer[];
  isLoading?: boolean;
}

export function B2BTab({
  customer,
  creditUtilization,
  childAccounts = [],
  isLoading,
}: B2BTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse bg-muted rounded-lg" />
        <div className="h-64 animate-pulse bg-muted rounded-lg" />
      </div>
    );
  }

  if (!customer.b2bInfo) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
        <h3 className="text-lg font-medium">Not a Business Account</h3>
        <p className="text-muted-foreground mt-2">
          This customer is not registered as a business account
        </p>
      </div>
    );
  }

  const { b2bInfo } = customer;
  const tierConfig = ACCOUNT_TIERS[b2bInfo.accountTier];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getPaymentTermsLabel = (terms: string) => {
    const labels: Record<string, string> = {
      NET_30: 'Net 30 Days',
      NET_60: 'Net 60 Days',
      NET_90: 'Net 90 Days',
      CUSTOM: 'Custom Terms',
    };
    return labels[terms] || terms;
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      STANDARD: 'bg-slate-100 text-slate-800 border-slate-200',
      PREFERRED: 'bg-blue-100 text-blue-800 border-blue-200',
      PREMIER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      ENTERPRISE: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const getCreditHealthColor = (percent: number) => {
    if (percent < 50) return 'bg-green-500';
    if (percent < 75) return 'bg-yellow-500';
    if (percent < 90) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Company Info Card */}
      <Card className={`${getTierColor(b2bInfo.accountTier)} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-white/50">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{b2bInfo.companyName}</h2>
                <p className="text-sm opacity-80">
                  {b2bInfo.accountTier} Account • {tierConfig.discount}% discount
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/50">
              {getPaymentTermsLabel(b2bInfo.paymentTerms)}
            </Badge>
          </div>

          {/* Company Details */}
          <div className="mt-4 pt-4 border-t border-current/10 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="opacity-70">Tax ID</p>
              <p className="font-medium">{b2bInfo.taxId}</p>
            </div>
            {b2bInfo.industry && (
              <div>
                <p className="opacity-70">Industry</p>
                <p className="font-medium">{b2bInfo.industry}</p>
              </div>
            )}
            {b2bInfo.website && (
              <div className="col-span-2">
                <p className="opacity-70">Website</p>
                <a
                  href={b2bInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium flex items-center gap-1 hover:underline"
                >
                  {b2bInfo.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credit & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credit Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credit Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Credit Limit</span>
                <span className="font-medium">{formatCurrency(b2bInfo.creditLimit)}</span>
              </div>
              {creditUtilization && (
                <>
                  <Progress
                    value={creditUtilization.utilizationPercent}
                    className={`h-3 ${getCreditHealthColor(creditUtilization.utilizationPercent)}`}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Used: {formatCurrency(creditUtilization.currentBalance)}</span>
                    <span>Available: {formatCurrency(creditUtilization.availableCredit)}</span>
                  </div>
                </>
              )}
            </div>

            {creditUtilization && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Payment</span>
                  <span>{formatDate(creditUtilization.lastPaymentDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Next Due</span>
                  <span className="font-medium">{formatDate(creditUtilization.nextPaymentDue)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Rep */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            {b2bInfo.salesRepName ? (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{b2bInfo.salesRepName}</p>
                  <p className="text-sm text-muted-foreground">
                    Sales Representative
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No sales rep assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tier Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Account Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Credit Limit</p>
              <p className="text-xl font-semibold">{formatCurrency(tierConfig.creditLimit)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Volume Discount</p>
              <p className="text-xl font-semibold">{tierConfig.discount}%</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Payment Options</p>
              <p className="text-xl font-semibold">{tierConfig.terms.length} terms</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Child Accounts */}
      {childAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Child Accounts ({childAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {childAccounts.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {child.b2bInfo?.companyName || `${child.firstName} ${child.lastName}`}
                      </p>
                      <p className="text-sm text-muted-foreground">{child.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {child.b2bInfo?.accountTier || 'N/A'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
