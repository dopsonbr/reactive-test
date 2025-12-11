import { Filter } from 'lucide-react';
import type { CustomerFilters as Filters } from '../../hooks/useCustomerSearch';
import type { CustomerType, CustomerStatus, LoyaltyTier, AccountTier } from '../../types/customer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from '@reactive-platform/shared-ui-components';

interface CustomerFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function CustomerFilters({ filters, onChange }: CustomerFiltersProps) {
  const handleTypeChange = (value: string) => {
    onChange({
      ...filters,
      type: value === 'all' ? undefined : (value as CustomerType),
      // Clear tier filters when type changes
      loyaltyTier: value === 'BUSINESS' ? undefined : filters.loyaltyTier,
      accountTier: value === 'CONSUMER' ? undefined : filters.accountTier,
    });
  };

  const handleStatusChange = (value: string) => {
    onChange({
      ...filters,
      status: value === 'all' ? undefined : (value as CustomerStatus),
    });
  };

  const handleLoyaltyTierChange = (value: string) => {
    onChange({
      ...filters,
      loyaltyTier: value === 'all' ? undefined : (value as LoyaltyTier),
    });
  };

  const handleAccountTierChange = (value: string) => {
    onChange({
      ...filters,
      accountTier: value === 'all' ? undefined : (value as AccountTier),
    });
  };

  const clearFilters = () => {
    onChange({
      status: 'ACTIVE',
    });
  };

  const hasActiveFilters =
    filters.type !== undefined ||
    filters.loyaltyTier !== undefined ||
    filters.accountTier !== undefined ||
    filters.status !== 'ACTIVE';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filters:</span>
      </div>

      {/* Customer Type */}
      <Select value={filters.type || 'all'} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="CONSUMER">Consumer (D2C)</SelectItem>
          <SelectItem value="BUSINESS">Business (B2B)</SelectItem>
        </SelectContent>
      </Select>

      {/* Loyalty Tier (only for consumers) */}
      {filters.type !== 'BUSINESS' && (
        <Select value={filters.loyaltyTier || 'all'} onValueChange={handleLoyaltyTierChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Loyalty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="BRONZE">Bronze</SelectItem>
            <SelectItem value="SILVER">Silver</SelectItem>
            <SelectItem value="GOLD">Gold</SelectItem>
            <SelectItem value="PLATINUM">Platinum</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Account Tier (only for business) */}
      {filters.type === 'BUSINESS' && (
        <Select value={filters.accountTier || 'all'} onValueChange={handleAccountTierChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Account Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="STANDARD">Standard</SelectItem>
            <SelectItem value="PREFERRED">Preferred</SelectItem>
            <SelectItem value="PREMIER">Premier</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Status */}
      <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear
        </Button>
      )}
    </div>
  );
}
