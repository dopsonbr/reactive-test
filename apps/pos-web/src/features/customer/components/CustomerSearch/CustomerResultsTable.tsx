import { MoreHorizontal, ArrowUpDown, Building2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Customer } from '../../types/customer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@reactive-platform/shared-ui-components';

interface CustomerResultsTableProps {
  customers: Customer[];
  isLoading: boolean;
  onSelect: (customer: Customer) => void;
  onEdit: (customerId: string) => void;
  onStartTransaction: (customer: Customer) => void;
  selectedId?: string;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  onSort: (column: string) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function CustomerResultsTable({
  customers,
  isLoading,
  onSelect,
  onEdit,
  onStartTransaction,
  selectedId,
  sortBy,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  totalCount,
  onNextPage,
  onPrevPage,
}: CustomerResultsTableProps) {
  const getSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === 'ASC' ? '↑' : '↓';
  };

  const renderTierBadge = (customer: Customer) => {
    if (customer.type === 'CONSUMER' && customer.loyalty) {
      const tierColors: Record<string, string> = {
        BRONZE: 'bg-amber-100 text-amber-800',
        SILVER: 'bg-gray-100 text-gray-800',
        GOLD: 'bg-yellow-100 text-yellow-800',
        PLATINUM: 'bg-violet-100 text-violet-800',
      };
      return (
        <Badge variant="secondary" className={tierColors[customer.loyalty.tier]}>
          {customer.loyalty.tier}
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

  const renderStatusBadge = (status: Customer['status']) => {
    const statusColors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-red-100 text-red-800',
    };
    return (
      <Badge variant="secondary" className={statusColors[status]}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        Loading customers...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No customers found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Showing {customers.length} of {totalCount} customers
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Type</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3 gap-1"
                  onClick={() => onSort('name')}
                >
                  Name
                  <ArrowUpDown className="h-4 w-4" />
                  {getSortIndicator('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3 gap-1"
                  onClick={() => onSort('email')}
                >
                  Email
                  <ArrowUpDown className="h-4 w-4" />
                  {getSortIndicator('email')}
                </Button>
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className={`cursor-pointer ${selectedId === customer.id ? 'bg-muted' : ''}`}
                onClick={() => onSelect(customer)}
              >
                <TableCell>
                  {customer.type === 'BUSINESS' ? (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    {customer.firstName} {customer.lastName}
                    {customer.b2bInfo && (
                      <div className="text-sm text-muted-foreground">
                        {customer.b2bInfo.companyName}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone || '-'}</TableCell>
                <TableCell>{renderTierBadge(customer)}</TableCell>
                <TableCell>{renderStatusBadge(customer.status)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelect(customer)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(customer.id)}>
                        Edit Customer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onStartTransaction(customer)}>
                        Start Transaction
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={currentPage >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
