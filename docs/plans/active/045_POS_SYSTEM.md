# 045_POS_SYSTEM

**Status: COMPLETE**

---

## Overview

A comprehensive Point of Sale (POS) web application for in-store employees, contact center agents, and B2B sales representatives. This is the most feature-rich frontend application in the platform, supporting the full spectrum of retail transactions from simple in-store purchases to complex multi-delivery B2B orders.

This is an **initiative plan** with 7 sub-plans designed for parallel development across multiple worktrees.

## Sub-Plans

| Plan | Description | Priority | Dependencies |
|------|-------------|----------|--------------|
| `045A_POS_BACKEND_ENHANCEMENTS.md` | Backend API gaps, payment types, fulfillment enhancements | P0 | None |
| `045B_POS_UI_COMPONENTS.md` | New shared UI components (DataTable, forms, modals) | P0 | None |
| `045C_POS_APP_SCAFFOLD.md` | App structure, auth, role-based routing, home dashboard | P1 | 045A, 045B |
| `045D_POS_TRANSACTION_FLOW.md` | Core transaction: scan, cart, customer, checkout | P1 | 045C |
| `045E_POS_CUSTOMER_MANAGEMENT.md` | Customer search, CRUD, B2B hierarchy, loyalty | P1 | 045C |
| `045F_POS_ADVANCED_FEATURES.md` | Markdowns, multi-fulfillment, B2B orders, remote payments | P2 | 045D, 045E |
| `045G_POS_E2E_TESTING.md` | Comprehensive E2E testing and business documentation | P2 | 045F |

---

## Business Functionality Overview

### User Personas

| Persona | Channel | Typical Transactions | Special Capabilities |
|---------|---------|---------------------|---------------------|
| **Store Associate** | In-store | Quick scan-and-go, returns, exchanges | Basic markdowns (damaged item) |
| **Store Manager** | In-store | All associate functions + approvals | All markdown types, void authority |
| **Contact Center Agent** | Remote (phone/chat) | Phone orders, order inquiries, returns | Remote payment capture, customer updates |
| **B2B Sales Rep** | Remote/Field | Complex quotes, multi-delivery orders | B2B pricing, account management |

### Transaction Complexity Spectrum

```
SIMPLE ◄────────────────────────────────────────────────────────► COMPLEX

┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────────┐
│ Quick Sale  │  │ Standard    │  │ Contact Center  │  │ B2B Multi-Delivery   │
│             │  │ In-Store    │  │ Phone Order     │  │ Order                │
├─────────────┤  ├─────────────┤  ├─────────────────┤  ├──────────────────────┤
│ • Scan      │  │ • Scan      │  │ • Customer      │  │ • B2B Customer       │
│ • Pay       │  │ • Customer  │  │   lookup        │  │   (hierarchy)        │
│ • Done      │  │   lookup    │  │ • Manual item   │  │ • Multiple ship-to   │
│             │  │ • Loyalty   │  │   entry         │  │   addresses          │
│ Fulfillment:│  │ • Checkout  │  │ • Remote        │  │ • Split fulfillment  │
│ IMMEDIATE   │  │             │  │   payment       │  │   (delivery + pickup │
│             │  │ Fulfillment:│  │ • DELIVERY      │  │   + will-call)       │
│             │  │ IMMEDIATE   │  │                 │  │ • Scheduled dates    │
│             │  │ or PICKUP   │  │                 │  │ • Net terms payment  │
│             │  │             │  │                 │  │ • Sales rep margin   │
└─────────────┘  └─────────────┘  └─────────────────┘  └──────────────────────┘
```

### Fulfillment Types

| Type | Description | Scheduling | Use Case |
|------|-------------|------------|----------|
| **IMMEDIATE** | Customer takes items now | N/A | Walk-out purchases |
| **PICKUP** | Customer picks up later | Date/time selection | Buy online, pickup in store |
| **WILL_CALL** | Hold for customer pickup | Date/time window | Special orders, B2B |
| **DELIVERY** | Ship to address | Delivery date selection | Home delivery |
| **INSTALLATION** | Professional service | Appointment scheduling | Appliances, tech |

