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
- No centralized standards documentation ✓ (now in docs/standards/)
- No README files in `apps/` or `libs/platform/` directories
- Individual modules lack AGENTS.md and CONTENTS.md files
- Patterns exist in code but are not formally documented

### Code Quality Gaps
- ArchUnit tests for architecture enforcement ✓ (now in platform-test)
- Code formatting rules enforced ✓ (Spotless + Google Java Format)
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

### Standards Structure

```
docs/standards/
├── README.md                      # Standards overview (✓ created)
├── CONTENTS.md                    # File index (✓ created)
├── architecture.md                # Layered architecture rules
├── caching.md                     # Caching patterns
├── code-style.md                  # Formatting, naming
├── documentation.md               # README/AGENTS/CONTENTS patterns
├── error-handling.md              # Global error handling
├── observability-logs.md          # Structured logging
├── observability-metrics.md       # Prometheus metrics
├── observability-traces.md        # Distributed tracing
├── resiliency-circuit-breakers.md # Circuit breaker patterns
├── resiliency-retries.md          # Retry patterns
├── resiliency-bulk-heads.md       # Bulkhead patterns
├── resiliency-timeouts.md         # Timeout patterns
├── security.md                    # Auth patterns
├── testing-unit.md                # Unit test patterns
├── testing-integration.md         # Integration test patterns
├── testing-e2e.md                 # E2E test patterns
└── validation.md                  # Request validation patterns
```

### Documentation Structure

```
reactive-platform/
├── README.md                          # Project overview (exists)
├── CLAUDE.md                          # AI agent instructions (exists)
├── docs/standards/                    # Platform standards (Phase 1)
├── apps/
│   ├── README.md                      # Application standards (Phase 3)
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
    ├── README.md                      # Platform library standards (Phase 4)
    ├── AGENTS.md                      # Platform development guidance
    └── platform-*/                    # Each module with README/AGENTS/CONTENTS
```

---

## Implementation Plan

### Phase 1: Define Platform Standards (docs/standards/)

Create each standard file with: **Intent**, **Outcomes**, **Patterns**, **Anti-patterns**, **Reference**.

#### 1.1 Architecture Standard

**File:** `docs/standards/architecture.md`

```markdown
# Architecture Standard

## Intent
Establish consistent layered architecture across all applications to ensure separation of concerns and testability.

## Outcomes
- Clear boundaries between controller, service, repository layers
- Domain objects are pure data (no framework dependencies)
- Predictable file organization
- Easy navigation for humans and AI agents

## Patterns

### Package Structure
```
org.example.{app}/
├── {App}Application.java       # Entry point
├── controller/                 # HTTP endpoints (REST)
├── service/                    # Business logic
├── repository/                 # External service clients
│   └── {external}/            # One package per external service
├── domain/                     # Domain models (records)
├── config/                     # Configuration classes
└── validation/                 # Request validators
```

### Layer Dependencies
```
Controller → Service → Repository
     ↓          ↓          ↓
   Domain    Domain     Domain
```

### Rules
- Controllers depend on services (never repositories directly)
- Services orchestrate repositories
- Repositories handle external I/O (HTTP, Redis, DB)
- Domain objects have NO dependencies on other layers
- Config/Validation are used by controllers only

## Anti-patterns
- Controller directly calling repository
- Domain objects with Spring annotations
- Service depending on controller
- Circular dependencies between packages

## Reference
- `apps/product-service/` - Reference implementation
- `libs/platform/platform-test/.../ArchitectureRules.java` - Enforcement
```

#### 1.2 Models Standard

**File:** `docs/standards/models.md`

```markdown
# Models Standard

## Intent
Keep domain models as pure data containers with no business logic, ensuring testability, immutability, and separation of concerns.

## Outcomes
- Models are simple, predictable data holders
- No hidden side effects in model creation
- Easy serialization/deserialization
- Testable without mocking
- Clear separation between data and behavior

## Patterns

### Use Java Records
Records are the preferred way to define models:
```
record Product(
    long sku,
    String description,
    String price,
    int availableQuantity
) {}
```

### No Business Logic in Models
Models contain ONLY:
- Fields (data)
- Accessors (automatic with records)
- equals/hashCode/toString (automatic with records)

Models NEVER contain:
- Validation logic
- Transformation logic
- Factory methods with business rules
- Service calls
- State mutations

### Creation Logic Lives Outside

**Wrong - logic in model:**
```
record Order(String id, List<Item> items, BigDecimal total) {
    // DON'T DO THIS
    public Order addItem(Item item) {
        var newItems = new ArrayList<>(items);
        newItems.add(item);
        return new Order(id, newItems, calculateTotal(newItems));
    }
}
```

**Right - logic in service:**
```
record Order(String id, List<Item> items, BigDecimal total) {}

