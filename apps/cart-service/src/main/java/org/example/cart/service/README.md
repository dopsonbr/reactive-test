# Service

## Purpose
Orchestrates shopping cart operations including products, customers, discounts, and fulfillment options.

## Behavior
Manages the complete cart lifecycle through reactive operations: creating carts, adding/updating/removing products with enriched product data, associating customers with validation, applying discounts with eligibility checks, and configuring fulfillment options. All mutations publish audit events and recalculate cart totals (subtotal, tax, total) after each change.

## Quirks
- Product enrichment fetches live data on every add/update operation
- Cart totals are recalculated after every modification
- Audit events are published asynchronously and do not block cart operations
- Customer association validates against customer service before saving
- Discount application validates eligibility against discount service
- Fulfillment options validate SKUs exist in cart and products are valid for fulfillment type
