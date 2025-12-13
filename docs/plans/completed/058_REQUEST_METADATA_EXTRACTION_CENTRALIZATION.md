# 058_REQUEST_METADATA_EXTRACTION_CENTRALIZATION

**Status: DRAFT**

---

## Overview

Centralize request-metadata extraction in `platform-webflux` to eliminate duplicated header extraction code across 11 controllers in 6 services. Currently, every REST controller manually extracts 4 headers (`x-store-number`, `x-order-number`, `x-userid`, `x-sessionid`) and constructs `RequestMetadata`—this is error-prone and creates ~100+ lines of duplicated code. This plan implements the `ContextKeys.fromHeaders()` convenience method already documented in the README but never implemented.

## Goals

1. Implement `RequestMetadataExtractor.fromHeaders(HttpHeaders)` utility in platform-webflux
2. Implement `ContextKeys.fromHeaders(HttpHeaders)` convenience method as documented
3. Create reusable `AbstractGraphQlContextInterceptor` base class
4. Migrate existing controllers and GraphQL interceptors to use centralized extraction

## References

**Standards:**
- `docs/standards/backend/architecture.md` - Controller layer responsibilities

---

## Architecture

### Current State (Duplicated)

```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  ProductController  │   │   CartController    │   │ CheckoutController  │
├─────────────────────┤   ├─────────────────────┤   ├─────────────────────┤
│ @RequestHeader x4   │   │ @RequestHeader x4   │   │ @RequestHeader x4   │
│ new RequestMetadata │   │ new RequestMetadata │   │ new RequestMetadata │
│ .contextWrite(...)  │   │ .contextWrite(...)  │   │ .contextWrite(...)  │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
         ↓                         ↓                         ↓
    Same extraction logic duplicated 32+ times
```

### Target State (Centralized)

```
                    ┌───────────────────────────────┐
                    │      platform-webflux         │
                    ├───────────────────────────────┤
                    │ RequestMetadataExtractor      │
                    │   .fromHeaders(HttpHeaders)   │
                    │                               │
                    │ ContextKeys                   │
                    │   .fromHeaders(HttpHeaders)   │
                    │                               │
                    │ AbstractGraphQlContext...     │
                    │   (base interceptor)          │
                    └───────────────────────────────┘
                              ↑
         ┌────────────────────┼────────────────────┐
         │                    │                    │
┌────────┴────────┐  ┌────────┴────────┐  ┌───────┴────────┐
│ ProductController│  │  CartController │  │ CheckoutCtrl   │
├─────────────────┤  ├─────────────────┤  ├────────────────┤
│ HttpHeaders hdrs│  │ HttpHeaders hdrs│  │HttpHeaders hdrs│
│ .contextWrite(  │  │ .contextWrite(  │  │.contextWrite(  │
│   ContextKeys.  │  │   ContextKeys.  │  │  ContextKeys.  │
│   fromHeaders)  │  │   fromHeaders)  │  │  fromHeaders)  │
└─────────────────┘  └─────────────────┘  └────────────────┘
```

### Dependency Order

```
Phase 1 (Platform Library)
        │
        ▼
Phase 2 (Service Migrations)  ← All can run in parallel after Phase 1
   ┌────┼────┬────┬────┬────┐
   │    │    │    │    │    │
   ▼    ▼    ▼    ▼    ▼    ▼
 Prod Cart Chk  Cust Disc Order
```

---

## Phase 1: Platform Library Enhancement

**Prereqs:** platform-webflux module exists with `RequestMetadata` and `ContextKeys`
**Blockers:** None

### 1.1 Create RequestMetadataExtractor

**Files:**
- CREATE: `libs/backend/platform/platform-webflux/src/main/java/org/example/platform/webflux/context/RequestMetadataExtractor.java`

**Implementation:**