class OrderService {
    public Order addItem(Order order, Item item) {
        var newItems = new ArrayList<>(order.items());
        newItems.add(item);
        return new Order(order.id(), newItems, calculateTotal(newItems));
    }
}
```

### Validation Lives in Validators
```
record CreateProductRequest(long sku, String description) {}

class ProductRequestValidator {
    public Mono<Void> validate(CreateProductRequest request) {
        List<ValidationError> errors = new ArrayList<>();
        if (request.sku() <= 0) {
            errors.add(new ValidationError("sku", "Must be positive"));
        }
        if (request.description() == null || request.description().isBlank()) {
            errors.add(new ValidationError("description", "Required"));
        }
        return errors.isEmpty()
            ? Mono.empty()
            : Mono.error(new ValidationException(errors));
    }
}
```

### Transformation Lives in Mappers/Services
```
record ExternalProductResponse(String sku, String desc, String amt) {}
record Product(long sku, String description, String price) {}

class ProductMapper {
    public Product fromExternal(ExternalProductResponse external) {
        return new Product(
            Long.parseLong(external.sku()),
            external.desc(),
            external.amt()
        );
    }
}
```

### Model Categories

| Category | Location | Example |
|----------|----------|---------|
| Domain models | `domain/` | `Product`, `Cart`, `CartItem` |
| API requests | `controller/` or `validation/` | `CreateCartRequest` |
| API responses | `controller/` or `domain/` | `ProductResponse` |
| External responses | `repository/{service}/` | `MerchandiseResponse` |

### Immutability
All models MUST be immutable:
- Use records (immutable by default)
- For collections, use `List.of()`, `Set.of()`, `Map.of()`
- Never expose mutable collections

```
// Good - immutable
record Cart(String id, List<CartItem> items) {
    public Cart {
        items = List.copyOf(items); // Defensive copy
    }
}

