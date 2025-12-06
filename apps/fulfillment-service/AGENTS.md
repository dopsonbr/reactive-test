# Fulfillment Service Agent Guidelines

Stub fulfillment service providing hardcoded responses for checkout integration testing.

## Boundaries

Files that require careful review before changes:

| File | Reason |
|------|--------|
| `FulfillmentService.java` | Stub logic used by checkout-service integration |
| Controller files | Endpoint contracts used by checkout-service |

## Conventions

- All responses are deterministic stubs (no actual inventory tracking)
- Address validation always returns valid with standardized format
- Shipping costs: STANDARD=$5.99, EXPRESS=$12.99, PICKUP=$0.00
- Fulfillment plan IDs are generated UUIDs
- Reservation IDs are generated UUIDs
- All methods return Mono for reactive compatibility

## Warnings

- Do not add real inventory integration without coordination with checkout-service
- Shipping costs are hardcoded; changes affect checkout pricing tests
- This service is for integration testing only; production requires real fulfillment
- Reservation confirmations are not persisted; service restart loses all state
