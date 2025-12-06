# controller

## Boundaries

Files that require careful review before changes:
- All controllers - endpoint contracts used by checkout-service

## Conventions

- All endpoints return Mono for reactive compatibility
- Request metadata headers required on all endpoints
- Controllers delegate to FulfillmentService

## Warnings

- Changing endpoint paths or response formats breaks checkout-service integration
- This is a stub service; all responses are hardcoded
