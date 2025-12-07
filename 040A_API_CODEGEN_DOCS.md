# 040A_API_CODEGEN_DOCS

**Status: DRAFT**

---

## Overview

Documentation, standards, templates, and verification scripts for the API codegen workflow. This sub-plan establishes the patterns, validates compliance, and documents the developer workflow for generating and consuming TypeScript types from backend APIs.

**Related Plans:**
- `040_API_CODEGEN.md` - Parent plan implementing the codegen infrastructure

## Goals

1. Create OpenAPI annotation standards for backend services
2. Create templates for annotated controllers and DTOs
3. Add verification scripts for spec drift detection
4. Document the complete workflow in docs/workflows/
5. Update CLAUDE.md with new commands and conventions

## References

**Standards:**
- `docs/standards/documentation.md` - README/AGENTS.md patterns
- `docs/standards/backend/architecture.md` - Controller/DTO placement

**Templates:**
- `docs/templates/backend/_template_controller.md` - Base controller template to extend

---

## Phase 1: Backend OpenAPI Standard

**Prereqs:** None
**Blockers:** None

### 1.1 Create OpenAPI Standard Document

**Files:**
- CREATE: `docs/standards/backend/openapi.md`

**Implementation:**
```markdown
# OpenAPI Standards

Standards for documenting REST APIs with springdoc-openapi annotations.

## Controller Annotations

Every REST controller MUST have:
- `@Tag(name, description)` at class level
- `@Operation(summary, description)` on each endpoint
- `@ApiResponse` for success and error codes

## DTO Annotations

Every public DTO MUST have:
- `@Schema(description)` at class/record level
- `@Schema(description, example)` on each field
- Validation annotations where applicable

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tag name | PascalCase plural | `Products`, `CartOperations` |
| Operation summary | Verb phrase | `Get product by SKU` |
| Schema description | Noun phrase | `Product with pricing` |

## Required Annotations

### Minimal Controller
@Tag(name = "Products", description = "Product catalog operations")
@RestController
public class ProductController {

    @Operation(summary = "Get product by SKU")
    @ApiResponse(responseCode = "200", description = "Product found")
    @ApiResponse(responseCode = "404", description = "Product not found")
    @GetMapping("/products/{sku}")
    public Mono<Product> getProduct(@PathVariable long sku) { }
}

### Minimal DTO
@Schema(description = "Product with pricing and availability")
public record Product(
    @Schema(description = "Stock Keeping Unit", example = "12345")
    long sku,
    @Schema(description = "Product display name", example = "Widget Pro")
    String description
) {}
```

### 1.2 Update Backend Standards README

**Files:**
- MODIFY: `docs/standards/backend/README.md`

**Implementation:**
Add to the standards list:
```markdown
- [openapi.md](openapi.md) - OpenAPI/Swagger annotation standards
```

---

## Phase 2: Backend Templates

**Prereqs:** Phase 1 (standard exists to reference)
**Blockers:** None

### 2.1 Create OpenAPI Controller Template

**Files:**
- CREATE: `docs/templates/backend/_template_openapi_controller.md`

**Implementation:**
```markdown
# OpenAPI Controller Template

Template for REST controllers with full OpenAPI documentation.

## Template

package org.example.{service}.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Tag(name = "{EntityPlural}", description = "{Entity} operations")
@RestController
@RequestMapping("/{entity-plural}")
public class {Entity}Controller {

    private final {Entity}Service service;

    public {Entity}Controller({Entity}Service service) {
        this.service = service;
    }

    @Operation(
        summary = "Get {entity} by ID",
        description = "Returns a single {entity} by its unique identifier"
    )
    @ApiResponse(responseCode = "200", description = "{Entity} found")
    @ApiResponse(responseCode = "404", description = "{Entity} not found")
    @GetMapping("/{id}")
    public Mono<{Entity}> getById(
        @Parameter(description = "{Entity} unique identifier")
        @PathVariable String id
    ) {
        return service.findById(id);
    }

    @Operation(summary = "Create new {entity}")
    @ApiResponse(responseCode = "201", description = "{Entity} created")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PostMapping
    public Mono<{Entity}> create(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "{Entity} to create"
        )
        @RequestBody Create{Entity}Request request
    ) {
        return service.create(request);
    }
}

## Placeholders

| Placeholder | Replace With | Example |
|-------------|--------------|---------|
| `{Entity}` | PascalCase entity | `Product` |
| `{entity}` | camelCase entity | `product` |
| `{entity-plural}` | kebab-case plural | `products` |
| `{EntityPlural}` | PascalCase plural | `Products` |
| `{service}` | Service package | `product` |
```

