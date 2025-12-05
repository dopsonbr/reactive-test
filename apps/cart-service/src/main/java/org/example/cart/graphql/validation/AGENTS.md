# GraphQL Validation

## Boundaries
Files requiring careful review: GraphQLInputValidator.java (must stay synchronized with REST validation)

## Conventions
- Validation rules must match CartRequestValidator exactly
- Errors collected in List before throwing ValidationException
- All methods return Mono<Void> that errors on validation failure

## Warnings
- Keep validation constants synchronized with REST validator
- Do not fail-fast; collect all errors before returning
