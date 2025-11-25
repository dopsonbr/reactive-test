 # Implementation Plan

## Phase 1: Project Infrastructure

### 1.1 Add Dependencies
**File:** `build.gradle`
```groovy
dependencies {
    // Existing
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'org.springframework.boot:spring-boot-starter-webflux'

    // Add for JSON logging
    implementation 'net.logstash.logback:logstash-logback-encoder:7.4'

    // Add for context propagation (Reactor Context ↔ MDC)
    implementation 'io.micrometer:context-propagation'
}
```

### 1.2 Configure Logging
**File:** `src/main/resources/logback-spring.xml`
- JSON output to `logs/application.log`
- Console output for development

### 1.3 Configure External Services
**File:** `src/main/resources/application.properties`
```properties
services.merchandise.base-url=http://localhost:8081
services.price.base-url=http://localhost:8081
services.inventory.base-url=http://localhost:8081
```

---

## Phase 2: Domain & Context

### 2.1 Request Metadata
**File:** `src/main/java/org/example/reactivetest/context/RequestMetadata.java`
```java
public record RequestMetadata(
    int storeNumber,
    String orderNumber,
    String userId,
    String sessionId
) {}
```

### 2.2 Context Key
**File:** `src/main/java/org/example/reactivetest/context/ContextKeys.java`
```java
public final class ContextKeys {
    public static final String METADATA = "requestMetadata";
    private ContextKeys() {}
}
```

### 2.3 Domain Model
**File:** `src/main/java/org/example/reactivetest/domain/Product.java`
```java
public record Product(
    long sku,
    String description,
    String price,
    int availableQuantity
) {}
```

---

## Phase 3: Logging Infrastructure

### 3.1 Structured Logger
**File:** `src/main/java/org/example/reactivetest/logging/StructuredLogger.java`

Utility class that:
- Extracts metadata from Reactor Context
- Outputs structured JSON logs
- Methods: `logRequest()`, `logResponse()`, `logMessage()`

```java
public class StructuredLogger {
    private final ObjectMapper objectMapper;
    private final Logger logger;

    public void logRequest(ContextView ctx, String loggerName, RequestLogData data) {
        RequestMetadata metadata = ctx.get(ContextKeys.METADATA);
        LogEntry entry = new LogEntry("info", loggerName, metadata, data);
        logger.info(objectMapper.writeValueAsString(entry));
    }
}
```

### 3.2 Log Data Models
**File:** `src/main/java/org/example/reactivetest/logging/LogEntry.java`
```java
public record LogEntry(
    String level,
    String logger,
    RequestMetadata metadata,
    Object data
) {}

public record RequestLogData(
    String type,      // "request"
    String path,
    String uri,
    String method,
    Object headers,
    Object payload
) {}

public record ResponseLogData(
    String type,      // "response"
    String path,
    String uri,
    String method,
    int status,
    Object headers,
    Object payload
) {}

public record MessageLogData(
    String message
) {}
```

---

## Phase 4: WebClient Configuration

### 4.1 Logging Filter (ExchangeFilterFunction)
**File:** `src/main/java/org/example/reactivetest/config/WebClientLoggingFilter.java`

This filter reads from Reactor Context and logs all outbound requests/responses:

```java
@Component
public class WebClientLoggingFilter {

    public ExchangeFilterFunction filter(String repositoryName) {
        return (request, next) -> Mono.deferContextual(ctx -> {
            // Log outbound request with metadata from context
            logOutboundRequest(ctx, repositoryName, request);

            return next.exchange(request)
                .flatMap(response -> {
                    // Log response with metadata from context
                    return logOutboundResponse(ctx, repositoryName, request, response);
                });
        });
    }
}
```

### 4.2 WebClient Beans
**File:** `src/main/java/org/example/reactivetest/config/WebClientConfig.java`

```java
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient merchandiseWebClient(
        @Value("${services.merchandise.base-url}") String baseUrl,
        WebClientLoggingFilter loggingFilter
    ) {
        return WebClient.builder()
            .baseUrl(baseUrl)
            .filter(loggingFilter.filter("merchandiserepository"))
            .build();
    }

    @Bean
    public WebClient priceWebClient(
        @Value("${services.price.base-url}") String baseUrl,
        WebClientLoggingFilter loggingFilter
    ) {
        return WebClient.builder()
            .baseUrl(baseUrl)
            .filter(loggingFilter.filter("pricerepository"))
            .build();
    }

    @Bean
    public WebClient inventoryWebClient(
        @Value("${services.inventory.base-url}") String baseUrl,
        WebClientLoggingFilter loggingFilter
    ) {
        return WebClient.builder()
            .baseUrl(baseUrl)
            .filter(loggingFilter.filter("inventoryrepository"))
            .build();
    }
}
```

---

## Phase 5: Repository Layer

Repositories are now simple - logging handled by WebClient filter.

### 5.1 Merchandise Repository
**Files:**
- `repository/merchandise/MerchandiseResponse.java`
- `repository/merchandise/MerchandiseRepository.java`

```java
public record MerchandiseResponse(String description) {}

@Repository
public class MerchandiseRepository {
    private final WebClient merchandiseWebClient;

    public Mono<MerchandiseResponse> getDescription(long sku) {
        return merchandiseWebClient.get()
            .uri("/merchandise/{sku}", sku)
            .retrieve()
            .bodyToMono(MerchandiseResponse.class);
    }
}
```

