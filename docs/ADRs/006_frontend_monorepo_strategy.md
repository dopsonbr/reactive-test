# Frontend Monorepo Strategy

* Status: proposed
* Deciders: Platform Team, Frontend Team
* Date: 2025-12-05

## Context and Problem Statement

This repository currently contains a mature Java/Gradle monorepo with 6 Spring Boot backend services, platform libraries, and shared models. The team now needs to add frontend applications that consume these backend services. The first applications will be a customer-facing e-commerce system and a POS (Point of Sale) system for in-store employees. Future applications include mobile apps, admin dashboards, data management (merchandising), and order management (customer self-service and employee-facing).

The key challenge is integrating frontend applications (likely React/TypeScript or similar) into a primarily Java/Gradle monorepo while maintaining:
- A unified development experience
- The ability to run the entire system together
- Shared code and types between frontend and backend
- Consistent build, test, and deployment pipelines

## Decision Drivers

1. **Polyglot support** - Must support Java (backend) and JavaScript/TypeScript (frontend) ecosystems with their native tooling
2. **Unified orchestration** - Need to run backend services + frontend apps together for local development
3. **Type safety** - Frontend should consume backend API types with compile-time safety
4. **Scalability** - Architecture must support 5+ frontend applications (e-commerce, POS, mobile, admin, merchandising, order management)
5. **Build performance** - Incremental builds and caching for both ecosystems
6. **Team autonomy** - Frontend and backend teams should work independently without blocking each other
7. **Existing patterns** - Should complement, not replace, the existing Gradle convention plugin architecture

## Considered Options

1. **Nx Polyglot Monorepo** - Use Nx as the top-level orchestrator with Gradle as a delegated build tool (leading candidate)
2. **Turborepo with Gradle Coexistence** - Use Turborepo for JS/TS with parallel Gradle structure
3. **Bazel Unified Build** - Replace Gradle with Bazel for true polyglot build
4. **Pants Build System** - Python-native polyglot build system
5. **Parallel Directory Structure** - Separate `frontend/` and `backend/` top-level directories with independent tooling
6. **Gradle-Only with Node Plugin** - Extend current Gradle setup with Node.js plugins for frontend builds
7. **Separate Repositories** - Keep frontend in a separate git repository with API contracts shared via artifacts

## Decision Outcome

Chosen option: **Nx Polyglot Monorepo** (leading candidate)

Nx provides first-class support for polyglot monorepos and can orchestrate both JavaScript/TypeScript projects (native) and Java/Gradle projects (via @nx/gradle plugin). This approach:

- Preserves all existing Gradle conventions and build logic
- Adds native Node.js/TypeScript tooling for frontend applications
- Provides unified task orchestration across both ecosystems
- Enables intelligent caching and affected-based builds
- Supports code generation for shared types between frontend and backend

### Positive Consequences

- **Single `nx run-many` command** runs both backend and frontend builds/tests
- **Affected commands** (`nx affected:build`) only rebuild changed projects across both ecosystems
- **Distributed caching** with Nx Cloud accelerates CI/CD
- **Native tooling** - Frontend uses npm/pnpm directly, backend uses Gradle directly
- **Unified dependency graph** visualization across all projects
- **Generators** can scaffold new frontend or backend modules consistently

### Negative Consequences

- **Additional complexity** - Developers must understand both Nx and Gradle
- **Nx learning curve** for Java-focused developers
- **Two package managers** - npm/pnpm for frontend, Gradle for backend
- **Potential tooling conflicts** during upgrades

## Package Manager Decision

**pnpm** is the canonical package manager for all frontend/Node.js tooling in this monorepo.

### Rationale

- **Disk efficiency** - pnpm's content-addressable store avoids duplicate packages across projects
- **Strict dependency resolution** - Prevents phantom dependencies that cause production issues
- **Workspace support** - Native `pnpm-workspace.yaml` integrates cleanly with Nx
- **Performance** - Faster than npm, comparable to Bun, more mature than Bun
- **CI/CD compatibility** - Widely supported in GitHub Actions, GitLab CI, and container builds
- **Nx first-class support** - pnpm is fully supported by Nx with no known issues

### Future Consideration: Bun

Bun is supported by Nx (since v19.1) and offers faster performance. Once Bun matures further and CI/CD tooling catches up, migration from pnpm to Bun would be straightforward since both use `package.json` workspaces. This can be revisited in 6-12 months.

### Migration Steps

