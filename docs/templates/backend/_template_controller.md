# Controller Template

This template defines the standard structure for REST controllers in this codebase.

## Required Components

Every controller MUST have:

1. **Request Validator** - Validates all incoming request data
2. **Structured Logging** - Logs requests and responses
3. **Context Propagation** - Propagates RequestMetadata through Reactor Context
4. **Security Annotations** - Proper `@PreAuthorize` on each endpoint

## Template

```java
package org.example.{service}.controller;

import org.example.{service}.dto.{RequestDto};
import org.example.{service}.model.{Entity};
import org.example.{service}.service.{Service};
import org.example.{service}.validation.{Validator};
import org.example.platform.logging.RequestLogData;
import org.example.platform.logging.ResponseLogData;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Controller for {entity} operations.
 *
 * <p>This controller follows the standard patterns:
 * <ul>
 *   <li>Request validation via {Validator}</li>
 *   <li>Structured logging for all requests/responses</li>
 *   <li>Context propagation via Reactor Context</li>
 *   <li>OAuth2 scope-based authorization</li>
 * </ul>
 */
@RestController
@RequestMapping("/{entities}")
public class {Entity}Controller {

    private static final String LOGGER_NAME = "{entity}controller";

    private final {Service} service;
    private final {Validator} validator;
    private final StructuredLogger structuredLogger;

    public {Entity}Controller(
            {Service} service,
            {Validator} validator,
            StructuredLogger structuredLogger) {
        this.service = service;
        this.validator = validator;
        this.structuredLogger = structuredLogger;
    }

    // ==================== GET (Single) ====================

    /**
     * Get a single {entity} by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SCOPE_{entity}:read')")
    public Mono<{Entity}> get{Entity}(
            @PathVariable String id,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(ctx -> {
            logRequest(ctx, httpRequest);

            // MANDATORY: Validate all inputs
            return validator.validateGetRequest(id, storeNumber, orderNumber, userId, sessionId)
                    .then(service.findById(id))
                    .doOnSuccess(entity -> logResponse(ctx, httpRequest, 200, entity));
        })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    // ==================== GET (List) ====================

    /**
     * Find {entities} by query parameters.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_{entity}:read')")
    public Flux<{Entity}> find{Entities}(
            @RequestParam(required = false) String filter,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Flux.deferContextual(ctx -> {
            logRequest(ctx, httpRequest);

            // MANDATORY: Validate all inputs
            return validator.validateListRequest(filter, storeNumber, orderNumber, userId, sessionId)
                    .thenMany(service.findByFilter(filter));
        })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    // ==================== POST (Create) ====================

    /**
     * Create a new {entity}.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SCOPE_{entity}:write')")
    public Mono<{Entity}> create{Entity}(
            @RequestBody {RequestDto} request,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(ctx -> {
            logRequest(ctx, httpRequest);

            // MANDATORY: Validate all inputs including request body
            return validator.validateCreateRequest(request, storeNumber, orderNumber, userId, sessionId)
                    .then(service.create(request))
                    .doOnSuccess(entity -> logResponse(ctx, httpRequest, 201, entity));
        })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    // ==================== PUT (Update) ====================

    /**
     * Update an existing {entity}.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SCOPE_{entity}:write')")
    public Mono<{Entity}> update{Entity}(
            @PathVariable String id,
            @RequestBody {RequestDto} request,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(ctx -> {
            logRequest(ctx, httpRequest);

            // MANDATORY: Validate all inputs including request body
            return validator.validateUpdateRequest(id, request, storeNumber, orderNumber, userId, sessionId)
                    .then(service.update(id, request))
                    .doOnSuccess(entity -> logResponse(ctx, httpRequest, 200, entity));
        })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    // ==================== DELETE ====================

    /**
     * Delete an {entity}.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('SCOPE_{entity}:write')")
    public Mono<Void> delete{Entity}(
            @PathVariable String id,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(ctx -> {
            logRequest(ctx, httpRequest);

            // MANDATORY: Validate all inputs
            return validator.validateDeleteRequest(id, storeNumber, orderNumber, userId, sessionId)
                    .then(service.delete(id))
                    .doOnSuccess(v -> logResponse(ctx, httpRequest, 204, null));
        })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    // ==================== Logging Helpers ====================

    private void logRequest(reactor.util.context.ContextView ctx, ServerHttpRequest request) {
        RequestLogData requestData = new RequestLogData(
                request.getPath().value(),
                request.getURI().getPath(),
                request.getMethod().name(),
                null);
        structuredLogger.logRequest(ctx, LOGGER_NAME, requestData);
    }

    private void logResponse(
            reactor.util.context.ContextView ctx,
            ServerHttpRequest request,
            int status,
            Object body) {
        ResponseLogData responseData = new ResponseLogData(
                request.getPath().value(),
                request.getURI().getPath(),
                request.getMethod().name(),
                status,
                body);
        structuredLogger.logResponse(ctx, LOGGER_NAME, responseData);
    }
}
```

