# AGENTS.md

This file provides guidance to AI agents (Claude Code, etc.) working with this repository.

---

## CRITICAL: Respect Nested AGENTS.md Files

**This is the most important rule.** Before making changes to any directory, you MUST:

1. **Check for AGENTS.md** in the target directory and all parent directories up to this root
2. **Read and follow** all applicable AGENTS.md guidance - nested files take precedence for their scope
3. **Never override** package-specific conventions defined in nested AGENTS.md files

### AGENTS.md Hierarchy

```
AGENTS.md (this file)           ← Repository-wide guidance
├── apps/AGENTS.md              ← All applications
│   ├── product-service/AGENTS.md
│   ├── cart-service/AGENTS.md
│   └── {service}/src/.../AGENTS.md  ← Package-level guidance
├── libs/platform/AGENTS.md     ← All platform libraries
│   ├── platform-logging/AGENTS.md
│   ├── platform-cache/AGENTS.md
│   └── ...
├── libs/shared-ui/ui-components/AGENTS.md
├── libs/shared-design/tokens/AGENTS.md
├── docs/standards/AGENTS.md
└── ci/AGENTS.md
```

**When modifying code**: Always read the most specific AGENTS.md first, then work up the hierarchy.

---

## Project Structure

This is an **Nx-orchestrated polyglot monorepo** with Gradle backend modules and TypeScript frontend applications. Nx provides unified task orchestration, caching, and affected analysis across all modules.

```
reactive-platform/
├── buildSrc/                    # Convention plugins (Kotlin DSL)
├── gradle/libs.versions.toml    # Version catalog
├── libs/platform/               # Platform libraries (see libs/platform/AGENTS.md)
│   ├── platform-bom/            # Platform BOM (extends Spring Boot BOM)
│   ├── platform-logging/        # Structured JSON logging library
│   ├── platform-resilience/     # Resilience4j reactive wrappers
│   ├── platform-cache/          # Non-blocking Redis cache abstraction
│   ├── platform-error/          # Global error handling
│   ├── platform-webflux/        # Common WebFlux utilities (context, validation)
│   ├── platform-security/       # Security (placeholder for OAuth2/JWT)
│   └── platform-test/           # Shared test utilities
├── apps/                        # Applications (see apps/AGENTS.md)
│   ├── product-service/         # Product aggregation service
│   └── cart-service/            # Shopping cart service
├── docker/                      # Docker Compose and observability stack
└── e2e-test/                    # k6 end-to-end tests
```

---

## Boundaries

Files requiring careful review before changes:

| File/Directory | Reason |
|----------------|--------|
| `settings.gradle.kts` | All module registrations - affects entire build |
| `gradle/libs.versions.toml` | Centralized dependency versions |
| `buildSrc/` | Convention plugins affect all modules |
| `libs/platform/platform-bom/` | BOM changes propagate to all services |
| `docker/docker-compose.yml` | Infrastructure configuration |
| `tsconfig.base.json` | TypeScript path mappings for all frontend projects |
| `nx.json` | Nx workspace configuration |

---

## Conventions

1. **Always use Nx for builds** - Run `pnpm nx run-many -t build` not `./gradlew build` directly
2. **Reactor Context over MDC** - Never use thread-local MDC in reactive code
3. **Implementation plans required** - Create `NNN_FEATURE_NAME.md` before major changes
4. **Never delete plans** - Archive to `docs/archive/` when complete
5. **Platform libraries are shared** - Changes affect all applications
6. **Follow nested AGENTS.md** - Package-specific guidance takes precedence

---

## Warnings

- **MDC is not reactive-safe** - Use Reactor Context with `deferContextual()` or `contextWrite()`
- **Resilience4j order matters** - Decorators: timeout → circuit breaker → retry → bulkhead
- **Port conflicts** - Check `tools/check-service-ports.js` before adding services
- **Breaking platform changes** - Require version bumps and migration notes

---

## Standards Reference

Detailed standards are in `docs/standards/`:

| Standard | When to Reference |
|----------|-------------------|
| `docs/standards/backend/architecture.md` | Backend service structure |
| `docs/standards/backend/validation.md` | Request validation patterns |
| `docs/standards/backend/testing-*.md` | Testing patterns |
| `docs/standards/frontend/architecture.md` | Frontend component structure |
| `docs/standards/frontend/components.md` | UI component patterns |
| `docs/standards/documentation.md` | README/AGENTS.md patterns |

---

## Package Manager

