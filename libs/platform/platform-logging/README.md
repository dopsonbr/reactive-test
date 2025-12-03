# Platform Logging

Structured JSON logging library with Reactor Context integration.

## Features

- JSON-formatted log entries for machine parsing
- Reactor Context integration (not MDC - reactive-safe)
- Request/response logging with correlation IDs
- WebClient logging filter for HTTP client calls
- Trace ID propagation from distributed tracing

## Usage

### Inject StructuredLogger

```java
@Service
public class MyService {
    private final StructuredLogger structuredLogger;

    public MyService(StructuredLogger structuredLogger) {
        this.structuredLogger = structuredLogger;
    }
}
```

### Log Messages

```java
Mono.deferContextual(ctx -> {
    structuredLogger.logMessage(ctx, "myservice", "Processing request");
    return doWork();
});
```

### Log Requests

```java
RequestLogData requestData = new RequestLogData(
    request.getPath().value(),
    request.getURI().getPath(),
    request.getMethod().name(),
    body
);
structuredLogger.logRequest(ctx, "mycontroller", requestData);
```

### Log Responses

```java
ResponseLogData responseData = new ResponseLogData(
    request.getPath().value(),
    request.getURI().getPath(),
    request.getMethod().name(),
    status,
    body
);
structuredLogger.logResponse(ctx, "mycontroller", responseData);
```

### Log Errors

```java
ErrorLogData errorData = new ErrorLogData(
    "Error processing request",
    exception,
    Map.of("sku", sku)
);
structuredLogger.logError(ctx, "myservice", errorData);
```

### WebClient Logging

```java
@Bean
public WebClient myServiceWebClient(
        WebClient.Builder builder,
        WebClientLoggingFilter loggingFilter) {
    return builder
        .baseUrl("http://my-service")
        .filter(loggingFilter.create("myservicerepository"))
        .build();
}
```

## Log Format

```json
{
  "level": "info",
  "logger": "productservice",
  "traceId": "abc123def456",
  "spanId": "789ghi",
  "metadata": {
    "storeNumber": 1234,
    "orderNumber": "uuid",
    "userId": "abc123",
    "sessionId": "uuid"
  },
  "data": {
    "message": "Processing request"
  }
}
```

## Logger Names

Use lowercase, no dots, component name only:
- `productcontroller`
- `productservice`
- `merchandiserepository`

## Classes

| Class | Purpose |
|-------|---------|
| `StructuredLogger` | Main logging interface |
| `LogEntry` | Log entry builder |
| `RequestLogData` | Request log data record |
| `ResponseLogData` | Response log data record |
| `MessageLogData` | Simple message log data |
| `ErrorLogData` | Error log data with exception |
| `WebClientLoggingFilter` | WebClient request/response logging |

## Configuration

Uses Logback with Logstash encoder. Add to `logback-spring.xml`:

```xml
<appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
</appender>
```