### 5.2 Price Repository
**Files:**
- `repository/price/PriceRequest.java`
- `repository/price/PriceResponse.java`
- `repository/price/PriceRepository.java`

```java
public record PriceRequest(long sku) {}
public record PriceResponse(String price) {}

@Repository
public class PriceRepository {
    private final WebClient priceWebClient;

    public Mono<PriceResponse> getPrice(long sku) {
        return priceWebClient.post()
            .uri("/price")
            .bodyValue(new PriceRequest(sku))
            .retrieve()
            .bodyToMono(PriceResponse.class);
    }
}
```

### 5.3 Inventory Repository
**Files:**
- `repository/inventory/InventoryRequest.java`
- `repository/inventory/InventoryResponse.java`
- `repository/inventory/InventoryRepository.java`

```java
public record InventoryRequest(long sku) {}
public record InventoryResponse(int availableQuantity) {}

@Repository
public class InventoryRepository {
    private final WebClient inventoryWebClient;

    public Mono<InventoryResponse> getAvailability(long sku) {
        return inventoryWebClient.post()
            .uri("/inventory")
            .bodyValue(new InventoryRequest(sku))
            .retrieve()
            .bodyToMono(InventoryResponse.class);
    }
}
```

---

## Phase 6: Service Layer

### 6.1 Product Service
**File:** `src/main/java/org/example/reactivetest/service/ProductService.java`

```java
@Service
public class ProductService {
    private final MerchandiseRepository merchandiseRepository;
    private final PriceRepository priceRepository;
    private final InventoryRepository inventoryRepository;
    private final StructuredLogger structuredLogger;

    public Mono<Product> getProduct(long sku) {
        return Mono.deferContextual(ctx -> {
            structuredLogger.logMessage(ctx, "productservice", "Starting product fetch");

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
                structuredLogger.logMessage(ctx, "productservice", "Product fetch complete")
            );
        });
    }
}
```

---

## Phase 7: Controller Layer

### 7.1 Product Controller
**File:** `src/main/java/org/example/reactivetest/controller/ProductController.java`

```java
@RestController
@RequestMapping("/products")
public class ProductController {
    private final ProductService productService;
    private final StructuredLogger structuredLogger;

    @GetMapping("/{sku}")
    public Mono<Product> getProduct(
        @PathVariable long sku,
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        ServerHttpRequest request
    ) {
        RequestMetadata metadata = new RequestMetadata(
            storeNumber, orderNumber, userId, sessionId
        );

        return Mono.deferContextual(ctx -> {
            // Log inbound request
            structuredLogger.logRequest(ctx, "productscontroller", request, sku);

            return productService.getProduct(sku)
                .doOnSuccess(product ->
                    // Log outbound response
                    structuredLogger.logResponse(ctx, "productscontroller", request, 200, product)
                );
        })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }
}
```

---

## Phase 8: Performance Test Infrastructure

### 8.1 Node.js Setup
**File:** `perf-test/package.json`
```json
{
  "name": "reactive-test-perf",
  "type": "module",
  "scripts": {
    "test": "node src/index.js",
    "generate": "node src/generate-input.js",
    "validate": "node src/validate-logs.js"
  },
  "dependencies": {
    "uuid": "^11.0.0"
  }
}
```

### 8.2 Configuration
**File:** `perf-test/config.json`

### 8.3 Input Generator
**File:** `perf-test/src/generate-input.js`

### 8.4 k6 Script
**File:** `perf-test/k6/load-test.js`

### 8.5 WireMock Stubs
**Files:** `perf-test/wiremock/mappings/*.json`

### 8.6 Log Validator
**File:** `perf-test/src/validate-logs.js`

### 8.7 Orchestrator
**File:** `perf-test/src/index.js`

---

## File Summary

### Java Files (17 files)
```
src/main/java/org/example/reactivetest/
├── config/
│   ├── WebClientConfig.java
│   └── WebClientLoggingFilter.java
├── context/
│   ├── RequestMetadata.java
│   └── ContextKeys.java
├── controller/
│   └── ProductController.java
├── domain/
│   └── Product.java
├── logging/
│   ├── StructuredLogger.java
│   ├── LogEntry.java
│   ├── RequestLogData.java
│   ├── ResponseLogData.java
│   └── MessageLogData.java
├── repository/
│   ├── merchandise/
│   │   ├── MerchandiseRepository.java
│   │   └── MerchandiseResponse.java
│   ├── price/
│   │   ├── PriceRepository.java
│   │   ├── PriceRequest.java
│   │   └── PriceResponse.java
│   └── inventory/
│       ├── InventoryRepository.java
│       ├── InventoryRequest.java
│       └── InventoryResponse.java
├── service/
│   └── ProductService.java
└── ReactiveTestApplication.java (existing)

src/main/resources/
├── application.properties (modify)
└── logback-spring.xml (new)
```

### Test Infrastructure Files (9 files)
```
perf-test/
├── package.json
├── config.json
├── src/
│   ├── index.js
│   ├── generate-input.js
│   └── validate-logs.js
├── k6/
│   └── load-test.js
└── wiremock/
    └── mappings/
        ├── merchandise.json
        ├── price.json
        └── inventory.json
```

---

## Implementation Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
  │          │          │          │          │          │          │          │
  ▼          ▼          ▼          ▼          ▼          ▼          ▼          ▼
Deps      Domain     Logger    WebClient   Repos     Service    Controller  Perf
Config    Context    Models    Filter+Cfg  (simple)  (zip)      (context)   Test
```

Each phase can be tested independently before moving to the next.