Detailed migration steps for introducing pnpm and Nx to this repository will be covered in a separate implementation plan. This includes:
- Installing pnpm and creating `pnpm-workspace.yaml`
- Initializing Nx with `@nx/gradle` plugin
- Configuring Nx targets for existing Gradle tasks
- Setting up CI/CD to use pnpm
- Developer environment setup documentation

## Nx ↔ Gradle Task Mapping Strategy

The `@nx/gradle` plugin automatically discovers Gradle tasks and exposes them as Nx targets. This section defines how existing Gradle tasks map to Nx and how caching is coordinated.

### Companion Gradle Plugin Setup

Add the Nx Gradle plugin to `build.gradle.kts`:

```kotlin
plugins {
    id("dev.nx.gradle.project-graph") version("+")
}

allprojects {
    apply {
        plugin("dev.nx.gradle.project-graph")
    }
}
```

This generates an `nxProjectGraph` task that exports the Gradle project structure for Nx to consume.

### Nx Configuration

```json
// nx.json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "plugins": [
    {
      "plugin": "@nx/gradle",
      "options": {
        "testTargetName": "test",
        "classesTargetName": "classes",
        "buildTargetName": "build",
        "ciTestTargetName": "test-ci",
        "ciBuildTargetName": "build-ci",
        "gradleExecutableDirectory": "."
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

### Task Mapping Reference

| Current Gradle Command | Nx Equivalent | Notes |
|------------------------|---------------|-------|
| `./gradlew buildAll` | `nx run-many -t build` | Builds all projects |
| `./gradlew testAll` | `nx run-many -t test` | Tests all projects |
| `./gradlew :apps:product-service:build` | `nx build product-service` | Single project build |
| `./gradlew :apps:product-service:test` | `nx test product-service` | Single project test |
| `./gradlew :apps:product-service:bootRun` | `nx serve product-service` | Requires `serveTargetName` config |
| `./gradlew :apps:product-service:bootJar` | `nx build product-service` | Included in build target |
| N/A | `nx affected -t build` | Only changed projects |
| N/A | `nx affected -t test` | Only changed projects |
| N/A | `nx graph` | Visualize all dependencies |

### Per-Project Gradle DSL Configuration

Use the `nx {}` block in individual `build.gradle.kts` files for project-specific configuration:

```kotlin
// apps/product-service/build.gradle.kts
import dev.nx.gradle.nx

nx {
    set("name", "product-service")
    array("tags", "app", "backend", "java")
}

tasks {
    build {
        nx {
            set("cache", true)
        }
    }
    named("bootRun") {
        nx {
            set("continuous", true)  // Mark as long-running server
        }
    }
}
```

### Caching Strategy

Nx manages caching to avoid conflicts with Gradle's build cache:

1. **Nx handles remote/distributed caching** - Use Nx Cloud or local cache
2. **Gradle handles local compilation cache** - Incremental compilation still works
3. **CI uses `build-ci` and `test-ci` targets** - Optimized for distribution and caching

The `ciTestTargetName: "test-ci"` option enables **test atomization**, splitting tests by class for parallel execution across CI agents.

### CI Workflow Commands

```bash
# Local development
nx build product-service
nx test product-service
nx run-many -t build test