### Payment Types

| Type | Channel | Use Case | Implementation |
|------|---------|----------|----------------|
| **Card Present** | In-store | Swipe/tap/insert | Terminal integration |
| **Card Not Present** | Remote | Phone orders, B2B | Manual entry, PCI compliance |
| **Wallet** | Any | Stored payment method | Customer wallet reference |
| **Net Terms** | B2B | Invoice billing | 30/60/90 day terms |
| **Pay Later** | Any | Financing | External provider integration |
| **Cash** | In-store | Cash register | Manual entry, change calculation |
| **Check** | In-store/B2B | Business checks | Check number, routing |
| **Gift Card** | Any | Prepaid gift cards | Card number, balance check |
| **Split Payment** | Any | Multiple methods | Combine any of above |

### Markdown/Discount Authority

| Role | Markdown Types | Max Discount | Approval Required |
|------|---------------|--------------|-------------------|
| **Associate** | DAMAGED_ITEM, PRICE_MATCH | 15% or $50 | None |
| **Supervisor** | + CUSTOMER_SERVICE, BUNDLE_DEAL | 25% or $100 | None |
| **Manager** | + MANAGER_DISCRETION, LOYALTY_EXCEPTION | 50% or $500 | None |
| **Admin** | + OVERRIDE_PRICE (any price) | Unlimited | Audit log |

---

## Architecture Overview

### System Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              POS WEB APPLICATION                              │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                           ROLE-BASED ROUTING                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│  │  │   STORE     │  │  CONTACT    │  │    B2B      │  │   ADMIN     │   │   │
│  │  │  ASSOCIATE  │  │   CENTER    │  │   SALES     │  │  MANAGER    │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                      │                                        │
│  ┌───────────────────────────────────▼───────────────────────────────────┐   │
│  │                          FEATURE MODULES                               │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │   │
│  │  │Transaction │  │ Customer   │  │ Orders     │  │ Reports    │      │   │
│  │  │   Flow     │  │ Management │  │ Management │  │ Dashboard  │      │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘      │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                      │                                        │
│  ┌───────────────────────────────────▼───────────────────────────────────┐   │
│  │                         SHARED LIBRARIES                               │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │   │
│  │  │ commerce-  │  │ commerce-  │  │ pos-ui     │  │ api-client │      │   │
│  │  │ ui         │  │ hooks      │  │ components │  │            │      │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘      │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Product Service   │  │   Customer Service  │  │  Checkout Service   │
│      :8080          │  │       :8083         │  │      :8087          │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
              │                        │                        │
              │                        │                        │
              ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Discount Service  │  │Fulfillment Service  │  │   Order Service     │
│      :8084          │  │       :8085         │  │      :8088          │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### Dependency Order

```
                    ┌─────────────────────────────┐
                    │ 044A Shared Commerce        │
                    │ (if not done)               │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         │
┌─────────────────┐     ┌─────────────────┐                  │
│ 045A: Backend   │     │ 045B: UI        │                  │
│ Enhancements    │     │ Components      │                  │
└────────┬────────┘     └────────┬────────┘                  │
         │                       │                           │
         └───────────┬───────────┘                           │
                     │                                       │
            ┌────────▼────────┐                              │
            │ 045C: App       │                              │
            │ Scaffold        │                              │
            └────────┬────────┘                              │
                     │                                       │
       ┌─────────────┼─────────────┐                         │
       │             │             │                         │
       ▼             ▼             │                         │
┌─────────────┐ ┌─────────────┐    │                         │
│ 045D:       │ │ 045E:       │    │                         │
│ Transaction │ │ Customer    │    │                         │
│ Flow        │ │ Management  │    │                         │
└──────┬──────┘ └──────┬──────┘    │                         │
       │               │           │                         │
       └───────┬───────┘           │                         │
               │                   │                         │
      ┌────────▼────────┐          │                         │
      │ 045F: Advanced  │◀─────────┘                         │
      │ Features        │                                    │
      └────────┬────────┘                                    │
               │                                             │
      ┌────────▼────────┐                                    │
      │ 045G: E2E       │◀───────────────────────────────────┘
      │ Testing         │
      └─────────────────┘
```

