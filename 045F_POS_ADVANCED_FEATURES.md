# 045F_POS_ADVANCED_FEATURES

**Status: DRAFT**

---

## Overview

Advanced POS features including employee markdown system with permission tiers, multi-fulfillment order management, B2B-specific order flows, and remote payment capture for contact center and B2B sales.

**Related Plans:**
- `045_POS_SYSTEM.md` - Parent initiative
- `045D_POS_TRANSACTION_FLOW.md` - Base transaction flow (prerequisite)
- `045E_POS_CUSTOMER_MANAGEMENT.md` - Customer management (prerequisite)
- `045A_POS_BACKEND_ENHANCEMENTS.md` - Backend APIs for these features

## Goals

1. Implement complete markdown/discount system with tiered permissions
2. Build multi-fulfillment order configuration (split shipments)
3. Create B2B-specific order flows (net terms, PO numbers, bulk orders)
4. Support remote payment capture (card not present, net terms)
5. Add manager override workflow for elevated permissions

---

## Business Context: Markdown Permission System

### Permission Tiers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MARKDOWN PERMISSION HIERARCHY                      │
└─────────────────────────────────────────────────────────────────────────┘

ADMIN (Override Authority)
    │
    │  Can approve ANY markdown, override price
    │  Reasons: ALL
    │  Max: UNLIMITED
    │
    ▼
MANAGER
    │
    │  Max: 50% or $500
    │  Reasons: + MANAGER_DISCRETION, LOYALTY_EXCEPTION
    │
    ▼
SUPERVISOR
    │
    │  Max: 25% or $100
    │  Reasons: + CUSTOMER_SERVICE, BUNDLE_DEAL
    │
    ▼
ASSOCIATE
    │
    │  Max: 15% or $50
    │  Reasons: DAMAGED_ITEM, PRICE_MATCH only

```

### Markdown Types

| Type | Description | Example |
|------|-------------|---------|
| **PERCENTAGE** | Percent off regular price | 15% off |
| **FIXED_AMOUNT** | Dollar amount off | $10 off |
| **OVERRIDE_PRICE** | Set specific price | Set to $99.99 |

### Markdown Reasons

| Reason | Description | Min Tier |
|--------|-------------|----------|
| **PRICE_MATCH** | Competitor price match | ASSOCIATE |
| **DAMAGED_ITEM** | Item has cosmetic damage | ASSOCIATE |
| **CUSTOMER_SERVICE** | Service recovery | SUPERVISOR |
| **BUNDLE_DEAL** | Multi-item bundle discount | SUPERVISOR |
| **MANAGER_DISCRETION** | Manager's judgment call | MANAGER |
| **LOYALTY_EXCEPTION** | Special customer accommodation | MANAGER |
| **OVERRIDE** | Admin price override | ADMIN |

### Manager Override Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MANAGER OVERRIDE WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

Associate attempts 30% markdown (exceeds 15% limit)
                │
                ▼
    ┌─────────────────────┐
    │ LIMIT EXCEEDED      │
    │ Your max: 15%       │
    │ Requested: 30%      │
    │ [Request Override]  │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ MANAGER OVERRIDE    │
    │                     │
    │ Manager ID: [____]  │
    │ Manager PIN: [____] │
    │                     │
    │ [Authorize]         │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ ✓ APPROVED          │
    │ Authorized by:      │
    │ Mike Manager        │
    │ Override logged     │
    └─────────────────────┘
```

---

## Phase 1: Markdown System

**Prereqs:** 045D complete, 045A markdown APIs
**Blockers:** None

### 1.1 Markdown Permission Context

**Files:**
- CREATE: `apps/pos-web/src/features/markdown/context/MarkdownPermissionContext.tsx`
- CREATE: `apps/pos-web/src/features/markdown/types/markdown.ts`

