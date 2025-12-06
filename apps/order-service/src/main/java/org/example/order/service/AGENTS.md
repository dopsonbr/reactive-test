# Service

## Boundaries
Files that require careful review before changes: OrderService.java (status transition logic)

## Conventions
- All methods return Mono or Flux for reactive composition
- Throw ResponseStatusException with HttpStatus.NOT_FOUND for missing orders
- Throw ResponseStatusException with HttpStatus.BAD_REQUEST for invalid state transitions
- Use switchIfEmpty to handle not-found cases before flatMap operations
- OrderSearchCriteria uses builder pattern with sensible defaults

## Warnings
- Status transition validation is synchronous (throws immediately in flatMap)
- Cancellation rules are separate from general status transition rules
- Terminal states (CANCELLED, REFUNDED) have no valid outbound transitions
- OrderSearchCriteria builder mutates state; build() does not validate constraints
