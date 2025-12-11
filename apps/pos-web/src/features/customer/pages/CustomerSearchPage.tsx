import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCustomerSearch } from '../hooks/useCustomerSearch';
import {
  CustomerSearchForm,
  CustomerFilters,
  CustomerResultsTable,
} from '../components/CustomerSearch';
import { usePermission, Permission } from '../../auth';
import type { Customer } from '../types/customer';
import {
  Button,
} from '@reactive-platform/shared-ui-components';

export function CustomerSearchPage() {
  const navigate = useNavigate();
  const canCreate = usePermission(Permission.CUSTOMER_CREATE);

  const {
    customers,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    query,
    setQuery,
    filters,
    setFilters,
    sortBy,
    sortDirection,
    setSort,
    nextPage,
    prevPage,
  } = useCustomerSearch();

  const handleSelectCustomer = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleEditCustomer = (customerId: string) => {
    navigate(`/customers/${customerId}/edit`);
  };

  const handleStartTransaction = (customer: Customer) => {
    // Navigate to transaction with customer pre-selected
    navigate('/transaction', {
      state: {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
      },
    });
  };

  const handleNewCustomer = () => {
    navigate('/customers/new');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Search</h1>
          <p className="text-muted-foreground">
            Search and manage customer accounts
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleNewCustomer} className="gap-2">
            <Plus className="h-4 w-4" />
            New Customer
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <CustomerSearchForm value={query} onChange={setQuery} autoFocus />
        <CustomerFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Results */}
      <CustomerResultsTable
        customers={customers}
        isLoading={isLoading}
        onSelect={handleSelectCustomer}
        onEdit={handleEditCustomer}
        onStartTransaction={handleStartTransaction}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={setSort}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />
    </div>
  );
}
