# Checkout Service Agent Guidelines

Multi-service checkout orchestrator with two-phase commit pattern for cart validation, fulfillment reservation, and payment processing.

## Boundaries

Files that require careful review before changes:

| File | Reason |
|------|--------|
| `CheckoutService.java` | Orchestration logic with multi-service coordination and rollback handling |
| `CheckoutRequestValidator.java` | Business constraints for checkout operations |
| `PostgresOrderRepository.java` | R2DBC JSON serialization for nested order data |
| `SecurityConfig.java` | OAuth2 scopes for checkout operations |
| `PaymentGatewayClient.java` | External payment integration with sensitive data |

## Conventions

- All service methods return Mono or Flux (reactive streams)
- Controllers propagate RequestMetadata via Reactor Context using ContextKeys
- External clients wrap calls with ReactiveResilience (circuit breaker, retry, timeout)
- Validation collects all errors before throwing ValidationException
- JSON serialization for nested collections uses R2DBC converters with ObjectMapper
- Two-phase checkout: initiate creates session, complete processes payment
- Payment failures trigger automatic fulfillment reservation rollback

## Warnings

- Do not bypass CheckoutRequestValidator; it enforces store number (1-2000), UUID formats, and fulfillment-specific constraints
- Checkout sessions are currently in-memory; production requires Redis or database persistence
- OrderEntity uses JSONB columns; schema changes require migration coordination
- Security scopes are checkout:read and checkout:write; do not add method-level auth without updating SecurityConfig
- Failed payment automatically cancels fulfillment reservation; ensure idempotency on retry
- PaymentGatewayClient handles sensitive data; do not log payment tokens or card details
