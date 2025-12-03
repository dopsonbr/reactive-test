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

### Controller Layer

Responsibilities:
- HTTP request/response handling
- Request validation (via validators)
- Context extraction from headers
- Delegating to services

```
@RestController
class ProductController {
    private final ProductService service;
    private final RequestValidator validator;

    @GetMapping("/products/{sku}")
    Mono<Product> getProduct(@PathVariable long sku, ServerHttpRequest request) {
        return validator.validate(sku, request.getHeaders())
            .then(service.getProduct(sku));
    }
}
```

### Service Layer

Responsibilities:
- Business logic orchestration
- Aggregating data from multiple repositories
- Transforming domain objects
- No HTTP or framework concerns

```
@Service
class ProductService {
    private final MerchandiseRepository merchandise;
    private final PriceRepository price;
    private final InventoryRepository inventory;

    Mono<Product> getProduct(long sku) {
        return Mono.zip(
            merchandise.getMerchandise(sku),
            price.getPrice(sku),
            inventory.getInventory(sku)
        ).map(tuple -> createProduct(tuple.getT1(), tuple.getT2(), tuple.getT3()));
    }
}
```

### Repository Layer

Responsibilities:
- External service communication (HTTP, Redis, DB)
- Resilience decoration (circuit breaker, retry, timeout)
- Caching logic
- Mapping external responses to domain objects

```
@Repository
class MerchandiseRepository {
    private final WebClient webClient;
    private final ReactiveResilience resilience;
    private final ReactiveCacheService cache;

    Mono<Merchandise> getMerchandise(long sku) {
        return cache.get(key, () -> fetchFromService(sku));
    }
}
```

### Domain Layer

Responsibilities:
- Pure data containers (records)
- No business logic
- No framework dependencies
- Immutable

```
record Product(
    long sku,
    String description,
    String price,
    int availableQuantity
) {}
```

## Anti-patterns

### Controller Directly Calling Repository

```
// DON'T
@GetMapping("/products/{sku}")
Mono<Product> getProduct(@PathVariable long sku) {
    return merchandiseRepository.get(sku);  // Bypasses service layer
}
```

### Domain Objects with Spring Annotations

```
// DON'T
@Entity
record Product(
    @Id long sku,
    @Column String description
) {}
```

### Service Depending on Controller

```
// DON'T
@Service
class ProductService {
    private final ProductController controller;  // Wrong direction
}
```

### Circular Dependencies Between Packages

```
// DON'T
// service/ProductService.java
import controller.ProductController;

// controller/ProductController.java
import service.ProductService;
```

### Repository Without Resilience

```
// DON'T
Mono<Response> fetch() {
    return webClient.get()  // No circuit breaker, retry, or timeout
        .retrieve()
        .bodyToMono(Response.class);
}
```

## Reference

- `apps/product-service/` - Reference implementation
- `libs/platform/platform-test/.../ArchitectureRules.java` - Enforcement (Phase 3)
