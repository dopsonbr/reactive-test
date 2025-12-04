# cart.model

## Purpose
Defines the cart domain model and its immutable aggregate structure.

## Behavior
Provides immutable records for cart state and totals with copy-on-write semantics for updates. All cart modifications return new instances with recalculated totals.

## Quirks
- Grand total floors at zero even if discounts exceed subtotal
- Tax calculation is a placeholder returning zero
- Customer ID synchronizes automatically when customer is set
