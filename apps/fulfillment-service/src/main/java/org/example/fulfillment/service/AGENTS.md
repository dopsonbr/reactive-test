# service

## Boundaries

Files that require careful review before changes:
- `FulfillmentService.java` - stub logic used by checkout-service integration tests

## Conventions

- All methods return Mono for reactive compatibility
- Address validation always returns valid=true with standardized address
- Shipping costs: STANDARD=$5.99, EXPRESS=$12.99, PICKUP=$0.00
- Plan and reservation IDs are generated UUIDs
- Warehouse assignment defaults to "WAREHOUSE-001"

## Warnings

- This is a stub service; no actual inventory tracking
- Changing hardcoded values affects checkout integration tests
- Reservations are not persisted; restart loses all state
- Production fulfillment requires real inventory integration
