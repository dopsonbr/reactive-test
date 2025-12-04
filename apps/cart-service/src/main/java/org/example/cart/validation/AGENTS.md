# Validation

## Boundaries
Files requiring careful review: CartRequestValidator.java (business rule changes affect API contracts)

## Conventions
- All validation methods return Mono<Void> for reactive error propagation
- Collect all validation errors before throwing ValidationException
- Validate path parameters, request body, and headers in single pass
- Use constants for business constraints (min/max ranges)

## Warnings
- Changing store number or SKU ranges affects client behavior
- Header validation failures return 400 Bad Request, not 401/403
- Quantity max (999) enforced to prevent inventory overflow
