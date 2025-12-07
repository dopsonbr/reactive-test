# 040_API_CODEGEN

**Status: DRAFT**

---

## Overview

Implement the frontend-backend domain model sharing strategy from ADR 012. This adds springdoc-openapi to all backend services, configures graphql-codegen for cart/order services, and establishes a committed-specs workflow where OpenAPI and GraphQL schemas are versioned in git for LLM agent discovery and offline TypeScript generation.

**Related Plans:**
- `040A_API_CODEGEN_DOCS.md` - Standards, templates, verification scripts, workflow documentation

**Related ADRs:**
- `docs/ADRs/012_frontend_backend_model_sharing.md` - Architectural decision for code-first OpenAPI

## Goals

1. Add springdoc-openapi to all 8 backend services with consistent configuration
2. Generate TypeScript clients from OpenAPI specs for REST endpoints
3. Generate TypeScript types/hooks from GraphQL schemas for cart-service and order-service
4. Commit specs to repository for LLM discoverability and CI validation
5. Replace hand-written frontend types with generated types

## References

**Standards:**
- `docs/standards/backend/architecture.md` - Service package structure for placing annotations

**ADRs:**
- `docs/ADRs/012_frontend_backend_model_sharing.md` - Code-first OpenAPI decision

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Backend Services                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  product    │ │  customer   │ │  discount   │ │ fulfillment │  ...  │
│  │  :8080      │ │  :8083      │ │  :8084      │ │  :8085      │       │
│  │ REST+OpenAPI│ │ REST+OpenAPI│ │ REST+OpenAPI│ │ REST+OpenAPI│       │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │
│         │               │               │               │               │
│         └───────────────┴───────────────┴───────────────┘               │
│                                 │                                        │
│                      /v3/api-docs (JSON)                                │
│  ┌─────────────┐ ┌─────────────┐                                        │
│  │    cart     │ │    order    │                                        │
│  │   :8081     │ │   :8088     │                                        │
│  │ REST+GraphQL│ │ REST+GraphQL│                                        │
│  └──────┬──────┘ └──────┬──────┘                                        │
│         │               │                                                │
│    /graphql + /v3/api-docs                                              │
└─────────┬───────────────┴───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    tools/openapi-codegen/specs/                         │
│  product-service.json, cart-service.json, order-service.json, ...      │
│                    tools/graphql-codegen/schemas/                       │
│  cart-service.graphqls, order-service.graphqls                          │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼  openapi-generator-cli + graphql-codegen
┌─────────────────────────────────────────────────────────────────────────┐
│            libs/frontend/shared-data/api-client/src/generated/          │
│  ├── rest/{service}/models/*.ts, api/*.ts                               │
│  └── graphql/{service}/types.ts, hooks.ts                               │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ecommerce-web, kiosk-web, pos-web import from @reactive-platform/...   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dependency Order

```
         040A Phases 1-2              040 Phase 1
        (Standards/Templates)      (Backend OpenAPI)
                │                        │
                └────────┬───────────────┘
                         │
                    ┌────┴────┐
                    │         │
                    ▼         ▼
               Phase 2    Phase 3
               (REST)    (GraphQL)     ← Can run in parallel
                    │         │
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
         Phase 4    040A Phase 3  040A Phase 4-5
        (Frontend)  (Verification)  (Workflow/Docs)
```

**Parallel Workstreams:**
- 040A (docs/standards) can start immediately
- 040 Phase 1 (backend) can start immediately
- 040A Phase 3+ depends on 040 Phase 2 (specs must exist for verification)

---

## Phase 1: Backend OpenAPI Setup

**Prereqs:** None - foundational phase
**Blockers:** None

### 1.1 Add springdoc to Version Catalog

**Files:**
- MODIFY: `gradle/libs.versions.toml`

**Implementation:**
Add springdoc version and library:
```toml
[versions]
springdoc = "2.8.8"

[libraries]
springdoc-openapi-starter-webflux-ui = { module = "org.springdoc:springdoc-openapi-starter-webflux-ui", version.ref = "springdoc" }
```

### 1.2 Add springdoc to Platform BOM

**Files:**
- MODIFY: `libs/backend/platform/platform-bom/build.gradle.kts`

**Implementation:**
Add to dependencies block:
```kotlin
api(libs.springdoc.openapi.starter.webflux.ui)
```

### 1.3 Configure springdoc in Each Service

**Files:**
- MODIFY: `apps/product-service/src/main/resources/application.yml`
- MODIFY: `apps/cart-service/src/main/resources/application.yml`
- MODIFY: `apps/order-service/src/main/resources/application.yml`
- MODIFY: `apps/customer-service/src/main/resources/application.yml`
- MODIFY: `apps/discount-service/src/main/resources/application.yml`
- MODIFY: `apps/fulfillment-service/src/main/resources/application.yml`
- MODIFY: `apps/checkout-service/src/main/resources/application.yml`
- MODIFY: `apps/audit-service/src/main/resources/application.yml`

**Implementation:**
Add consistent springdoc configuration to each service:
```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
    enabled: true
  show-actuator: false
```

### 1.4 Remove Hardcoded springdoc from product-service

**Files:**
- MODIFY: `apps/product-service/build.gradle.kts`

**Implementation:**
Remove the hardcoded dependency (now comes from BOM):
```kotlin
// REMOVE: implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.8.8")
```

### 1.5 Add @Tag Annotations to Controllers

**Files:**
- MODIFY: `apps/product-service/src/main/java/org/example/product/controller/ProductController.java`
- MODIFY: `apps/product-service/src/main/java/org/example/product/controller/ProductSearchController.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/controller/CartController.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/controller/CartProductController.java`
- MODIFY: `apps/order-service/src/main/java/org/example/order/controller/OrderController.java`
- MODIFY: `apps/customer-service/src/main/java/org/example/customer/controller/CustomerController.java`
- MODIFY: `apps/discount-service/src/main/java/org/example/discount/controller/*.java`
- MODIFY: `apps/fulfillment-service/src/main/java/org/example/fulfillment/controller/*.java`
- MODIFY: `apps/checkout-service/src/main/java/org/example/checkout/controller/*.java`
- MODIFY: `apps/audit-service/src/main/java/org/example/audit/controller/*.java`

**Implementation:**
Add `@Tag` annotation to each controller class:
```java
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Products", description = "Product catalog operations")
@RestController
public class ProductController { ... }
```

### 1.6 Add @Schema Annotations to Key DTOs

**Files:**
- MODIFY: `libs/backend/shared-model/shared-model-product/src/main/java/org/example/model/product/Product.java`
- MODIFY: `libs/backend/shared-model/shared-model-customer/src/main/java/org/example/model/customer/*.java`
- MODIFY: `libs/backend/shared-model/shared-model-discount/src/main/java/org/example/model/discount/*.java`
- MODIFY: `libs/backend/shared-model/shared-model-fulfillment/src/main/java/org/example/model/fulfillment/*.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/domain/Cart.java`
- MODIFY: `apps/order-service/src/main/java/org/example/order/model/Order.java`

**Implementation:**
Add `@Schema` annotations to records:
```java
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Product with pricing and availability")
public record Product(
    @Schema(description = "Stock Keeping Unit", example = "12345")
    long sku,
    @Schema(description = "Product display name")
    String description,
    @Schema(description = "Current price in USD", example = "29.99")
    String price,
    @Schema(description = "Available inventory count", minimum = "0")
    int availableQuantity
) {}
```

---

## Phase 2: REST TypeScript Generation

**Prereqs:** Phase 1 complete (services expose /v3/api-docs)
**Blockers:** Services must be running to fetch specs

### 2.1 Create Specs Directory

**Files:**
- CREATE: `tools/openapi-codegen/specs/.gitkeep`

### 2.2 Update Generation Script

**Files:**
- MODIFY: `tools/openapi-codegen/generate.sh`

**Implementation:**
Replace current script with multi-service version:
```bash
#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPECS_DIR="$SCRIPT_DIR/specs"
OUTPUT_DIR="$SCRIPT_DIR/../../libs/frontend/shared-data/api-client/src/generated/rest"

mkdir -p "$SPECS_DIR" "$OUTPUT_DIR"

declare -A SERVICES=(
  ["product-service"]=8080
  ["cart-service"]=8081
  ["customer-service"]=8083
  ["discount-service"]=8084
  ["fulfillment-service"]=8085
  ["audit-service"]=8086
  ["checkout-service"]=8087
  ["order-service"]=8088
)

echo "=== Fetching OpenAPI specs ==="
for service in "${!SERVICES[@]}"; do
  port="${SERVICES[$service]}"
  echo "Fetching $service from port $port..."
  curl -sf "http://localhost:$port/v3/api-docs" | jq '.' > "$SPECS_DIR/$service.json" \
    || echo "WARNING: $service not running on port $port"
done

echo "=== Generating TypeScript clients ==="
for service in "${!SERVICES[@]}"; do
  if [[ -f "$SPECS_DIR/$service.json" ]]; then
    echo "Generating types for $service..."
    pnpm openapi-generator-cli generate \
      -i "$SPECS_DIR/$service.json" \
      -g typescript-fetch \
      -o "$OUTPUT_DIR/$service" \
      --additional-properties=supportsES6=true,typescriptThreePlus=true,withInterfaces=true \
      --skip-validate-spec
  fi
done

echo "=== Formatting generated code ==="
pnpm prettier --write "$OUTPUT_DIR/**/*.ts" 2>/dev/null || true

