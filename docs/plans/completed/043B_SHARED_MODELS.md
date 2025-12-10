# 043B_SHARED_MODELS

**Status: COMPLETE**

---

## Overview

Extend shared model records (Product, CartProduct) and service response DTOs with all frontend-required fields. Uses BigDecimal for price precision.

**Parent Plan:** `043_MODEL_ALIGNMENT.md`
**Prereqs:** `043A_CONFIG_AND_STUBS.md` (WireMock stubs must return new fields first)
**Next:** `043C_BACKEND_SERVICES.md`

---

## Goals

1. Extend Product record with name, imageUrl, category, originalPrice fields
2. Change price type from String to BigDecimal
3. Add computed properties (inStock, onSale)
4. Extend CartProduct record with display fields
5. Update MerchandiseResponse and PriceResponse DTOs

---

## Type Decisions

| Field | Java Type | JSON Serialization | Frontend Type |
|-------|-----------|-------------------|---------------|
| `sku` | `long` | number | `number` |
| `price` | `BigDecimal` | string (quoted) | `string` |
| `originalPrice` | `BigDecimal` | string or null | `string \| null` |
| `availableQuantity` | `int` | number | `number` |

**Rationale:**
- SKU as `long` serializes to JSON number; JS handles integers up to 2^53 safely
- Price as `BigDecimal` with string serialization preserves decimal precision
- WireMock stubs (updated in 043A) now return price as string

---

## Phase 2: Extend Shared Models

**Prereqs:** 043A complete (stubs return new fields)
**Blockers:** None

### 2.1 Extend Product Record

**Files:**
- MODIFY: `libs/backend/shared-model/shared-model-product/src/main/java/org/example/model/product/Product.java`

**Current:**
```java
public record Product(
    long sku,
    String description,
    String price,
    int availableQuantity
) {}
```

**New:**
```java
package org.example.model.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

/**
 * Core product representation with all display fields.
 *
 * @param sku the stock keeping unit identifier
 * @param name short product name for display
 * @param description detailed product description
 * @param price current price
 * @param originalPrice original price before discount (nullable)
 * @param availableQuantity quantity available in inventory
 * @param imageUrl URL to product image
 * @param category product category for filtering/display
 */
public record Product(
    long sku,
    String name,
    String description,
    BigDecimal price,
    BigDecimal originalPrice,
    int availableQuantity,
    String imageUrl,
    String category
) {
    /**
     * Check if product is in stock.
     * @return true if availableQuantity > 0
     */
    @JsonProperty("inStock")
    public boolean inStock() {
        return availableQuantity > 0;
    }

    /**
     * Check if product is on sale (has different original price).
     * @return true if originalPrice differs from price
     */
    @JsonProperty("onSale")
    public boolean onSale() {
        return originalPrice != null && originalPrice.compareTo(price) != 0;
    }
}
```

### 2.2 Extend CartProduct Record

**Files:**
- MODIFY: `libs/backend/shared-model/shared-model-product/src/main/java/org/example/model/product/CartProduct.java`

**New:**
```java
package org.example.model.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

/**
 * Product as it appears in a cart (with quantity and display fields).
 *
 * @param sku the stock keeping unit identifier
 * @param name short product name for display
 * @param description the product description
 * @param unitPrice the unit price
 * @param originalUnitPrice original price before discount (nullable)
 * @param quantity the quantity in the cart
 * @param availableQuantity the quantity available in inventory
 * @param imageUrl URL to product image
 * @param category product category
 */
public record CartProduct(
    long sku,
    String name,
    String description,
    BigDecimal unitPrice,
    BigDecimal originalUnitPrice,
    int quantity,
    int availableQuantity,
    String imageUrl,
    String category
) {
    /**
     * Calculate the line total for this product.
     * @return the line total (unitPrice * quantity)
     */
    @JsonProperty("lineTotal")
    public BigDecimal lineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    /**
     * Check if product is in stock.
     * @return true if availableQuantity > 0
     */
    @JsonProperty("inStock")
    public boolean inStock() {
        return availableQuantity > 0;
    }

    /**
     * Create a CartProduct from a Product with a specified quantity.
     *
     * @param product the source product
     * @param quantity the quantity to add to cart
     * @return a new CartProduct
     */
    public static CartProduct fromProduct(Product product, int quantity) {
        return new CartProduct(
            product.sku(),
            product.name(),
            product.description(),
            product.price(),
            product.originalPrice(),
            quantity,
            product.availableQuantity(),
            product.imageUrl(),
            product.category()
        );
    }

    /**
     * Create a new CartProduct with an updated quantity.
     *
     * @param newQuantity the new quantity
     * @return a new CartProduct with the updated quantity
     */
    public CartProduct withQuantity(int newQuantity) {
        return new CartProduct(
            sku, name, description, unitPrice, originalUnitPrice,
            newQuantity, availableQuantity, imageUrl, category
        );
    }
}
```

---

## Phase 3: Update Service Response DTOs

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Update MerchandiseResponse

**Files:**
- MODIFY: `apps/product-service/src/main/java/org/example/product/repository/merchandise/MerchandiseResponse.java`

**Current:**
```java
public record MerchandiseResponse(String description) {}
```

**New:**
```java
/**
 * Response from merchandise service.
 * Includes all display metadata for a product.
 */
public record MerchandiseResponse(
    String name,
    String description,
    String imageUrl,
    String category
) {}
```

### 3.2 Update PriceResponse

**Files:**
- MODIFY: `apps/product-service/src/main/java/org/example/product/repository/price/PriceResponse.java`

**Current:**
```java
public record PriceResponse(String price) {}
```

**New:**
```java
import java.math.BigDecimal;

/**
 * Response from price service.
 * Prices are BigDecimal for precision.
 */
public record PriceResponse(
    BigDecimal price,
    BigDecimal originalPrice,
    String currency
) {}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `libs/backend/shared-model/shared-model-product/.../Product.java` | Add 4 fields, use BigDecimal |
| MODIFY | `libs/backend/shared-model/shared-model-product/.../CartProduct.java` | Add 4 fields, use BigDecimal |
| MODIFY | `apps/product-service/.../MerchandiseResponse.java` | Extend DTO with 4 fields |
| MODIFY | `apps/product-service/.../PriceResponse.java` | Use BigDecimal, add originalPrice |

---

## Breaking Changes

1. **Product record signature changed** - All code creating Product instances must be updated
2. **CartProduct record signature changed** - Same as above
3. **Price type changed** - String to BigDecimal in Java
4. **MerchandiseResponse signature changed** - Constructor requires 4 fields now
5. **PriceResponse signature changed** - Constructor requires 3 fields now

---

## Verification

After completing this phase:

```bash
# Compile shared models
pnpm nx build :libs:backend:shared-model:shared-model-product

# This WILL fail until 043C is complete (ProductService still uses old signatures)
# That's expected - proceed to 043C
```

---

## Checklist

### Phase 2: Shared Models
- [ ] Extend Product record with 4 new fields, BigDecimal for prices
- [ ] Add inStock() and onSale() methods to Product
- [ ] Extend CartProduct record with 4 new fields, BigDecimal
- [ ] Add lineTotal() and inStock() methods to CartProduct
- [ ] Update CartProduct.fromProduct() for new fields
- [ ] Update CartProduct.withQuantity() for new fields

### Phase 3: Response DTOs
- [ ] Extend MerchandiseResponse with name, description, imageUrl, category
- [ ] Extend PriceResponse with BigDecimal price, originalPrice, currency
- [ ] Verify imports for BigDecimal
