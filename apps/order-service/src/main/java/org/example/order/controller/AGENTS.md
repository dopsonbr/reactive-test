# controller

## Boundaries
Files that require careful review before changes: OrderController.java (public API contract)

## Conventions
- All endpoints return Mono/Flux (reactive types)
- All endpoints require OAuth2 scope `order:read`
- All inputs validated via OrderRequestValidator before service calls
- Base path is `/orders`
- Validation errors throw ValidationException (handled by GlobalErrorHandler)

## Warnings
- Search endpoint has conditional logic with different pagination behavior based on filter combinations
- Customer and store+status searches bypass pagination parameters
- Empty search (no filters) intentionally returns empty results, not all orders
