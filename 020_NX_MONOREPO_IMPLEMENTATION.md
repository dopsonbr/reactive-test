# 020_NX_MONOREPO_IMPLEMENTATION

**Status: DRAFT**

---

## Overview

Implement the Nx polyglot monorepo strategy defined in ADR 006. This plan converts the existing Gradle-only repository to an Nx-orchestrated monorepo, ensuring all 23 existing Gradle modules work seamlessly through Nx before adding any frontend applications.

**Supersedes:** 019_monorepo_prep.md (merged into this plan)

**Related ADRs:**
- `docs/ADRs/006_frontend_monorepo_strategy.md` - Nx strategy decision (accepted)
- `docs/ADRs/007_frontend_ui_framework.md` - React + Vite + TanStack (accepted)
- `docs/ADRs/008_component_library_design_system.md` - shadcn/ui + Tailwind (accepted)

## Goals

1. Install and configure Nx with `@nx/gradle` plugin to orchestrate existing backend modules
2. Establish pnpm as the canonical package manager with proper workspace configuration
3. Resolve service port conflicts before adding new services
4. Verify all Gradle tasks (build, test, bootRun) work through Nx commands
5. Scaffold first frontend application and shared libraries following ADR decisions

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Nx Workspace                                   │
│  nx.json, package.json, pnpm-workspace.yaml                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────┐   │
│  │      @nx/gradle Plugin          │  │    Native Nx Plugins        │   │
│  │  (Discovers Gradle modules)     │  │  (@nx/vite, @nx/react)      │   │
│  └────────────────┬────────────────┘  └──────────────┬──────────────┘   │
│                   │                                   │                  │
│                   ▼                                   ▼                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────┐   │
│  │     Gradle Modules (23)         │  │   Frontend Apps/Libs        │   │
│  │  libs/platform/* (9)            │  │  apps/ecommerce-web         │   │
│  │  libs/shared-model/* (4)        │  │  apps/pos-web               │   │
│  │  apps/*-service (6)             │  │  libs/shared-ui/*           │   │
│  │  buildSrc (conventions)         │  │  libs/shared-data/*         │   │
│  └─────────────────────────────────┘  └─────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │      Unified Commands         │
                    │  nx build <project>           │
                    │  nx test <project>            │
                    │  nx run-many -t build         │
                    │  nx affected -t test          │
                    └───────────────────────────────┘
```

### Canonical Service Port Table

| Service | Local Port | Docker Port | Container Internal |
|---------|------------|-------------|-------------------|
| product-service | 8080 | 8080 | 8080 |
| cart-service | 8081 | 8081 | 8080 |
| wiremock | 8082 | 8082 | 8080 |
| customer-service | 8083 | 8083 | 8080 |
| discount-service | 8084 | 8084 | 8080 |
| fulfillment-service | 8085 | 8085 | 8080 |
| audit-service | 8086 | 8086 | 8080 |
| user-service (future) | 8087 | 8087 | 8080 |
| ecommerce-web (future) | 3001 | 3001 | 3000 |
| pos-web (future) | 3002 | 3002 | 3000 |

---

# MILESTONE 1: Nx Foundation + Gradle Integration

Convert the repository to an Nx workspace with all existing Gradle modules fully operational.

**Exit Criteria:**
- `nx graph` displays all 23 Gradle modules with correct dependencies
- `nx run-many -t build` successfully builds all modules
- `nx run-many -t test` successfully runs all tests
- `nx affected -t build` correctly identifies changed modules
- CI pipeline uses Nx commands instead of direct Gradle
- No service port conflicts in docker-compose

---

## Phase 1.1: Package Manager & Workspace Setup

### 1.1.1 Initialize pnpm Workspace

**Files:**
- CREATE: `pnpm-workspace.yaml`
- CREATE: `package.json` (root)
- CREATE: `.npmrc`

**Implementation:**

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*-web'
  - 'libs/shared-ui/*'
  - 'libs/shared-data/*'
  - 'libs/shared-utils/*'
  - 'tools/*'
```

```json
// package.json (root)
{
  "name": "reactive-platform",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "build": "nx run-many -t build",
    "test": "nx run-many -t test",
    "dev": "nx run-many -t serve",
    "lint": "nx run-many -t lint",
    "graph": "nx graph"
  }
}
```

```ini
# .npmrc
auto-install-peers=true
strict-peer-dependencies=false
```

**Commands:**
```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm init
```

### 1.1.2 Update .gitignore

**Files:**
- MODIFY: `.gitignore`

**Add entries:**
```gitignore
# Node/pnpm
node_modules/
.pnpm-store/
pnpm-lock.yaml

# Nx
.nx/
dist/
.cache/
```

---

## Phase 1.2: Nx Installation & Configuration

### 1.2.1 Initialize Nx

**Files:**
- CREATE: `nx.json`
- MODIFY: `package.json` (add Nx devDependencies)

**Commands:**
```bash
pnpm add -D nx @nx/gradle @nx/workspace
```

**Implementation:**

```json
// nx.json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/*.test.*"],
    "sharedGlobals": []
  },
  "plugins": [
    {
      "plugin": "@nx/gradle",
      "options": {
        "testTargetName": "test",
        "classesTargetName": "classes",
        "buildTargetName": "build"
      }
    }
  ],
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "cache": true
    }
  },
  "defaultBase": "main"
}
```

### 1.2.2 Add Nx Gradle Plugin to Root Build

**Files:**
- MODIFY: `build.gradle.kts`

**Implementation:**

Add to root `build.gradle.kts`:
```kotlin
plugins {
    id("dev.nx.gradle.project-graph") version "+"
}

allprojects {
    apply(plugin = "dev.nx.gradle.project-graph")
}
```

### 1.2.3 Verify Nx Project Graph

**Commands:**
```bash
# Generate project graph
./gradlew nxProjectGraph

# Verify Nx sees all modules
pnpm nx show projects

# Visual dependency graph
pnpm nx graph
```

**Expected output:** 23 projects (6 apps, 9 platform libs, 4 shared models, buildSrc, container projects)

---

## Phase 1.3: Service Port Canonicalization

### 1.3.1 Fix Port Conflicts in Docker Compose

**Files:**
- MODIFY: `docker/docker-compose.yml`

**Changes:**
1. Change `discount-service` from 8085 → 8084
2. Keep `fulfillment-service` at 8085
3. Verify `cart-service` is 8081 (not 8082)

**Implementation:** Update service definitions:
```yaml
discount-service:
  ports:
    - "8084:8080"  # Changed from 8085

fulfillment-service:
  ports:
    - "8085:8080"  # Unchanged, now unique
```

### 1.3.2 Create Port Verification Script

**Files:**
- CREATE: `tools/check-service-ports.sh`
- CREATE: `tools/expected-ports.json`

**Implementation:**

```bash
#!/usr/bin/env bash
# tools/check-service-ports.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPECTED_FILE="$SCRIPT_DIR/expected-ports.json"
COMPOSE_FILE="$SCRIPT_DIR/../docker/docker-compose.yml"

# Extract ports from docker-compose and compare with expected
# Exit 0 if match, exit 1 with diff if mismatch
```

```json
// tools/expected-ports.json
{
  "product-service": 8080,
  "cart-service": 8081,
  "wiremock": 8082,
  "customer-service": 8083,
  "discount-service": 8084,
  "fulfillment-service": 8085,
  "audit-service": 8086
}
```

### 1.3.3 Update Application Configs

**Files:**
- MODIFY: `apps/discount-service/src/main/resources/application.yml` (if port hardcoded)
- MODIFY: k6 test scripts referencing old ports

---

## Phase 1.4: Nx ↔ Gradle Task Mapping

### 1.4.1 Configure Per-Module Nx Metadata

**Files:**
- MODIFY: Each `apps/*/build.gradle.kts`
- MODIFY: Each `libs/*/build.gradle.kts`

**Implementation example:**

```kotlin
// apps/product-service/build.gradle.kts
import dev.nx.gradle.nx

nx {
    set("name", "product-service")
    array("tags", "type:app", "scope:backend", "lang:java")
}

tasks {
    build { nx { set("cache", true) } }
    test { nx { set("cache", true) } }
    named("bootRun") { nx { set("continuous", true) } }
}
```

**Tag conventions:**
- `type:app` | `type:lib` | `type:shared-model`
- `scope:backend` | `scope:frontend` | `scope:shared`
- `lang:java` | `lang:typescript`

### 1.4.2 Verify Task Mapping

**Commands:**
```bash
# List available targets for a project
pnpm nx show project product-service

# Run build via Nx (delegates to Gradle)
pnpm nx build product-service

# Run test via Nx
pnpm nx test product-service

# Run all builds
pnpm nx run-many -t build

# Run affected tests only
pnpm nx affected -t test
```

---

## Phase 1.5: CI/CD Integration

### 1.5.1 Update GitHub Actions Workflow

**Files:**
- MODIFY: `ci/gradle-build.yml` (or equivalent)

**Implementation:**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for nx affected

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'gradle'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build affected
        run: pnpm nx affected -t build --base=origin/main~1

      - name: Test affected
        run: pnpm nx affected -t test --base=origin/main~1
```

### 1.5.2 Add Nx Cloud (Optional)

**Files:**
- MODIFY: `nx.json`

**Implementation:**
```bash
pnpm nx connect
```

Adds remote caching for faster CI builds across team.

---

## Phase 1.6: Documentation Updates

### 1.6.1 Update CLAUDE.md

**Files:**
- MODIFY: `CLAUDE.md`

**Add sections:**
- Nx commands alongside Gradle commands
- Package manager: pnpm
- Canonical port table

### 1.6.2 Archive 019_monorepo_prep.md

**Commands:**
```bash
mv 019_monorepo_prep.md docs/archive/
```

---

## Milestone 1 Checklist

- [ ] Phase 1.1: pnpm workspace configured
- [ ] Phase 1.2: Nx installed and project graph working
- [ ] Phase 1.3: Port conflicts resolved, verification script in CI
- [ ] Phase 1.4: All 23 modules have Nx metadata and task mapping
- [ ] Phase 1.5: CI uses `nx affected` commands
- [ ] Phase 1.6: Documentation updated, 019 archived
- [ ] All tests passing via `nx run-many -t test`

---

# MILESTONE 2: Frontend Foundation

Scaffold the first frontend application and shared libraries following ADR 007 (React + Vite) and ADR 008 (shadcn/ui + Tailwind).

**Exit Criteria:**
- `ecommerce-web` application scaffolded with Vite + React + TanStack
- `libs/shared-ui` package with shadcn/ui components initialized
- API type generation pipeline from OpenAPI specs
- Docker Compose includes frontend service
- Hybrid local development workflow documented

---

## Phase 2.1: Frontend Tooling Setup

### 2.1.1 Install Frontend Nx Plugins

**Files:**
- MODIFY: `package.json`
- MODIFY: `nx.json`

**Commands:**
```bash
pnpm add -D @nx/vite @nx/react @nx/js typescript
```

### 2.1.2 Configure TypeScript Base

**Files:**
- CREATE: `tsconfig.base.json`

**Implementation:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "paths": {
      "@reactive-platform/shared-ui/*": ["libs/shared-ui/*/src/index.ts"],
      "@reactive-platform/api-client": ["libs/shared-data/api-client/src/index.ts"]
    }
  }
}
```

---

## Phase 2.2: Scaffold E-commerce Web Application

### 2.2.1 Generate React + Vite Application

**Commands:**
```bash
pnpm nx g @nx/react:app ecommerce-web \
  --bundler=vite \
  --routing=true \
  --style=css \
  --directory=apps/ecommerce-web
