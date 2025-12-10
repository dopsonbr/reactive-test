# 040_API_CODEGEN

**Status: DEFERRED — Optional enhancement, not required for 044/045**

---

## Deferral Notice (2025-01)

This plan is **deferred indefinitely**. Plans 044 (Self-Checkout Kiosk) and 045 (POS System) can proceed without OpenAPI codegen by using hand-written TypeScript types in a shared `commerce-hooks` library.

**Why deferred:**
1. **046 established a different pattern** - Cart now uses hand-rolled GraphQL client + SSE subscriptions, not generated hooks
2. **044A extracts existing types** - The `commerce-hooks` library will contain hand-written types extracted from `ecommerce-web`
3. **No blocking dependency** - Frontend apps don't require generated types to function
4. **Codegen can be added later** - The `commerce-hooks` architecture allows swapping hand-written types for generated ones without changing consuming apps

**If revisiting this plan:**
- Drop Phase 3 (GraphQL codegen) entirely — conflicts with 046's SSE subscription approach
- Focus only on Phases 1-2 (OpenAPI/REST) for services that don't use GraphQL
- Consider generating types only, not full API clients

---

## Original Overview (Historical)

Implement the frontend-backend domain model sharing strategy from ADR 012. This adds springdoc-openapi to all backend services, configures graphql-codegen for cart/order services, and establishes a committed-specs workflow where OpenAPI and GraphQL schemas are versioned in git for LLM agent discovery and offline TypeScript generation.

**Prerequisite Plans:**
- `043_MODEL_ALIGNMENT.md` - Backend/frontend model alignment (must complete first)

**Related Plans:**
- `040A_API_CODEGEN_DOCS.md` - Standards, templates, verification scripts, workflow documentation

**Related ADRs:**
- `docs/ADRs/012_frontend_backend_model_sharing.md` - Architectural decision for code-first OpenAPI

**Why 043 must complete first:**
The OpenAPI codegen generates TypeScript types from backend Java models. If backend models lack fields the frontend needs (imageUrl, name, category), the generated types will be incomplete. Plan 043 extends backend models to include all frontend-required fields, ensuring generated types are immediately usable.

## Goals

1. Add springdoc-openapi to all 9 backend services with consistent configuration
2. Generate TypeScript clients from OpenAPI specs for REST endpoints
3. Generate TypeScript types/hooks from GraphQL schemas for cart-service and order-service
4. Commit specs to repository for LLM discoverability and CI validation
5. Frontend imports generated types (model alignment done in 043)

## References

**Standards:**
- `docs/standards/backend/architecture.md` - Service package structure for placing annotations

**ADRs:**
- `docs/ADRs/012_frontend_backend_model_sharing.md` - Code-first OpenAPI decision

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Backend Services (9 total)                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  product    │ │  customer   │ │  discount   │ │ fulfillment │           │
│  │  :8080      │ │  :8083      │ │  :8084      │ │  :8085      │           │
│  │ REST+OpenAPI│ │ REST+OpenAPI│ │ REST+OpenAPI│ │ REST+OpenAPI│           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                           │
│  │   audit     │ │  checkout   │ │    user     │                           │
│  │  :8086      │ │  :8087      │ │  :8089      │                           │
│  │ REST+OpenAPI│ │ REST+OpenAPI│ │ REST+OpenAPI│                           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘                           │
│         │               │               │                                   │
│         └───────────────┴───────────────┴───────────────────────────────┐   │
│                                 │                                        │   │
│                      /v3/api-docs (JSON)                                │   │
│  ┌─────────────┐ ┌─────────────┐                                        │   │
│  │    cart     │ │    order    │                                        │   │
│  │   :8081     │ │   :8088     │                                        │   │
│  │ REST+GraphQL│ │ REST+GraphQL│                                        │   │
│  └──────┬──────┘ └──────┬──────┘                                        │   │
│         │               │                                                │   │
│    /graphql + /v3/api-docs                                              │   │
└─────────┬───────────────┴───────────────────────────────────────────────┘   │
          │                                                                     │
          ▼                                                                     │