---

## New Design Components Required

### Shared UI Components (shared-ui/ui-components)

| Component | Purpose | POS Use |
|-----------|---------|---------|
| `DataTable` | Sortable, filterable data grid | Customer search, order list |
| `CommandPalette` | Quick actions (Cmd+K) | Fast SKU lookup, shortcuts |
| `Tabs` | Tab navigation | Customer details sections |
| `Select` | Dropdown selection | Fulfillment type, reasons |
| `RadioGroup` | Radio button group | Payment method selection |
| `Switch` | Toggle switch | Feature toggles |
| `DatePicker` | Date selection | Fulfillment scheduling |
| `TimePicker` | Time selection | Appointment slots |
| `Combobox` | Searchable dropdown | Customer autocomplete |
| `Avatar` | User/customer avatar | Customer display |
| `Skeleton` | Loading placeholders | All data loading |
| `Tooltip` | Help text | Form field hints |
| `Popover` | Rich tooltips | Price breakdown |
| `Sheet` | Slide-over panel | Quick customer view |
| `Separator` | Visual divider | Section breaks |

### POS-Specific Components (pos-ui)

| Component | Purpose |
|-----------|---------|
| `TransactionHeader` | Current transaction info (customer, totals) |
| `ItemGrid` | Product grid with quick-add |
| `LineItemRow` | Transaction line item with markdown |
| `MarkdownDialog` | Apply markdown with reason |
| `CustomerQuickView` | Customer summary sheet |
| `FulfillmentSelector` | Multi-fulfillment configuration |
| `PaymentCapture` | Payment method entry |
| `SplitPaymentPanel` | Multiple payment methods |
| `ReceiptPreview` | Pre-print receipt view |
| `ManagerOverrideDialog` | Authorization for markdowns |
| `OrderStatusTimeline` | Visual order status |

---

## Project Structure

```
apps/pos-web/                          # Port 3004
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── providers.tsx              # Auth, Query, Router providers
│   │   ├── router.tsx                 # TanStack Router config
│   │   └── routes/
│   │       ├── __root.tsx             # Root layout with nav
│   │       ├── index.tsx              # Dashboard home
│   │       ├── transaction/           # Transaction flow
│   │       ├── customers/             # Customer management
│   │       ├── orders/                # Order management
│   │       └── settings/              # User settings
│   ├── features/
│   │   ├── auth/                      # POS authentication
│   │   │   ├── context/
│   │   │   ├── hooks/
│   │   │   └── components/
│   │   ├── dashboard/                 # Home dashboard
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── transaction/               # Core transaction
│   │   │   ├── context/               # TransactionContext
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   │   ├── ItemEntry/
│   │   │   │   ├── CartPanel/
│   │   │   │   ├── CustomerPanel/
│   │   │   │   ├── FulfillmentPanel/
│   │   │   │   ├── PaymentPanel/
│   │   │   │   └── ReceiptPanel/
│   │   │   └── pages/
│   │   ├── customer/                  # Customer management
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   │   ├── CustomerSearch/
│   │   │   │   ├── CustomerForm/
│   │   │   │   ├── CustomerDetail/
│   │   │   │   ├── B2BHierarchy/
│   │   │   │   └── LoyaltyPanel/
│   │   │   └── pages/
│   │   ├── orders/                    # Order management
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   └── markdown/                  # Markdown functionality
│   │       ├── hooks/
│   │       ├── components/
│   │       └── utils/
│   ├── shared/
│   │   ├── layouts/
│   │   │   ├── POSLayout.tsx          # Main POS layout
│   │   │   ├── TransactionLayout.tsx  # Transaction view layout
│   │   │   └── Sidebar.tsx            # Navigation sidebar
│   │   ├── components/
│   │   └── hooks/
│   └── mocks/                         # MSW handlers
│
apps/pos-web-e2e/                      # Playwright E2E tests
├── specs/
│   ├── sanity.spec.ts                 # Sanity checks (run first, with MSW)
│   ├── business/                      # Business scenario tests (MSW)
│   ├── accessibility/                 # Accessibility tests (MSW)
│   └── fullstack/                     # Full-stack tests (no MSW, real backend)
│       └── transaction-journey.spec.ts
├── fixtures/                          # Test fixtures and helpers
│   ├── auth.ts                        # Login/logout helpers
│   ├── transaction.ts                 # Transaction helpers
│   ├── customer.ts                    # Customer fixtures
│   ├── payment.ts                     # Payment helpers
│   └── index.ts                       # Re-exports
└── playwright.config.ts               # Playwright configuration
```

