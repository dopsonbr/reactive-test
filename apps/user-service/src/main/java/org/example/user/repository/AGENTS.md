# repository

## Boundaries
none

## Conventions
- All operations return Mono or Flux
- Repository interfaces define domain contracts
- Implementations handle entity-to-domain conversion
- Entity repositories extend ReactiveCrudRepository

## Warnings
- Never use blocking JDBC in repository implementations
- Entity conversions must preserve all domain invariants
