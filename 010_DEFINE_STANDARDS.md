# 010 - Define Platform and Application Standards

## Overview

This implementation plan establishes comprehensive standards for reactive platform development based on patterns extracted from the product-service reference implementation. The goal is to create consistent, documented standards for:

1. **Resilience patterns** - Circuit breaker, retry, timeout, bulkhead
2. **Security patterns** - Request validation, authentication, authorization
3. **Caching patterns** - Cache-aside, fallback-only
4. **Logging patterns** - Structured JSON, context propagation
5. **Testing patterns** - Integration tests, Testcontainers, WireMock
6. **Documentation standards** - README.md, AGENTS.md, CONTENTS.md for all modules
7. **Architecture enforcement** - ArchUnit rules for dependency constraints and best practices
8. **Code formatting** - Spotless with Google Java Format for consistent code style
9. **CI pipeline scripts** - Format checking, architecture verification, and quality gates

---

## Current State

### Documentation Gaps
- No centralized standards documentation
- No README files in `apps/` or `libs/platform/` directories
- Individual modules lack AGENTS.md and CONTENTS.md files
- Patterns exist in code but are not formally documented

### Code Quality Gaps
- No ArchUnit tests for architecture enforcement
- No code formatting rules enforced
- No dependency constraint validation
- CI scripts exist but lack format/architecture checks

### Reference Implementation
The `product-service` application serves as the reference implementation with:
- Full resilience pattern usage (circuit breaker, retry, timeout, bulkhead)
- Cache-aside and fallback-only caching strategies
- Header validation and context propagation
- Structured JSON logging with trace correlation
- Integration tests using Testcontainers

---

## Target State

### Documentation Structure

```
reactive-platform/
├── README.md                          # Project overview (exists)
├── CLAUDE.md                          # AI agent instructions (exists)
├── apps/
│   ├── README.md                      # Application standards
│   ├── AGENTS.md                      # Application development guidance
│   ├── product-service/
│   │   ├── README.md                  # Service overview
│   │   ├── AGENTS.md                  # AI guidance for this service
│   │   └── CONTENTS.md                # File/package index
│   └── cart-service/
│       ├── README.md
│       ├── AGENTS.md
│       └── CONTENTS.md
└── libs/platform/
    ├── README.md                      # Platform library standards
    ├── AGENTS.md                      # Platform development guidance
    ├── platform-bom/
    │   ├── README.md
    │   ├── AGENTS.md
    │   └── CONTENTS.md
    ├── platform-logging/
    │   ├── README.md
    │   ├── AGENTS.md
    │   └── CONTENTS.md
    ├── platform-resilience/
    │   ├── README.md
    │   ├── AGENTS.md
    │   └── CONTENTS.md
    ├── platform-cache/
    │   ├── README.md
    │   ├── AGENTS.md
    │   └── CONTENTS.md
    ├── platform-error/
    │   ├── README.md
    │   ├── AGENTS.md
    │   └── CONTENTS.md
    ├── platform-webflux/
    │   ├── README.md
    │   ├── AGENTS.md
    │   └── CONTENTS.md
    ├── platform-security/
    │   ├── README.md
    │   ├── AGENTS.md
    │   └── CONTENTS.md
    └── platform-test/
        ├── README.md
        ├── AGENTS.md
        └── CONTENTS.md
```

---

## Implementation Plan

### Phase 1: Application Standards Documentation

#### 1.1 Create apps/README.md

**File:** `apps/README.md`

**Content:**

```markdown
# Application Standards

This directory contains Spring Boot WebFlux applications that follow the reactive platform standards.

## Required Platform Libraries

All applications MUST use these platform libraries:

| Library | Purpose | Required |
|---------|---------|----------|
| platform-bom | Dependency version management | Yes |
| platform-logging | Structured JSON logging | Yes |
| platform-resilience | Circuit breaker, retry, timeout, bulkhead | Yes |
| platform-cache | Redis caching abstraction | Yes (if caching) |
| platform-error | Global error handling | Yes |
| platform-webflux | Context propagation | Yes |
| platform-security | OAuth2/JWT security | Yes (if secured) |
| platform-test | Test utilities | Yes (test scope) |

## Application Structure

```
app-name/
├── build.gradle.kts
├── README.md
├── AGENTS.md
├── CONTENTS.md
└── src/
    ├── main/
    │   ├── java/org/example/{app}/
    │   │   ├── {App}Application.java
    │   │   ├── controller/
    │   │   ├── service/
    │   │   ├── repository/
    │   │   ├── domain/
    │   │   ├── config/
    │   │   └── validation/
    │   └── resources/
    │       ├── application.yml
    │       └── logback-spring.xml
    └── test/
        └── java/org/example/{app}/
```

## Resilience Standards

### Required Configuration

All external HTTP calls MUST be wrapped with resilience patterns:

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        register-health-indicator: true
        sliding-window-type: COUNT_BASED
        sliding-window-size: 10
        minimum-number-of-calls: 5
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
        permitted-number-of-calls-in-half-open-state: 3
        automatic-transition-from-open-to-half-open-enabled: true
    instances:
      {service-name}:
        base-config: default

  retry:
    configs:
      default:
        max-attempts: 3
        wait-duration: 100ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
        retry-exceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
          - org.springframework.web.reactive.function.client.WebClientResponseException$ServiceUnavailable
          - org.springframework.web.reactive.function.client.WebClientResponseException$GatewayTimeout
        ignore-exceptions:
          - org.springframework.web.reactive.function.client.WebClientResponseException$BadRequest
          - org.springframework.web.reactive.function.client.WebClientResponseException$NotFound
    instances:
      {service-name}:
        base-config: default

  timelimiter:
    configs:
      default:
        timeout-duration: 2s
        cancel-running-future: true
    instances:
      {service-name}:
        base-config: default

  bulkhead:
    configs:
      default:
        max-concurrent-calls: 25
        max-wait-duration: 0s
    instances:
      {service-name}:
        base-config: default
```

### Decorator Order

Resilience4j decorators apply in this order (innermost to outermost):
1. **Timeout** - Fails fast if no response
2. **Circuit Breaker** - Prevents cascading failures
3. **Retry** - Recovers from transient errors
4. **Bulkhead** - Limits resource consumption

### Repository Pattern

```java
@Repository
public class ExternalServiceRepository {
    private static final String RESILIENCE_NAME = "external-service";
    private static final String LOGGER_NAME = "externalservicerepository";

    private final WebClient webClient;
    private final ReactiveResilience resilience;
    private final StructuredLogger structuredLogger;

    public Mono<Response> fetchData(long id) {
        Mono<Response> call = webClient.get()
            .uri("/resource/{id}", id)
            .retrieve()
            .bodyToMono(Response.class);

        return resilience.decorate(RESILIENCE_NAME, call)
            .onErrorResume(this::handleError);
    }

    private Mono<Response> handleError(Throwable t) {
        return Mono.deferContextual(ctx -> {
            String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
            structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);
            return Mono.just(FALLBACK_RESPONSE);
        });
    }
}
```

## Caching Standards

### Cache-Aside Pattern (Default)

Use for data that changes infrequently:

```java
public Mono<Response> getData(long id) {
    String cacheKey = CacheKeyGenerator.customKey("service", String.valueOf(id));

    return cacheService.get(cacheKey, Response.class)
        .switchIfEmpty(Mono.defer(() -> fetchAndCache(id, cacheKey)));
}

private Mono<Response> fetchAndCache(long id, String cacheKey) {
    return resilience.decorate(RESILIENCE_NAME, httpCall)
        .flatMap(response -> cacheService.put(cacheKey, response, ttl)
            .thenReturn(response));
}
```

### Fallback-Only Pattern

Use for data that must be fresh (e.g., inventory):

```java
public Mono<Response> getData(long id) {
    String cacheKey = CacheKeyGenerator.customKey("inventory", String.valueOf(id));

    return resilience.decorate(RESILIENCE_NAME, httpCall)
        .flatMap(response -> cacheAndReturn(cacheKey, response))
        .onErrorResume(t -> handleErrorWithCacheFallback(t, cacheKey));
}
```

### TTL Guidelines

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Static reference data | 15-30 min | Rarely changes |
| Pricing data | 2-5 min | May change frequently |
| Inventory/availability | 30 sec | Must be fresh |
| User session data | 30 min | Based on session timeout |

## Request Validation Standards

### Required Headers

All API endpoints MUST validate these headers:

| Header | Format | Example |
|--------|--------|---------|
| x-store-number | Integer 1-2000 | 1234 |
| x-order-number | UUID | 550e8400-e29b-41d4-a716-446655440000 |
| x-userid | 6 alphanumeric chars | abc123 |
| x-sessionid | UUID | 7c9e6679-7425-40de-944b-e07fc1f90ae7 |

### Validation Pattern

