# Standards Contents

## Files

### Core
- `README.md` - Standards overview and philosophy
- `CONTENTS.md` - This file

### Architecture
- `architecture.md` - Layered architecture, package structure, dependency rules
- `models.md` - Pure data objects with no business logic

### Resilience
- `resiliency-circuit-breakers.md` - Circuit breaker patterns and configuration
- `resiliency-retries.md` - Retry patterns with exponential backoff
- `resiliency-bulk-heads.md` - Concurrency limiting patterns
- `resiliency-timeouts.md` - Timeout patterns and configuration

### Caching
- `caching.md` - Cache-aside, fallback-only patterns, TTL guidelines

### Observability
- `observability-logs.md` - Structured JSON logging with Reactor Context
- `observability-metrics.md` - Prometheus metrics patterns
- `observability-traces.md` - OpenTelemetry distributed tracing

### Security
- `security.md` - OAuth2/JWT, header validation, authorization

### Error Handling
- `error-handling.md` - Global error handling, fallback responses

### Testing
- `testing-unit.md` - Unit test patterns and naming
- `testing-integration.md` - Testcontainers, WireMock patterns
- `testing-e2e.md` - k6 end-to-end test patterns

### Code Quality
- `code-style.md` - Spotless, Google Java Format, naming conventions
- `documentation.md` - README, AGENTS, CONTENTS file patterns
- `validation.md` - Request validation patterns