**Implementation:**
```typescript
interface MarkdownPermissionContextValue {
  tier: MarkdownPermissionTier;
  limits: MarkdownLimit;

  canApplyMarkdownType: (type: MarkdownType) => boolean;
  canUseReason: (reason: MarkdownReason) => boolean;
  isWithinLimit: (type: MarkdownType, value: number, itemPrice: number) => boolean;

  getMaxPercentage: () => number;
  getMaxFixedAmount: () => number;
  canOverridePrice: () => boolean;

  requestOverride: (markdown: MarkdownRequest) => Promise<OverrideResult>;
}

interface MarkdownLimit {
  tier: MarkdownPermissionTier;
  allowedTypes: MarkdownType[];
  allowedReasons: MarkdownReason[];
  maxPercentage: number;
  maxFixedAmount: number;
  canOverridePrice: boolean;
}

type MarkdownPermissionTier = 'ASSOCIATE' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN';
```

### 1.2 Markdown Dialog Component

**Files:**
- CREATE: `apps/pos-web/src/features/markdown/components/MarkdownDialog/MarkdownDialog.tsx`
- CREATE: `apps/pos-web/src/features/markdown/components/MarkdownDialog/MarkdownTypeSelector.tsx`
- CREATE: `apps/pos-web/src/features/markdown/components/MarkdownDialog/MarkdownReasonSelector.tsx`
- CREATE: `apps/pos-web/src/features/markdown/components/MarkdownDialog/MarkdownValueInput.tsx`
- CREATE: `apps/pos-web/src/features/markdown/components/MarkdownDialog/MarkdownPreview.tsx`

**Implementation:**
```typescript
interface MarkdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LineItem | null;  // null for cart-level markdown
  onApply: (markdown: MarkdownInput) => Promise<void>;
}

// Dialog layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ Apply Markdown                                                 [X]  │
// ├─────────────────────────────────────────────────────────────────────┤
// │                                                                     │
// │  Item: Widget Pro XL                                                │
// │  Current Price: $149.99                                             │
// │                                                                     │
// │  ─────────────────────────────────────────────────────────────────  │
// │                                                                     │
// │  Markdown Type:                                                     │
// │  ○ Percentage (max 15%)                                             │
// │  ○ Fixed Amount (max $50)                                           │
// │  ○ Override Price (manager required) 🔒                             │
// │                                                                     │
// │  Value: [____] %                                                    │
// │                                                                     │
// │  Reason:                                                            │
// │  ┌──────────────────────────────────────────────────────────────┐  │
// │  │ Damaged Item                                              ▼  │  │
// │  └──────────────────────────────────────────────────────────────┘  │
// │                                                                     │
// │  Notes (optional):                                                  │
// │  [______________________________________________]                   │
// │                                                                     │
// │  ─────────────────────────────────────────────────────────────────  │
// │                                                                     │
// │  PREVIEW                                                            │
// │  Original:    $149.99                                               │
// │  Discount:    -$22.50 (15%)                                         │
// │  New Price:   $127.49                                               │
// │                                                                     │
// ├─────────────────────────────────────────────────────────────────────┤
// │  [Cancel]                                              [Apply]      │
// └─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Manager Override Dialog

**Files:**
- CREATE: `apps/pos-web/src/features/markdown/components/ManagerOverrideDialog/ManagerOverrideDialog.tsx`
- CREATE: `apps/pos-web/src/features/markdown/hooks/useManagerOverride.ts`

**Implementation:**
```typescript
interface ManagerOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;  // Description of what's being authorized
  currentLimit: MarkdownLimit;
  requestedMarkdown: MarkdownRequest;
  onAuthorize: (credentials: ManagerCredentials) => Promise<OverrideResult>;
}

interface ManagerCredentials {
  managerId: string;
  pin: string;
}

interface OverrideResult {
  success: boolean;
  approvedBy?: string;
  approverName?: string;
  newLimit?: MarkdownLimit;
  error?: string;
}