```java
@Component
public class RequestValidator {

    private static final Pattern UUID_PATTERN = Pattern.compile(
        "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    );
    private static final Pattern USER_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9]{6}$");

    public Mono<Void> validateRequest(int storeNumber, String orderNumber,
                                       String userId, String sessionId) {
        List<ValidationError> errors = new ArrayList<>();

        if (storeNumber < 1 || storeNumber > 2000) {
            errors.add(new ValidationError("x-store-number", "Must be between 1 and 2000"));
        }

        if (orderNumber == null || !UUID_PATTERN.matcher(orderNumber).matches()) {
            errors.add(new ValidationError("x-order-number", "Must be a valid UUID"));
        }

        if (userId == null || !USER_ID_PATTERN.matcher(userId).matches()) {
            errors.add(new ValidationError("x-userid", "Must be 6 alphanumeric characters"));
        }

        if (sessionId == null || !UUID_PATTERN.matcher(sessionId).matches()) {
            errors.add(new ValidationError("x-sessionid", "Must be a valid UUID"));
        }

        return errors.isEmpty()
            ? Mono.empty()
            : Mono.error(new ValidationException(errors));
    }
}
```

## Context Propagation Standards

### Reactor Context (NOT MDC)

Request metadata MUST flow via Reactor Context, not ThreadLocal MDC:

```java
// Controller - Store context
@GetMapping("/{id}")
public Mono<Response> get(@PathVariable long id,
                          @RequestHeader("x-store-number") int storeNumber,
                          @RequestHeader("x-order-number") String orderNumber,
                          @RequestHeader("x-userid") String userId,
                          @RequestHeader("x-sessionid") String sessionId) {

    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

    return service.getData(id)
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
}

// Service - Access context
public Mono<Response> getData(long id) {
    return Mono.deferContextual(ctx -> {
        RequestMetadata metadata = ctx.getOrDefault(ContextKeys.METADATA, null);
        structuredLogger.logMessage(ctx, LOGGER_NAME, "Processing request");
        // ... operations
    });
}
```

## Logging Standards

### Structured JSON Format

All logs MUST use StructuredLogger for JSON output:

```java
// Message logging
structuredLogger.logMessage(ctx, LOGGER_NAME, "Processing request for id: " + id);

// Request/Response logging
structuredLogger.logRequest(ctx, LOGGER_NAME, requestLogData);
structuredLogger.logResponse(ctx, LOGGER_NAME, responseLogData);

// Error logging with circuit breaker state
structuredLogger.logError(ctx, LOGGER_NAME, serviceName, throwable, cbState);
```

### Logger Names

Logger names MUST follow the pattern: `{component}` in lowercase without dots:
- `productscontroller`
- `productservice`
- `merchandiserepository`

### WebClient Logging

All WebClient beans MUST include the logging filter:

```java
@Bean
public WebClient externalServiceWebClient(
    @Value("${services.external.base-url}") String baseUrl,
    WebClientLoggingFilter loggingFilter
) {
    return WebClient.builder()
        .baseUrl(baseUrl)
        .filter(loggingFilter.create("externalservicerepository"))
        .build();
}
```

## Testing Standards

### Integration Tests

All applications MUST have:
1. Context load test (`contextLoads()`)
2. Redis integration using Testcontainers
3. WireMock for external service mocking

```java
@SpringBootTest
@Testcontainers
class ApplicationTest {

    @Container
    static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> RedisTestSupport.getRedisPort(redis));
    }

    @Test
    void contextLoads() {
        // Smoke test
    }
}
```

### Test Naming Conventions

- Class: `{ClassName}Test`
- Methods: `methodName_condition_expectedResult()` or descriptive name

## Error Handling Standards

### Global Error Handler

Applications automatically get error handling via `platform-error`:

| Exception | HTTP Status | Response |
|-----------|-------------|----------|
| ValidationException | 400 | Field-level errors |
| CallNotPermittedException | 503 | Circuit breaker name |
| TimeoutException | 504 | Timeout message |
| BulkheadFullException | 503 | Concurrent limit message |
| WebClientResponseException | Mirrors upstream | Original error |
| Exception | 500 | Generic error |

### Fallback Responses

Repositories MUST define fallback responses:

```java
private static final Response FALLBACK = new Response("Unavailable");
```

## Build Configuration

### build.gradle.kts

```kotlin
plugins {
    id("platform.application-conventions")
}

dependencies {
    implementation(platform(project(":libs:platform:platform-bom")))

    implementation(project(":libs:platform:platform-logging"))
    implementation(project(":libs:platform:platform-resilience"))
    implementation(project(":libs:platform:platform-cache"))
    implementation(project(":libs:platform:platform-error"))
    implementation(project(":libs:platform:platform-webflux"))
    implementation(project(":libs:platform:platform-security"))

    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")

    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    testImplementation(project(":libs:platform:platform-test"))
}
```

### Application Class

```java
@SpringBootApplication(scanBasePackages = {
    "org.example.{app}",
    "org.example.platform.logging",
    "org.example.platform.resilience",
    "org.example.platform.error"
})
@EnableConfigurationProperties(CacheProperties.class)
public class {App}Application {
    public static void main(String[] args) {
        SpringApplication.run({App}Application.class, args);
    }
}
```
```

#### 1.2 Create apps/AGENTS.md

**File:** `apps/AGENTS.md`

**Content:**

```markdown
# Application Development Agent Guidelines

This file provides guidance to AI agents working on applications in this repository.

## Creating a New Application

1. Create directory: `apps/{app-name}/`
2. Create `build.gradle.kts` using `platform.application-conventions` plugin
3. Add to `settings.gradle.kts`: `include("apps:{app-name}")`
4. Create application class with proper `scanBasePackages`
5. Add to Docker Compose

## Package Structure

```
org.example.{app}/
├── {App}Application.java       # Entry point
├── controller/                 # HTTP endpoints
├── service/                    # Business logic
├── repository/                 # External service clients
│   └── {service}/             # One package per external service
├── domain/                     # Domain models (records)
├── config/                     # Configuration classes
└── validation/                 # Request validators
```

## Code Generation Patterns

### Controller Template

```java
@RestController
@RequestMapping("/{resource}")
public class {Resource}Controller {
    private static final String LOGGER_NAME = "{resource}controller";

    private final {Resource}Service service;
    private final StructuredLogger structuredLogger;
    private final {Resource}RequestValidator requestValidator;

    @GetMapping("/{id}")
    public Mono<{Resource}> get(
        @PathVariable long id,
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        ServerHttpRequest request
    ) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return requestValidator.validate(id, storeNumber, orderNumber, userId, sessionId)
            .then(Mono.deferContextual(ctx -> {
                structuredLogger.logRequest(ctx, LOGGER_NAME, createRequestLogData(request));
                return service.get(id)
                    .doOnSuccess(r -> structuredLogger.logResponse(ctx, LOGGER_NAME, createResponseLogData(request, r)));
            }))
            .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }
}
```

### Repository Template

```java
@Repository
public class {External}Repository {
    private static final String RESILIENCE_NAME = "{external}";
    private static final String LOGGER_NAME = "{external}repository";
    private static final {Response} FALLBACK = new {Response}(...);

    private final WebClient webClient;
    private final ReactiveResilience resilience;
    private final StructuredLogger structuredLogger;
    private final ReactiveCacheService cacheService;

    public Mono<{Response}> get(long id) {
        String cacheKey = CacheKeyGenerator.customKey("{external}", String.valueOf(id));

        return cacheService.get(cacheKey, {Response}.class)
            .switchIfEmpty(Mono.defer(() -> fetchAndCache(id, cacheKey)));
    }

    private Mono<{Response}> fetchAndCache(long id, String cacheKey) {
        Mono<{Response}> call = webClient.get()
            .uri("/resource/{id}", id)
            .retrieve()
            .bodyToMono({Response}.class);

        return resilience.decorate(RESILIENCE_NAME, call)
            .flatMap(response -> cacheService.put(cacheKey, response, TTL).thenReturn(response))
            .onErrorResume(this::handleError);
    }

    private Mono<{Response}> handleError(Throwable t) {
        return Mono.deferContextual(ctx -> {
            String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
            structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);
            return Mono.just(FALLBACK);
        });
    }
}
```

## Testing Requirements

Every application MUST have:
- [ ] Context load test
- [ ] Controller integration tests
- [ ] Repository unit tests with WireMock
- [ ] Service tests with mocked repositories

## Common Issues

### Circuit Breaker State Not Transitioning
Check that `minimum-number-of-calls` is met before state changes.

### Context Not Propagating
Ensure `deferContextual()` wraps operations that need context access.

### Cache Misses
Verify Redis connection and TTL configuration.

## Reference Implementation

See `product-service` for the canonical example of all patterns.
```

---

### Phase 2: Platform Library Standards Documentation

#### 2.1 Create libs/platform/README.md

**File:** `libs/platform/README.md`

**Content:**

```markdown
# Platform Libraries

Shared cross-cutting libraries for reactive Spring Boot applications.

