# 005: Micrometer Context Propagation Refactoring Plan

## Overview

This plan outlines the migration from explicit Reactor Context propagation to automatic context propagation using Micrometer's `context-propagation` library. This will simplify the codebase, improve maintainability, and align with Spring Boot 3.x best practices.

## Current State

### How Context Propagation Works Today

1. **Controller Layer** (`ProductController.java:40-66`)
   - Extracts headers: `x-store-number`, `x-order-number`, `x-userid`, `x-sessionid`
   - Creates `RequestMetadata` record
   - Writes to Reactor Context via `.contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata))`

2. **Service/Repository Layers**
   - Access context via `Mono.deferContextual(ctx -> {...})`
   - Pass `ContextView` to `StructuredLogger` methods
   - Every log call requires explicit context parameter

3. **Logging** (`StructuredLogger.java:62-86`)
   - Receives `ContextView` as parameter
   - Extracts `RequestMetadata` via `ctx.getOrDefault(ContextKeys.METADATA, null)`
   - Manually extracts OpenTelemetry trace context via `Span.current().getSpanContext()`

### Current Dependencies
```gradle
implementation 'io.micrometer:context-propagation'  // Already present
implementation 'io.opentelemetry:opentelemetry-api:1.44.1'
```

### Pain Points
- Verbose code with `Mono.deferContextual()` everywhere
- Every logging method requires `ContextView` parameter
- Manual context extraction scattered throughout codebase
- Difficult to add new context fields (requires changes in many places)
- Cannot use standard logging patterns or MDC-based log appenders

---

## Target State

### Automatic Context Propagation Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HTTP Request                                       │
│  Headers: x-store-number, x-order-number, x-userid, x-sessionid, traceparent │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RequestContextFilter (WebFilter)                          │
│  1. Extract headers                                                          │
│  2. Set ThreadLocal values (MDC)                                            │
│  3. Reactor auto-propagates ThreadLocal ↔ Context                           │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Controller    │       │    Service      │       │   Repository    │
│                 │       │                 │       │                 │
│ MDC.get("...")  │       │ MDC.get("...")  │       │ MDC.get("...")  │
│ Logger.info()   │       │ Logger.info()   │       │ Logger.info()   │
│ (auto-enriched) │       │ (auto-enriched) │       │ (auto-enriched) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Key Benefits
1. **No manual context passing** - MDC values propagate automatically
2. **Standard SLF4J logging** - Use `log.info()` directly, MDC enriches logs
3. **Simplified code** - Remove all `Mono.deferContextual()` wrappers for context access
4. **Easy to extend** - Add new context fields by registering ThreadLocalAccessor
5. **Framework alignment** - Follows Spring Boot 3.x observability patterns

---

## Implementation Plan

### Phase 1: Enable Automatic Context Propagation

#### 1.1 Update `application.yml`

Add Spring Reactor context propagation setting:

```yaml
spring:
  application:
    name: reactive-test
  reactor:
    context-propagation: auto  # NEW: Enable automatic propagation
```

#### 1.2 Register Custom ThreadLocalAccessors

Create a new configuration class to register custom context fields:

**New File: `src/main/java/org/example/reactivetest/config/ContextPropagationConfig.java`**

```java
package org.example.reactivetest.config;

import io.micrometer.context.ContextRegistry;
import jakarta.annotation.PostConstruct;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

@Component
public class ContextPropagationConfig {

    // MDC keys for request metadata
    public static final String MDC_STORE_NUMBER = "storeNumber";
    public static final String MDC_ORDER_NUMBER = "orderNumber";
    public static final String MDC_USER_ID = "userId";
    public static final String MDC_SESSION_ID = "sessionId";

    @PostConstruct
    public void registerThreadLocalAccessors() {
        ContextRegistry registry = ContextRegistry.getInstance();

        registry.registerThreadLocalAccessor(
            MDC_STORE_NUMBER,
            () -> MDC.get(MDC_STORE_NUMBER),
            value -> MDC.put(MDC_STORE_NUMBER, value),
            () -> MDC.remove(MDC_STORE_NUMBER)
        );

        registry.registerThreadLocalAccessor(
            MDC_ORDER_NUMBER,
            () -> MDC.get(MDC_ORDER_NUMBER),
            value -> MDC.put(MDC_ORDER_NUMBER, value),
            () -> MDC.remove(MDC_ORDER_NUMBER)
        );

        registry.registerThreadLocalAccessor(
            MDC_USER_ID,
            () -> MDC.get(MDC_USER_ID),
            value -> MDC.put(MDC_USER_ID, value),
            () -> MDC.remove(MDC_USER_ID)
        );

        registry.registerThreadLocalAccessor(
            MDC_SESSION_ID,
            () -> MDC.get(MDC_SESSION_ID),
            value -> MDC.put(MDC_SESSION_ID, value),
            () -> MDC.remove(MDC_SESSION_ID)
        );
    }
}
```

