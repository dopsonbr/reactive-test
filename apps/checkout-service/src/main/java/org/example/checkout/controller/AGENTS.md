# controller

## Boundaries

Files that require careful review before changes:
- `CheckoutController.java` - endpoint changes affect API contract with clients

## Conventions

- All endpoints return Mono or Flux
- Context establishment via contextWrite at end of reactive chain
- Request validation happens before service calls
- Four metadata headers required on all endpoints
- Structured logging uses deferContextual to access context

## Warnings

- Changing endpoint paths or header names breaks client contracts
- Checkout session ID from initiate must be preserved for complete call
- Complete endpoint may partially succeed; monitor for orphaned reservations
