# Validation Standard

## Intent

Reject invalid requests early with clear, actionable error messages that help clients fix their requests.

## Outcomes

- Fast failure for invalid requests
- Actionable error messages with field-level details
- Consistent validation across all services
- All validation errors returned in single response

## Patterns

### Validation Response Structure

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "status": 400,
  "traceId": "abc123def456",
  "details": {
    "x-store-number": "Must be between 1 and 2000",
    "x-userid": "Must be 6 alphanumeric characters",
    "sku": "Must be a positive number"
  }
}
```

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `x-store-number` | Integer 1-2000 | "Must be between 1 and 2000" |
| `x-order-number` | UUID format | "Must be a valid UUID" |
| `x-userid` | 6 alphanumeric | "Must be 6 alphanumeric characters" |
| `x-sessionid` | UUID format | "Must be a valid UUID" |
| Path param `sku` | Positive long | "Must be a positive number" |
| Query param `quantity` | 1-999 | "Must be between 1 and 999" |

### Validator Pattern

```java
@Component
class ProductRequestValidator {
    private static final Pattern UUID_PATTERN =
        Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern USERID_PATTERN =
        Pattern.compile("^[a-zA-Z0-9]{6}$");

    public Mono<Void> validate(long sku, HttpHeaders headers) {
        List<ValidationError> errors = new ArrayList<>();

        validateSku(sku, errors);
        validateStoreNumber(headers, errors);
        validateOrderNumber(headers, errors);
        validateUserId(headers, errors);
        validateSessionId(headers, errors);

        return errors.isEmpty()
            ? Mono.empty()
            : Mono.error(new ValidationException(errors));
    }

    private void validateSku(long sku, List<ValidationError> errors) {
        if (sku <= 0) {
            errors.add(new ValidationError("sku", "Must be a positive number"));
        }
    }

    private void validateStoreNumber(HttpHeaders headers, List<ValidationError> errors) {
        String value = headers.getFirst("x-store-number");
        if (value == null || value.isBlank()) {
            errors.add(new ValidationError("x-store-number", "Required"));
            return;
        }
        try {
            int storeNumber = Integer.parseInt(value);
            if (storeNumber < 1 || storeNumber > 2000) {
                errors.add(new ValidationError("x-store-number", "Must be between 1 and 2000"));
            }
        } catch (NumberFormatException e) {
            errors.add(new ValidationError("x-store-number", "Must be a valid integer"));
        }
    }

    // Similar methods for other headers...
}
```

### Controller Usage

```java
@RestController
class ProductController {
    private final ProductService service;
    private final ProductRequestValidator validator;

    @GetMapping("/products/{sku}")
    Mono<Product> getProduct(@PathVariable long sku, ServerHttpRequest request) {
        return validator.validate(sku, request.getHeaders())
            .then(service.getProduct(sku));
    }
}
```

### Error Aggregation

Collect ALL errors before returning response:

```java
// DON'T - fail on first error
public Mono<Void> validate(Request request) {
    if (request.sku() <= 0) {
        return Mono.error(new ValidationException("sku", "Invalid"));  // Stops here
    }
    if (request.quantity() <= 0) {
        return Mono.error(new ValidationException("quantity", "Invalid"));  // Never reached
    }
    return Mono.empty();
}

// DO - collect all errors
public Mono<Void> validate(Request request) {
    List<ValidationError> errors = new ArrayList<>();

    if (request.sku() <= 0) {
        errors.add(new ValidationError("sku", "Must be positive"));
    }
    if (request.quantity() <= 0) {
        errors.add(new ValidationError("quantity", "Must be positive"));
    }
    if (request.quantity() > 999) {
        errors.add(new ValidationError("quantity", "Must not exceed 999"));
    }

    return errors.isEmpty()
        ? Mono.empty()
        : Mono.error(new ValidationException(errors));  // All errors returned
}
```

### Validation Error Model

```java
public record ValidationError(String field, String message) {}

public class ValidationException extends RuntimeException {
    private final List<ValidationError> errors;

    public ValidationException(List<ValidationError> errors) {
        super("Validation failed");
        this.errors = List.copyOf(errors);
    }

    public ValidationException(String field, String message) {
        this(List.of(new ValidationError(field, message)));
    }

    public List<ValidationError> getErrors() {
        return errors;
    }

    public Map<String, String> getDetailsMap() {
        return errors.stream()
            .collect(Collectors.toMap(
                ValidationError::field,
                ValidationError::message,
                (a, b) -> a + "; " + b  // Combine multiple errors for same field
            ));
    }
}
```

### Request Body Validation

For POST/PUT requests with JSON bodies:

```java
record CreateCartRequest(
    String customerId,
    List<CartItemRequest> items
) {}

record CartItemRequest(
    long sku,
    int quantity
) {}

@Component
class CartRequestValidator {

