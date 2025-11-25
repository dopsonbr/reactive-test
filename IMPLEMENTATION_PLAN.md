# Implementation Plan: Resilience4j & Chaos Testing

## Overview

Add production-grade resilience patterns using Resilience4j and comprehensive chaos testing to validate fault tolerance.

## Goals

1. **Resilience4j Integration** - Circuit breakers, retries, timeouts, and bulkheads for all external service calls
2. **Graceful Degradation** - Fallback responses when services are unavailable
3. **Structured Error Handling** - Consistent error responses with proper logging
4. **Chaos Testing** - WireMock fault injection (500s, timeouts, connection failures)
5. **Resilience Metrics** - Expose circuit breaker states and retry counts via Prometheus

---

## Phase 1: Resilience4j Setup

### 1.1 Add Dependencies

**File:** `build.gradle`

```groovy
// Resilience4j with Spring Boot 3 and Reactor
implementation 'io.github.resilience4j:resilience4j-spring-boot3:2.2.0'
implementation 'io.github.resilience4j:resilience4j-reactor:2.2.0'
implementation 'io.github.resilience4j:resilience4j-micrometer:2.2.0'

// AOP for annotations
implementation 'org.springframework.boot:spring-boot-starter-aop'
```

### 1.2 Configure Resilience4j

**File:** `src/main/resources/application.properties` (additions)

```properties
# ========================================
# Resilience4j Configuration
# ========================================

# --- Circuit Breaker (per service) ---
resilience4j.circuitbreaker.configs.default.registerHealthIndicator=true
resilience4j.circuitbreaker.configs.default.slidingWindowType=COUNT_BASED
resilience4j.circuitbreaker.configs.default.slidingWindowSize=10
resilience4j.circuitbreaker.configs.default.minimumNumberOfCalls=5
resilience4j.circuitbreaker.configs.default.failureRateThreshold=50
resilience4j.circuitbreaker.configs.default.waitDurationInOpenState=10s
resilience4j.circuitbreaker.configs.default.permittedNumberOfCallsInHalfOpenState=3
resilience4j.circuitbreaker.configs.default.automaticTransitionFromOpenToHalfOpenEnabled=true

resilience4j.circuitbreaker.instances.merchandise.baseConfig=default
resilience4j.circuitbreaker.instances.price.baseConfig=default
resilience4j.circuitbreaker.instances.inventory.baseConfig=default

# --- Retry Configuration ---
resilience4j.retry.configs.default.maxAttempts=3
resilience4j.retry.configs.default.waitDuration=100ms
resilience4j.retry.configs.default.enableExponentialBackoff=true
resilience4j.retry.configs.default.exponentialBackoffMultiplier=2
resilience4j.retry.configs.default.retryExceptions=java.io.IOException,java.util.concurrent.TimeoutException,org.springframework.web.reactive.function.client.WebClientResponseException.ServiceUnavailable,org.springframework.web.reactive.function.client.WebClientResponseException.GatewayTimeout
resilience4j.retry.configs.default.ignoreExceptions=org.springframework.web.reactive.function.client.WebClientResponseException.BadRequest,org.springframework.web.reactive.function.client.WebClientResponseException.NotFound

resilience4j.retry.instances.merchandise.baseConfig=default
resilience4j.retry.instances.price.baseConfig=default
resilience4j.retry.instances.inventory.baseConfig=default

# --- Timeout Configuration ---
resilience4j.timelimiter.configs.default.timeoutDuration=2s
resilience4j.timelimiter.configs.default.cancelRunningFuture=true

resilience4j.timelimiter.instances.merchandise.baseConfig=default
resilience4j.timelimiter.instances.price.baseConfig=default
resilience4j.timelimiter.instances.inventory.baseConfig=default

# --- Bulkhead (concurrency limiting) ---
resilience4j.bulkhead.configs.default.maxConcurrentCalls=25
resilience4j.bulkhead.configs.default.maxWaitDuration=0s

resilience4j.bulkhead.instances.merchandise.baseConfig=default
resilience4j.bulkhead.instances.price.baseConfig=default
resilience4j.bulkhead.instances.inventory.baseConfig=default

# --- Actuator Endpoints ---
management.health.circuitbreakers.enabled=true
management.endpoints.web.exposure.include=health,info,metrics,prometheus,circuitbreakers,retries
management.endpoint.health.show-details=always
```

