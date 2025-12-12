# org.example.price.service

## Boundaries
Files that require careful review before changes: none

## Conventions
- All methods return Mono or Flux
- Use switchIfEmpty for upsert patterns
- Set updatedAt timestamp on all writes

## Warnings
- Must use R2dbcEntityTemplate.insert() for new records, not repository.save()
