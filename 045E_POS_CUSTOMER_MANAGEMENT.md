# 045E_POS_CUSTOMER_MANAGEMENT

**Status: DRAFT**

---

## Overview

Complete customer management functionality for the POS application, including advanced search, CRUD operations, B2B hierarchy management, and loyalty program integration.

**Related Plans:**
- `045_POS_SYSTEM.md` - Parent initiative
- `045C_POS_APP_SCAFFOLD.md` - App foundation (prerequisite)
- `045D_POS_TRANSACTION_FLOW.md` - Transaction customer integration
- `045A_POS_BACKEND_ENHANCEMENTS.md` - Backend search APIs

## Goals

1. Implement comprehensive customer search with filters and pagination
2. Create full customer CRUD (create, read, update, delete) operations
3. Build B2B customer hierarchy visualization and management
4. Integrate loyalty program display and point redemption
5. Support multiple addresses and communication preferences

---

## Business Context: Customer Types

### D2C (Direct to Consumer) Customers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        D2C CUSTOMER PROFILE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Personal Information          │  Loyalty Program                       │
│  ─────────────────────         │  ───────────────                       │
│  Name: Jane Smith              │  Tier: GOLD                            │
│  Email: jane@email.com         │  Points: 2,500                         │
│  Phone: (555) 123-4567         │  Multiplier: 1.5x                      │
│  Status: ACTIVE                │  Next Tier: 5,000 pts → PLATINUM       │
│                                │                                         │
│  Addresses                     │  Wallet                                 │
│  ─────────                     │  ──────                                 │
│  🏠 Home (Primary)             │  💳 Visa ****1234                       │
│     123 Main St, City, ST      │  💳 Mastercard ****5678                 │
│  🏢 Work                       │                                         │
│     456 Office Blvd, City, ST  │  Communication                          │
│                                │  ─────────────                          │
│                                │  ✓ Email promotions                     │
│                                │  ✓ SMS alerts                           │
│                                │  ✗ Direct mail                          │
│                                │                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### B2B (Business to Business) Customers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        B2B CUSTOMER HIERARCHY                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ACME Corporation (Parent Account)                                      │
│  ├── Account Tier: ENTERPRISE                                           │
│  ├── Credit Limit: $500,000                                             │
│  ├── Payment Terms: NET 60                                              │
│  ├── Sales Rep: Mike Johnson                                            │
│  │                                                                      │
│  ├── 📍 ACME - West Region (Child Account)                              │
│  │   ├── Contact: Sarah West                                            │
│  │   ├── Credit Limit: $100,000 (of parent)                             │
│  │   └── Ship-to Addresses: 12                                          │
│  │                                                                      │
│  ├── 📍 ACME - East Region (Child Account)                              │
│  │   ├── Contact: Tom East                                              │
│  │   ├── Credit Limit: $150,000 (of parent)                             │
│  │   └── Ship-to Addresses: 8                                           │
│  │                                                                      │
│  └── 📍 ACME - Central (Child Account)                                  │
│      ├── Contact: Amy Central                                           │
│      ├── Credit Limit: $75,000 (of parent)                              │
│      └── Ship-to Addresses: 5                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Account Tiers

| Tier | Credit Limit | Payment Terms | Discount | Features |
|------|-------------|---------------|----------|----------|
| **STANDARD** | $10,000 | NET 30 | 0% | Basic B2B |
| **PREFERRED** | $50,000 | NET 30/60 | 5% | Volume pricing |
| **PREMIER** | $200,000 | NET 30/60/90 | 10% | Dedicated rep |
| **ENTERPRISE** | $1,000,000+ | Custom | Custom | Full service |

### Loyalty Tiers

| Tier | Points Required | Earn Multiplier | Benefits |
|------|----------------|-----------------|----------|
| **BRONZE** | 0 | 1x | Base earn rate |
| **SILVER** | 1,000 | 1.25x | Early sale access |
| **GOLD** | 2,500 | 1.5x | Free shipping |
| **PLATINUM** | 5,000 | 2x | Exclusive events |

---

## Phase 1: Customer Search

**Prereqs:** 045C complete, 045A customer search APIs
**Blockers:** None

