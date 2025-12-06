# Backend Libraries

Java/Gradle libraries for the reactive platform backend services.

## Structure

- `platform/` - Cross-cutting platform infrastructure (logging, resilience, caching, etc.)
- `shared-model/` - Shared DTOs used across multiple backend services

## Usage

```kotlin
dependencies {
    implementation(project(":libs:backend:platform:platform-logging"))
    implementation(project(":libs:backend:shared-model:shared-model-product"))
}
```

## Platform Libraries

| Module | Purpose |
|--------|---------|
| `platform-bom` | Centralized dependency versions (extends Spring Boot BOM) |
| `platform-logging` | StructuredLogger, WebClientLoggingFilter, log data models |
| `platform-resilience` | ReactiveResilience wrapper for circuit breaker, retry, timeout, bulkhead |
| `platform-cache` | ReactiveCacheService interface, RedisCacheService, CacheKeyGenerator |
| `platform-error` | GlobalErrorHandler, ErrorResponse, ValidationException |
| `platform-webflux` | RequestMetadata, ContextKeys for Reactor Context |
| `platform-security` | OAuth2/JWT security integration |
| `platform-test` | WireMockSupport, RedisTestSupport, ReactorTestSupport |
| `platform-audit` | Audit event publishing and processing |

## Shared Model Libraries

| Module | Purpose |
|--------|---------|
| `shared-model-product` | Product DTOs |
| `shared-model-customer` | Customer DTOs |
| `shared-model-discount` | Discount DTOs |
| `shared-model-fulfillment` | Fulfillment DTOs |