## Validator Template

Every controller MUST have a corresponding validator:

```java
package org.example.{service}.validation;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.example.{service}.dto.{RequestDto};
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Validator for {entity} requests.
 *
 * <p>Collects ALL validation errors before returning, allowing clients
 * to fix all issues in a single iteration.
 */
@Component
public class {Entity}RequestValidator {

    private static final int STORE_NUMBER_MIN = 1;
    private static final int STORE_NUMBER_MAX = 2000;

    private static final Pattern UUID_PATTERN =
            Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    private static final Pattern USER_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9]{6}$");

    /**
     * Validate a GET request.
     */
    public Mono<Void> validateGetRequest(
            String id,
            int storeNumber,
            String orderNumber,
            String userId,
            String sessionId) {

        List<ValidationError> errors = new ArrayList<>();

        validateId(id, errors);
        validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

        return errors.isEmpty()
                ? Mono.empty()
                : Mono.error(new ValidationException(errors));
    }

    /**
     * Validate a CREATE request.
     */
    public Mono<Void> validateCreateRequest(
            {RequestDto} request,
            int storeNumber,
            String orderNumber,
            String userId,
            String sessionId) {

        List<ValidationError> errors = new ArrayList<>();

        validateRequestBody(request, errors);
        validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

        return errors.isEmpty()
                ? Mono.empty()
                : Mono.error(new ValidationException(errors));
    }

    // ==================== Validation Helpers ====================

    private void validateId(String id, List<ValidationError> errors) {
        if (id == null || id.isBlank()) {
            errors.add(new ValidationError("id", "ID is required"));
        } else if (!UUID_PATTERN.matcher(id).matches()) {
            errors.add(new ValidationError("id", "ID must be a valid UUID"));
        }
    }

    private void validateRequestBody({RequestDto} request, List<ValidationError> errors) {
        if (request == null) {
            errors.add(new ValidationError("body", "Request body is required"));
            return;
        }
        // Add field-specific validation here
    }

    private void validateCommonHeaders(
            int storeNumber,
            String orderNumber,
            String userId,
            String sessionId,
            List<ValidationError> errors) {

        if (storeNumber < STORE_NUMBER_MIN || storeNumber > STORE_NUMBER_MAX) {
            errors.add(new ValidationError(
                    "x-store-number",
                    "Store number must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
        }

        if (orderNumber == null || !UUID_PATTERN.matcher(orderNumber).matches()) {
            errors.add(new ValidationError("x-order-number", "Order number must be a valid UUID"));
        }

        if (userId == null || !USER_ID_PATTERN.matcher(userId).matches()) {
            errors.add(new ValidationError(
                    "x-userid", "User ID must be exactly 6 alphanumeric characters"));
        }

        if (sessionId == null || !UUID_PATTERN.matcher(sessionId).matches()) {
            errors.add(new ValidationError("x-sessionid", "Session ID must be a valid UUID"));
        }
    }
}
```

## Anti-Patterns

### Missing Validation

```java
// DON'T - no validation
@PostMapping
public Mono<Entity> create(@RequestBody Request request) {
    return service.create(request);  // Request could be invalid!
}

// DO - always validate
@PostMapping
public Mono<Entity> create(@RequestBody Request request) {
    return validator.validateCreateRequest(request)
            .then(service.create(request));
}
```

### Missing Context Propagation

```java
// DON'T - no context propagation
@GetMapping("/{id}")
public Mono<Entity> get(@PathVariable String id) {
    return service.findById(id);  // No metadata for downstream calls
}

// DO - propagate context
@GetMapping("/{id}")
public Mono<Entity> get(
        @PathVariable String id,
        @RequestHeader("x-store-number") int storeNumber,
        // ... other headers
        ) {
    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);
    return service.findById(id)
            .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
}
```

### Missing Security

```java
// DON'T - no authorization
@PostMapping
public Mono<Entity> create(@RequestBody Request request) {
    return service.create(request);  // Anyone can access!
}

// DO - always require scope
@PostMapping
@PreAuthorize("hasAuthority('SCOPE_entity:write')")
public Mono<Entity> create(@RequestBody Request request) {
    return service.create(request);
}
```

## Checklist

Before submitting a controller for review, verify:

- [ ] Every endpoint has `@PreAuthorize` annotation
- [ ] Every endpoint validates all inputs via a dedicated validator
- [ ] Every endpoint propagates RequestMetadata via Reactor Context
- [ ] Every endpoint logs request and response
- [ ] Validator collects ALL errors before returning (no fail-fast)
- [ ] Error messages are actionable and include field names