This project uses **pnpm** as the package manager. Ensure you have it installed:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install
```

## Build Commands (Nx - Preferred)

Nx orchestrates both Gradle backend modules and (future) TypeScript frontend apps. Prefer Nx commands for unified caching and affected analysis.

```bash
# Build all modules
pnpm nx run-many -t build

# Build specific module
pnpm nx build :libs:platform:platform-logging
pnpm nx build :apps:product-service

# Run all tests
pnpm nx run-many -t test

# Run specific module tests
pnpm nx test :apps:product-service

# Run affected targets only (for PRs)
pnpm nx affected -t build
pnpm nx affected -t test

# View dependency graph
pnpm nx graph

# List all projects
pnpm nx show projects
```

### Nx Inferred Tasks

Nx 22+ automatically creates **inferred tasks** from tool configurations (Vite, Vitest, Jest, package scripts, Gradle, etc.). Before assuming a missing `build`/`test` target, run `pnpm nx show project <name>` to inspect the auto-generated targets, or read the Nx docs on [inferred tasks](https://nx.dev/docs/concepts/inferred-tasks). Only add manual targets when an inferred one cannot express the required behavior.

## Build Commands (Gradle - Direct)

Direct Gradle commands are still available for advanced use cases:

```bash
# Build all modules
./gradlew buildAll

# Build specific module
./gradlew :libs:platform:platform-logging:build
./gradlew :apps:product-service:build
./gradlew :apps:cart-service:build

# Run specific application
./gradlew :apps:product-service:bootRun
./gradlew :apps:cart-service:bootRun

# Run all tests
./gradlew testAll

# Run module tests
./gradlew :libs:platform:platform-logging:test
./gradlew :apps:product-service:test

# Build bootable JARs
./gradlew :apps:product-service:bootJar
./gradlew :apps:cart-service:bootJar
```

## Docker Commands

```bash
# Build JARs first
./gradlew :apps:product-service:bootJar :apps:cart-service:bootJar

# Start full observability stack
cd docker && docker compose up -d

# Run load test (product-service)
docker compose --profile test-product up k6-product

# Run chaos/resilience tests (product-service)
docker compose --profile chaos-product up k6-product-resilience
docker compose --profile chaos-product run k6-product-circuit-breaker

# Stop everything
docker compose --profile test-product --profile chaos-product down -v

# View logs
docker compose logs -f product-service
docker compose logs -f cart-service
```

## Module Overview

### Platform Libraries (libs/platform/)

| Module | Purpose |
|--------|---------|
| `platform-bom` | Centralized dependency versions (extends Spring Boot BOM) |
| `platform-logging` | StructuredLogger, WebClientLoggingFilter, log data models |
| `platform-resilience` | ReactiveResilience wrapper for circuit breaker, retry, timeout, bulkhead |
| `platform-cache` | ReactiveCacheService interface, RedisCacheService, CacheKeyGenerator |
| `platform-error` | GlobalErrorHandler, ErrorResponse, ValidationException |
| `platform-webflux` | RequestMetadata, ContextKeys for Reactor Context |
| `platform-security` | Placeholder for OAuth2/JWT (implementation per 006_AUTHN_AUTHZ.md) |
| `platform-test` | WireMockSupport, RedisTestSupport, ReactorTestSupport |

### Applications (apps/)

| Application | Port | Description |
|-------------|------|-------------|
| `product-service` | 8080 | Product aggregation from merchandise, price, inventory |
| `cart-service` | 8081 | Shopping cart management |
| `customer-service` | 8083 | Customer management |
| `discount-service` | 8084 | Discount pricing engine with promo codes, markdowns, and loyalty |
| `fulfillment-service` | 8085 | Fulfillment and shipping |
| `audit-service` | 8086 | Audit event processing |
| `checkout-service` | 8087 | Order checkout and payment processing |
| `ecommerce-web` | 3001 | E-commerce frontend (React + Vite) |

### Frontend Libraries (libs/shared-ui/, libs/shared-data/, libs/shared-design/)

| Library | Purpose |
|---------|---------|
| `shared-design/tokens` | Design tokens (CSS variables for colors, spacing, typography) |
| `shared-ui/ui-components` | shadcn/ui components with Tailwind CSS and CVA |
| `shared-data/api-client` | Generated TypeScript API client from OpenAPI |

### Workspace Plugin (tools/)

| Generator | Command | Purpose |
|-----------|---------|---------|
| `ui-component` | `pnpm nx g @reactive-platform/workspace-plugin:ui-component Name` | Scaffold component + test + story |

## Frontend Development

### Development Modes

**1. Hybrid Mode (Recommended for frontend development)**
Backend services run in Docker, frontend runs locally with HMR:
```bash
pnpm dev              # Starts backend containers + frontend dev server
# or separately:
pnpm dev:backend      # Start only backend services in Docker
pnpm dev:frontend     # Start frontend dev server with hot reload
```
Frontend: http://localhost:4200 (Vite dev server with proxy to backend)

**2. Full Docker Mode (Production-like)**
All services including frontend run in Docker:
```bash
cd docker && docker compose up -d ecommerce-web
```
Frontend: http://localhost:3001 (nginx serving built assets)

**3. Stop Services**
```bash
pnpm stop             # Stop all Docker services
```

### Frontend Commands

```bash
# Serve with hot reload
pnpm nx serve ecommerce-web

