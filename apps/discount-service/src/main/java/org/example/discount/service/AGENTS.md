# service

## Boundaries

Files that require careful review before changes:
- `PricingService.java` - complex discount stacking affects all pricing
- `MarkdownService.java` - authorization logic and session expiry

## Conventions

- All service methods return Mono or Flux
- DiscountService validates codes against store context
- MarkdownService enforces EMPLOYEE + ADMIN permission
- Markdowns expire 4 hours after appliedAt
- PricingService applies loyalty first, then discounts, then markdowns
- Stackable discounts sum; non-stackable uses best single discount

## Warnings

- PricingService.calculateBestPrice is complex with multiple reactive operations
- Changing discount stacking logic affects customer pricing across all carts
- MarkdownService depends on external UserRepository
- PricingService depends on external CustomerRepository