## Library Overview

| Library | Purpose | Status |
|---------|---------|--------|
| platform-bom | Dependency version management | Stable |
| platform-logging | Structured JSON logging | Stable |
| platform-resilience | Resilience4j reactive wrappers | Stable |
| platform-cache | Non-blocking Redis caching | Stable |
| platform-error | Global error handling | Stable |
| platform-webflux | Context propagation utilities | Stable |
| platform-security | OAuth2/JWT security | Planned |
| platform-test | Shared test utilities | Stable |

## Dependency Graph

```
                    ┌─────────────────┐
                    │  platform-bom   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌────────────────┐   ┌───────────────┐
│platform-webflux│   │ platform-error │   │ platform-test │
└───────┬───────┘   └────────────────┘   └───────────────┘
        │
        ▼
┌───────────────┐
│platform-logging│
└───────┬───────┘
        │
   ┌────┴────┐
   ▼         ▼
┌───────┐ ┌───────┐
│resil. │ │cache  │
└───────┘ └───────┘
```

## Usage in Applications

```kotlin
dependencies {
    implementation(platform(project(":libs:platform:platform-bom")))

    implementation(project(":libs:platform:platform-logging"))
    implementation(project(":libs:platform:platform-resilience"))
    implementation(project(":libs:platform:platform-cache"))
    implementation(project(":libs:platform:platform-error"))
    implementation(project(":libs:platform:platform-webflux"))

    testImplementation(project(":libs:platform:platform-test"))
}
```

## Design Principles

1. **Reactive-First**: All APIs return `Mono`/`Flux`, no blocking calls
2. **Fail-Safe**: All operations handle errors gracefully
3. **Observable**: Built-in logging and metrics support
4. **Composable**: Libraries can be used independently
5. **Non-Invasive**: Spring auto-configuration where possible

## Adding a New Library

1. Create directory: `libs/platform/platform-{name}/`
2. Create `build.gradle.kts`:

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))
    // Add dependencies
}
```

3. Add to `settings.gradle.kts`: `include("libs:platform:platform-{name}")`
4. Create package: `org.example.platform.{name}`
5. Create README.md, AGENTS.md, CONTENTS.md
```

#### 2.2 Create libs/platform/AGENTS.md

**File:** `libs/platform/AGENTS.md`

**Content:**

```markdown
# Platform Library Development Agent Guidelines

This file provides guidance to AI agents working on platform libraries.

## Library Design Standards

### Public API Design

1. Use interfaces for extensibility
2. Provide default implementations
3. Use records for immutable data
4. Document all public methods

### Package Structure

```
org.example.platform.{library}/
├── {Interface}.java           # Public API
├── {Implementation}.java      # Default implementation
├── {Config}AutoConfiguration.java  # Spring auto-config (if applicable)
└── package-info.java          # Package documentation
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Interface | `{Capability}` | `ReactiveCacheService` |
| Implementation | `{Tech}{Capability}` | `RedisCacheService` |
| Auto-config | `{Name}AutoConfiguration` | `RedisCacheAutoConfiguration` |
| Support class | `{Name}Support` | `RedisTestSupport` |

## Common Patterns

### Auto-Configuration

```java
@AutoConfiguration
@ConditionalOnClass(ReactiveRedisTemplate.class)
public class RedisCacheAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public ReactiveCacheService reactiveCacheService(
            ReactiveRedisTemplate<String, String> template,
            ObjectMapper objectMapper) {
        return new RedisCacheService(template, objectMapper);
    }
}
```

### Reactive Operator

```java
public <T> Mono<T> decorate(String name, Mono<T> mono) {
    return mono
        .transformDeferred(TimeLimiterOperator.of(getTimeLimiter(name)))
        .transformDeferred(CircuitBreakerOperator.of(getCircuitBreaker(name)))
        .transformDeferred(RetryOperator.of(getRetry(name)))
        .transformDeferred(BulkheadOperator.of(getBulkhead(name)));
}
```

### Error Handling

```java
@ExceptionHandler(ValidationException.class)
public ResponseEntity<ErrorResponse> handleValidationError(
        ValidationException ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();

    ErrorResponse response = ErrorResponse.of(
        "Bad Request",
        "Validation failed",
        path,
        HttpStatus.BAD_REQUEST.value(),
        traceId,
        ex.toDetailsMap()
    );

    return ResponseEntity.badRequest().body(response);
}
```

## Testing Libraries

### Unit Tests

Test all public API methods with various inputs.

### Integration Tests

Use Testcontainers for external dependencies (Redis, etc.).

## Documentation Requirements

Each library MUST have:
- README.md with usage examples
- AGENTS.md with development guidance
- CONTENTS.md with file index
- Javadoc on public APIs
```

---

### Phase 3: Individual Module Documentation

#### 3.1 Product Service Documentation

**File:** `apps/product-service/README.md`

```markdown
# Product Service

Product aggregation service that combines merchandise, price, and inventory data.

## Overview

This service aggregates data from three upstream services:
- **Merchandise Service**: Product descriptions
- **Price Service**: Current pricing
- **Inventory Service**: Stock availability

## API

### GET /products/{sku}

Retrieves aggregated product information.

**Required Headers:**
| Header | Format | Description |
|--------|--------|-------------|
| x-store-number | Integer 1-2000 | Store location |
| x-order-number | UUID | Order reference |
| x-userid | 6 alphanumeric | User identifier |
| x-sessionid | UUID | Session reference |

**Response:**
```json
{
  "sku": 123456,
  "description": "Product description",
  "price": "29.99",
  "availableQuantity": 42
}
```

## Configuration

### application.yml

```yaml
services:
  merchandise:
    base-url: http://localhost:8082
  price:
    base-url: http://localhost:8082
  inventory:
    base-url: http://localhost:8082

cache:
  merchandise:
    ttl: 15m
  price:
    ttl: 2m
  inventory:
    ttl: 30s
```

## Resilience Configuration

- Circuit breaker: 50% failure threshold, 10s open state
- Retry: 3 attempts with exponential backoff
- Timeout: 2s per call
- Bulkhead: 25 concurrent calls

## Caching Strategy

| Data | Pattern | TTL |
|------|---------|-----|
| Merchandise | Cache-aside | 15 min |
| Price | Cache-aside | 2 min |
| Inventory | Fallback-only | 30 sec |

## Running Locally

```bash
./gradlew :apps:product-service:bootRun
```

## Testing

```bash
./gradlew :apps:product-service:test
```
```

**File:** `apps/product-service/AGENTS.md`

```markdown
# Product Service Agent Guidelines

## Key Files

| File | Purpose |
|------|---------|
| ProductController.java | HTTP endpoint, header extraction, validation |
| ProductService.java | Aggregation logic using Mono.zip() |
| MerchandiseRepository.java | Cache-aside pattern example |
| InventoryRepository.java | Fallback-only pattern example |
| ProductRequestValidator.java | Request validation rules |

## Adding a New Data Source

1. Create repository package: `repository/{source}/`
2. Add response record: `{Source}Response.java`
3. Add repository: `{Source}Repository.java`
4. Add resilience config to `application.yml`
5. Add WebClient bean to `ProductServiceConfig.java`
6. Update `ProductService.java` to include in aggregation

## Testing New Features

1. Add WireMock stubs for new external service
2. Add repository unit tests
3. Update integration tests in `ProductServiceApplicationTest`

## Common Modifications

### Adjusting Timeouts
Edit `application.yml` under `resilience4j.timelimiter.instances.{name}.timeout-duration`

### Changing Cache TTL
Edit `application.yml` under `cache.{service}.ttl`

### Adding Validation Rules
Modify `ProductRequestValidator.java`
```

**File:** `apps/product-service/CONTENTS.md`

```markdown
# Product Service Contents

## Main Source (src/main/java/org/example/product/)

### Root
- `ProductServiceApplication.java` - Spring Boot entry point with scan configuration

### controller/
- `ProductController.java` - REST endpoint for /products/{sku}

### service/
- `ProductService.java` - Aggregation logic using parallel Mono.zip()

### repository/
#### merchandise/
- `MerchandiseRepository.java` - Cache-aside pattern implementation
- `MerchandiseResponse.java` - Response record

#### price/
- `PriceRepository.java` - Cache-aside pattern implementation
- `PriceRequest.java` - Request record
- `PriceResponse.java` - Response record

#### inventory/
- `InventoryRepository.java` - Fallback-only pattern implementation
- `InventoryRequest.java` - Request record
- `InventoryResponse.java` - Response record

### domain/
- `Product.java` - Aggregated product record

### config/
- `ProductServiceConfig.java` - WebClient beans with logging filters
- `CacheProperties.java` - Cache TTL configuration properties

### validation/
- `ProductRequestValidator.java` - Header and parameter validation

## Resources (src/main/resources/)
- `application.yml` - Main configuration
- `logback-spring.xml` - Logging configuration

