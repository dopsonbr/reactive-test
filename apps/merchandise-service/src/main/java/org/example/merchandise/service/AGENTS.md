# service

## Boundaries
Files requiring careful review: none

## Conventions
- All methods return Mono or Flux
- Use repository for queries, R2dbcEntityTemplate for updates
- Map entities to DTOs before returning from public methods

## Warnings
- R2dbcEntityTemplate required for UPDATE to trigger database timestamp logic
