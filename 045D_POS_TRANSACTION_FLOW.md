# 045D_POS_TRANSACTION_FLOW

**Status: DRAFT**

---

## Overview

Core transaction flow implementation for the POS application. This covers the primary use case of creating and completing a sale, from initial item entry through checkout and receipt generation.

**Related Plans:**
- `045_POS_SYSTEM.md` - Parent initiative
- `045C_POS_APP_SCAFFOLD.md` - App foundation (prerequisite)
- `045E_POS_CUSTOMER_MANAGEMENT.md` - Customer integration
- `045F_POS_ADVANCED_FEATURES.md` - Advanced checkout features

## Goals

1. Implement item entry via SKU scan, search, or manual entry
2. Build cart management with quantity and item operations
3. Create customer association flow (optional for guest transactions)
4. Implement basic checkout with single fulfillment type
5. Support card-present payment capture
6. Generate transaction receipts

---

## Business Flow: Standard In-Store Transaction

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STANDARD TRANSACTION FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  START   │────▶│   ITEM   │────▶│ CUSTOMER │────▶│ CHECKOUT │────▶│ COMPLETE │
│TRANSACTION│     │  ENTRY   │     │(Optional)│     │ PAYMENT  │     │ RECEIPT  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │                │
     │                │                │                │                │
     ▼                ▼                ▼                ▼                ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│• New cart│     │• Scan SKU│     │• Lookup  │     │• Select  │     │• Print   │
│• Employee│     │• Search  │     │• Create  │     │  method  │     │• Email   │
│  login   │     │• Manual  │     │• Skip    │     │• Process │     │• New txn │
│• Store # │     │  entry   │     │  (guest) │     │• Confirm │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### Transaction State Machine

```
                    ┌───────────────────────────────────────────────────┐
                    │                                                   │
                    ▼                                                   │
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐│
│  IDLE   │───▶│ ACTIVE  │───▶│CHECKOUT │───▶│ PAYMENT │───▶│COMPLETE ││
│         │    │         │    │         │    │         │    │         ││
└─────────┘    └────┬────┘    └────┬────┘    └────┬────┘    └─────────┘│
                    │              │              │                     │
                    │              │              │         VOID        │
                    ▼              ▼              ▼         ┌───────────┘
               ┌─────────┐   ┌─────────┐   ┌─────────┐      │
               │SUSPENDED│   │  BACK   │   │DECLINED │      │
               │         │   │ TO CART │   │         │      │
               └─────────┘   └─────────┘   └─────────┘      │
                    │                           │           │
                    └───────────────────────────┴───────────┘
```

**State Descriptions:**

| State | Description | Valid Transitions |
|-------|-------------|-------------------|
| IDLE | No active transaction | → ACTIVE (new transaction) |
| ACTIVE | Items being added/modified | → CHECKOUT, SUSPENDED, VOID |
| CHECKOUT | Reviewing totals, selecting fulfillment | → PAYMENT, ACTIVE (back to cart) |
| PAYMENT | Processing payment | → COMPLETE, ACTIVE (declined) |
| COMPLETE | Transaction finalized | → IDLE (new transaction) |
| SUSPENDED | Temporarily held | → ACTIVE (resume), VOID |
| VOID | Transaction cancelled | → IDLE |

---

## Phase 1: Transaction Context & State

**Prereqs:** 045C complete (app scaffold, auth)
**Blockers:** None

### 1.1 Transaction State Model

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/types/transaction.ts`

**Implementation:**
```typescript
export type TransactionStatus =
  | 'IDLE'
  | 'ACTIVE'
  | 'CHECKOUT'
  | 'PAYMENT'
  | 'COMPLETE'
  | 'SUSPENDED'
  | 'VOID';

export interface Transaction {
  id: string;
  storeNumber: number;
  employeeId: string;
  status: TransactionStatus;

  // Cart
  items: LineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;

  // Customer (optional)
  customer: CustomerSummary | null;
  loyaltyApplied: boolean;

  // Fulfillment
  fulfillment: FulfillmentConfig | null;

  // Payment
  payments: PaymentRecord[];
  amountPaid: number;
  amountDue: number;

  // Timestamps
  startedAt: Date;
  completedAt: Date | null;
}

export interface LineItem {
  lineId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discountPerItem: number;
  markdown: MarkdownInfo | null;
  lineTotal: number;
}