## Test Source (src/test/java/org/example/product/)
- `ProductServiceApplicationTest.java` - Integration test with Redis Testcontainer
```

---

### Phase 4: Platform Library Module Documentation

Create README.md, AGENTS.md, CONTENTS.md for each platform library:

#### platform-bom

**File:** `libs/platform/platform-bom/README.md`

```markdown
# Platform BOM

Bill of Materials for centralized dependency version management.

## Usage

```kotlin
dependencies {
    implementation(platform(project(":libs:platform:platform-bom")))

    // Dependencies without versions - BOM manages them
    implementation("io.github.resilience4j:resilience4j-spring-boot3")
    implementation("org.testcontainers:testcontainers")
}
```

## Managed Dependencies

| Group | Artifact | Source |
|-------|----------|--------|
| org.springframework.boot | * | Spring Boot BOM |
| io.github.resilience4j | * | Resilience4j |
| org.testcontainers | * | Testcontainers BOM |
| net.logstash.logback | * | Platform |
| io.opentelemetry | * | Platform |
| org.wiremock | * | Platform |
```

**File:** `libs/platform/platform-bom/AGENTS.md`

```markdown
# Platform BOM Agent Guidelines

## Purpose

The BOM centralizes all dependency versions to ensure consistency across modules.

## Updating Versions

Edit `build.gradle.kts` to update version constraints.

## Adding New Dependencies

1. Add to `dependencies { constraints { } }` block
2. Use `api()` for transitive exposure
3. Document in README.md

## Never Do

- Add implementation dependencies (BOM is version-only)
- Downgrade versions without testing all modules
```

**File:** `libs/platform/platform-bom/CONTENTS.md`

```markdown
# Platform BOM Contents

## Files
- `build.gradle.kts` - Dependency version constraints
```

#### platform-logging

**File:** `libs/platform/platform-logging/README.md`

```markdown
# Platform Logging

Structured JSON logging with Reactor Context integration.

## Features

- Structured JSON log output
- Request/response logging
- Error logging with circuit breaker state
- OpenTelemetry trace correlation
- WebClient logging filter

## Usage

### Message Logging

```java
structuredLogger.logMessage(ctx, "myservice", "Processing request");
```

### Request/Response Logging

```java
RequestLogData requestData = new RequestLogData(
    "/api/resource", request.getURI().getPath(),
    request.getMethod().name(), null
);
structuredLogger.logRequest(ctx, "mycontroller", requestData);
```

### Error Logging

```java
structuredLogger.logError(ctx, "myrepository", "upstream-service",
    exception, circuitBreakerState);
```

### WebClient Filter

```java
@Bean
public WebClient myWebClient(WebClientLoggingFilter loggingFilter) {
    return WebClient.builder()
        .baseUrl(baseUrl)
        .filter(loggingFilter.create("myrepository"))
        .build();
}
```

## Log Structure

```json
{
  "level": "info",
  "logger": "myservice",
  "traceId": "abc123",
  "spanId": "def456",
  "metadata": {
    "storeNumber": 1234,
    "orderNumber": "uuid",
    "userId": "abc123",
    "sessionId": "uuid"
  },
  "data": {
    "message": "Processing request"
  }
}
```
```

**File:** `libs/platform/platform-logging/AGENTS.md`

```markdown
# Platform Logging Agent Guidelines

## Key Components

| Component | Purpose |
|-----------|---------|
| StructuredLogger | Main logging facade |
| WebClientLoggingFilter | HTTP client logging |
| LogEntry | Root log structure |
| *LogData records | Typed log payloads |

## Adding New Log Types

1. Create new record in the package (e.g., `AuditLogData`)
2. Add method to `StructuredLogger`
3. Update README with usage example

## Context Access

Always use `Mono.deferContextual()` to access context for logging:

```java
return Mono.deferContextual(ctx -> {
    structuredLogger.logMessage(ctx, LOGGER_NAME, "message");
    return // ... operation
});
```

## Never Do

- Use MDC directly (not reactive-safe)
- Log without context (loses correlation)
- Create blocking log operations
```

**File:** `libs/platform/platform-logging/CONTENTS.md`

```markdown
# Platform Logging Contents

## Main Source (src/main/java/org/example/platform/logging/)

### Core
- `StructuredLogger.java` - Main logging component
- `WebClientLoggingFilter.java` - ExchangeFilterFunction for WebClient

### Data Structures
- `LogEntry.java` - Root log entry record
- `RequestLogData.java` - HTTP request log payload
- `ResponseLogData.java` - HTTP response log payload
- `ErrorLogData.java` - Error log payload with resilience context
- `MessageLogData.java` - Simple message payload

### Resources
- None (library only)

### Tests
- Unit tests for StructuredLogger
- WebClientLoggingFilter tests
```

#### platform-resilience

**File:** `libs/platform/platform-resilience/README.md`

```markdown
# Platform Resilience

Resilience4j reactive wrappers for circuit breaker, retry, timeout, and bulkhead patterns.

## Features

- Single decorator method for all resilience patterns
- Correct decorator ordering (timeout → circuit breaker → retry → bulkhead)
- Circuit breaker state access for logging
- Reactive-first design

## Usage

### Decorating Mono

```java
@Autowired
private ReactiveResilience resilience;

public Mono<Response> callService() {
    Mono<Response> call = webClient.get()
        .uri("/api/resource")
        .retrieve()
        .bodyToMono(Response.class);

    return resilience.decorate("service-name", call);
}
```

### Checking Circuit Breaker State

```java
CircuitBreaker.State state = resilience.getCircuitBreakerState("service-name");
```

## Configuration

Configure each named instance in `application.yml`:

```yaml
resilience4j:
  circuitbreaker:
    instances:
      service-name:
        base-config: default
  retry:
    instances:
      service-name:
        base-config: default
  timelimiter:
    instances:
      service-name:
        timeout-duration: 2s
  bulkhead:
    instances:
      service-name:
        max-concurrent-calls: 25
```

## Decorator Order

Applied innermost to outermost:
1. **Timeout** (2s default) - Fail fast
2. **Circuit Breaker** (50% threshold) - Prevent cascading failures
3. **Retry** (3 attempts) - Recover from transient errors
4. **Bulkhead** (25 concurrent) - Limit resource consumption
```

**File:** `libs/platform/platform-resilience/AGENTS.md`

```markdown
# Platform Resilience Agent Guidelines

## Key Components

| Component | Purpose |
|-----------|---------|
| ReactiveResilience | Main decorator component |

## Decorator Order

The order in code (innermost to outermost) is:
1. TimeLimiter
2. CircuitBreaker
3. Retry
4. Bulkhead

This means: request → bulkhead → retry → circuit breaker → timeout → actual call

## Adding New Resilience Patterns

1. Inject the appropriate registry
2. Add to the `decorate()` method chain
3. Update documentation

## Configuration Tuning

| Setting | Conservative | Aggressive |
|---------|--------------|------------|
| failure-rate-threshold | 75% | 25% |
| timeout-duration | 5s | 1s |
| max-attempts | 5 | 2 |
| max-concurrent-calls | 50 | 10 |

## Common Issues

### Circuit Breaker Never Opens
- Check `minimum-number-of-calls` is reached
- Verify exceptions are not being swallowed

### Too Many Retries
- Add exceptions to `ignore-exceptions` list
- Reduce `max-attempts`
```

**File:** `libs/platform/platform-resilience/CONTENTS.md`

```markdown
# Platform Resilience Contents

## Main Source (src/main/java/org/example/platform/resilience/)

- `ReactiveResilience.java` - Main decorator component with all resilience patterns

## Dependencies
- Resilience4j Spring Boot 3 starter
- Resilience4j Reactor adapter
- Platform-logging (for error logging)
```

#### platform-cache

**File:** `libs/platform/platform-cache/README.md`

```markdown
# Platform Cache

Non-blocking Redis cache abstraction with graceful failure handling.

## Features

