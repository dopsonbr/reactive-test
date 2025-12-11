import { Building2, Globe, CreditCard, DollarSign } from 'lucide-react';
import type { B2BInfoInput, AccountTier, PaymentTerms } from '../../types/customer';
import { ACCOUNT_TIERS } from '../../types/customer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@reactive-platform/shared-ui-components';

interface B2BInfoSectionProps {
  value: B2BInfoInput;
  onChange: (value: B2BInfoInput) => void;
  errors: Record<string, string>;
}

export function B2BInfoSection({ value, onChange, errors }: B2BInfoSectionProps) {
  const updateCompanyInfo = (
    key: keyof B2BInfoInput['companyInfo'],
    val: string
  ) => {
    onChange({
      ...value,
      companyInfo: {
        ...value.companyInfo,
        [key]: val,
      },
    });
  };

  const updateField = <K extends keyof B2BInfoInput>(
    key: K,
    val: B2BInfoInput[K]
  ) => {
    onChange({
      ...value,
      [key]: val,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentTermsLabel = (terms: PaymentTerms) => {
    const labels: Record<PaymentTerms, string> = {
      NET_30: 'Net 30 Days',
      NET_60: 'Net 60 Days',
      NET_90: 'Net 90 Days',
      CUSTOM: 'Custom Terms',
    };
    return labels[terms];
  };

  const selectedTierConfig = ACCOUNT_TIERS[value.accountTier];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={value.companyInfo.companyName}
              onChange={(e) => updateCompanyInfo('companyName', e.target.value)}
              placeholder="ACME Corporation"
              className={errors.companyName ? 'border-destructive' : ''}
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">{errors.companyName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID *</Label>
            <Input
              id="taxId"
              value={value.companyInfo.taxId}
              onChange={(e) => updateCompanyInfo('taxId', e.target.value)}
              placeholder="12-3456789"
              className={errors.taxId ? 'border-destructive' : ''}
            />
            {errors.taxId && (
              <p className="text-sm text-destructive">{errors.taxId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={value.companyInfo.industry || ''}
              onChange={(e) => updateCompanyInfo('industry', e.target.value)}
              placeholder="Manufacturing"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              value={value.companyInfo.website || ''}
              onChange={(e) => updateCompanyInfo('website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Account Settings */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-4">Account Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountTier" className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Account Tier
              </Label>
              <Select
                value={value.accountTier}
                onValueChange={(v) => updateField('accountTier', v as AccountTier)}
              >
                <SelectTrigger id="accountTier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="PREFERRED">Preferred</SelectItem>
                  <SelectItem value="PREMIER">Premier</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditLimit" className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Credit Limit
              </Label>
              <Input
                id="creditLimit"
                type="number"
                value={value.creditLimit}
                onChange={(e) => updateField('creditLimit', parseInt(e.target.value) || 0)}
                min={0}
                step={1000}
              />
              <p className="text-xs text-muted-foreground">
                Max for {value.accountTier}: {formatCurrency(selectedTierConfig.creditLimit)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Select
                value={value.paymentTerms}
                onValueChange={(v) => updateField('paymentTerms', v as PaymentTerms)}
              >
                <SelectTrigger id="paymentTerms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedTierConfig.terms.map((term) => (
                    <SelectItem key={term} value={term}>
                      {getPaymentTermsLabel(term)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tier Benefits Summary */}
        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="text-sm font-medium mb-2">
            {value.accountTier} Tier Benefits
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Max Credit</p>
              <p className="font-medium">{formatCurrency(selectedTierConfig.creditLimit)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Volume Discount</p>
              <p className="font-medium">{selectedTierConfig.discount}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Options</p>
              <p className="font-medium">{selectedTierConfig.terms.length} terms</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
