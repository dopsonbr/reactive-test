# 039B_POS_UI_COMPONENTS

**Status: DRAFT**

---

## Overview

New shared UI components and POS-specific components required for the full-featured POS application. These components will be added to the shared-ui library and a new pos-ui library.

**Related Plans:**
- `039_POS_SYSTEM.md` - Parent initiative
- `038A_SHARED_COMMERCE_COMPONENTS.md` - Extends shared UI work
- `039C_POS_APP_SCAFFOLD.md` - Uses these components

## Goals

1. Add essential shadcn/ui primitives to shared-ui/ui-components
2. Create DataTable component for searchable, sortable data grids
3. Create POS-specific compound components in new pos-ui library
4. Ensure all components have tests, stories, and a11y compliance

---

## Phase 1: Core UI Primitives

**Prereqs:** Existing shared-ui/ui-components
**Blockers:** None

Add these shadcn/ui components using generator:

### 1.1 Selection Components

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/select.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/radio-group.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/switch.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/combobox.tsx`

**Command:**
```bash
pnpm nx g @reactive-platform/workspace-plugin:ui-component Select
pnpm nx g @reactive-platform/workspace-plugin:ui-component RadioGroup
pnpm nx g @reactive-platform/workspace-plugin:ui-component Switch
pnpm nx g @reactive-platform/workspace-plugin:ui-component Combobox
```

### 1.2 Date/Time Components

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/calendar.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/date-picker.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/time-picker.tsx`

### 1.3 Overlay Components

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/dialog.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/sheet.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/popover.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/tooltip.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/dropdown-menu.tsx`

### 1.4 Navigation Components

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/tabs.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/navigation-menu.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/command.tsx`

### 1.5 Display Components

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/avatar.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/skeleton.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/separator.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/progress.tsx`

### 1.6 Feedback Components

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/toast.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/toaster.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/use-toast.ts`

---

## Phase 2: DataTable Component

**Prereqs:** Phase 1 complete (uses primitives)
**Blockers:** None

### 2.1 Core DataTable

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/data-table/DataTable.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/data-table/DataTableHeader.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/data-table/DataTableRow.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/data-table/DataTablePagination.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/data-table/DataTableFilters.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/data-table/index.ts`

**Implementation:**
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  error?: Error | null;

  // Pagination
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };

  // Sorting
  sorting?: {
    column: string;
    direction: 'asc' | 'desc';
    onSort: (column: string, direction: 'asc' | 'desc') => void;
  };

  // Selection
  selection?: {
    selected: string[];
    onSelect: (ids: string[]) => void;
    selectionKey: keyof T;
  };

  // Row actions
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;

  // Empty state
  emptyState?: React.ReactNode;
}

interface ColumnDef<T> {
  id: string;
  header: string | (() => React.ReactNode);
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}
```

### 2.2 DataTable with TanStack Table

**Dependencies:**
```json
{
  "@tanstack/react-table": "^8.x"
}
```

**Implementation Notes:**
- Use TanStack Table for core functionality
- Support server-side pagination, sorting, filtering
- Keyboard navigation for accessibility
- Responsive design with column hiding on mobile

---

## Phase 3: POS UI Library

**Prereqs:** Phases 1-2 complete
**Blockers:** None

### 3.1 Create Library Structure

**Files:**
- CREATE: `libs/frontend/shared-ui/pos-ui/project.json`
- CREATE: `libs/frontend/shared-ui/pos-ui/tsconfig.json`
- CREATE: `libs/frontend/shared-ui/pos-ui/tsconfig.lib.json`
- CREATE: `libs/frontend/shared-ui/pos-ui/vite.config.ts`
- CREATE: `libs/frontend/shared-ui/pos-ui/src/index.ts`
- MODIFY: `tsconfig.base.json` - Add path alias

**project.json:**
```json
{
  "name": "pos-ui",
  "tags": ["type:ui", "scope:pos", "platform:web"]
}
```