┌─────────────────────────────────────────────────────────────────────────────┐
│                    tools/openapi-codegen/specs/                             │
│  product-service.json, cart-service.json, order-service.json,              │
│  customer-service.json, discount-service.json, fulfillment-service.json,   │
│  audit-service.json, checkout-service.json, user-service.json              │
│                    tools/graphql-codegen/schemas/                           │
│  cart-service.graphqls, order-service.graphqls                              │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼  openapi-generator-cli + graphql-codegen (Node ESM scripts)
┌─────────────────────────────────────────────────────────────────────────────┐
│            libs/frontend/shared-data/api-client/src/generated/              │
│  ├── rest/{service}/models/*.ts, api/*.ts                                   │
│  └── graphql/{service}/types.ts, hooks.ts                                   │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ecommerce-web, kiosk-web, pos-web import from @reactive-platform/...       │
└─────────────────────────────────────────────────────────────────────────────┘
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
- MODIFY: `apps/user-service/src/main/resources/application.yml`

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
- MODIFY: `apps/user-service/src/main/java/org/example/user/controller/UserController.java`
- MODIFY: `apps/user-service/src/main/java/org/example/user/controller/DevTokenController.java`
- MODIFY: `apps/user-service/src/main/java/org/example/user/controller/WellKnownController.java`

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

### 2.2 Create OpenAPI Generation Script (Node ESM)

**Files:**
- DELETE: `tools/openapi-codegen/generate.sh`
- CREATE: `tools/openapi-codegen/generate.mjs`

**Implementation:**
Node.js ESM script targeting Node v24:
```javascript
#!/usr/bin/env node
/**
 * OpenAPI spec fetcher and TypeScript client generator
 * Requires: Node.js v24+
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPECS_DIR = join(__dirname, 'specs');
const OUTPUT_DIR = join(__dirname, '../../libs/frontend/shared-data/api-client/src/generated/rest');

/** All backend services with their ports */
const SERVICES = [
  { name: 'product-service', port: 8080 },
  { name: 'cart-service', port: 8081 },
  { name: 'customer-service', port: 8083 },
  { name: 'discount-service', port: 8084 },
  { name: 'fulfillment-service', port: 8085 },
  { name: 'audit-service', port: 8086 },
  { name: 'checkout-service', port: 8087 },
  { name: 'order-service', port: 8088 },
  { name: 'user-service', port: 8089 },
];