// Bad - mutable collection exposed
record Cart(String id, List<CartItem> items) {} // items can be modified
```

## Anti-patterns

### Logic in Constructors
```
// DON'T - validation in constructor
record Product(long sku, String description) {
    public Product {
        if (sku <= 0) throw new IllegalArgumentException("Invalid SKU");
    }
}
```

### Factory Methods with Business Rules
```
// DON'T - business logic in static factory
record Order(String id, Status status) {
    public static Order create() {
        return new Order(UUID.randomUUID().toString(), Status.PENDING);
    }
}
```

### Derived Fields Calculated in Model
```
// DON'T - calculation in model
record Cart(List<CartItem> items) {
    public BigDecimal getTotal() {
        return items.stream()
            .map(CartItem::subtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}

// DO - calculation in service, store result
record Cart(List<CartItem> items, BigDecimal total) {}
```

### Mutable Models
```
// DON'T - mutable class
class Product {
    private String description;
    public void setDescription(String desc) { this.description = desc; }
}
```

## Reference
- `apps/product-service/src/.../domain/Product.java` - Domain model example
- `apps/product-service/src/.../repository/*/` - Response record examples
- `apps/cart-service/src/.../domain/` - Cart domain models
```

#### 1.3 Resilience Standards

**File:** `docs/standards/resiliency-circuit-breakers.md`

```markdown
# Circuit Breaker Standard

## Intent
Prevent cascading failures by stopping requests to failing services.

## Outcomes
- Failed services don't take down the entire system
- Fast failure when service is known to be down
- Automatic recovery when service recovers
- Observable state for monitoring

## Patterns

### Configuration Structure
```yaml
resilience4j.circuitbreaker.instances.{service-name}:
  sliding-window-type: COUNT_BASED
  sliding-window-size: 10
  minimum-number-of-calls: 5
  failure-rate-threshold: 50
  wait-duration-in-open-state: 10s
  permitted-number-of-calls-in-half-open-state: 3
  automatic-transition-from-open-to-half-open-enabled: true
```

### State Machine
```
CLOSED --[failure rate >= threshold]--> OPEN
OPEN --[wait duration expires]--> HALF_OPEN
HALF_OPEN --[success rate >= threshold]--> CLOSED
HALF_OPEN --[failure]--> OPEN
```

### Usage Pattern
```
repository.call()
  → resilience.decorate("service-name", httpCall)
  → on error: log circuit breaker state, return fallback
```

### Fallback Response
Every repository MUST define a static fallback:
```
FALLBACK = new Response("Unavailable", null, 0)
```

## Anti-patterns
- No fallback response (errors propagate to user)
- Circuit breaker without timeout (stuck calls)
- Same circuit breaker name for different services
- Ignoring circuit breaker state in logs

## Reference
- `apps/product-service/src/.../repository/` - Pattern examples
- `libs/platform/platform-resilience/` - ReactiveResilience wrapper
```

**File:** `docs/standards/resiliency-retries.md`

```markdown
# Retry Standard

## Intent
Recover from transient failures without burdening the system.

## Outcomes
- Transient network errors don't cause request failures
- Exponential backoff prevents thundering herd
- Non-retryable errors fail fast

## Patterns

### Configuration Structure
```yaml
resilience4j.retry.instances.{service-name}:
  max-attempts: 3
  wait-duration: 100ms
  enable-exponential-backoff: true
  exponential-backoff-multiplier: 2
  retry-exceptions:
    - java.io.IOException
    - java.util.concurrent.TimeoutException
    - WebClientResponseException$ServiceUnavailable
    - WebClientResponseException$GatewayTimeout
  ignore-exceptions:
    - WebClientResponseException$BadRequest
    - WebClientResponseException$NotFound
```

### Retry Timing (exponential backoff)
```
Attempt 1: immediate
Attempt 2: 100ms delay
Attempt 3: 200ms delay
Total max: ~300ms + call time
```

### Retryable vs Non-Retryable
| Retryable | Non-Retryable |
|-----------|---------------|
| 503, 504 | 400, 404, 401, 403 |
| IOException | ValidationException |
| TimeoutException | BusinessException |

## Anti-patterns
- Retrying on 4xx errors (wastes resources)
- Linear backoff (can overload recovering service)
- Too many retries (delays user response)
- Retrying without circuit breaker (infinite loop potential)

## Reference
- `apps/product-service/src/main/resources/application.yml`
```

**File:** `docs/standards/resiliency-bulk-heads.md`

```markdown
# Bulkhead Standard

## Intent
Limit concurrent requests to external services to prevent resource exhaustion.

## Outcomes
- No single service can consume all threads
- Graceful degradation under high load
- Protection against slow consumers

## Patterns

### Configuration Structure
```yaml
resilience4j.bulkhead.instances.{service-name}:
  max-concurrent-calls: 25
  max-wait-duration: 0s
```

### Sizing Guidelines
| Service Type | Max Concurrent | Rationale |
|--------------|----------------|-----------|
| Critical (inventory) | 25 | Higher priority |
| Standard (merchandise) | 25 | Balanced |
| Low priority | 10 | Preserve resources |

### Behavior
- Request arrives → check bulkhead
- If full (25 calls in flight) → reject immediately (max-wait: 0)
- If available → proceed with call

## Anti-patterns
- No bulkhead (unbounded concurrency)
- max-wait > 0 with timeout (double waiting)
- Same limit for all services (no prioritization)

## Reference
- `apps/product-service/src/main/resources/application.yml`
```

**File:** `docs/standards/resiliency-timeouts.md`

```markdown
# Timeout Standard

## Intent
Fail fast when external services are slow to prevent thread blocking.

## Outcomes
- Predictable response times
- No hung requests
- Resources freed for other requests

## Patterns

### Configuration Structure
```yaml
resilience4j.timelimiter.instances.{service-name}:
  timeout-duration: 2s
  cancel-running-future: true
```

### Timeout Guidelines
| Operation | Timeout | Rationale |
|-----------|---------|-----------|
| Cache lookup | 100ms | Should be fast |
| External API | 2s | Standard HTTP call |
| Slow API | 5s | Known slow service |
| Background job | 30s | Non-blocking |

### Decorator Order
Timeout is innermost decorator:
```
bulkhead → retry → circuit-breaker → TIMEOUT → actual call
```

## Anti-patterns
- No timeout (infinite wait possible)
- Timeout > retry total time (retry never completes)
- Same timeout for cache and HTTP (cache should be faster)

## Reference
- `libs/platform/platform-resilience/ReactiveResilience.java`
```

#### 1.3 Caching Standard

**File:** `docs/standards/caching.md`

```markdown
# Caching Standard

## Intent
Reduce load on external services and improve response times.

## Outcomes
- Faster response times for cached data
- Reduced external service calls
- Graceful degradation when services fail

## Patterns

### Cache-Aside (Default)
Use for data that changes infrequently.

```
request arrives
  → check cache
  → if HIT: return cached value
  → if MISS: call service → cache response → return
```

```
Data flow:
[Client] → [Cache Check] → [Cache HIT] → [Return]
                ↓
          [Cache MISS]
                ↓
          [Call Service] → [Cache PUT] → [Return]
```

### Fallback-Only
Use for data that MUST be fresh (inventory, real-time data).

```
request arrives
  → call service (always)
  → on success: update cache, return
  → on error: check cache for fallback
```

```
Data flow:
[Client] → [Call Service] → [Success] → [Cache PUT] → [Return]
                ↓
            [Error]
                ↓
          [Cache GET] → [Return Stale or Fallback]
```

### TTL Guidelines
| Data Type | TTL | Pattern | Rationale |
|-----------|-----|---------|-----------|
| Static reference | 15-30 min | Cache-aside | Rarely changes |
| Pricing | 2-5 min | Cache-aside | May change |
| Inventory | 30 sec | Fallback-only | Must be fresh |
| User session | 30 min | Cache-aside | Session timeout |

### Key Generation
Use consistent key format:
```
{entity}:{identifier}:{id}
Examples:
  merchandise:sku:123456
  price:sku:123456
  inventory:sku:123456:store:1234
```

## Anti-patterns
- Caching volatile data with long TTL
- No TTL (stale data forever)
- Inconsistent key formats
- Caching errors (negative caching without intent)

## Reference
- `apps/product-service/src/.../repository/merchandise/` - Cache-aside
- `apps/product-service/src/.../repository/inventory/` - Fallback-only
- `libs/platform/platform-cache/` - Cache abstraction
```

#### 1.4 Observability Standards

**File:** `docs/standards/observability-logs.md`

```markdown
# Logging Standard

## Intent
Provide consistent, structured, searchable logs for debugging and monitoring.

## Outcomes
- JSON-formatted logs for machine parsing
- Request correlation via trace IDs
- Searchable metadata (store, user, session)
- No sensitive data in logs

## Patterns

### Log Structure
```json
{
  "level": "info",
  "logger": "productservice",
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

### Logger Names
Lowercase, no dots, component name only:
- `productcontroller`
- `productservice`
- `merchandiserepository`

### Log Levels
| Level | Use Case |
|-------|----------|
| ERROR | Exceptions, failures requiring attention |
| WARN | Recoverable issues, fallbacks used |
| INFO | Request/response, state changes |
| DEBUG | Detailed flow (disabled in prod) |

### Context Propagation
Use Reactor Context, NOT MDC:
```
Mono.deferContextual(ctx -> {
    structuredLogger.logMessage(ctx, LOGGER_NAME, "message");
    return ...
})
```

### WebClient Logging
All WebClient beans MUST include logging filter:
```
WebClient.builder()
    .filter(loggingFilter.create("repositoryname"))
    .build()
```

## Anti-patterns
- Using MDC (not reactive-safe)
- Logging without context (no correlation)
- Logging sensitive data (passwords, tokens)
- println/System.out (not structured)

## Reference
- `libs/platform/platform-logging/StructuredLogger.java`
- `apps/product-service/src/.../config/ProductServiceConfig.java`
```

**File:** `docs/standards/observability-metrics.md`

```markdown
# Metrics Standard

## Intent
Provide quantitative data for monitoring, alerting, and capacity planning.

## Outcomes
- Prometheus-compatible metrics endpoint
- Circuit breaker state visibility
- Request rate and latency tracking
- Resource utilization monitoring

## Patterns

### Required Metrics
| Metric | Type | Labels |
|--------|------|--------|
| http_server_requests | histogram | uri, method, status |
| resilience4j_circuitbreaker_state | gauge | name |
| resilience4j_retry_calls | counter | name, result |
| cache_gets, cache_puts | counter | name, result |

### Actuator Configuration
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus,info
  metrics:
    tags:
      application: ${spring.application.name}
```

### Health Indicators
Circuit breakers register as health indicators:
```yaml
resilience4j.circuitbreaker.configs.default:
  register-health-indicator: true
```

## Anti-patterns
- High-cardinality labels (user ID, order ID)
- Metrics without labels (can't filter)
- Missing circuit breaker health indicators

## Reference
- `apps/product-service/src/main/resources/application.yml`
- Grafana dashboards in `docker/grafana/`
```

**File:** `docs/standards/observability-traces.md`

```markdown
# Tracing Standard

## Intent
Track request flow across services for debugging distributed systems.

## Outcomes
- End-to-end request visibility
- Latency breakdown by service
- Error correlation across services

## Patterns

### Trace Propagation
Trace context flows via HTTP headers:
- `traceparent` (W3C standard)
- `tracestate` (optional)

### Span Naming
- HTTP spans: `{method} {path}`
- Custom spans: `{component}.{operation}`

### Configuration
```yaml
management:
  tracing:
    sampling:
      probability: 1.0  # 100% in dev, lower in prod
```

## Anti-patterns
- 100% sampling in production (too much data)
- Not propagating context to external calls
- Missing span names

## Reference
- Tempo in `docker/docker-compose.yml`
- Grafana trace exploration
```

#### 1.5 Error Handling Standard

**File:** `docs/standards/error-handling.md`

```markdown
# Error Handling Standard

## Intent
Provide consistent, informative error responses without leaking implementation details.

## Outcomes
- Structured error responses
- Appropriate HTTP status codes
- Trace IDs for debugging
- No stack traces to clients

## Patterns

### Error Response Structure
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/products/123",
  "status": 400,
  "traceId": "abc123def456",
  "details": {
    "x-store-number": "Must be between 1 and 2000"
  }
}
```

### Exception Mapping
| Exception | HTTP Status | Description |
|-----------|-------------|-------------|
| ValidationException | 400 | Request validation failed |
| CallNotPermittedException | 503 | Circuit breaker open |
| TimeoutException | 504 | Request timeout |
| BulkheadFullException | 503 | Too many concurrent requests |
| WebClientResponseException | Mirrors upstream | Upstream error |
| Exception | 500 | Unexpected error |

### Repository Fallbacks
Every repository MUST define a fallback:
```
FALLBACK = new Response("Unavailable", ...)
```

Fallback is returned when:
- Circuit breaker is open
- All retries exhausted
- Timeout exceeded

## Anti-patterns
- Returning stack traces to clients
- Generic "Internal Server Error" for all errors
- No fallback responses
- Swallowing errors silently

## Reference
- `libs/platform/platform-error/GlobalErrorHandler.java`
- `apps/product-service/src/.../repository/*/`
```

#### 1.6 Security Standard

**File:** `docs/standards/security.md`

```markdown
# Security Standard

## Intent
Protect APIs from unauthorized access and validate all inputs.

## Outcomes
- Authenticated requests only
- Validated request headers/params
- No injection vulnerabilities

## Patterns

### Required Headers
All endpoints MUST validate:
| Header | Format | Validation |
|--------|--------|------------|
| x-store-number | Integer | 1-2000 |
| x-order-number | UUID | UUID pattern |
| x-userid | String | 6 alphanumeric |
| x-sessionid | UUID | UUID pattern |

### Validation Pattern
```
Controller receives request
  → Validator.validate(headers, params)
  → if errors: throw ValidationException
  → else: proceed
```

### OAuth2 (Future)
See `006_AUTHN_AUTHZ.md` for implementation plan:
- Resource server configuration
- JWT validation
- Client credentials for outbound calls

## Anti-patterns
- Trusting client input without validation
- Hardcoded secrets
- Missing header validation
- SQL/NoSQL injection via unvalidated input

## Reference
- `apps/product-service/src/.../validation/`
- `libs/platform/platform-security/` (placeholder)
```

#### 1.7 Validation Standard

**File:** `docs/standards/validation.md`

```markdown
# Validation Standard

## Intent
Reject invalid requests early with clear error messages.

## Outcomes
- Fast failure for invalid requests
- Actionable error messages
- Consistent validation across services

## Patterns

### Validation Rules
| Field | Rule | Error Message |
|-------|------|---------------|
| x-store-number | 1-2000 | "Must be between 1 and 2000" |
| x-order-number | UUID pattern | "Must be a valid UUID" |
| x-userid | 6 alphanumeric | "Must be 6 alphanumeric characters" |
| x-sessionid | UUID pattern | "Must be a valid UUID" |
| path params | positive long | "Must be a positive number" |

### Validator Pattern
```
RequestValidator
  .validate(params, headers)
  .then(proceed)
  .onError(ValidationException with field errors)
```

### Error Aggregation
Collect ALL errors, don't fail on first:
```json
{
  "details": {
    "x-store-number": "Must be between 1 and 2000",
    "x-userid": "Must be 6 alphanumeric characters"
  }
}
```

## Anti-patterns
- Failing on first error (user fixes one, gets another)
- Vague error messages ("Invalid input")
- Validation in service layer (should be in controller/validator)

## Reference
- `apps/product-service/src/.../validation/ProductRequestValidator.java`
```

#### 1.8 Testing Standards

**File:** `docs/standards/testing-unit.md`

```markdown
# Unit Testing Standard

## Intent
Test individual components in isolation for fast feedback.

## Outcomes
- Fast test execution
- High code coverage
- Isolated component testing

## Patterns

### Test Class Naming
- `{ClassName}Test.java`

### Test Method Naming
- `methodName_condition_expectedResult()`
- Or descriptive: `shouldReturnFallbackWhenServiceFails()`

### Structure (Arrange-Act-Assert)
```
@Test
void methodName_condition_expectedResult() {
    // Arrange
    given(dependency.method()).willReturn(value);

    // Act
    Result result = classUnderTest.method(input);

    // Assert
    assertThat(result).isEqualTo(expected);
}
```

### Reactor Testing
```
StepVerifier.create(mono)
    .expectNext(expectedValue)
    .verifyComplete();
```

## Anti-patterns
- Testing multiple things in one test
- No assertions (test that can't fail)
- Testing implementation details
- Slow unit tests (use integration tests for I/O)

## Reference
- `apps/product-service/src/test/java/` - Examples
- `libs/platform/platform-test/ReactorTestSupport.java` - Utilities
```

**File:** `docs/standards/testing-integration.md`

```markdown
# Integration Testing Standard

## Intent
Test components with real infrastructure (Redis, HTTP).

## Outcomes
- Verified integration with external systems
- Realistic test scenarios
- Reproducible tests via containers

## Patterns

### Test Class Setup
```
@SpringBootTest
@Testcontainers
class ServiceIntegrationTest {

    @Container
    static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port",
            () -> RedisTestSupport.getRedisPort(redis));
    }
}
```

### WireMock for HTTP
```
@RegisterExtension
static WireMockExtension wiremock = WireMockExtension.newInstance()
    .options(wireMockConfig().port(8082))
    .build();

