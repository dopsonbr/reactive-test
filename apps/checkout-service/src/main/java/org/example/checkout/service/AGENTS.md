# service

## Boundaries

Files that require careful review before changes:
- `CheckoutService.java` - orchestration logic with multi-service coordination and rollback handling

## Conventions

- All methods return Mono or Flux
- Initiate phase: validate cart → calculate discounts → reserve fulfillment → create session
- Complete phase: validate session → process payment → persist order → clear session
- Payment failure triggers fulfillment cancellation via FulfillmentServiceClient
- Order ID pre-generated for idempotent payment retries
- Structured logging at each orchestration step

## Warnings

- In-memory checkout sessions not production-ready; migrate to Redis
- Session expiration is time-based; expired sessions fail on complete
- Payment rollback must cancel fulfillment reservation
- Multiple service failures may leave inconsistent state; implement compensation
- Do not bypass service layer for direct repository access
