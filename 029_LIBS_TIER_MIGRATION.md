# 029_LIBS_TIER_MIGRATION

**Status: DRAFT**

---

## Overview

Migrate the `libs/` directory from a flat structure to a tier-based organization (`libs/backend/`, `libs/frontend/`) to clearly differentiate Java/Gradle libraries from TypeScript/npm libraries. This improves discoverability, enforces architectural boundaries, and aligns with Nx polyglot monorepo best practices.

## Goals

1. Separate backend (Java/Gradle) and frontend (TypeScript/npm) libraries into distinct tier folders
2. Update all Gradle project references from `:libs:platform:*` to `:libs:backend:platform:*`
3. Update TypeScript path mappings and Nx project configurations
4. Preserve git history during directory moves
5. Update all documentation to reflect new structure

## References

**Standards:**
- `docs/standards/documentation.md` - README/AGENTS.md patterns for new container projects

## Architecture

### Current Structure
```
libs/
├── platform/           # Backend (Java) - 9 modules
├── shared-model/       # Backend (Java) - 4 modules
├── shared-ui/          # Frontend (TS) - 1 module
├── shared-data/        # Frontend (TS) - 1 module
└── shared-design/      # Frontend (TS) - 1 module
```

### Target Structure
```
libs/
├── backend/                        # NEW tier container
│   ├── platform/                   # Moved from libs/platform/
│   │   ├── platform-bom/
│   │   ├── platform-logging/
│   │   ├── platform-resilience/
│   │   ├── platform-cache/
│   │   ├── platform-error/
│   │   ├── platform-webflux/
│   │   ├── platform-security/
│   │   ├── platform-test/
│   │   └── platform-audit/
│   └── shared-model/               # Moved from libs/shared-model/
│       ├── shared-model-product/
│       ├── shared-model-customer/
│       ├── shared-model-discount/
│       └── shared-model-fulfillment/
│
└── frontend/                       # NEW tier container
    ├── shared-ui/                  # Moved from libs/shared-ui/
    │   └── ui-components/
    ├── shared-data/                # Moved from libs/shared-data/
    │   └── api-client/
    └── shared-design/              # Moved from libs/shared-design/
        └── tokens/
```

### Gradle Path Changes

| Old Path | New Path |
|----------|----------|
| `:libs:platform:platform-bom` | `:libs:backend:platform:platform-bom` |
| `:libs:platform:platform-*` | `:libs:backend:platform:platform-*` |
| `:libs:shared-model:shared-model-*` | `:libs:backend:shared-model:shared-model-*` |

### TypeScript Path Changes

| Old Path | New Path |
|----------|----------|
| `libs/shared-ui/*/src/` | `libs/frontend/shared-ui/*/src/` |
| `libs/shared-data/api-client/src/` | `libs/frontend/shared-data/api-client/src/` |
| `libs/shared-design/tokens/src/` | `libs/frontend/shared-design/tokens/src/` |

### Dependency Order

```
Phase 1: Directory Structure
        │
   ┌────┴────┐
   ▼         ▼
Phase 2   Phase 3     ← Can run in parallel (no cross-tier deps)
(Backend) (Frontend)
   │         │
   └────┬────┘
        ▼
Phase 4: Documentation
        │
        ▼
Phase 5: Validation
```

---

## Phase 1: Directory Structure (Infrastructure)

**Prereqs:** None
**Blockers:** None

### 1.1 Create Tier Directories and Move Backend Libraries

**Implementation:**
```bash
# Create backend tier structure
mkdir -p libs/backend

# Move backend libraries (preserving git history)
git mv libs/platform libs/backend/platform
git mv libs/shared-model libs/backend/shared-model

# Create backend container build.gradle.kts
```

**Files:**
- CREATE: `libs/backend/build.gradle.kts` (container project)

**Content for `libs/backend/build.gradle.kts`:**
```kotlin
// Container project for backend libraries
// No build logic - just groups backend modules
```

### 1.2 Move Frontend Libraries

**Implementation:**
```bash
# Create frontend tier structure
mkdir -p libs/frontend

# Move frontend libraries (preserving git history)
git mv libs/shared-ui libs/frontend/shared-ui
git mv libs/shared-data libs/frontend/shared-data
git mv libs/shared-design libs/frontend/shared-design
```

### 1.3 Update Root libs Container

**Files:**
- MODIFY: `libs/build.gradle.kts`

**Implementation:**
Update to reference new tier containers instead of direct children.

---