Path alias: `@reactive-platform/pos-ui`

### 3.2 TransactionHeader Component

**Files:**
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/TransactionHeader/TransactionHeader.tsx`
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/TransactionHeader/TransactionHeader.test.tsx`
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/TransactionHeader/TransactionHeader.stories.tsx`

**Implementation:**
```typescript
interface TransactionHeaderProps {
  transactionId: string;
  customer: CustomerSummary | null;
  itemCount: number;
  subtotal: number;
  status: 'draft' | 'in-progress' | 'checkout' | 'complete';
  onClearTransaction?: () => void;
  onViewCustomer?: () => void;
}

// Displays:
// - Transaction ID
// - Customer name/loyalty tier (or "Guest")
// - Item count
// - Running subtotal
// - Status indicator
// - Action buttons
```

### 3.3 LineItemRow Component

**Files:**
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/LineItemRow/LineItemRow.tsx`
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/LineItemRow/LineItemRow.test.tsx`

**Implementation:**
```typescript
interface LineItemRowProps {
  item: {
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discountPerItem: number;
    markdown?: MarkdownInfo;
  };
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onMarkdown: () => void;
  canApplyMarkdown: boolean;
  isEditable?: boolean;
}

// Shows:
// - SKU, name
// - Quantity with +/- controls
// - Unit price
// - Markdown indicator (if applied)
// - Line total
// - Remove button
// - Markdown button (if permitted)
```

### 3.4 MarkdownDialog Component

**Files:**
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/MarkdownDialog/MarkdownDialog.tsx`
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/MarkdownDialog/MarkdownDialog.test.tsx`

**Implementation:**
```typescript
interface MarkdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LineItem | null;  // null for cart-level
  userPermissionTier: MarkdownPermissionTier;
  onApply: (markdown: MarkdownInput) => void;
}

interface MarkdownInput {
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'OVERRIDE_PRICE';
  value: number;
  reason: MarkdownReason;
  notes?: string;
}

// Shows:
// - Item info (or "Entire Cart")
// - Markdown type selection (filtered by permission)
// - Value input
// - Reason selection (filtered by permission)
// - Notes field
// - Preview of new price
// - Apply/Cancel buttons
// - Limit indicators (e.g., "Max 15% for your role")
```

### 3.5 CustomerQuickView Component

**Files:**
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/CustomerQuickView/CustomerQuickView.tsx`

**Implementation:**
```typescript
interface CustomerQuickViewProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onViewOrders: () => void;
  onStartTransaction: () => void;
}

// Sheet component showing:
// - Customer name, email, phone
// - Loyalty tier and points
// - Account type (D2C/B2B)
// - Primary addresses
// - Recent orders summary
// - Quick actions
```

### 3.6 FulfillmentSelector Component

**Files:**
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/FulfillmentSelector/FulfillmentSelector.tsx`
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/FulfillmentSelector/FulfillmentGroup.tsx`

**Implementation:**
```typescript
interface FulfillmentSelectorProps {
  items: LineItem[];
  groups: FulfillmentGroup[];
  availableTypes: FulfillmentType[];
  onGroupsChange: (groups: FulfillmentGroup[]) => void;
  onFetchSlots: (type: FulfillmentType, date: Date) => Promise<Slot[]>;
}

// Supports:
// - Single fulfillment (all items same method)
// - Split fulfillment (different groups)
// - Drag items between groups
// - Date/time slot selection per group
// - Address entry for delivery groups
```

### 3.7 PaymentCapture Component

**Files:**
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/PaymentCapture/PaymentCapture.tsx`
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/PaymentCapture/CardNotPresentForm.tsx`
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/PaymentCapture/NetTermsForm.tsx`
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/PaymentCapture/CashForm.tsx`