# CI pipeline (use optimized targets)
nx affected -t build-ci test-ci --base=origin/main
```

## Open Questions

- **Service port truth source** - Current docs disagree on cart-service (8081 vs 8082) and Docker Compose maps both discount-service and fulfillment-service to host 8085. Which port table is authoritative, and which host bindings should change to eliminate collisions?
- **Decision status gating** - What criteria (e.g., Nx+Gradle POC, port map reconciliation) are required to move this ADR from "proposed" to "accepted"?

## Pros and Cons of the Options

### 1. Nx Polyglot Monorepo (leading candidate)

**Good**
- First-class polyglot support with @nx/gradle plugin
- Intelligent task scheduling and caching across ecosystems
- Strong TypeScript/React ecosystem support with code generation
- Unified CI/CD orchestration with `nx affected`
- Active community and enterprise support (Nrwl/Nx)
- Can generate TypeScript types from OpenAPI specs for API contracts
- Mature plugin ecosystem for React, Next.js, Angular, Node.js
- Built-in support for module federation (micro-frontends)

**Bad**
- Adds Nx as a new build orchestration layer
- Requires npm/pnpm installation in addition to Java/Gradle
- Some overlap in responsibility between Nx and Gradle (task caching)
- @nx/gradle plugin is newer and less mature than native Nx plugins

### 2. Turborepo with Gradle Coexistence

Turborepo focuses on JavaScript/TypeScript monorepos with Gradle running independently.

**Good**
- Simpler than Nx, less configuration
- Excellent caching for JS/TS builds
- Vercel-backed with strong Next.js integration
- Can coexist with Gradle without integration

**Bad**
- No native Gradle integration - ecosystems remain separate
- Less powerful than Nx for polyglot orchestration
- Smaller plugin ecosystem
- No unified dependency graph across Java and JS

### 3. Bazel Unified Build

Replace Gradle with Bazel for a truly unified polyglot build system.

**Good**
- True polyglot support (Java, TypeScript, Go, Python, etc.)
- Hermetic builds with perfect reproducibility
- Massive scale support (Google-scale)
- Single source of truth for all builds
- Remote caching and distributed execution

**Bad**
- Steep learning curve and complex configuration
- Would require rewriting all Gradle build logic
- Smaller community than Gradle/Nx
- IDE integration is less mature
- Overkill for current project scale
- Significant migration effort from existing Gradle setup

### 4. Pants Build System

Python-native polyglot build system with Java and TypeScript support.

**Good**
- Good polyglot support (Python, Java, Go, TypeScript)
- Simpler than Bazel with similar benefits
- Strong Python ecosystem support
- Ergonomic BUILD file syntax

**Bad**
- Smaller community than Nx or Bazel
- TypeScript support less mature than Nx
- Would require Gradle migration
- Less React/frontend ecosystem tooling
- Not widely adopted outside Python-centric organizations

### 5. Parallel Directory Structure

```
reactive-platform/
├── backend/           # Current Gradle structure moved here
│   ├── apps/
│   ├── libs/
│   └── build.gradle.kts
├── frontend/          # New npm/pnpm workspace
│   ├── apps/
│   │   ├── ecommerce-web/
│   │   └── pos-web/
│   ├── libs/
│   │   └── ui-components/
│   └── package.json
└── docker/            # Orchestrates both
```

**Good**
- Clear separation of concerns
- Each ecosystem uses native tooling without interference
- Minimal changes to existing Gradle setup
- Teams can work independently

**Bad**
- No unified build orchestration - must run separate commands
- No cross-ecosystem dependency graph or affected analysis
- Code sharing requires manual synchronization or artifact publishing
- Docker Compose becomes the only integration point
- Harder to enforce consistent patterns across ecosystems

### 6. Gradle-Only with Node Plugin

Use plugins like `com.github.node-gradle.node` to run npm/pnpm tasks from Gradle.

**Good**
- Single build tool (Gradle) for everything
- Existing Gradle knowledge applies
- Unified task graph and caching via Gradle

**Bad**
- Fighting against npm/Node.js ecosystem conventions
- Frontend developers unfamiliar with Gradle
- Limited support for modern frontend tooling (Vite, Turbopack)
- Plugin maintenance/compatibility concerns
- IDE integration for frontend development is poor

### 7. Separate Repositories

**Good**
- Complete isolation of concerns
- Independent release cycles
- Clear ownership boundaries

**Bad**
- Breaks monorepo benefits (atomic commits, unified CI)
- API contract synchronization becomes a major challenge
- Cross-cutting changes require coordinated PRs
- Local development requires cloning multiple repos
- Harder to maintain consistency

## Proposed Directory Structure

```
reactive-platform/
├── nx.json                           # Nx configuration
├── package.json                      # Root package.json for Nx + frontend deps
├── pnpm-workspace.yaml               # pnpm workspace (or npm workspaces)
│
├── apps/                             # All applications (backend + frontend)
│   ├── product-service/              # Existing Spring Boot app
│   ├── cart-service/                 # Existing Spring Boot app
│   ├── customer-service/             # Existing Spring Boot app
│   ├── discount-service/             # Existing Spring Boot app
│   ├── fulfillment-service/          # Existing Spring Boot app
│   ├── audit-service/                # Existing Spring Boot app
│   ├── ecommerce-web/                # NEW: Customer e-commerce (React/Next.js)
│   ├── pos-web/                      # NEW: In-store POS (React)
│   ├── admin-web/                    # FUTURE: Admin dashboard
│   ├── merchandising-web/            # FUTURE: Data management
│   └── order-mgmt-web/               # FUTURE: Order management
│
├── libs/                             # All libraries
│   ├── platform/                     # Existing Java platform libs
│   │   ├── platform-bom/
│   │   ├── platform-logging/
│   │   └── ...
│   ├── shared-model/                 # Existing Java shared models
│   │   ├── shared-model-product/
│   │   ├── shared-model-customer/
│   │   └── ...
│   ├── shared-ui/                    # NEW: React component library
│   │   ├── ui-components/            # Buttons, forms, etc.
│   │   ├── ui-theme/                 # Design tokens, theming
│   │   └── ui-icons/                 # Icon library
│   ├── shared-data/                  # NEW: Data fetching & state
│   │   ├── api-client/               # Generated API clients
│   │   └── api-types/                # Generated TypeScript types from OpenAPI
│   └── shared-utils/                 # NEW: Shared utilities
│       ├── validation/               # Form validation (shared with backend?)
│       └── formatting/               # Date, currency formatting
│
├── tools/                            # Build/codegen tools
│   ├── openapi-codegen/              # TypeScript type generation
│   └── generators/                   # Custom Nx generators
│
├── buildSrc/                         # Existing Gradle convention plugins
├── gradle/                           # Existing Gradle config
├── settings.gradle.kts               # Existing Gradle settings
├── build.gradle.kts                  # Existing Gradle root
│
├── docker/                           # Docker Compose (extended for frontend)
│   ├── docker-compose.yml
│   ├── Dockerfile.ecommerce-web
│   └── Dockerfile.pos-web
│
└── e2e-test/                         # Extended for frontend E2E
    ├── k6/                           # Existing load tests
    └── playwright/                   # NEW: Frontend E2E tests