@Test
void test() {
    wiremock.stubFor(get("/api/resource")
        .willReturn(okJson("{\"data\":\"value\"}")));

    // test code
}
```

### Required Tests
Every application MUST have:
- [ ] Context load test (`contextLoads()`)
- [ ] Redis integration test
- [ ] Controller integration tests
- [ ] Repository tests with WireMock

## Anti-patterns
- Mocking Redis in integration tests
- Hardcoded ports (use dynamic ports)
- Tests that depend on external services
- Skipping context load test

## Reference
- `apps/product-service/src/test/.../ProductServiceApplicationTest.java`
- `libs/platform/platform-test/RedisTestSupport.java`
```

**File:** `docs/standards/testing-e2e.md`

```markdown
# End-to-End Testing Standard

## Intent
Verify system behavior under realistic load and failure conditions.

## Outcomes
- Validated performance under load
- Verified resilience patterns
- Documented performance baselines

## Patterns

### k6 Test Structure
```javascript
export const options = {
    scenarios: {
        load_test: {
            executor: 'ramping-vus',
            startVUs: 1,
            stages: [
                { duration: '30s', target: 10 },
                { duration: '1m', target: 10 },
                { duration: '30s', target: 0 }
            ]
        }
    },
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01']
    }
};
```

### Test Types
| Type | Purpose | Trigger |
|------|---------|---------|
| Load | Normal traffic | Pre-release |
| Stress | Find breaking point | Capacity planning |
| Resilience | Failure injection | Circuit breaker validation |

### Chaos Testing
Test circuit breaker behavior:
1. Run normal load
2. Inject failure (WireMock returns 503)
3. Verify circuit opens
4. Remove failure
5. Verify circuit closes

## Anti-patterns
- No thresholds (test always passes)
- Testing only happy path
- Skipping chaos tests

## Reference
- `e2e-test/` - k6 test scripts
- `docker/docker-compose.yml` - Test profiles
```

