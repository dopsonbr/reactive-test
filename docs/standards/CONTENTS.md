# Standards Contents

## Core Files

- `README.md` - Standards overview and philosophy
- `CONTENTS.md` - This file

## Shared Standards

- `code-style.md` - Formatting, naming conventions
- `documentation.md` - README, AGENTS, CONTENTS file patterns

## Backend Standards (backend/)

### Architecture
- `backend/architecture.md` - Layered architecture, package structure, dependency rules
- `backend/models.md` - Pure data objects with no business logic

### Resilience
- `backend/resiliency-circuit-breakers.md` - Circuit breaker patterns and configuration
- `backend/resiliency-retries.md` - Retry patterns with exponential backoff
- `backend/resiliency-bulk-heads.md` - Concurrency limiting patterns
- `backend/resiliency-timeouts.md` - Timeout patterns and configuration

### Caching
- `backend/caching.md` - Cache-aside, fallback-only patterns, TTL guidelines

### Observability
- `backend/observability-logs.md` - Structured JSON logging with Reactor Context
- `backend/observability-metrics.md` - Prometheus metrics patterns
- `backend/observability-traces.md` - OpenTelemetry distributed tracing

### Security
- `backend/security.md` - OAuth2/JWT, header validation, authorization

### Error Handling
- `backend/error-handling.md` - Global error handling, fallback responses

### Validation
- `backend/validation.md` - Request validation patterns

### Testing
- `backend/testing-unit.md` - Unit test patterns and naming
- `backend/testing-integration.md` - Testcontainers, WireMock patterns
- `backend/testing-e2e.md` - k6 end-to-end test patterns

## Frontend Standards (frontend/)

- `frontend/architecture.md` - Component layers, feature folders
- `frontend/error-handling.md` - Error boundaries, ApiError, Query errors
- `frontend/observability.md` - Structured logging, Web Vitals, tracing
- `frontend/testing.md` - Testing Trophy, Ladle, Vitest, Playwright
- `frontend/components.md` - Compound, headless, smart/presentational
- `frontend/state-management.md` - TanStack Query, URL state
- `frontend/code-organization.md` - Feature folders, barrel exports
- `frontend/guiding-principles.md` - Core frontend development principles
