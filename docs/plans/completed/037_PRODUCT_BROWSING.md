# 036 Product Browsing Experience

## Problem Statement

The product search implementation has two critical issues blocking typical e-commerce browsing:

1. **Category-only browsing fails**: Selecting a category without a search query causes a validation error ("Search query is required") because the backend requires a non-empty query.

2. **Search with query returns 500**: When passing a search query in Docker, the backend returns a 500 error because the WireMock mock data doesn't properly support the search flow.

### Root Cause Analysis

#### Issue 1: Category-Only Browsing

**Data Flow:**
```
User clicks "Electronics" category
         ↓
ProductFilters: navigate({ category: "Electronics" })
         ↓
ProductList: useProducts({ category: "Electronics", query: undefined })
         ↓
useProducts: apiClient('/products/search', { params: { q: '', category: 'Electronics' } })
         ↓
Backend: SearchRequestValidator rejects q='' with "Search query is required"
         ↓
400 Bad Request
```

**Problem Location:**
- `SearchRequestValidator.java:30-31` requires non-blank query unconditionally
- `useProducts.ts:19` sends `q: params.query || ''` (empty string when no query)

#### Issue 2: 500 Error on Search

**Root Cause:** The WireMock `catalog-search.json` mapping returns static data but:
- Uses numeric SKUs (123456) while frontend expects string SKUs (SKU-001)
- Has limited product variety (only 3 laptop products)
- Doesn't support category filtering in responses
- The mapping uses `requiredScenarioState: "Started"` which is correct but returns same 3 products regardless of query

## Decision: Unified Browsing Approach

Rather than creating separate `/products` (list) and `/products/search` (search) endpoints, we'll modify the existing search to support both use cases:

**Approach: Query-Optional Search with Category Support**

- Query becomes optional when category is provided
- Empty query + empty category = list all products (paginated)
- Query + category = search within category
- Query only = search all products
- Category only = browse category

This matches common e-commerce patterns where search and browse share the same UI but with different filter states.

## Implementation Phases

### Phase 1: Backend - Allow Category-Only Browsing

**File:** `apps/product-service/src/main/java/org/example/product/validation/SearchRequestValidator.java`

Modify validation to allow:
1. Non-empty query (existing behavior)
2. Empty query WITH category (new - for category browsing)
3. Empty query WITHOUT category (new - for "all products" listing)

```java
// Change from:
if (criteria.query() == null || criteria.query().isBlank()) {
  errors.add(new ValidationError("q", "Search query is required"));
}

// To:
if (criteria.query() != null && !criteria.query().isBlank()) {
  // Query provided - validate length
  if (criteria.query().length() < MIN_QUERY_LENGTH) {
    errors.add(new ValidationError("q", "Search query must be at least " + MIN_QUERY_LENGTH + " characters"));
  } else if (criteria.query().length() > MAX_QUERY_LENGTH) {
    errors.add(new ValidationError("q", "Search query must not exceed " + MAX_QUERY_LENGTH + " characters"));
  }
}
// Empty query is now allowed (for browsing)
```

**File:** `apps/product-service/src/main/java/org/example/product/controller/ProductSearchController.java`

Make `q` parameter optional:
```java
// Change from:
@RequestParam String q,

// To:
@RequestParam(required = false, defaultValue = "") String q,
```

**Tests to update:**
- `SearchRequestValidatorTest.java` - Add tests for category-only and empty query scenarios
- `ProductSearchControllerValidationTest.java` - Update expectations

### Phase 2: WireMock - Comprehensive Product Catalog

**File:** `e2e-test/wiremock/mappings/catalog-search.json`

Replace static mock with intelligent matching:

1. **Default listing** (empty query) - Returns all products paginated
2. **Category filter** - Returns products matching category
3. **Search query** - Returns products matching description
4. **Combined** - Query AND category filter

**New Mock Data Structure:**
```json
{
  "products": [
    {
      "sku": 1001,
      "description": "Wireless Headphones - Premium Noise Canceling",
      "price": 299.99,
      "availableQuantity": 50,
      "category": "Electronics",
      "relevanceScore": 1.0
    },
    // ... 10-15 products across Electronics, Clothing, Home, Sports
  ]
}
```

