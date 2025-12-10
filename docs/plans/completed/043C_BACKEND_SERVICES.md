# 043C_BACKEND_SERVICES

**Status: COMPLETE**

---

## Overview

Update ProductService aggregation logic and Cart service to use the extended models. This phase connects the updated DTOs from 043B to produce complete responses.

**Parent Plan:** `043_MODEL_ALIGNMENT.md`
**Prereqs:** `043B_SHARED_MODELS.md` (shared models must be extended first)
**Next:** `043D_FRONTEND_ALIGNMENT.md`

---

## Goals

1. Update ProductService aggregation to populate all new fields
2. Rename merchandise method to reflect broader scope
3. Update Cart service ProductRepository client
4. Update GraphQL schema with new CartProduct fields
5. Verify GraphQL resolvers work with extended models

---

## Phase 4: Update ProductService Aggregation

**Prereqs:** 043B complete
**Blockers:** None

### 4.1 Update ProductService.getProduct()

**Files:**
- MODIFY: `apps/product-service/src/main/java/org/example/product/service/ProductService.java`

**Current Logic:**
```java
return Mono.zip(
    merchandiseRepo.getDescription(sku),
    priceRepo.getPrice(sku),
    inventoryRepo.getAvailability(sku)
).map(tuple -> new Product(
    sku,
    tuple.getT1().description(),
    tuple.getT2().price(),
    tuple.getT3().availableQuantity()
));
```

**New Logic:**
```java
return Mono.zip(
    merchandiseRepo.getMerchandise(sku),  // Returns name, description, imageUrl, category
    priceRepo.getPrice(sku),              // Returns price, originalPrice, currency
    inventoryRepo.getAvailability(sku)    // Returns availableQuantity
).map(tuple -> {
    MerchandiseResponse merch = tuple.getT1();
    PriceResponse pricing = tuple.getT2();
    InventoryResponse inv = tuple.getT3();

    return new Product(
        sku,
        merch.name(),
        merch.description(),
        pricing.price(),
        pricing.originalPrice(),
        inv.availableQuantity(),
        merch.imageUrl(),
        merch.category()
    );
});
```

### 4.2 Update MerchandiseRepository

**Files:**
- MODIFY: `apps/product-service/src/main/java/org/example/product/repository/merchandise/MerchandiseRepository.java`

**Changes:**
- Rename `getDescription()` to `getMerchandise()`
- Method now returns extended `MerchandiseResponse` with 4 fields
- Update cache key comment (cache now stores full merchandise data)

**Implementation:**
```java
/**
 * Fetch merchandise data for a SKU.
 *
 * @param sku the product SKU
 * @return merchandise data including name, description, imageUrl, category
 */
public Mono<MerchandiseResponse> getMerchandise(long sku) {
    return webClient.get()
        .uri("/merchandise/{sku}", sku)
        .retrieve()
        .bodyToMono(MerchandiseResponse.class)
        .timeout(Duration.ofMillis(merchandiseTimeoutMs));
}
```

**Note:** No separate catalog call needed - category comes from merchandise response.

### 4.3 Update Callers of getDescription

**Files to search:**
```bash
grep -r "getDescription" apps/product-service/src/
```

**Update all usages to use `getMerchandise()` instead.**

---

## Phase 5: Update Cart Service

**Prereqs:** Phase 4 complete
**Blockers:** None

### 5.1 Update ProductRepository Client

**Files:**
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/client/ProductRepository.java`

**Changes:**
- Expect extended Product response from product-service
- Product now has all fields needed for CartProduct
- No code changes needed if deserializing to shared Product model

**Verification:**
Ensure the Product class imported is from `org.example.model.product.Product` (shared model).

### 5.2 Update CartProduct Usage in CartService

**Files:**
- VERIFY: `apps/cart-service/src/main/java/org/example/cart/service/CartService.java`

**Ensure:**
- `CartProduct.fromProduct()` uses all new fields (it will, after 043B)
- Cart domain model works with extended CartProduct
- Any existing tests compile with new constructors

### 5.3 Update GraphQL Schema

**Files:**
- MODIFY: `apps/cart-service/src/main/resources/graphql/schema.graphqls`

**Current CartProduct:**
```graphql
type CartProduct {
    sku: ID!
    description: String!
    unitPrice: String!
    quantity: Int!
    availableQuantity: Int!
    lineTotal: String!
}
```

**New CartProduct:**
```graphql
type CartProduct {
    sku: ID!
    name: String!
    description: String!
    unitPrice: String!
    originalUnitPrice: String
    quantity: Int!
    availableQuantity: Int!
    imageUrl: String!
    category: String!
    lineTotal: String!
    inStock: Boolean!
}
```

### 5.4 Verify GraphQL Resolvers

**Files:**
- VERIFY: `apps/cart-service/src/main/java/org/example/cart/graphql/*.java`

**Ensure:**
- CartProduct fields are populated from the domain model
- No explicit resolver needed if field names match (GraphQL will auto-resolve)
- New fields must be present in the CartProduct record (done in 043B)

**If using DataFetcher pattern:**
```java
// No changes needed if CartProduct record fields match GraphQL schema fields
// Spring for GraphQL will auto-map matching field names
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `apps/product-service/.../ProductService.java` | Aggregate all new fields |
| MODIFY | `apps/product-service/.../MerchandiseRepository.java` | Rename to getMerchandise() |
| VERIFY | `apps/cart-service/.../ProductRepository.java` | Uses extended Product |
| VERIFY | `apps/cart-service/.../CartService.java` | CartProduct.fromProduct() works |
| MODIFY | `apps/cart-service/.../schema.graphqls` | Add new CartProduct fields |
| VERIFY | `apps/cart-service/.../graphql/*.java` | Resolvers auto-map new fields |

---

## Verification

After completing this phase:

```bash
# Build product-service
pnpm nx build :apps:product-service

# Build cart-service
pnpm nx build :apps:cart-service

# Run tests
pnpm nx test :apps:product-service
pnpm nx test :apps:cart-service

# Start services and test endpoints
./gradlew :apps:product-service:bootRun
curl http://localhost:8080/products/12345 | jq .

# Should return:
# {
#   "sku": 12345,
#   "name": "Test Product",
#   "description": "...",
#   "price": "99.99",
#   "originalPrice": "129.99",
#   "availableQuantity": 100,
#   "imageUrl": "https://cdn.example.com/...",
#   "category": "General",
#   "inStock": true,
#   "onSale": true
# }
```

---

## Checklist

### Phase 4: ProductService
- [ ] Update aggregation logic for new fields
- [ ] Rename getDescription() to getMerchandise()
- [ ] Update all callers of getDescription()
- [ ] Category comes from merchandise (no catalog call needed)
- [ ] ProductService compiles successfully

### Phase 5: Cart Service
- [ ] Verify ProductRepository client uses shared Product
- [ ] Verify CartProduct.fromProduct() works with extended Product
- [ ] Update GraphQL schema with 5 new fields
- [ ] Verify GraphQL resolvers auto-map new fields
- [ ] Cart service compiles successfully
- [ ] GraphQL queries return all new fields