### 1.1 Customer Search Page

**Files:**
- CREATE: `apps/pos-web/src/features/customer/pages/CustomerSearchPage.tsx`
- CREATE: `apps/pos-web/src/app/routes/customers.index.tsx`

**Implementation:**
```typescript
// Customer search page layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ Customer Search                                    [+ New Customer] │
// ├─────────────────────────────────────────────────────────────────────┤
// │                                                                     │
// │  [Search: ________________________] [🔍]                           │
// │                                                                     │
// │  Filters:                                                           │
// │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
// │  │ Type ▼       │ │ Loyalty ▼    │ │ Status ▼     │                │
// │  │ All          │ │ All          │ │ Active       │                │
// │  └──────────────┘ └──────────────┘ └──────────────┘                │
// │                                                                     │
// │  Results: 47 customers                                              │
// │  ┌─────────────────────────────────────────────────────────────┐   │
// │  │ Name          │ Email              │ Type   │ Tier   │ ⋮    │   │
// │  ├─────────────────────────────────────────────────────────────┤   │
// │  │ Jane Smith    │ jane@email.com     │ D2C    │ GOLD   │ ⋮    │   │
// │  │ ACME Corp     │ orders@acme.com    │ B2B    │ PREM   │ ⋮    │   │
// │  │ Bob Johnson   │ bob@gmail.com      │ D2C    │ BRONZE │ ⋮    │   │
// │  │ ...           │                    │        │        │      │   │
// │  └─────────────────────────────────────────────────────────────┘   │
// │                                                                     │
// │  [← Prev] Page 1 of 5 [Next →]                                      │
// │                                                                     │
// └─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Search Form Component

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerSearch/CustomerSearchForm.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerSearch/CustomerFilters.tsx`

**Implementation:**
```typescript
interface CustomerSearchFormProps {
  initialQuery?: string;
  onSearch: (params: CustomerSearchParams) => void;
}

interface CustomerSearchParams {
  q?: string;           // Full-text query
  email?: string;       // Exact email match
  phone?: string;       // Exact phone match
  type?: CustomerType;  // CONSUMER | BUSINESS
  tier?: LoyaltyTier | AccountTier;
  status?: CustomerStatus;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}
```

### 1.3 Customer Search Hook

**Files:**
- CREATE: `apps/pos-web/src/features/customer/hooks/useCustomerSearch.ts`

**Implementation:**
```typescript
interface UseCustomerSearchResult {
  customers: Customer[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: Error | null;
  search: (params: CustomerSearchParams) => void;
  nextPage: () => void;
  prevPage: () => void;
  setSort: (column: string, direction: 'ASC' | 'DESC') => void;
}

// Uses TanStack Query with:
// - Debounced search
// - Pagination state
// - Sort state
// - Filter state
```

### 1.4 Customer Results Table

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerSearch/CustomerResultsTable.tsx`

**Implementation:**
```typescript
interface CustomerResultsTableProps {
  customers: Customer[];
  isLoading: boolean;
  onSelect: (customer: Customer) => void;
  onEdit: (customerId: string) => void;
  selectedId?: string;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  onSort: (column: string) => void;
}

// Uses DataTable component from shared-ui
// Columns:
// - Name (sortable)
// - Email (sortable)
// - Phone
// - Type (D2C/B2B)
// - Tier (loyalty or account)
// - Status
// - Actions menu
```

### 1.5 Customer Autocomplete

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerSearch/CustomerAutocomplete.tsx`
- CREATE: `apps/pos-web/src/features/customer/hooks/useCustomerAutocomplete.ts`

**Implementation:**
```typescript
interface CustomerAutocompleteProps {
  onSelect: (customer: CustomerSuggestion) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface CustomerSuggestion {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  loyaltyTier?: LoyaltyTier;
  accountTier?: AccountTier;
}

// Uses Combobox from shared-ui
// Debounced search (300ms)
// Min 2 characters to trigger
// Shows name, email, tier badge in dropdown
```

---

## Phase 2: Customer Detail View

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Customer Detail Page

**Files:**
- CREATE: `apps/pos-web/src/features/customer/pages/CustomerDetailPage.tsx`
- CREATE: `apps/pos-web/src/app/routes/customers.$customerId.tsx`

