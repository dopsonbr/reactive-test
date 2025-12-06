# Backend Standards

Standards for building reactive Spring Boot applications with WebFlux, Resilience4j, and Redis.

| Standard | Description |
|----------|-------------|
| [architecture.md](./architecture.md) | Layered architecture, package structure, dependency rules |
| [models.md](./models.md) | Pure data objects, no business logic |
| [resiliency-circuit-breakers.md](./resiliency-circuit-breakers.md) | Circuit breaker patterns |
| [resiliency-retries.md](./resiliency-retries.md) | Retry patterns with backoff |
| [resiliency-bulk-heads.md](./resiliency-bulk-heads.md) | Concurrency limiting |
| [resiliency-timeouts.md](./resiliency-timeouts.md) | Timeout patterns |
| [caching.md](./caching.md) | Cache-aside, fallback-only, TTL guidelines |
| [observability-logs.md](./observability-logs.md) | Structured JSON logging |
| [observability-metrics.md](./observability-metrics.md) | Prometheus metrics |
| [observability-traces.md](./observability-traces.md) | Distributed tracing |
| [security.md](./security.md) | Authentication, authorization, header validation |
| [error-handling.md](./error-handling.md) | Global error handling, fallback responses |
| [validation.md](./validation.md) | Request validation patterns |
| [testing-unit.md](./testing-unit.md) | Unit test patterns |
| [testing-integration.md](./testing-integration.md) | Integration test patterns with Testcontainers |
| [testing-e2e.md](./testing-e2e.md) | End-to-end test patterns with k6 |