```java
package org.example.platform.webflux.context;

import org.springframework.http.HttpHeaders;

/**
 * Extracts RequestMetadata from HTTP headers.
 *
 * <p>Centralizes null-handling and parsing logic for the 4 required headers.
 * If headers are missing or malformed, defaults are used so downstream
 * validators can produce aggregated errors.
 */
public final class RequestMetadataExtractor {

    public static final String HEADER_STORE_NUMBER = "x-store-number";
    public static final String HEADER_ORDER_NUMBER = "x-order-number";
    public static final String HEADER_USER_ID = "x-userid";
    public static final String HEADER_SESSION_ID = "x-sessionid";

    private RequestMetadataExtractor() {}

    /**
     * Extracts RequestMetadata from HttpHeaders.
     *
     * @param headers HTTP headers (may be null)
     * @return RequestMetadata with parsed values (defaults for missing/invalid)
     */
    public static RequestMetadata fromHeaders(HttpHeaders headers) {
        if (headers == null) {
            return new RequestMetadata(0, "", "", "");
        }

        int storeNumber = parseStoreNumber(headers.getFirst(HEADER_STORE_NUMBER));
        String orderNumber = nullToEmpty(headers.getFirst(HEADER_ORDER_NUMBER));
        String userId = nullToEmpty(headers.getFirst(HEADER_USER_ID));
        String sessionId = nullToEmpty(headers.getFirst(HEADER_SESSION_ID));

        return new RequestMetadata(storeNumber, orderNumber, userId, sessionId);
    }

    private static int parseStoreNumber(String value) {
        if (value == null || value.isBlank()) {
            return 0;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
```

### 1.2 Add ContextKeys.fromHeaders() Convenience Method

**Files:**
- MODIFY: `libs/backend/platform/platform-webflux/src/main/java/org/example/platform/webflux/context/ContextKeys.java`

**Implementation:**

Add these methods to existing `ContextKeys` class:

```java
import org.springframework.http.HttpHeaders;
import java.util.function.Function;
import reactor.util.context.Context;

// ... existing code ...

/**
 * Creates a context modifier that adds RequestMetadata from headers.
 *
 * <p>Usage: {@code .contextWrite(ContextKeys.fromHeaders(httpHeaders))}
 *
 * @param headers HTTP headers to extract metadata from
 * @return Context modifier function
 */
public static Function<Context, Context> fromHeaders(HttpHeaders headers) {
    RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);
    return ctx -> ctx.put(METADATA, metadata);
}
```

### 1.3 Create AbstractGraphQlContextInterceptor

**Files:**
- CREATE: `libs/backend/platform/platform-webflux/src/main/java/org/example/platform/webflux/graphql/AbstractGraphQlContextInterceptor.java`

**Implementation:**

```java
package org.example.platform.webflux.graphql;

import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadataExtractor;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import reactor.core.publisher.Mono;

/**
 * Base GraphQL interceptor that populates RequestMetadata into Reactor context.
 *
 * <p>Extend this class to get automatic header extraction for GraphQL endpoints.
 */
public abstract class AbstractGraphQlContextInterceptor implements WebGraphQlInterceptor {

    @Override
    public Mono<WebGraphQlResponse> intercept(WebGraphQlRequest request, Chain chain) {
        return chain.next(request)
            .contextWrite(ContextKeys.fromHeaders(request.getHeaders()));
    }
}
```

### 1.4 Add Tests

**Files:**
- CREATE: `libs/backend/platform/platform-webflux/src/test/java/org/example/platform/webflux/context/RequestMetadataExtractorTest.java`
- CREATE: `libs/backend/platform/platform-webflux/src/test/java/org/example/platform/webflux/context/ContextKeysTest.java`

**Implementation (RequestMetadataExtractorTest):**

