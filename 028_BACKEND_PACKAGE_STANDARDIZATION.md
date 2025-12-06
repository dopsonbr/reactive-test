# 028_BACKEND_PACKAGE_STANDARDIZATION

**Status: DRAFT**

---

## Overview

Standardize backend service package structures to align with documented standards in `docs/standards/backend/architecture.md`. Currently, services deviate from standards with inconsistent naming (`model/` vs `domain/`, `client/` vs `repository/`), missing validation layers, and scattered DTO locations.

**Related Plans:**
- `010_DEFINE_STANDARDS` (archived) - Original standards definition

## Goals

1. Update `docs/standards/backend/architecture.md` to clarify package conventions with explicit guidance
2. Rename `model/` packages to `domain/` in cart-service
3. Move `client/` packages to `repository/{serviceName}/` pattern in cart-service and discount-service
4. Add `validation/` packages to discount-service and audit-service
5. Relocate domain models from `client/` to `domain/` in discount-service

## References

**Standards:**
- `docs/standards/backend/architecture.md` - Package structure (to be updated)
- `docs/standards/backend/models.md` - Model categories and locations
- `docs/standards/backend/validation.md` - Validation patterns

## Architecture

### Current State vs Target State

```
CURRENT (Inconsistent)                    TARGET (Standardized)
========================                  =====================

cart-service:                             cart-service:
├── model/          ← WRONG               ├── domain/         ← RENAMED
├── client/         ← WRONG               ├── repository/
│   ├── ProductServiceClient                  ├── product/
│   ├── CustomerServiceClient                 │   └── ProductRepository
│   ├── DiscountServiceClient                 ├── customer/
│   └── FulfillmentServiceClient              ├── discount/
                                              └── fulfillment/

discount-service:                         discount-service:
├── client/         ← WRONG               ├── domain/         ← NEW
│   ├── UserServiceClient                 ├── repository/
│   ├── CustomerServiceClient                 ├── user/
│   ├── UserContext (domain model!)           └── customer/
│   └── LoyaltyInfo (domain model!)       ├── validation/     ← NEW
├── (no validation/)

audit-service:                            audit-service:
├── domain/         ← OK                  ├── domain/
├── (no validation/)                      ├── validation/     ← NEW
```

### Dependency Order

```
Phase 1 (Documentation)
        │
        ▼
   ┌────┴────┐
   ▼         ▼
Phase 2   Phase 3   ← Can run in parallel (different services)
(cart)    (discount)
   │         │
   └────┬────┘
        ▼
    Phase 4
  (audit-service)
        │
        ▼
    Phase 5
   (verification)
```

---

## Phase 1: Update Standards Documentation

**Prereqs:** None
**Blockers:** None

### 1.1 Enhance architecture.md with Explicit Package Guidance

**Files:**
- MODIFY: `docs/standards/backend/architecture.md`

**Implementation:**

Add new section after "Package Structure" clarifying naming conventions:

```markdown
### Package Naming Conventions

| Package | Purpose | Naming | Contents |
|---------|---------|--------|----------|
| `domain/` | Business domain models | Always `domain/`, never `model/` | Java records, enums, value objects |
| `repository/` | External service integration | `repository/{serviceName}/` | WebClient calls, resilience, caching |
| `controller/` | HTTP API endpoints | `controller/` | REST controllers |
| `controller/dto/` | API request/response DTOs | Nested under controller | `*Request`, `*Response` records |
| `service/` | Business logic | `service/` | Service classes |
| `validation/` | Input validation | `validation/` | `*Validator` components |
| `config/` | Spring configuration | `config/` | `*Config`, `*Properties` classes |

#### Repository Package Structure

Each external service gets its own sub-package:

```
repository/
├── merchandise/
│   ├── MerchandiseRepository.java    # WebClient + resilience
│   └── MerchandiseResponse.java      # External API response DTO
├── price/
│   ├── PriceRepository.java
│   ├── PriceRequest.java             # External API request DTO
│   └── PriceResponse.java
└── inventory/
    ├── InventoryRepository.java
    └── InventoryResponse.java
```

#### Anti-pattern: Using `client/` or `model/` packages

```
# DON'T - inconsistent naming
├── client/                    # Use repository/ instead
│   └── ProductServiceClient.java
├── model/                     # Use domain/ instead
│   └── Cart.java
```
```

### 1.2 Update models.md Model Categories Table

**Files:**
- MODIFY: `docs/standards/backend/models.md`

