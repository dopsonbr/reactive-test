# Platform Libraries Agent Guidelines

These libraries provide shared cross-cutting concerns. Changes here affect all applications.

## Key Principles

1. **Non-breaking changes**: Platform libraries are used by multiple applications
2. **Reactive-first**: All I/O must be non-blocking
3. **Context propagation**: Use Reactor Context, never MDC
4. **Minimal dependencies**: Only add what's truly needed
5. **Well-tested**: High test coverage, integration tests for I/O

## Library Responsibilities

| Library | Responsibility | Key Classes |
|---------|---------------|-------------|
| platform-bom | Version management | None (just Gradle config) |
| platform-logging | Structured JSON logging | `StructuredLogger`, `LogData` records |
| platform-resilience | Circuit breaker, retry, timeout | `ReactiveResilience` |
| platform-cache | Redis cache abstraction | `ReactiveCacheService`, `RedisCacheService` |
| platform-error | Error handling | `GlobalErrorHandler`, `ErrorResponse` |
| platform-webflux | Context utilities | `ContextKeys`, `RequestMetadata` |
| platform-security | OAuth2/JWT validation | `JwtValidatorConfig` |
| platform-test | Test utilities | `WireMockSupport`, `RedisTestSupport` |

## Common Tasks

### Add a New Dependency

1. Add version to `gradle/libs.versions.toml`
2. Add constraint to `platform-bom/build.gradle.kts`
3. Add to relevant library's dependencies

### Modify Structured Logger

Location: `platform-logging/src/main/java/org/example/platform/logging/`

Key classes:
- `StructuredLogger` - Main logging interface
- `RequestLogData`, `ResponseLogData` - Log data records
- `WebClientLoggingFilter` - WebClient request/response logging

### Modify Resilience Patterns

Location: `platform-resilience/src/main/java/org/example/platform/resilience/`

Key class: `ReactiveResilience`
- Uses Resilience4j decorators in order: timeout → circuit breaker → retry → bulkhead

### Modify Cache Behavior

Location: `platform-cache/src/main/java/org/example/platform/cache/`

Key classes:
- `ReactiveCacheService` - Interface
- `RedisCacheService` - Redis implementation
- `CacheKeyGenerator` - Key generation utilities

### Add Test Utilities

Location: `platform-test/src/main/java/org/example/platform/test/`

Key classes:
- `WireMockSupport` - WireMock helpers
- `RedisTestSupport` - Redis Testcontainer helpers
- `ReactorTestSupport` - StepVerifier helpers
- `architecture/ArchitectureRules` - ArchUnit shared rules

## Package Structure

All libraries follow:
```
org.example.platform.{module}/
└── *.java
```

## Anti-patterns

- Adding application-specific logic to platform libraries
- Using MDC (not reactive-safe)
- Blocking operations in reactive chains
- Breaking API changes without version bump
- Missing Javadoc on public APIs

## Testing

Each library should have:
- Unit tests for logic
- Integration tests for I/O operations
- Tests should not depend on external services

```bash
# Test a specific library
./gradlew :libs:backend:platform:platform-logging:test
./gradlew :libs:backend:platform:platform-cache:test
```

## File Locations

| Purpose | Location |
|---------|----------|
| Build config | `{library}/build.gradle.kts` |
| Source code | `{library}/src/main/java/org/example/platform/{name}/` |
| Tests | `{library}/src/test/java/...` |
| Version catalog | `gradle/libs.versions.toml` |
| BOM constraints | `platform-bom/build.gradle.kts` |