- Reactive cache operations (get, put, delete)
- Automatic JSON serialization
- Silent failure handling (cache failures don't break requests)
- Consistent key generation

## Usage

### Cache Operations

```java
@Autowired
private ReactiveCacheService cacheService;

// Get (returns Mono.empty() on miss or error)
Mono<Response> cached = cacheService.get("key", Response.class);

// Put with TTL
Mono<Boolean> result = cacheService.put("key", value, Duration.ofMinutes(5));

// Delete
Mono<Boolean> deleted = cacheService.delete("key");
```

### Key Generation

```java
String key = CacheKeyGenerator.merchandiseKey(sku);  // "merchandise:sku:123"
String key = CacheKeyGenerator.priceKey(sku);        // "price:sku:123"
String key = CacheKeyGenerator.inventoryKey(sku);    // "inventory:sku:123"
String key = CacheKeyGenerator.customKey("prefix", "id");  // "prefix:id"
```

## Configuration

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      timeout: 1000ms
```

## Caching Patterns

### Cache-Aside

```java
return cacheService.get(key, Response.class)
    .switchIfEmpty(Mono.defer(() -> fetchAndCache(key)));
```

### Fallback-Only

```java
return fetchFromService()
    .flatMap(r -> cacheService.put(key, r, ttl).thenReturn(r))
    .onErrorResume(t -> cacheService.get(key, Response.class));
```
```

**File:** `libs/platform/platform-cache/AGENTS.md`

```markdown
# Platform Cache Agent Guidelines

## Key Components

| Component | Purpose |
|-----------|---------|
| ReactiveCacheService | Interface for cache operations |
| RedisCacheService | Redis implementation |
| CacheKeyGenerator | Consistent key generation |
| RedisCacheAutoConfiguration | Spring auto-configuration |

## Adding New Key Patterns

Add static method to `CacheKeyGenerator`:

```java
public static String newEntityKey(long id) {
    return "newentity:id:" + id;
}
```

## Error Handling

All cache operations fail silently:
- `get()` returns `Mono.empty()` on error
- `put()` returns `Mono.just(false)` on error
- `delete()` returns `Mono.just(false)` on error

Errors are logged but do not propagate.

## Testing

Use `RedisTestSupport.createRedisContainer()` for integration tests.
```

**File:** `libs/platform/platform-cache/CONTENTS.md`

```markdown
# Platform Cache Contents

## Main Source (src/main/java/org/example/platform/cache/)

### API
- `ReactiveCacheService.java` - Cache operations interface
- `CacheKeyGenerator.java` - Static key generation utilities

### Implementation
- `RedisCacheService.java` - Redis implementation with JSON serialization
- `RedisCacheAutoConfiguration.java` - Spring auto-configuration
```

#### platform-error

**File:** `libs/platform/platform-error/README.md`

```markdown
# Platform Error

Global error handling translating exceptions to structured HTTP responses.

## Features

- Automatic exception to HTTP status mapping
- Structured error responses with trace IDs
- Resilience4j exception handling
- Validation error aggregation

## Handled Exceptions

| Exception | HTTP Status | Description |
|-----------|-------------|-------------|
| ValidationException | 400 | Request validation failed |
| CallNotPermittedException | 503 | Circuit breaker open |
| TimeoutException | 504 | Request timeout |
| BulkheadFullException | 503 | Too many concurrent requests |
| WebClientResponseException | Mirrors upstream | Upstream service error |
| Exception | 500 | Generic error |

## Usage

### Throwing Validation Errors

```java
List<ValidationError> errors = new ArrayList<>();
errors.add(new ValidationError("field", "Error message"));
throw new ValidationException(errors);
```

### Error Response Format

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/resource",
  "status": 400,
  "traceId": "abc123def456",
  "details": {
    "field": "Error message"
  }
}
```

## Integration

Add to application scan:

```java
@SpringBootApplication(scanBasePackages = {
    "org.example.myapp",
    "org.example.platform.error"
})
```
```

**File:** `libs/platform/platform-error/AGENTS.md`

```markdown
# Platform Error Agent Guidelines

## Key Components

| Component | Purpose |
|-----------|---------|
| GlobalErrorHandler | @RestControllerAdvice with handlers |
| ErrorResponse | Structured error response record |
| ValidationException | Validation error with field details |

## Adding New Exception Handlers

Add method to `GlobalErrorHandler`:

```java
@ExceptionHandler(NewException.class)
public ResponseEntity<ErrorResponse> handleNewException(
        NewException ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();

    ErrorResponse response = ErrorResponse.of(
        "Error Type",
        "Error message",
        path,
        HttpStatus.XXX.value(),
        traceId
    );

    return ResponseEntity.status(HttpStatus.XXX).body(response);
}
```

## Trace ID Extraction

Uses OpenTelemetry Span.current() to get trace ID.
```

**File:** `libs/platform/platform-error/CONTENTS.md`

```markdown
# Platform Error Contents

## Main Source (src/main/java/org/example/platform/error/)

- `GlobalErrorHandler.java` - @RestControllerAdvice with exception handlers
- `ErrorResponse.java` - Structured error response record
- `ValidationException.java` - RuntimeException with ValidationError list
```

#### platform-webflux

**File:** `libs/platform/platform-webflux/README.md`

```markdown
# Platform WebFlux

Context propagation utilities for reactive streams.

## Features

- RequestMetadata record for header data
- Context key constants
- Reactor Context integration

## Usage

### Storing Context

```java
RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

return service.call()
    .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
```

### Reading Context

```java
return Mono.deferContextual(ctx -> {
    RequestMetadata metadata = ctx.getOrDefault(ContextKeys.METADATA, null);
    // Use metadata
});
```

## RequestMetadata

```java
public record RequestMetadata(
    int storeNumber,
    String orderNumber,
    String userId,
    String sessionId
) {}
```

## Important

NEVER use ThreadLocal/MDC for reactive context. Always use Reactor Context.
```

**File:** `libs/platform/platform-webflux/AGENTS.md`

```markdown
# Platform WebFlux Agent Guidelines

## Key Components

| Component | Purpose |
|-----------|---------|
| RequestMetadata | Immutable request context record |
| ContextKeys | Static context key constants |

## Context Pattern

```
Controller
    └── contextWrite(METADATA, metadata)
            └── Service
                    └── deferContextual(ctx -> ctx.get(METADATA))
                            └── Repository
                                    └── deferContextual(ctx -> ...)
```

## Adding New Context Data

1. Add field to RequestMetadata (or create new record)
2. Add key to ContextKeys
3. Update controller to populate
4. Document in README
```

**File:** `libs/platform/platform-webflux/CONTENTS.md`

```markdown
# Platform WebFlux Contents

## Main Source (src/main/java/org/example/platform/webflux/)

### context/
- `RequestMetadata.java` - Immutable request context record
- `ContextKeys.java` - Static context key constants
```

#### platform-security

**File:** `libs/platform/platform-security/README.md`

```markdown
# Platform Security

OAuth2/JWT security implementation (planned).

## Status

This library is a placeholder. See `006_AUTHN_AUTHZ.md` for implementation plan.

## Planned Features

- OAuth2 resource server configuration
- JWT token validation
- OAuth2 client credentials for outbound calls
- Security headers and CORS configuration
```

**File:** `libs/platform/platform-security/AGENTS.md`

```markdown
# Platform Security Agent Guidelines

## Status

This is a placeholder library. Implementation is planned in `006_AUTHN_AUTHZ.md`.

## When Implementing

Follow the plan in `006_AUTHN_AUTHZ.md` which includes:
- Phase 1: Core configuration
- Phase 2: Resource server setup
- Phase 3: Client credentials flow
- Phase 4: Security headers
```

**File:** `libs/platform/platform-security/CONTENTS.md`

```markdown
# Platform Security Contents

## Current Files
- `package-info.java` - Package documentation placeholder

## Planned Files
See `006_AUTHN_AUTHZ.md` for implementation plan.
```

#### platform-test

**File:** `libs/platform/platform-test/README.md`

```markdown
# Platform Test

Shared test utilities for integration testing.

## Features

- Redis Testcontainers support
- WireMock server helpers
- Reactor test utilities

## Usage

### Redis Testcontainer

```java
@Testcontainers
class MyTest {

    @Container
    static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> RedisTestSupport.getRedisPort(redis));
    }
}
```

### WireMock Server

```java
WireMockServer server = WireMockSupport.createServer(8082);
server.start();

// Configure stubs
server.stubFor(get(urlEqualTo("/api/resource"))
    .willReturn(aResponse()
        .withStatus(200)
        .withBody("{\"data\":\"value\"}")));
```

### Reactor Test Utilities

```java
// Verify value
ReactorTestSupport.verifyMono(mono, expectedValue);

// Verify predicate
ReactorTestSupport.verifyMono(mono, value -> value.getId() > 0);

// Verify empty
ReactorTestSupport.verifyEmpty(mono);

// Verify error
ReactorTestSupport.verifyError(mono, IllegalArgumentException.class);
```
```

**File:** `libs/platform/platform-test/AGENTS.md`

```markdown
# Platform Test Agent Guidelines

## Key Components

| Component | Purpose |
|-----------|---------|
| RedisTestSupport | Redis Testcontainer factory |
| WireMockSupport | WireMock server factory |
| ReactorTestSupport | Reactor test assertions |

## Adding New Test Utilities

1. Create support class with static factory methods
2. Follow naming convention: `{Tech}TestSupport`
3. Add usage examples to README

## Test Patterns

### Integration Test Template

```java
@SpringBootTest
@Testcontainers
class IntegrationTest {

    @Container
    static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port",
            () -> RedisTestSupport.getRedisPort(redis));
    }

    @Test
    void testSomething() {
        // Test implementation
    }
}
```
```

**File:** `libs/platform/platform-test/CONTENTS.md`

```markdown
# Platform Test Contents

## Main Source (src/main/java/org/example/platform/test/)

- `RedisTestSupport.java` - Redis Testcontainer factory methods
- `WireMockSupport.java` - WireMock server factory methods
- `ReactorTestSupport.java` - Reactor test assertion utilities
```

---

### Phase 5: Cart Service Documentation

**File:** `apps/cart-service/README.md`

```markdown
# Cart Service

Shopping cart management service with granular CRUD operations.

## Overview

Manages shopping cart state with Redis persistence.

## API

### POST /carts
Create a new cart.

### GET /carts/{cartId}
Get cart by ID.

### POST /carts/{cartId}/items
Add item to cart.

### PUT /carts/{cartId}/items/{itemId}
Update item quantity.

### DELETE /carts/{cartId}/items/{itemId}
Remove item from cart.

### DELETE /carts/{cartId}
Delete cart.

## Configuration

See `application.yml` for configuration options.

## Running Locally

```bash
./gradlew :apps:cart-service:bootRun
```

## Testing

```bash
./gradlew :apps:cart-service:test
```
```

**File:** `apps/cart-service/AGENTS.md`

```markdown
# Cart Service Agent Guidelines

## Key Patterns

This service follows the same patterns as product-service:
- Reactor Context for request metadata
- Structured logging
- Redis caching
- Global error handling

## Reference Implementation

See `product-service` for canonical pattern examples.
```

**File:** `apps/cart-service/CONTENTS.md`

```markdown
# Cart Service Contents

See implementation plan `008_CART_SERVICE.md` for detailed structure.
```

---

### Phase 6: Code Formatting with Spotless

#### 6.1 Add Spotless Plugin to buildSrc

**File:** `buildSrc/build.gradle.kts`

Add Spotless plugin dependency:

```kotlin
plugins {
    `kotlin-dsl`
}

repositories {
    gradlePluginPortal()
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-gradle-plugin:3.4.1")
    implementation("io.spring.gradle:dependency-management-plugin:1.1.7")
    implementation("com.diffplug.spotless:spotless-plugin-gradle:7.0.0.BETA4")
}
```

#### 6.2 Update Java Conventions with Spotless

**File:** `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts`

```kotlin
// Shared Java conventions for all modules
plugins {
    java
    id("com.diffplug.spotless")
}

group = "org.example.platform"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

spotless {
    java {
        target("src/**/*.java")
        googleJavaFormat("1.19.2")
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
        formatAnnotations()
    }
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
    dependsOn("spotlessCheck")
}

tasks.withType<Test> {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
    }
    environment("TESTCONTAINERS_RYUK_DISABLED", "true")
}
```

#### 6.3 Spotless Commands

```bash
# Check formatting (fails on violations)
./gradlew spotlessCheck

