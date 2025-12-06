# client

## Purpose

WebClient-based clients for external service integration with Resilience4j patterns.

## Behavior

Provides reactive HTTP clients for cart-service, discount-service, fulfillment-service, and payment-gateway. Each client wraps calls with circuit breaker, retry, and timeout patterns using ReactiveResilience.

## Quirks

- PaymentGatewayClient connects to external payment provider, not internal service
- FulfillmentServiceClient handles reservation creation and cancellation for rollback scenarios