```

## Local Development Strategy

Running the entire system locally is critical for developer experience. This section outlines strategies for running backend services and frontend applications together during development.

### Current State

The existing Docker Compose setup (`docker/docker-compose.yml`) provides:
- 6 backend services (product, cart, customer, discount, fulfillment, audit)
- Infrastructure (PostgreSQL, Redis)
- External service mocks (WireMock)
- Full observability stack (Grafana, Prometheus, Loki, Tempo)
- Load testing profiles (k6)

### Local Development Modes

#### Mode 1: Full Docker (Recommended for Integration Testing)

Everything runs in Docker containers, including frontend applications.

```bash
# Build all artifacts
nx run-many -t build

# Start entire stack
cd docker && docker compose up -d

# Access applications
# Backend:  http://localhost:8080 (product-service)
# Frontend: http://localhost:3001 (ecommerce-web)
# Grafana:  http://localhost:3000
```

**Pros:**
- Closest to production environment
- All services communicate via Docker network
- Consistent environment across team members
- Full observability integration

**Cons:**
- Slower frontend development iteration (no HMR)
- Requires rebuild for code changes
- Higher resource usage

#### Mode 2: Hybrid Development (Recommended for Daily Development)

Backend services run in Docker, frontend runs locally with hot reload.

```bash
# Terminal 1: Start backend infrastructure + services
cd docker && docker compose up -d

# Terminal 2: Start frontend with hot reload
nx serve ecommerce-web
# Runs on http://localhost:4200 with HMR
# Proxies API calls to http://localhost:8080
```

Frontend `proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  },
  "/graphql": {
    "target": "http://localhost:8081",
    "secure": false
  }
}
```

**Pros:**
- Fast frontend iteration with hot module replacement
- Backend remains stable in containers
- Best balance of speed and realism

**Cons:**
- Two terminal sessions required
- CORS configuration needed
- Frontend not in Docker network (uses localhost ports)

#### Mode 3: Full Local Development (Maximum Speed)

Everything runs locally via Nx for fastest iteration.

```bash
# Start infrastructure only
cd docker && docker compose up -d postgres redis wiremock tempo

# Start all services via Nx
nx run-many -t serve --projects=product-service,cart-service,ecommerce-web

# Or use Nx's parallel execution
nx run-many -t serve --all
```

**Pros:**
- Fastest iteration for full-stack changes
- Single command to start everything
- IDE debugging for all services

**Cons:**
- Java services require local JDK 21
- More complex setup per developer
- May differ from production behavior

### Considered Tools for Local Development Orchestration

#### 1. Docker Compose + Nx Hybrid (Recommended)

Use Docker Compose for backend/infrastructure, Nx for frontend dev servers.

**Implementation:**
- Extend `docker-compose.yml` with frontend production containers
- Add `docker-compose.override.yml` for development overrides
- Create Nx target `nx run ecommerce-web:serve` with proxy configuration

#### 2. Docker Compose with Watch Mode

Docker Compose v2.22+ supports file watching for automatic rebuilds.

```yaml
# docker-compose.yml
services:
  ecommerce-web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.ecommerce-web
    develop:
      watch:
        - action: sync
          path: ./apps/ecommerce-web/src
          target: /app/src
        - action: rebuild
          path: ./apps/ecommerce-web/package.json
