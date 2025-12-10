# Service

## Boundaries
Files requiring careful review: CartService.java (orchestration logic affects product enrichment, validation, and total calculation)

## Conventions
- All operations return `Mono<Cart>` or `Mono<Void>`
- Product enrichment fetches live data from product service on add/update
- Customer operations validate against customer service before mutation
- Discount operations validate eligibility against discount service
- Fulfillment operations validate SKUs and product fulfillability
- All mutations recalculate cart totals (subtotal, tax, total)
- Audit events publish asynchronously and do not block operations

## Warnings
- Changing enrichment strategy affects performance and data freshness
- Total calculation logic must stay synchronized with product/discount/fulfillment changes
- Audit event failures are logged but do not fail cart operations
- Client call failures propagate to caller unless explicitly handled
