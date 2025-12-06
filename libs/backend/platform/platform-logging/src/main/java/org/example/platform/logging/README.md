# Logging

## Purpose
Provides structured JSON logging with automatic propagation of request metadata and distributed trace context for reactive Spring WebFlux applications.

## Behavior
Logs are written as JSON objects containing trace IDs, span IDs, request metadata from Reactor Context, and typed data payloads. The StructuredLogger component extracts OpenTelemetry trace context from the current span and merges it with metadata from the Reactor Context to produce consistent, searchable log entries across all reactive operations.

## Quirks
- Uses Reactor Context instead of MDC for metadata propagation in reactive chains
- Trace IDs come from OpenTelemetry's current span, not from context
- All log entries serialize to JSON; serialization failures fall back to error logs