```

**Files created:**
- `apps/ecommerce-web/project.json`
- `apps/ecommerce-web/src/main.tsx`
- `apps/ecommerce-web/vite.config.ts`
- `apps/ecommerce-web/tsconfig.json`

### 2.2.2 Add TanStack Router & Query

**Commands:**
```bash
cd apps/ecommerce-web
pnpm add @tanstack/react-router @tanstack/react-query
```

### 2.2.3 Configure Vite Proxy for Backend

**Files:**
- MODIFY: `apps/ecommerce-web/vite.config.ts`

**Implementation:**
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

---

## Phase 2.3: Shared UI Library (shadcn/ui)

### 2.3.1 Create UI Component Library

**Commands:**
```bash
pnpm nx g @nx/react:lib ui-components \
  --directory=libs/shared-ui/ui-components \
  --buildable
```

### 2.3.2 Configure Tailwind CSS

**Files:**
- CREATE: `libs/shared-ui/ui-components/tailwind.config.js`
- CREATE: `tailwind.config.js` (root, shared preset)

**Commands:**
```bash
pnpm add -D tailwindcss postcss autoprefixer
pnpm add tailwindcss-animate class-variance-authority clsx tailwind-merge
```

### 2.3.3 Initialize shadcn/ui

**Files:**
- CREATE: `libs/shared-ui/ui-components/components.json`

**Commands:**
```bash
cd libs/shared-ui/ui-components
pnpm dlx shadcn@latest init
```

Configure for monorepo structure per ADR 008 decision.

### 2.3.4 Add Initial Components

**Commands:**
```bash
pnpm dlx shadcn@latest add button input dialog select
```

---

## Phase 2.4: API Client Generation

### 2.4.1 Configure OpenAPI Export from Spring Boot

**Files:**
- MODIFY: `apps/product-service/build.gradle.kts`

**Add springdoc-openapi plugin:**
```kotlin
dependencies {
    implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.3.0")
}
```

### 2.4.2 Create API Client Library

**Commands:**
```bash
pnpm nx g @nx/js:lib api-client \
  --directory=libs/shared-data/api-client \
  --buildable
