# Platform WebFlux

Common WebFlux utilities for context propagation and request handling.

## Features

- Reactor Context key definitions
- Request metadata propagation
- Header-to-context conversion utilities

## Usage

### Request Metadata

Create metadata from headers:

```java
RequestMetadata metadata = new RequestMetadata(
    storeNumber,    // int
    orderNumber,    // String (UUID)
    userId,         // String
    sessionId       // String (UUID)
);
```

### Context Propagation

Add metadata to Reactor Context:

```java
return Mono.deferContextual(ctx -> {
    // Access metadata here
    RequestMetadata metadata = ctx.get(ContextKeys.METADATA);
    return processRequest();
})
.contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
```

### From Headers (Convenience)

```java
return Mono.deferContextual(ctx -> processRequest())
    .contextWrite(ContextKeys.fromHeaders(httpHeaders));
```

### Accessing Context

In downstream code:

```java
Mono.deferContextual(ctx -> {
    if (ctx.hasKey(ContextKeys.METADATA)) {
        RequestMetadata metadata = ctx.get(ContextKeys.METADATA);
        int storeNumber = metadata.storeNumber();
        // Use metadata...
    }
    return doWork();
});
```

## Classes

| Class | Purpose |
|-------|---------|
| `ContextKeys` | Reactor Context key constants and utilities |
| `RequestMetadata` | Request metadata record |

## Context Keys

| Key | Type | Description |
|-----|------|-------------|
| `METADATA` | `RequestMetadata` | Full request metadata |

## Required Headers

| Header | Type | Validation |
|--------|------|------------|
| `x-store-number` | Integer | 1-2000 |
| `x-order-number` | String | UUID format |
| `x-userid` | String | 6 alphanumeric |
| `x-sessionid` | String | UUID format |

## Why Not MDC?

MDC (Mapped Diagnostic Context) is thread-local. In reactive programming:
- Thread switching happens frequently
- MDC values don't propagate across thread boundaries
- Reactor Context is the correct mechanism

```java
// DON'T DO THIS
MDC.put("storeNumber", storeNumber);  // Lost on thread switch!

// DO THIS
.contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
```

## Pattern: Controller to Service

```java
@GetMapping("/{id}")
public Mono<Response> getById(
        @PathVariable long id,
        @RequestHeader HttpHeaders headers) {

    RequestMetadata metadata = extractMetadata(headers);

    return service.process(id)
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
}
```

The service can then access the metadata:

```java
public Mono<Response> process(long id) {
    return Mono.deferContextual(ctx -> {
        RequestMetadata metadata = ctx.get(ContextKeys.METADATA);
        log.info("Processing for store {}", metadata.storeNumber());
        return doProcessing(id);
    });
}
```