### 2.2 Create OpenAPI DTO Template

**Files:**
- CREATE: `docs/templates/backend/_template_openapi_dto.md`

**Implementation:**
```markdown
# OpenAPI DTO Template

Template for Data Transfer Objects with OpenAPI schema annotations.

## Record Template (Preferred)

package org.example.{service}.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

@Schema(description = "{Description of the DTO purpose}")
public record {Name}(
    @Schema(description = "Unique identifier", example = "uuid-here")
    @NotNull
    String id,

    @Schema(description = "Display name", example = "Example Name", maxLength = 100)
    @NotBlank
    @Size(max = 100)
    String name,

    @Schema(description = "Quantity", example = "5", minimum = "0")
    @Min(0)
    int quantity,

    @Schema(description = "Price in USD", example = "29.99", pattern = "^\\d+\\.\\d{2}$")
    String price,

    @Schema(description = "Status", example = "ACTIVE")
    Status status
) {
    public enum Status {
        @Schema(description = "Currently active")
        ACTIVE,
        @Schema(description = "Temporarily disabled")
        INACTIVE
    }
}

## Annotations Reference

| Annotation | Purpose | Example |
|------------|---------|---------|
| `@Schema(description)` | Field documentation | `"User email address"` |
| `@Schema(example)` | Example value for Swagger UI | `"user@example.com"` |
| `@Schema(minimum/maximum)` | Numeric bounds | `minimum = "0"` |
| `@Schema(pattern)` | Regex pattern | `"^\\d{5}$"` |
| `@Schema(maxLength)` | String length limit | `maxLength = 255` |
| `@Schema(hidden)` | Hide from docs | `hidden = true` |
```

### 2.3 Update Backend Templates README

**Files:**
- MODIFY: `docs/templates/backend/README.md`

**Implementation:**
Add to templates list:
```markdown
- [_template_openapi_controller.md](_template_openapi_controller.md) - Controller with OpenAPI annotations
- [_template_openapi_dto.md](_template_openapi_dto.md) - DTO/Record with @Schema annotations
```

---

## Phase 3: Verification Scripts

**Prereqs:** 040_API_CODEGEN Phase 2 complete (specs exist)
**Blockers:** Services must be running for drift detection

### 3.1 Create Spec Drift Detection Script

**Files:**
- CREATE: `tools/verify-api-specs.mjs`