export interface MarkdownInfo {
  markdownId: string;
  type: MarkdownType;
  value: number;
  reason: MarkdownReason;
  employeeId: string;
  approvedBy: string | null;  // Manager override
}
```

### 1.2 Transaction Context

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/context/TransactionContext.tsx`
- CREATE: `apps/pos-web/src/features/transaction/context/TransactionProvider.tsx`
- CREATE: `apps/pos-web/src/features/transaction/context/transactionReducer.ts`

**Implementation:**
```typescript
interface TransactionContextValue {
  transaction: Transaction | null;
  status: TransactionStatus;

  // Transaction lifecycle
  startTransaction: () => Promise<void>;
  suspendTransaction: () => Promise<void>;
  resumeTransaction: (transactionId: string) => Promise<void>;
  voidTransaction: (reason: string) => Promise<void>;

  // Items
  addItem: (sku: string, quantity?: number) => Promise<void>;
  updateItemQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  applyItemMarkdown: (lineId: string, markdown: MarkdownInput) => Promise<void>;

  // Customer
  setCustomer: (customer: CustomerSummary) => void;
  clearCustomer: () => void;

  // Checkout
  proceedToCheckout: () => void;
  returnToCart: () => void;
  setFulfillment: (config: FulfillmentConfig) => void;

  // Payment
  proceedToPayment: () => void;
  addPayment: (payment: PaymentMethod, amount: number) => Promise<void>;
  completeTransaction: () => Promise<TransactionReceipt>;
}
```

### 1.3 Transaction Reducer

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/context/transactionReducer.ts`

**Implementation:**
```typescript
type TransactionAction =
  | { type: 'START_TRANSACTION'; payload: { id: string; storeNumber: number; employeeId: string } }
  | { type: 'ADD_ITEM'; payload: LineItem }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { lineId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { lineId: string } }
  | { type: 'APPLY_MARKDOWN'; payload: { lineId: string; markdown: MarkdownInfo } }
  | { type: 'SET_CUSTOMER'; payload: CustomerSummary }
  | { type: 'CLEAR_CUSTOMER' }
  | { type: 'SET_STATUS'; payload: TransactionStatus }
  | { type: 'SET_FULFILLMENT'; payload: FulfillmentConfig }
  | { type: 'ADD_PAYMENT'; payload: { method: PaymentMethod; amount: number } }
  | { type: 'COMPLETE_TRANSACTION'; payload: { completedAt: Date } }
  | { type: 'VOID_TRANSACTION'; payload: { reason: string } }
  | { type: 'RESET' };

function calculateTotals(items: LineItem[]): TotalsSummary {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountTotal = items.reduce((sum, item) => sum + (item.discountPerItem * item.quantity), 0);
  // Tax calculation would depend on jurisdiction rules
  const taxTotal = subtotal * 0.08; // Example: 8% tax
  const grandTotal = subtotal + taxTotal;

  return { subtotal, discountTotal, taxTotal, grandTotal };
}
```

---

## Phase 2: Item Entry

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Item Entry Component

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/ItemEntry/ItemEntry.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/ItemEntry/SkuInput.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/ItemEntry/ProductSearch.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/ItemEntry/ItemEntry.test.tsx`

**Implementation:**
```typescript
interface ItemEntryProps {
  onItemAdded?: (item: LineItem) => void;
  autoFocus?: boolean;
}

// Item Entry supports three modes:
// 1. SKU Scan - Direct barcode/SKU entry
// 2. Search - Product name/description search
// 3. Manual - Full manual product entry

// Keyboard shortcuts:
// - F2: Focus SKU input
// - F3: Open product search
// - Enter: Add item (when SKU valid)
// - Tab: Move to quantity input
```

### 2.2 SKU Input with Barcode Support

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/hooks/useSKUInput.ts`

**Implementation:**
```typescript
interface UseSKUInputOptions {
  onValidSKU: (sku: string) => void;
  onInvalidSKU?: (sku: string) => void;
  debounceMs?: number;
}

// Handles:
// - Manual SKU typing
// - Barcode scanner input (rapid character entry detection)
// - UPC-A, EAN-13, Code 128 format detection
// - Invalid SKU feedback
```

### 2.3 Product Search Dialog

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/ItemEntry/ProductSearchDialog.tsx`
- CREATE: `apps/pos-web/src/features/transaction/hooks/useProductSearch.ts`