**Implementation:**
```typescript
// Customer detail page layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ ← Back to Search                                                    │
// ├─────────────────────────────────────────────────────────────────────┤
// │                                                                     │
// │  ┌───────────────────────────────────────────────────────────────┐ │
// │  │ 👤  Jane Smith                    GOLD ⭐  Active             │ │
// │  │     jane@email.com | (555) 123-4567                          │ │
// │  │     Member since: Jan 2022                                    │ │
// │  │                                   [Edit] [Start Transaction]  │ │
// │  └───────────────────────────────────────────────────────────────┘ │
// │                                                                     │
// │  ┌─────────────────────────────────────────────────────────────┐   │
// │  │ [Overview] [Orders] [Addresses] [Loyalty] [Activity]        │   │
// │  └─────────────────────────────────────────────────────────────┘   │
// │                                                                     │
// │  Tab Content...                                                     │
// │                                                                     │
// └─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Customer Header Component

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/CustomerHeader.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/CustomerStatusBadge.tsx`

**Implementation:**
```typescript
interface CustomerHeaderProps {
  customer: Customer;
  onEdit: () => void;
  onStartTransaction: () => void;
  canEdit: boolean;
  canCreateTransaction: boolean;
}

// Shows:
// - Avatar or initials
// - Name
// - Contact info
// - Type badge (D2C/B2B)
// - Loyalty/Account tier badge
// - Status badge
// - Quick actions
```

### 2.3 Customer Tabs

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/CustomerTabs.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/OverviewTab.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/OrdersTab.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/AddressesTab.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/LoyaltyTab.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/ActivityTab.tsx`

**Tab Contents:**

```typescript
// Overview Tab
// - Summary statistics
// - Recent orders (last 5)
// - Primary address
// - Communication preferences

// Orders Tab
// - Full order history with DataTable
// - Order status filters
// - Date range filter
// - Click to view order details

// Addresses Tab
// - All addresses with type (billing, shipping, both)
// - Add/edit/delete addresses
// - Set primary address

// Loyalty Tab (D2C only)
// - Points balance
// - Points history
// - Tier progress
// - Rewards redemption

// Activity Tab
// - Audit log of customer interactions
// - Orders, returns, support tickets
// - Points earned/redeemed
```

### 2.4 Customer Overview

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/CustomerOverview.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/CustomerStats.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/RecentOrdersList.tsx`

**Implementation:**
```typescript
interface CustomerOverviewProps {
  customer: Customer;
  stats: CustomerStats;
  recentOrders: Order[];
}

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
  lifetimePoints: number;
  currentPoints: number;
}
```

---

## Phase 3: Customer Create/Edit

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Customer Form Page

**Files:**
- CREATE: `apps/pos-web/src/features/customer/pages/CustomerFormPage.tsx`
- CREATE: `apps/pos-web/src/app/routes/customers.new.tsx`
- CREATE: `apps/pos-web/src/app/routes/customers.$customerId.edit.tsx`

**Implementation:**
```typescript
interface CustomerFormPageProps {
  mode: 'create' | 'edit';
  customerId?: string;
}

// Uses same form component for create and edit
// Pre-populates for edit mode
```

### 3.2 Customer Form Component

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerForm/CustomerForm.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerForm/PersonalInfoSection.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerForm/ContactInfoSection.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerForm/AddressSection.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerForm/CommunicationSection.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerForm/B2BInfoSection.tsx`

**Implementation:**
```typescript
interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: CustomerInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  addresses: AddressInput[];
  communicationPreferences: CommunicationPreferences;
  // B2B only
  b2bInfo?: B2BInfoInput;
}