---

## Phase 2: Repository Layer Resilience

### 2.1 Create Resilience Wrapper Service

**File:** `src/main/java/org/example/reactivetest/resilience/ReactiveResilience.java`

Wrapper that applies Resilience4j decorators to reactive streams:
- Circuit breaker (fail fast when service is down)
- Retry (automatic retry with exponential backoff)
- Timeout (prevent hanging calls)
- Bulkhead (limit concurrent calls)

```java
@Component
public class ReactiveResilience {
    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final RetryRegistry retryRegistry;
    private final TimeLimiterRegistry timeLimiterRegistry;
    private final BulkheadRegistry bulkheadRegistry;

    public <T> Mono<T> decorate(String name, Mono<T> mono) {
        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker(name);
        Retry retry = retryRegistry.retry(name);
        TimeLimiter timeLimiter = timeLimiterRegistry.timeLimiter(name);
        Bulkhead bulkhead = bulkheadRegistry.bulkhead(name);

        return mono
            .transformDeferred(TimeLimiterOperator.of(timeLimiter))
            .transformDeferred(CircuitBreakerOperator.of(cb))
            .transformDeferred(RetryOperator.of(retry))
            .transformDeferred(BulkheadOperator.of(bulkhead));
    }
}
```

### 2.2 Update Repositories with Resilience

**Files:**
- `src/main/java/org/example/reactivetest/repository/merchandise/MerchandiseRepository.java`
- `src/main/java/org/example/reactivetest/repository/price/PriceRepository.java`
- `src/main/java/org/example/reactivetest/repository/inventory/InventoryRepository.java`

Example for PriceRepository:
```java
@Repository
public class PriceRepository {
    private final WebClient priceWebClient;
    private final ReactiveResilience resilience;

    public Mono<PriceResponse> getPrice(long sku) {
        Mono<PriceResponse> call = priceWebClient.post()
            .uri("/price")
            .bodyValue(new PriceRequest(sku))
            .retrieve()
            .bodyToMono(PriceResponse.class);

        return resilience.decorate("price", call);
    }
}
```

---

## Phase 3: Error Handling & Fallbacks

### 3.1 Create Error Response Model

**File:** `src/main/java/org/example/reactivetest/error/ErrorResponse.java`

```java
public record ErrorResponse(
    String error,
    String message,
    String path,
    int status,
    String traceId,
    Map<String, Object> details
) {}
```

### 3.2 Create Global Error Handler

**File:** `src/main/java/org/example/reactivetest/error/GlobalErrorHandler.java`

Handle specific exceptions with structured JSON responses:
- `CallNotPermittedException` → 503 Service Unavailable (circuit open)
- `TimeoutException` → 504 Gateway Timeout
- `BulkheadFullException` → 503 Service Unavailable (too many requests)
- `WebClientResponseException` → Pass through upstream status
- Generic exceptions → 500 Internal Server Error

### 3.3 Add Fallback Responses to ProductService

**File:** `src/main/java/org/example/reactivetest/service/ProductService.java`

```java
public Mono<Product> getProduct(long sku) {
    return Mono.zip(
        merchandiseRepository.getDescription(sku)
            .onErrorResume(this::handleMerchandiseError),
        priceRepository.getPrice(sku)
            .onErrorResume(this::handlePriceError),
        inventoryRepository.getAvailability(sku)
            .onErrorResume(this::handleInventoryError)
    )
    .map(tuple -> new Product(...));
}

private Mono<MerchandiseResponse> handleMerchandiseError(Throwable t) {
    logError("merchandise", t);
    return Mono.just(new MerchandiseResponse("Description unavailable"));
}

private Mono<PriceResponse> handlePriceError(Throwable t) {
    logError("price", t);
    return Mono.just(new PriceResponse("0.00")); // Or Mono.error() to fail request
}

private Mono<InventoryResponse> handleInventoryError(Throwable t) {
    logError("inventory", t);
    return Mono.just(new InventoryResponse(0));
}
```