**Implementation:**

Update the Model Categories table to be more explicit:

```markdown
| Category | Package | Naming Pattern | Example |
|----------|---------|----------------|---------|
| Domain models | `domain/` | `{Entity}` | `Cart`, `Product`, `Customer` |
| API requests | `controller/dto/` or `dto/` | `{Action}{Entity}Request` | `CreateCartRequest` |
| API responses | `controller/dto/` or `dto/` | `{Entity}Response` | `CartResponse` |
| External service DTOs | `repository/{service}/` | `{Service}Request/Response` | `MerchandiseResponse` |
| GraphQL inputs | `graphql/input/` | `{Action}{Entity}Input` | `CreateCartInput` |
```

---

## Phase 2: Standardize cart-service

**Prereqs:** Phase 1 complete (standards updated)
**Blockers:** None

### 2.1 Rename model/ to domain/

**Files:**
- RENAME: `apps/cart-service/src/main/java/org/example/cart/model/` → `domain/`
- MODIFY: All files importing from `org.example.cart.model`

**Implementation:**

1. Rename package directory
2. Update package declarations in `Cart.java`, `CartTotals.java`
3. Update all imports across cart-service

Affected imports (search for `org.example.cart.model`):
- `CartService.java`
- `CartController.java`
- `CartProductController.java`
- `CartCustomerController.java`
- `CartDiscountController.java`
- `CartFulfillmentController.java`
- `PostgresCartRepository.java`
- GraphQL controllers

### 2.2 Relocate client/ to repository/{serviceName}/

**Files:**
- RENAME: `apps/cart-service/src/main/java/org/example/cart/client/ProductServiceClient.java` → `repository/product/ProductRepository.java`
- RENAME: `apps/cart-service/src/main/java/org/example/cart/client/CustomerServiceClient.java` → `repository/customer/CustomerRepository.java`
- RENAME: `apps/cart-service/src/main/java/org/example/cart/client/DiscountServiceClient.java` → `repository/discount/DiscountRepository.java`
- RENAME: `apps/cart-service/src/main/java/org/example/cart/client/FulfillmentServiceClient.java` → `repository/fulfillment/FulfillmentRepository.java`
- DELETE: `apps/cart-service/src/main/java/org/example/cart/client/` (empty after moves)

**Implementation:**

For each client file:
1. Move to new location under `repository/{serviceName}/`
2. Rename class from `*ServiceClient` to `*Repository`
3. Update package declaration
4. Keep `@Repository` annotation (or add if missing)
5. Update all injection points in `CartService.java`

### 2.3 Update cart-service Documentation

**Files:**
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/AGENTS.md`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/CONTENTS.md`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/README.md`

---

## Phase 3: Standardize discount-service

**Prereqs:** Phase 1 complete
**Blockers:** None (can run parallel with Phase 2)

### 3.1 Create domain/ Package and Move Domain Models

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/domain/`
- MOVE: `UserContext.java` from `client/` to `domain/`
- MOVE: `LoyaltyInfo.java` from `client/` to `domain/`

**Implementation:**

1. Create `domain/` package
2. Move `UserContext.java` (record with `UserType`, `Permission` enums)
3. Move `LoyaltyInfo.java` (record with `LoyaltyBenefit`, `BenefitType`)
4. Update package declarations
5. Update imports in `UserServiceClient`, `CustomerServiceClient`, `PricingService`

### 3.2 Relocate client/ to repository/{serviceName}/

**Files:**
- RENAME: `apps/discount-service/src/main/java/org/example/discount/client/UserServiceClient.java` → `repository/user/UserRepository.java`
- RENAME: `apps/discount-service/src/main/java/org/example/discount/client/CustomerServiceClient.java` → `repository/customer/CustomerRepository.java`
- DELETE: `apps/discount-service/src/main/java/org/example/discount/client/`

**Implementation:**

1. Create `repository/user/` and `repository/customer/` packages
2. Move and rename client classes to repository classes
3. Update package declarations and class names
4. Update imports in `PricingService.java`, `MarkdownService.java`

### 3.3 Add validation/ Package

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/validation/DiscountRequestValidator.java`

**Implementation:**

Create validator per `docs/standards/backend/validation.md`:

```java
@Component
public class DiscountRequestValidator {

