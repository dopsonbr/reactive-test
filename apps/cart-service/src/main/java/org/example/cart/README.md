# Cart Service

## Purpose
Manages shopping cart lifecycle and aggregates product, customer, discount, and fulfillment data for retail checkout workflows.

## Behavior
Provides REST endpoints to create carts, add/update/remove products, associate customers, apply discounts, and manage fulfillment options. Persists cart state to PostgreSQL and calls external services to enrich cart data with real-time pricing, customer details, and discount calculations. Returns calculated totals (subtotal, discounts, fulfillment, tax, grand total) with each response.

## Quirks
- Anonymous carts (no customer) are supported; customer association is optional
- All mutations recalculate totals automatically
- Audit events are published for state changes but use no-op implementation by default
- Security requires OAuth2 JWT with `cart:read` or `cart:write` scopes
- Controllers are split by responsibility: lifecycle, products, customer, discounts, fulfillment