echo "Done! Specs: $SPECS_DIR, Types: $OUTPUT_DIR"
```

### 2.3 Create REST Index Exports

**Files:**
- CREATE: `libs/frontend/shared-data/api-client/src/generated/rest/index.ts`

**Implementation:**
```typescript
// Re-export all REST service clients
export * as ProductService from './product-service';
export * as CartService from './cart-service';
export * as CustomerService from './customer-service';
export * as DiscountService from './discount-service';
export * as FulfillmentService from './fulfillment-service';
export * as CheckoutService from './checkout-service';
export * as OrderService from './order-service';
export * as AuditService from './audit-service';
```

---

## Phase 3: GraphQL TypeScript Generation

**Prereqs:** graphql-codegen installed, cart/order services have schemas
**Blockers:** Need to install @graphql-codegen packages

### 3.1 Install GraphQL Codegen Dependencies

**Files:**
- MODIFY: `package.json`

**Implementation:**
```bash
pnpm add -D @graphql-codegen/cli @graphql-codegen/typescript \
  @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-query \
  graphql-request graphql
```

### 3.2 Create GraphQL Codegen Configs

**Files:**
- CREATE: `tools/graphql-codegen/cart-service.yml`
- CREATE: `tools/graphql-codegen/order-service.yml`

**Implementation (cart-service.yml):**
```yaml
schema: http://localhost:8081/graphql
documents: apps/**/src/**/*.graphql
generates:
  libs/frontend/shared-data/api-client/src/generated/graphql/cart-service/types.ts:
    plugins:
      - typescript
      - typescript-operations
    config:
      skipTypename: false
      enumsAsTypes: true

  libs/frontend/shared-data/api-client/src/generated/graphql/cart-service/hooks.ts:
    plugins:
      - typescript-react-query
    config:
      fetcher: graphql-request
      exposeQueryKeys: true
