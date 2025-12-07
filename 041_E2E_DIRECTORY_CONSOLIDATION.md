# 041_E2E_DIRECTORY_CONSOLIDATION

**Status: COMPLETED**

---

## Overview

Consolidated redundant `e2e-test/` directory into `e2e/`, creating a single unified location for all end-to-end and performance testing assets. Added comprehensive documentation to clarify when to use each test type.

## Goals

1. Eliminate redundant directory naming (`e2e` vs `e2e-test`)
2. Create clear documentation for test type selection
3. Update all references across the codebase
4. Establish consistent structure for future test additions

## Architecture

### Before

```
reactive-platform/
├── e2e/
│   └── ecommerce-fullstack/     # Playwright full-stack tests
├── e2e-test/                    # Redundant name!
│   ├── k6/                      # Performance tests
│   ├── wiremock/                # API mocks
│   ├── data/                    # Test data
│   └── src/                     # Utilities
└── apps/ecommerce-web/e2e/      # Mocked E2E tests
```

### After

```
reactive-platform/
├── e2e/                         # All E2E/perf tests
│   ├── README.md                # Decision matrix
│   ├── AGENTS.md                # AI agent guidance
│   ├── ecommerce-fullstack/     # Playwright full-stack
│   ├── k6/                      # Performance tests
│   ├── wiremock/                # API mocks
│   ├── data/                    # Test data
│   └── src/                     # Utilities
└── apps/ecommerce-web/e2e/      # Mocked E2E (unchanged)
```

---

## Completed Work

### Phase 1: Directory Merge

**Files:**
- MOVED: `e2e-test/k6/` → `e2e/k6/`
- MOVED: `e2e-test/wiremock/` → `e2e/wiremock/`
- MOVED: `e2e-test/data/` → `e2e/data/`
- MOVED: `e2e-test/src/` → `e2e/src/`
- MOVED: `e2e-test/config.json` → `e2e/config.json`
- MOVED: `e2e-test/package.json` → `e2e/package.json`
- MOVED: `e2e-test/TEST_PLAN.md` → `e2e/TEST_PLAN.md`
- DELETED: `e2e-test/` (empty directory)

### Phase 2: Reference Updates

**Files:**
- MODIFY: `docker/docker-compose.yml` - Updated 11 volume paths
- MODIFY: `docker/docker-compose.e2e.yml` - Updated WireMock mapping path
- MODIFY: `ci/_ensure-docker-stack.sh` - Updated test data path
- MODIFY: `docs/standards/backend/testing-e2e.md` - Updated k6 paths
- MODIFY: `e2e/TEST_PLAN.md` - Updated internal references
- MODIFY: `AGENTS.md` - Updated project structure diagram
- MODIFY: `CONTENTS.md` - Replaced with test type table
- MODIFY: `036_USER_SERVICE.md` - Updated WireMock path
- MODIFY: `039A_POS_BACKEND_ENHANCEMENTS.md` - Updated WireMock paths

### Phase 3: Documentation

**Files:**
- CREATE: `e2e/README.md` - Comprehensive guide with:
  - Test type comparison table
  - Decision matrix (which test to use when)
  - Quick reference commands
  - Directory structure overview
- CREATE: `e2e/AGENTS.md` - AI agent guidance with:
  - Test selection guidance
  - Naming conventions
  - Warnings about shared resources
  - Common commands
- CREATE: `e2e/ecommerce-fullstack/README.md` - Full-stack test documentation
- CREATE: `apps/ecommerce-web/e2e/README.md` - Mocked E2E documentation

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `e2e/README.md` | Test type decision matrix |
| CREATE | `e2e/AGENTS.md` | AI agent guidance |
| CREATE | `e2e/ecommerce-fullstack/README.md` | Full-stack test docs |
| CREATE | `apps/ecommerce-web/e2e/README.md` | Mocked E2E docs |
| MODIFY | `docker/docker-compose.yml` | Update volume paths |
| MODIFY | `docker/docker-compose.e2e.yml` | Update volume paths |
| MODIFY | `ci/_ensure-docker-stack.sh` | Update script paths |
| MODIFY | `docs/standards/backend/testing-e2e.md` | Update command examples |
| MODIFY | `AGENTS.md` | Update project structure |
| MODIFY | `CONTENTS.md` | Add test type table |
| DELETE | `e2e-test/` | Remove redundant directory |