```

### 2.4.3 Add OpenAPI Generator

**Files:**
- CREATE: `tools/openapi-codegen/generate.sh`
- MODIFY: `package.json` (add generate script)

**Commands:**
```bash
pnpm add -D @openapitools/openapi-generator-cli
```

**Script:**
```bash
#!/usr/bin/env bash
# Fetch OpenAPI spec from running service and generate TypeScript client
curl http://localhost:8080/v3/api-docs -o tools/openapi-codegen/product-api.json
pnpm openapi-generator-cli generate \
  -i tools/openapi-codegen/product-api.json \
  -g typescript-fetch \
  -o libs/shared-data/api-client/src/generated
```

---

## Phase 2.5: Docker Integration

### 2.5.1 Create Frontend Dockerfile

**Files:**
- CREATE: `docker/Dockerfile.ecommerce-web`

**Implementation:**
```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY nx.json tsconfig.base.json ./
COPY apps/ecommerce-web/ ./apps/ecommerce-web/
COPY libs/shared-ui/ ./libs/shared-ui/
COPY libs/shared-data/ ./libs/shared-data/

RUN pnpm install --frozen-lockfile
RUN pnpm nx build ecommerce-web --configuration=production

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist/apps/ecommerce-web /usr/share/nginx/html
COPY docker/nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
```

### 2.5.2 Add to Docker Compose

**Files:**
- MODIFY: `docker/docker-compose.yml`

**Add service:**
```yaml
ecommerce-web:
  build:
    context: ..
    dockerfile: docker/Dockerfile.ecommerce-web
  container_name: ecommerce-web
  ports:
    - "3001:3000"
  depends_on:
    product-service:
      condition: service_healthy
  networks:
    - observability