**Implementation:**
```typescript
interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelect: (product: Product) => void;
}

// Features:
// - Full-text search across name, description, SKU
// - Category filtering
// - Price display with current discounts
// - Availability indicator
// - Quick add with quantity
```

### 2.4 Product Lookup Hook

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/hooks/useProductLookup.ts`

**Implementation:**
```typescript
interface UseProductLookupResult {
  lookupProduct: (sku: string) => Promise<Product | null>;
  isLoading: boolean;
  error: Error | null;
}

// Uses TanStack Query for caching
// Invalidates on price changes
// Handles inventory checks
```

---

## Phase 3: Cart Management

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Cart Panel Component

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/CartPanel/CartPanel.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/CartPanel/CartHeader.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/CartPanel/CartItemList.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/CartPanel/CartTotals.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/CartPanel/CartPanel.test.tsx`

**Implementation:**
```typescript
interface CartPanelProps {
  transaction: Transaction;
  onQuantityChange: (lineId: string, quantity: number) => void;
  onRemoveItem: (lineId: string) => void;
  onItemMarkdown: (lineId: string) => void;
  onProceedToCheckout: () => void;
}

// Cart Panel layout:
// ┌─────────────────────────────────────────┐
// │ Cart Header (item count, customer)      │
// ├─────────────────────────────────────────┤
// │                                         │
// │ Line Item 1                             │
// │   SKU: ABC123  Qty: [1] [-] [+]  $19.99 │
// │                                         │
// │ Line Item 2 (with markdown)             │
// │   SKU: XYZ789  Qty: [2]         $29.98  │
// │   🏷️ 15% markdown (damaged)             │
// │                                         │
// │ ... more items ...                      │
// │                                         │
// ├─────────────────────────────────────────┤
// │ Subtotal:                       $49.97  │
// │ Discounts:                      -$4.50  │
// │ Tax:                             $3.64  │
// │ ─────────────────────────────────────── │
// │ TOTAL:                          $49.11  │
// ├─────────────────────────────────────────┤
// │      [Suspend]  [Checkout →]            │
// └─────────────────────────────────────────┘
```

### 3.2 Line Item Component

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/CartPanel/LineItemCard.tsx`

**Implementation:**
```typescript
interface LineItemCardProps {
  item: LineItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onMarkdown: () => void;
  canApplyMarkdown: boolean;
  isEditable: boolean;
}

// Features:
// - Quantity stepper (+/-)
// - Remove button
// - Markdown indicator
// - Price breakdown on hover
// - Swipe to remove (touch)
```

### 3.3 Quantity Input

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/CartPanel/QuantityInput.tsx`

**Implementation:**
```typescript
interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

// Supports:
// - +/- buttons
// - Direct numeric input
// - Keyboard arrows
// - Max quantity validation
// - Zero removes item (with confirmation)
```

---

## Phase 4: Customer Association

**Prereqs:** Phase 3 complete, 045E started
**Blockers:** None (can use mock customer data initially)

### 4.1 Customer Panel Component

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/CustomerPanel/CustomerPanel.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/CustomerPanel/CustomerLookup.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/CustomerPanel/CustomerSummaryCard.tsx`

**Implementation:**
```typescript
interface CustomerPanelProps {
  customer: CustomerSummary | null;
  onCustomerSelect: (customer: CustomerSummary) => void;
  onCustomerClear: () => void;
  onCreateCustomer: () => void;
  onEditCustomer: () => void;
}

// Customer Panel states:
// 1. No customer - Show lookup field
// 2. Customer selected - Show summary with loyalty
// 3. Guest checkout - Show "Continue as Guest" option
```

### 4.2 Quick Customer Lookup

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/CustomerPanel/QuickCustomerLookup.tsx`
- CREATE: `apps/pos-web/src/features/transaction/hooks/useCustomerLookup.ts`

**Implementation:**
```typescript
interface QuickCustomerLookupProps {
  onSelect: (customer: CustomerSummary) => void;
  placeholder?: string;
}

// Lookup methods:
// - Email (exact match)
// - Phone (exact match)
// - Name (fuzzy search)
// - Customer ID (exact match)
// - Loyalty card scan

// Uses customer autocomplete endpoint
```