## Phase 2: Backend Build System Updates

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Update settings.gradle.kts

**Files:**
- MODIFY: `settings.gradle.kts`

**Implementation:**
Replace all `include("libs:platform:*")` with `include("libs:backend:platform:*")` and `include("libs:shared-model:*")` with `include("libs:backend:shared-model:*")`.

**Changes:**
```kotlin
// OLD
include("libs:platform")
include("libs:platform:platform-bom")
// ... etc

// NEW
include("libs:backend")
include("libs:backend:platform")
include("libs:backend:platform:platform-bom")
// ... etc
```

Full list of include changes:
- `libs:platform` → `libs:backend:platform`
- `libs:platform:platform-bom` → `libs:backend:platform:platform-bom`
- `libs:platform:platform-logging` → `libs:backend:platform:platform-logging`
- `libs:platform:platform-resilience` → `libs:backend:platform:platform-resilience`
- `libs:platform:platform-cache` → `libs:backend:platform:platform-cache`
- `libs:platform:platform-error` → `libs:backend:platform:platform-error`
- `libs:platform:platform-webflux` → `libs:backend:platform:platform-webflux`
- `libs:platform:platform-security` → `libs:backend:platform:platform-security`
- `libs:platform:platform-test` → `libs:backend:platform:platform-test`
- `libs:platform:platform-audit` → `libs:backend:platform:platform-audit`
- `libs:shared-model` → `libs:backend:shared-model`
- `libs:shared-model:shared-model-product` → `libs:backend:shared-model:shared-model-product`
- `libs:shared-model:shared-model-customer` → `libs:backend:shared-model:shared-model-customer`
- `libs:shared-model:shared-model-discount` → `libs:backend:shared-model:shared-model-discount`
- `libs:shared-model:shared-model-fulfillment` → `libs:backend:shared-model:shared-model-fulfillment`

### 2.2 Update Platform Library Dependencies

**Files:**
- MODIFY: `libs/backend/platform/platform-logging/build.gradle.kts`
- MODIFY: `libs/backend/platform/platform-resilience/build.gradle.kts`
- MODIFY: `libs/backend/platform/platform-cache/build.gradle.kts`
- MODIFY: `libs/backend/platform/platform-error/build.gradle.kts`
- MODIFY: `libs/backend/platform/platform-webflux/build.gradle.kts`
- MODIFY: `libs/backend/platform/platform-security/build.gradle.kts`
- MODIFY: `libs/backend/platform/platform-test/build.gradle.kts`
- MODIFY: `libs/backend/platform/platform-audit/build.gradle.kts`

**Implementation:**
For each file, replace:
- `project(":libs:platform:platform-bom")` → `project(":libs:backend:platform:platform-bom")`
- `project(":libs:platform:platform-logging")` → `project(":libs:backend:platform:platform-logging")`
- etc.

### 2.3 Update Application Service Dependencies

**Files:**
- MODIFY: `apps/product-service/build.gradle.kts`
- MODIFY: `apps/cart-service/build.gradle.kts`
- MODIFY: `apps/customer-service/build.gradle.kts`
- MODIFY: `apps/discount-service/build.gradle.kts`
- MODIFY: `apps/fulfillment-service/build.gradle.kts`
- MODIFY: `apps/audit-service/build.gradle.kts`
- MODIFY: `apps/checkout-service/build.gradle.kts`

**Implementation:**
For each application, replace all occurrences:
- `project(":libs:platform:platform-*")` → `project(":libs:backend:platform:platform-*")`
- `project(":libs:shared-model:shared-model-*")` → `project(":libs:backend:shared-model:shared-model-*")`

### 2.4 Verify Backend Build

**Implementation:**
```bash
./gradlew clean build
```

---

## Phase 3: Frontend Build System Updates

**Prereqs:** Phase 1 complete
**Blockers:** None

### 3.1 Update TypeScript Path Mappings

**Files:**
- MODIFY: `tsconfig.base.json`

**Implementation:**
Update all path mappings to include `frontend/` tier:

```json
{
  "compilerOptions": {
    "paths": {
      "@reactive-platform/shared-ui/*": ["libs/frontend/shared-ui/*/src/index.ts"],
      "@reactive-platform/shared-ui-components": ["libs/frontend/shared-ui/ui-components/src/index.ts"],
      "@reactive-platform/api-client": ["libs/frontend/shared-data/api-client/src/index.ts"],
      "@reactive-platform/shared-design-tokens": ["libs/frontend/shared-design/tokens/src/index.css"],
      "ui-components": ["libs/frontend/shared-ui/ui-components/src/index.ts"]
    }
  }
}
```

