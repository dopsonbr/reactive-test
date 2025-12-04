# org.example.audit

## Purpose
Centralized audit trail service that captures, persists, and queries system-wide events for compliance, debugging, and user activity tracking.

## Behavior
Consumes audit events from Redis Streams, stores them in PostgreSQL via R2DBC, and exposes REST endpoints for querying events by entity, user, store, or time range. Primary ingestion is asynchronous via message queue; direct API submission is available for testing.

## Quirks
- Consumer uses scheduled polling (100ms default) instead of blocking reads
- Failed events are moved to dead-letter queue after retry exhaustion
- Query limits are capped at 1000 records to prevent performance issues
- Scheduled consumption requires `@EnableScheduling` on the application class
