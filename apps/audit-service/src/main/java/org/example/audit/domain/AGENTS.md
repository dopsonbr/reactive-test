# Domain

## Boundaries
Files that require careful review before changes: AuditRecord.java (schema changes affect migration scripts)

## Conventions
- AuditRecord uses R2DBC annotations (@Table, @Column) matching audit_events schema
- TimeRange allows null for unbounded queries; use factory methods for clarity
- JSON serialization errors default to empty object/map, never throw

## Warnings
- Changing column mappings in AuditRecord requires coordinated database migration
- Data field stores JSONB; PostgreSQL column type must match for indexing/querying
