# Domain

## Purpose
Defines the persistent data model for audit events stored in PostgreSQL.

## Behavior
Maps platform AuditEvent objects to R2DBC entities for database storage and retrieval. AuditRecord handles JSON serialization of event data into a JSONB column, while TimeRange provides query boundary semantics for time-based searches.

## Quirks
- JSON data field stores arbitrary event payloads as JSONB; malformed JSON defaults to empty object
- TimeRange allows null start/end for unbounded queries (null = no boundary)
