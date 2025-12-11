import { User, Building2, Mail, Phone, Calendar, Edit, ShoppingCart } from 'lucide-react';
import type { Customer } from '../../types/customer';
import {
  Badge,
  Button,
  Avatar,
  AvatarFallback,
} from '@reactive-platform/shared-ui-components';

interface CustomerHeaderProps {
  customer: Customer;
  onEdit: () => void;
  onStartTransaction: () => void;
  canEdit: boolean;
  canCreateTransaction: boolean;
}

export function CustomerHeader({
  customer,
  onEdit,
  onStartTransaction,
  canEdit,
  canCreateTransaction,
}: CustomerHeaderProps) {
  const initials = `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();
  const fullName = `${customer.firstName} ${customer.lastName}`;

  const getTierBadge = () => {
    if (customer.type === 'CONSUMER' && customer.loyalty) {
      const tierColors: Record<string, string> = {
        BRONZE: 'bg-amber-100 text-amber-800',
        SILVER: 'bg-gray-100 text-gray-800',
        GOLD: 'bg-yellow-100 text-yellow-800',
        PLATINUM: 'bg-violet-100 text-violet-800',
      };
      return (
        <Badge variant="secondary" className={tierColors[customer.loyalty.tier]}>
          {customer.loyalty.tier} ⭐
        </Badge>
      );
    }
    if (customer.type === 'BUSINESS' && customer.b2bInfo) {
      const tierColors: Record<string, string> = {
        STANDARD: 'bg-slate-100 text-slate-800',
        PREFERRED: 'bg-blue-100 text-blue-800',
        PREMIER: 'bg-indigo-100 text-indigo-800',
        ENTERPRISE: 'bg-purple-100 text-purple-800',
      };
      return (
        <Badge variant="secondary" className={tierColors[customer.b2bInfo.accountTier]}>
          {customer.b2bInfo.accountTier}
        </Badge>
      );
    }
    return null;
  };

  const getStatusBadge = () => {
    const statusColors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-red-100 text-red-800',
    };
    return (
      <Badge variant="secondary" className={statusColors[customer.status]}>
        {customer.status}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{fullName}</h1>
            {customer.type === 'BUSINESS' ? (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
            {getTierBadge()}
            {getStatusBadge()}
          </div>

          {customer.b2bInfo && (
            <p className="text-lg text-muted-foreground">
              {customer.b2bInfo.companyName}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {customer.email}
            </span>
            {customer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {customer.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Member since {formatDate(customer.createdAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={onEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          {canCreateTransaction && (
            <Button onClick={onStartTransaction} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Start Transaction
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
