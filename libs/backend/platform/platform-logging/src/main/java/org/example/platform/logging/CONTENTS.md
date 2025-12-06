# Contents

| File | Description |
|------|-------------|
| `StructuredLogger.java` | Component that serializes log entries to JSON with trace and context metadata |
| `LogEntry.java` | Root log structure containing level, logger name, trace IDs, metadata, and data |
| `RequestLogData.java` | Data model for inbound/outbound HTTP request logs |
| `ResponseLogData.java` | Data model for inbound/outbound HTTP response logs |
| `ErrorLogData.java` | Data model for error logs with circuit breaker state and retry details |
| `MessageLogData.java` | Data model for simple message logs |
| `WebClientLoggingFilter.java` | ExchangeFilterFunction for logging outbound HTTP requests/responses |
