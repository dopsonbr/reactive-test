# Repository

## Purpose
Provides reactive data access for audit events stored in PostgreSQL.

## Behavior
Exposes methods to save audit events and query them by entity, user, store, and time range. All queries return results sorted by creation time descending and support optional result limiting. The R2DBC implementation converts between domain AuditEvent objects and database AuditRecord entities using ObjectMapper for JSON serialization of metadata.

## Quirks
- Time range filters use greater-than-or-equals for start and less-than (exclusive) for end
- Event type filtering is optional (null means all types)
- Result limits are enforced at query level, not application level
