# Platform Standards

Standards for building reactive Spring Boot applications on this platform.

## Philosophy

These standards are designed for **both humans and AI agents**. They convey:
- **Intent** - Why we do things this way
- **Outcomes** - What success looks like
- **Patterns** - Pseudo-code and data structures (not implementation code)

Implementation details live in the modules themselves (README.md files alongside code).

## How to Use

1. **Before implementing a feature**, read the relevant standard
2. **Follow the patterns** described in each standard
3. **Reference implementation** lives in `apps/product-service/`

## Standard Categories

### Architecture
- [architecture](./architecture.md) - Layered architecture, package structure, dependency rules
- [models](./models.md) - Pure data objects, no business logic

### Resilience
- [resiliency-circuit-breakers](./resiliency-circuit-breakers.md) - Circuit breaker patterns
- [resiliency-retries](./resiliency-retries.md) - Retry patterns with backoff
- [resiliency-bulk-heads](./resiliency-bulk-heads.md) - Concurrency limiting
- [resiliency-timeouts](./resiliency-timeouts.md) - Timeout patterns

### Caching
- [caching](./caching.md) - Cache-aside, fallback-only, TTL guidelines

### Observability
- [observability-logs](./observability-logs.md) - Structured JSON logging
- [observability-metrics](./observability-metrics.md) - Prometheus metrics
- [observability-traces](./observability-traces.md) - Distributed tracing

### Security
- [security](./security.md) - Authentication, authorization, header validation

### Error Handling
- [error-handling](./error-handling.md) - Global error handling, fallback responses

### Testing
- [testing-unit](./testing-unit.md) - Unit test patterns
- [testing-integration](./testing-integration.md) - Integration test patterns with Testcontainers
- [testing-e2e](./testing-e2e.md) - End-to-end test patterns with k6

### Code Quality
- [code-style](./code-style.md) - Formatting, naming conventions
- [documentation](./documentation.md) - README, AGENTS, CONTENTS patterns
- [validation](./validation.md) - Request validation patterns

## Creating a New Standard

1. Create `docs/standards/{standard-name}.md`
2. Follow this structure:
   - **Intent** - Why this standard exists
   - **Outcomes** - What following it achieves
   - **Patterns** - Pseudo-code, data structures, diagrams
   - **Anti-patterns** - What to avoid
   - **Reference** - Where to see it in action

3. Add to CONTENTS.md
4. Link from this README
