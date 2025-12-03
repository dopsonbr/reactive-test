# Platform Error

Global error handling with consistent error responses.

## Features

- Centralized error handling for WebFlux
- Consistent error response format
- Trace ID inclusion for debugging
- Appropriate HTTP status code mapping
- No stack trace leakage to clients

## Usage

### Auto-Configuration

The `GlobalErrorHandler` is auto-configured as a `@ControllerAdvice` and handles all exceptions.

### Throwing Validation Errors

```java
import org.example.platform.error.ValidationException;

public Mono<Void> validate(Request request) {
    Map<String, String> errors = new LinkedHashMap<>();

    if (request.id() <= 0) {
        errors.put("id", "Must be positive");
    }
    if (request.name() == null) {
        errors.put("name", "Required");
    }

    if (!errors.isEmpty()) {
        return Mono.error(new ValidationException(errors));
    }
    return Mono.empty();
}
```

### Custom Error Response

```java
import org.example.platform.error.ErrorResponse;

ErrorResponse error = new ErrorResponse(
    "Bad Request",
    "Validation failed",
    "/api/resource",
    400,
    traceId,
    Map.of("field", "error message")
);
```

## Error Response Format

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

## Exception Mapping

| Exception | HTTP Status | Description |
|-----------|-------------|-------------|
| `ValidationException` | 400 | Request validation failed |
| `CallNotPermittedException` | 503 | Circuit breaker open |
| `TimeoutException` | 504 | Request timeout |
| `BulkheadFullException` | 503 | Too many concurrent requests |
| `WebClientResponseException` | Mirrors upstream | Upstream error |
| `Exception` | 500 | Unexpected error |

## Classes

| Class | Purpose |
|-------|---------|
| `GlobalErrorHandler` | `@ControllerAdvice` handling all exceptions |
| `ErrorResponse` | Error response record |
| `ValidationException` | Exception with field-level errors |

## Configuration

No configuration required. Auto-configured via Spring Boot.

## Best Practices

1. Use `ValidationException` for all validation errors
2. Include all field errors, not just the first one
3. Use descriptive error messages
4. Never expose stack traces or internal details
5. Include trace ID for debugging