### 4.3 Loyalty Display

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/CustomerPanel/LoyaltyBadge.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/CustomerPanel/PointsPreview.tsx`

**Implementation:**
```typescript
interface LoyaltyBadgeProps {
  tier: LoyaltyTier;
  points: number;
  multiplier: number;
}

interface PointsPreviewProps {
  currentPoints: number;
  pointsEarned: number;  // From this transaction
  multiplier: number;
}

// Shows:
// - Current tier badge (BRONZE, SILVER, GOLD, PLATINUM)
// - Points balance
// - Points to be earned
// - Progress to next tier
```

---

## Phase 5: Basic Checkout

**Prereqs:** Phase 4 complete
**Blockers:** None

### 5.1 Checkout Page

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/pages/CheckoutPage.tsx`
- CREATE: `apps/pos-web/src/app/routes/transaction.checkout.tsx`

**Implementation:**
```typescript
// Checkout page layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ Transaction #12345                              Associate: John D.  │
// ├─────────────────────────────────────────────────────────────────────┤
// │                                                                     │
// │  ┌─────────────────────────┐    ┌─────────────────────────────┐    │
// │  │    ORDER SUMMARY        │    │    FULFILLMENT              │    │
// │  │                         │    │                             │    │
// │  │  3 items                │    │  ○ Immediate (take now)    │    │
// │  │                         │    │  ○ Pickup (schedule)        │    │
// │  │  Item 1          $19.99 │    │  ○ Delivery (ship to)       │    │
// │  │  Item 2 (x2)     $39.98 │    │                             │    │
// │  │                         │    │  [Configure Fulfillment]    │    │
// │  │  ─────────────────────  │    │                             │    │
// │  │  Subtotal:       $59.97 │    └─────────────────────────────┘    │
// │  │  Discounts:      -$5.00 │                                       │
// │  │  Tax:             $4.40 │    ┌─────────────────────────────┐    │
// │  │  ─────────────────────  │    │    CUSTOMER                 │    │
// │  │  TOTAL:          $59.37 │    │                             │    │
// │  │                         │    │  Jane Smith                 │    │
// │  └─────────────────────────┘    │  jane@example.com           │    │
// │                                  │  Gold Member (2,500 pts)    │    │
// │                                  │                             │    │
// │                                  │  [Change Customer]          │    │
// │                                  └─────────────────────────────┘    │
// │                                                                     │
// ├─────────────────────────────────────────────────────────────────────┤
// │  [← Back to Cart]                              [Proceed to Payment] │
// └─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Fulfillment Selection (Basic)

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/FulfillmentPanel/FulfillmentPanel.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/FulfillmentPanel/ImmediateOption.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/FulfillmentPanel/PickupOption.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/FulfillmentPanel/DeliveryOption.tsx`

**Implementation:**
```typescript
interface FulfillmentPanelProps {
  selected: FulfillmentConfig | null;
  onChange: (config: FulfillmentConfig) => void;
  availableTypes: FulfillmentType[];
  storeNumber: number;
}

interface FulfillmentConfig {
  type: FulfillmentType;
  scheduledDate?: Date;
  timeSlot?: string;
  address?: Address;
  instructions?: string;
}

// Basic fulfillment (Phase 5):
// - Immediate (default for in-store)
// - Pickup with date selection
// - Delivery with address entry

// Advanced fulfillment (045F):
// - Multi-fulfillment (split items)
// - Will-call with time windows
// - Installation scheduling
```

### 5.3 Order Summary Component

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/CheckoutPanel/OrderSummary.tsx`

**Implementation:**
```typescript
interface OrderSummaryProps {
  transaction: Transaction;
  onEditItem?: (lineId: string) => void;
  editable?: boolean;
}

// Shows:
// - Line item list (condensed)
// - Applied discounts
// - Tax breakdown
// - Grand total
// - Edit links (if editable)
```

---

## Phase 6: Payment Processing

**Prereqs:** Phase 5 complete
**Blockers:** None

### 6.1 Payment Page

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/pages/PaymentPage.tsx`
- CREATE: `apps/pos-web/src/app/routes/transaction.payment.tsx`