```

### 3.3 Copy GraphQL Schemas to Tools Directory

**Files:**
- CREATE: `tools/graphql-codegen/schemas/cart-service.graphqls`
- CREATE: `tools/graphql-codegen/schemas/order-service.graphqls`

**Implementation:**
Copy from source locations for committed reference:
```bash
cp apps/cart-service/src/main/resources/graphql/schema.graphqls \
   tools/graphql-codegen/schemas/cart-service.graphqls
cp apps/order-service/src/main/resources/graphql/schema.graphqls \
   tools/graphql-codegen/schemas/order-service.graphqls
```

### 3.4 Create GraphQL Generation Script

**Files:**
- CREATE: `tools/graphql-codegen/generate.sh`

**Implementation:**
```bash
#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Generating GraphQL types for cart-service ==="
pnpm graphql-codegen --config "$SCRIPT_DIR/cart-service.yml"

echo "=== Generating GraphQL types for order-service ==="
pnpm graphql-codegen --config "$SCRIPT_DIR/order-service.yml"

echo "=== Formatting generated code ==="
pnpm prettier --write "$SCRIPT_DIR/../../libs/frontend/shared-data/api-client/src/generated/graphql/**/*.ts"

echo "Done!"
```

### 3.5 Create GraphQL Index Exports

**Files:**
- CREATE: `libs/frontend/shared-data/api-client/src/generated/graphql/index.ts`

**Implementation:**
```typescript
export * as CartServiceGraphQL from './cart-service/types';
export * as CartServiceHooks from './cart-service/hooks';
export * as OrderServiceGraphQL from './order-service/types';
export * as OrderServiceHooks from './order-service/hooks';
```

### 3.6 Update Package.json Scripts

**Files:**
- MODIFY: `package.json`

**Implementation:**
```json
{
  "scripts": {
    "generate:api": "./tools/openapi-codegen/generate.sh",
    "generate:graphql": "./tools/graphql-codegen/generate.sh",
    "generate:all": "pnpm generate:api && pnpm generate:graphql"
  }
}
```

---

## Phase 4: Frontend Integration

**Prereqs:** Phases 2 and 3 complete (generated types exist)
**Blockers:** None

### 4.1 Update API Client Exports

**Files:**
- MODIFY: `libs/frontend/shared-data/api-client/src/index.ts`

**Implementation:**
```typescript
// Manual utilities (keep existing)
export { apiClient, type RequestOptions } from './lib/api-client';
export { ApiError } from './lib/errors';

