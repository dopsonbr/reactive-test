# GraphQL Validation

## Purpose
Validates GraphQL input types using the same rules as REST validation.

## Behavior
Collects all validation errors before returning (not fail-fast), providing consistent error reporting across GraphQL and REST endpoints.

## Quirks
- Returns `Mono<Void>` that errors with ValidationException containing all violations
- Validation rules must match REST validators exactly
