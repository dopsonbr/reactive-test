# Validation

## Purpose
Validates REST API request parameters for order service endpoints, ensuring data integrity before processing.

## Behavior
Returns `Mono<Void>` that completes empty on success or emits `ValidationException` with all accumulated errors. Validates UUIDs, store numbers (1-2000), customer IDs, order status enums, date ranges, and pagination parameters.

## Quirks
- Non-fail-fast: collects all validation errors before throwing
- Separate from GraphQL validation (which uses `GraphQLInputValidator`)
- Store number range enforced: 1-2000
- Pagination size capped at 100, page must be non-negative
- Status validation case-insensitive but normalizes to uppercase
