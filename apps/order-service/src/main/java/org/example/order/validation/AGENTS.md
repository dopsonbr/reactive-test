# Validation

## Boundaries
Files requiring careful review: `OrderRequestValidator.java` (changes affect all REST endpoints)

## Conventions
- All validation methods return `Mono<Void>` (empty on success, error on failure)
- Non-fail-fast: accumulate errors in `List<ValidationError>` before creating `ValidationException`
- Store numbers: 1-2000 inclusive
- Pagination: size 1-100, page >= 0
- Status validation normalizes to uppercase before enum check

## Warnings
- Do not use for GraphQL validation (separate validator exists)
- Changing validation rules affects REST API contract
- UUID validation uses regex pattern, not `UUID.fromString()` for error detail control
