# consumer

## Purpose
Consumes audit events from Redis Streams and persists them to PostgreSQL with automatic retry and dead letter queue handling.

## Behavior
AuditEventConsumer polls Redis Streams on a scheduled interval, processes events in batches, and persists them using the repository layer. Failed events after retries are routed to a dead letter queue via DeadLetterHandler. All successfully processed events are acknowledged to the consumer group.

## Quirks
- Consumer group is created automatically at startup; duplicate creation errors are ignored
- Retry logic only applies to transient database errors (timeouts, connection issues)
- Parse failures and non-retryable errors go directly to DLQ without retries
- Events are acknowledged even when sent to DLQ to prevent reprocessing