---

## Test Type Reference

| Type | Location | Speed | Backend | CI Trigger |
|------|----------|-------|---------|------------|
| Mocked E2E | `apps/ecommerce-web/e2e/` | ~2 min | No (MSW) | Every PR |
| Full-Stack E2E | `e2e/ecommerce-fullstack/` | ~10 min | Docker | Main + nightly |
| Performance | `e2e/k6/` | Variable | Docker | On-demand |

---

## Next Steps (Completed)

### Completed Follow-ups

1. ~~**Rename `ecommerce-fullstack` for consistency**~~ - **Skipped**
   - Current name is descriptive and changing would require many file updates
   - Name clearly indicates ecommerce full-stack tests

2. **Add k6 to Nx project graph** - **Done**
   - Created `e2e/k6/project.json` with targets for all tests
   - Commands: `pnpm nx load-test k6-perf`, `pnpm nx resilience-test k6-perf`, etc.
   - Docker configurations available via `--configuration=docker`

3. **Consolidate WireMock mappings documentation** - **Done**
   - Created `e2e/wiremock/README.md`
   - Documents mapping structure, chaos scenarios, and conventions

4. **CI pipeline updates** - **Verified**
   - All CI scripts use correct `e2e/` paths
   - No remaining `e2e-test` references in `.github/` or `ci/`

### Remaining (Low Priority)

5. **Archive old references in docs/archive/**
   - Some archived plans still reference `e2e-test/`
   - Low priority - historical accuracy vs confusion

---

## Phase 4: Docker E2E Configuration Fixes

The following issues were discovered and fixed when running full-stack E2E tests:

### Fixes Applied

1. **cart-service port mismatch**
   - Issue: `application.yml` sets `server.port: 8082` but docker-compose.e2e.yml expected 8080
   - Fix: Updated `docker-compose.e2e.yml` to use `8081:8082` mapping and correct healthcheck
   - Fix: Updated `nginx-frontend-e2e.conf` to proxy to `cart-service:8082`

2. **cart-service Redis connection**
   - Issue: Missing `REDIS_HOST` and `REDIS_PORT` environment variables
   - Fix: Added `REDIS_HOST=redis` and `REDIS_PORT=6379` to cart-service env

3. **product-service service URLs**
   - Issue: SPRING_APPLICATION_JSON didn't override hardcoded URLs
   - Fix: Changed `SPRING_PROFILES_ACTIVE=docker` which includes correct WireMock URLs

4. **nginx health endpoint**
   - Issue: Health check caught by SPA fallback
   - Fix: Added `= /health` exact match in nginx config

5. **nginx E2E headers**
   - Issue: Backend services require x-store-number, x-order-number, etc.
   - Fix: Added default E2E headers in `nginx-frontend-e2e.conf`

### Files Modified

| File | Changes |
|------|---------|
| `docker/docker-compose.e2e.yml` | cart-service ports, redis deps, product-service profile |
| `docker/nginx-frontend-e2e.conf` | cart-service port, exact health match, E2E headers |

### Discovered Issues (Resolved)

**API Response Format Mismatch:** ✅ FIXED
- Backend was returning: `{items, totalItems, currentPage, ...}`
- Frontend expected: `{products, total, page, ...}`
- **Fix**: Updated `SearchResponse.java` to use `products`, `total`, `page` field names
- Updated tests and documentation

---

## Checklist

- [x] Phase 1: Directory merge complete
- [x] Phase 2: All references updated
- [x] Phase 3: Documentation created
- [x] Docker Compose paths verified
- [x] CI script paths updated
- [x] k6 Nx project added
- [x] WireMock README created
- [x] CI verification complete
- [x] Phase 4: Docker E2E configuration fixes
- [x] Phase 4: Documentation updated with known issues
- [x] Phase 5: API response format mismatch fixed
