# validation

## Purpose
Validates audit service API requests to ensure data integrity and business rule compliance.

## Behavior
Collects all validation errors in a single pass and returns them together, allowing clients to fix multiple issues in one iteration rather than discovering errors one at a time.

## Quirks
- Store numbers must be between 1-2000
- Query limits are capped at 1000 records
- UUID validation follows strict RFC 4122 format
