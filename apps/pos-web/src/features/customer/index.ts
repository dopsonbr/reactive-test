// Types
export type {
  Customer,
  CustomerInput,
  CustomerType,
  CustomerStatus,
  CustomerSuggestion,
  CustomerSearchParams,
  CustomerSearchResult,
  CustomerStats,
  LoyaltyTier,
  LoyaltyInfo,
  LoyaltyDetails,
  PointsTransaction,
  AccountTier,
  B2BInfo,
  B2BInfoInput,
  PaymentTerms,
  CreditUtilization,
  Address,
  AddressInput,
  AddressType,
  CommunicationPreferences,
  CustomerActivity,
  ActivityType,
  CustomerNote,
  Order,
  OrderStatus,
} from './types/customer';

export { LOYALTY_TIERS, ACCOUNT_TIERS } from './types/customer';

// Hooks
export { useCustomerSearch } from './hooks/useCustomerSearch';
export type { UseCustomerSearchResult, CustomerFilters } from './hooks/useCustomerSearch';
export { useCustomerAutocomplete } from './hooks/useCustomerAutocomplete';
export type { UseCustomerAutocompleteResult } from './hooks/useCustomerAutocomplete';
export { useDebouncedValue } from './hooks/useDebouncedValue';
export {
  useCustomer,
  useCustomerStats,
  useCustomerOrders,
  useLoyaltyDetails,
  useCustomerActivity,
  useCreditUtilization,
} from './hooks/useCustomer';

// Components - Search
export {
  CustomerSearchForm,
  CustomerFilters as CustomerFiltersComponent,
  CustomerResultsTable,
  CustomerAutocomplete,
} from './components/CustomerSearch';

// Components - Detail
export {
  CustomerHeader,
  CustomerStats as CustomerStatsComponent,
  OverviewTab,
  OrdersTab,
  AddressesTab,
  LoyaltyTab,
  ActivityTab,
  B2BTab,
} from './components/CustomerDetail';

// Components - Form
export {
  CustomerForm,
  PersonalInfoSection,
  AddressSection,
  AddressFormDialog,
  CommunicationSection,
  B2BInfoSection,
} from './components/CustomerForm';

// Pages
export { CustomerSearchPage } from './pages/CustomerSearchPage';
export { CustomerDetailPage } from './pages/CustomerDetailPage';
export { CustomerFormPage } from './pages/CustomerFormPage';