**Implementation:**
```javascript
#!/usr/bin/env node
/**
 * Verify committed OpenAPI specs match running services.
 * Usage: node tools/verify-api-specs.mjs [--update]
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const SERVICES = {
  'product-service': 8080,
  'cart-service': 8081,
  'customer-service': 8083,
  'discount-service': 8084,
  'fulfillment-service': 8085,
  'audit-service': 8086,
  'checkout-service': 8087,
  'order-service': 8088,
};

const SPECS_DIR = 'tools/openapi-codegen/specs';
const UPDATE_MODE = process.argv.includes('--update');

let hasErrors = false;

for (const [service, port] of Object.entries(SERVICES)) {
  const specPath = `${SPECS_DIR}/${service}.json`;

  try {
    const response = execSync(`curl -sf http://localhost:${port}/v3/api-docs`, { encoding: 'utf8' });
    const liveSpec = JSON.parse(response);

    if (!existsSync(specPath)) {
      console.log(`⚠️  ${service}: No committed spec found`);
      if (UPDATE_MODE) {
        writeFileSync(specPath, JSON.stringify(liveSpec, null, 2));
        console.log(`   ✅ Created ${specPath}`);
      }
      continue;
    }

    const committedSpec = JSON.parse(readFileSync(specPath, 'utf8'));

    // Compare paths and schemas (ignore metadata like timestamps)
    const livePaths = JSON.stringify(liveSpec.paths);
    const committedPaths = JSON.stringify(committedSpec.paths);

    if (livePaths !== committedPaths) {
      console.log(`❌ ${service}: Spec drift detected`);
      hasErrors = true;
      if (UPDATE_MODE) {
        writeFileSync(specPath, JSON.stringify(liveSpec, null, 2));
        console.log(`   ✅ Updated ${specPath}`);
        hasErrors = false;
      }
    } else {
      console.log(`✅ ${service}: Spec matches`);
    }
  } catch (e) {
    console.log(`⏭️  ${service}: Not running on port ${port}`);
  }
}

if (hasErrors) {
  console.log('\n❌ Spec drift detected. Run with --update to fix, or regenerate specs.');
  process.exit(1);
}
```

### 3.2 Create Generated Types Verification Script

**Files:**
- CREATE: `tools/verify-generated-types.sh`

**Implementation:**
```bash
#!/usr/bin/env bash
# Verify generated TypeScript types are up-to-date with committed specs.
# Usage: ./tools/verify-generated-types.sh

set -e

GENERATED_DIR="libs/frontend/shared-data/api-client/src/generated"

echo "=== Checking generated types ==="

# Stash any uncommitted changes to generated files
if [[ -n $(git status --porcelain "$GENERATED_DIR" 2>/dev/null) ]]; then
  echo "Warning: Uncommitted changes in generated directory"
fi

# Regenerate from committed specs (offline mode)
echo "Regenerating types from committed specs..."
./tools/openapi-codegen/generate.sh --offline 2>/dev/null || true

# Check for differences
if git diff --exit-code "$GENERATED_DIR" > /dev/null 2>&1; then
  echo "✅ Generated types are up-to-date"
else
  echo "❌ Generated types are out of date"
  echo "   Run 'pnpm generate:api' and commit the changes"
  exit 1
fi
```

### 3.3 Update Package.json with Verification Commands

**Files:**
- MODIFY: `package.json`

**Implementation:**
Add scripts:
```json
{
  "scripts": {
    "verify:api-specs": "node tools/verify-api-specs.mjs",
    "verify:api-specs:update": "node tools/verify-api-specs.mjs --update",
    "verify:generated-types": "./tools/verify-generated-types.sh"
  }
}
```

---

## Phase 4: Workflow Documentation

**Prereqs:** Phases 1-3 complete
**Blockers:** None

### 4.1 Create API Codegen Workflow Document

**Files:**
- CREATE: `docs/workflows/api-codegen.md`

**Implementation:**
```markdown
# API Code Generation Workflow

This document describes the workflow for generating TypeScript clients from backend APIs.

## Overview

```
Backend Change → Regenerate Specs → Generate Types → Commit All → PR Review
```

## When to Regenerate

Regenerate API types when:
- Adding/removing REST endpoints
- Changing request/response DTOs
- Modifying GraphQL schema
- Updating OpenAPI annotations

## Developer Workflow

### 1. Make Backend Changes

Edit controllers, DTOs, or GraphQL schemas:
- Add `@Schema` annotations to new DTOs (per `docs/standards/backend/openapi.md`)
- Add `@Operation` to new endpoints (per `docs/templates/backend/_template_openapi_controller.md`)

### 2. Start Services

```bash
docker compose up -d
# Or for specific services:
pnpm nx serve product-service
```

### 3. Regenerate Specs and Types

```bash
# Generate everything
pnpm generate:all

# Or separately:
pnpm generate:api      # REST/OpenAPI types
pnpm generate:graphql  # GraphQL types
```

