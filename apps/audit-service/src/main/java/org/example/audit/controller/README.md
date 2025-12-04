# controller

## Purpose
Exposes REST API endpoints for querying and creating audit events.

## Behavior
Provides reactive HTTP endpoints to retrieve audit events by ID, entity, user, or store, and to manually create audit events. All endpoints return reactive types (Mono/Flux) and delegate business logic to AuditService. Primary audit event ingestion occurs via message queue; the POST endpoint exists for testing and convenience.

## Quirks
- POST /audit/events is not the primary ingestion path; message queue is preferred.
- All query endpoints support optional time range filtering via startTime/endTime query parameters.
- Default result limit is 100 events unless overridden.
- Store queries require entityType as a mandatory query parameter.