**Implementation:**
```typescript
interface PaymentCaptureProps {
  amount: number;
  availableTypes: PaymentType[];
  customer: Customer | null;  // For wallet/net terms
  onCapture: (payment: PaymentMethod) => Promise<void>;
  onCancel: () => void;
}

// Shows:
// - Amount due
// - Payment type tabs
// - Type-specific form
// - Processing state
// - Success/failure feedback
```

### 3.8 SplitPaymentPanel Component

**Files:**
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/SplitPaymentPanel/SplitPaymentPanel.tsx`

**Implementation:**
```typescript
interface SplitPaymentPanelProps {
  totalAmount: number;
  payments: Array<{ method: PaymentMethod; amount: number }>;
  onAddPayment: (method: PaymentMethod, amount: number) => void;
  onRemovePayment: (index: number) => void;
  onComplete: () => void;
}

// Shows:
// - Total due
// - Applied payments list with amounts
// - Remaining balance
// - Add payment button
// - Complete when balance is zero
```

### 3.9 ManagerOverrideDialog Component

**Files:**
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/ManagerOverrideDialog/ManagerOverrideDialog.tsx`

**Implementation:**
```typescript
interface ManagerOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;  // e.g., "Apply 30% markdown"
  currentLimit: MarkdownLimit;
  onAuthorize: (managerCredentials: { id: string; pin: string }) => Promise<boolean>;
}

// Shows:
// - Action being requested
// - Current employee's limit
// - Manager ID input
// - Manager PIN input
// - Authorize/Cancel buttons
// - Error feedback for invalid credentials
```

### 3.10 OrderStatusTimeline Component

**Files:**
- CREATE: `libs/frontend/shared-ui/pos-ui/src/components/OrderStatusTimeline/OrderStatusTimeline.tsx`

**Implementation:**
```typescript
interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: Date;
    userId: string;
    notes?: string;
  }>;
}

// Visual timeline showing:
// - All order statuses
// - Current status highlighted
// - Timestamps for each transition
// - User who made change
```

---

## Phase 4: Documentation & Stories

**Prereqs:** All components created
**Blockers:** None

### 4.1 Ladle Stories for All Components

Each component needs:
- Default story
- All variants/states
- Interactive controls
- Accessibility documentation

### 4.2 Component Documentation

**Files:**
- CREATE: `libs/frontend/shared-ui/pos-ui/README.md`
- CREATE: `libs/frontend/shared-ui/pos-ui/AGENTS.md`

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `ui-components/select.tsx` | Dropdown select |
| CREATE | `ui-components/radio-group.tsx` | Radio buttons |
| CREATE | `ui-components/dialog.tsx` | Modal dialogs |
| CREATE | `ui-components/sheet.tsx` | Slide-over panels |
| CREATE | `ui-components/tabs.tsx` | Tab navigation |
| CREATE | `ui-components/command.tsx` | Command palette |
| CREATE | `ui-components/data-table/` | Data grid component |
| CREATE | `pos-ui/` | POS-specific library |
| CREATE | `pos-ui/TransactionHeader/` | Transaction header |
| CREATE | `pos-ui/LineItemRow/` | Line item display |
| CREATE | `pos-ui/MarkdownDialog/` | Markdown application |
| CREATE | `pos-ui/FulfillmentSelector/` | Fulfillment config |
| CREATE | `pos-ui/PaymentCapture/` | Payment entry |

---

## Testing Strategy

**Unit Tests:**
- All components with RTL
- Edge cases (empty states, error states)
- Keyboard navigation

**Accessibility Tests:**
- axe-core for all components
- Focus management tests
- ARIA attribute tests

**Visual Tests:**
- Ladle stories for all variants
- Responsive behavior tests

---

## Checklist

- [ ] Phase 1: Core primitives added
- [ ] Phase 2: DataTable component complete
- [ ] Phase 3: POS-specific components created
- [ ] Phase 4: All stories and docs complete
- [ ] All a11y tests passing
