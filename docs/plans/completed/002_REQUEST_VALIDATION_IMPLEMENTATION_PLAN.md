# Request Validation Implementation Plan

## Overview

Add request validation to `ProductController` to return HTTP 400 for invalid input, integrating with the existing `GlobalErrorHandler` and `ErrorResponse` patterns.

## Validation Rules

| Field | Type | Validation |
|-------|------|------------|
| `sku` | path variable | > 0 AND 6-12 digits (100,000 to 999,999,999,999) |
| `x-store-number` | header | 1-2000 inclusive |
| `x-order-number` | header | Valid UUID format |
| `x-userid` | header | Exactly 6 alphanumeric characters |
| `x-sessionid` | header | Valid UUID format |

## Approach: Custom Validation

Using custom validation (not Bean Validation) because:
- No existing validation dependencies in the project
- Simple rules that don't warrant additional framework
- Better integration with existing reactive patterns
- Full control over error response format

---

## Implementation Steps

### Step 1: Create ValidationException

**New file:** `src/main/java/org/example/reactivetest/error/ValidationException.java`

```java
package org.example.reactivetest.error;

import java.util.List;
import java.util.Map;

public class ValidationException extends RuntimeException {
    private final List<ValidationError> errors;

    public ValidationException(List<ValidationError> errors) {
        super("Validation failed: " + errors.size() + " error(s)");
        this.errors = errors;
    }

    public List<ValidationError> getErrors() {
        return errors;
    }

    public Map<String, Object> toDetailsMap() {
        return Map.of("validationErrors", errors);
    }

    public record ValidationError(String field, String message) {}
}
```

### Step 2: Create RequestValidator Component

**New file:** `src/main/java/org/example/reactivetest/validation/RequestValidator.java`

```java
package org.example.reactivetest.validation;

import org.example.reactivetest.error.ValidationException;
import org.example.reactivetest.error.ValidationException.ValidationError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class RequestValidator {

    private static final long SKU_MIN = 100_000L;
    private static final long SKU_MAX = 999_999_999_999L;
    private static final int STORE_NUMBER_MIN = 1;
    private static final int STORE_NUMBER_MAX = 2000;

    private static final Pattern UUID_PATTERN = Pattern.compile(
        "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    );
    private static final Pattern USER_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9]{6}$");

    public Mono<Void> validateProductRequest(
            long sku, int storeNumber, String orderNumber,
            String userId, String sessionId) {

        List<ValidationError> errors = new ArrayList<>();

        if (sku < SKU_MIN || sku > SKU_MAX) {
            errors.add(new ValidationError("sku",
                "SKU must be between " + SKU_MIN + " and " + SKU_MAX + " (6-12 digits)"));
        }

        if (storeNumber < STORE_NUMBER_MIN || storeNumber > STORE_NUMBER_MAX) {
            errors.add(new ValidationError("x-store-number",
                "Store number must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
        }

        if (orderNumber == null || !UUID_PATTERN.matcher(orderNumber).matches()) {
            errors.add(new ValidationError("x-order-number", "Order number must be a valid UUID"));
        }

        if (userId == null || !USER_ID_PATTERN.matcher(userId).matches()) {
            errors.add(new ValidationError("x-userid", "User ID must be exactly 6 alphanumeric characters"));
        }

        if (sessionId == null || !UUID_PATTERN.matcher(sessionId).matches()) {
            errors.add(new ValidationError("x-sessionid", "Session ID must be a valid UUID"));
        }

        if (!errors.isEmpty()) {
            return Mono.error(new ValidationException(errors));
        }

        return Mono.empty();
    }
}
```

### Step 3: Add Handler to GlobalErrorHandler

**Modify:** `src/main/java/org/example/reactivetest/error/GlobalErrorHandler.java`

Add this exception handler method:

```java
@ExceptionHandler(ValidationException.class)
public ResponseEntity<ErrorResponse> handleValidationError(
        ValidationException ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();

    log.warn("Validation error for path {}: {}", path, ex.getMessage());

    ErrorResponse response = ErrorResponse.of(
        "Bad Request",
        "Request validation failed",
        path,
        HttpStatus.BAD_REQUEST.value(),
        traceId,
        ex.toDetailsMap()
    );

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
}
```

### Step 4: Update ProductController

**Modify:** `src/main/java/org/example/reactivetest/controller/ProductController.java`

1. Inject `RequestValidator` via constructor
2. Add validation at the start of the reactive chain:

```java
return requestValidator.validateProductRequest(sku, storeNumber, orderNumber, userId, sessionId)
    .then(Mono.deferContextual(ctx -> {
        // existing logging and service call logic
    }))
    .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
```

### Step 5: Add Unit Tests

**New file:** `src/test/java/org/example/reactivetest/validation/RequestValidatorTest.java`

Test cases:
- Valid request succeeds
- Invalid SKU (too small, too large, negative, zero)
- Invalid store number (0, negative, > 2000)
- Invalid order number (not UUID format)
- Invalid user ID (wrong length, special characters)
- Invalid session ID (not UUID format)
- Multiple invalid fields returns all errors

### Step 6: Add Integration Tests

**New file:** `src/test/java/org/example/reactivetest/controller/ProductControllerValidationTest.java`

Test the full HTTP request/response cycle using `WebTestClient`.

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/main/java/org/example/reactivetest/error/ValidationException.java` |
| Create | `src/main/java/org/example/reactivetest/validation/RequestValidator.java` |
| Modify | `src/main/java/org/example/reactivetest/error/GlobalErrorHandler.java` |
| Modify | `src/main/java/org/example/reactivetest/controller/ProductController.java` |
| Create | `src/test/java/org/example/reactivetest/validation/RequestValidatorTest.java` |
| Create | `src/test/java/org/example/reactivetest/controller/ProductControllerValidationTest.java` |

---

## Example Error Response

```json
{
  "error": "Bad Request",
  "message": "Request validation failed",
  "path": "/products/12345",
  "status": 400,
  "traceId": "abc123def456...",
  "details": {
    "validationErrors": [
      { "field": "sku", "message": "SKU must be between 100000 and 999999999999 (6-12 digits)" },
      { "field": "x-store-number", "message": "Store number must be between 1 and 2000" }
    ]
  }
}
```