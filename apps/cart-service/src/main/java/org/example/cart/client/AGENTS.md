# Client

## Boundaries
Files that require careful review before changes: ProductServiceClient.java (must propagate all context headers correctly)

## Conventions
- All clients are Spring components with constructor-based dependency injection
- ReactiveResilience decorator wraps all external HTTP calls
- Resilience names match service names (customer, discount, fulfillment, product)
- Base URLs injected via @Value with localhost defaults for local development

## Warnings
- ProductServiceClient requires x-store-number, x-order-number, x-userid, x-sessionid headers
- Changing client response types may break upstream service contracts
