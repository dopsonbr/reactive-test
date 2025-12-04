# consumer

## Boundaries
Files requiring review before changes: AuditEventConsumer.java (retry logic and acknowledgment order)

## Conventions
- Events must be acknowledged after processing, even on DLQ routing
- Retry applies only to transient database errors (isRetryable filter)
- Consumer group and stream creation handle BUSYGROUP and missing stream errors
- DLQ stream key is hardcoded to "audit-events-dlq"

## Warnings
- Changing acknowledgment timing can cause duplicate processing or message loss
- Poll interval and batch size are interdependent; low intervals with high batch sizes increase Redis load
- Consumer group must exist before reading; initialization errors are logged but not fatal
