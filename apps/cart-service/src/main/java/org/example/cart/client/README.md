# Client

## Purpose
Provides reactive HTTP clients for external service integrations required by the cart service.

## Behavior
Each client wraps WebClient with ReactiveResilience decorators to make resilient calls to external services including product-service, customer-service, discount-service, and fulfillment-service. Clients propagate request context headers and handle service-specific response transformations.

## Quirks
- All clients use ReactiveResilience with service-specific resilience names
- Product client requires full request metadata headers for context propagation
- Base URLs are configurable via application properties with localhost defaults