#### 1.9 Code Quality Standards

**File:** `docs/standards/code-style.md`

```markdown
# Code Style Standard

## Intent
Consistent code formatting for readability and reduced merge conflicts.

## Outcomes
- Automated formatting
- No style discussions in code review
- Git-friendly diffs

## Patterns

### Formatter: Spotless + Google Java Format
```kotlin
// buildSrc/platform.java-conventions.gradle.kts
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
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Class | PascalCase | `ProductService` |
| Method | camelCase | `getProduct` |
| Constant | UPPER_SNAKE | `FALLBACK_RESPONSE` |
| Package | lowercase | `org.example.product` |
| Logger name | lowercase | `productservice` |

### Commands
```bash
./gradlew spotlessCheck  # Verify formatting
./gradlew spotlessApply  # Auto-format
```

## Anti-patterns
- Manual formatting
- Inconsistent naming
- Committing unformatted code

## Reference
- `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts`
```

**File:** `docs/standards/documentation.md`

```markdown
# Documentation Standard

## Intent
Provide consistent documentation for humans and AI agents.

## Outcomes
- Every module has README, AGENTS, CONTENTS
- AI agents can navigate efficiently
- Humans understand purpose and usage

## Patterns

### File Structure
Every module (app or library) has:
```
module/
├── README.md    # Purpose, usage, configuration
├── AGENTS.md    # AI agent guidance
├── CONTENTS.md  # File index
└── src/
```