// Form layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ [Create / Edit] Customer                                            │
// ├─────────────────────────────────────────────────────────────────────┤
// │                                                                     │
// │  Customer Type:  ○ Consumer (D2C)  ○ Business (B2B)                │
// │                                                                     │
// │  ─────────────────────────────────────────────────────────────────  │
// │                                                                     │
// │  PERSONAL INFORMATION                                               │
// │  Name: [_______________________]                                    │
// │  Email: [______________________]                                    │
// │  Phone: [______________________]                                    │
// │                                                                     │
// │  ─────────────────────────────────────────────────────────────────  │
// │                                                                     │
// │  ADDRESSES                                [+ Add Address]           │
// │  ┌─────────────────────────────────────────────────────────────┐   │
// │  │ 🏠 Home (Primary)                               [Edit] [✕]  │   │
// │  │    123 Main St, City, ST 12345                              │   │
// │  └─────────────────────────────────────────────────────────────┘   │
// │                                                                     │
// │  ─────────────────────────────────────────────────────────────────  │
// │                                                                     │
// │  COMMUNICATION PREFERENCES                                          │
// │  ☑ Email promotions                                                 │
// │  ☑ SMS alerts                                                       │
// │  ☐ Direct mail                                                      │
// │                                                                     │
// │  ─────────────────────────────────────────────────────────────────  │
// │                                                                     │
// │  [Cancel]                                              [Save]       │
// └─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Address Form Dialog

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerForm/AddressFormDialog.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerForm/AddressTypeSelect.tsx`

**Implementation:**
```typescript
interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAddress?: Address;
  onSave: (address: AddressInput) => void;
}

