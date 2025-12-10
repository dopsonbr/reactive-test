# 050: Merchant Portal and Product Data Services

## Overview

Build real backend services for merchandise, pricing, and inventory data that replace the current WireMock stubs in product-service, plus a merchant portal for managing this data with role-based access.

## Goals

1. **Real data layer** - Replace WireMock stubs with persistent PostgreSQL-backed services
2. **Role-based management** - Different specialists own different data domains
3. **Minimal changes to product-service** - Configuration-only updates to point at real services
4. **Best local dev experience** - Seed data and test users ready on `docker compose up`

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Merchant Portal (React)                      │
│         Role-based UI: Merchandise | Pricing | Inventory         │
│                    Dev: 4201 | Docker: 3010                      │
└─────────────────┬───────────────────┬───────────────────┬───────┘
                  │                   │                   │
                  ▼                   ▼                   ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
        │ merchandise-svc │ │   price-svc     │ │  inventory-svc  │
        │     :8091       │ │     :8092       │ │      :8093      │
        └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
                 │                   │                   │
                 ▼                   ▼                   ▼
        ┌─────────────────────────────────────────────────────────┐
        │              PostgreSQL (shared instance)                │
        │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
        │  │ merchandise  │ │    price     │ │  inventory   │     │
        │  │   schema     │ │   schema     │ │    schema    │     │
        │  └──────────────┘ └──────────────┘ └──────────────┘     │
        └─────────────────────────────────────────────────────────┘
```

**Product-service integration:**
```
merchandise-service ─┐
price-service ───────┼→ product-service → ecommerce-web
inventory-service ───┘
```

## Data Models

### Merchandise Service (port 8091, schema: `merchandise`)

```sql
CREATE SCHEMA IF NOT EXISTS merchandise;

