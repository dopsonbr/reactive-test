# 038_SELF_CHECKOUT_KIOSK

**Status: DRAFT**

---

## Overview

A self-checkout web UI for in-store kiosks enabling customers to scan products, optionally link their loyalty account (phone/email lookup), apply discounts, and complete payment. The kiosk operates under a service account assigned to the store with IMMEDIATE (carryout) fulfillment only.

This is an **initiative plan** with 4 sub-plans that can be worked in parallel branches.

## Sub-Plans

| Plan | Description | Dependencies |
|------|-------------|--------------|
| `038A_SHARED_COMMERCE_COMPONENTS.md` | Extract reusable product/cart components to shared libs | None |
| `038B_KIOSK_APP_SCAFFOLD.md` | Create kiosk-web app with session management | 038A |
| `038C_KIOSK_FEATURES.md` | Implement scan, loyalty, checkout flows | 038A, 038B |
| `038D_KIOSK_E2E_TESTING.md` | E2E test strategy and MSW handlers | 038C |

## Goals

1. Extract shared commerce components from ecommerce-web to shared libraries
2. Create `kiosk-web` Nx app with touch-optimized UI for self-checkout
3. Implement barcode scanner integration for product lookup
4. Build loyalty lookup by phone OR email (binary match, no search)
5. Integrate cart, discount, and checkout services for complete transaction flow
6. Comprehensive E2E testing with MSW mocks and full-stack integration

## References

**Standards:**
- `docs/standards/frontend/architecture.md` - Feature folder structure
- `docs/standards/frontend/state-management.md` - TanStack Query patterns
- `docs/standards/frontend/components.md` - Component patterns
- `docs/standards/frontend/testing.md` - Testing Trophy, E2E patterns

**Templates:**
- `docs/templates/frontend/_template_page.md` - TanStack Router pages
- `docs/templates/frontend/_template_feature_component.md` - Smart components
- `docs/templates/frontend/_template_ui_component.md` - CVA components

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SHARED LIBRARIES                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ shared-ui        │  │ shared-data      │  │ shared-design        │  │
│  │ - ui-components  │  │ - api-client     │  │ - tokens             │  │
│  │ - commerce-ui ◀──┼──┼─ commerce-hooks  │  │                      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
            │                     │                     │
     ┌──────┴──────┐       ┌──────┴──────┐       ┌──────┴──────┐
     ▼             ▼       ▼             ▼       ▼             ▼
┌─────────────┐ ┌─────────────┐
│ ecommerce-  │ │ kiosk-web   │
│ web         │ │ (NEW)       │
│ Port: 3001  │ │ Port: 3002  │
└─────────────┘ └─────────────┘
```

### Kiosk User Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         KIOSK TRANSACTION FLOW                           │
│                                                                          │
│  ┌────────┐    ┌────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ START  │───▶│  SCAN  │───▶│  CART    │───▶│ LOYALTY  │───▶│CHECKOUT│ │
│  │ SCREEN │    │ SCREEN │    │  REVIEW  │    │  LOOKUP  │    │ SCREEN │ │
│  └────────┘    └────────┘    └──────────┘    └──────────┘    └────────┘ │
│       │             │              │               │               │     │
│       │        [Barcode]      [+/- qty]       [Phone/Email]   [Payment]  │
│       │        [Manual SKU]   [Remove]        [Skip]          [Receipt]  │
│       │             │              │               │               │     │
│       │             ▼              ▼               ▼               ▼     │
│       │        ┌─────────┐   ┌─────────┐    ┌──────────┐    ┌─────────┐ │
│       │        │ Product │   │  Cart   │    │ Customer │    │Checkout │ │
│       │        │ Service │   │ Service │    │ Service  │    │ Service │ │
│       │        │  :8080  │   │  :8081  │    │  :8083   │    │  :8087  │ │
│       │        └─────────┘   └─────────┘    └──────────┘    └─────────┘ │
│       │                                                          │      │
│       │                                                          ▼      │
│       │                                                    ┌──────────┐ │
│       │                                                    │ Discount │ │
│       │◀───────────────── [RESET] ◀────────────────────────│ Service  │ │
│       │                                                    │  :8084   │ │
│                                                            └──────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Dependency Order

```
                    ┌─────────────────────────────┐
                    │ 035_FAKE_AUTH_DOCKER        │
                    │ (service account tokens)    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ 038A: Shared Components     │
                    │ (extract from ecommerce)    │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    │
┌─────────────────────┐ ┌─────────────────────┐        │
│ 038B: App Scaffold  │ │ 038D: E2E Testing   │        │
│ (can start early)   │ │ (MSW handlers)      │        │
└──────────┬──────────┘ └──────────┬──────────┘        │
           │                       │                    │
           └───────────┬───────────┘                    │
                       │                                │
              ┌────────▼────────┐                       │
              │ 038C: Features  │◀──────────────────────┘
              │ (scan, loyalty, │
              │  checkout)      │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │ 038D: E2E Tests │
              │ (full specs)    │
              └─────────────────┘
```

---

## New UI Components Required

These components should be added to `shared-ui/ui-components` for use by both apps:

| Component | Purpose | Kiosk Use | Web Use |
|-----------|---------|-----------|---------|
| `NumericKeypad` | Touch-friendly number input | SKU entry, phone input | Quantity input |
| `Dialog` | Modal overlay | Confirmations, errors | Already has some |
| `Toast` | Notification messages | Scan success/error | Order confirmations |
| `Stepper` | Multi-step progress | Checkout flow | Checkout flow |
| `QuantitySelector` | +/- buttons with input | Cart items | Cart items |
| `PriceDisplay` | Formatted currency | Everywhere | Everywhere |
| `Badge` | Status indicators | Stock status | Stock status |
| `Spinner` | Loading indicator | API calls | API calls |
| `Alert` | Inline messages | Errors, warnings | Errors, warnings |

---

## Shared Code Strategy

### Current State (ecommerce-web only)

```
apps/ecommerce-web/src/
├── features/
│   ├── products/
│   │   ├── api/useProducts.ts      ◀── Can share
│   │   ├── components/ProductCard  ◀── Can share (with abstraction)
│   │   └── types/product.ts        ◀── Can share
│   └── cart/
│       ├── api/useCart.ts          ◀── Can share
│       ├── components/CartItemRow  ◀── Can share
│       └── types/cart.ts           ◀── Can share
└── mocks/
    ├── handlers.ts                 ◀── Can share
    └── data.ts                     ◀── Can share
```

### Target State (shared libraries)

```
libs/frontend/
├── shared-ui/
│   ├── ui-components/          (existing)
│   └── commerce-ui/            (NEW - 038A)
│       ├── ProductCard/
│       ├── CartItemRow/
│       ├── CartSummary/
│       ├── PriceDisplay/
│       └── QuantitySelector/
├── shared-data/
│   ├── api-client/             (existing)
│   └── commerce-hooks/         (NEW - 038A)
│       ├── useProducts.ts
│       ├── useCart.ts
│       ├── useCustomerLookup.ts
│       └── types/
└── shared-testing/             (NEW - 038D)
    └── mock-handlers/
        ├── products.ts
        ├── cart.ts
        ├── customers.ts
        └── data.ts
```

---

## Checklist

- [ ] 038A: Shared commerce components extracted
- [ ] 038B: Kiosk app scaffolding complete
- [ ] 038C: All kiosk features implemented
- [ ] 038D: E2E tests passing
- [ ] Documentation updated
