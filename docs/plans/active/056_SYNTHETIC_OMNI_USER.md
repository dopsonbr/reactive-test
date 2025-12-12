# 056_SYNTHETIC_OMNI_USER

**Status: DRAFT**

---

## Overview

Cross-application E2E test suite that validates omni-channel user journeys across multiple apps (Home Portal, E-commerce, POS, Merchant Portal). Unlike single-app fullstack tests, this suite tests data consistency when orders created in one app are viewed/modified in another.

## Goals

1. Validate cross-app data flow (ecommerce order visible in POS with matching details)
2. Provide interactive development workflow using dev-browser skill and Chrome DevTools MCP
3. Create extensible test structure for order variations, product creation, and order modifications
4. Enable CI integration with smoke tests on main, full suite nightly

## References

**Standards:**
- `docs/standards/frontend/testing.md` - Playwright patterns, E2E organization

**Existing E2E Patterns:**
- `e2e/ecommerce-fullstack/` - Fullstack test structure
- `e2e/pos-fullstack/` - Sequential test phases with fixtures

---

## Architecture

```
┌─────────────────┐
│   Home Portal   │ ◄── Starting point
│   :5173         │
└────────┬────────┘
         │ Navigate via app cards
    ┌────┴────┬─────────────┐
    ▼         ▼             ▼
┌────────┐ ┌────────┐ ┌──────────────┐
│Ecommerce│ │  POS   │ │Merchant Portal│
│ :3001  │ │ :3004  │ │    :3010     │
└────┬───┘ └────┬───┘ └──────┬───────┘
     │          │            │
     └──────────┴────────────┘
              │
     ┌────────▼────────┐
     │  Backend APIs   │ ◄── Source of truth
     │ (orders, carts, │     for cross-app
     │  products)      │     validation
     └─────────────────┘
```

### Directory Structure

```
e2e/synthetic-omni-user/
├── playwright.config.ts
├── global-setup.ts
├── global-teardown.ts
├── project.json
├── README.md
├── fixtures/
│   ├── test-base.ts
│   ├── test-data.ts
│   ├── state.json          (gitignored)
│   └── state-manager.ts
├── scripts/
│   └── dev-journey.ts
└── specs/
    ├── phased/
    │   ├── 01-product-creation.spec.ts    [STUB]
    │   ├── 02-ecommerce-order.spec.ts
    │   ├── 03-pos-view-order.spec.ts
    │   └── 04-pos-modify-order.spec.ts    [STUB]
    ├── scenarios/
    │   ├── pickup-order.spec.ts           [STUB]
    │   ├── delivery-order.spec.ts         [STUB]
    │   ├── ship-to-store.spec.ts          [STUB]
    │   └── bundle-product.spec.ts         [STUB]
    └── monolithic/
        └── full-omni-journey.spec.ts      [STUB]
```

### Dependency Order

```
Phase B (Phased Tests)
        │
   suite:phased-01-product-creation
        │
        ▼
   suite:phased-02-ecommerce-order
        │
        ▼
   suite:phased-03-pos-view
        │
        ▼
   suite:phased-04-pos-modify
        │
        ▼
Phase C (Scenarios) ─► suite:scenarios
        │
        ▼
Phase A (Monolithic) ─► suite:monolithic

Smoke (independent): suite:smoke (02 + 03 only)
```

---

## Phase 1: Project Setup

**Prereqs:** Nx workspace configured, Playwright installed, existing fullstack tests working
**Blockers:** None

### 1.1 Create Directory Structure

**Files:**
- CREATE: `e2e/synthetic-omni-user/playwright.config.ts`
- CREATE: `e2e/synthetic-omni-user/project.json`
- CREATE: `e2e/synthetic-omni-user/global-setup.ts`
- CREATE: `e2e/synthetic-omni-user/global-teardown.ts`
- CREATE: `e2e/synthetic-omni-user/.gitignore`

**Implementation:**
- Playwright config with suite-based projects and dependencies
- Nx project.json with `e2e` and `e2e:smoke` targets
- Global setup initializes state file, verifies services running
- Global teardown archives state for debugging

### 1.2 Create Fixtures

**Files:**
- CREATE: `e2e/synthetic-omni-user/fixtures/test-data.ts`
- CREATE: `e2e/synthetic-omni-user/fixtures/state-manager.ts`
- CREATE: `e2e/synthetic-omni-user/fixtures/test-base.ts`

**Implementation:**
- `test-data.ts`: Known users (OMNI_CUSTOMER, OMNI_EMPLOYEE, MERCHANT_USER), products, app URLs
- `state-manager.ts`: Read/write/archive JSON state between phases
- `test-base.ts`: Extended Playwright test with loginEcommerce, loginPOS, navigateViaPortal fixtures

---

## Phase 2: Core Journey Tests

**Prereqs:** Phase 1 complete, services running via `./powerstart`
**Blockers:** None

### 2.1 Ecommerce Order Creation

**Files:**
- CREATE: `e2e/synthetic-omni-user/specs/phased/02-ecommerce-order.spec.ts`

**Implementation:**
- Login with OMNI_CUSTOMER credentials
- Browse products, add to cart
- Complete checkout with pickup fulfillment
- Capture order ID, items, totals to state.json

### 2.2 POS Order View & Validation

**Files:**
- CREATE: `e2e/synthetic-omni-user/specs/phased/03-pos-view-order.spec.ts`

**Implementation:**
- Login with OMNI_EMPLOYEE credentials
- Read order ID from state.json
- Search/lookup order in POS
- Validate structural match: items, quantities, customer, fulfillment type
- Record matched/mismatched fields to state.json

---

## Phase 3: Stub Tests