### 3.4 Add Error Logging to StructuredLogger

**File:** `src/main/java/org/example/reactivetest/logging/StructuredLogger.java`

Add `logError()` method for structured error logging:
```java
public void logError(Context ctx, String loggerName, String service, Throwable error, String message) {
    // Log with error type, message, circuit breaker state, retry count
}
```

**File:** `src/main/java/org/example/reactivetest/logging/ErrorLogData.java`

```java
public record ErrorLogData(
    String service,
    String errorType,
    String errorMessage,
    String circuitBreakerState,
    int retryAttempt
) {}
```

---

## Phase 4: Chaos Testing with WireMock

### 4.1 Add Chaos Stub Mappings

Create scenario-based stubs that introduce failures:

**File:** `perf-test/wiremock/mappings/price-chaos.json`

```json
{
  "scenarioName": "price-chaos",
  "requiredScenarioState": "error",
  "request": {
    "method": "POST",
    "urlPath": "/price"
  },
  "response": {
    "status": 500,
    "headers": { "Content-Type": "application/json" },
    "jsonBody": { "error": "Internal Server Error" }
  }
}
```

**File:** `perf-test/wiremock/mappings/merchandise-timeout.json`

```json
{
  "scenarioName": "merchandise-chaos",
  "requiredScenarioState": "timeout",
  "request": {
    "method": "GET",
    "urlPathPattern": "/merchandise/.*"
  },
  "response": {
    "status": 200,
    "fixedDelayMilliseconds": 5000,
    "jsonBody": { "description": "Delayed response" }
  }
}
```

### 4.2 Create Chaos Controller for WireMock

**File:** `perf-test/k6/chaos-controller.js`

K6 helper module to toggle WireMock chaos scenarios via API:
```javascript
export function enableChaos(service, scenario) {
  http.put(`${WIREMOCK_URL}/__admin/scenarios/${service}-chaos/state`,
    JSON.stringify({ state: scenario }));
}

export function disableChaos(service) {
  http.put(`${WIREMOCK_URL}/__admin/scenarios/${service}-chaos/state`,
    JSON.stringify({ state: "Started" }));
}
```

### 4.3 Update WireMock Stubs with Fault Injection

**File:** `perf-test/wiremock/mappings/price.json` (updated)

```json
{
  "mappings": [
    {
      "name": "price-success",
      "priority": 10,
      "request": { "method": "POST", "urlPath": "/price" },
      "response": {
        "status": 200,
        "jsonBody": { "price": "{{randomValue type='NUMERIC' length=2}}.99" },
        "transformers": ["response-template"],
        "delayDistribution": { "type": "lognormal", "median": 30, "sigma": 0.4 }
      }
    },
    {
      "name": "price-500",
      "priority": 5,
      "scenarioName": "price-chaos",
      "requiredScenarioState": "500",
      "request": { "method": "POST", "urlPath": "/price" },
      "response": { "status": 500, "jsonBody": { "error": "Internal Server Error" } }
    },
    {
      "name": "price-timeout",
      "priority": 5,
      "scenarioName": "price-chaos",
      "requiredScenarioState": "timeout",
      "request": { "method": "POST", "urlPath": "/price" },
      "response": { "status": 200, "fixedDelayMilliseconds": 10000 }
    },
    {
      "name": "price-503",
      "priority": 5,
      "scenarioName": "price-chaos",
      "requiredScenarioState": "503",
      "request": { "method": "POST", "urlPath": "/price" },
      "response": { "status": 503, "jsonBody": { "error": "Service Unavailable" } }
    }
  ]
}
```

---

## Phase 5: Chaos Test Scenarios

### 5.1 Create Resilience Test Script

