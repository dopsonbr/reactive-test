# client

## Boundaries

Files that require careful review before changes:
- `PaymentGatewayClient.java` - external payment integration with sensitive data handling
- All client files - resilience configuration affects checkout reliability

## Conventions

- All clients use ReactiveResilience wrapper for circuit breaker, retry, timeout
- WebClient instances are configured via application.yml external service URLs
- Context propagation via headers for distributed tracing
- Error responses mapped to domain exceptions

## Warnings

- PaymentGatewayClient handles sensitive payment tokens; never log card details
- FulfillmentServiceClient must support reservation cancellation for payment failure rollback
- Circuit breaker state affects all requests; monitor via /actuator/circuitbreakers
- Timeout configuration must account for payment gateway latency
