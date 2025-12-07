# 039_POS_SYSTEM

**Status: DRAFT**

---

## Overview

A comprehensive Point of Sale (POS) web application for in-store employees, contact center agents, and B2B sales representatives. This is the most feature-rich frontend application in the platform, supporting the full spectrum of retail transactions from simple in-store purchases to complex multi-delivery B2B orders.

This is an **initiative plan** with 7 sub-plans designed for parallel development across multiple worktrees.

## Sub-Plans

| Plan | Description | Priority | Dependencies |
|------|-------------|----------|--------------|
| `039A_POS_BACKEND_ENHANCEMENTS.md` | Backend API gaps, payment types, fulfillment enhancements | P0 | None |
| `039B_POS_UI_COMPONENTS.md` | New shared UI components (DataTable, forms, modals) | P0 | None |
| `039C_POS_APP_SCAFFOLD.md` | App structure, auth, role-based routing, home dashboard | P1 | 039A, 039B |
| `039D_POS_TRANSACTION_FLOW.md` | Core transaction: scan, cart, customer, checkout | P1 | 039C |
| `039E_POS_CUSTOMER_MANAGEMENT.md` | Customer search, CRUD, B2B hierarchy, loyalty | P1 | 039C |
| `039F_POS_ADVANCED_FEATURES.md` | Markdowns, multi-fulfillment, B2B orders, remote payments | P2 | 039D, 039E |
| `039G_POS_E2E_TESTING.md` | Comprehensive E2E testing and business documentation | P2 | 039F |

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
                    │ 038A Shared Commerce        │
                    │ (if not done)               │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         │
┌─────────────────┐     ┌─────────────────┐                  │
│ 039A: Backend   │     │ 039B: UI        │                  │
│ Enhancements    │     │ Components      │                  │
└────────┬────────┘     └────────┬────────┘                  │
         │                       │                           │
         └───────────┬───────────┘                           │
                     │                                       │
            ┌────────▼────────┐                              │
            │ 039C: App       │                              │
            │ Scaffold        │                              │
            └────────┬────────┘                              │
                     │                                       │
       ┌─────────────┼─────────────┐                         │
       │             │             │                         │
       ▼             ▼             │                         │
┌─────────────┐ ┌─────────────┐    │                         │
│ 039D:       │ │ 039E:       │    │                         │
│ Transaction │ │ Customer    │    │                         │
│ Flow        │ │ Management  │    │                         │
└──────┬──────┘ └──────┬──────┘    │                         │
       │               │           │                         │
       └───────┬───────┘           │                         │
               │                   │                         │
      ┌────────▼────────┐          │                         │
      │ 039F: Advanced  │◀─────────┘                         │
      │ Features        │                                    │
      └────────┬────────┘                                    │
               │                                             │
      ┌────────▼────────┐                                    │
      │ 039G: E2E       │◀───────────────────────────────────┘
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
apps/pos-web/                          # Port 3003
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
├── e2e/                               # Playwright E2E tests
│   ├── specs/
│   │   ├── business/                  # Business scenario tests
│   │   └── technical/                 # Technical flow tests
│   └── fixtures/
└── docs/                              # Business documentation
    ├── BUSINESS_FLOWS.md              # Detailed business flows
    ├── USER_GUIDE.md                  # End user documentation
    └── TEST_SCENARIOS.md              # E2E test scenario docs
```

---

## Backend API Gaps to Address (039A)

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

### E2E Test Categories

| Category | Description | Example Scenarios |
|----------|-------------|-------------------|
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

- [ ] 039A: Backend enhancements complete
- [ ] 039B: UI components created
- [ ] 039C: App scaffold functional
- [ ] 039D: Transaction flow working
- [ ] 039E: Customer management working
- [ ] 039F: Advanced features complete
- [ ] 039G: E2E tests passing, business docs complete
- [ ] All accessibility tests passing
- [ ] Performance benchmarks met