**Prereqs:** Phase 2 complete
**Blockers:** Merchant Portal product creation UI (for 01), POS order modification UI (for 04)

### 3.1 Product Creation Stub

**Files:**
- CREATE: `e2e/synthetic-omni-user/specs/phased/01-product-creation.spec.ts`

**Implementation:**
- `test.skip` wrapper with TODO comments
- For now, writes pre-seeded products to state.json
- Ready for implementation when Merchant Portal supports product creation

### 3.2 Order Modification Stub

**Files:**
- CREATE: `e2e/synthetic-omni-user/specs/phased/04-pos-modify-order.spec.ts`

**Implementation:**
- `test.skip` wrapper with TODO comments
- Placeholder for add items, change fulfillment, process returns

### 3.3 Scenario Stubs

**Files:**
- CREATE: `e2e/synthetic-omni-user/specs/scenarios/pickup-order.spec.ts`
- CREATE: `e2e/synthetic-omni-user/specs/scenarios/delivery-order.spec.ts`
- CREATE: `e2e/synthetic-omni-user/specs/scenarios/ship-to-store.spec.ts`
- CREATE: `e2e/synthetic-omni-user/specs/scenarios/bundle-product.spec.ts`

**Implementation:**
- Each file has `test.skip` with documented steps
- Ready for implementation when order variations are needed

### 3.4 Monolithic Stub

**Files:**
- CREATE: `e2e/synthetic-omni-user/specs/monolithic/full-omni-journey.spec.ts`

**Implementation:**
- `test.skip` wrapper
- Full journey: product creation → ecommerce order → POS view → POS modify

---

## Phase 4: Dev Browser Integration

**Prereqs:** Phase 1 complete, dev-browser plugin installed
**Blockers:** None

### 4.1 README with Dev Browser Workflow

**Files:**
- CREATE: `e2e/synthetic-omni-user/README.md`

**Implementation:**
- Prerequisites: plugin installation, service startup
- Interactive exploration workflow using Chrome DevTools MCP
- Tool reference table (navigate_page, take_snapshot, click, fill, etc.)
- Example debugging session walkthrough

### 4.2 Dev Journey Script

**Files:**
- CREATE: `e2e/synthetic-omni-user/scripts/dev-journey.ts`

**Implementation:**
- Guided walkthrough steps for each phase
- Checkpoints at each stage for manual verification
- Used with Claude Code for interactive test development

---

## Phase 5: CI Integration

**Prereqs:** Phases 1-2 complete
**Blockers:** None

### 5.1 CI Workflow

**Files:**
- CREATE: `.github/workflows/e2e-omni.yml`

**Implementation:**
- Smoke test on push to main (~2-3 min)
- Full suite nightly + manual trigger (~10-15 min)
- Artifact upload on failure

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `e2e/synthetic-omni-user/playwright.config.ts` | Playwright config with suite dependencies |
| CREATE | `e2e/synthetic-omni-user/project.json` | Nx project configuration |
| CREATE | `e2e/synthetic-omni-user/global-setup.ts` | Initialize state, verify services |
| CREATE | `e2e/synthetic-omni-user/global-teardown.ts` | Archive state for debugging |
| CREATE | `e2e/synthetic-omni-user/.gitignore` | Ignore state.json |
| CREATE | `e2e/synthetic-omni-user/fixtures/test-data.ts` | Known users, products, URLs |
| CREATE | `e2e/synthetic-omni-user/fixtures/state-manager.ts` | JSON state read/write |
| CREATE | `e2e/synthetic-omni-user/fixtures/test-base.ts` | Extended Playwright test |
| CREATE | `e2e/synthetic-omni-user/specs/phased/01-product-creation.spec.ts` | Product creation [STUB] |
| CREATE | `e2e/synthetic-omni-user/specs/phased/02-ecommerce-order.spec.ts` | Ecommerce order flow |
| CREATE | `e2e/synthetic-omni-user/specs/phased/03-pos-view-order.spec.ts` | POS view & validation |
| CREATE | `e2e/synthetic-omni-user/specs/phased/04-pos-modify-order.spec.ts` | POS modify [STUB] |
| CREATE | `e2e/synthetic-omni-user/specs/scenarios/*.spec.ts` | Order variation stubs |
| CREATE | `e2e/synthetic-omni-user/specs/monolithic/full-omni-journey.spec.ts` | Full journey [STUB] |
| CREATE | `e2e/synthetic-omni-user/README.md` | Usage + dev-browser guide |
| CREATE | `e2e/synthetic-omni-user/scripts/dev-journey.ts` | Interactive dev script |
| CREATE | `.github/workflows/e2e-omni.yml` | CI workflow |

---

## Testing Strategy

**Blackbox Testing Only:**
- All interactions through UI, never query backend directly
- Known test users/customers/products pre-seeded
- Fresh orders created every run

**Validation Approach:**
- Structural match for key business data (items, quantities, customer, fulfillment)
- Allow backend-computed differences (tax calculations, timestamps)
- Record matched/mismatched fields for debugging

**State Management:**
- File-based state (state.json) passed between phases
- State archived after each run for debugging
- Each phase reads from previous, writes its results

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add synthetic-omni-user to E2E test organization section |
| `e2e/synthetic-omni-user/README.md` | Full usage guide (created in Phase 4) |

---

## Checklist

- [ ] Phase 1: Project setup complete
- [ ] Phase 2: Core journey tests working (02, 03)
- [ ] Phase 3: All stub tests created
- [ ] Phase 4: README and dev-journey script complete
- [ ] Phase 5: CI workflow configured
- [ ] Tests pass locally with `pnpm nx e2e synthetic-omni-user`
- [ ] Smoke tests pass with `pnpm nx e2e:smoke synthetic-omni-user`
- [ ] Documentation updated