### 3.2 Update Nx Project Configurations

**Files:**
- MODIFY: `libs/frontend/shared-ui/ui-components/project.json`
- MODIFY: `libs/frontend/shared-data/api-client/project.json`
- MODIFY: `libs/frontend/shared-design/tokens/project.json`

**Implementation:**
Update `sourceRoot` in each project.json:

```json
// ui-components/project.json
{ "sourceRoot": "libs/frontend/shared-ui/ui-components/src" }

// api-client/project.json
{ "sourceRoot": "libs/frontend/shared-data/api-client/src" }

// tokens/project.json
{ "sourceRoot": "libs/frontend/shared-design/tokens/src" }
```

### 3.3 Update OpenAPI Codegen Script

**Files:**
- MODIFY: `tools/openapi-codegen/generate.sh`

**Implementation:**
Update output path:
```bash
# OLD
-o libs/shared-data/api-client/src/generated

# NEW
-o libs/frontend/shared-data/api-client/src/generated
```

### 3.4 Verify Frontend Build

**Implementation:**
```bash
pnpm nx graph  # Verify project detection
pnpm nx build ui-components
pnpm nx build api-client
pnpm nx serve ecommerce-web
```

---

## Phase 4: Documentation Updates

**Prereqs:** Phases 2 and 3 complete
**Blockers:** None

### 4.1 Update CLAUDE.md (Root)

**Files:**
- MODIFY: `CLAUDE.md`

**Implementation:**
Update all sections referencing libs structure:
- Project Structure diagram
- Module Overview tables
- Package Naming section
- Adding a New Service/Library sections

Key changes:
- `libs/platform/` → `libs/backend/platform/`
- `libs/shared-model/` → `libs/backend/shared-model/`
- `libs/shared-ui/` → `libs/frontend/shared-ui/`
- `libs/shared-data/` → `libs/frontend/shared-data/`
- `libs/shared-design/` → `libs/frontend/shared-design/`

### 4.2 Update Platform Library Documentation

**Files:**
- MODIFY: `libs/backend/platform/README.md`
- MODIFY: `libs/backend/platform/AGENTS.md`

**Implementation:**
Update all Gradle dependency examples:
```kotlin
// OLD
implementation(project(":libs:platform:platform-logging"))

// NEW
implementation(project(":libs:backend:platform:platform-logging"))
```

### 4.3 Update Individual Platform Module Docs

**Files (16 total - README.md + AGENTS.md for each):**
- MODIFY: `libs/backend/platform/platform-bom/README.md`
- MODIFY: `libs/backend/platform/platform-logging/README.md`
- MODIFY: `libs/backend/platform/platform-resilience/README.md`
- MODIFY: `libs/backend/platform/platform-cache/README.md`
- MODIFY: `libs/backend/platform/platform-error/README.md`
- MODIFY: `libs/backend/platform/platform-webflux/README.md`
- MODIFY: `libs/backend/platform/platform-security/README.md`
- MODIFY: `libs/backend/platform/platform-test/README.md`
- Plus corresponding AGENTS.md files

**Implementation:**
Update Gradle dependency paths in usage examples.

### 4.4 Update Frontend Library Documentation

**Files:**
- MODIFY: `libs/frontend/shared-ui/ui-components/README.md`
- MODIFY: `libs/frontend/shared-ui/ui-components/AGENTS.md`
- MODIFY: `libs/frontend/shared-data/api-client/README.md`
- MODIFY: `libs/frontend/shared-design/tokens/AGENTS.md`

### 4.5 Update Standards Documentation

**Files:**
- MODIFY: `docs/standards/frontend/architecture.md` (if references libs paths)
- MODIFY: `docs/standards/backend/architecture.md` (if references libs paths)
- MODIFY: `.claude/commands/verify-frontend-standards.md`
- MODIFY: `.claude/commands/verify-backend-standards.md`

### 4.6 Create Tier Container Documentation

**Files:**
- CREATE: `libs/backend/README.md`
- CREATE: `libs/backend/AGENTS.md`
- CREATE: `libs/frontend/README.md`
- CREATE: `libs/frontend/AGENTS.md`

