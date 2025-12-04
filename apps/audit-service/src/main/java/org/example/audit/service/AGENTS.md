# Service Layer

## Boundaries
Files that require careful review before changes: none

## Conventions
- All query methods return Mono or Flux
- Limit normalization: default 100, max 1000
- Time ranges default to unbounded if null
- All operations delegate to repository layer

## Warnings
- Changing limit constants affects API pagination behavior
- Service does not validate business rules beyond parameter normalization