---

### Phase 2: Create WebFilter for Context Initialization

Replace the controller-level context writing with a WebFilter that sets MDC values at the request boundary.

**New File: `src/main/java/org/example/reactivetest/filter/RequestContextFilter.java`**

```java
package org.example.reactivetest.filter;

import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import static org.example.reactivetest.config.ContextPropagationConfig.*;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestContextFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // Extract headers
        String storeNumber = request.getHeaders().getFirst("x-store-number");
        String orderNumber = request.getHeaders().getFirst("x-order-number");
        String userId = request.getHeaders().getFirst("x-userid");
        String sessionId = request.getHeaders().getFirst("x-sessionid");

        // Set MDC values - these will auto-propagate through reactive chain
        if (storeNumber != null) MDC.put(MDC_STORE_NUMBER, storeNumber);
        if (orderNumber != null) MDC.put(MDC_ORDER_NUMBER, orderNumber);
        if (userId != null) MDC.put(MDC_USER_ID, userId);
        if (sessionId != null) MDC.put(MDC_SESSION_ID, sessionId);

        return chain.filter(exchange)
            .doFinally(signalType -> {
                // Clean up MDC after request completes
                MDC.remove(MDC_STORE_NUMBER);
                MDC.remove(MDC_ORDER_NUMBER);
                MDC.remove(MDC_USER_ID);
                MDC.remove(MDC_SESSION_ID);
            });
    }
}
```

---

### Phase 3: Simplify StructuredLogger

Remove `ContextView` parameters and use MDC directly.

**Refactor: `src/main/java/org/example/reactivetest/logging/StructuredLogger.java`**

```java
package org.example.reactivetest.logging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import static org.example.reactivetest.config.ContextPropagationConfig.*;

@Component
public class StructuredLogger {

    private static final Logger log = LoggerFactory.getLogger(StructuredLogger.class);
    private final ObjectMapper objectMapper;

    public StructuredLogger(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // NEW: Simplified API without ContextView parameter
    public void logRequest(String loggerName, RequestLogData data) {
        log(loggerName, "info", data);
    }

    public void logResponse(String loggerName, ResponseLogData data) {
        log(loggerName, "info", data);
    }

    public void logMessage(String loggerName, String message) {
        log(loggerName, "info", new MessageLogData(message));
    }

    public void logError(String loggerName, ErrorLogData data) {
        log(loggerName, "error", data);
    }

    public void logError(String loggerName, String service, Throwable error, String circuitBreakerState) {
        ErrorLogData data = new ErrorLogData(
            service,
            error.getClass().getSimpleName(),
            error.getMessage(),
            circuitBreakerState
        );
        log(loggerName, "error", data);
    }

    private void log(String loggerName, String level, Object data) {
        // Extract context from MDC (auto-propagated)
        RequestMetadata metadata = extractMetadataFromMdc();

        // Extract trace context from OpenTelemetry
        String traceId = null;
        String spanId = null;
        SpanContext spanContext = Span.current().getSpanContext();
        if (spanContext.isValid()) {
            traceId = spanContext.getTraceId();
            spanId = spanContext.getSpanId();
        }

        LogEntry entry = new LogEntry(level, loggerName, traceId, spanId, metadata, data);

        try {
            String json = objectMapper.writeValueAsString(entry);
            if ("error".equals(level)) {
                log.error(json);
            } else {
                log.info(json);
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize log entry", e);
        }
    }

    private RequestMetadata extractMetadataFromMdc() {
        String storeNumberStr = MDC.get(MDC_STORE_NUMBER);
        int storeNumber = storeNumberStr != null ? Integer.parseInt(storeNumberStr) : 0;

        return new RequestMetadata(
            storeNumber,
            MDC.get(MDC_ORDER_NUMBER),
            MDC.get(MDC_USER_ID),
            MDC.get(MDC_SESSION_ID)
        );
    }
}
```

