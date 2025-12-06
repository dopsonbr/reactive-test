# Platform Logging Agent Guidelines

This library provides structured JSON logging with Reactor Context integration and OpenTelemetry trace correlation.

## Key Files

| File | Purpose |
|------|---------|
| `StructuredLogger.java` | Component that serializes log entries with trace and context metadata |
| `LogEntry.java` | Root log envelope containing level, logger, trace IDs, metadata, and data payload |
| `WebClientLoggingFilter.java` | WebClient filter for logging outbound HTTP calls |
| `RequestLogData.java` | Request log payload (path, method, host, headers, body) |
| `ResponseLogData.java` | Response log payload (path, method, host, status, headers, body) |
| `ErrorLogData.java` | Error log payload (service, error type, message, circuit breaker state, retry attempt) |
| `MessageLogData.java` | Simple message log payload |

## Common Tasks

### Add a New Log Data Type

1. Create record in `org.example.platform.logging`:
   ```java
   public record NewLogData(String type, String field1, int field2) {
       public NewLogData(String field1, int field2) {
           this("newtype", field1, field2);
       }
   }
   ```
2. Add logging method to `StructuredLogger`:
   ```java
   public void logNewType(ContextView ctx, String loggerName, NewLogData data) {
       log(ctx, loggerName, data);
   }
   ```
3. All records must include a `type` field for log aggregation

### Use StructuredLogger in a Service

1. Inject `StructuredLogger` via constructor
2. Log within reactive chain using `Mono.deferContextual`:
   ```java
   return Mono.deferContextual(ctx -> {
       structuredLogger.logMessage(ctx, "myservice", "Processing request");
       return processRequest();
   });
   ```
3. Never subscribe to Mono/Flux inside logging calls

### Add WebClient Logging to a Repository

1. Inject `WebClientLoggingFilter` and create WebClient:
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
2. Logger name should be lowercase, no dots: `"myservicerepository"`

### Debug Missing Trace IDs

1. Verify OpenTelemetry agent is running
2. Check that `Span.current()` returns valid span context
3. Trace context comes from OTEL, not Reactor Context
4. If invalid, traceId and spanId will be null in logs

## Patterns in This Library

### Context Extraction

- Request metadata from Reactor Context via `ContextKeys.METADATA`
- Trace context from OpenTelemetry via `Span.current()`
- Never mix these sources

### Serialization Safety

- All serialization errors are caught and logged to SLF4J error channel
- Never throws exceptions to caller
- Uses Jackson ObjectMapper for JSON serialization

### Log Levels

- `info` - requests, responses, messages
- `error` - errors, exceptions

## Anti-patterns to Avoid

- Using MDC or ThreadLocal for context propagation
- Modifying `LogEntry` structure without coordinating with log ingestion pipeline
- Subscribing to Mono/Flux inside `StructuredLogger` methods
- Throwing exceptions from logging methods
- Using uppercase or dotted logger names

## Boundaries

Files that require careful review before changes:
- `StructuredLogger.java` - Changes affect all log output format
- `LogEntry.java` - Changes affect log ingestion pipeline

## Conventions

- All log data classes are immutable records
- All records include a `type` field as first parameter
- StructuredLogger receives `ContextView`, never subscribes to publishers
- Trace context always from OpenTelemetry `Span.current()`, not Reactor Context
- Request metadata always from Reactor Context via `ContextKeys.METADATA`

## Warnings

- ErrorLogData `circuitBreakerState` is nullable and optional
- Do not modify LogEntry structure without coordinating with downstream consumers
- Logger names should be lowercase component names without dots