**Implementation:**
```typescript
// Payment page layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ Payment                                           Total Due: $59.37 │
// ├─────────────────────────────────────────────────────────────────────┤
// │                                                                     │
// │  ┌─────────────────────────────────────────────────────────────┐   │
// │  │                    SELECT PAYMENT METHOD                     │   │
// │  │                                                              │   │
// │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │   │
// │  │  │   💳       │  │   💵       │  │   🎁       │            │   │
// │  │  │   CARD     │  │   CASH     │  │ GIFT CARD  │            │   │
// │  │  │            │  │            │  │            │            │   │
// │  │  └────────────┘  └────────────┘  └────────────┘            │   │
// │  │                                                              │   │
// │  └─────────────────────────────────────────────────────────────┘   │
// │                                                                     │
// │  ┌─────────────────────────────────────────────────────────────┐   │
// │  │                    CARD PAYMENT                              │   │
// │  │                                                              │   │
// │  │  Waiting for card...                                        │   │
// │  │                                                              │   │
// │  │  [Insert, swipe, or tap card on terminal]                   │   │
// │  │                                                              │   │
// │  │  Amount: $59.37                                              │   │
// │  │                                                              │   │
// │  └─────────────────────────────────────────────────────────────┘   │
// │                                                                     │
// ├─────────────────────────────────────────────────────────────────────┤
// │  [← Back]                                           [Cancel Payment]│
// └─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Card Present Payment

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/PaymentPanel/CardPresentPayment.tsx`
- CREATE: `apps/pos-web/src/features/transaction/hooks/useCardPayment.ts`

**Implementation:**
```typescript
interface CardPresentPaymentProps {
  amount: number;
  onSuccess: (result: CardPaymentResult) => void;
  onError: (error: PaymentError) => void;
  onCancel: () => void;
}

interface CardPaymentResult {
  authorizationCode: string;
  cardBrand: string;
  lastFour: string;
  isDebit: boolean;
}

// States:
// 1. WAITING - Waiting for card
// 2. READING - Card detected, reading
// 3. PROCESSING - Sending to processor
// 4. APPROVED - Payment approved
// 5. DECLINED - Payment declined
// 6. ERROR - Processing error
```

### 6.3 Cash Payment

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/PaymentPanel/CashPayment.tsx`

**Implementation:**
```typescript
interface CashPaymentProps {
  amount: number;
  onComplete: (tendered: number, change: number) => void;
  onCancel: () => void;
}

// Features:
// - Quick tender buttons ($20, $50, $100, Exact)
// - Manual amount entry
// - Change calculation
// - Change due display
```

### 6.4 Payment Confirmation

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/PaymentPanel/PaymentConfirmation.tsx`

**Implementation:**
```typescript
interface PaymentConfirmationProps {
  transaction: Transaction;
  onPrintReceipt: () => void;
  onEmailReceipt: () => void;
  onNewTransaction: () => void;
}

// Shows:
// - Payment approved message
// - Receipt options
// - New transaction button
```

---

## Phase 7: Receipt Generation

**Prereqs:** Phase 6 complete
**Blockers:** None

### 7.1 Receipt Component

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/ReceiptPanel/Receipt.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/ReceiptPanel/ReceiptHeader.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/ReceiptPanel/ReceiptLineItems.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/ReceiptPanel/ReceiptFooter.tsx`

**Implementation:**
```typescript
interface ReceiptProps {
  transaction: TransactionReceipt;
  variant: 'print' | 'email' | 'screen';
}

// Receipt sections:
// - Store header (name, address, phone)
// - Transaction info (ID, date, employee)
// - Customer info (if any)
// - Line items with prices
// - Discounts applied
// - Tax breakdown
// - Payment details
// - Points earned
// - Return policy
// - Barcode for lookup
```

### 7.2 Receipt Actions

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/hooks/useReceiptActions.ts`

**Implementation:**
```typescript
interface UseReceiptActionsResult {
  printReceipt: () => Promise<void>;
  emailReceipt: (email: string) => Promise<void>;
  downloadReceipt: () => void;
  isPrinting: boolean;
  isEmailing: boolean;
}
```

---

## Phase 8: Transaction Route Integration

**Prereqs:** All phases complete
**Blockers:** None

### 8.1 Transaction Layout

**Files:**
- CREATE: `apps/pos-web/src/shared/layouts/TransactionLayout.tsx`

