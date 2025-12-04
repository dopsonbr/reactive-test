# Repository

## Boundaries
Files that require careful review before changes: all (database queries impact performance and correctness)

## Conventions
- All methods return Mono or Flux for reactive queries
- Queries sort by created_at DESC unless otherwise specified
- Criteria building uses Spring Data's Criteria API, not raw SQL
- AuditRecord conversion uses ObjectMapper for JSON metadata fields
- Event type filtering accepts null to indicate "all types"

## Warnings
- Time range end is exclusive (less-than, not less-than-or-equals)
- Changing column names requires schema migration and AuditRecord updates
- Query limits are mandatory to prevent unbounded result sets
