# 043_MODEL_ALIGNMENT

**Status: DRAFT**

---

## Overview

Align backend and frontend data models to establish a single source of truth. This plan extends backend Product and Cart models to include all fields required by the frontend, updates data sources (WireMock stubs, service responses), and ensures type consistency across the stack.

**Prerequisite for:** `040_API_CODEGEN.md` - OpenAPI/GraphQL TypeScript generation

**Motivation:** Backend models lack fields the frontend needs (`imageUrl`, `name`, `category`), forcing separate type definitions and mapping layers. By extending backend models first, subsequent codegen can generate types frontend uses directly.

---

## Sub-Plans

Execute these in order:

| Sub-Plan | Phases | Description |
|----------|--------|-------------|
| `043A_CONFIG_AND_STUBS.md` | 0-1 | Fix configuration, extend WireMock stubs |
| `043B_SHARED_MODELS.md` | 2-3 | Extend shared model records and DTOs |
| `043C_BACKEND_SERVICES.md` | 4-5 | Update ProductService and Cart service |
| `043D_FRONTEND_ALIGNMENT.md` | 6-7 | Update frontend types and all tests |

### Execution Order

```
┌──────────────────────────────────────────────────────────────────┐
│  043A: CONFIG & STUBS                                            │
│  - Document cart port (8081 Docker / 8082 local)                 │
│  - Extend WireMock: merchandise adds name/imageUrl/category      │
│  - Extend WireMock: price changes to string, adds originalPrice  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ stubs return new fields
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  043B: SHARED MODELS                                             │
│  - Product record: +name, +imageUrl, +category, +originalPrice   │
│  - CartProduct record: same new fields                           │
│  - Price type: String → BigDecimal                               │
└──────────────────────────┬───────────────────────────────────────┘
                           │ Java records updated
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  043C: BACKEND SERVICES                                          │
│  - ProductService aggregates new fields from stubs               │
│  - Cart service uses extended CartProduct                        │
│  - GraphQL schema adds new CartProduct fields                    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ APIs return complete data
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  043D: FRONTEND & TESTS                                          │
│  - TypeScript types match backend response                       │
│  - Remove mapping functions (no longer needed)                   │
│  - Update all tests with new shapes                              │
└──────────────────────────┬───────────────────────────────────────┘
                           │ model alignment complete
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  040: API CODEGEN (separate plan)                                │
│  - Generate TypeScript from OpenAPI specs                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Goals

1. Extend Product with: `name`, `imageUrl`, `category`, `originalPrice`
2. Extend CartProduct with display fields for cart rendering
3. Change price type from String to BigDecimal
4. Frontend consumes backend responses without transformation

## Non-Goals

- OpenAPI annotations - covered in 040
- TypeScript code generation - covered in 040
- Real catalog service - category in merchandise mock
- BFF patterns - rejected in favor of source alignment

---

## Type Decisions

| Field | Java Type | JSON | Frontend Type |
|-------|-----------|------|---------------|
| `sku` | `long` | number | `number` |
| `price` | `BigDecimal` | string | `string` |
| `originalPrice` | `BigDecimal` | string/null | `string \| null` |
| `availableQuantity` | `int` | number | `number` |

---

## Breaking Changes

1. Product/CartProduct record signatures changed
2. Price type: String → BigDecimal
3. API response shapes changed
4. WireMock stubs changed

**Rollback:** Revert all 4 sub-plans together.

---

## Verification

```bash
pnpm nx run-many -t build
pnpm nx run-many -t test
pnpm nx e2e ecommerce-fullstack-e2e
```

---

## Checklist

- [ ] 043A complete (config + stubs)
- [ ] 043B complete (shared models)
- [ ] 043C complete (backend services)
- [ ] 043D complete (frontend + tests)
- [ ] All builds pass
- [ ] All tests pass
- [ ] E2E flow works