// Generated REST clients
export * from './generated/rest';

// Generated GraphQL types and hooks
export * from './generated/graphql';
```

### 4.2 Update ecommerce-web Product Types

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/products/api/useProducts.ts`
- MODIFY: `apps/ecommerce-web/src/features/products/api/useProduct.ts`
- DELETE: `apps/ecommerce-web/src/features/products/types/product.ts`

**Implementation:**
Replace hand-written types with imports from generated client:
```typescript
import { Product } from '@reactive-platform/api-client/rest/product-service';
```

### 4.3 Update ecommerce-web Cart Types

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/cart/api/useCart.ts`
- MODIFY: `apps/ecommerce-web/src/features/cart/api/useAddToCart.ts`
- DELETE: `apps/ecommerce-web/src/features/cart/types/cart.ts`

**Implementation:**
Replace hand-written types with generated GraphQL types:
```typescript
import { Cart, useCartQuery } from '@reactive-platform/api-client/graphql/cart-service';
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `gradle/libs.versions.toml` | Add springdoc version |
| MODIFY | `libs/backend/platform/platform-bom/build.gradle.kts` | Add springdoc to BOM |
| MODIFY | `apps/*/src/main/resources/application.yml` (8 files) | Configure springdoc |
| MODIFY | `apps/*/controller/*.java` (~15 files) | Add @Tag annotations |
| MODIFY | `libs/backend/shared-model/**/**.java` (~10 files) | Add @Schema annotations |
| MODIFY | `tools/openapi-codegen/generate.sh` | Multi-service generation |
| CREATE | `tools/openapi-codegen/specs/*.json` (8 files) | Committed OpenAPI specs |
| CREATE | `tools/graphql-codegen/*.yml` (2 files) | GraphQL codegen configs |
| CREATE | `tools/graphql-codegen/generate.sh` | GraphQL generation script |
| CREATE | `tools/graphql-codegen/schemas/*.graphqls` (2 files) | Committed GraphQL schemas |
| CREATE | `libs/frontend/shared-data/api-client/src/generated/**` | Generated TypeScript |
| MODIFY | `libs/frontend/shared-data/api-client/src/index.ts` | Export generated types |
| DELETE | `apps/ecommerce-web/src/features/*/types/*.ts` | Remove hand-written types |
| MODIFY | `apps/ecommerce-web/src/features/*/api/*.ts` | Use generated types |

---

## Testing Strategy

1. **OpenAPI Generation Test**: Start each service, verify `/v3/api-docs` returns valid JSON
2. **Type Compilation**: Run `pnpm nx build api-client` to verify generated types compile
3. **Frontend Integration**: Run `pnpm nx build ecommerce-web` to verify imports work
4. **E2E Smoke Test**: Run existing e2e tests to verify API calls still work

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add `pnpm generate:api` and `pnpm generate:graphql` commands |
| `libs/frontend/shared-data/api-client/README.md` | Document generated types usage |
| `tools/openapi-codegen/README.md` | Create: Document spec generation workflow |
| `tools/graphql-codegen/README.md` | Create: Document GraphQL codegen workflow |

---

## Checklist

- [ ] Phase 1: Backend OpenAPI setup complete
- [ ] Phase 2: REST TypeScript generation working
- [ ] Phase 3: GraphQL TypeScript generation working
- [ ] Phase 4: Frontend using generated types
- [ ] All services expose /v3/api-docs
- [ ] Specs committed to tools/openapi-codegen/specs/
- [ ] GraphQL schemas committed to tools/graphql-codegen/schemas/
- [ ] ecommerce-web builds with generated types
- [ ] Documentation updated
