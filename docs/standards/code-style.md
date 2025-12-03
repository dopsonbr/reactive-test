# Code Style Standard

## Intent

Maintain consistent code formatting for readability, reduced merge conflicts, and eliminated style discussions in code review.

## Outcomes

- Automated formatting (no manual effort)
- No style discussions in code review
- Git-friendly diffs
- Consistent code appearance across all modules

## Patterns

### Formatter: Spotless + Google Java Format

All Java code is formatted using [Google Java Format](https://github.com/google/google-java-format) via the Spotless Gradle plugin.

```kotlin
// buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts
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
```

### Commands

```bash
# Check formatting (CI)
./gradlew spotlessCheck

# Auto-format code
./gradlew spotlessApply

# Format specific module
./gradlew :apps:product-service:spotlessApply
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Class | PascalCase | `ProductService`, `MerchandiseRepository` |
| Interface | PascalCase | `ReactiveCacheService`, `ReactiveResilience` |
| Method | camelCase | `getProduct`, `validateHeaders` |
| Variable | camelCase | `storeNumber`, `productResponse` |
| Constant | UPPER_SNAKE_CASE | `FALLBACK_RESPONSE`, `DEFAULT_TIMEOUT` |
| Package | lowercase | `org.example.product.service` |
| Logger name | lowercase, no dots | `productservice`, `merchandiserepository` |
| Test method | camelCase or snake_case | `getProduct_validSku_returnsProduct()` |

### Package Structure

```
org.example.{app}/
├── controller/
├── service/
├── repository/
│   └── {external}/
├── domain/
├── config/
└── validation/
```

### Import Order

Google Java Format orders imports automatically:
1. Static imports
2. `java.*`
3. `javax.*`
4. All other imports (alphabetical)

No wildcard imports (`import java.util.*`) are allowed.

### Indentation and Spacing

- **Indentation**: 2 spaces (Google Java Format default)
- **Max line length**: 100 characters
- **Blank lines**: One between methods, two between class sections
- **Trailing whitespace**: Removed automatically
- **End of file**: Single newline

### Class Structure

```java
public class ProductService {

    // Constants (static final)
    private static final String LOGGER_NAME = "productservice";
    private static final Product FALLBACK = new Product(0, "Unavailable", "N/A", 0);

    // Instance fields (final where possible)
    private final MerchandiseRepository merchandiseRepository;
    private final PriceRepository priceRepository;
    private final StructuredLogger logger;

    // Constructor
    public ProductService(
            MerchandiseRepository merchandiseRepository,
            PriceRepository priceRepository,
            StructuredLogger logger) {
        this.merchandiseRepository = merchandiseRepository;
        this.priceRepository = priceRepository;
        this.logger = logger;
    }

    // Public methods
    public Mono<Product> getProduct(long sku) {
        return ...;
    }

    // Package-private methods

    // Private methods
    private Product mapToProduct(Merchandise m, Price p) {
        return ...;
    }
}
```

### Record Style

```java
// Simple record
public record Product(long sku, String description, String price, int availableQuantity) {}

// Record with validation
public record Cart(String id, List<CartItem> items) {
    public Cart {
        items = List.copyOf(items);  // Defensive copy
    }
}

// Multi-line record
public record CreateCartRequest(
    String customerId,
    List<CartItemRequest> items,
    String storeNumber) {}
```

### Method Chaining (Reactive)

```java
// Good - one operator per line
return merchandiseRepository.getMerchandise(sku)
    .zipWith(priceRepository.getPrice(sku))
    .map(tuple -> createProduct(tuple.getT1(), tuple.getT2()))
    .doOnNext(p -> logger.info("Product fetched: {}", p.sku()))
    .onErrorResume(this::handleError);

// Good - short chains can be on fewer lines
return cache.get(key)
    .switchIfEmpty(fetchFromService(sku));
```

### Lambda Style

```java
// Simple lambda - no braces
.map(response -> response.name())

// Multi-statement - use braces
.doOnNext(product -> {
    logger.info("Processing product");
    metrics.increment();
})

// Method reference preferred when possible
.map(Merchandise::name)
.filter(Objects::nonNull)
```

### Annotation Style

```java
// Single annotation
@Service
public class ProductService { }

// Multiple annotations - one per line
@RestController
@RequestMapping("/products")
public class ProductController { }

// Method annotations
@GetMapping("/{sku}")
@ResponseStatus(HttpStatus.OK)
public Mono<Product> getProduct(@PathVariable long sku) { }

// Parameter annotations - inline
public Mono<Product> getProduct(
    @PathVariable long sku,
    @RequestHeader("x-store-number") int storeNumber) { }
```

### Comments

```java
// Single-line comment for brief explanations
int timeout = 2000; // milliseconds

/*
 * Multi-line comment for longer explanations.
 * Use when more context is needed.
 */

/**
 * Javadoc for public APIs only.
 * Not required for internal implementation classes.
 *
 * @param sku the product SKU
 * @return the product details
 */
public Mono<Product> getProduct(long sku) { }
```

### Exception Messages

```java
// Include context
throw new ValidationException("x-store-number", "Must be between 1 and 2000, got: " + value);

// Not too verbose
throw new IllegalArgumentException("Invalid SKU: " + sku);

// Not too terse
throw new RuntimeException("Error");  // DON'T - unhelpful
```

## Anti-patterns

### Manual Formatting

```java
// DON'T - manual alignment
private final MerchandiseRepository    merchandiseRepository;
private final PriceRepository          priceRepository;
private final InventoryRepository      inventoryRepository;

// DO - let formatter handle it
private final MerchandiseRepository merchandiseRepository;
private final PriceRepository priceRepository;
private final InventoryRepository inventoryRepository;
```

### Inconsistent Naming

```java
// DON'T - mixed conventions
private final MerchandiseRepository merchandise_repo;  // snake_case
private final PriceRepository priceRepo;               // abbreviated
private final InventoryRepository INVENTORY;           // UPPER_CASE

// DO - consistent camelCase
private final MerchandiseRepository merchandiseRepository;
private final PriceRepository priceRepository;
private final InventoryRepository inventoryRepository;
```

### Committing Unformatted Code

```bash
# DON'T - commit without formatting
git add . && git commit -m "Add feature"

# DO - format before commit
./gradlew spotlessApply && git add . && git commit -m "Add feature"

# Or: Use pre-commit hook (recommended)
```

### Wildcard Imports

```java
// DON'T
import java.util.*;
import org.springframework.web.bind.annotation.*;

// DO
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
```

### Long Lines

```java
// DON'T - over 100 characters
return merchandiseRepository.getMerchandise(sku).zipWith(priceRepository.getPrice(sku)).map(tuple -> createProduct(tuple.getT1(), tuple.getT2()));

// DO - break into readable chunks
return merchandiseRepository.getMerchandise(sku)
    .zipWith(priceRepository.getPrice(sku))
    .map(tuple -> createProduct(tuple.getT1(), tuple.getT2()));
```

### Unnecessary Comments

```java
// DON'T - comment states the obvious
// Get the product
Product product = productService.getProduct(sku);

// Increment the counter
counter++;

// DO - comment explains WHY, not WHAT
// Cache miss expected first time; subsequent calls will be fast
Product product = productService.getProduct(sku);
```

### Magic Numbers

```java
// DON'T
if (storeNumber < 1 || storeNumber > 2000) { }
Thread.sleep(5000);

// DO
private static final int MIN_STORE_NUMBER = 1;
private static final int MAX_STORE_NUMBER = 2000;
private static final long RETRY_DELAY_MS = 5000;

if (storeNumber < MIN_STORE_NUMBER || storeNumber > MAX_STORE_NUMBER) { }
Thread.sleep(RETRY_DELAY_MS);
```

### Pre-commit Hook (Recommended)

```bash
# .git/hooks/pre-commit
#!/bin/sh
./gradlew spotlessCheck
if [ $? -ne 0 ]; then
    echo "Code not formatted. Run './gradlew spotlessApply' and try again."
    exit 1
fi
```

## Reference

- `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts` - Spotless config
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- [Google Java Format](https://github.com/google/google-java-format)
