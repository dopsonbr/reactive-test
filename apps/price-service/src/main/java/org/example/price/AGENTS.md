# org.example.price

## Boundaries
Files that require careful review before changes: none

## Conventions
- All database operations return Mono or Flux for reactive streaming
- SKU is Long type matching merchandise-service
- Currency defaults to USD when not specified

## Warnings
- Do not use repository.save() for entities with non-null IDs; use R2dbcEntityTemplate.insert() for new records
