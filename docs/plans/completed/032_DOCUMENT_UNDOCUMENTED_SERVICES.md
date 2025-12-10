# 032_DOCUMENT_UNDOCUMENTED_SERVICES

**Status: COMPLETED**

---

## Overview

Add README.md, AGENTS.md, and CONTENTS.md documentation to four backend services that were created without documentation: checkout-service, customer-service, discount-service, and fulfillment-service. These services have full Java implementations but are missing the standard triple-doc pattern used across documented services (cart-service, order-service, audit-service, product-service).

**Related Plans:**
- 028_BACKEND_PACKAGE_STANDARDIZATION - Established package structure patterns

## Goals

1. Add service-level documentation (README.md, AGENTS.md, CONTENTS.md) to all 4 services
2. Add package-level documentation to all Java packages within each service
3. Follow existing documentation patterns established in cart-service and order-service
4. Enable `/document-packages` slash command to work for these services

## References

**Standards:**
- `docs/standards/documentation.md` - Triple-doc pattern requirements

**Templates:**
- `docs/templates/_template_agents.md` - AGENTS.md structure
- `docs/templates/_template_readme.md` - README.md structure
- `docs/templates/_template_contents.md` - CONTENTS.md structure

---

## Architecture

### Documentation Structure Per Service

```
apps/{service}/
├── README.md                    ← Service overview, API, config, running
├── AGENTS.md                    ← Service-level agent guidance (brief)
├── CONTENTS.md                  ← Service file index
└── src/main/java/org/example/{service}/
    ├── README.md                ← Root package purpose/behavior
    ├── AGENTS.md                ← Root package conventions
    ├── CONTENTS.md              ← Root package file index
    ├── {package}/               ← Each package gets triple docs
    │   ├── README.md
    │   ├── AGENTS.md
    │   └── CONTENTS.md
    └── {nested/package}/        ← Nested packages also documented
        ├── README.md
        ├── AGENTS.md
        └── CONTENTS.md
```

### Services and Package Counts

| Service | Packages | Doc Files Needed |
|---------|----------|------------------|
| checkout-service | 9 | 30 (3 root + 9×3 package) |
| customer-service | 8 | 27 (3 root + 8×3 package) |
| discount-service | 10 | 33 (3 root + 10×3 package) |
| fulfillment-service | 4 | 15 (3 root + 4×3 package) |
| **Total** | **31** | **105** |

### Dependency Order

```
Phase 1: checkout-service
        │
        ▼
Phase 2: customer-service
        │
        ▼
Phase 3: discount-service
        │
        ▼
Phase 4: fulfillment-service
        │
        ▼
Phase 5: Verification
```

Note: Phases 1-4 can run in parallel on separate worktrees if desired.

---

## Phase 1: Document checkout-service

**Prereqs:** None
**Blockers:** None

### 1.1 Service-Level Documentation

**Files:**
- CREATE: `apps/checkout-service/README.md`
- CREATE: `apps/checkout-service/AGENTS.md`
- CREATE: `apps/checkout-service/CONTENTS.md`

**Implementation:**
Use `/document-packages` command or manually create following cart-service pattern.

README.md should cover:
- Service purpose (order checkout and payment processing)
- API endpoints (/checkout/initiate, /checkout/complete, /orders)
- Required headers (x-store-number, x-order-number, x-userid, x-sessionid)
- Configuration (R2DBC PostgreSQL, external service URLs)
- Port: 8087

### 1.2 Package-Level Documentation

**Packages to document:**
```
org.example.checkout/
├── client/          ← CartClient, DiscountClient, FulfillmentClient, PaymentClient
├── config/          ← R2dbcConfiguration, SecurityConfig
├── controller/      ← CheckoutController
├── dto/             ← InitiateCheckoutRequest, CompleteCheckoutRequest, etc.
├── model/           ← Order, OrderLineItem, FulfillmentDetails, PaymentDetails
├── repository/      ← OrderRepository, OrderEntity, PostgresOrderRepository
├── service/         ← CheckoutService
└── validation/      ← CartValidator, CheckoutRequestValidator
```

Each package gets README.md (purpose/behavior), AGENTS.md (boundaries/conventions/warnings), CONTENTS.md (file index).

---

## Phase 2: Document customer-service

**Prereqs:** None (can run parallel with Phase 1)
**Blockers:** None

### 2.1 Service-Level Documentation

**Files:**
- CREATE: `apps/customer-service/README.md`
- CREATE: `apps/customer-service/AGENTS.md`
- CREATE: `apps/customer-service/CONTENTS.md`

**Implementation:**
README.md should cover:
- Service purpose (customer management and profiles)
- API endpoints (/customers CRUD operations)
- Required headers
- Configuration
- Port: 8083

### 2.2 Package-Level Documentation