# Auto-format all files
./gradlew spotlessApply
```

---

### Phase 7: ArchUnit Architecture Tests

#### 7.1 Add ArchUnit to Platform Test

**File:** `libs/platform/platform-test/build.gradle.kts`

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))

    api("org.springframework.boot:spring-boot-starter-test")
    api("io.projectreactor:reactor-test")
    api("org.testcontainers:testcontainers")
    api("org.testcontainers:junit-jupiter")
    api("org.wiremock:wiremock-standalone")

    // ArchUnit for architecture testing
    api("com.tngtech.archunit:archunit-junit5:1.3.0")

    implementation(project(":libs:platform:platform-logging"))
    implementation(project(":libs:platform:platform-cache"))
}
```

#### 7.2 Create Shared Architecture Rules

**File:** `libs/platform/platform-test/src/main/java/org/example/platform/test/architecture/ArchitectureRules.java`

```java
package org.example.platform.test.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

/**
 * Shared ArchUnit rules for platform applications.
 * Import these rules in application-specific ArchTest classes.
 */
public final class ArchitectureRules {

    private ArchitectureRules() {}

    // ===========================================
    // LAYER DEPENDENCY RULES
    // ===========================================

    /**
     * Standard layered architecture for applications.
     * - Controllers depend on services
     * - Services depend on repositories and domain
     * - Repositories depend on domain
     * - Domain has no dependencies on other layers
     */
    @ArchTest
    public static final ArchRule layeredArchitecture = layeredArchitecture()
        .consideringOnlyDependenciesInLayers()
        .layer("Controller").definedBy("..controller..")
        .layer("Service").definedBy("..service..")
        .layer("Repository").definedBy("..repository..")
        .layer("Domain").definedBy("..domain..")
        .layer("Config").definedBy("..config..")
        .layer("Validation").definedBy("..validation..")

        .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
        .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller")
        .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service")
        .whereLayer("Domain").mayOnlyBeAccessedByLayers("Controller", "Service", "Repository", "Config")
        .whereLayer("Config").mayNotBeAccessedByAnyLayer()
        .whereLayer("Validation").mayOnlyBeAccessedByLayers("Controller");

    // ===========================================
    // DOMAIN RULES
    // ===========================================

    /**
     * Domain objects should be pure data classes (records).
     * They should not depend on Spring framework classes.
     */
    @ArchTest
    public static final ArchRule domainShouldNotDependOnSpring = noClasses()
        .that().resideInAPackage("..domain..")
        .should().dependOnClassesThat()
        .resideInAnyPackage(
            "org.springframework..",
            "org.springframework.boot..",
            "io.github.resilience4j..",
            "reactor.."
        )
        .because("Domain objects should be pure data classes without framework dependencies");

    /**
     * Domain objects should not depend on service layer.
     */
    @ArchTest
    public static final ArchRule domainShouldNotDependOnService = noClasses()
        .that().resideInAPackage("..domain..")
        .should().dependOnClassesThat()
        .resideInAPackage("..service..")
        .because("Domain objects should not depend on service layer");

    /**
     * Domain objects should not depend on repository layer.
     */
    @ArchTest
    public static final ArchRule domainShouldNotDependOnRepository = noClasses()
        .that().resideInAPackage("..domain..")
        .should().dependOnClassesThat()
        .resideInAPackage("..repository..")
        .because("Domain objects should not depend on repository layer");

    /**
     * Domain objects should not depend on controller layer.
     */
    @ArchTest
    public static final ArchRule domainShouldNotDependOnController = noClasses()
        .that().resideInAPackage("..domain..")
        .should().dependOnClassesThat()
        .resideInAPackage("..controller..")
        .because("Domain objects should not depend on controller layer");

    // ===========================================
    // CONTROLLER RULES
    // ===========================================

    /**
     * Controllers should be annotated with @RestController or @Controller.
     */
    @ArchTest
    public static final ArchRule controllersShouldBeAnnotated = classes()
        .that().resideInAPackage("..controller..")
        .and().haveSimpleNameEndingWith("Controller")
        .should().beAnnotatedWith("org.springframework.web.bind.annotation.RestController")
        .orShould().beAnnotatedWith("org.springframework.stereotype.Controller");

    /**
     * Controllers should not directly access repositories.
     */
    @ArchTest
    public static final ArchRule controllersShouldNotAccessRepositories = noClasses()
        .that().resideInAPackage("..controller..")
        .should().dependOnClassesThat()
        .resideInAPackage("..repository..")
        .because("Controllers should use services, not repositories directly");

    // ===========================================
    // SERVICE RULES
    // ===========================================

    /**
     * Services should be annotated with @Service.
     */
    @ArchTest
    public static final ArchRule servicesShouldBeAnnotated = classes()
        .that().resideInAPackage("..service..")
        .and().haveSimpleNameEndingWith("Service")
        .should().beAnnotatedWith("org.springframework.stereotype.Service");

    // ===========================================
    // REPOSITORY RULES
    // ===========================================

    /**
     * Repositories should be annotated with @Repository.
     */
    @ArchTest
    public static final ArchRule repositoriesShouldBeAnnotated = classes()
        .that().resideInAPackage("..repository..")
        .and().haveSimpleNameEndingWith("Repository")
        .should().beAnnotatedWith("org.springframework.stereotype.Repository");

    /**
     * Repositories should not depend on controllers.
     */
    @ArchTest
    public static final ArchRule repositoriesShouldNotDependOnControllers = noClasses()
        .that().resideInAPackage("..repository..")
        .should().dependOnClassesThat()
        .resideInAPackage("..controller..")
        .because("Repositories should not depend on controllers");

    // ===========================================
    // REACTIVE RULES
    // ===========================================

    /**
     * No class should use Thread.sleep() (blocking call).
     */
    @ArchTest
    public static final ArchRule noThreadSleep = noClasses()
        .should().callMethod(Thread.class, "sleep", long.class)
        .because("Thread.sleep() blocks reactive threads. Use Mono.delay() instead");

    /**
     * No class should call Mono.block() or Flux.blockFirst/blockLast.
     */
    @ArchTest
    public static final ArchRule noBlockingCalls = noClasses()
        .that().resideInAnyPackage("..controller..", "..service..", "..repository..")
        .should().callMethod("reactor.core.publisher.Mono", "block")
        .orShould().callMethod("reactor.core.publisher.Flux", "blockFirst")
        .orShould().callMethod("reactor.core.publisher.Flux", "blockLast")
        .because("Blocking calls are not allowed in reactive code");

    // ===========================================
    // NAMING CONVENTIONS
    // ===========================================

    /**
     * Classes in controller package should end with Controller.
     */
    @ArchTest
    public static final ArchRule controllerNaming = classes()
        .that().resideInAPackage("..controller..")
        .and().areNotInterfaces()
        .and().areNotRecords()
        .should().haveSimpleNameEndingWith("Controller");

    /**
     * Classes in service package should end with Service.
     */
    @ArchTest
    public static final ArchRule serviceNaming = classes()
        .that().resideInAPackage("..service..")
        .and().areNotInterfaces()
        .and().areNotRecords()
        .should().haveSimpleNameEndingWith("Service");

    /**
     * Classes in repository package should end with Repository, Request, or Response.
     */
    @ArchTest
    public static final ArchRule repositoryNaming = classes()
        .that().resideInAPackage("..repository..")
        .and().areNotInterfaces()
        .should().haveSimpleNameEndingWith("Repository")
        .orShould().haveSimpleNameEndingWith("Request")
        .orShould().haveSimpleNameEndingWith("Response");

    // ===========================================
    // CYCLE DETECTION
    // ===========================================

    /**
     * No package cycles allowed.
     */
    @ArchTest
    public static final ArchRule noCycles = slices()
        .matching("org.example.(*)..")
        .should().beFreeOfCycles();
}
```