```java
package org.example.platform.webflux.context;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import static org.assertj.core.api.Assertions.assertThat;

class RequestMetadataExtractorTest {

    @Test
    void fromHeaders_extractsAllHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("x-store-number", "100");
        headers.add("x-order-number", "order-123");
        headers.add("x-userid", "user01");
        headers.add("x-sessionid", "sess-456");

        RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);

        assertThat(metadata.storeNumber()).isEqualTo(100);
        assertThat(metadata.orderNumber()).isEqualTo("order-123");
        assertThat(metadata.userId()).isEqualTo("user01");
        assertThat(metadata.sessionId()).isEqualTo("sess-456");
    }

    @Test
    void fromHeaders_handlesNullHeaders() {
        RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(null);

        assertThat(metadata.storeNumber()).isEqualTo(0);
        assertThat(metadata.orderNumber()).isEmpty();
        assertThat(metadata.userId()).isEmpty();
        assertThat(metadata.sessionId()).isEmpty();
    }

    @Test
    void fromHeaders_handlesMissingHeaders() {
        HttpHeaders headers = new HttpHeaders();

        RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);

        assertThat(metadata.storeNumber()).isEqualTo(0);
        assertThat(metadata.orderNumber()).isEmpty();
    }

    @Test
    void fromHeaders_handlesInvalidStoreNumber() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("x-store-number", "not-a-number");

        RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);

        assertThat(metadata.storeNumber()).isEqualTo(0);
    }

    @Test
    void fromHeaders_handlesBlankStoreNumber() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("x-store-number", "  ");

        RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);

        assertThat(metadata.storeNumber()).isEqualTo(0);
    }
}
```

**Implementation (ContextKeysTest):**

```java
package org.example.platform.webflux.context;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import reactor.util.context.Context;
import static org.assertj.core.api.Assertions.assertThat;

class ContextKeysTest {

    @Test
    void fromHeaders_createsContextModifier() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("x-store-number", "100");
        headers.add("x-userid", "user01");

        Context ctx = Context.empty().transform(ContextKeys.fromHeaders(headers));

        assertThat(ctx.hasKey(ContextKeys.METADATA)).isTrue();
        RequestMetadata metadata = ctx.get(ContextKeys.METADATA);
        assertThat(metadata.storeNumber()).isEqualTo(100);
        assertThat(metadata.userId()).isEqualTo("user01");
    }
}
```

### 1.5 Update README

**Files:**
- MODIFY: `libs/backend/platform/platform-webflux/README.md`

**Implementation:**

Update "From Headers (Convenience)" section to show `RequestMetadataExtractor`:

```markdown
### From Headers (Convenience)

Extract metadata directly from headers:

```java
RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);
```

Or use the context modifier for reactive chains:

```java
return Mono.deferContextual(ctx -> processRequest())
    .contextWrite(ContextKeys.fromHeaders(httpHeaders));
```

### GraphQL Interceptor

For GraphQL endpoints, extend the base interceptor:

```java
@Component
public class MyGraphQlContextInterceptor extends AbstractGraphQlContextInterceptor {
    // Metadata extraction is automatic
}
```
```

---

## Phase 2: Service Migrations

**Prereqs:** Phase 1 complete, platform-webflux published
**Blockers:** None after Phase 1

### 2.1 Migrate product-service

**Files:**
- MODIFY: `apps/product-service/src/main/java/org/example/product/controller/ProductController.java`
- MODIFY: `apps/product-service/src/main/java/org/example/product/controller/ProductSearchController.java`

**Implementation (ProductController):**

Replace:
```java
@RequestHeader("x-store-number") int storeNumber,
@RequestHeader(value = "x-order-number", required = false) String orderNumber,
@RequestHeader("x-userid") String userId,
@RequestHeader("x-sessionid") String sessionId,
```

With:
```java
@RequestHeader HttpHeaders headers,
```

Replace:
```java
RequestMetadata metadata =
    new RequestMetadata(storeNumber, orderNumber != null ? orderNumber : "", userId, sessionId);
// ... later ...
.contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
```

With:
```java
.contextWrite(ContextKeys.fromHeaders(headers));
```

Update validator call to use `RequestMetadataExtractor` to get individual values if needed:
```java
RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);
return requestValidator.validateProductRequest(
    sku, metadata.storeNumber(), metadata.orderNumber(),
    metadata.userId(), metadata.sessionId())
```

### 2.2 Migrate cart-service