**Packages to document:**
```
org.example.customer/
├── controller/      ← CustomerController
│   └── dto/         ← CreateCustomerRequest, UpdateCustomerRequest, CustomerSearchRequest
├── exception/       ← CustomerNotFoundException, DuplicateCustomerException, BusinessRuleException
├── repository/      ← CustomerRepository, CustomerEntity, PostgresCustomerRepository
├── security/        ← SecurityConfig
├── service/         ← CustomerService
└── validation/      ← CustomerRequestValidator
```

---

## Phase 3: Document discount-service

**Prereqs:** None (can run parallel with Phases 1-2)
**Blockers:** None

### 3.1 Service-Level Documentation

**Files:**
- CREATE: `apps/discount-service/README.md`
- CREATE: `apps/discount-service/AGENTS.md`
- CREATE: `apps/discount-service/CONTENTS.md`

**Implementation:**
README.md should cover:
- Service purpose (discount pricing engine with promo codes, markdowns, loyalty)
- API endpoints (/discounts, /markdowns, /pricing)
- Required headers
- Configuration
- Port: 8084

### 3.2 Package-Level Documentation

**Packages to document:**
```
org.example.discount/
├── controller/      ← DiscountController, MarkdownController, PricingController
│   └── dto/         ← PricingRequest, CartItem, ShippingOption, ApplyMarkdownRequest
├── domain/          ← UserContext, LoyaltyInfo
├── exception/       ← UnauthorizedMarkdownException
├── repository/      ← DiscountRepository, MarkdownRepository, InMemory implementations
│   ├── customer/    ← CustomerRepository
│   └── user/        ← UserRepository
├── service/         ← DiscountService, MarkdownService, PricingService
└── validation/      ← Request validators
```

---

## Phase 4: Document fulfillment-service

**Prereqs:** None (can run parallel with Phases 1-3)
**Blockers:** None

### 4.1 Service-Level Documentation

**Files:**
- CREATE: `apps/fulfillment-service/README.md`
- CREATE: `apps/fulfillment-service/AGENTS.md`
- CREATE: `apps/fulfillment-service/CONTENTS.md`

**Implementation:**
README.md should cover:
- Service purpose (fulfillment and shipping stub service)
- API endpoints (/addresses/validate, /shipping/options, /fulfillment/plan, /fulfillment/cost)
- Required headers
- Configuration
- Port: 8085

### 4.2 Package-Level Documentation

**Packages to document:**
```
org.example.fulfillment/
├── controller/      ← AddressController, FulfillmentController, ShippingController
├── dto/             ← FulfillmentPlanRequest/Response, ShippingOption, AddressValidation*
└── service/         ← FulfillmentService
```

---

## Phase 5: Verification

**Prereqs:** Phases 1-4 complete
**Blockers:** None

### 5.1 Validate Documentation Completeness

**Implementation:**
```bash
# Count docs per service (should match expected)
for svc in checkout-service customer-service discount-service fulfillment-service; do
  echo "=== $svc ==="
  find apps/$svc -name "README.md" | wc -l
  find apps/$svc -name "AGENTS.md" | wc -l
  find apps/$svc -name "CONTENTS.md" | wc -l
done
```

Expected counts:
| Service | README | AGENTS | CONTENTS |
|---------|--------|--------|----------|
| checkout-service | 10 | 10 | 10 |
| customer-service | 9 | 9 | 9 |
| discount-service | 11 | 11 | 11 |
| fulfillment-service | 5 | 5 | 5 |

### 5.2 Validate Documentation Content

**Implementation:**
- Verify all README.md files have Purpose and Behavior sections
- Verify all AGENTS.md files have Boundaries, Conventions, and Warnings sections
- Verify all CONTENTS.md files list all Java files in their package

---

## Files Summary

| Action | Count | Pattern |
|--------|-------|---------|
| CREATE | 30 | `apps/checkout-service/**/{README,AGENTS,CONTENTS}.md` |
| CREATE | 27 | `apps/customer-service/**/{README,AGENTS,CONTENTS}.md` |
| CREATE | 33 | `apps/discount-service/**/{README,AGENTS,CONTENTS}.md` |
| CREATE | 15 | `apps/fulfillment-service/**/{README,AGENTS,CONTENTS}.md` |
| **Total** | **105** | Documentation files |

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add documentation status note if desired |
| `apps/AGENTS.md` | May need update to reference newly documented services |

---

## Checklist

- [x] Phase 1: checkout-service documented (30 files)
- [x] Phase 2: customer-service documented (27 files)
- [x] Phase 3: discount-service documented (33 files)
- [x] Phase 4: fulfillment-service documented (15 files)
- [x] Phase 5: Verification complete (all 105 files present and valid)
- [x] All README.md have Purpose/Behavior sections
- [x] All AGENTS.md have Boundaries/Conventions/Warnings sections
- [x] All CONTENTS.md list all package files