interface AddressInput {
  type: AddressType;  // SHIPPING | BILLING | BOTH
  name: string;       // Address label
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

// Includes:
// - Address type selection
// - Address autocomplete (future)
// - Validation (postal code format, required fields)
```

### 3.4 Customer Mutation Hooks

**Files:**
- CREATE: `apps/pos-web/src/features/customer/hooks/useCreateCustomer.ts`
- CREATE: `apps/pos-web/src/features/customer/hooks/useUpdateCustomer.ts`
- CREATE: `apps/pos-web/src/features/customer/hooks/useDeleteCustomer.ts`

**Implementation:**
```typescript
interface UseCreateCustomerResult {
  createCustomer: (input: CustomerInput) => Promise<Customer>;
  isCreating: boolean;
  error: Error | null;
}

interface UseUpdateCustomerResult {
  updateCustomer: (id: string, input: Partial<CustomerInput>) => Promise<Customer>;
  isUpdating: boolean;
  error: Error | null;
}

interface UseDeleteCustomerResult {
  deleteCustomer: (id: string) => Promise<void>;
  isDeleting: boolean;
  error: Error | null;
}

// All mutations:
// - Use TanStack Query mutations
// - Invalidate search results on success
// - Show toast on success/error
// - Handle validation errors from backend
```

---

## Phase 4: B2B Customer Features

**Prereqs:** Phase 3 complete
**Blockers:** None

### 4.1 B2B Info Form Section

**Files:**
- MODIFY: `apps/pos-web/src/features/customer/components/CustomerForm/B2BInfoSection.tsx`

**Implementation:**
```typescript
interface B2BInfoSectionProps {
  value: B2BInfoInput;
  onChange: (value: B2BInfoInput) => void;
  errors: Record<string, string>;
}

interface B2BInfoInput {
  companyInfo: {
    companyName: string;
    taxId: string;
    industry?: string;
    website?: string;
  };
  accountTier: AccountTier;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  parentCustomerId?: string;  // For child accounts
  salesRepId?: string;
}

// B2B section shows:
// - Company name, Tax ID
// - Account tier selection
// - Credit limit
// - Payment terms (NET 30/60/90)
// - Parent account lookup (for child accounts)
// - Sales rep assignment
```

### 4.2 B2B Hierarchy View

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/B2BHierarchy/B2BHierarchyTree.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/B2BHierarchy/B2BAccountNode.tsx`

**Implementation:**
```typescript
interface B2BHierarchyTreeProps {
  parentCustomer: Customer;
  childAccounts: Customer[];
  onSelectAccount: (customerId: string) => void;
  selectedAccountId?: string;
}

// Displays:
// - Parent account at top
// - Child accounts as tree nodes
// - Credit allocation per child
// - Quick stats per account
// - Click to navigate to account detail
```

### 4.3 B2B Dashboard Tab

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/B2BTab.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/CreditSummary.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/PaymentTermsDisplay.tsx`

**Implementation:**
```typescript
interface B2BTabProps {
  customer: Customer;
  childAccounts: Customer[];
  creditUtilization: CreditUtilization;
}

interface CreditUtilization {
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  utilizationPercent: number;
  lastPaymentDate: Date | null;
  nextPaymentDue: Date | null;
}

// Shows:
// - Credit limit and utilization bar
// - Payment terms (NET 30/60/90)
// - Open invoices
// - Account hierarchy
// - Sales rep contact
```

### 4.4 Parent Account Selector

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/B2BHierarchy/ParentAccountSelector.tsx`

**Implementation:**
```typescript
interface ParentAccountSelectorProps {
  value: string | null;
  onChange: (parentId: string | null) => void;
  excludeIds: string[];  // Can't select self or children
}

// Used when:
// - Creating child B2B account
// - Reassigning account hierarchy
// - Shows only B2B parent accounts
```

---

## Phase 5: Loyalty Integration

**Prereqs:** Phase 4 complete
**Blockers:** None

### 5.1 Loyalty Tab

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/LoyaltyTab.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/LoyaltyTierCard.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/PointsHistory.tsx`
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/TierProgress.tsx`

**Implementation:**
```typescript
interface LoyaltyTabProps {
  customer: Customer;
  loyaltyDetails: LoyaltyDetails;
}

interface LoyaltyDetails {
  tier: LoyaltyTier;
  currentPoints: number;
  lifetimePoints: number;
  pointsToNextTier: number;
  nextTier: LoyaltyTier | null;
  multiplier: number;
  tierExpiration: Date | null;
  pointsHistory: PointsTransaction[];
}

interface PointsTransaction {
  id: string;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  points: number;
  balance: number;
  description: string;
  orderId?: string;
  date: Date;
}
```

### 5.2 Points Redemption

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/Loyalty/PointsRedemption.tsx`
- CREATE: `apps/pos-web/src/features/customer/hooks/useRedeemPoints.ts`

**Implementation:**
```typescript
interface PointsRedemptionProps {
  customerId: string;
  availablePoints: number;
  onRedeem: (points: number) => Promise<void>;
}

// Used during checkout to apply points as payment
// Shows:
// - Available points
// - Point value ($1 per 100 points, configurable)
// - Max redeemable
// - Redemption confirmation
```

### 5.3 Loyalty Enrollment

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/Loyalty/LoyaltyEnrollment.tsx`
- CREATE: `apps/pos-web/src/features/customer/hooks/useEnrollLoyalty.ts`

**Implementation:**
```typescript
interface LoyaltyEnrollmentProps {
  customer: Customer;
  onEnroll: () => Promise<void>;
  onSkip: () => void;
}

// Shows enrollment benefits
// Captures opt-in preferences
// Associates loyalty account
```

---

## Phase 6: Customer Activity & Orders

**Prereqs:** Phase 5 complete
**Blockers:** None

### 6.1 Orders Tab

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/OrdersTab.tsx`
- CREATE: `apps/pos-web/src/features/customer/hooks/useCustomerOrders.ts`

**Implementation:**
```typescript
interface OrdersTabProps {
  customerId: string;
}

// Uses DataTable with:
// - Order number
// - Date
// - Status
// - Total
// - Items count
// - Actions (view, reorder)

// Filters:
// - Date range
// - Status
// - Store
```

### 6.2 Activity Tab

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/ActivityTab.tsx`
- CREATE: `apps/pos-web/src/features/customer/hooks/useCustomerActivity.ts`

**Implementation:**
```typescript
interface ActivityTabProps {
  customerId: string;
}

interface CustomerActivity {
  id: string;
  type: ActivityType;
  description: string;
  metadata: Record<string, unknown>;
  userId: string;
  timestamp: Date;
}

type ActivityType =
  | 'ORDER_PLACED'
  | 'ORDER_CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_COMPLETED'
  | 'PROFILE_UPDATED'
  | 'ADDRESS_ADDED'
  | 'ADDRESS_UPDATED'
  | 'LOYALTY_ENROLLED'
  | 'POINTS_EARNED'
  | 'POINTS_REDEEMED'
  | 'SUPPORT_TICKET'
  | 'NOTE_ADDED';

// Timeline view of customer interactions
// Filterable by activity type
// Click for details
```

### 6.3 Customer Notes

**Files:**
- CREATE: `apps/pos-web/src/features/customer/components/CustomerDetail/CustomerNotes.tsx`
- CREATE: `apps/pos-web/src/features/customer/hooks/useCustomerNotes.ts`

**Implementation:**
```typescript
interface CustomerNotesProps {
  customerId: string;
  canAddNotes: boolean;
}

interface CustomerNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  isPinned: boolean;
}

// Notes functionality:
// - Add new notes
// - Pin important notes
// - Delete own notes
// - View note history
```

---

## Phase 7: Route Integration

**Prereqs:** All phases complete
**Blockers:** None

### 7.1 Customer Routes

**Files:**
- MODIFY: `apps/pos-web/src/app/router.tsx`
- CREATE: `apps/pos-web/src/app/routes/customers.tsx`
- CREATE: `apps/pos-web/src/app/routes/customers.index.tsx`
- CREATE: `apps/pos-web/src/app/routes/customers.$customerId.tsx`
- CREATE: `apps/pos-web/src/app/routes/customers.$customerId.edit.tsx`
- CREATE: `apps/pos-web/src/app/routes/customers.new.tsx`

**Implementation:**
```typescript
const customersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'customers',
  component: CustomersLayout,
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission(Permission.CUSTOMER_VIEW)) {
      throw redirect({ to: '/' });
    }
  },
});

const customersIndexRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '/',
  component: CustomerSearchPage,
});

const customerDetailRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '$customerId',
  component: CustomerDetailPage,
  loader: ({ params }) => fetchCustomer(params.customerId),
});

const customerEditRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '$customerId/edit',
  component: CustomerFormPage,
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission(Permission.CUSTOMER_EDIT)) {
      throw redirect({ to: '..' });
    }
  },
});

const customerCreateRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: 'new',
  component: CustomerFormPage,
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission(Permission.CUSTOMER_CREATE)) {
      throw redirect({ to: '/customers' });
    }
  },
});
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `features/customer/pages/` | Customer pages |
| CREATE | `features/customer/components/CustomerSearch/` | Search components |
| CREATE | `features/customer/components/CustomerDetail/` | Detail view tabs |
| CREATE | `features/customer/components/CustomerForm/` | Create/edit form |
| CREATE | `features/customer/components/B2BHierarchy/` | B2B hierarchy |
| CREATE | `features/customer/components/Loyalty/` | Loyalty components |
| CREATE | `features/customer/hooks/` | Data fetching hooks |
| CREATE | `app/routes/customers.*.tsx` | Customer routes |

---

## Permission Matrix

| Action | ASSOCIATE | SUPERVISOR | MANAGER | ADMIN | CONTACT_CENTER | B2B_SALES |
|--------|-----------|------------|---------|-------|----------------|-----------|
| View Customer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Search Advanced | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Customer | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Customer | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| Delete Customer | - | - | ✓ | ✓ | - | - |
| View B2B Info | - | - | ✓ | ✓ | - | ✓ |
| Manage B2B | - | - | ✓ | ✓ | - | ✓ |

---

## Testing Strategy

### Unit Tests

| Component | Test Coverage |
|-----------|---------------|
| CustomerSearchForm | Query parsing, filter handling |
| CustomerForm | Validation, B2B conditional fields |
| B2BHierarchyTree | Tree rendering, selection |
| LoyaltyTab | Points display, tier progress |

### Integration Tests

| Flow | Test Scenarios |
|------|----------------|
| Search | Full-text, filters, pagination, sorting |
| Create | D2C customer, B2B customer, validation errors |
| Edit | Profile update, address add/remove, B2B changes |
| Loyalty | Points history, redemption |

---

## Checklist

- [ ] Phase 1: Customer search complete
- [ ] Phase 2: Customer detail view complete
- [ ] Phase 3: Customer create/edit complete
- [ ] Phase 4: B2B features complete
- [ ] Phase 5: Loyalty integration complete
- [ ] Phase 6: Activity and orders complete
- [ ] Phase 7: Routes integrated
- [ ] All permissions enforced
- [ ] Tests passing