// Dialog layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ Manager Authorization Required                                  [X] │
// ├─────────────────────────────────────────────────────────────────────┤
// │                                                                     │
// │  ⚠️ This action requires manager approval                          │
// │                                                                     │
// │  Action: Apply 30% markdown                                         │
// │  Your limit: 15%                                                    │
// │  Requested: 30%                                                     │
// │                                                                     │
// │  ─────────────────────────────────────────────────────────────────  │
// │                                                                     │
// │  Manager ID:  [______________]                                      │
// │  Manager PIN: [______________]                                      │
// │                                                                     │
// │  ⓘ Manager will be logged as the authorizer                        │
// │                                                                     │
// ├─────────────────────────────────────────────────────────────────────┤
// │  [Cancel]                                          [Authorize]      │
// └─────────────────────────────────────────────────────────────────────┘
```

### 1.4 Markdown Hooks

**Files:**
- CREATE: `apps/pos-web/src/features/markdown/hooks/useApplyMarkdown.ts`
- CREATE: `apps/pos-web/src/features/markdown/hooks/useRemoveMarkdown.ts`
- CREATE: `apps/pos-web/src/features/markdown/hooks/useMarkdownValidation.ts`

**Implementation:**
```typescript
interface UseApplyMarkdownResult {
  applyMarkdown: (input: MarkdownInput) => Promise<MarkdownResult>;
  isApplying: boolean;
  error: Error | null;
}

interface UseMarkdownValidationResult {
  validate: (input: MarkdownInput) => ValidationResult;
  isWithinLimit: (type: MarkdownType, value: number) => boolean;
  requiresOverride: (input: MarkdownInput) => boolean;
}

interface MarkdownInput {
  lineId?: string;  // Item markdown (null for cart-level)
  type: MarkdownType;
  value: number;
  reason: MarkdownReason;
  notes?: string;
}
```

### 1.5 Markdown Indicator Component

**Files:**
- CREATE: `apps/pos-web/src/features/markdown/components/MarkdownIndicator/MarkdownIndicator.tsx`
- CREATE: `apps/pos-web/src/features/markdown/components/MarkdownIndicator/MarkdownTooltip.tsx`

**Implementation:**
```typescript
interface MarkdownIndicatorProps {
  markdown: MarkdownInfo;
  onEdit?: () => void;
  onRemove?: () => void;
  canEdit: boolean;
  canRemove: boolean;
}

// Shows on line items:
// 🏷️ 15% off - Damaged Item
// Hover shows: Applied by John D., 10:45 AM
```

---

## Phase 2: Multi-Fulfillment Orders

**Prereqs:** Phase 1 complete, 045A fulfillment APIs
**Blockers:** None

### 2.1 Fulfillment Selector Component

**Files:**
- CREATE: `apps/pos-web/src/features/fulfillment/components/FulfillmentSelector/FulfillmentSelector.tsx`
- CREATE: `apps/pos-web/src/features/fulfillment/components/FulfillmentSelector/FulfillmentGroup.tsx`
- CREATE: `apps/pos-web/src/features/fulfillment/components/FulfillmentSelector/FulfillmentItemDrag.tsx`

**Implementation:**
```typescript
interface FulfillmentSelectorProps {
  items: LineItem[];
  groups: FulfillmentGroup[];
  availableTypes: FulfillmentType[];
  onGroupsChange: (groups: FulfillmentGroup[]) => void;
}

interface FulfillmentGroup {
  id: string;
  type: FulfillmentType;
  items: LineItem[];
  scheduledDate?: Date;
  timeSlot?: TimeSlot;
  address?: Address;
  instructions?: string;
}

// Multi-fulfillment layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ Fulfillment Configuration                     [+ Add Shipment]      │
// ├─────────────────────────────────────────────────────────────────────┤
// │                                                                     │
// │  ┌─────────────────────────────────────────────────────────────┐   │
// │  │ Shipment 1: DELIVERY                               [Remove] │   │
// │  │ Ship to: 123 Main St, City, ST 12345                        │   │
// │  │ Date: Dec 15, 2025 (2-4 PM)                                 │   │
// │  │                                                              │   │
// │  │ Items:                                                       │   │
// │  │   ├── Widget Pro XL (drag to move)                          │   │
// │  │   └── Widget Standard                                        │   │
// │  └─────────────────────────────────────────────────────────────┘   │
// │                                                                     │
// │  ┌─────────────────────────────────────────────────────────────┐   │
// │  │ Shipment 2: PICKUP                                 [Remove] │   │
// │  │ Store: #1234 - Downtown                                      │   │
// │  │ Date: Dec 20, 2025 (Ready by 2 PM)                          │   │
// │  │                                                              │   │
// │  │ Items:                                                       │   │
// │  │   └── Widget Accessory Pack                                  │   │
// │  └─────────────────────────────────────────────────────────────┘   │
// │                                                                     │
// │  Unassigned Items: 0                                                │
// │                                                                     │
// └─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Time Slot Selector