    public Mono<Void> validate(CreateCartRequest request) {
        List<ValidationError> errors = new ArrayList<>();

        if (request.customerId() == null || request.customerId().isBlank()) {
            errors.add(new ValidationError("customerId", "Required"));
        }

        if (request.items() == null || request.items().isEmpty()) {
            errors.add(new ValidationError("items", "At least one item required"));
        } else {
            for (int i = 0; i < request.items().size(); i++) {
                CartItemRequest item = request.items().get(i);
                String prefix = "items[" + i + "].";

                if (item.sku() <= 0) {
                    errors.add(new ValidationError(prefix + "sku", "Must be positive"));
                }
                if (item.quantity() <= 0) {
                    errors.add(new ValidationError(prefix + "quantity", "Must be positive"));
                }
                if (item.quantity() > 999) {
                    errors.add(new ValidationError(prefix + "quantity", "Must not exceed 999"));
                }
            }
        }

        return errors.isEmpty()
            ? Mono.empty()
            : Mono.error(new ValidationException(errors));
    }
}
```

### Common Validation Patterns

```java
// UUID validation
private boolean isValidUuid(String value) {
    return value != null && UUID_PATTERN.matcher(value).matches();
}

// Email validation
private boolean isValidEmail(String value) {
    return value != null && EMAIL_PATTERN.matcher(value).matches();
}

// Range validation
private boolean isInRange(int value, int min, int max) {
    return value >= min && value <= max;
}

// Non-empty string
private boolean isNotBlank(String value) {
    return value != null && !value.isBlank();
}

// Positive number
private boolean isPositive(long value) {
    return value > 0;
}
```

## Anti-patterns

### Failing on First Error

```java
// DON'T - user fixes one, gets another
if (sku <= 0) {
    return Mono.error(new ValidationException("sku", "Invalid"));
}
if (quantity <= 0) {
    return Mono.error(new ValidationException("quantity", "Invalid"));
}
// User submits, gets "sku invalid", fixes, submits, gets "quantity invalid"

// DO - return all errors at once
List<ValidationError> errors = new ArrayList<>();
if (sku <= 0) errors.add(new ValidationError("sku", "Invalid"));
if (quantity <= 0) errors.add(new ValidationError("quantity", "Invalid"));
if (!errors.isEmpty()) return Mono.error(new ValidationException(errors));
```

### Vague Error Messages

```java
// DON'T - unhelpful messages
errors.add(new ValidationError("storeNumber", "Invalid"));
errors.add(new ValidationError("email", "Bad format"));
errors.add(new ValidationError("quantity", "Error"));

// DO - actionable messages
errors.add(new ValidationError("storeNumber", "Must be between 1 and 2000"));
errors.add(new ValidationError("email", "Must be a valid email address"));
errors.add(new ValidationError("quantity", "Must be a positive number not exceeding 999"));
```

### Validation in Service Layer

```java
// DON'T - validation too deep in the stack
@Service
class ProductService {
    Mono<Product> getProduct(long sku, int storeNumber) {
        if (storeNumber < 1 || storeNumber > 2000) {
            return Mono.error(new ValidationException(...));
        }
        // Business logic
    }
}

// DO - validate at boundary (controller)
@RestController
class ProductController {
    Mono<Product> getProduct(@PathVariable long sku, ServerHttpRequest request) {
        return validator.validate(sku, request.getHeaders())
            .then(service.getProduct(sku));  // Service trusts input is valid
    }
}
```

### No Validation at All

```java
// DON'T - use values directly
@GetMapping("/products/{sku}")
Mono<Product> getProduct(
        @PathVariable long sku,
        @RequestHeader("x-store-number") int storeNumber) {
    return service.getProduct(sku, storeNumber);  // Could be -1, 999999, etc.
}

// DO - validate everything
@GetMapping("/products/{sku}")
Mono<Product> getProduct(@PathVariable long sku, ServerHttpRequest request) {
    return validator.validate(sku, request.getHeaders())
        .then(service.getProduct(sku));
}
```

### Inconsistent Field Names

```java
// DON'T - different names for same field
errors.add(new ValidationError("store_number", "Invalid"));  // Response uses snake_case
// But header is "x-store-number"

// DO - use actual field/header names
errors.add(new ValidationError("x-store-number", "Must be between 1 and 2000"));
```

### Exposing Internal Details

```java
// DON'T - internal implementation leaked
errors.add(new ValidationError("sku",
    "Failed regex: ^[0-9]{6,12}$ - input was 'abc'"));
errors.add(new ValidationError("database.products.sku",
    "Foreign key constraint violated"));

// DO - user-friendly messages
errors.add(new ValidationError("sku", "Must be 6-12 digits"));
```

### Boolean Validation Messages

```java
// DON'T - just true/false
{
  "valid": false,
  "sku": false,
  "quantity": true
}

// DO - descriptive messages
{
  "error": "Bad Request",
  "details": {
    "sku": "Must be a positive number"
  }
}
```

## Reference

- `apps/product-service/src/.../validation/ProductRequestValidator.java` - Example
- `libs/platform/platform-error/ValidationException.java` - Exception class
