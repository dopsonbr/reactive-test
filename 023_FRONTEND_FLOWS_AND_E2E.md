# 023_FRONTEND_FLOWS_AND_E2E

**Status: DRAFT**

---

## Overview

Implement product listing/detail and cart flows in `apps/ecommerce-web`, wiring TanStack Query hooks to backend REST contracts. Deliver two E2E testing tracks: mocked (MSW + Playwright) for fast PR builds and full-stack (Docker Compose) for pre-deployment validation.

**Prerequisites:**
- `020_NX_MONOREPO_IMPLEMENTATION.md` Phase 1.1 complete (pnpm, nx.json)
- `022_DESIGN_SYSTEM_AND_COMPONENT_LIBRARY.md` complete (shared-ui components exist)

**Related ADRs:**
- `docs/ADRs/007_frontend_ui_framework.md` - React + Vite + TanStack
- `docs/ADRs/008_component_library_design_system.md` - shadcn/ui
- `docs/ADRs/009_frontend_testing_strategy.md` - Vitest + Playwright + Ladle

---

## Goals

1. Create `apps/ecommerce-web` with feature folder structure
2. Implement product listing/detail flows with TanStack Query
3. Implement cart flows (add-to-cart, view-cart, update quantity)
4. Set up MSW for API mocking in tests and Ladle stories
5. Create Playwright E2E suite with mocked backend (fast PR builds)
6. Create Playwright E2E suite with full-stack backend (Docker Compose)
7. Configure CI jobs for both E2E tracks
8. Document patterns for extending to new journeys

---

## Sub-Plans

| Plan | Scope | Est. Lines |
|------|-------|------------|
| [023A_MOCKED_E2E](./023A_MOCKED_E2E.md) | App scaffold, features, MSW, mocked Playwright | ~450 |
| [023B_FULLSTACK_E2E](./023B_FULLSTACK_E2E.md) | Docker Compose E2E, data seeding, CI | ~350 |

---

## Architecture

```
apps/
└── ecommerce-web/                    # E-commerce storefront
    ├── src/
    │   ├── app/                      # App shell, providers, router
    │   │   ├── App.tsx
    │   │   ├── providers.tsx         # QueryClient, Router
    │   │   └── routes.tsx            # TanStack Router config
    │   ├── features/
    │   │   ├── products/             # Product domain
    │   │   │   ├── api/              # TanStack Query hooks
    │   │   │   ├── components/       # Smart + presentational
    │   │   │   ├── pages/            # Route components
    │   │   │   └── types/            # TypeScript types
    │   │   └── cart/                 # Cart domain
    │   │       ├── api/
    │   │       ├── components/
    │   │       ├── pages/
    │   │       └── types/
    │   ├── shared/                   # App-specific shared code
    │   │   ├── api/                  # API client, error handling
    │   │   └── layouts/              # Page layouts
    │   └── main.tsx                  # Entry point
    ├── e2e/                          # Playwright tests (mocked)
    │   ├── fixtures/                 # Test data
    │   ├── mocks/                    # MSW handlers for Playwright
    │   └── specs/                    # Test specs
    ├── .ladle/                       # Ladle config
    ├── stories/                      # Feature UX state stories
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── project.json

e2e/
└── ecommerce-fullstack/              # Full-stack E2E (separate project)
    ├── fixtures/
    │   └── seed-data.sql             # Database seeding
    ├── specs/
    ├── docker-compose.e2e.yml        # E2E-specific compose
    └── project.json
```

### Package Naming

| Module | Package/Import |
|--------|----------------|
| E-commerce app | `apps/ecommerce-web` |
| Full-stack E2E | `e2e/ecommerce-fullstack` |
| Shared data access | `@reactive-platform/shared-data` |

---

## Dependency Graph

```
022 (Design System)
         │
         ▼
       023A ──────────────────┐
  (App + Features +           │
   Mocked E2E)                │
         │                    │
         ▼                    ▼
       023B              CI Workflow
  (Full-stack E2E)       (both tracks)
```

**Execution Order:**
- 023A must complete first (app must exist for full-stack E2E)
- 023B can start once core features are working
- CI jobs added in 023B depend on both E2E suites

---

## User Journeys Covered

### Journey 1: Product Browse & Detail
```
Home → Product List → Filter/Search → Product Detail → View Reviews
```

### Journey 2: Add to Cart
```
Product Detail → Add to Cart → Cart Drawer → Continue Shopping
```

### Journey 3: Cart Management
```
Cart Page → Update Quantity → Remove Item → View Total → Proceed to Checkout
```

---

## API Contracts (Backend Services)

| Endpoint | Method | Service | Purpose |
|----------|--------|---------|---------|
| `/products/{sku}` | GET | product-service:8080 | Product detail |
| `/products/search` | GET | product-service:8080 | Product search |
| `/carts` | POST | cart-service:8081 | Create cart |
| `/carts/{id}` | GET | cart-service:8081 | Get cart |
| `/carts/{id}/products` | POST | cart-service:8081 | Add to cart |
| `/carts/{id}/products/{sku}` | PUT | cart-service:8081 | Update quantity |
| `/carts/{id}/products/{sku}` | DELETE | cart-service:8081 | Remove item |

**Required Headers:**
```
x-store-number: Integer (1-2000)
x-order-number: UUID
x-userid: 6 alphanumeric chars
x-sessionid: UUID
```

---

## Files Summary (All Sub-Plans)

| Action | File | Sub-Plan |
|--------|------|----------|
| CREATE | `apps/ecommerce-web/` | 023A |
| CREATE | `apps/ecommerce-web/src/features/products/` | 023A |
| CREATE | `apps/ecommerce-web/src/features/cart/` | 023A |
| CREATE | `apps/ecommerce-web/e2e/` | 023A |
| CREATE | `libs/shared-data/` | 023A |
| CREATE | `e2e/ecommerce-fullstack/` | 023B |
| CREATE | `.github/workflows/e2e.yml` | 023B |
| MODIFY | `docker/docker-compose.yml` | 023B |
| MODIFY | `AGENTS.md` | 023B |

---

## Checklist

- [ ] 023A: ecommerce-web app scaffolded
- [ ] 023A: Product listing/detail features working
- [ ] 023A: Cart features working (add, update, remove)
- [ ] 023A: MSW handlers for all API endpoints
- [ ] 023A: Mocked Playwright E2E passing
- [ ] 023A: Ladle stories for all feature states
- [ ] 023B: Docker Compose E2E environment configured
- [ ] 023B: Data seeding scripts working
- [ ] 023B: Full-stack Playwright E2E passing
- [ ] 023B: CI jobs for both E2E tracks
- [ ] Documentation updated (AGENTS.md, READMEs)