**Files:**
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/controller/CartController.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/controller/CartProductController.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/controller/CartDiscountController.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/controller/CartFulfillmentController.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/controller/CartCustomerController.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/graphql/GraphQlContextInterceptor.java`

**GraphQL Interceptor Migration:**

Replace entire `GraphQlContextInterceptor` implementation:
```java
@Component
public class GraphQlContextInterceptor extends AbstractGraphQlContextInterceptor {
    // All extraction logic now inherited from platform-webflux
}
```

### 2.3 Migrate checkout-service

**Files:**
- MODIFY: `apps/checkout-service/src/main/java/org/example/checkout/controller/CheckoutController.java`

### 2.4 Migrate customer-service

**Files:**
- MODIFY: `apps/customer-service/src/main/java/org/example/customer/controller/CustomerController.java`
- MODIFY: `apps/customer-service/src/main/java/org/example/customer/controller/CustomerAutocompleteController.java`

### 2.5 Migrate discount-service (Fix Incomplete Implementation)

**Files:**
- MODIFY: `apps/discount-service/src/main/java/org/example/discount/controller/MarkdownController.java`

**Note:** This controller currently only extracts `x-userid`. Migration adds all 4 headers.

### 2.6 Add order-service GraphQL Interceptor (New)

**Files:**
- CREATE: `apps/order-service/src/main/java/org/example/order/graphql/GraphQlContextInterceptor.java`

**Implementation:**

```java
package org.example.order.graphql;

import org.example.platform.webflux.graphql.AbstractGraphQlContextInterceptor;
import org.springframework.stereotype.Component;

@Component
public class GraphQlContextInterceptor extends AbstractGraphQlContextInterceptor {
    // Metadata extraction inherited from platform-webflux
}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `platform-webflux/.../RequestMetadataExtractor.java` | Centralized header extraction |
| MODIFY | `platform-webflux/.../ContextKeys.java` | Add fromHeaders() convenience |
| CREATE | `platform-webflux/.../AbstractGraphQlContextInterceptor.java` | Base GraphQL interceptor |
| CREATE | `platform-webflux/.../RequestMetadataExtractorTest.java` | Unit tests |
| CREATE | `platform-webflux/.../ContextKeysTest.java` | Unit tests |
| MODIFY | `platform-webflux/README.md` | Update documentation |
| MODIFY | `product-service/.../ProductController.java` | Use centralized extraction |
| MODIFY | `product-service/.../ProductSearchController.java` | Use centralized extraction |
| MODIFY | `cart-service/.../CartController.java` | Use centralized extraction |
| MODIFY | `cart-service/.../CartProductController.java` | Use centralized extraction |
| MODIFY | `cart-service/.../CartDiscountController.java` | Use centralized extraction |
| MODIFY | `cart-service/.../CartFulfillmentController.java` | Use centralized extraction |
| MODIFY | `cart-service/.../CartCustomerController.java` | Use centralized extraction |
| MODIFY | `cart-service/.../GraphQlContextInterceptor.java` | Extend base class |
| MODIFY | `checkout-service/.../CheckoutController.java` | Use centralized extraction |
| MODIFY | `customer-service/.../CustomerController.java` | Use centralized extraction |
| MODIFY | `customer-service/.../CustomerAutocompleteController.java` | Use centralized extraction |
| MODIFY | `discount-service/.../MarkdownController.java` | Add missing headers |
| CREATE | `order-service/.../GraphQlContextInterceptor.java` | New GraphQL interceptor |

---

## Testing Strategy

1. **Unit tests** for `RequestMetadataExtractor` and `ContextKeys.fromHeaders()`
2. **Existing service tests** should continue to pass (same behavior)
3. **Integration tests** verify context propagation still works

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `libs/backend/platform/platform-webflux/README.md` | Update usage examples |
| `libs/backend/platform/platform-webflux/AGENTS.md` | Add guidance for new classes |

---

## Checklist

- [ ] Phase 1: Platform library enhancement
  - [ ] RequestMetadataExtractor created with tests
  - [ ] ContextKeys.fromHeaders() implemented with tests
  - [ ] AbstractGraphQlContextInterceptor created
  - [ ] README updated
  - [ ] All platform-webflux tests passing
- [ ] Phase 2: Service migrations
  - [ ] product-service migrated (2 controllers)
  - [ ] cart-service migrated (5 controllers + GraphQL interceptor)
  - [ ] checkout-service migrated (1 controller)
  - [ ] customer-service migrated (2 controllers)
  - [ ] discount-service fixed (1 controller)
  - [ ] order-service GraphQL interceptor added
- [ ] All service tests passing
- [ ] Documentation updated