**File:** `perf-test/k6/resilience-test.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { enableChaos, disableChaos } from './chaos-controller.js';

export const options = {
  scenarios: {
    // Baseline: All services healthy
    baseline: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      startTime: '0s',
    },
    // Chaos: Price service returns 500s
    price_errors: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      startTime: '35s',
      exec: 'priceErrorScenario',
    },
    // Chaos: Merchandise timeout
    merchandise_timeout: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      startTime: '70s',
      exec: 'merchandiseTimeoutScenario',
    },
    // Chaos: All services degraded
    full_chaos: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      startTime: '105s',
      exec: 'fullChaosScenario',
    },
    // Recovery: Back to healthy
    recovery: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      startTime: '140s',
    },
  },
  thresholds: {
    // During chaos, allow higher failure rates
    'http_req_failed{scenario:baseline}': ['rate<0.01'],
    'http_req_failed{scenario:recovery}': ['rate<0.05'],
    // Chaos scenarios expect some failures but should recover
    'http_req_failed{scenario:price_errors}': ['rate<0.30'],
    'http_req_failed{scenario:merchandise_timeout}': ['rate<0.30'],
  },
};

export function setup() {
  // Reset all chaos scenarios
  disableChaos('price');
  disableChaos('merchandise');
  disableChaos('inventory');
}

export default function() {
  // Normal operation
  const res = http.get(`${BASE_URL}/products/${randomSku()}`);
  check(res, { 'status is 200': (r) => r.status === 200 });
}

export function priceErrorScenario() {
  enableChaos('price', '500');
  const res = http.get(`${BASE_URL}/products/${randomSku()}`);
  // With fallback: still 200 but degraded response
  // Without fallback: expect 503 or partial failure
  check(res, {
    'response received': (r) => r.status === 200 || r.status === 503,
  });
}

export function merchandiseTimeoutScenario() {
  enableChaos('merchandise', 'timeout');
  const res = http.get(`${BASE_URL}/products/${randomSku()}`);
  check(res, {
    'response within timeout': (r) => r.timings.duration < 3000,
  });
}

export function fullChaosScenario() {
  enableChaos('price', '500');
  enableChaos('merchandise', 'timeout');
  enableChaos('inventory', '503');
  const res = http.get(`${BASE_URL}/products/${randomSku()}`);
  check(res, {
    'graceful degradation': (r) => r.status === 200 || r.status === 503,
  });
}

export function teardown() {
  disableChaos('price');
  disableChaos('merchandise');
  disableChaos('inventory');
}
```

### 5.2 Add Circuit Breaker Test

**File:** `perf-test/k6/circuit-breaker-test.js`

Verify circuit breaker behavior:
1. Send requests until circuit opens (50% failure rate)
2. Verify fast-fail when circuit is open
3. Wait for half-open transition
4. Verify recovery when service is healthy

### 5.3 Add Retry Verification Test

**File:** `perf-test/k6/retry-test.js`

Test retry behavior:
1. Enable intermittent failures (503s)
2. Verify requests eventually succeed
3. Check retry metrics in Prometheus

---

## Phase 6: Observability Updates

### 6.1 Add Resilience4j Metrics to Grafana

**File:** `docker/grafana/provisioning/dashboards/reactive-test.json` (updates)

Add panels for:
- Circuit breaker state (closed/open/half-open) per service
- Circuit breaker failure rate
- Retry attempts and success rate
- Bulkhead available/rejected calls
- Timeout rate per service

Example PromQL queries:
```promql
# Circuit breaker state
resilience4j_circuitbreaker_state{application="reactive-test"}

# Failure rate
rate(resilience4j_circuitbreaker_calls_total{kind="failed"}[1m]) /
rate(resilience4j_circuitbreaker_calls_total[1m])

# Retry count
sum(rate(resilience4j_retry_calls_total{kind="successful_with_retry"}[1m])) by (name)
```

### 6.2 Add Structured Logging for Resilience Events

Log events for:
- Circuit breaker state transitions
- Retry attempts (with attempt number)
- Timeout occurrences
- Fallback activations