#### 7.3 Create Platform-Specific Rules

**File:** `libs/platform/platform-test/src/main/java/org/example/platform/test/architecture/PlatformLibraryRules.java`

```java
package org.example.platform.test.architecture;

import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;

/**
 * ArchUnit rules specific to platform libraries.
 */
public final class PlatformLibraryRules {

    private PlatformLibraryRules() {}

    /**
     * Platform libraries should not depend on application code.
     */
    @ArchTest
    public static final ArchRule platformShouldNotDependOnApps = noClasses()
        .that().resideInAPackage("org.example.platform..")
        .should().dependOnClassesThat()
        .resideInAnyPackage(
            "org.example.product..",
            "org.example.cart.."
        )
        .because("Platform libraries should not depend on application code");

    /**
     * Platform cache should not depend on platform resilience.
     */
    @ArchTest
    public static final ArchRule cacheShouldNotDependOnResilience = noClasses()
        .that().resideInAPackage("org.example.platform.cache..")
        .should().dependOnClassesThat()
        .resideInAPackage("org.example.platform.resilience..")
        .because("Platform cache is a lower-level abstraction than resilience");

    /**
     * Platform webflux should have no dependencies on other platform modules.
     */
    @ArchTest
    public static final ArchRule webfluxShouldBeIndependent = noClasses()
        .that().resideInAPackage("org.example.platform.webflux..")
        .should().dependOnClassesThat()
        .resideInAnyPackage(
            "org.example.platform.cache..",
            "org.example.platform.resilience..",
            "org.example.platform.error..",
            "org.example.platform.logging.."
        )
        .because("Platform webflux is a core module with no cross-module dependencies");
}
```

#### 7.4 Create Application ArchTest

**File:** `apps/product-service/src/test/java/org/example/product/ArchitectureTest.java`

```java
package org.example.product;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.example.platform.test.architecture.ArchitectureRules;

/**
 * Architecture tests for product-service.
 * Imports shared rules from platform-test and adds service-specific rules.
 */
@AnalyzeClasses(
    packages = "org.example.product",
    importOptions = ImportOption.DoNotIncludeTests.class
)
class ArchitectureTest {

    // Import all shared rules
    @ArchTest
    static final ArchRule layeredArchitecture = ArchitectureRules.layeredArchitecture;

    @ArchTest
    static final ArchRule domainShouldNotDependOnSpring = ArchitectureRules.domainShouldNotDependOnSpring;

    @ArchTest
    static final ArchRule domainShouldNotDependOnService = ArchitectureRules.domainShouldNotDependOnService;

    @ArchTest
    static final ArchRule domainShouldNotDependOnRepository = ArchitectureRules.domainShouldNotDependOnRepository;

    @ArchTest
    static final ArchRule domainShouldNotDependOnController = ArchitectureRules.domainShouldNotDependOnController;

    @ArchTest
    static final ArchRule controllersShouldBeAnnotated = ArchitectureRules.controllersShouldBeAnnotated;

    @ArchTest
    static final ArchRule controllersShouldNotAccessRepositories = ArchitectureRules.controllersShouldNotAccessRepositories;

    @ArchTest
    static final ArchRule servicesShouldBeAnnotated = ArchitectureRules.servicesShouldBeAnnotated;

    @ArchTest
    static final ArchRule repositoriesShouldBeAnnotated = ArchitectureRules.repositoriesShouldBeAnnotated;

    @ArchTest
    static final ArchRule repositoriesShouldNotDependOnControllers = ArchitectureRules.repositoriesShouldNotDependOnControllers;

    @ArchTest
    static final ArchRule noThreadSleep = ArchitectureRules.noThreadSleep;

    @ArchTest
    static final ArchRule controllerNaming = ArchitectureRules.controllerNaming;

    @ArchTest
    static final ArchRule serviceNaming = ArchitectureRules.serviceNaming;

    @ArchTest
    static final ArchRule repositoryNaming = ArchitectureRules.repositoryNaming;

    @ArchTest
    static final ArchRule noCycles = ArchitectureRules.noCycles;
}
```

---

### Phase 8: CI Pipeline Scripts

#### 8.1 Add Format Check Script

**File:** `ci/format-check.sh`

```bash
#!/bin/bash
set -euo pipefail

# Format check script - verifies code formatting without modifying files

CI_MODE=false
if [[ "${1:-}" == "--ci" ]]; then
    CI_MODE=true
fi

echo "╔════════════════════════════════════════╗"
echo "║      Checking Code Formatting          ║"
echo "╚════════════════════════════════════════╝"

if [[ "$CI_MODE" == "true" ]]; then
    ./gradlew spotlessCheck --no-daemon --console=plain
else
    ./gradlew spotlessCheck
fi

echo ""
echo "✓ All files are properly formatted"
```

#### 8.2 Add Format Apply Script

**File:** `ci/format-apply.sh`

```bash
#!/bin/bash
set -euo pipefail

# Format apply script - auto-formats all source files

echo "╔════════════════════════════════════════╗"
echo "║      Applying Code Formatting          ║"
echo "╚════════════════════════════════════════╝"

./gradlew spotlessApply

echo ""
echo "✓ All files have been formatted"
```

#### 8.3 Add Architecture Check Script

**File:** `ci/arch-check.sh`

```bash
#!/bin/bash
set -euo pipefail

# Architecture check script - runs ArchUnit tests

CI_MODE=false
if [[ "${1:-}" == "--ci" ]]; then
    CI_MODE=true
fi

echo "╔════════════════════════════════════════╗"
echo "║    Checking Architecture Rules         ║"
echo "╚════════════════════════════════════════╝"

# Run only ArchUnit tests (matching *ArchitectureTest pattern)
if [[ "$CI_MODE" == "true" ]]; then
    ./gradlew test --tests '*ArchitectureTest*' --no-daemon --console=plain
else
    ./gradlew test --tests '*ArchitectureTest*'
fi

echo ""
echo "✓ All architecture rules passed"
```

#### 8.4 Update verify.sh Script

**File:** `ci/verify.sh` (updated)

```bash
#!/bin/bash
set -euo pipefail

# Pre-merge verification script
# Runs format check, architecture tests, build, and all tests

CI_MODE=false
CI_FLAG=""
if [[ "${1:-}" == "--ci" ]]; then
    CI_MODE=true
    CI_FLAG="--ci"
fi

echo "╔════════════════════════════════════════╗"
echo "║      Pre-Merge Verification            ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Step 1: Format Check
echo "Step 1/5: Checking code formatting..."
./ci/format-check.sh $CI_FLAG
echo ""

# Step 2: Build
echo "Step 2/5: Building all modules..."
./ci/build-all.sh $CI_FLAG
echo ""

# Step 3: Architecture Tests
echo "Step 3/5: Running architecture tests..."
./ci/arch-check.sh $CI_FLAG
echo ""

# Step 4: Unit Tests
echo "Step 4/5: Running unit tests..."
./ci/test-unit.sh $CI_FLAG
echo ""

# Step 5: Boot JARs
echo "Step 5/5: Building boot JARs..."
./ci/build-bootjars.sh $CI_FLAG
echo ""

echo "╔════════════════════════════════════════╗"
echo "║      ✓ All Verification Passed         ║"
echo "╚════════════════════════════════════════╝"
```

#### 8.5 Update ci/README.md

Add new scripts to the documentation:

