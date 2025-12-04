# controller

## Boundaries
Files that require careful review before changes: AuditController.java (public API contract)

## Conventions
- All endpoints return Mono or Flux for reactive processing
- Time range filtering uses Instant type for startTime/endTime
- Default limit is 100 events on all query endpoints
- POST endpoint returns 201 Created status
- Missing events return 404 via NotFoundException

## Warnings
- Changing endpoint paths or parameter names breaks API contracts
- POST /audit/events is for testing/convenience only; primary ingestion is message queue
- Store queries fail without required entityType query parameter