### 4. Verify Changes

```bash
# Check for spec drift (CI will run this)
pnpm verify:api-specs
```

### 5. Commit Together

Always commit backend changes with regenerated specs and types:
```bash
git add apps/{service}/src/
git add tools/openapi-codegen/specs/
git add tools/graphql-codegen/schemas/
git add libs/frontend/shared-data/api-client/src/generated/
git commit -m "feat(api): add discount field to cart response"
```

## CI Validation

CI runs these checks on every PR:
1. `pnpm verify:api-specs` - Ensures committed specs match running services
2. `pnpm verify:generated-types` - Ensures TypeScript is regenerated

## Troubleshooting

### "Spec drift detected"
Backend changed but specs weren't regenerated:
```bash
docker compose up -d
pnpm generate:api
git add tools/openapi-codegen/specs/
```

### "Generated types out of date"
Specs updated but TypeScript wasn't regenerated:
```bash
pnpm generate:api
git add libs/frontend/shared-data/api-client/src/generated/
```

### Service not exposing /v3/api-docs
Add springdoc dependency (see `040_API_CODEGEN.md` Phase 1).

## File Locations

| Purpose | Location |
|---------|----------|
| OpenAPI specs (committed) | `tools/openapi-codegen/specs/*.json` |
| GraphQL schemas (committed) | `tools/graphql-codegen/schemas/*.graphqls` |
| Generated REST types | `libs/frontend/shared-data/api-client/src/generated/rest/` |
| Generated GraphQL types | `libs/frontend/shared-data/api-client/src/generated/graphql/` |
| Generation scripts | `tools/openapi-codegen/generate.sh`, `tools/graphql-codegen/generate.sh` |

## Related Documentation

- [ADR 012: Frontend-Backend Model Sharing](../ADRs/012_frontend_backend_model_sharing.md)
- [OpenAPI Standards](../standards/backend/openapi.md)
- [OpenAPI Controller Template](../templates/backend/_template_openapi_controller.md)
```

---

## Phase 5: CLAUDE.md Updates

**Prereqs:** All previous phases
**Blockers:** None

### 5.1 Update CLAUDE.md

**Files:**
- MODIFY: `CLAUDE.md`

**Implementation:**
Add to appropriate sections:

**Build Commands section:**
```markdown
## API Code Generation

```bash
# Generate TypeScript clients from backend APIs
pnpm generate:api          # REST/OpenAPI types
pnpm generate:graphql      # GraphQL types
pnpm generate:all          # Both

# Verify specs match running services
pnpm verify:api-specs
pnpm verify:api-specs:update  # Auto-fix drift
```

**Standards Reference table:**
```markdown
| `docs/standards/backend/openapi.md` | OpenAPI annotation patterns |
```

**Workflows section (add if not exists):**
```markdown
## Workflows

| Workflow | Document |
|----------|----------|
| API Code Generation | `docs/workflows/api-codegen.md` |
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `docs/standards/backend/openapi.md` | OpenAPI annotation standards |
| CREATE | `docs/templates/backend/_template_openapi_controller.md` | Controller template |
| CREATE | `docs/templates/backend/_template_openapi_dto.md` | DTO template |
| CREATE | `tools/verify-api-specs.mjs` | Spec drift detection |
| CREATE | `tools/verify-generated-types.sh` | TypeScript verification |
| CREATE | `docs/workflows/api-codegen.md` | Developer workflow guide |
| MODIFY | `docs/standards/backend/README.md` | Add openapi.md link |
| MODIFY | `docs/templates/backend/README.md` | Add template links |
| MODIFY | `package.json` | Add verify scripts |
| MODIFY | `CLAUDE.md` | Add commands and references |

---

## Checklist

- [ ] Phase 1: OpenAPI standard created
- [ ] Phase 2: Controller and DTO templates created
- [ ] Phase 3: Verification scripts working
- [ ] Phase 4: Workflow documented
- [ ] Phase 5: CLAUDE.md updated
- [ ] All READMEs updated with links
