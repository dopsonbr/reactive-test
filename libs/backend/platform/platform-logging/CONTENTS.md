# Platform Logging Contents

## Main Source (src/main/java/org/example/platform/logging/)

### Core
- `StructuredLogger.java` - JSON logger that extracts metadata from Reactor Context and correlates with OpenTelemetry traces
- `LogEntry.java` - Root log structure containing level, logger name, trace IDs, metadata, and data
- `WebClientLoggingFilter.java` - ExchangeFilterFunction for logging outbound HTTP requests and responses

### Data Models
- `RequestLogData.java` - Data model for HTTP request logs (inbound and outbound)
- `ResponseLogData.java` - Data model for HTTP response logs (inbound and outbound)
- `ErrorLogData.java` - Data model for error logs with circuit breaker state and retry details
- `MessageLogData.java` - Data model for simple text message logs

## Test Source (src/test/java/org/example/platform/logging/)
- `WebClientLoggingFilterTest.java` - Unit tests for WebClient logging filter

## Key Dependencies

| Dependency | Purpose |
|------------|---------|
| platform-webflux | ContextKeys and RequestMetadata for context propagation |
| spring-boot-starter-webflux | WebClient types |
| opentelemetry-api | Span and trace context extraction |
| jackson-databind | JSON serialization |
| logback-classic | SLF4J logging backend |
| logstash-logback-encoder | JSON log formatting |