**Mapping Strategy:**
- Priority 10: Default success response (returns all products)
- Priority 5: Category-specific responses using bodyPatterns matching
- Priority 5: Search query responses using bodyPatterns matching
- Existing chaos scenarios maintained for resilience testing

### Phase 3: Frontend - Don't Send Empty Strings

**File:** `apps/ecommerce-web/src/features/products/api/useProducts.ts`

Only include params that have values:
```typescript
// Change from:
params: {
  q: params.query || '',
  category: params.category || '',
  page: String(params.page || 1),
  limit: String(params.limit || 20),
}

// To:
params: {
  ...(params.query ? { q: params.query } : {}),
  ...(params.category ? { category: params.category } : {}),
  page: String(params.page || 1),
  limit: String(params.limit || 20),
}
```

**File:** `libs/frontend/shared-data/api-client/src/lib/api-client.ts`

Already handles undefined/null correctly (lines 37-41), but verify empty strings are also excluded.

### Phase 4: MSW Handlers - Align with Backend

**File:** `apps/ecommerce-web/src/mocks/handlers.ts`

Update to match backend behavior:
- Return all products when no query AND no category
- Filter by category when category provided
- Search when query provided
- Already mostly correct, just verify edge cases

### Phase 5: Seed Data Alignment

Ensure consistency between:
- MSW mock data (`apps/ecommerce-web/src/mocks/data.ts`)
- WireMock catalog-search responses (`e2e-test/wiremock/mappings/catalog-search.json`)
- E2E test expectations

**Categories to support:**
- Electronics (4 products)
- Clothing (2 products)
- Home (2 products)
- Sports (2 products)

## Testing Strategy

### Unit Tests
- `SearchRequestValidatorTest.java`: Empty query allowed, category-only allowed
- `ProductSearchControllerTest.java`: Query optional, category filtering

### Integration Tests
- `ProductSearchIntegrationTest.java`: Full flow with WireMock

### E2E Tests
- Mocked E2E: Browse by category, search with query, combined filters
- Full-stack E2E: Same tests against real Docker services

## Success Criteria

1. User can click a category and see products (no validation error)
2. User can search with a query and see results
3. User can combine search query with category filter
4. User can view "All Categories" without search query (shows all products)
5. No 500 errors in Docker environment
6. Consistent product data between MSW and WireMock

## Files to Modify

| File | Change |
|------|--------|
| `SearchRequestValidator.java` | Make query optional when category provided |
| `ProductSearchController.java` | Make `q` param optional with default |
| `SearchRequestValidatorTest.java` | Add empty query test cases |
| `catalog-search.json` | Add comprehensive product data with category support |
| `useProducts.ts` | Only send non-empty params |
| `handlers.ts` | Verify MSW behavior matches backend |

## Non-Goals

- Adding a separate `/products` listing endpoint (keep single endpoint)
- Implementing full-text search (WireMock returns static matches)
- Adding sorting UI (backend supports it, but not in scope)
- Product CRUD operations

## Risks

1. **Backward compatibility**: Services expecting required query will break
   - Mitigation: This is internal API, all consumers are in this repo

2. **Cache key changes**: Empty query may collide with other cache entries
   - Mitigation: Cache key includes all params, empty string is valid key segment

## Appendix: Current Code Locations

### Backend
- Controller: `apps/product-service/src/main/java/org/example/product/controller/ProductSearchController.java`
- Validator: `apps/product-service/src/main/java/org/example/product/validation/SearchRequestValidator.java`
- Repository: `apps/product-service/src/main/java/org/example/product/repository/catalog/CatalogSearchRepository.java`

### Frontend
- API Hook: `apps/ecommerce-web/src/features/products/api/useProducts.ts`
- API Client: `libs/frontend/shared-data/api-client/src/lib/api-client.ts`
- Filters: `apps/ecommerce-web/src/features/products/components/ProductFilters.tsx`

### Mocks
- MSW: `apps/ecommerce-web/src/mocks/handlers.ts`, `data.ts`
- WireMock: `e2e-test/wiremock/mappings/catalog-search.json`
