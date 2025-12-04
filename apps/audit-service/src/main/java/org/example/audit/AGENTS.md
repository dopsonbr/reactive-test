# org.example.audit

## Boundaries
Files requiring careful review before changes:
- `consumer/AuditEventConsumer.java` - Redis Streams consumer group management and acknowledgment logic
- `repository/R2dbcAuditRepository.java` - Custom R2DBC queries with manual parameter binding

## Conventions
- All reactive operations return `Mono<T>` or `Flux<T>`
- Consumer uses `@Scheduled` polling instead of blocking reads
- Retry logic only applies to transient database errors
- Failed events must be acknowledged after dead-letter handling

## Warnings
- Consumer group initialization happens asynchronously at startup; stream may not exist yet
- TimeRange parameters are nullable; service layer normalizes to unbounded if null
- Query limit defaults to 100, maximum enforced at 1000
- Data field in AuditRecord is stored as JSONB string, not native JSON type
