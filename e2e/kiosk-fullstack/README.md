# Kiosk Full-Stack E2E Tests

Integration E2E tests that run against **real backend services** in Docker.

## Purpose

These tests validate critical self-service kiosk journeys:

- Session start and management
- Product scanning via barcode input
- Cart management and checkout flow
- Payment processing (real services)

## When These Run

- **Main branch merges**: After PR is merged
- **Nightly builds**: Full regression suite
- **Manual execution**: For integration validation

## Prerequisites

- Docker and Docker Compose installed
- Backend services running via `./powerstart` or Docker Compose

## Running Locally

```bash
# 1. Start backend services
./powerstart
# OR
docker compose up -d

# 2. Run full-stack E2E tests
pnpm nx e2e kiosk-fullstack-e2e

# Keep services running for debugging
E2E_KEEP_RUNNING=true pnpm nx e2e kiosk-fullstack-e2e
```

## Directory Structure

```
kiosk-fullstack/
├── fixtures/              # Test data and utilities
│   ├── test-base.ts       # Test helpers (scanProduct, startSession)
│   ├── seed-data.ts       # Seeds database
│   └── index.ts           # Exports
├── specs/                 # Test specifications
│   ├── checkout-journey.spec.ts
│   └── session-journey.spec.ts
├── playwright.config.ts   # Playwright configuration
├── global-setup.ts        # Service health checks
├── global-teardown.ts     # Cleanup
├── project.json           # Nx project configuration
└── README.md              # This file
```

## Comparison with Mocked E2E

| Aspect | Full-Stack (this directory) | Mocked (`apps/kiosk-web-e2e`) |
|--------|-----------------------------|-----------------------------|
| Backend | Real services (Docker) | Mocked (MSW) |
| Speed | Slower (~10 min) | Fast (~2 min) |
| CI trigger | Main + nightly | Every PR |
| Use case | End-to-end integration | Frontend logic, UI flows |