```

```bash
docker compose watch
```

**Pros:** Single tool, syncs files into container
**Cons:** Not as fast as native HMR, newer feature

#### 3. Tilt

Kubernetes-focused local development tool that can also work with Docker Compose.

```python
# Tiltfile
docker_compose('./docker/docker-compose.yml')

# Frontend with live reload
local_resource(
    'ecommerce-web',
    serve_cmd='nx serve ecommerce-web',
    deps=['apps/ecommerce-web/src']
)
```

**Pros:** Unified dashboard, smart rebuilds, K8s path
**Cons:** Another tool to learn, overkill if not using K8s

#### 4. Skaffold

Google's local Kubernetes development tool.

**Pros:** Strong K8s integration, file sync
**Cons:** Requires Kubernetes, complex for Docker-only

#### 5. DevContainers (VS Code)

Develop inside containers with full IDE support.

**Pros:** Consistent dev environment, IDE integration
**Cons:** VS Code specific, container overhead

### Recommended Local Development Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Developer Workstation                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Nx Orchestration                       │   │
│  │  nx serve ecommerce-web    →  localhost:4200 (HMR)       │   │
│  │  nx serve pos-web          →  localhost:4201 (HMR)       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ Proxy /api → localhost:808x      │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Docker Compose Stack                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │   │
│  │  │  product    │ │    cart     │ │  customer   │        │   │
│  │  │  :8080      │ │   :8081     │ │   :8083     │        │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │   │
│  │  │  discount   │ │ fulfillment │ │   audit     │        │   │
│  │  │  :8084      │ │   :8085     │ │   :8086     │        │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │   │
│  │  │  postgres   │ │    redis    │ │  wiremock   │        │   │
│  │  │  :5432      │ │   :6379     │ │   :8082     │        │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │   │
│  │  │   grafana   │ │ prometheus  │ │   tempo     │        │   │
│  │  │  :3000      │ │   :9090     │ │   :3200     │        │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Convenience Commands

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd docker && docker compose up -d",
    "dev:frontend": "nx run-many -t serve --projects=ecommerce-web,pos-web",
    "dev:infra": "cd docker && docker compose up -d postgres redis wiremock tempo loki prometheus grafana",
    "dev:full": "cd docker && docker compose up -d",
    "stop": "cd docker && docker compose down"
  }
}
```

Or via Nx targets in `nx.json`:
```json
{
  "targetDefaults": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "cd docker && docker compose up -d",
          "nx run-many -t serve --projects=ecommerce-web"
        ],
        "parallel": false
      }
    }
  }
}
```

## Docker Integration Strategy

Nx does not have built-in Docker support. The following approaches are recommended:

### Recommended: @nx-tools/nx-container Plugin

The community-maintained `@nx-tools/nx-container` plugin provides Nx executors for Docker builds.

```bash
npm install -D @nx-tools/nx-container
```

Configure in `apps/ecommerce-web/project.json`:
```json
{
  "targets": {
    "container": {
      "executor": "@nx-tools/nx-container:build",
      "dependsOn": ["build"],
      "options": {
        "engine": "docker",
        "push": false,
        "tags": ["ecommerce-web:latest"],
        "file": "apps/ecommerce-web/Dockerfile",
        "context": "."
      },
      "configurations": {
        "production": {
          "push": true,
          "tags": ["registry.example.com/ecommerce-web:${VERSION}"]
        }
      }
    }
  }
}
```

**Benefits:**
- Integrates with Nx caching and affected commands
- `nx affected -t container` only builds changed images
- Unified task graph for builds → container

### Alternative: nx:run-commands

For simpler setups without additional plugins:

```json
{
  "targets": {
    "docker-build": {
      "executor": "nx:run-commands",
      "dependsOn": ["build"],
      "options": {
        "command": "docker build -t ecommerce-web:latest -f apps/ecommerce-web/Dockerfile .",
        "cwd": "{workspaceRoot}"
      }
    }
  }
}
```

### Docker Compose Integration

Extend existing `docker-compose.yml` for frontend services:

