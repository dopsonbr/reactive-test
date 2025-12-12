# validation

## Boundaries
Files that require careful review before changes: none

## Conventions
- All validation errors collected before throwing ValidationException
- Returns Mono with ValidationException for reactive compatibility
- Validation constants defined at class level for easy modification

## Warnings
- Changing store number or limit ranges affects API contract
- UUID pattern must match RFC 4122 specification
