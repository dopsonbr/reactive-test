# Logging

## Boundaries
Files that require careful review before changes: StructuredLogger.java (changes affect all log output format)

## Conventions
- All log data classes are records
- StructuredLogger must receive ContextView, never subscribe to Mono/Flux
- Trace context always comes from OpenTelemetry Span.current(), not Reactor Context
- Request metadata always comes from Reactor Context via ContextKeys.METADATA
- Serialization errors must not throw exceptions, only log to SLF4J error channel

## Warnings
- Do not use MDC or ThreadLocal for context propagation in reactive code
- Do not modify LogEntry structure without coordinating with log ingestion pipeline
- ErrorLogData circuitBreakerState is nullable and optional