---

### Phase 4: Refactor Controllers

Remove `contextWrite()` calls and simplify controller logic.

**Refactor: `src/main/java/org/example/reactivetest/controller/ProductController.java`**

```java
package org.example.reactivetest.controller;

import org.example.reactivetest.domain.Product;
import org.example.reactivetest.logging.StructuredLogger;
import org.example.reactivetest.service.ProductService;
import org.example.reactivetest.validation.RequestValidator;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/products")
public class ProductController {

    private static final String LOGGER_NAME = "ProductController";

    private final ProductService productService;
    private final RequestValidator requestValidator;
    private final StructuredLogger structuredLogger;

    public ProductController(ProductService productService,
                            RequestValidator requestValidator,
                            StructuredLogger structuredLogger) {
        this.productService = productService;
        this.requestValidator = requestValidator;
        this.structuredLogger = structuredLogger;
    }

    @GetMapping("/{sku}")
    public Mono<Product> getProduct(
        @PathVariable long sku,
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        ServerHttpRequest request
    ) {
        // Validation still happens, but context is already set by WebFilter
        return requestValidator.validateProductRequest(sku, storeNumber, orderNumber, userId, sessionId)
            .then(Mono.defer(() -> {
                // Log inbound request - no context parameter needed
                structuredLogger.logInboundRequest(LOGGER_NAME, request);

                return productService.getProduct(sku)
                    .doOnSuccess(product ->
                        structuredLogger.logMessage(LOGGER_NAME, "Product fetched successfully for sku: " + sku)
                    );
            }));
        // NO .contextWrite() needed - WebFilter already set MDC values
    }
}
```

---

### Phase 5: Refactor Services and Repositories

Remove `Mono.deferContextual()` wrappers used solely for context access.

**Refactor: `src/main/java/org/example/reactivetest/service/ProductService.java`**

```java
package org.example.reactivetest.service;

import org.example.reactivetest.domain.Product;
import org.example.reactivetest.logging.StructuredLogger;
import org.example.reactivetest.repository.inventory.InventoryRepository;
import org.example.reactivetest.repository.merchandise.MerchandiseRepository;
import org.example.reactivetest.repository.price.PriceRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ProductService {

    private static final String LOGGER_NAME = "ProductService";

    private final MerchandiseRepository merchandiseRepository;
    private final PriceRepository priceRepository;
    private final InventoryRepository inventoryRepository;
    private final StructuredLogger structuredLogger;

    public ProductService(MerchandiseRepository merchandiseRepository,
                         PriceRepository priceRepository,
                         InventoryRepository inventoryRepository,
                         StructuredLogger structuredLogger) {
        this.merchandiseRepository = merchandiseRepository;
        this.priceRepository = priceRepository;
        this.inventoryRepository = inventoryRepository;
        this.structuredLogger = structuredLogger;
    }

    public Mono<Product> getProduct(long sku) {
        // Log directly - MDC context auto-propagates
        structuredLogger.logMessage(LOGGER_NAME, "Starting product fetch for sku: " + sku);

        return Mono.zip(
            merchandiseRepository.getDescription(sku),
            priceRepository.getPrice(sku),
            inventoryRepository.getAvailability(sku)
        )
        .map(tuple -> new Product(
            sku,
            tuple.getT1().description(),
            tuple.getT2().price(),
            tuple.getT3().availableQuantity()
        ))
        .doOnSuccess(product ->
            structuredLogger.logMessage(LOGGER_NAME, "Product fetch complete for sku: " + sku)
        );
        // NO Mono.deferContextual() wrapper needed
    }
}
```