    public Mono<Void> validateDiscountCode(String code, int storeNumber) {
        List<String> errors = new ArrayList<>();

        if (code == null || code.isBlank()) {
            errors.add("Discount code is required");
        }
        if (storeNumber < 1 || storeNumber > 2000) {
            errors.add("Store number must be between 1 and 2000");
        }

        return errors.isEmpty()
            ? Mono.empty()
            : Mono.error(new ValidationException(errors));
    }

    public Mono<Void> validatePricingRequest(PricingRequest request) {
        // Validate cart items, store number, etc.
    }

    public Mono<Void> validateMarkdownRequest(ApplyMarkdownRequest request) {
        // Validate markdown fields
    }
}
```

### 3.4 Wire Validators into Controllers

**Files:**
- MODIFY: `apps/discount-service/src/main/java/org/example/discount/controller/DiscountController.java`
- MODIFY: `apps/discount-service/src/main/java/org/example/discount/controller/PricingController.java`
- MODIFY: `apps/discount-service/src/main/java/org/example/discount/controller/MarkdownController.java`

---

## Phase 4: Add Validation to audit-service

**Prereqs:** Phases 2 and 3 complete
**Blockers:** None

### 4.1 Create validation/ Package

**Files:**
- CREATE: `apps/audit-service/src/main/java/org/example/audit/validation/AuditRequestValidator.java`

**Implementation:**

```java
@Component
public class AuditRequestValidator {

    public Mono<Void> validateEventId(String eventId) {
        if (eventId == null || !isValidUUID(eventId)) {
            return Mono.error(new ValidationException("Event ID must be a valid UUID"));
        }
        return Mono.empty();
    }

    public Mono<Void> validateEntityQuery(String entityType, String entityId) {
        List<String> errors = new ArrayList<>();
        if (entityType == null || entityType.isBlank()) {
            errors.add("Entity type is required");
        }
        if (entityId == null || entityId.isBlank()) {
            errors.add("Entity ID is required");
        }
        return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
    }
}
```

### 4.2 Wire Validator into Controller

**Files:**
- MODIFY: `apps/audit-service/src/main/java/org/example/audit/controller/AuditController.java`

---

## Phase 5: Verification and Cleanup

**Prereqs:** Phases 2, 3, 4 complete
**Blockers:** None

### 5.1 Build and Test All Services

**Commands:**
```bash
pnpm nx run-many -t build -p :apps:cart-service :apps:discount-service :apps:audit-service
pnpm nx run-many -t test -p :apps:cart-service :apps:discount-service :apps:audit-service
```

### 5.2 Verify No Remaining Deviations

**Verification checklist:**
- [ ] No `model/` packages exist (should be `domain/`)
- [ ] No `client/` packages exist (should be `repository/{serviceName}/`)
- [ ] All services have `validation/` packages
- [ ] All imports updated correctly
- [ ] Tests pass

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `docs/standards/backend/architecture.md` | Add explicit package naming guidance |
| MODIFY | `docs/standards/backend/models.md` | Update model categories table |
| RENAME | `cart-service/.../model/` → `domain/` | Standardize domain package name |
| RENAME | `cart-service/.../client/*ServiceClient` → `repository/*/Repository` | Standardize client location |
| MOVE | `discount-service/.../client/UserContext.java` → `domain/` | Move domain models |
| MOVE | `discount-service/.../client/LoyaltyInfo.java` → `domain/` | Move domain models |
| RENAME | `discount-service/.../client/*` → `repository/*/` | Standardize client location |
| CREATE | `discount-service/.../validation/DiscountRequestValidator.java` | Add validation layer |
| CREATE | `audit-service/.../validation/AuditRequestValidator.java` | Add validation layer |
| MODIFY | `cart-service/AGENTS.md`, `CONTENTS.md`, `README.md` | Update documentation |

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `docs/standards/backend/architecture.md` | Add Package Naming Conventions section |
| `docs/standards/backend/models.md` | Update Model Categories table |
| `apps/cart-service/.../AGENTS.md` | Update package structure |
| `apps/cart-service/.../CONTENTS.md` | Update file listings |
| `apps/discount-service/AGENTS.md` | Create if missing, document structure |
| `apps/audit-service/AGENTS.md` | Create if missing, document structure |

---

## Checklist

- [ ] Phase 1: Standards documentation updated
- [ ] Phase 2: cart-service standardized (model→domain, client→repository)
- [ ] Phase 3: discount-service standardized (domain created, client→repository, validation added)
- [ ] Phase 4: audit-service validation added
- [ ] Phase 5: All builds pass, no remaining deviations
- [ ] Documentation updated