---

## Phase 7: Docker Compose Updates

### 7.1 Update docker-compose.yml

Add chaos test profile:

```yaml
  k6-chaos:
    image: grafana/k6:0.55.0
    container_name: k6-chaos
    volumes:
      - ../perf-test/k6:/scripts:ro
      - ../perf-test/data:/data:ro
    environment:
      - K6_OUT=experimental-prometheus-rw
      - K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write
      - BASE_URL=http://reactive-test:8080
      - WIREMOCK_URL=http://wiremock:8080
    command: run /scripts/resilience-test.js
    profiles:
      - chaos
    networks:
      - observability
```

### 7.2 Add Chaos Test Runner Script

**File:** `docker/run-chaos-test.sh`

```bash
#!/bin/bash
# Run chaos tests and generate report

docker compose up -d
docker compose --profile chaos up k6-chaos
docker compose logs reactive-test > chaos-test-logs.txt

# Extract resilience metrics
curl -s http://localhost:9090/api/v1/query?query=resilience4j_circuitbreaker_state
```

---

## Task Checklist

### Phase 1: Setup
- [ ] Add Resilience4j dependencies to build.gradle
- [ ] Add Resilience4j configuration to application.properties
- [ ] Verify application starts with new dependencies

### Phase 2: Repository Layer
- [ ] Create ReactiveResilience wrapper component
- [ ] Update MerchandiseRepository with resilience decorators
- [ ] Update PriceRepository with resilience decorators
- [ ] Update InventoryRepository with resilience decorators
- [ ] Verify WebClient calls are wrapped

### Phase 3: Error Handling
- [ ] Create ErrorResponse record
- [ ] Create GlobalErrorHandler with @ControllerAdvice
- [ ] Add fallback methods to ProductService
- [ ] Add error logging to StructuredLogger
- [ ] Create ErrorLogData record

### Phase 4: WireMock Chaos Stubs
- [ ] Update price.json with chaos scenarios
- [ ] Update merchandise.json with chaos scenarios
- [ ] Update inventory.json with chaos scenarios
- [ ] Create chaos-controller.js helper module
- [ ] Test chaos scenario toggling via WireMock API

### Phase 5: Chaos Tests
- [ ] Create resilience-test.js with multi-scenario test
- [ ] Create circuit-breaker-test.js
- [ ] Create retry-test.js
- [ ] Update load-test.js thresholds for chaos tolerance
- [ ] Verify tests run in Docker

### Phase 6: Observability
- [ ] Add Resilience4j metrics panels to Grafana dashboard
- [ ] Add circuit breaker state visualization
- [ ] Add retry metrics visualization
- [ ] Verify metrics appear in Prometheus

### Phase 7: Integration
- [ ] Update docker-compose.yml with chaos profile
- [ ] Create run-chaos-test.sh script
- [ ] Update README with chaos testing instructions
- [ ] Run full chaos test suite
- [ ] Verify circuit breaker opens and closes correctly
- [ ] Verify retries work with intermittent failures
- [ ] Verify timeouts prevent hanging requests

---

## Success Criteria

1. **Circuit Breaker**: Opens after 50% failure rate, recovers when service is healthy
2. **Retry**: Succeeds on transient failures within 3 attempts
3. **Timeout**: Fails fast at 2s instead of waiting indefinitely
4. **Fallback**: Returns degraded response instead of error when possible
5. **Metrics**: All resilience events visible in Grafana
6. **Logs**: Structured JSON logs for all resilience events with trace correlation

---

## Reference Documentation

- [Resilience4j Spring Boot 3](https://resilience4j.readme.io/docs/getting-started-3)
- [Resilience4j with Reactor](https://resilience4j.readme.io/docs/getting-started-6)
- [WireMock Fault Injection](https://wiremock.org/docs/simulating-faults/)
- [WireMock Scenarios](https://wiremock.org/docs/stateful-behaviour/)
- [k6 Scenarios](https://k6.io/docs/using-k6/scenarios/)