**Refactor: `src/main/java/org/example/reactivetest/repository/price/PriceRepository.java`** (error handler)

```java
private Mono<PriceResponse> handleError(Throwable t) {
    // Direct logging - MDC context auto-propagates
    String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
    structuredLogger.logError(LOGGER_NAME, RESILIENCE_NAME, t, cbState);
    return Mono.just(FALLBACK);
    // NO Mono.deferContextual() wrapper needed
}
```

---

### Phase 6: Refactor WebClient Logging Filter

**Refactor: `src/main/java/org/example/reactivetest/config/WebClientLoggingFilter.java`**

```java
package org.example.reactivetest.config;

import org.example.reactivetest.logging.RequestLogData;
import org.example.reactivetest.logging.ResponseLogData;
import org.example.reactivetest.logging.StructuredLogger;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;

@Component
public class WebClientLoggingFilter {

    private final StructuredLogger structuredLogger;

    public WebClientLoggingFilter(StructuredLogger structuredLogger) {
        this.structuredLogger = structuredLogger;
    }

    public ExchangeFilterFunction create(String repositoryName) {
        return (request, next) -> {
            // Log request - MDC context auto-propagates
            logRequest(repositoryName, request);

            return next.exchange(request)
                .doOnNext(response -> logResponse(repositoryName, request, response));
            // NO Mono.deferContextual() wrapper needed
        };
    }

    private void logRequest(String repositoryName, ClientRequest request) {
        String path = request.url().getPath();
        String host = request.url().getHost() + ":" + request.url().getPort();
        String method = request.method().name();

        RequestLogData data = new RequestLogData(path, host, path, method, extractBody(request));
        structuredLogger.logRequest(repositoryName, data);
    }

    private void logResponse(String repositoryName, ClientRequest request, ClientResponse response) {
        ResponseLogData data = new ResponseLogData(
            request.url().getPath(),
            response.statusCode().value()
        );
        structuredLogger.logResponse(repositoryName, data);
    }

    private String extractBody(ClientRequest request) {
        // Implementation unchanged
        return null;
    }
}
```

---

### Phase 7: Update Logback Configuration (Optional Enhancement)

Configure logstash encoder to automatically include MDC fields in JSON output.

**Update: `src/main/resources/logback-spring.xml`** (if exists, or create)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <!-- MDC fields automatically included -->
            <includeMdcKeyName>storeNumber</includeMdcKeyName>
            <includeMdcKeyName>orderNumber</includeMdcKeyName>
            <includeMdcKeyName>userId</includeMdcKeyName>
            <includeMdcKeyName>sessionId</includeMdcKeyName>
            <includeMdcKeyName>traceId</includeMdcKeyName>
            <includeMdcKeyName>spanId</includeMdcKeyName>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>