**Content for `libs/backend/README.md`:**
```markdown
# Backend Libraries

Java/Gradle libraries for the reactive platform backend services.

## Structure

- `platform/` - Cross-cutting platform infrastructure (logging, resilience, caching, etc.)
- `shared-model/` - Shared DTOs used across multiple backend services

## Usage

```kotlin
dependencies {
    implementation(project(":libs:backend:platform:platform-logging"))
    implementation(project(":libs:backend:shared-model:shared-model-product"))
}
```
```

**Content for `libs/frontend/README.md`:**
```markdown
# Frontend Libraries

TypeScript/React libraries for the reactive platform frontend applications.

## Structure

- `shared-ui/` - Reusable UI components (React + shadcn/ui)
- `shared-data/` - Data access libraries (API client, generated types)
- `shared-design/` - Design system tokens (CSS variables)

## Usage

```typescript
import { Button } from '@reactive-platform/shared-ui-components';
import { ProductApi } from '@reactive-platform/api-client';
```
```

---

## Phase 5: Validation and Cleanup

**Prereqs:** Phase 4 complete
**Blockers:** None

### 5.1 Full Build Verification

**Implementation:**
```bash
# Clean all caches
rm -rf .nx/cache
./gradlew clean

# Full backend build
./gradlew build

# Full frontend build
pnpm nx run-many -t build

# All tests
pnpm nx run-many -t test
./gradlew testAll
```

### 5.2 Verify Nx Graph

**Implementation:**
```bash
pnpm nx graph
```

Confirm all projects appear with correct paths and dependencies.

### 5.3 Git Commit

**Implementation:**
```bash
git add -A
git commit -m "refactor: migrate libs to tier-based structure (backend/frontend)

- Move platform and shared-model to libs/backend/
- Move shared-ui, shared-data, shared-design to libs/frontend/
- Update all Gradle project references
- Update TypeScript path mappings
- Update Nx project configurations
- Update all documentation"
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `libs/backend/build.gradle.kts` | Backend tier container |
| CREATE | `libs/backend/README.md` | Backend tier documentation |
| CREATE | `libs/backend/AGENTS.md` | Backend tier AI guidance |
| CREATE | `libs/frontend/README.md` | Frontend tier documentation |
| CREATE | `libs/frontend/AGENTS.md` | Frontend tier AI guidance |
| MOVE | `libs/platform/` → `libs/backend/platform/` | Backend platform libraries |
| MOVE | `libs/shared-model/` → `libs/backend/shared-model/` | Backend shared models |
| MOVE | `libs/shared-ui/` → `libs/frontend/shared-ui/` | Frontend UI components |
| MOVE | `libs/shared-data/` → `libs/frontend/shared-data/` | Frontend data access |
| MOVE | `libs/shared-design/` → `libs/frontend/shared-design/` | Frontend design tokens |
| MODIFY | `settings.gradle.kts` | Update all include paths |
| MODIFY | `libs/build.gradle.kts` | Update container references |
| MODIFY | 8x platform `build.gradle.kts` | Update dependency paths |
| MODIFY | 7x app `build.gradle.kts` | Update dependency paths |
| MODIFY | `tsconfig.base.json` | Update TypeScript paths |
| MODIFY | 3x `project.json` | Update sourceRoot paths |
| MODIFY | `tools/openapi-codegen/generate.sh` | Update output path |
| MODIFY | `CLAUDE.md` | Update project structure docs |
| MODIFY | ~20x library README/AGENTS.md | Update usage examples |

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Update project structure, module overview, package naming, commands |
| `libs/backend/README.md` | CREATE - Backend tier overview |
| `libs/backend/AGENTS.md` | CREATE - AI guidance for backend libs |
| `libs/frontend/README.md` | CREATE - Frontend tier overview |
| `libs/frontend/AGENTS.md` | CREATE - AI guidance for frontend libs |
| `libs/backend/platform/README.md` | Update Gradle dependency examples |
| `libs/backend/platform/*/README.md` | Update usage examples (8 files) |
| `.claude/commands/verify-*-standards.md` | Update lib path references |

---

## Rollback Plan

If issues arise during migration:

```bash
# Revert all changes
git checkout -- .
git clean -fd

# Or if partially committed
git revert HEAD
```

The migration is atomic - either all changes succeed or none do.

---

## Checklist

- [ ] Phase 1: Directory structure created and files moved
- [ ] Phase 2: Backend Gradle build succeeds
- [ ] Phase 3: Frontend TypeScript/Nx build succeeds
- [ ] Phase 4: All documentation updated
- [ ] Phase 5: Full validation passes
- [ ] Git history preserved for moved files
- [ ] Nx graph shows correct structure