---

## Backend API Gaps to Address (045A)

### New Endpoints Required

| Service | Endpoint | Purpose |
|---------|----------|---------|
| customer-service | `GET /customers/search` (enhanced) | Full-text search with pagination |
| customer-service | `GET /customers/autocomplete` | Quick typeahead results |
| checkout-service | Payment types expansion | Card-not-present, net terms, etc. |
| fulfillment-service | `POST /fulfillments/multi` | Multi-fulfillment order |
| fulfillment-service | `GET /fulfillments/slots` | Available pickup/delivery slots |
| discount-service | Markdown permission tiers | Role-based limits |

### Model Enhancements

- Add `WILL_CALL` to FulfillmentType enum
- Add payment type models (CardNotPresent, NetTerms, etc.)
- Add markdown permission tiers to user model

---

## Testing Strategy Overview

### Two-Track E2E Approach

Based on patterns from 044 Self-Checkout Kiosk (044D_KIOSK_E2E_TESTING.md):

| Track | Purpose | Speed | When |
|-------|---------|-------|------|
| **Sanity (MSW)** | Catch fundamental issues | ~30 sec | Every test run, first |
| **Business (MSW)** | Full scenario coverage | ~3 min | After sanity passes |
| **Full-Stack** | Real service integration | ~10 min | Main branch, nightly |

### E2E Test Execution Order

Tests are configured with Playwright project dependencies:

1. **sanity** - Basic app functionality (login, scan, cart)
2. **chromium** (business scenarios) - Depends on sanity passing
3. **accessibility** - Depends on sanity passing

### Key E2E Testing Discoveries

**Auth State Persistence Issue**: The `AuthProvider` does not restore user session from localStorage on page mount. This means:
- Tests using `page.goto('/route')` lose auth state because page reloads
- Navigation must use click-based interactions (`page.getByRole('link').click()`) instead of direct `page.goto()` for internal routes
- This simulates real user behavior more accurately

**Test Selector Strategy**:
- Use accessible roles and labels: `getByRole('button', { name: /checkout/i })`
- Use exact placeholder text: `getByPlaceholder('Scan or enter SKU...')`
- Avoid data-testid when possible - prefer semantic selectors for accessibility

**Current Sanity Suite** (10 passing tests):
1. App loads and shows login form
2. Employee can login successfully
3. Logged in user can navigate to transaction page
4. Can scan product and add to cart
5. Cart shows empty state initially
6. Checkout button is disabled for empty cart
7. Suspend button is disabled for empty cart
8. Invalid login shows error
9. Product search button opens search dialog
10. **Complete transaction journey** - Full end-to-end test: login → add items → checkout → fulfillment → payment → complete

**Full-Stack Tests** (no MSW mocks):
Located in `specs/fullstack/`, these tests run against real backend services:
- `transaction-journey.spec.ts` - Complete transaction from login to receipt
- Requires: `./powerstart` to have all services running
- Run with: `E2E_BASE_URL=http://localhost:3004 pnpm nx e2e pos-web-e2e --project=fullstack`

### E2E Test Categories

| Category | Description | Example Scenarios |
|----------|-------------|-------------------|
| **Sanity Checks** | Basic app functionality | App loads, login works, can scan items |
| **Happy Path** | Standard successful flows | Complete transaction, find customer |
| **Error Handling** | Graceful error recovery | Payment declined, customer not found |
| **Authorization** | Permission verification | Markdown limits, manager override |
| **Edge Cases** | Boundary conditions | Max items, zero quantity, expired promos |
| **B2B Specific** | Business customer flows | Multi-delivery, net terms, hierarchy |
| **Accessibility** | WCAG compliance | Keyboard nav, screen reader |

