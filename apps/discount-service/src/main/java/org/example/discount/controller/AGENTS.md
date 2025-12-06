# controller

## Boundaries

Files that require careful review before changes:
- All controllers - endpoint changes affect API contracts

## Conventions

- All endpoints return Mono or Flux
- Validation errors return 400 with error details
- Invalid discount codes return 404
- Unauthorized markdown operations return 403
- Controllers delegate to service layer

## Warnings

- Changing endpoint paths or request formats breaks client contracts
- MarkdownController requires x-userid header for authorization lookup
- PricingController response includes breakdown of all discount sources