**Implementation:**
```typescript
// Transaction layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ Transaction #12345 │ ACTIVE │ Store 1234 │ John D. │  [Suspend] [X] │
// ├───────────────────────┬─────────────────────────────────────────────┤
// │                       │                                             │
// │    ITEM ENTRY         │              CART                           │
// │                       │                                             │
// │  [_______________]    │  Items...                                   │
// │   SKU / Search        │                                             │
// │                       │                                             │
// │  ┌───────────────┐    │                                             │
// │  │ Product Grid  │    │                                             │
// │  │ (favorites)   │    │                                             │
// │  └───────────────┘    │                                             │
// │                       │                                             │
// │                       ├─────────────────────────────────────────────┤
// │                       │  Customer: Jane Smith (Gold)                │
// │                       │  Total: $59.37         [Checkout →]         │
// └───────────────────────┴─────────────────────────────────────────────┘
```

### 8.2 Route Configuration

**Files:**
- MODIFY: `apps/pos-web/src/app/router.tsx`
- CREATE: `apps/pos-web/src/app/routes/transaction.index.tsx`
- CREATE: `apps/pos-web/src/app/routes/transaction.checkout.tsx`
- CREATE: `apps/pos-web/src/app/routes/transaction.payment.tsx`
- CREATE: `apps/pos-web/src/app/routes/transaction.complete.tsx`

**Implementation:**
```typescript
const transactionRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'transaction',
  component: TransactionLayout,
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission(Permission.TRANSACTION_CREATE)) {
      throw redirect({ to: '/' });
    }
  },
});

const transactionIndexRoute = createRoute({
  getParentRoute: () => transactionRoute,
  path: '/',
  component: TransactionPage,  // Item entry + cart
});

const checkoutRoute = createRoute({
  getParentRoute: () => transactionRoute,
  path: 'checkout',
  component: CheckoutPage,
  beforeLoad: ({ context }) => {
    const { transaction } = context;
    if (!transaction || transaction.items.length === 0) {
      throw redirect({ to: '/transaction' });
    }
  },
});

// ... payment and complete routes
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `features/transaction/types/transaction.ts` | Type definitions |
| CREATE | `features/transaction/context/` | Transaction state management |
| CREATE | `features/transaction/components/ItemEntry/` | SKU input, product search |
| CREATE | `features/transaction/components/CartPanel/` | Cart display and management |
| CREATE | `features/transaction/components/CustomerPanel/` | Customer lookup and display |
| CREATE | `features/transaction/components/FulfillmentPanel/` | Fulfillment selection |
| CREATE | `features/transaction/components/PaymentPanel/` | Payment capture |
| CREATE | `features/transaction/components/ReceiptPanel/` | Receipt generation |
| CREATE | `features/transaction/pages/` | Transaction flow pages |
| CREATE | `features/transaction/hooks/` | Transaction hooks |
| CREATE | `shared/layouts/TransactionLayout.tsx` | Transaction page layout |
| CREATE | `app/routes/transaction.*.tsx` | Transaction routes |

---

## Testing Strategy

### Unit Tests

| Component | Test Coverage |
|-----------|---------------|
| TransactionContext | State transitions, item operations, totals |
| ItemEntry | SKU validation, barcode detection, search |
| CartPanel | Quantity changes, remove, markdown display |
| PaymentPanel | Payment states, success/error handling |

### Integration Tests

| Flow | Test Scenarios |
|------|----------------|
| Item Entry | SKU lookup success/failure, search results, manual entry |
| Cart Operations | Add/remove/quantity, markdown application |
| Checkout | Fulfillment selection, customer association |
| Payment | Card success, card declined, cash with change |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| F2 | Focus SKU input |
| F3 | Open product search |
| F4 | Customer lookup |
| F8 | Suspend transaction |
| F9 | Proceed to checkout |
| F12 | Complete payment |
| Esc | Cancel/back |

---

## Checklist

- [ ] Phase 1: Transaction context and state
- [ ] Phase 2: Item entry components
- [ ] Phase 3: Cart management
- [ ] Phase 4: Customer association
- [ ] Phase 5: Basic checkout
- [ ] Phase 6: Payment processing
- [ ] Phase 7: Receipt generation
- [ ] Phase 8: Route integration
- [ ] All keyboard shortcuts working
- [ ] Tests passing