# Build for production
pnpm nx build ecommerce-web

# Run tests
pnpm nx test ecommerce-web

# Build shared-ui library
pnpm nx build ui-components

# Run component tests
pnpm nx test ui-components

# Launch Ladle (component stories)
pnpm nx ladle ui-components

# Generate new UI component
pnpm nx g @reactive-platform/workspace-plugin:ui-component ComponentName

# Generate API client (requires product-service running)
pnpm generate:api
```

### TypeScript Path Aliases

```typescript
import { Button } from '@reactive-platform/shared-ui/ui-components';
import { ApiClient } from '@reactive-platform/api-client';
```

## Package Naming

| Type | Package Pattern |
|------|-----------------|
| Platform libraries | `org.example.platform.{module}` |
| Product service | `org.example.product.{subpackage}` |
| Cart service | `org.example.cart.{subpackage}` |
| Checkout service | `org.example.checkout.{subpackage}` |

## Request Headers

All services expect these headers for context propagation:
- `x-store-number` - Integer 1-2000
- `x-order-number` - UUID
- `x-userid` - 6 alphanumeric chars
- `x-sessionid` - UUID

## Adding a New Service

1. Create module directory: `apps/new-service/`
2. Create `build.gradle.kts` using `platform.application-conventions` plugin
3. Add to `settings.gradle.kts`: `include("apps:new-service")`
4. Depend on platform libraries: `project(":libs:platform:platform-*")`
5. Create application class with proper `scanBasePackages`
6. Add to Docker Compose

## Adding a New Platform Library

1. Create module directory: `libs/platform/platform-new/`
2. Create `build.gradle.kts` using `platform.library-conventions` plugin
3. Add to `settings.gradle.kts`: `include("libs:platform:platform-new")`
4. Reference BOM: `api(platform(project(":libs:platform:platform-bom")))`

## Canonical Service Ports

| Service | Port | Description |
|---------|------|-------------|
| product-service | 8080 | Product aggregation service |
| cart-service | 8081 | Shopping cart service |
| wiremock | 8082 | Mock external services |
| customer-service | 8083 | Customer management |
| discount-service | 8084 | Discount pricing engine |
| fulfillment-service | 8085 | Fulfillment and shipping |
| audit-service | 8086 | Audit event processing |
| checkout-service | 8087 | Order checkout and payment |
| redis | 6379 | Cache backend |
| postgres | 5432 | Database |
| grafana | 3000 | Dashboards (admin/admin) |
| prometheus | 9090 | Metrics |
| loki | 3100 | Logs |
| tempo | 3200 | Traces |

Run `node tools/check-service-ports.js` to verify port configuration.

## When Implementing New Features

1. **Create an implementation plan** in the root (e.g., `010_FEATURE_NAME.md`)
2. **Determine scope**: platform library vs. application-specific
3. **Update platform libraries** if the feature is cross-cutting
4. **Update application(s)** to use platform features
5. **Archive the plan** when complete (see below)

## Implementation Plan Management

**IMPORTANT: Never delete implementation plans.** Plans serve as historical documentation of design decisions.

### Plan Lifecycle

1. **Active plans** live in the repository root (e.g., `010_FEATURE_NAME.md`)
2. **Completed plans** are moved to `docs/archive/`
3. **Never delete plans** - always archive them for future reference

### Archiving a Completed Plan

```bash
# Move completed plan to archive
mv 010_FEATURE_NAME.md docs/archive/
```

### Archive Location

All completed implementation plans are stored in `docs/archive/`:
- `000_INIT_IMPLEMENTATION_PLAN.md`
- `001_GRAFANA_STACK_IMPLEMENTATION_PLAN.md`
- `006_AUTHN_AUTHZ.md`
- `008_CART_SERVICE.md`
- `009_AUDIT_DATA.md`
- etc.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->