```

---

## Phase 2.6: Local Development Workflow

### 2.6.1 Add Development Scripts

**Files:**
- MODIFY: `package.json`

**Add scripts:**
```json
{
  "scripts": {
    "dev:backend": "cd docker && docker compose up -d",
    "dev:frontend": "nx serve ecommerce-web",
    "dev": "concurrently \"pnpm dev:backend\" \"pnpm dev:frontend\"",
    "stop": "cd docker && docker compose down"
  }
}
```

**Commands:**
```bash
pnpm add -D concurrently
```

### 2.6.2 Document Hybrid Development

**Files:**
- MODIFY: `CLAUDE.md`

**Add section for frontend development modes:**
- Full Docker (production-like)
- Hybrid (Docker backend + local frontend with HMR)
- Full local (for advanced debugging)

---

## Milestone 2 Checklist

- [ ] Phase 2.1: Frontend Nx plugins installed, TypeScript configured
- [ ] Phase 2.2: ecommerce-web application scaffolded with Vite + React
- [ ] Phase 2.3: shared-ui library with shadcn/ui + Tailwind initialized
- [ ] Phase 2.4: API client generation pipeline configured
- [ ] Phase 2.5: Docker build and compose integration complete
- [ ] Phase 2.6: Local development scripts and documentation
- [ ] `nx serve ecommerce-web` runs with backend proxy working
- [ ] `nx build ecommerce-web` produces production bundle

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `pnpm-workspace.yaml` | pnpm workspace configuration |
| CREATE | `package.json` | Root package.json with scripts |
| CREATE | `.npmrc` | pnpm configuration |
| CREATE | `nx.json` | Nx workspace configuration |
| CREATE | `tsconfig.base.json` | Shared TypeScript configuration |
| CREATE | `tools/check-service-ports.sh` | Port verification script |
| CREATE | `tools/expected-ports.json` | Expected port mapping |
| CREATE | `tools/openapi-codegen/generate.sh` | API client generation |
| CREATE | `docker/Dockerfile.ecommerce-web` | Frontend Docker build |
| CREATE | `apps/ecommerce-web/` | E-commerce React application |
| CREATE | `libs/shared-ui/ui-components/` | shadcn/ui component library |
| CREATE | `libs/shared-data/api-client/` | Generated API client |
| MODIFY | `build.gradle.kts` | Add Nx Gradle plugin |
| MODIFY | `apps/*/build.gradle.kts` | Add Nx metadata per module |
| MODIFY | `docker/docker-compose.yml` | Fix ports, add frontend |
| MODIFY | `.gitignore` | Add Node/Nx entries |
| MODIFY | `CLAUDE.md` | Document Nx commands and workflows |
| ARCHIVE | `019_monorepo_prep.md` | Superseded by this plan |

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add Nx commands, pnpm usage, port table, frontend dev workflow |
| `docs/ADRs/006_frontend_monorepo_strategy.md` | Mark open questions as resolved |
| `README.md` | Add frontend quick start section |

---

## Testing Strategy

**Milestone 1:**
- Run `nx run-many -t test` and compare results with `./gradlew testAll`
- Verify `nx affected -t build` correctly identifies dependencies
- Test port verification script catches conflicts

**Milestone 2:**
- Unit tests for React components with Vitest + RTL
- Accessibility tests with axe-core
- API client generation produces valid TypeScript types
- Docker build produces working container

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| @nx/gradle plugin version incompatibility | Pin plugin version, test with Gradle 8.x |
| Gradle build cache conflict with Nx cache | Use Nx for distributed cache, Gradle for local only |
| shadcn/ui monorepo setup complexity | Follow ADR 008 guidance, manual tailwind config if CLI fails |
| OpenAPI spec drift | Add generation to CI, fail on breaking changes |

---

## Checklist

- [ ] Milestone 1 complete (Nx + Gradle integration)
- [ ] Milestone 2 complete (Frontend foundation)
- [ ] All tests passing
- [ ] CI/CD updated
- [ ] Documentation updated
- [ ] 019_monorepo_prep.md archived