```markdown
| Script | Description |
|--------|-------------|
| `format-check.sh` | Check code formatting (fails on violations) |
| `format-apply.sh` | Auto-format all source files |
| `arch-check.sh` | Run ArchUnit architecture tests |
| `build-all.sh` | Build all modules (platform libraries + applications) |
| `build-bootjars.sh` | Build bootable JARs for Docker deployment |
| `test-unit.sh` | Run all unit tests |
| `verify.sh` | Pre-merge verification (format + build + arch + test + bootJar) |
...
```

---

### Phase 9: Add ArchUnit to BOM

**File:** `libs/platform/platform-bom/build.gradle.kts`

Add ArchUnit version constraint:

```kotlin
dependencies {
    constraints {
        // ... existing constraints ...

        // ArchUnit for architecture testing
        api("com.tngtech.archunit:archunit-junit5:1.3.0")
    }
}
```

---

## Files Summary

### New Files - Documentation

| File | Purpose |
|------|---------|
| `apps/README.md` | Application development standards |
| `apps/AGENTS.md` | Application AI agent guidance |
| `apps/product-service/README.md` | Product service overview |
| `apps/product-service/AGENTS.md` | Product service AI guidance |
| `apps/product-service/CONTENTS.md` | Product service file index |
| `apps/cart-service/README.md` | Cart service overview |
| `apps/cart-service/AGENTS.md` | Cart service AI guidance |
| `apps/cart-service/CONTENTS.md` | Cart service file index |
| `libs/platform/README.md` | Platform library overview |
| `libs/platform/AGENTS.md` | Platform library AI guidance |
| `libs/platform/platform-bom/README.md` | BOM documentation |
| `libs/platform/platform-bom/AGENTS.md` | BOM AI guidance |
| `libs/platform/platform-bom/CONTENTS.md` | BOM file index |
| `libs/platform/platform-logging/README.md` | Logging documentation |
| `libs/platform/platform-logging/AGENTS.md` | Logging AI guidance |
| `libs/platform/platform-logging/CONTENTS.md` | Logging file index |
| `libs/platform/platform-resilience/README.md` | Resilience documentation |
| `libs/platform/platform-resilience/AGENTS.md` | Resilience AI guidance |
| `libs/platform/platform-resilience/CONTENTS.md` | Resilience file index |
| `libs/platform/platform-cache/README.md` | Cache documentation |
| `libs/platform/platform-cache/AGENTS.md` | Cache AI guidance |
| `libs/platform/platform-cache/CONTENTS.md` | Cache file index |
| `libs/platform/platform-error/README.md` | Error handling documentation |
| `libs/platform/platform-error/AGENTS.md` | Error handling AI guidance |
| `libs/platform/platform-error/CONTENTS.md` | Error handling file index |
| `libs/platform/platform-webflux/README.md` | WebFlux utilities documentation |
| `libs/platform/platform-webflux/AGENTS.md` | WebFlux AI guidance |
| `libs/platform/platform-webflux/CONTENTS.md` | WebFlux file index |
| `libs/platform/platform-security/README.md` | Security documentation |
| `libs/platform/platform-security/AGENTS.md` | Security AI guidance |
| `libs/platform/platform-security/CONTENTS.md` | Security file index |
| `libs/platform/platform-test/README.md` | Test utilities documentation |
| `libs/platform/platform-test/AGENTS.md` | Test utilities AI guidance |
| `libs/platform/platform-test/CONTENTS.md` | Test utilities file index |

### New Files - Code Quality

| File | Purpose |
|------|---------|
| `libs/platform/platform-test/src/main/java/org/example/platform/test/architecture/ArchitectureRules.java` | Shared ArchUnit rules for applications |
| `libs/platform/platform-test/src/main/java/org/example/platform/test/architecture/PlatformLibraryRules.java` | ArchUnit rules for platform libraries |
| `apps/product-service/src/test/java/org/example/product/ArchitectureTest.java` | Product service architecture tests |
| `apps/cart-service/src/test/java/org/example/cart/ArchitectureTest.java` | Cart service architecture tests |

### New Files - CI Scripts

| File | Purpose |
|------|---------|
| `ci/format-check.sh` | Check code formatting (fails on violations) |
| `ci/format-apply.sh` | Auto-format all source files |
| `ci/arch-check.sh` | Run ArchUnit architecture tests |

### Modified Files

| File | Change |
|------|--------|
| `buildSrc/build.gradle.kts` | Add Spotless plugin dependency |
| `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts` | Add Spotless configuration |
| `libs/platform/platform-test/build.gradle.kts` | Add ArchUnit dependency |
| `libs/platform/platform-bom/build.gradle.kts` | Add ArchUnit version constraint |
| `ci/verify.sh` | Add format and architecture check steps |
| `ci/README.md` | Document new scripts |

---

## Implementation Order

### Phase 1: Application Standards Documentation
- [ ] Create `apps/README.md`
- [ ] Create `apps/AGENTS.md`

### Phase 2: Platform Library Standards Documentation
- [ ] Create `libs/platform/README.md`
- [ ] Create `libs/platform/AGENTS.md`

### Phase 3: Product Service Documentation
- [ ] Create `apps/product-service/README.md`
- [ ] Create `apps/product-service/AGENTS.md`
- [ ] Create `apps/product-service/CONTENTS.md`

### Phase 4: Cart Service Documentation
- [ ] Create `apps/cart-service/README.md`
- [ ] Create `apps/cart-service/AGENTS.md`
- [ ] Create `apps/cart-service/CONTENTS.md`

### Phase 5: Platform Library Module Documentation
- [ ] Create `libs/platform/platform-bom/README.md`, `AGENTS.md`, `CONTENTS.md`
- [ ] Create `libs/platform/platform-logging/README.md`, `AGENTS.md`, `CONTENTS.md`
- [ ] Create `libs/platform/platform-resilience/README.md`, `AGENTS.md`, `CONTENTS.md`
- [ ] Create `libs/platform/platform-cache/README.md`, `AGENTS.md`, `CONTENTS.md`
- [ ] Create `libs/platform/platform-error/README.md`, `AGENTS.md`, `CONTENTS.md`
- [ ] Create `libs/platform/platform-webflux/README.md`, `AGENTS.md`, `CONTENTS.md`
- [ ] Create `libs/platform/platform-security/README.md`, `AGENTS.md`, `CONTENTS.md`
- [ ] Create `libs/platform/platform-test/README.md`, `AGENTS.md`, `CONTENTS.md`

### Phase 6: Code Formatting with Spotless
- [ ] Add Spotless plugin to `buildSrc/build.gradle.kts`
- [ ] Update `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts` with Spotless config
- [ ] Run `./gradlew spotlessApply` to format existing code
- [ ] Verify with `./gradlew spotlessCheck`

### Phase 7: ArchUnit Architecture Tests
- [ ] Add ArchUnit version to `libs/platform/platform-bom/build.gradle.kts`
- [ ] Add ArchUnit dependency to `libs/platform/platform-test/build.gradle.kts`
- [ ] Create `ArchitectureRules.java` in platform-test
- [ ] Create `PlatformLibraryRules.java` in platform-test
- [ ] Create `ArchitectureTest.java` in product-service
- [ ] Create `ArchitectureTest.java` in cart-service
- [ ] Run architecture tests: `./gradlew test --tests '*ArchitectureTest*'`

### Phase 8: CI Pipeline Updates
- [ ] Create `ci/format-check.sh`
- [ ] Create `ci/format-apply.sh`
- [ ] Create `ci/arch-check.sh`
- [ ] Update `ci/verify.sh` to include format and architecture checks
- [ ] Update `ci/README.md` with new scripts
- [ ] Test full verification: `./ci/verify.sh`

---

## Verification

After completing all phases:

### Documentation Verification

1. Verify all documentation files exist:
```bash
find apps libs/platform -name "README.md" -o -name "AGENTS.md" -o -name "CONTENTS.md" | sort
```

2. Expected count: 36 documentation files (12 README.md + 12 AGENTS.md + 12 CONTENTS.md)

### Code Quality Verification

3. Verify Spotless is configured:
```bash
./gradlew spotlessCheck
```

4. Verify ArchUnit tests pass:
```bash
./gradlew test --tests '*ArchitectureTest*'
```

5. Verify CI scripts work:
```bash
./ci/format-check.sh
./ci/arch-check.sh
./ci/verify.sh
```

### Full Verification

6. Run complete verification pipeline:
```bash
./ci/verify.sh
```

This should pass all 5 steps:
- Format check
- Build all
- Architecture tests
- Unit tests
- Boot JARs

---

## Rollback Plan

If documentation is incorrect:
1. Delete the created files
2. Re-analyze the source code
3. Re-create with corrections

---

## References

- `apps/product-service/` - Reference implementation
- `006_AUTHN_AUTHZ.md` - Security implementation plan
- `008_CART_SERVICE.md` - Cart service implementation plan