**Files:**
- CREATE: `apps/pos-web/src/features/fulfillment/components/TimeSlotSelector/TimeSlotSelector.tsx`
- CREATE: `apps/pos-web/src/features/fulfillment/hooks/useFulfillmentSlots.ts`

**Implementation:**
```typescript
interface TimeSlotSelectorProps {
  fulfillmentType: FulfillmentType;
  storeNumber: number;
  selectedDate: Date | null;
  selectedSlot: TimeSlot | null;
  onDateChange: (date: Date) => void;
  onSlotChange: (slot: TimeSlot) => void;
}

interface TimeSlot {
  id: string;
  date: Date;
  startTime: string;  // "09:00"
  endTime: string;    // "12:00"
  available: boolean;
  capacityRemaining: number;
}

// Calendar view with available slots
// Grayed out unavailable dates/times
// Shows capacity remaining
```

### 2.3 Address Selection

**Files:**
- CREATE: `apps/pos-web/src/features/fulfillment/components/AddressSelector/AddressSelector.tsx`
- CREATE: `apps/pos-web/src/features/fulfillment/components/AddressSelector/QuickAddressForm.tsx`

**Implementation:**
```typescript
interface AddressSelectorProps {
  customerId: string | null;
  savedAddresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address) => void;
  onAddNewAddress: (address: Address) => void;
}

// Shows:
// - Customer's saved addresses (if logged in)
// - Quick address entry form
// - Address validation
```

### 2.4 Will-Call Configuration

**Files:**
- CREATE: `apps/pos-web/src/features/fulfillment/components/WillCallConfig/WillCallConfig.tsx`

**Implementation:**
```typescript
interface WillCallConfigProps {
  items: LineItem[];
  storeNumber: number;
  onConfigure: (config: WillCallConfig) => void;
}

interface WillCallConfig {
  pickupWindow: {
    startDate: Date;
    endDate: Date;
  };
  contactPhone: string;
  pickupPerson?: string;  // If different from customer
  specialInstructions?: string;
}

// Will-call specific:
// - Pickup window (not specific time)
// - Alternate pickup person option
// - Hold expiration date
```

---

## Phase 3: Remote Payment Capture

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Card Not Present Payment

**Files:**
- CREATE: `apps/pos-web/src/features/payment/components/CardNotPresent/CardNotPresentForm.tsx`
- CREATE: `apps/pos-web/src/features/payment/hooks/useCardNotPresentPayment.ts`

**Implementation:**
```typescript
interface CardNotPresentFormProps {
  amount: number;
  onSubmit: (payment: CardNotPresentPayment) => Promise<void>;
  onCancel: () => void;
}

// Form layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ Card Not Present Payment                                            │
// ├─────────────────────────────────────────────────────────────────────┤
// │                                                                     │
// │  Amount: $459.99                                                    │
// │                                                                     │
// │  Card Number:                                                       │
// │  [____ ____ ____ ____]                                             │
// │                                                                     │
// │  Expiration:         CVV:                                           │
// │  [MM/YY]             [___]                                          │
// │                                                                     │
// │  Billing ZIP:                                                       │
// │  [_____]                                                            │
// │                                                                     │
// │  Cardholder Name:                                                   │
// │  [_______________________]                                          │
// │                                                                     │
// │  🔒 Payment is secured with PCI-compliant tokenization              │
// │                                                                     │
// ├─────────────────────────────────────────────────────────────────────┤
// │  [Cancel]                                        [Process Payment]  │
// └─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Net Terms Payment (B2B)

**Files:**
- CREATE: `apps/pos-web/src/features/payment/components/NetTerms/NetTermsForm.tsx`
- CREATE: `apps/pos-web/src/features/payment/hooks/useNetTermsPayment.ts`

**Implementation:**
```typescript
interface NetTermsFormProps {
  customer: Customer;  // Must be B2B with credit
  amount: number;
  availableTerms: PaymentTerms[];
  onSubmit: (payment: NetTermsPayment) => Promise<void>;
  onCancel: () => void;
}