### README.md Template
```markdown
# Module Name

Brief description.

## Features
- Feature 1
- Feature 2

## Usage
Code examples.

## Configuration
YAML/properties examples.

## Running
Commands to run/test.
```

### AGENTS.md Template
```markdown
# Module Agent Guidelines

## Key Files
| File | Purpose |
|------|---------|
| ... | ... |

## Common Tasks
How to add features, fix issues.

## Patterns
Code patterns used in this module.

## Anti-patterns
What to avoid.
```

### CONTENTS.md Template
```markdown
# Module Contents

## Main Source (src/main/java/...)
- `File.java` - Description

## Resources
- `application.yml` - Description

## Tests
- `FileTest.java` - Description
```

## Anti-patterns
- No documentation
- Outdated documentation
- Implementation code in standards (standards are intent-focused)

## Reference
- `docs/standards/` - Standards documentation
- `apps/product-service/` - Reference implementation
```

---

### Phase 2: Code Formatting with Spotless

#### 2.1 Add Spotless Plugin to buildSrc

**File:** `buildSrc/build.gradle.kts`

Add Spotless plugin dependency:

```kotlin
dependencies {
    // ... existing
    implementation("com.diffplug.spotless:spotless-plugin-gradle:7.0.0.BETA4")
}
```

#### 2.2 Update Java Conventions with Spotless

**File:** `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts`

```kotlin
plugins {
    java
    id("com.diffplug.spotless")
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
    dependsOn("spotlessCheck")
}
```

#### 2.3 Format Existing Code

```bash
./gradlew spotlessApply
./gradlew spotlessCheck
```

---

### Phase 3: ArchUnit Architecture Tests

#### 3.1 Add ArchUnit to Platform Test

**File:** `libs/platform/platform-test/build.gradle.kts`

```kotlin
dependencies {
    // ... existing
    api("com.tngtech.archunit:archunit-junit5:1.3.0")
}
```

#### 3.2 Create Shared Architecture Rules

**File:** `libs/platform/platform-test/src/main/java/org/example/platform/test/architecture/ArchitectureRules.java`

See original plan for full implementation.

#### 3.3 Create Application ArchTest

**File:** `apps/product-service/src/test/java/org/example/product/ArchitectureTest.java`

See original plan for full implementation.

---

### Phase 4: Application Documentation

#### 4.1 Create apps/README.md and apps/AGENTS.md

Document application development standards, referencing the standards in `docs/standards/`.

#### 4.2 Create Product Service Documentation

- `apps/product-service/README.md`
- `apps/product-service/AGENTS.md`
- `apps/product-service/CONTENTS.md`

#### 4.3 Create Cart Service Documentation

- `apps/cart-service/README.md`
- `apps/cart-service/AGENTS.md`
- `apps/cart-service/CONTENTS.md`

---

### Phase 5: Platform Library Documentation

Create README.md, AGENTS.md, CONTENTS.md for each:
- `libs/platform/README.md`, `AGENTS.md`
- `libs/platform/platform-bom/`
- `libs/platform/platform-logging/`
- `libs/platform/platform-resilience/`
- `libs/platform/platform-cache/`
- `libs/platform/platform-error/`
- `libs/platform/platform-webflux/`
- `libs/platform/platform-security/`
- `libs/platform/platform-test/`

---

### Phase 6: CI Pipeline Updates

#### 6.1 Create CI Scripts

- `ci/format-check.sh`
- `ci/format-apply.sh`
- `ci/arch-check.sh`

#### 6.2 Update verify.sh

Add format and architecture checks to pre-merge verification.

---

## Implementation Order

### Phase 1: Define Platform Standards (Priority) ✅ COMPLETE
- [x] Create `docs/standards/README.md`
- [x] Create `docs/standards/CONTENTS.md`
- [x] Create `docs/standards/architecture.md`
- [x] Create `docs/standards/models.md`
- [x] Create `docs/standards/resiliency-circuit-breakers.md`
- [x] Create `docs/standards/resiliency-retries.md`
- [x] Create `docs/standards/resiliency-bulk-heads.md`
- [x] Create `docs/standards/resiliency-timeouts.md`
- [x] Create `docs/standards/caching.md`
- [x] Create `docs/standards/observability-logs.md`
- [x] Create `docs/standards/observability-metrics.md`
- [x] Create `docs/standards/observability-traces.md`
- [x] Create `docs/standards/error-handling.md`
- [x] Create `docs/standards/security.md`
- [x] Create `docs/standards/validation.md`
- [x] Create `docs/standards/testing-unit.md`
- [x] Create `docs/standards/testing-integration.md`
- [x] Create `docs/standards/testing-e2e.md`
- [x] Create `docs/standards/code-style.md`
- [x] Create `docs/standards/documentation.md`

### Phase 2: Code Formatting with Spotless ✅ COMPLETE
- [x] Add Spotless plugin to `buildSrc/build.gradle.kts`
- [x] Update `platform.java-conventions.gradle.kts` with Spotless config
- [x] Run `./gradlew spotlessApply` to format existing code
- [x] Verify with `./gradlew spotlessCheck`

### Phase 3: ArchUnit Architecture Tests ✅ COMPLETE
- [x] Add ArchUnit version to platform-bom
- [x] Add ArchUnit dependency to platform-test
- [x] Create `ArchitectureRules.java` in platform-test
- [x] Create `ArchitectureTest.java` in product-service
- [x] Run architecture tests

### Phase 4: Application Documentation
- [ ] Create `apps/README.md`
- [ ] Create `apps/AGENTS.md`
- [ ] Create `apps/product-service/README.md`, `AGENTS.md`, `CONTENTS.md`
- [ ] Create `apps/cart-service/README.md`, `AGENTS.md`, `CONTENTS.md`

### Phase 5: Platform Library Documentation
- [ ] Create documentation for each platform library module

### Phase 6: CI Pipeline Updates
- [ ] Create `ci/format-check.sh`
- [ ] Create `ci/format-apply.sh`
- [ ] Create `ci/arch-check.sh`
- [ ] Update `ci/verify.sh`

---

## Verification

After completing all phases:

```bash
# Verify standards exist
ls docs/standards/*.md | wc -l  # Should be 20

# Verify formatting works
./gradlew spotlessCheck

# Verify architecture tests pass
./gradlew test --tests '*ArchitectureTest*'

# Full verification
./ci/verify.sh
```

---

## References

- `apps/product-service/` - Reference implementation
- `006_AUTHN_AUTHZ.md` - Security implementation plan
- `008_CART_SERVICE.md` - Cart service implementation plan
