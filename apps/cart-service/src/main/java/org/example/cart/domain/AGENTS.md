# cart.model

## Boundaries
Files that require careful review before changes: all (core domain model)

## Conventions
- All types are immutable Java records
- Cart updates use withX methods that return new instances with recalculated totals
- CartTotals.calculate is called automatically by Cart.withProducts/withDiscounts/withFulfillments
- Timestamps update on every modification

## Warnings
- Never mutate lists passed to Cart constructors or returned from getters
- Grand total calculation floors at zero to prevent negative totals
- Tax calculation is a stub