interface NetTermsPayment {
  terms: PaymentTerms;  // NET_30 | NET_60 | NET_90
  purchaseOrderNumber: string;
  approvedBy: string;
  notes?: string;
}

// Form layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ Invoice on Net Terms                                                │
// ├─────────────────────────────────────────────────────────────────────┤
// │                                                                     │
// │  Customer: ACME Corporation                                         │
// │  Account Tier: PREMIER                                              │
// │                                                                     │
// │  Credit Status:                                                     │
// │  ┌─────────────────────────────────────────────────────────────┐   │
// │  │ Available: $45,000 of $50,000                               │   │
// │  │ [████████████████████░░░░] 90%                              │   │
// │  └─────────────────────────────────────────────────────────────┘   │
// │                                                                     │
// │  Order Amount: $2,500.00                                            │
// │  After Order:  $42,500 available                                    │
// │                                                                     │
// │  Payment Terms:                                                     │
// │  ○ NET 30 (Due: Jan 15, 2026)                                      │
// │  ○ NET 60 (Due: Feb 14, 2026)                                      │
// │  ○ NET 90 (Due: Mar 16, 2026)                                      │
// │                                                                     │
// │  Purchase Order #:                                                  │
// │  [________________]                                                 │
// │                                                                     │
// │  Internal Notes:                                                    │
// │  [______________________________________________]                   │
// │                                                                     │
// ├─────────────────────────────────────────────────────────────────────┤
// │  [Cancel]                                     [Create Invoice]      │
// └─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Split Payment Panel

**Files:**
- CREATE: `apps/pos-web/src/features/payment/components/SplitPayment/SplitPaymentPanel.tsx`
- CREATE: `apps/pos-web/src/features/payment/components/SplitPayment/PaymentMethodList.tsx`
- CREATE: `apps/pos-web/src/features/payment/components/SplitPayment/AddPaymentDialog.tsx`

**Implementation:**
```typescript
interface SplitPaymentPanelProps {
  totalAmount: number;
  payments: PaymentEntry[];
  onAddPayment: (method: PaymentType) => void;
  onRemovePayment: (index: number) => void;
  onUpdateAmount: (index: number, amount: number) => void;
  onComplete: () => void;
}

interface PaymentEntry {
  method: PaymentType;
  amount: number;
  status: 'pending' | 'captured' | 'failed';
  details?: PaymentDetails;
}

// Split payment layout:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ Split Payment                                                       │
// ├─────────────────────────────────────────────────────────────────────┤
// │                                                                     │
// │  Total Due: $459.99                                                 │
// │                                                                     │
// │  Applied Payments:                                                  │
// │  ┌─────────────────────────────────────────────────────────────┐   │
// │  │ 💳 Visa ****1234               $300.00    ✓ Captured   [X] │   │
// │  │ 🎁 Gift Card ****5678          $100.00    ✓ Captured   [X] │   │
// │  └─────────────────────────────────────────────────────────────┘   │
// │                                                                     │
// │  Remaining: $59.99                                                  │
// │                                                                     │
// │  [+ Add Payment Method]                                             │
// │                                                                     │
// ├─────────────────────────────────────────────────────────────────────┤
// │  [Cancel All]                                    [Complete Order]   │
// └─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Customer Wallet Payment

**Files:**
- CREATE: `apps/pos-web/src/features/payment/components/WalletPayment/WalletPaymentForm.tsx`
- CREATE: `apps/pos-web/src/features/payment/hooks/useCustomerWallet.ts`

**Implementation:**
```typescript
interface WalletPaymentFormProps {
  customer: Customer;
  amount: number;
  onSelectCard: (walletCard: WalletCard) => void;
  onCancel: () => void;
}