```

---

### Phase 8: Delete Obsolete Files

Remove files that are no longer needed:

| File | Reason for Deletion |
|------|---------------------|
| `context/ContextKeys.java` | Replaced by MDC key constants in `ContextPropagationConfig` |
| `context/RequestMetadata.java` | Keep for now (used in logging), but can be removed if logs use MDC directly |

---

### Phase 9: Update Tests

Update tests to verify MDC propagation instead of Reactor Context.

**Example Test Update:**

```java
@Test
void shouldPropagateContextThroughReactiveChain() {
    // Given - set up MDC (simulating what WebFilter does)
    MDC.put("storeNumber", "1234");
    MDC.put("orderNumber", "order-123");
    MDC.put("userId", "user01");
    MDC.put("sessionId", "session-456");

    try {
        // When - execute reactive chain
        StepVerifier.create(productService.getProduct(12345L))
            .expectNextMatches(product -> product.sku() == 12345L)
            .verifyComplete();

        // Then - verify logs contain context (check log output or use mock)
        // MDC values should have been present throughout the chain
    } finally {
        MDC.clear();
    }
}
```

---

## Files Changed Summary

### New Files
| File | Purpose |
|------|---------|
| `config/ContextPropagationConfig.java` | Registers ThreadLocalAccessors for custom MDC fields |
| `filter/RequestContextFilter.java` | WebFilter that sets MDC values from request headers |

### Modified Files
| File | Changes |
|------|---------|
| `application.yml` | Add `spring.reactor.context-propagation: auto` |
| `logging/StructuredLogger.java` | Remove `ContextView` parameters, use MDC directly |
| `controller/ProductController.java` | Remove `.contextWrite()`, simplify to direct calls |
| `service/ProductService.java` | Remove `Mono.deferContextual()` wrappers |
| `repository/*/Repository.java` (all 3) | Remove `Mono.deferContextual()` from error handlers |
| `config/WebClientLoggingFilter.java` | Remove `Mono.deferContextual()` wrapper |
| `validation/RequestValidator.java` | Remove context access if present |

### Deleted Files
| File | Reason |
|------|--------|
| `context/ContextKeys.java` | Replaced by constants in `ContextPropagationConfig` |

### Test Updates
| File | Changes |
|------|---------|
| `config/WebClientLoggingFilterTest.java` | Use MDC instead of `.contextWrite()` |
| `controller/ProductControllerTest.java` | Update to not require context setup |
| `service/ProductServiceTest.java` | Use MDC for context setup |

---

## Migration Checklist

- [ ] Add `spring.reactor.context-propagation: auto` to `application.yml`
- [ ] Create `ContextPropagationConfig.java` with ThreadLocalAccessor registrations
- [ ] Create `RequestContextFilter.java` WebFilter
- [ ] Refactor `StructuredLogger.java` to use MDC
- [ ] Refactor `ProductController.java` - remove contextWrite
- [ ] Refactor `ProductService.java` - remove deferContextual
- [ ] Refactor `MerchandiseRepository.java` - remove deferContextual in error handler
- [ ] Refactor `PriceRepository.java` - remove deferContextual in error handler
- [ ] Refactor `InventoryRepository.java` - remove deferContextual in error handler
- [ ] Refactor `WebClientLoggingFilter.java` - remove deferContextual
- [ ] Delete `context/ContextKeys.java`
- [ ] Update all unit tests
- [ ] Update integration tests
- [ ] Run full test suite: `./gradlew test`
- [ ] Run load tests to verify no regression
- [ ] Verify logs contain all context fields in JSON output

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Performance impact of automatic propagation | Profile before/after; the overhead is minimal for most applications |
| Missing context in edge cases | Add comprehensive tests for all reactive paths including error handlers |
| Thread pool exhaustion affecting propagation | Ensure proper cleanup in `doFinally`; test under load |
| OpenTelemetry trace context not propagating | Verify OTel agent or SDK handles its own ThreadLocal propagation |

---

## Rollback Plan

If issues arise after migration:

1. Revert `application.yml` change (remove `context-propagation: auto`)
2. Restore `ContextKeys.java` from git
3. Revert logging/controller/service changes
4. Keep new files (`ContextPropagationConfig`, `RequestContextFilter`) but disable

The new files are additive and won't break existing functionality if automatic propagation is disabled.

---

## Future Enhancements

Once this migration is complete, consider:

1. **Migrate to Micrometer Tracing** - Replace manual OpenTelemetry access with Micrometer Tracing for automatic trace context in MDC
2. **Use standard SLF4J logging** - Replace `StructuredLogger` with native SLF4J + Logstash encoder (MDC auto-included)
3. **Add correlation ID generation** - Generate correlation ID in filter if not provided in headers
4. **Observability auto-instrumentation** - Leverage Spring Boot Actuator's built-in observability features

---

## References

- [Micrometer Context Propagation Docs](https://docs.micrometer.io/context-propagation/reference/)
- [Reactor Context Propagation Support](https://projectreactor.io/docs/core/release/reference/advanced-contextPropagation.html)
- [Spring Blog: Context Propagation Series](https://spring.io/blog/2023/03/28/context-propagation-with-project-reactor-1-the-basics/)
- [Spring Boot 3 Observability](https://spring.io/blog/2022/10/12/observability-with-spring-boot-3/)