```yaml
# docker/docker-compose.yml (additions)
services:
  ecommerce-web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.ecommerce-web
    container_name: ecommerce-web
    environment:
      - NODE_ENV=production
      - API_BASE_URL=http://cart-service:8080
    ports:
      - "3001:3000"
    depends_on:
      cart-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - observability

  pos-web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.pos-web
    container_name: pos-web
    environment:
      - NODE_ENV=production
      - API_BASE_URL=http://cart-service:8080
    ports:
      - "3002:3000"
    depends_on:
      cart-service:
        condition: service_healthy
    networks:
      - observability
```

### Example Frontend Dockerfile

```dockerfile
# docker/Dockerfile.ecommerce-web

# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY nx.json tsconfig.base.json ./

# Copy only required projects (Nx pruning alternative)
COPY apps/ecommerce-web/ ./apps/ecommerce-web/
COPY libs/shared-ui/ ./libs/shared-ui/
COPY libs/shared-data/ ./libs/shared-data/

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Build the application
RUN pnpm nx build ecommerce-web --configuration=production

# Stage 2: Production
FROM node:22-alpine AS runner
WORKDIR /app

# Copy built output
COPY --from=builder /app/dist/apps/ecommerce-web ./

# For Next.js standalone output
# COPY --from=builder /app/apps/ecommerce-web/.next/standalone ./
# COPY --from=builder /app/apps/ecommerce-web/.next/static ./.next/static
# COPY --from=builder /app/apps/ecommerce-web/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### CI/CD Docker Build Flow

```bash
# Build and push only affected containers
nx affected -t container --configuration=production

# Or build all containers
nx run-many -t container --all --configuration=production
```

## Possibilities

This section outlines potential implementation approaches organized by phase. The specific sequencing and scope should be determined based on team capacity and priorities.

### Foundation: Nx Integration

- Install Nx: `npx nx@latest init` in repository root
- Configure `@nx/gradle` plugin to recognize existing Gradle projects
- Add root `package.json` with pnpm workspaces (or npm workspaces)
- Verify `nx graph` shows backend projects correctly
- Test `nx run product-service:build` delegates to Gradle correctly

### First Frontend Application: E-commerce

- Generate React/Next.js app: `nx g @nx/next:app ecommerce-web`
- Set up API type generation from backend OpenAPI specs
- Create shared UI component library: `nx g @nx/react:lib ui-components`
- Configure Docker build for frontend container
- Update docker-compose.yml to include frontend service with hot reload

### Shared Libraries Architecture

- Create `libs/shared-ui/` for React component library (Storybook integration)
- Create `libs/shared-data/api-client/` for generated API clients
- Set up OpenAPI spec export from Spring Boot services (springdoc-openapi)
- Configure automatic type regeneration on backend API changes
- Consider design token sharing between backend validation and frontend forms

### Second Application: POS System

- Generate POS app following established patterns
- Share UI components and API clients from e-commerce
- Add POS-specific features (barcode scanning, receipt printing, offline support)
- Consider React Native or PWA for tablet deployment

### CI/CD Enhancements

- Update CI to use `nx affected` for incremental builds
- Configure Nx Cloud for distributed caching (optional, has cost)
- Add frontend Docker image builds to pipeline
- Set up Playwright E2E tests in CI with visual regression testing
- Consider deployment strategies (CDN for static, containerized for SSR)

### Future Applications

- **Admin Dashboard**: Internal tools, user management, system configuration
- **Merchandising Web**: Product data management, pricing, inventory
- **Order Management**: Customer self-service and employee-facing order handling
- **Mobile Apps**: React Native sharing code with web apps, or native with shared API types

### Alternative: Micro-Frontend Architecture

If applications grow complex, consider:
- Module Federation for runtime composition
- Independent deployment per frontend application
- Shared shell application with lazy-loaded micro-apps

## References

- Current build configuration: `build.gradle.kts:1`, `settings.gradle.kts:1`
- Gradle convention plugins: `buildSrc/src/main/kotlin/platform.*.gradle.kts`
- Existing app structure: `apps/product-service/`, `apps/cart-service/`
- Docker orchestration: `docker/docker-compose.yml`
- Nx Gradle plugin documentation: https://nx.dev/nx-api/gradle
- Turborepo documentation: https://turbo.build/repo/docs
- Bazel documentation: https://bazel.build/
- Pants Build documentation: https://www.pantsbuild.org/
- OpenAPI Generator for TypeScript: https://openapi-generator.tech/docs/generators/typescript-fetch