interface WalletCard {
  id: string;
  brand: string;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

// Shows saved payment methods
// Allows selection for this order
// One-click checkout experience
```

---

## Phase 4: B2B Order Features

**Prereqs:** Phase 3 complete, 045E B2B customer features
**Blockers:** None

### 4.1 B2B Order Header

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/B2B/B2BOrderHeader.tsx`

**Implementation:**
```typescript
interface B2BOrderHeaderProps {
  customer: Customer;  // B2B customer
  order: Transaction;
}

// Shows B2B-specific info:
// - Company name
// - Account tier
// - Available credit
// - Payment terms
// - Sales rep
```

### 4.2 PO Number Entry

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/B2B/PONumberEntry.tsx`

**Implementation:**
```typescript
interface PONumberEntryProps {
  value: string;
  onChange: (poNumber: string) => void;
  isRequired: boolean;
  onValidate?: (poNumber: string) => Promise<boolean>;
}

// B2B orders may require PO number
// Can be validated against customer's known PO formats
```

### 4.3 Bulk Item Entry

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/B2B/BulkItemEntry.tsx`
- CREATE: `apps/pos-web/src/features/transaction/components/B2B/CSVImport.tsx`

**Implementation:**
```typescript
interface BulkItemEntryProps {
  onItemsAdded: (items: BulkItemInput[]) => void;
}

interface BulkItemInput {
  sku: string;
  quantity: number;
}

// Bulk entry modes:
// 1. Manual grid (SKU + quantity rows)
// 2. CSV import (SKU, qty columns)
// 3. Reorder from previous order
```

### 4.4 B2B Pricing Display

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/B2B/B2BPricingCard.tsx`

**Implementation:**
```typescript
interface B2BPricingCardProps {
  lineItem: LineItem;
  customer: Customer;
  tierDiscount: number;
}

// Shows:
// - List price
// - Account tier discount
// - Volume discount (if applicable)
// - Final B2B price
// - Margin indicator (for sales rep)
```

### 4.5 Quote Generation

**Files:**
- CREATE: `apps/pos-web/src/features/transaction/components/B2B/QuoteGenerator.tsx`
- CREATE: `apps/pos-web/src/features/transaction/hooks/useGenerateQuote.ts`

**Implementation:**
```typescript
interface QuoteGeneratorProps {
  transaction: Transaction;
  customer: Customer;
  onGenerate: () => Promise<Quote>;
}

interface Quote {
  quoteId: string;
  validUntil: Date;
  items: QuoteLineItem[];
  terms: string;
  pdfUrl: string;
}

// B2B sales can generate quotes
// Quote has expiration date
// Can be converted to order later
```

---

## Phase 5: Order Management Integration

**Prereqs:** Phase 4 complete
**Blockers:** None

### 5.1 Order Lookup

**Files:**
- CREATE: `apps/pos-web/src/features/orders/components/OrderLookup/OrderLookup.tsx`
- CREATE: `apps/pos-web/src/features/orders/hooks/useOrderLookup.ts`

**Implementation:**
```typescript
interface OrderLookupProps {
  onOrderFound: (order: Order) => void;
}

// Lookup by:
// - Order number
// - Customer phone/email
// - Receipt scan
```

### 5.2 Order Detail View

**Files:**
- CREATE: `apps/pos-web/src/features/orders/pages/OrderDetailPage.tsx`
- CREATE: `apps/pos-web/src/features/orders/components/OrderDetail/OrderTimeline.tsx`
- CREATE: `apps/pos-web/src/features/orders/components/OrderDetail/FulfillmentTracker.tsx`

**Implementation:**
```typescript
interface OrderDetailPageProps {
  orderId: string;
}

// Order detail shows:
// - Order summary
// - Status timeline
// - Fulfillment tracking per shipment
// - Payment history
// - Available actions (cancel, refund, reorder)
```

### 5.3 Return/Refund Flow

**Files:**
- CREATE: `apps/pos-web/src/features/orders/components/Returns/ReturnDialog.tsx`
- CREATE: `apps/pos-web/src/features/orders/components/Returns/RefundCalculator.tsx`
- CREATE: `apps/pos-web/src/features/orders/hooks/useProcessReturn.ts`

**Implementation:**
```typescript
interface ReturnDialogProps {
  order: Order;
  onReturn: (returnRequest: ReturnRequest) => Promise<void>;
}

interface ReturnRequest {
  orderId: string;
  items: ReturnItem[];
  reason: ReturnReason;
  refundMethod: 'ORIGINAL' | 'STORE_CREDIT' | 'EXCHANGE';
  notes?: string;
}

// Return flow:
// 1. Select items to return
// 2. Select reason
// 3. Choose refund method
// 4. Process return
// 5. Issue refund
```

---

## Phase 6: Integration & Polish

**Prereqs:** All phases complete
**Blockers:** None

### 6.1 Feature Flags

**Files:**
- CREATE: `apps/pos-web/src/features/config/featureFlags.ts`

**Implementation:**
```typescript
interface POSFeatureFlags {
  enableMarkdowns: boolean;
  enableMultiFulfillment: boolean;
  enableB2BFeatures: boolean;
  enableNetTerms: boolean;
  enableCardNotPresent: boolean;
  enableSplitPayment: boolean;
  enableQuotes: boolean;
  enableReturns: boolean;
}

// Feature flags allow gradual rollout
// Can be toggled per store or role
```

### 6.2 Audit Trail

**Files:**
- CREATE: `apps/pos-web/src/features/audit/hooks/useAuditLog.ts`
- CREATE: `apps/pos-web/src/features/audit/components/AuditTrail.tsx`

**Implementation:**
```typescript
interface AuditEntry {
  action: AuditAction;
  userId: string;
  timestamp: Date;
  details: Record<string, unknown>;
  orderId?: string;
  customerId?: string;
}

type AuditAction =
  | 'MARKDOWN_APPLIED'
  | 'MARKDOWN_OVERRIDE_REQUESTED'
  | 'MARKDOWN_OVERRIDE_APPROVED'
  | 'PAYMENT_CAPTURED'
  | 'PAYMENT_REFUNDED'
  | 'ORDER_VOIDED'
  | 'CUSTOMER_UPDATED';

// All sensitive actions logged
// Viewable by managers
// Exported for compliance
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `features/markdown/` | Markdown permission system |
| CREATE | `features/fulfillment/` | Multi-fulfillment configuration |
| CREATE | `features/payment/components/CardNotPresent/` | Remote card payment |
| CREATE | `features/payment/components/NetTerms/` | B2B invoice payment |
| CREATE | `features/payment/components/SplitPayment/` | Split payment UI |
| CREATE | `features/transaction/components/B2B/` | B2B-specific features |
| CREATE | `features/orders/` | Order management |
| CREATE | `features/audit/` | Audit trail |
| CREATE | `features/config/` | Feature flags |

---

## Business Rules Summary

### Markdown Rules

| Rule | Description |
|------|-------------|
| M1 | Markdown value cannot exceed tier limit without override |
| M2 | Markdown reason must be allowed for tier |
| M3 | Override requires manager credentials |
| M4 | All markdowns logged to audit trail |
| M5 | Markdowns expire after 4 hours if not completed |

### B2B Rules

| Rule | Description |
|------|-------------|
| B1 | Net terms only for B2B customers with credit |
| B2 | Order cannot exceed available credit |
| B3 | PO number required for ENTERPRISE tier |
| B4 | Quotes valid for 30 days |
| B5 | Child accounts inherit parent payment terms |

### Fulfillment Rules

| Rule | Description |
|------|-------------|
| F1 | All items must be assigned to a fulfillment group |
| F2 | WILL_CALL requires pickup window |
| F3 | DELIVERY requires valid address |
| F4 | Time slots have capacity limits |
| F5 | Cannot mix IMMEDIATE with other types |

---

## Checklist

- [ ] Phase 1: Markdown system complete
- [ ] Phase 2: Multi-fulfillment complete
- [ ] Phase 3: Remote payments complete
- [ ] Phase 4: B2B features complete
- [ ] Phase 5: Order management complete
- [ ] Phase 6: Integration and polish
- [ ] All audit logging implemented
- [ ] Feature flags configured
- [ ] Tests passing