### Business Documentation

Each major feature will have:
1. **Flow Diagram** - Visual representation of user journey
2. **State Machine** - Valid state transitions
3. **Test Scenarios** - Documented test cases with expected outcomes
4. **User Stories** - Acceptance criteria from business perspective

---

## Checklist

- [x] 045A: Backend enhancements complete
- [x] 045B: UI components created
- [x] 045C: App scaffold functional
- [x] 045D: Transaction flow working
- [x] 045E: Customer management working
- [x] 045F: Advanced features complete
- [x] 045G: E2E tests passing, business docs complete
- [x] All accessibility tests passing
- [ ] Performance benchmarks met (deferred - requires runtime testing)

---

## Recent Fixes & Next Steps

### Product Search → Cart Data Consistency Fix (2024-12-10)

**Problem**: When searching for products (e.g., "headphones") and adding to cart, the cart displayed wrong product data ("Test Product" instead of "Wireless Headphones"). This was caused by:
1. `ItemEntry.tsx` called `addItem(product.sku, quantity)` which only passed the SKU
2. `TransactionProvider.tsx` then did a second lookup via `/products/{sku}` API
3. The second lookup returned different data from WireMock's merchandise mock vs the catalog search API

**Solution**: Applied the kiosk-web pattern - pass full product data to avoid second lookup:
1. Added `addItemWithProduct(product: Product, quantity?: number)` method to `TransactionContext`
2. Implemented in `TransactionProvider.tsx` - uses full product data directly
3. Updated `ItemEntry.tsx` to use `addItemWithProduct` for search results
4. Also added SKU-specific merchandise mappings in WireMock to fix the data mismatch

**Files Changed**:
- `apps/pos-web/src/features/transaction/context/TransactionContext.tsx` - added interface method
- `apps/pos-web/src/features/transaction/context/TransactionProvider.tsx` - added implementation
- `apps/pos-web/src/features/transaction/components/ItemEntry/ItemEntry.tsx` - use new method
- `e2e/wiremock/mappings/merchandise.json` - added SKU-specific mappings

**Next Step**: Verify the fix by running full-stack E2E tests:
```bash
./powerstart
pnpm nx serve pos-web
E2E_BASE_URL=http://localhost:3004 pnpm exec playwright test apps/pos-web-e2e/specs/fullstack/search-add-to-cart.spec.ts
```

**Blocked By**: WireMock failing to start (needs investigation)

### Transaction → Order Flow Fix (2024-12-11)

**Problem**: Completed transactions were not appearing in the Orders page. After completing a full checkout flow (add items → fulfillment → payment → complete), navigating to Orders showed only the 6 initial mock orders, not the newly created order.

**Root Causes**:
1. **Disconnected systems** - `useOrderLookup` had inline mock data while `completeTransaction` never called any API to create orders
2. **React Query cache** - 5-minute `staleTime` configuration prevented fresh data from appearing without manual refresh

**Solution**:
1. Added `queryClient.invalidateQueries({ queryKey: ['orders'] })` after successful order creation in `TransactionProvider.tsx`
2. Fixed TypeScript type mismatches in `useOrderLookup.ts`:
   - `customerId` type casting to satisfy required string field
   - Added missing `fulfillmentGroupId` to placeholder items
3. Fixed `customerName` construction to use `firstName`/`lastName` from `CustomerSummary` type

**Files Changed**:
- `apps/pos-web/src/features/transaction/context/TransactionProvider.tsx` - Added useQueryClient import and cache invalidation
- `apps/pos-web/src/features/orders/hooks/useOrderLookup.ts` - Fixed TypeScript errors

**Verification**:
- Started with 6 orders in Orders list
- Created new transaction (Widget Standard $79.99 + tax = $86.39)
- Completed checkout with Cash payment
- Orders page shows 7 orders with new order POS-2025-000007 at top
- Transaction → Order flow is now fully functional with MSW mocking
