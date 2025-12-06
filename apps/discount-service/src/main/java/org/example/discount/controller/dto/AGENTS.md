# controller.dto

## Boundaries

Files that require careful review before changes:
- All DTOs - changes affect API contracts

## Conventions

- All DTOs are immutable records
- Validation happens in DiscountRequestValidator, not in DTOs
- ShippingOption enum matches fulfillment-service contract
- CartItem must match cart-service CartProduct structure

## Warnings

- PricingRequest is complex with multiple optional fields
- Changing DTO structure is a breaking API change