// Ensure directories exist
mkdirSync(SPECS_DIR, { recursive: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

console.log('=== Fetching OpenAPI specs ===');

const fetched = [];
for (const { name, port } of SERVICES) {
  const specPath = join(SPECS_DIR, `${name}.json`);
  try {
    const response = await fetch(`http://localhost:${port}/v3/api-docs`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const spec = await response.json();
    writeFileSync(specPath, JSON.stringify(spec, null, 2));
    console.log(`✓ ${name} (port ${port})`);
    fetched.push({ name, specPath });
  } catch (error) {
    console.warn(`✗ ${name} (port ${port}) - ${error.message}`);
  }
}

if (fetched.length === 0) {
  console.error('\nNo specs fetched. Ensure services are running.');
  process.exit(1);
}

console.log(`\n=== Generating TypeScript clients (${fetched.length}/${SERVICES.length}) ===`);

for (const { name, specPath } of fetched) {
  const outputPath = join(OUTPUT_DIR, name);
  console.log(`Generating ${name}...`);
  try {
    execSync(
      `pnpm openapi-generator-cli generate ` +
        `-i "${specPath}" ` +
        `-g typescript-fetch ` +
        `-o "${outputPath}" ` +
        `--additional-properties=supportsES6=true,typescriptThreePlus=true,withInterfaces=true ` +
        `--skip-validate-spec`,
      { stdio: 'pipe' }
    );
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name} - generation failed`);
  }
}

console.log('\n=== Formatting generated code ===');
try {
  execSync(`pnpm prettier --write "${OUTPUT_DIR}/**/*.ts"`, { stdio: 'pipe' });
  console.log('✓ Formatted');
} catch {
  console.warn('⚠ Prettier formatting skipped');
}

console.log(`\nDone! Specs: ${SPECS_DIR}\nTypes: ${OUTPUT_DIR}`);
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
export * as UserService from './user-service';
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
Create a Node script to copy schemas:
```javascript
// tools/graphql-codegen/copy-schemas.mjs
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(__dirname, 'schemas');
mkdirSync(schemasDir, { recursive: true });

const schemas = [
  { src: 'apps/cart-service/src/main/resources/graphql/schema.graphqls', dest: 'cart-service.graphqls' },
  { src: 'apps/order-service/src/main/resources/graphql/schema.graphqls', dest: 'order-service.graphqls' },
];

for (const { src, dest } of schemas) {
  copyFileSync(join(__dirname, '../..', src), join(schemasDir, dest));
  console.log(`✓ Copied ${dest}`);
}
```

### 3.4 Create GraphQL Generation Script (Node ESM)

**Files:**
- CREATE: `tools/graphql-codegen/generate.mjs`

**Implementation:**
```javascript
#!/usr/bin/env node
/**
 * GraphQL schema copier and TypeScript type generator
 * Requires: Node.js v24+
 */
import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const SCHEMAS_DIR = join(__dirname, 'schemas');
const OUTPUT_DIR = join(ROOT, 'libs/frontend/shared-data/api-client/src/generated/graphql');

// Ensure directories exist
mkdirSync(SCHEMAS_DIR, { recursive: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

const SERVICES = [
  { name: 'cart-service', schemaPath: 'apps/cart-service/src/main/resources/graphql/schema.graphqls' },
  { name: 'order-service', schemaPath: 'apps/order-service/src/main/resources/graphql/schema.graphqls' },
];

console.log('=== Copying GraphQL schemas ===');
for (const { name, schemaPath } of SERVICES) {
  try {
    copyFileSync(join(ROOT, schemaPath), join(SCHEMAS_DIR, `${name}.graphqls`));
    console.log(`✓ ${name}`);
  } catch (error) {
    console.warn(`✗ ${name} - ${error.message}`);
  }
}

console.log('\n=== Generating GraphQL types ===');
for (const { name } of SERVICES) {
  const configPath = join(__dirname, `${name}.yml`);
  console.log(`Generating ${name}...`);
  try {
    execSync(`pnpm graphql-codegen --config "${configPath}"`, { stdio: 'pipe' });
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name} - generation failed`);
  }
}

console.log('\n=== Formatting generated code ===');
try {
  execSync(`pnpm prettier --write "${OUTPUT_DIR}/**/*.ts"`, { stdio: 'pipe' });
  console.log('✓ Formatted');
} catch {
  console.warn('⚠ Prettier formatting skipped');
}

console.log('\nDone!');
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
    "generate:api": "node tools/openapi-codegen/generate.mjs",
    "generate:graphql": "node tools/graphql-codegen/generate.mjs",
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
| MODIFY | `apps/*/src/main/resources/application.yml` (9 files) | Configure springdoc |
| MODIFY | `apps/*/controller/*.java` (~18 files) | Add @Tag annotations |
| MODIFY | `libs/backend/shared-model/**/**.java` (~10 files) | Add @Schema annotations |
| DELETE | `tools/openapi-codegen/generate.sh` | Remove bash script |
| CREATE | `tools/openapi-codegen/generate.mjs` | Node ESM generation script |
| CREATE | `tools/openapi-codegen/specs/*.json` (9 files) | Committed OpenAPI specs |
| CREATE | `tools/graphql-codegen/*.yml` (2 files) | GraphQL codegen configs |
| CREATE | `tools/graphql-codegen/generate.mjs` | Node ESM generation script |
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
- [ ] All 9 services expose /v3/api-docs
- [ ] Specs committed to tools/openapi-codegen/specs/
- [ ] GraphQL schemas committed to tools/graphql-codegen/schemas/
- [ ] ecommerce-web builds with generated types
- [ ] Documentation updated