CREATE TABLE merchandise.products (
    sku BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(512),
    category VARCHAR(100),
    suggested_retail_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/merchandise/{sku}` | Get product | None (service-to-service) |
| GET | `/merchandise?page=0&size=20` | List products | MERCHANT, ADMIN |
| POST | `/merchandise` | Create product | MERCHANT, ADMIN |
| PUT | `/merchandise/{sku}` | Update product | MERCHANT, ADMIN |
| DELETE | `/merchandise/{sku}` | Delete product | MERCHANT, ADMIN |

**Response contract (matches existing product-service expectation):**
```json
{
  "name": "string",
  "description": "string",
  "imageUrl": "string",
  "category": "string"
}
```

### Price Service (port 8092, schema: `price`)

```sql
CREATE SCHEMA IF NOT EXISTS price;

CREATE TABLE price.prices (
    sku BIGINT PRIMARY KEY,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/price/{sku}` | Get price | None (service-to-service) |
| GET | `/price?page=0&size=20` | List prices | PRICING_SPECIALIST, ADMIN |
| PUT | `/price/{sku}` | Set/update price | PRICING_SPECIALIST, ADMIN |

**Response contract (matches existing product-service expectation):**
```json
{
  "price": 29.99,
  "originalPrice": 39.99,
  "currency": "USD"
}
```

### Inventory Service (port 8093, schema: `inventory`)

```sql
CREATE SCHEMA IF NOT EXISTS inventory;

CREATE TABLE inventory.stock (
    sku BIGINT PRIMARY KEY,
    available_quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/inventory/{sku}` | Get stock level | None (service-to-service) |
| GET | `/inventory?page=0&size=20` | List inventory | INVENTORY_SPECIALIST, ADMIN |
| PUT | `/inventory/{sku}` | Update quantity | INVENTORY_SPECIALIST, ADMIN |

**Response contract (matches existing product-service expectation):**
```json
{
  "availableQuantity": 100
}
```

## User Service Role Extensions

### New Roles

```sql
-- Extend existing role system
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MERCHANT';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PRICING_SPECIALIST';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'INVENTORY_SPECIALIST';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';
```

### JWT Claims Structure

```json
{
  "sub": "user-123",
  "email": "merchant@example.com",
  "roles": ["MERCHANT", "PRICING_SPECIALIST"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

### New Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/users/{id}/roles` | Assign role | ADMIN |
| DELETE | `/users/{id}/roles/{role}` | Remove role | ADMIN |
| GET | `/users/{id}/roles` | List roles | Self or ADMIN |

### Seed Test Users

| Username | Email | Password | Roles |
|----------|-------|----------|-------|
| merchant1 | merchant1@test.com | test123 | MERCHANT |
| pricer1 | pricer1@test.com | test123 | PRICING_SPECIALIST |
| inventory1 | inventory1@test.com | test123 | INVENTORY_SPECIALIST |
| manager1 | manager1@test.com | test123 | MERCHANT, PRICING_SPECIALIST |
| admin1 | admin1@test.com | test123 | ADMIN |

Seed data loaded via Docker init script for immediate local dev experience.

## Merchant Portal Frontend

### Tech Stack

- React 18 + TypeScript
- Vite (dev server)
- TanStack Query (data fetching)
- React Router (routing)
- `@reactive-platform/shared-ui` (components)
- `@reactive-platform/shared-design` (tokens)

### Ports

- Dev server: 4201
- Docker/nginx: 3010

### App Structure

```
apps/merchant-portal/
├── src/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── products/        # Merchandise CRUD (MERCHANT role)
│   │   │   ├── pricing/         # Price management (PRICING_SPECIALIST)
│   │   │   └── inventory/       # Stock levels (INVENTORY_SPECIALIST)
│   │   ├── layouts/
│   │   │   └── DashboardLayout.tsx
│   │   └── providers.tsx
│   ├── features/
│   │   ├── products/
│   │   ├── pricing/
│   │   └── inventory/
│   └── shared/
│       └── hooks/
├── e2e/
└── index.html
```

### Role-Based Navigation

| Role | Access |
|------|--------|
| MERCHANT | Products (full CRUD) |
| PRICING_SPECIALIST | Products (read-only), Pricing (edit) |
| INVENTORY_SPECIALIST | Products (read-only), Inventory (edit) |
| ADMIN | All sections |

## Product-Service Integration

### Configuration Changes Only

```yaml
# application.yml (local dev)
services:
  merchandise:
    base-url: http://localhost:8091
  price:
    base-url: http://localhost:8092
  inventory:
    base-url: http://localhost:8093

# application-docker.yml
services:
  merchandise:
    base-url: http://merchandise-service:8091
  price:
    base-url: http://price-service:8092
  inventory:
    base-url: http://inventory-service:8093
```

No code changes required - existing repositories already make HTTP calls to configured URLs.

### Docker Compose Dependencies

```yaml
merchandise-service:
  depends_on:
    postgres:
      condition: service_healthy

price-service:
  depends_on:
    postgres:
      condition: service_healthy

inventory-service:
  depends_on:
    postgres:
      condition: service_healthy

product-service:
  depends_on:
    merchandise-service:
      condition: service_healthy
    price-service:
      condition: service_healthy
    inventory-service:
      condition: service_healthy
```

## Port Summary

| Service | Host Port | Container Port |
|---------|-----------|----------------|
| merchandise-service | 8091 | 8091 |
| price-service | 8092 | 8092 |
| inventory-service | 8093 | 8093 |
| merchant-portal (dev) | 4201 | - |
| merchant-portal (docker) | 3010 | 3000 |

## Files to Create

### Backend Services

```
apps/merchandise-service/
├── build.gradle.kts
├── src/main/java/org/example/merchandise/
│   ├── MerchandiseServiceApplication.java
│   ├── config/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── domain/
│   └── dto/
├── src/main/resources/
│   ├── application.yml
│   ├── application-docker.yml
│   └── db/migration/
└── src/test/

apps/price-service/
├── build.gradle.kts
├── src/main/java/org/example/price/
│   ├── PriceServiceApplication.java
│   ├── config/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   └── dto/
├── src/main/resources/
│   ├── application.yml
│   ├── application-docker.yml
│   └── db/migration/
└── src/test/

apps/inventory-service/
├── build.gradle.kts
├── src/main/java/org/example/inventory/
│   ├── InventoryServiceApplication.java
│   ├── config/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   └── dto/
├── src/main/resources/
│   ├── application.yml
│   ├── application-docker.yml
│   └── db/migration/
└── src/test/
```

### Frontend

```
apps/merchant-portal/
├── project.json
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── app/
│   ├── features/
│   └── shared/
└── e2e/
```

### Docker

```
docker/
├── Dockerfile.merchandise-service
├── Dockerfile.price-service
├── Dockerfile.inventory-service
├── Dockerfile.merchant-portal
├── nginx-merchant-portal.conf
└── postgres/
    └── init-product-data-schemas.sql
```

### Configuration Updates

```
settings.gradle.kts                    # Add new modules
docker/docker-compose.yml              # Add new services
apps/product-service/src/main/resources/application.yml  # Update URLs
```

## Testing Strategy

### Unit/Integration Tests
- Continue using WireMock for product-service tests (fast, isolated)
- Each new service has its own unit and integration tests

### E2E Tests
- Merchant portal: Playwright tests with MSW mocks (fast track)
- Full-stack: Real services in Docker (comprehensive track)

## Implementation Order

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement each sub-plan task-by-task.

| Phase | Sub-Plan | Description |
|-------|----------|-------------|
| 1 | [050A_DATABASE_SCHEMAS.md](050A_DATABASE_SCHEMAS.md) | PostgreSQL schemas, init scripts, seed data |
| 2 | [050B_MERCHANDISE_SERVICE.md](050B_MERCHANDISE_SERVICE.md) | Merchandise-service backend |
| 3 | [050C_PRICE_SERVICE.md](050C_PRICE_SERVICE.md) | Price-service backend |
| 4 | [050D_INVENTORY_SERVICE.md](050D_INVENTORY_SERVICE.md) | Inventory-service backend |
| 5 | [050E_DOCKER_INTEGRATION.md](050E_DOCKER_INTEGRATION.md) | Dockerfiles, compose, product-service config |
| 6 | [050F_MERCHANT_PORTAL.md](050F_MERCHANT_PORTAL.md) | React frontend with role-based UI |

**Execution order matters:** Complete each phase before starting the next. Each sub-plan has bite-sized tasks (~2-5 minutes each) with exact file paths, complete code, and verification steps.

## Success Criteria

- [ ] `docker compose up` starts all services with seed data
- [ ] Product-service fetches real data from merchandise/price/inventory services
- [ ] Merchant portal allows CRUD operations based on user role
- [ ] Test users can log in and see role-appropriate views
- [ ] Existing ecommerce-web continues to work unchanged
