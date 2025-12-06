# model

## Boundaries

Files that require careful review before changes:
- `Order.java` - core domain model affects all checkout operations
- `OrderStatus.java` - state machine affects order lifecycle
- `PaymentStatus.java` - payment states affect reconciliation

## Conventions

- All models are Java records (immutable)
- Order is the aggregate root containing nested collections
- CustomerSnapshot is point-in-time copy, not live reference
- FulfillmentDetails tracks reservation for rollback capability
- Enums define closed set of valid states

## Warnings

- Changing Order structure requires database migration
- OrderStatus transitions must be validated in service layer
- PaymentStatus affects financial reconciliation; add states carefully
- CustomerSnapshot fields must match customer-service response
