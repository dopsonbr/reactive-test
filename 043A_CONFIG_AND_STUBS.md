# 043A_CONFIG_AND_STUBS

**Status: DRAFT**

---

## Overview

Fix configuration inconsistencies and extend WireMock stubs with new fields. This is the first phase of model alignment that must complete before modifying Java/TypeScript code.

**Parent Plan:** `043_MODEL_ALIGNMENT.md`
**Next:** `043B_SHARED_MODELS.md`

---

## Goals

1. Document cart port configuration (8081 Docker / 8082 local)
2. Verify springdoc + Spring Boot 4 compatibility
3. Extend WireMock merchandise stubs with name, imageUrl, category
4. Fix WireMock price stubs to use string format for BigDecimal precision
5. Add originalPrice field to price stubs

---

## Phase 0: Fix Configuration Issues

**Prereqs:** None
**Blockers:** These issues will cause confusion if not fixed first

### 0.1 Document Cart Port Configuration

**Issue:** CLAUDE.md says 8081, but cart-service listens on 8082. Docker maps 8081→8082.

**Resolution:** This is correct behavior for Docker. Update CLAUDE.md to clarify.

**Files:**
- MODIFY: `CLAUDE.md`

**Implementation:**
```markdown
| cart-service        | 8081 (Docker) / 8082 (local) | Shopping cart service |
```

### 0.2 Verify All Cart Port References

**Files to check:**
- `apps/checkout-service/src/main/resources/application.yml` - uses 8082 (correct for local)
- `docker/docker-compose.yml` - maps 8081:8082
- `docker/docker-compose.e2e.yml` - verify mapping

**No changes needed if internal/external ports are consistent.**

### 0.3 Verify Springdoc Compatibility with Spring Boot 4

**Action:** Check springdoc 2.8.8 + Spring Boot 4.0.0 compatibility before 040 plan.

---

## Phase 1: Extend WireMock Stubs

**Prereqs:** Phase 0 complete
**Blockers:** None

### 1.1 Extend Merchandise Stub Response

**Files:**
- MODIFY: `e2e/wiremock/mappings/merchandise.json`

**Current Response:**
```json
{
  "description": "Test Product Description"
}
```

**New Response:**
```json
{
  "name": "Test Product",
  "description": "Test Product Description with detailed information about the product.",
  "imageUrl": "https://cdn.example.com/products/default.jpg",
  "category": "General"
}
```

**Implementation:**
Update all scenario responses (success, timeout, slow) with the new fields:

```json
{
  "mappings": [
    {
      "name": "merchandise-success",
      "priority": 10,
      "scenarioName": "merchandise-chaos",
      "requiredScenarioState": "Started",
      "request": {
        "method": "GET",
        "urlPathPattern": "/merchandise/.*"
      },
      "response": {
        "status": 200,
        "headers": { "Content-Type": "application/json" },
        "jsonBody": {
          "name": "Test Product",
          "description": "Test Product Description with detailed information.",
          "imageUrl": "https://cdn.example.com/products/default.jpg",
          "category": "General"
        },
        "delayDistribution": {
          "type": "lognormal",
          "median": 30,
          "sigma": 0.4
        }
      }
    }
  ]
}
```

### 1.2 Fix Price Stub Response Type

**Files:**
- MODIFY: `e2e/wiremock/mappings/price.json`

**Current Response (WRONG - number):**
```json
{
  "price": 99.99
}
```

**New Response (string for BigDecimal precision):**
```json
{
  "price": "99.99",
  "originalPrice": "129.99",
  "currency": "USD"
}
```

**Implementation:**
Update all scenario responses:

```json
{
  "mappings": [
    {
      "name": "price-success",
      "priority": 10,
      "scenarioName": "price-chaos",
      "requiredScenarioState": "Started",
      "request": {
        "method": "POST",
        "urlPath": "/price"
      },
      "response": {
        "status": 200,
        "headers": { "Content-Type": "application/json" },
        "jsonBody": {
          "price": "99.99",
          "originalPrice": "129.99",
          "currency": "USD"
        },
        "delayDistribution": {
          "type": "lognormal",
          "median": 30,
          "sigma": 0.4
        }
      }
    }
  ]
}
```

### 1.3 Update Product Service Test Stubs (if they exist)

**Files:**
- MODIFY: `apps/product-service/src/test/resources/wiremock/mappings/*.json` (if present)

**Action:** Apply same changes as 1.1 and 1.2 to any test-specific stubs.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `CLAUDE.md` | Clarify cart port (8081 Docker / 8082 local) |
| MODIFY | `e2e/wiremock/mappings/merchandise.json` | Add name, imageUrl, category |
| MODIFY | `e2e/wiremock/mappings/price.json` | Change price to string, add originalPrice |
| VERIFY | `docker/docker-compose.e2e.yml` | Confirm port mapping |
| VERIFY | `apps/product-service/src/test/resources/wiremock/` | Update if stubs exist |

---

## Verification

1. WireMock starts without errors
2. Stub responses match expected JSON shapes
3. Port configuration is documented clearly

---

## Checklist

### Phase 0: Configuration
- [ ] Document cart port situation in CLAUDE.md
- [ ] Verify all cart port references are consistent
- [ ] Verify springdoc + Spring Boot 4 compatibility

### Phase 1: WireMock Stubs
- [ ] Update merchandise.json with name, imageUrl, category
- [ ] Update price.json: change to string, add originalPrice
- [ ] Update any product-service test stubs
- [ ] Verify WireMock starts without errors
